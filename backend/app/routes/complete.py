import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from langchain_core.messages import HumanMessage, SystemMessage

from app.core import firestore_service, product_data, pyq_analytics, rag, usage_service
from app.core.auth import verify_token, optional_verify_token

router = APIRouter(tags=["complete"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _ai(user_id: str, system: str, prompt: str) -> dict:
    usage_service.check_rate_limit(user_id)
    usage_service.check_and_increment_daily(user_id)
    usage_service.check_monthly_limit(user_id)
    response = await rag._get_llm().ainvoke([SystemMessage(content=system), HumanMessage(content=prompt)])
    usage = getattr(response, "usage_metadata", None) or {}
    try:
        if usage.get("total_tokens"):
            usage_service.add_tokens(user_id, usage["total_tokens"])
    except Exception:
        pass
    return {"answer": response.content or "No answer generated.", "tokens_used": usage.get("total_tokens", 0)}


@router.post("/ai/tutor")
async def ai_tutor(body: dict, user_id: str = Depends(verify_token)):
    topic = (body.get("topic") or "").strip()
    level = (body.get("level") or "beginner").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic is required.")
    return await _ai(user_id, "You are a GATE CS tutor. Teach clearly with examples and PYQ-style traps.", f"Teach {topic} for a {level} GATE CS student. Include concept, example, common mistakes, and 5 practice prompts.")


@router.post("/ai/quiz-generator")
async def ai_quiz_generator(body: dict, user_id: str = Depends(verify_token)):
    topic = (body.get("topic") or "mixed GATE CS").strip()
    count = int(body.get("count") or 5)
    difficulty = (body.get("difficulty") or "medium").strip()
    return await _ai(user_id, "You create concise GATE CS quizzes with answers and explanations.", f"Create {max(1, min(count, 15))} {difficulty} questions on {topic}. Mix MCQ/NAT where useful. Include answer key and short explanations.")


@router.post("/ai/exam-mentor")
async def ai_exam_mentor(body: dict, user_id: str = Depends(verify_token)):
    concern = (body.get("concern") or "How should I improve my GATE preparation?").strip()
    analytics = pyq_analytics.compute_analytics(user_id)
    return await _ai(user_id, "You are a practical GATE exam mentor. Give focused strategy, not motivation fluff.", f"Student concern: {concern}\nAnalytics: {analytics}\nGive a weekly action plan, mock strategy, and mistake-review method.")


@router.post("/ai/revision-plan")
async def ai_revision_plan(body: dict, user_id: str = Depends(verify_token)):
    days = int(body.get("days") or 7)
    target = (body.get("target") or "GATE CS revision").strip()
    analytics = pyq_analytics.compute_analytics(user_id)
    return await _ai(user_id, "You make realistic GATE CS revision plans.", f"Create a {max(1, min(days, 60))}-day revision plan for {target}. Use analytics: {analytics}. Include daily tasks, mock days, and error notebook review.")


@router.get("/exam-info")
async def get_exam_info(_user_id: str | None = Depends(optional_verify_token)):
    return product_data.exam_info()


@router.get("/motivation")
async def get_motivation(user_id: str = Depends(verify_token)):
    return product_data.motivation(user_id)


@router.get("/revision")
async def get_revision(user_id: str = Depends(verify_token)):
    return product_data.revision(user_id)


@router.get("/community")
async def get_community(user_id: str = Depends(verify_token)):
    return product_data.community(user_id)


@router.post("/community/posts")
async def create_community_post(body: dict, user_id: str = Depends(verify_token)):
    title = (body.get("title") or "").strip()
    content = (body.get("content") or "").strip()
    category = (body.get("category") or "discussion").strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="title and content are required.")
    post_id = uuid.uuid4().hex
    firestore_service.create_community_post(user_id, post_id, {
        "title": title,
        "content": content,
        "category": category,
        "author_id": user_id[:8],
        "created_at": _now_iso(),
        "faculty_answer": "Faculty answer pending. Use AI Doubts for instant help until faculty review is available.",
    })
    return product_data.community(user_id)
