import json
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import optional_verify_token
from app.core.rag import _get_llm
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter(prefix="/notes-scanner", tags=["notes-scanner"])

class ExtractedCard(BaseModel):
    front: str
    back: str
    exam_trap: str
    formula: Optional[str] = None

class ProcessNotesRequest(BaseModel):
    raw_text: str
    subject: Optional[str] = "Computer Science"
    image_base64: Optional[str] = None

class ProcessNotesResponse(BaseModel):
    structured_markdown: str
    extracted_formulas: List[str]
    key_takeaways: List[str]
    auto_flashcards: List[ExtractedCard]

@router.post("/process", response_model=ProcessNotesResponse)
async def process_notes_endpoint(
    body: ProcessNotesRequest,
    user_id: Optional[str] = Depends(optional_verify_token)
):
    system_prompt = (
        "You are an expert academic OCR and LaTeX parser for GATE CS engineering notes.\n"
        "Given rough or handwritten note notes:\n"
        "1. Format it into clean, beautiful structured Markdown with LaTeX math syntax ($...$ or $$...$$).\n"
        "2. Extract standard mathematical formulas into a clean list.\n"
        "3. Provide 3 high-yield summary bullet points.\n"
        "4. Generate 2 high-quality active-recall flashcards.\n"
        "Format output as JSON:\n"
        "{\n"
        '  "structured_markdown": "...",\n'
        '  "extracted_formulas": ["formula1", "formula2"],\n'
        '  "key_takeaways": ["point1", "point2", "point3"],\n'
        '  "auto_flashcards": [{"front": "...", "back": "...", "exam_trap": "...", "formula": "..."}]\n'
        "}"
    )

    default_markdown = f"# Notes Summary: {body.subject}\n\n{body.raw_text}\n\n### Key Concepts\n- Systematic review and verification of definitions.\n- Edge case awareness in mathematical derivations."
    default_formulas = ["T(n) = a T(n/b) + f(n)", "EAT = h \\cdot (t_{tlb} + t_m) + (1-h) \\cdot (t_{tlb} + 2t_m)"]
    default_takeaways = [
        "Formulas must be evaluated under proper boundary constraints.",
        "Check exponent conditions for asymptotic master theorem.",
        "Verify state reachability in automata construction."
    ]
    default_cards = [
        ExtractedCard(
            front=f"Core principle in {body.subject}",
            back="Fundamental theorem governing asymptotic runtime and memory constraints.",
            exam_trap="Do not assume uniform distribution unless stated.",
            formula=default_formulas[0]
        )
    ]

    try:
        llm = _get_llm(max_tokens=1500)
        if llm:
            res = await llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Subject: {body.subject}\n\nRaw Notes Content:\n{body.raw_text}")
            ])
            raw = res.content or ""
            match = re.search(r"\{[\s\S]*\}", raw)
            if match:
                data = json.loads(match.group(0))
                default_markdown = data.get("structured_markdown", default_markdown)
                default_formulas = data.get("extracted_formulas", default_formulas)
                default_takeaways = data.get("key_takeaways", default_takeaways)
                raw_cards = data.get("auto_flashcards", [])
                if raw_cards:
                    default_cards = [ExtractedCard(**c) for c in raw_cards]
    except Exception:
        pass

    return ProcessNotesResponse(
        structured_markdown=default_markdown,
        extracted_formulas=default_formulas,
        key_takeaways=default_takeaways,
        auto_flashcards=default_cards
    )
