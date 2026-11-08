import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_initialized = False

def _init_firebase():
    global _initialized
    if _initialized:
        return
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if service_account_json:
        cred = credentials.Certificate(json.loads(service_account_json))
    elif os.path.exists("firebase-service-account.json"):
        cred = credentials.Certificate("firebase-service-account.json")
    else:
        raise RuntimeError("Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var.")
    firebase_admin.initialize_app(cred)
    _initialized = True

_bearer = HTTPBearer(auto_error=False)
_optional_bearer = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials | None = Security(_bearer)) -> str:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        _init_firebase()
        decoded = auth.verify_id_token(credentials.credentials)
        return decoded["uid"]
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def optional_verify_token(credentials: HTTPAuthorizationCredentials | None = Security(_optional_bearer)) -> str | None:
    if credentials is None:
        return None
    try:
        _init_firebase()
        decoded = auth.verify_id_token(credentials.credentials)
        return decoded["uid"]
    except Exception:
        return None


DEFAULT_ADMIN_EMAILS = {
    "etcherlarevanthrao9402@gmail.com",
    "etcharlarevanthrao9402@gmail.com",
    "revrao9550@gmail.com",
}


def get_admin_emails() -> set[str]:
    emails = set(DEFAULT_ADMIN_EMAILS)
    raw = f"{os.getenv('ADMIN_EMAIL', '')},{os.getenv('ADMIN_EMAILS', '')}"
    for part in raw.split(","):
        cleaned = part.strip().lower()
        if cleaned:
            emails.add(cleaned)
    return emails


def verify_admin_token(credentials: HTTPAuthorizationCredentials | None = Security(_bearer)) -> str:
    """Like verify_token, but only accepts authorized admin accounts."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        _init_firebase()
        decoded = auth.verify_id_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_email = (decoded.get("email") or "").strip().lower()
    allowed_admins = get_admin_emails()
    if not user_email or user_email not in allowed_admins:
        raise HTTPException(
            status_code=403,
            detail=f"Admin access required. Account '{user_email or 'unknown'}' is not authorized as an administrator.",
        )
    return decoded["uid"]
