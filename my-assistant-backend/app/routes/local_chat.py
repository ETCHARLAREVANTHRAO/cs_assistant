from fastapi import APIRouter, HTTPException

from app.core.local_llm import (
    LocalModelError,
    _is_server_ready,
    _resolve_model_path,
    _resolve_server_path,
    _server_url,
    ensure_local_server,
    generate_local_reply_async,
)
from app.models import LocalChatRequest, LocalChatResponse

router = APIRouter(prefix="/local-chat", tags=["local-chat"])


@router.get("/status")
async def local_chat_status():
    try:
        model_path = _resolve_model_path()
        server_path = _resolve_server_path()
        server_url = _server_url()
    except LocalModelError as exc:
        return {"available": False, "detail": str(exc)}
    return {
        "available": True,
        "server_ready": _is_server_ready(),
        "server_url": server_url,
        "model_path": str(model_path),
        "runner_path": str(server_path),
    }


@router.post("", response_model=LocalChatResponse)
async def local_chat_endpoint(body: LocalChatRequest):
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required.")
    try:
        ensure_local_server()
        result = await generate_local_reply_async(
            message,
            max_tokens=body.max_tokens,
            temperature=body.temperature,
        )
    except LocalModelError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Local model failed: {exc}")
    return LocalChatResponse(**result)