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
    return firestore_service.admin_activity_snapshot(firebase_users)
