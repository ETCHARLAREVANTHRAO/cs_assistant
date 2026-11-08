from fastapi import APIRouter, Depends
from firebase_admin import auth as firebase_auth

from app.core import firestore_service, product_data, resources_data
from app.core.auth import verify_admin_token

router = APIRouter(prefix="/admin/content", tags=["admin-content"])


def _defaults() -> dict:
    community = product_data.COMMUNITY_SEED
    return {
        **resources_data.resource_defaults(),
        "exam_info": product_data.EXAM_INFO,
        "mentor_sessions": community["mentor_sessions"],
        "learning_overrides": {},
    }


@router.get("")
async def get_admin_content(_admin_uid: str = Depends(verify_admin_token)):
    saved = firestore_service.get_admin_content()
    defaults = _defaults()
    return {key: saved.get(key) or value for key, value in defaults.items()}


@router.put("")
async def save_admin_content(body: dict, _admin_uid: str = Depends(verify_admin_token)):
    allowed = {"formula_sheets", "cheat_sheets", "book_recommendations", "exam_info", "mentor_sessions", "short_tricks", "learning_overrides"}
    content = {key: body[key] for key in allowed if key in body}
    firestore_service.set_admin_content(content)
    saved = firestore_service.get_admin_content()
    defaults = _defaults()
    return {key: saved.get(key) or value for key, value in defaults.items()}


@router.post("/reset")
async def reset_admin_content(_admin_uid: str = Depends(verify_admin_token)):
    defaults = _defaults()
    firestore_service.set_admin_content(defaults)
    return defaults


