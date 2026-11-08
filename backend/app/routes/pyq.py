import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core import firestore_service, pyq_analytics, pyq_data, pyq_practice, rag, usage_service
from app.core.auth import optional_verify_token, verify_token
from app.core.pyq_scoring import score_attempt, score_questions
from app.models import (
    AnalyticsResponse,
    DailyPracticeResponse,
    ExplainRequest,
    ExplainResponse,
    PracticeStartRequest,
    PracticeTaxonomyResponse,
    PYQAttemptStartResponse,
    PYQAttemptSummary,
    PYQPaperDetail,
    PYQPaperSummary,
    PYQResult,
    PYQSubmitRequest,
    StreakInfo,
    TopicFrequency,
)

router = APIRouter(prefix="/pyq", tags=["pyq"])

GUEST_USER_ID = "guest-pyq-user"


def pyq_user_id(user_id: str | None) -> str:
    return user_id or GUEST_USER_ID


def empty_analytics() -> dict:
    return {
        "total_attempts": 0,
        "total_marks": 0.0,
        "total_max_marks": 0.0,
        "overall_accuracy": 0.0,
        "correct": 0,
        "incorrect": 0,
        "unattempted": 0,
        "topics": [],
        "subjects": [],
        "chapters": [],
        "sections": [],
        "difficulty": [],
        "weak_topics": [],
        "strong_topics": [],
        "improvement_graph": [],
        "time_management": {
            "total_time_seconds": 0,
            "avg_time_per_attempted_seconds": 0.0,
            "fastest_correct_seconds": None,
            "slowest_incorrect_seconds": None,
            "overtime_questions": 0,
        },
        "rank_prediction": None,
        "percentile_prediction": None,
        "personalized_study_plan": ["Take a mixed practice set to generate personalized recommendations."],
    }


@router.get("/years")
async def list_years(user_id: str | None = Depends(optional_verify_token)):
    if user_id is None:
        years = sorted({meta["year"] for meta in pyq_data.PAPERS.values()}, reverse=True)
        return [{"year": year, "best_score_percent": None, "papers": [pid for pid, meta in pyq_data.PAPERS.items() if meta["year"] == year]} for year in years]
    attempts = firestore_service.list_pyq_attempts(pyq_user_id(user_id))
    best_by_year: dict[int, float] = {}
    for attempt in attempts:
        result = attempt.get("result") or {}
        paper_id = result.get("paper_id") or attempt.get("paper_id", "")
        meta = pyq_data.PAPERS.get(paper_id)
        if not meta:
            continue
        max_marks = result.get("max_marks") or 0
        score = round(100 * result.get("total_marks", 0) / max_marks, 1) if max_marks else 0.0
        best_by_year[meta["year"]] = max(best_by_year.get(meta["year"], 0.0), score)
    years = sorted({meta["year"] for meta in pyq_data.PAPERS.values()}, reverse=True)
    return [{"year": year, "best_score_percent": best_by_year.get(year), "papers": [pid for pid, meta in pyq_data.PAPERS.items() if meta["year"] == year]} for year in years]


@router.get("/exam/{year}")
async def get_year_exam(year: int):
    matches = [pid for pid, meta in pyq_data.PAPERS.items() if meta["year"] == year]
    if not matches:
        raise HTTPException(status_code=404, detail=f"No paper available for {year}.")
    return pyq_data.paper_detail_public(matches[0])


@router.post("/exam/{year}/submit", response_model=PYQResult)
async def submit_year_exam(year: int, body: PYQSubmitRequest, user_id: str | None = Depends(optional_verify_token)):
    matches = [pid for pid, meta in pyq_data.PAPERS.items() if meta["year"] == year]
    if not matches:
        raise HTTPException(status_code=404, detail=f"No paper available for {year}.")
    paper_id = matches[0]
    paper = pyq_data.paper_summary(paper_id)
    attempt_id = uuid.uuid4().hex
    started_at = datetime.now(timezone.utc)
    submitted_at = datetime.now(timezone.utc)
    scored = score_attempt(paper_id, body.answers, body.time_spent_seconds)
    result = {
        "attempt_id": attempt_id,
        "paper_id": paper_id,
        "paper_title": paper["title"],
        "duration_minutes": paper["duration_minutes"],
        "time_taken_seconds": sum(max(0, int(v or 0)) for v in body.time_spent_seconds.values()),
        "submitted_at": submitted_at.isoformat(),
        **scored,
    }
    uid = pyq_user_id(user_id)
    firestore_service.create_pyq_attempt(uid, attempt_id, paper_id, paper["title"], paper["duration_minutes"], started_at.isoformat())
    firestore_service.submit_pyq_attempt(uid, attempt_id, result, submitted_at.isoformat())
    return result

@router.get("/papers", response_model=list[PYQPaperSummary])
async def list_papers():
    return pyq_data.list_papers()


@router.get("/papers/{paper_id}", response_model=PYQPaperDetail)
async def get_paper(paper_id: str):
    if paper_id not in pyq_data.PAPERS:
        raise HTTPException(status_code=404, detail=f"Unknown paper '{paper_id}'.")
    return pyq_data.paper_detail_public(paper_id)


@router.post("/papers/{paper_id}/attempts", response_model=PYQAttemptStartResponse)
async def start_attempt(paper_id: str, user_id: str | None = Depends(optional_verify_token)):
    if paper_id not in pyq_data.PAPERS:
        raise HTTPException(status_code=404, detail=f"Unknown paper '{paper_id}'.")

    paper = pyq_data.paper_detail_public(paper_id)
    attempt_id = uuid.uuid4().hex
    started_at = datetime.now(timezone.utc)

    firestore_service.create_pyq_attempt(
        pyq_user_id(user_id), attempt_id, paper_id, paper["title"], paper["duration_minutes"], started_at.isoformat(),
    )

    return PYQAttemptStartResponse(
        attempt_id=attempt_id,
        started_at=started_at.isoformat(),
        duration_minutes=paper["duration_minutes"],
        paper=paper,
    )


@router.post("/practice/start", response_model=PYQAttemptStartResponse)
async def start_practice(body: PracticeStartRequest, user_id: str | None = Depends(optional_verify_token)):
    try:
        session_id, selected = pyq_practice.build_practice_session(
            body.subjects, body.chapters, body.topics, body.sections, body.difficulty, body.question_types, body.count,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    duration = pyq_practice.minutes_for(len(selected))
    started_at = datetime.now(timezone.utc)
    attempt_id = uuid.uuid4().hex
    filters = body.topics or body.chapters or body.subjects or body.difficulty or body.question_types
    title = f"Practice - {', '.join(filters[:3])}" if filters else "Mixed Practice"

    firestore_service.create_pyq_attempt(
        pyq_user_id(user_id), attempt_id, session_id, title, duration, started_at.isoformat(),
        kind="practice", question_refs=pyq_practice.question_refs(selected),
    )

    paper = pyq_data.build_session_paper(session_id, title, selected, duration)
    return PYQAttemptStartResponse(
        attempt_id=attempt_id, started_at=started_at.isoformat(), duration_minutes=duration, paper=paper,
    )


@router.get("/practice/taxonomy", response_model=PracticeTaxonomyResponse)
async def get_practice_taxonomy():
    return pyq_data.practice_taxonomy()


@router.get("/daily", response_model=DailyPracticeResponse)
async def get_daily_practice(user_id: str | None = Depends(optional_verify_token)):
    date_key = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if user_id is None:
        session_id, selected = pyq_practice.build_daily_session(date_key)
        duration = pyq_practice.minutes_for(len(selected))
        title = f"Daily Practice - {date_key}"
        paper = pyq_data.build_session_paper(session_id, title, selected, duration)
        return DailyPracticeResponse(
            attempt_id=session_id,
            started_at=datetime.now(timezone.utc).isoformat(),
            duration_minutes=duration,
            paper=paper,
            already_submitted=False,
            streak=StreakInfo(current_streak=0, longest_streak=0, completed_today=False),
        )

    uid = pyq_user_id(user_id)
    streak_data = firestore_service.get_streak(uid)
    streak = StreakInfo(
        current_streak=streak_data.get("current_streak", 0),
        longest_streak=streak_data.get("longest_streak", 0),
        completed_today=streak_data.get("last_completed_date") == date_key,
    )

    existing = firestore_service.find_pyq_attempt_by_date_key(uid, date_key)
    if existing:
        selected = pyq_practice.resolve_questions(existing["question_refs"])
        paper = pyq_data.build_session_paper(
            existing["paper_id"], existing["paper_title"], selected, existing["duration_minutes"],
        )
        return DailyPracticeResponse(
            attempt_id=existing["attempt_id"], started_at=existing["started_at"],
            duration_minutes=existing["duration_minutes"], paper=paper,
            already_submitted=existing.get("status") == "submitted", streak=streak,
        )

    session_id, selected = pyq_practice.build_daily_session(date_key)
    duration = pyq_practice.minutes_for(len(selected))
    started_at = datetime.now(timezone.utc)
    attempt_id = uuid.uuid4().hex
    title = f"Daily Practice â€” {date_key}"

    firestore_service.create_pyq_attempt(
        uid, attempt_id, session_id, title, duration, started_at.isoformat(),
        kind="daily", question_refs=pyq_practice.question_refs(selected), date_key=date_key,
    )

    paper = pyq_data.build_session_paper(session_id, title, selected, duration)
    return DailyPracticeResponse(
        attempt_id=attempt_id, started_at=started_at.isoformat(), duration_minutes=duration,
        paper=paper, already_submitted=False, streak=streak,
    )


@router.get("/topics", response_model=list[TopicFrequency])
async def get_topic_frequency():
    return pyq_data.topic_frequency()


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(user_id: str | None = Depends(optional_verify_token)):
    if user_id is None:
        return empty_analytics()
    return pyq_analytics.compute_analytics(pyq_user_id(user_id))


@router.post("/explain", response_model=ExplainResponse)
async def explain_question(body: ExplainRequest, user_id: str = Depends(verify_token)):
    usage_service.check_rate_limit(user_id)
    usage_service.check_and_increment_daily(user_id)
    usage_service.check_monthly_limit(user_id)

    try:
        result = await rag.explain_pyq_question(body.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        if result.get("tokens_used"):
            usage_service.add_tokens(user_id, result["tokens_used"])
    except Exception:
        pass

    return ExplainResponse(explanation=result["explanation"])


@router.post("/attempts/{attempt_id}/submit", response_model=PYQResult)
async def submit_attempt(attempt_id: str, body: PYQSubmitRequest, user_id: str | None = Depends(optional_verify_token)):
    uid = pyq_user_id(user_id)
    attempt = firestore_service.get_pyq_attempt(uid, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if attempt.get("status") == "submitted":
        raise HTTPException(status_code=400, detail="This attempt has already been submitted.")

    duration_minutes = attempt["duration_minutes"]
    started_at = datetime.fromisoformat(attempt["started_at"])
    submitted_at = datetime.now(timezone.utc)

    elapsed_seconds = int((submitted_at - started_at).total_seconds())
    time_taken_seconds = max(0, min(elapsed_seconds, duration_minutes * 60))

    if attempt.get("question_refs"):
        questions = pyq_practice.resolve_questions(attempt["question_refs"])
        scored = score_questions(questions, body.answers, body.time_spent_seconds)
    else:
        scored = score_attempt(attempt["paper_id"], body.answers, body.time_spent_seconds)

    result = {
        "attempt_id": attempt_id,
        "paper_id": attempt["paper_id"],
        "paper_title": attempt["paper_title"],
        "duration_minutes": duration_minutes,
        "time_taken_seconds": time_taken_seconds,
        "submitted_at": submitted_at.isoformat(),
        **scored,
    }

    firestore_service.submit_pyq_attempt(uid, attempt_id, result, submitted_at.isoformat())

    if attempt.get("kind") == "daily":
        date_key = attempt.get("date_key") or submitted_at.strftime("%Y-%m-%d")
        firestore_service.update_streak_on_completion(uid, date_key)

    return result


@router.get("/attempts/{attempt_id}", response_model=PYQResult)
async def get_attempt_result(attempt_id: str, user_id: str | None = Depends(optional_verify_token)):
    attempt = firestore_service.get_pyq_attempt(pyq_user_id(user_id), attempt_id)
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if attempt.get("status") != "submitted":
        raise HTTPException(status_code=400, detail="This attempt has not been submitted yet.")
    return attempt["result"]


@router.get("/attempts", response_model=list[PYQAttemptSummary])
async def list_attempts(user_id: str | None = Depends(optional_verify_token)):
    if user_id is None:
        return []
    attempts = firestore_service.list_pyq_attempts(pyq_user_id(user_id))
    full_attempts = [a for a in attempts if a.get("kind", "full") == "full"]
    return [
        {
            "attempt_id": a["attempt_id"],
            "paper_id": a["paper_id"],
            "paper_title": a["paper_title"],
            "total_marks": a["result"]["total_marks"],
            "max_marks": a["result"]["max_marks"],
            "submitted_at": a["submitted_at"],
        }
        for a in full_attempts
    ]

