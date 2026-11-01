import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core import firestore_service
from app.core.auth import verify_token, optional_verify_token
from app.models import StudyGoalUpdate, StudyPlannerSummary, StudyPlanTask, StudyPlanTaskCreate, StudyPlanTaskUpdate

router = APIRouter(prefix="/planner", tags=["planner"])


def _today_key() -> str:
    return date.today().isoformat()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _validate_date(value: str):
    try:
        date.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="planned_date must be YYYY-MM-DD.")


def _validate_task_fields(title: str | None = None, planned_date: str | None = None, duration_minutes: int | None = None):
    if title is not None and not title.strip():
        raise HTTPException(status_code=400, detail="Task title is required.")
    if planned_date is not None:
        _validate_date(planned_date)
    if duration_minutes is not None and (duration_minutes < 5 or duration_minutes > 600):
        raise HTTPException(status_code=400, detail="duration_minutes must be between 5 and 600.")


def _week_bounds(today: date) -> tuple[date, date]:
    start = today - timedelta(days=today.weekday())
    return start, start + timedelta(days=6)


def _task_or_404(user_id: str, task_id: str) -> dict:
    for task in firestore_service.list_study_tasks(user_id):
        if task.get("task_id") == task_id:
            return task
    raise HTTPException(status_code=404, detail="Study task not found.")


def _summary(user_id: str) -> StudyPlannerSummary:
    today = date.today()
    today_key = today.isoformat()
    week_start, week_end = _week_bounds(today)
    tasks = firestore_service.list_study_tasks(user_id)

    weekly_planned = 0
    weekly_completed = 0
    for task in tasks:
        try:
            task_date = date.fromisoformat(task.get("planned_date", ""))
        except ValueError:
            continue
        if week_start <= task_date <= week_end:
            weekly_planned += int(task.get("duration_minutes") or 0)
            if task.get("completed"):
                weekly_completed += int(task.get("duration_minutes") or 0)

    goal = float(firestore_service.get_study_goal(user_id).get("weekly_hours_goal", 20.0))
    streak = firestore_service.get_study_streak(user_id)
    reminders = [
        task for task in tasks
        if task.get("reminder_enabled", True)
        and not task.get("completed", False)
        and task.get("planned_date", "") <= (today + timedelta(days=1)).isoformat()
    ][:8]

    completed_today = streak.get("last_completed_date") == today_key
    completion_rate = round((weekly_completed / weekly_planned) * 100, 1) if weekly_planned else 0.0

    return StudyPlannerSummary(
        tasks=tasks,
        today_key=today_key,
        weekly_hours_goal=goal,
        weekly_completed_minutes=weekly_completed,
        weekly_planned_minutes=weekly_planned,
        completion_rate=completion_rate,
        current_streak=streak.get("current_streak", 0),
        longest_streak=streak.get("longest_streak", 0),
        completed_today=completed_today,
        revision_reminders=reminders,
    )


@router.get("/summary", response_model=StudyPlannerSummary)
async def get_planner_summary(user_id: str | None = Depends(optional_verify_token)):
    if not user_id:
        return StudyPlannerSummary(
            tasks=[],
            today_key=_today_key(),
            weekly_hours_goal=10.0,
            weekly_completed_minutes=0,
            weekly_planned_minutes=0,
            completion_rate=0.0,
            current_streak=0,
            longest_streak=0,
            completed_today=0,
            revision_reminders=[],
        )
    return _summary(user_id)


@router.post("/tasks", response_model=StudyPlanTask)
async def create_task(body: StudyPlanTaskCreate, user_id: str = Depends(verify_token)):
    _validate_task_fields(body.title, body.planned_date, body.duration_minutes)
    now = _now_iso()
    task_id = uuid.uuid4().hex
    task = {
        "title": body.title.strip(),
        "subject": body.subject.strip(),
        "topic": body.topic.strip(),
        "planned_date": body.planned_date,
        "start_time": body.start_time.strip(),
        "duration_minutes": body.duration_minutes,
        "priority": body.priority,
        "notes": body.notes.strip(),
        "reminder_enabled": body.reminder_enabled,
        "completed": False,
        "completed_at": None,
        "created_at": now,
        "updated_at": now,
    }
    firestore_service.create_study_task(user_id, task_id, task)
    return StudyPlanTask(task_id=task_id, **task)


@router.patch("/tasks/{task_id}", response_model=StudyPlanTask)
async def update_task(task_id: str, body: StudyPlanTaskUpdate, user_id: str = Depends(verify_token)):
    existing = _task_or_404(user_id, task_id)
    updates = body.model_dump(exclude_unset=True)
    _validate_task_fields(updates.get("title"), updates.get("planned_date"), updates.get("duration_minutes"))

    if "title" in updates and updates["title"] is not None:
        updates["title"] = updates["title"].strip()
    for key in ["subject", "topic", "start_time", "notes"]:
        if key in updates and updates[key] is not None:
            updates[key] = updates[key].strip()

    now = _now_iso()
    if updates.get("completed") is True and not existing.get("completed"):
        updates["completed_at"] = now
        firestore_service.update_study_streak_on_completion(user_id, existing.get("planned_date") or _today_key())
    elif updates.get("completed") is False:
        updates["completed_at"] = None

    updates["updated_at"] = now
    firestore_service.update_study_task(user_id, task_id, updates)
    merged = existing | updates
    return StudyPlanTask(**merged)


@router.post("/tasks/{task_id}/complete", response_model=StudyPlanTask)
async def complete_task(task_id: str, user_id: str = Depends(verify_token)):
    return await update_task(task_id, StudyPlanTaskUpdate(completed=True), user_id)


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(verify_token)):
    _task_or_404(user_id, task_id)
    firestore_service.delete_study_task(user_id, task_id)
    return {"message": "Study task deleted."}


@router.put("/goal", response_model=StudyPlannerSummary)
async def set_weekly_goal(body: StudyGoalUpdate, user_id: str = Depends(verify_token)):
    if body.weekly_hours_goal < 1 or body.weekly_hours_goal > 100:
        raise HTTPException(status_code=400, detail="weekly_hours_goal must be between 1 and 100.")
    firestore_service.set_study_goal(user_id, body.weekly_hours_goal)
    return _summary(user_id)
