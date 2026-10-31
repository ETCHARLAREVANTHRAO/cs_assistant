import io
import os
import re
import httpx
from datetime import datetime
from pathlib import Path
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, AIMessage

# Clean invalid/inaccessible SSLKEYLOGFILE if present to avoid SSL context crashes
if "SSLKEYLOGFILE" in os.environ:
    try:
        with open(os.environ["SSLKEYLOGFILE"], "a"):
            pass
    except Exception:
        os.environ.pop("SSLKEYLOGFILE", None)

LOG_FILE = Path("./logs.txt")

def _log(entry: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {entry}\n"
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

from .vectorstore import GLOBAL_KNOWLEDGE_USER_ID, add_documents, delete_by_source, search_document_matches
from . import firestore_service
from .tools import get_all_tools

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "").lower()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
_http_client = httpx.Client(verify=False)
_async_http_client = httpx.AsyncClient(verify=False)

SYSTEM_PROMPT = """You are a helpful personal AI assistant.

Document context from the user's uploaded files may be provided below. Follow these rules:
1. If the question is about the user's documents, resume, notes, or files - answer using the document context provided.
2. If the question is about the current date or time - call get_datetime.
3. If the question is about weather - call get_weather.
4. If the question is about news, sports, or facts not in the documents - call internet_search.
5. If the question is about calendar events - call add_calendar_event or get_calendar_events.
6. Only call one tool at a time. Never call a tool if the document context already answers the question.

Be concise, accurate, and friendly."""


_conversation_history: dict = {}  # user_id -> list of messages
MAX_HISTORY_TURNS = 10


def _get_llm():
    provider = (os.getenv("LLM_PROVIDER") or LLM_PROVIDER or "").lower()
    openrouter_key = os.getenv("OPENROUTER_API_KEY") or OPENROUTER_API_KEY
    openrouter_model = os.getenv("OPENROUTER_MODEL") or OPENROUTER_MODEL or "nvidia/nemotron-3-ultra-550b-a55b:free"
    groq_key = os.getenv("GROQ_API_KEY") or GROQ_API_KEY
    groq_model = os.getenv("GROQ_MODEL") or GROQ_MODEL or "openai/gpt-oss-120b"

    if not provider:
        if openrouter_key:
            provider = "openrouter"
        elif groq_key:
            provider = "groq"
        else:
            provider = "openrouter"

    if provider == "openrouter":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=openrouter_model,
            openai_api_key=openrouter_key,
            openai_api_base="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://localhost",
                "X-Title": "My Assistant",
            },
            max_tokens=1024,
            temperature=0.2,
            http_client=_http_client,
            http_async_client=_async_http_client,
        )

    from langchain_groq import ChatGroq
    return ChatGroq(
        model=groq_model,
        api_key=groq_key,
        max_tokens=1024,
        http_client=_http_client,
        http_async_client=_async_http_client,
    )




def _extract_text(content_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, image, or text file."""
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content_bytes))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        if text.strip():
            return text

        # No embedded text layer (scanned/image-only pages) - OCR each rendered page.
        try:
            import pypdfium2 as pdfium
            import pytesseract
            pdf = pdfium.PdfDocument(content_bytes)
            try:
                pages_text = []
                for page in pdf:
                    bitmap = page.render(scale=2.0)
                    pages_text.append(pytesseract.image_to_string(bitmap.to_pil()))
                    page.close()
                return "\n\n".join(pages_text)
            finally:
                pdf.close()
        except Exception as e:
            return f"[PDF OCR failed: {e}]"

    if ext == "docx":
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(content_bytes))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())

    if ext in ("jpg", "jpeg", "png", "bmp", "tiff", "webp"):
        try:
            import pytesseract
            from PIL import Image
            image = Image.open(io.BytesIO(content_bytes))
            return pytesseract.image_to_string(image)
        except Exception as e:
            return f"[Image OCR failed: {e}]"

    # Default: plain text / markdown
    return content_bytes.decode("utf-8", errors="ignore")


def ingest_document(content_bytes: bytes, filename: str, user_id: str = "") -> tuple[int, str]:
    """Parse any supported file type, chunk it, store in FAISS. Returns (chunk_count, extracted_text)."""
    text = _extract_text(content_bytes, filename)
    if not text.strip():
        raise ValueError("No text could be extracted from the file.")

    ext = filename.rsplit(".", 1)[-1].lower()
    char_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)

    if ext == "md":
        header_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=[("#", "h1"), ("##", "h2"), ("###", "h3")],
            strip_headers=False,
        )
        docs = char_splitter.split_documents(header_splitter.split_text(text))
    else:
        docs = char_splitter.create_documents([text])

    for doc in docs:
        doc.metadata["source"] = filename
    add_documents(docs, user_id)
    return len(docs), text


def delete_document(filename: str, user_id: str = ""):
    delete_by_source(filename, user_id)


def _source_label(source_kind: str) -> str:
    return "GATE Library" if source_kind == "server" else "My Docs"


def _format_doc_context(matches: list[dict]) -> str:
    return "\n\n---\n\n".join(
        f"[{_source_label(str(m.get('source_kind') or 'local'))}: {m.get('source', 'unknown')}]\n{m.get('content', '')}"
        for m in matches
    )


def _source_names(matches: list[dict]) -> list[str]:
    sources: list[str] = []
    for match in matches:
        source = str(match.get("source") or "unknown")
        source_kind = str(match.get("source_kind") or "local")
        label = f"{_source_label(source_kind)}: {source}"
        if label not in sources:
            sources.append(label)
    return sources


def _normalize_filename_text(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.lower()))


def _filename_matches_query(filename: str, query: str) -> bool:
    normalized_query = _normalize_filename_text(query)
    normalized_name = _normalize_filename_text(filename)
    stem = filename.rsplit(".", 1)[0]
    normalized_stem = _normalize_filename_text(stem)
    if not normalized_query or not normalized_name:
        return False
    if normalized_name in normalized_query or normalized_stem in normalized_query:
        return True
    stem_words = [word for word in normalized_stem.split() if len(word) > 2]
    return bool(stem_words) and all(word in normalized_query for word in stem_words)


def _named_document_matches(query: str, user_id: str, source_kind: str) -> list[dict]:
    try:
        filenames = firestore_service.list_documents(user_id)
    except Exception as exc:
        _log(f"Firestore document list failed for user={user_id[:8]}: {exc}")
        return []

    if len(filenames) == 1 and any(word in query.lower() for word in ("document", "file", "notes", "uploaded")):
        matched_filenames = filenames
    else:
        matched_filenames = [name for name in filenames if _filename_matches_query(name, query)]

    matches: list[dict] = []
    for filename in matched_filenames[:3]:
        try:
            doc = firestore_service.get_document(user_id, filename)
        except Exception as exc:
            _log(f"Firestore document fetch failed for {filename}: {exc}")
            continue
        text = (doc or {}).get("text", "")
        if text.strip():
            matches.append({"source": filename, "content": text[:12000], "similarity": 1.0, "source_kind": source_kind})
    if matches:
        _log(f"RAG: {len(matches)} named document(s) matched for user={user_id[:8]} source={source_kind}")
    return matches


def _merge_matches(primary: list[dict], secondary: list[dict]) -> list[dict]:
    merged = list(primary)
    seen = {(m.get("source_kind"), m.get("source"), m.get("content")) for m in merged}
    for match in secondary:
        key = (match.get("source_kind"), match.get("source"), match.get("content"))
        if key not in seen:
            merged.append(match)
            seen.add(key)
    return merged


def _search_docs_sync(query: str, user_id: str = "", knowledge_mode: str = "hybrid") -> tuple[str, list[str]]:
    mode = knowledge_mode if knowledge_mode in {"server", "local", "hybrid"} else "hybrid"
    named_matches: list[dict] = []

    if mode in {"local", "hybrid"}:
        named_matches = _merge_matches(
            named_matches,
            _named_document_matches(query, user_id, "local"),
        )
    if mode in {"server", "hybrid"}:
        named_matches = _merge_matches(
            named_matches,
            _named_document_matches(query, GLOBAL_KNOWLEDGE_USER_ID, "server"),
        )

    semantic_matches = search_document_matches(query, user_id=user_id, knowledge_mode=mode)
    matches = _merge_matches(named_matches, semantic_matches)
    return _format_doc_context(matches), _source_names(matches)


async def chat(message: str, user_id: str = "anonymous", knowledge_mode: str = "hybrid") -> dict:
    """RAG + tool-calling chat with per-user conversation history."""
    global _conversation_history
    mode = knowledge_mode if knowledge_mode in {"server", "local", "hybrid"} else "hybrid"
    _log(f"USER [{user_id[:8]}] mode={mode}: {message}")

    if user_id not in _conversation_history:
        _conversation_history[user_id] = []
    history = _conversation_history[user_id]

    doc_context, sources = _search_docs_sync(message, user_id=user_id, knowledge_mode=mode)
    _log(f"CONTEXT: {len(doc_context)} chars retrieved for user={user_id[:8]} mode={mode}")

    from .tools import get_weather, get_datetime, add_calendar_event, get_calendar_events, internet_search
    if mode == "local":
        action_tools = [get_datetime]
    else:
        action_tools = [get_weather, get_datetime, add_calendar_event, get_calendar_events, internet_search]
    tools_by_name = {t.name: t for t in action_tools}
    llm_with_tools = _get_llm().bind_tools(action_tools)
    llm_plain = _get_llm()

    mode_instructions = {
        "server": "Knowledge mode: GATE Library. Use only the shared server-side study library as document context. If it is insufficient, say what is missing.",
        "local": "Knowledge mode: My Docs. Use only the student-provided documents available on this device/account. Do not use internet search or server-library context. If the local documents are insufficient, say what is missing.",
        "hybrid": "Knowledge mode: Best Answer. Use both the shared GATE Library and the student-provided documents when available, and prefer the most relevant cited context.",
    }[mode]
    system_with_context = f"{SYSTEM_PROMPT}\n\n{mode_instructions}"
    if doc_context:
        system_with_context += f"\n\n--- Relevant retrieved study context ---\n{doc_context}\n---"

    messages = (
        [SystemMessage(content=system_with_context)]
        + history[-MAX_HISTORY_TURNS:]
        + [HumanMessage(content=message)]
    )

    reply = None
    total_tokens = 0
    try:
        for _ in range(5):
            response = await llm_with_tools.ainvoke(messages)
            messages.append(response)
            usage = getattr(response, "usage_metadata", None) or {}
            total_tokens += usage.get("total_tokens", 0)

            if not response.tool_calls:
                reply = response.content or "Sorry, I could not generate a response."
                break

            for tc in response.tool_calls:
                _log(f"TOOL CALL: {tc['name']}({tc['args']})")
                tool = tools_by_name.get(tc["name"])
                if tool:
                    try:
                        result = await tool.ainvoke(tc["args"])
                    except Exception as e:
                        result = f"Tool error: {e}"
                else:
                    result = f"Unknown tool: {tc['name']}"
                _log(f"TOOL RESULT: {str(result)[:300]}")
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))

    except Exception as e:
        _log(f"ERROR: {e}")
        fallback = await llm_plain.ainvoke([
            SystemMessage(content="You are a helpful assistant. Answer directly and concisely. Do not call any tools."),
            HumanMessage(content=f"{system_with_context}\n\nUser question: {message}")
        ])
        usage = getattr(fallback, "usage_metadata", None) or {}
        total_tokens += usage.get("total_tokens", 0)
        reply = fallback.content or "Sorry, I could not generate a response."

    if not reply:
        reply = "Sorry, I could not complete the request."

    _log(f"REPLY: {reply[:300]}")
    _log("-" * 60)

    history.append(HumanMessage(content=message))
    history.append(AIMessage(content=reply))
    if len(history) > MAX_HISTORY_TURNS:
        _conversation_history[user_id] = history[-MAX_HISTORY_TURNS:]

    return {"reply": reply, "sources": sources, "tokens_used": total_tokens, "knowledge_mode": mode}


async def explain_pyq_question(question: dict) -> dict:
    """Explain a GATE PYQ answer via the LLM - single-turn, no RAG context, no tools."""
    options_text = ""
    if question.get("options"):
        options_text = "\n".join(f"{k}. {v}" for k, v in question["options"].items())

    given = question.get("given_answer")
    given_text = str(given) if given not in (None, "") else "Not attempted"

    prompt = f"""You are a GATE Computer Science tutor. Explain this question clearly and concisely for exam prep.

Question ({question.get('question_type')}{f", topic: {question['topic']}" if question.get('topic') else ""}):
{question['question']}

{options_text}

Correct answer: {question['correct_answer']}
Student's answer: {given_text}

Explain:
1. Why the correct answer is right - show the reasoning/working, not just the final answer.
2. If the student's answer is wrong, specifically why that option is incorrect.
Keep it focused and exam-oriented - no generic preamble."""

    if question.get("explanation"):
        prompt += f"\n\nExisting solution notes to build on:\n{question['explanation']}"

    response = await _get_llm().ainvoke([
        SystemMessage(content="You are a precise, exam-focused GATE CS tutor. Be concise and use step-by-step reasoning."),
        HumanMessage(content=prompt),
    ])
    usage = getattr(response, "usage_metadata", None) or {}
    text = response.content or "Sorry, I could not generate an explanation."
    return {"explanation": text, "tokens_used": usage.get("total_tokens", 0)}


def clear_history():
    global _conversation_history
    _conversation_history = []


async def solve_doubt(message: str, extracted_text: str = "", subject: str = "", topic: str = "") -> dict:
    """Single-turn GATE CS doubt solver with optional OCR text from an uploaded image/file."""
    context_bits = []
    if subject:
        context_bits.append(f"Subject: {subject}")
    if topic:
        context_bits.append(f"Topic: {topic}")
    if extracted_text.strip():
        context_bits.append(f"Text extracted from upload:\n{extracted_text.strip()[:6000]}")
    if message.strip():
        context_bits.append(f"Student doubt:\n{message.strip()}")

    prompt = "\n\n".join(context_bits) or "The student uploaded a doubt, but no readable text was provided."
    response = await _get_llm().ainvoke([
        SystemMessage(content=(
            "You are a precise GATE Computer Science doubt-solving tutor. "
            "Answer in a structured way with: Concept, Step-by-step solution, Common mistake, "
            "Related topics, and Next practice suggestion. If OCR text is noisy, infer carefully and say what is unclear."
        )),
        HumanMessage(content=prompt),
    ])
    usage = getattr(response, "usage_metadata", None) or {}
    return {
        "answer": response.content or "Sorry, I could not solve this doubt.",
        "extracted_text": extracted_text,
        "tokens_used": usage.get("total_tokens", 0),
    }
