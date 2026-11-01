import uuid
from datetime import date, datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.core import firestore_service, product_data, pyq_analytics
from app.core.auth import verify_admin_token, verify_token, optional_verify_token
from app.models import (
    AdminAnnouncement,
    AdminAnnouncementCreate,
    NotificationItem,
    NotificationPreferences,
    NotificationPreferencesUpdate,
    NotificationsResponse,
    PushTokenRegistration,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _item(
    notification_id: str,
    title: str,
    message: str,
    type_: str,
    created_at: str,
    action_route: str | None = None,
    priority: str = "normal",
) -> dict:
    return {
        "notification_id": notification_id,
        "title": title,
        "message": message,
        "type": type_,
        "created_at": created_at,
        "action_route": action_route,
        "priority": priority,
        "read": False,
    }


def _exam_date_items() -> list[dict]:
    today = date.today()
    items = []
    for entry in product_data.exam_info().get("important_dates", []):
        raw_date = str(entry.get("date", ""))
        first_date = raw_date.split(" to ")[0].strip()
        try:
            event_date = date.fromisoformat(first_date)
        except ValueError:
            continue
        days_left = (event_date - today).days
        if days_left < 0 or days_left > 30:
            continue
        label = str(entry.get("label", "GATE date"))
        when = "today" if days_left == 0 else f"in {days_left} days"
        items.append(_item(
            f"exam-date-{_slug(label)}-{first_date}",
            label,
            f"{label} is {when}. Check the exam info page for exact details.",
            "exam_update",
            f"{first_date}T00:00:00+00:00",
            "/exam-info",
            "high" if days_left <= 3 else "normal",
        ))
    return items


def _build_notifications(user_id: str) -> tuple[list[dict], dict]:
    prefs = firestore_service.get_notification_preferences(user_id)
    today = date.today()
    now = _now_iso()
    items: list[dict] = []

    if prefs.get("revision_reminders", True):
        for task in firestore_service.list_study_tasks(user_id):
            if task.get("completed") or not task.get("reminder_enabled", True):
                continue
            planned_date = str(task.get("planned_date", ""))
            try:
                task_date = date.fromisoformat(planned_date)
            except ValueError:
                continue
            if today <= task_date <= today + timedelta(days=1):
                day_label = "today" if task_date == today else "tomorrow"
                title = task.get("title") or "Study task"
                items.append(_item(
                    f"planner-{task.get('task_id')}",
                    "Revision reminder",
                    f"{title} is scheduled for {day_label}.",
                    "revision_reminder",
                    f"{planned_date}T{task.get('start_time') or '00:00'}:00+00:00",
                    "/revision-planner",
                    "high" if task_date == today else "normal",
                ))

    if prefs.get("quiz_alerts", True):
        daily = firestore_service.find_pyq_attempt_by_date_key(user_id, today.isoformat())
        if not daily or daily.get("status") != "submitted":
            items.append(_item(
                f"daily-practice-{today.isoformat()}",
                "Daily practice pending",
                "Finish today's PYQ practice to keep your streak alive.",
                "quiz_alert",
                f"{today.isoformat()}T06:00:00+00:00",
                "/pyq",
                "high",
            ))

    if prefs.get("exam_updates", True):
        items.extend(_exam_date_items())

    if prefs.get("system_updates", True):
        for idx, text in enumerate(product_data.exam_info().get("notifications", [])[:5]):
            items.append(_item(
                f"system-{idx}-{_slug(str(text))[:32]}",
                "Exam update",
                str(text),
                "system_update",
                now,
                "/exam-info",
            ))

    if prefs.get("daily_challenge", True):
        motivation = product_data.motivation(user_id)
        items.append(_item(
            f"daily-challenge-{today.isoformat()}",
            "Daily challenge",
            str(motivation.get("daily_challenge") or "Complete one focused study block today."),
            "daily_challenge",
            f"{today.isoformat()}T05:00:00+00:00",
            "/motivation",
        ))

    analytics = pyq_analytics.compute_analytics(user_id)
    if analytics.get("weak_topics"):
        weak = analytics["weak_topics"][0]
        topic = weak.get("key") or "a weak topic"
        items.append(_item(
            f"weak-topic-{_slug(topic)}",
            "Weak topic detected",
            f"{topic} needs review based on your recent attempts.",
            "weak_topic",
            now,
            "/progress",
            "normal",
        ))

    if prefs.get("system_updates", True):
        items.extend(firestore_service.list_admin_announcements())

    return items, prefs


def _response(user_id: str) -> NotificationsResponse:
    items, prefs = _build_notifications(user_id)
    firestore_service.upsert_notification_history(user_id, items)
    history = firestore_service.list_notification_history(user_id)
    read_ids = firestore_service.list_read_notification_ids(user_id)
    for item in history:
        item["read"] = item["notification_id"] in read_ids
    history.sort(key=lambda item: item["created_at"], reverse=True)
    history.sort(key=lambda item: item["read"])
    notifications = [NotificationItem(**item) for item in history[:50]]
    unread_count = sum(1 for item in notifications if not item.read)
    return NotificationsResponse(
        notifications=notifications,
        unread_count=unread_count,
        preferences=NotificationPreferences(**prefs),
    )


@router.get("", response_model=NotificationsResponse)
async def list_notifications(user_id: str | None = Depends(optional_verify_token)):
    if not user_id:
        return NotificationsResponse(notifications=[], unread_count=0, preferences=NotificationPreferences())
    return _response(user_id)


@router.get("/unread-count")
async def unread_count(user_id: str | None = Depends(optional_verify_token)):
    if not user_id:
        return {"unread_count": 0}
    return {"unread_count": _response(user_id).unread_count}


@router.post("/{notification_id}/read", response_model=NotificationsResponse)
async def mark_read(notification_id: str, user_id: str = Depends(verify_token)):
    firestore_service.mark_notification_read(user_id, notification_id)
    return _response(user_id)


@router.post("/read-all", response_model=NotificationsResponse)
async def mark_all_read(user_id: str = Depends(verify_token)):
    items, _prefs = _build_notifications(user_id)
    history = firestore_service.list_notification_history(user_id)
    ids = {item["notification_id"] for item in items} | {item["notification_id"] for item in history}
    firestore_service.mark_notifications_read(user_id, sorted(ids))
    return _response(user_id)


@router.post("/push-token")
async def register_push_token(body: PushTokenRegistration, user_id: str = Depends(verify_token)):
    token = body.token.strip()
    if not token.startswith("ExponentPushToken["):
        raise HTTPException(status_code=400, detail="Invalid Expo push token.")
    firestore_service.save_push_token(user_id, token, body.platform, body.device_name)
    firestore_service.set_notification_preferences(user_id, {"push_enabled": True})
    return {"status": "registered"}


@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(user_id: str = Depends(verify_token)):
    return NotificationPreferences(**firestore_service.get_notification_preferences(user_id))


@router.put("/preferences", response_model=NotificationPreferences)
async def update_preferences(body: NotificationPreferencesUpdate, user_id: str = Depends(verify_token)):
    prefs = firestore_service.set_notification_preferences(user_id, body.model_dump(exclude_unset=True))
    return NotificationPreferences(**prefs)


async def _send_expo_push(title: str, message: str):
    tokens = firestore_service.list_all_push_tokens()
    if not tokens:
        return {"sent": 0, "details": []}
    payload = [{"to": token, "title": title, "body": message, "sound": "default"} for token in tokens]
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post("https://exp.host/--/api/v2/push/send", json=payload)
        response.raise_for_status()
        data = response.json()
    return {"sent": len(tokens), "details": data.get("data", data)}


@router.get("/admin/announcements", response_model=list[AdminAnnouncement])
async def admin_list_announcements(_admin_uid: str = Depends(verify_admin_token)):
    return [AdminAnnouncement(**item) for item in firestore_service.list_admin_announcements(include_inactive=True)]


@router.post("/admin/announcements")
async def admin_create_announcement(body: AdminAnnouncementCreate, admin_uid: str = Depends(verify_admin_token)):
    title = body.title.strip()
    message = body.message.strip()
    if not title or not message:
        raise HTTPException(status_code=400, detail="title and message are required.")
    announcement_id = f"admin-{uuid.uuid4().hex}"
    announcement = _item(
        announcement_id,
        title,
        message,
        "admin_announcement",
        _now_iso(),
        body.action_route,
        body.priority,
    ) | {"active": True, "created_by": admin_uid}
    firestore_service.create_admin_announcement(announcement_id, announcement)
    push_result = {"sent": 0, "details": []}
    if body.send_push:
        push_result = await _send_expo_push(title, message)
    return {"announcement": announcement, "push": push_result}


@router.delete("/admin/announcements/{announcement_id}")
async def admin_deactivate_announcement(announcement_id: str, _admin_uid: str = Depends(verify_admin_token)):
    firestore_service.update_admin_announcement(announcement_id, {"active": False, "updated_at": _now_iso()})
    return {"status": "deactivated"}
