from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from firebase_admin import auth as firebase_auth

from app.core import firestore_service
from app.core.auth import verify_admin_token

router = APIRouter(prefix="/admin", tags=["admin-dashboard"])


def _datetime_from_ms(value: int) -> str:
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat()


@router.get("/dashboard")
async def get_admin_dashboard(_admin_uid: str = Depends(verify_admin_token)):
    firebase_users = []
    try:
        page = firebase_auth.list_users()
        while page:
            for user in page.users:
                firebase_users.append({
                    "uid": user.uid,
                    "email": user.email or "",
                    "display_name": user.display_name or "",
                    "created_at": user.user_metadata.creation_timestamp and _datetime_from_ms(user.user_metadata.creation_timestamp),
                    "last_sign_in_at": user.user_metadata.last_sign_in_timestamp and _datetime_from_ms(user.user_metadata.last_sign_in_timestamp),
                })
            page = page.get_next_page()
    except Exception as exc:
        print(f"Warning: Failed to list Firebase users: {exc}")

    try:
        return firestore_service.admin_activity_snapshot(firebase_users)
    except Exception as exc:
        print(f"Error generating admin dashboard snapshot: {exc}")
        now_iso = datetime.now(timezone.utc).isoformat()
        return {
            "generated_at": now_iso,
            "users": {
                "total": len(firebase_users),
                "tracked_profiles": 0,
                "new_today": 0,
                "new_7d": 0,
                "new_30d": 0,
                "active_today": 0,
                "active_7d": 0,
                "active_30d": 0,
            },
            "activity": {
                "documents": 0,
                "storage_bytes": 0,
                "pyq_attempts": 0,
                "submitted_attempts": 0,
                "planner_tasks": 0,
                "completed_planner_tasks": 0,
                "community_posts": 0,
                "daily_messages": 0,
                "monthly_tokens": 0,
            },
            "recent_users": [
                {
                    "user_id": u.get("uid", ""),
                    "email": u.get("email", ""),
                    "display_name": u.get("display_name", ""),
                    "created_at": u.get("created_at"),
                    "last_active_at": u.get("last_sign_in_at"),
                    "documents": 0,
                    "storage_bytes": 0,
                    "attempts": 0,
                    "submitted_attempts": 0,
                    "planner_tasks": 0,
                    "completed_planner_tasks": 0,
                    "daily_messages": 0,
                    "monthly_tokens": 0,
                }
                for u in firebase_users[:50]
            ],
            "error_detail": str(exc),
        }
