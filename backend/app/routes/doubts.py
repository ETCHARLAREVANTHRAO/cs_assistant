from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core import usage_service
from app.core.auth import verify_token
from app.core.rag import _extract_text, solve_doubt
from app.models import DoubtSolveResponse

router = APIRouter(prefix="/doubts", tags=["doubts"])

SUPPORTED_EXTENSIONS = {"txt", "md", "pdf", "docx", "jpg", "jpeg", "png", "bmp", "tiff", "webp"}


@router.post("/solve", response_model=DoubtSolveResponse)
async def solve_doubt_endpoint(
    message: str = Form(""),
    subject: str = Form(""),
    topic: str = Form(""),
    file: UploadFile | None = File(None),
    user_id: str = Depends(verify_token),
):
    usage_service.check_rate_limit(user_id)
    usage_service.check_and_increment_daily(user_id)
    usage_service.check_monthly_limit(user_id)

    extracted_text = ""
    if file is not None and file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '.{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
            )
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        extracted_text = _extract_text(content, file.filename)

    if not message.strip() and not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Enter a doubt or upload a readable image/file.")

    try:
        result = await solve_doubt(message, extracted_text=extracted_text, subject=subject, topic=topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        if result.get("tokens_used"):
            usage_service.add_tokens(user_id, result["tokens_used"])
    except Exception:
        pass

    return DoubtSolveResponse(answer=result["answer"], extracted_text=result.get("extracted_text", ""))