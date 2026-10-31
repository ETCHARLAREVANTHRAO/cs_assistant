import time
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, Response

from app.core import firestore_service, learning_data, pyq_data, config
from app.core.simple_pdf import text_to_pdf_bytes
from app.core.auth import verify_token
from app.models import (
    CodeExecutionRequest,
    CodeExecutionResponse,
    LearningProgressItem,
    LearningProgressResponse,
    LearningProgressUpdate,
    LearningSubjectDetail,
    LearningSubjectSummary,
)

router = APIRouter(prefix="/learning", tags=["learning"])


def _learning_overrides() -> dict:
    try:
        return firestore_service.get_admin_content().get("learning_overrides") or {}
    except Exception:
        return {}


def _all_subjects() -> list[dict]:
    subjects = learning_data.apply_learning_overrides(learning_data.all_subjects_detail(), _learning_overrides())
    return _attach_pyq_matches(subjects)


def _norm(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def _attach_pyq_matches(subjects: list[dict]) -> list[dict]:
    try:
        taxonomy = pyq_data.practice_taxonomy()
    except Exception:
        taxonomy = {"topics": [], "chapters": []}
    taxonomy_topics = taxonomy.get("topics") or []
    taxonomy_chapters = taxonomy.get("chapters") or []

    for subject in subjects:
        pyq_subject = subject.get("pyq_subject") or subject["name"]
        subject_topics = [item for item in taxonomy_topics if item.get("subject") == pyq_subject]
        subject_chapters = [item for item in taxonomy_chapters if item.get("subject") == pyq_subject]
        for topic in subject["topics"]:
            topic_norm = _norm(topic["title"])
            concept_norms = [_norm(value) for value in topic.get("concepts", [])[:6]]
            matches = [
                item
                for item in subject_topics
                if topic_norm in _norm(item.get("name", "")) or any(concept and concept in _norm(item.get("name", "")) for concept in concept_norms)
            ][:6]
            if not matches:
                matches = [
                    {
                        "subject": item.get("subject", pyq_subject),
                        "chapter": item.get("name", ""),
                        "name": item.get("name", ""),
                        "question_count": item.get("question_count", 0),
                    }
                    for item in subject_chapters
                    if topic_norm in _norm(item.get("name", "")) or any(concept and concept in _norm(item.get("name", "")) for concept in concept_norms)
                ][:4]
            topic["pyq_matches"] = matches
            topic["pyq_match_count"] = sum(int(item.get("question_count") or 0) for item in matches)
    return subjects


def _get_subject(slug: str) -> dict | None:
    for subject in _all_subjects():
        if subject["slug"] == slug:
            return subject
    return None


def _subject_cheat_sheet(subject: dict) -> str:
    lines = [
        f"# {subject['name']} Cheat Sheet",
        "",
        subject["description"],
        "",
        "## Roadmap",
        *[f"- {item}" for item in subject["roadmap"]],
        "",
        "## Exam Strategy",
        *[f"- {item}" for item in subject["exam_strategy"]],
        "",
    ]
    for topic in subject["topics"]:
        lines.extend(
            [
                f"## {topic['title']}",
                f"Difficulty: {topic['difficulty']}",
                f"Estimated study time: {topic['estimated_study_minutes']} minutes",
                "",
                "Concepts:",
                *[f"- {item}" for item in topic["concepts"]],
                "",
                "Formula Sheet:",
                *[f"- {item}" for item in topic["formula_sheet"]],
                "",
                "PYQ Concepts:",
                *[f"- {item}" for item in topic["pyq_concepts"]],
                "",
                "Memory Hooks:",
                *[f"- {item}" for item in topic["memory_hooks"]],
                "",
            ]
        )
    return "\n".join(lines)


@router.get("/subjects", response_model=list[LearningSubjectSummary])
async def list_learning_subjects(_user_id: str = Depends(verify_token)):
    return [
        {
            "slug": subject["slug"],
            "name": subject["name"],
            "exam_weight": subject["exam_weight"],
            "description": subject["description"],
            "topic_count": len(subject["topics"]),
        }
        for subject in _all_subjects()
    ]


@router.get("/subjects/{subject_slug}", response_model=LearningSubjectDetail)
async def get_learning_subject(subject_slug: str, _user_id: str = Depends(verify_token)):
    subject = _get_subject(subject_slug)
    if subject is None:
        raise HTTPException(status_code=404, detail=f"Unknown learning subject '{subject_slug}'.")
    return subject


@router.get("/syllabus", response_model=list[LearningSubjectDetail])
async def get_learning_syllabus(_user_id: str = Depends(verify_token)):
    return _all_subjects()


@router.get("/progress", response_model=LearningProgressResponse)
async def get_learning_progress(user_id: str = Depends(verify_token)):
    return LearningProgressResponse(items=firestore_service.list_learning_progress(user_id))


@router.put("/progress/{topic_key}", response_model=LearningProgressItem)
async def update_learning_progress(topic_key: str, body: LearningProgressUpdate, user_id: str = Depends(verify_token)):
    allowed = {"not-started", "learning", "revised", "mastered"}
    updates = body.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] not in allowed:
        raise HTTPException(status_code=400, detail="Invalid learning status.")
    return LearningProgressItem(**firestore_service.set_learning_progress(user_id, topic_key, updates))


@router.get("/cheat-sheet", response_class=PlainTextResponse)
async def download_all_learning_cheat_sheets(_user_id: str = Depends(verify_token)):
    return "\n\n---\n\n".join(_subject_cheat_sheet(subject) for subject in _all_subjects())


@router.get("/cheat-sheet.pdf")
async def download_all_learning_cheat_sheets_pdf(_user_id: str = Depends(verify_token)):
    text = "\n\n---\n\n".join(_subject_cheat_sheet(subject) for subject in _all_subjects())
    return Response(
        content=text_to_pdf_bytes("Complete CS Learning Bank", text),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=complete-cs-learning-bank.pdf"},
    )


@router.get("/subjects/{subject_slug}/cheat-sheet", response_class=PlainTextResponse)
async def download_learning_cheat_sheet(subject_slug: str, _user_id: str = Depends(verify_token)):
    subject = _get_subject(subject_slug)
    if subject is None:
        raise HTTPException(status_code=404, detail=f"Unknown learning subject '{subject_slug}'.")
    return _subject_cheat_sheet(subject)


@router.get("/subjects/{subject_slug}/cheat-sheet.pdf")
async def download_learning_cheat_sheet_pdf(subject_slug: str, _user_id: str = Depends(verify_token)):
    subject = _get_subject(subject_slug)
    if subject is None:
        raise HTTPException(status_code=404, detail=f"Unknown learning subject '{subject_slug}'.")
    return Response(
        content=text_to_pdf_bytes(f"{subject['name']} Cheat Sheet", _subject_cheat_sheet(subject)),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={subject_slug}-cheat-sheet.pdf"},
    )


@router.post("/execute-code", response_model=CodeExecutionResponse)
async def execute_code_snippet(body: CodeExecutionRequest, _user_id: str = Depends(verify_token)):
    """Execute a C, C++, or Python snippet using Wandbox or Judge0 for live verification."""
    client_kwargs = {"timeout": 12.0, "verify": False, "follow_redirects": True}
    lang = body.language.lower().strip()
    t0 = time.time()

    try:
        with httpx.Client(**client_kwargs) as client:
            if lang in ["c", "cpp", "c++"]:
                compiler = "gcc-head"
                resp = client.post(config.WANDBOX_API_URL, json={"code": body.code, "compiler": compiler})
                elapsed = int((time.time() - t0) * 1000)
                if resp.status_code == 200:
                    data = resp.json()
                    out = data.get("program_output") or data.get("compiler_error") or "Program finished with no output."
                    success = bool(data.get("program_output")) and not bool(data.get("compiler_error"))
                    return CodeExecutionResponse(output=out, language=lang, elapsed_ms=elapsed, success=success)
                return CodeExecutionResponse(output=f"Execution error: {resp.status_code}", language=lang, elapsed_ms=elapsed, success=False)

            elif lang in ["python", "py"]:
                resp = client.post(f"{config.JUDGE0_API_URL}/submissions?wait=true", json={"source_code": body.code, "language_id": 71})
                elapsed = int((time.time() - t0) * 1000)
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    out = data.get("stdout") or data.get("stderr") or data.get("compile_output") or "Finished with no output."
                    success = bool(data.get("stdout")) and not bool(data.get("stderr"))
                    return CodeExecutionResponse(output=out, language=lang, elapsed_ms=elapsed, success=success)
                return CodeExecutionResponse(output=f"Execution error: {resp.status_code}", language=lang, elapsed_ms=elapsed, success=False)

            else:
                raise HTTPException(status_code=400, detail=f"Language '{body.language}' is not supported. Use 'c', 'cpp', or 'python'.")

    except HTTPException:
        raise
    except Exception as e:
        elapsed = int((time.time() - t0) * 1000)
        return CodeExecutionResponse(output=f"Execution failed: {type(e).__name__}: {e}", language=lang, elapsed_ms=elapsed, success=False)


@router.get("/dictionary/{word}")
async def lookup_dictionary_term(word: str, _user_id: str = Depends(verify_token)):
    """Look up dictionary definitions and synonyms for vocabulary & General Aptitude."""
    client_kwargs = {"timeout": 8.0, "verify": False, "follow_redirects": True}
    try:
        with httpx.Client(**client_kwargs) as client:
            resp = client.get(f"{config.DICTIONARY_API_URL}/{word.strip()}")
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and data:
                    item = data[0]
                    meanings = []
                    for m in item.get("meanings", []):
                        defs = [d.get("definition") for d in m.get("definitions", [])[:2]]
                        syns = m.get("synonyms", [])[:4]
                        meanings.append({"partOfSpeech": m.get("partOfSpeech"), "definitions": defs, "synonyms": syns})
                    return {
                        "word": word,
                        "phonetic": item.get("phonetic", ""),
                        "meanings": meanings,
                    }

            # Datamuse fallback
            resp_dm = client.get(f"{config.DATAMUSE_API_URL}/words", params={"ml": word, "max": 6})
            if resp_dm.status_code == 200:
                related = [r.get("word") for r in resp_dm.json()]
                return {
                    "word": word,
                    "phonetic": "",
                    "meanings": [{"partOfSpeech": "related words", "definitions": [], "synonyms": related}],
                }

            return {"word": word, "phonetic": "", "meanings": []}
    except Exception as e:
        return {"word": word, "phonetic": "", "meanings": [], "error": str(e)}

