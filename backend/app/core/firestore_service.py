from typing import Optional
from datetime import datetime, timezone

from firebase_admin import firestore as fb_firestore

LIMIT_BYTES = 15 * 1024 * 1024          # 15 MB per user
_MAX_TEXT_BYTES = 900_000                 # Stay under Firestore's 1 MB doc limit

_db = None


def get_db():
    global _db
    if _db is None:
        try:
            from app.core.auth import _init_firebase
            _init_firebase()
        except Exception:
            pass
        _db = fb_firestore.client()
    return _db


def get_user_size(user_id: str) -> int:
    docs = get_db().collection("users").document(user_id).collection("documents").stream()
    return sum(d.to_dict().get("size_bytes", 0) for d in docs)


def add_document(user_id: str, filename: str, size_bytes: int, chunks: int, text: str):
    get_db().collection("users").document(user_id).collection("documents").document(filename).set({
        "filename": filename,
        "size_bytes": size_bytes,
        "chunks": chunks,
        "text": text[:_MAX_TEXT_BYTES],
        "uploaded_at": fb_firestore.SERVER_TIMESTAMP,
    })


def list_documents(user_id: str) -> list[str]:
    docs = get_db().collection("users").document(user_id).collection("documents").stream()
    return sorted(d.id for d in docs)

def get_document(user_id: str, filename: str) -> Optional[dict]:
    doc = get_db().collection("users").document(user_id).collection("documents").document(filename).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["filename"] = filename
    return data



def delete_document(user_id: str, filename: str):
    get_db().collection("users").document(user_id).collection("documents").document(filename).delete()


def get_drive_sync_state(user_id: str) -> dict:
    """Returns {drive_file_id: modified_time} for files already synced from Drive."""
    docs = get_db().collection("users").document(user_id).collection("drive_sync").stream()
    return {d.id: d.to_dict().get("modified_time") for d in docs}


def set_drive_sync_state(user_id: str, file_id: str, modified_time: str, filename: str):
    get_db().collection("users").document(user_id).collection("drive_sync").document(file_id).set({
        "modified_time": modified_time,
        "filename": filename,
        "synced_at": fb_firestore.SERVER_TIMESTAMP,
    })


def create_pyq_attempt(user_id: str, attempt_id: str, paper_id: str, paper_title: str,
                        duration_minutes: int, started_at_iso: str, kind: str = "full",
                        question_refs: Optional[list[dict]] = None, date_key: Optional[str] = None):
    doc = {
        "kind": kind,
        "paper_id": paper_id,
        "paper_title": paper_title,
        "duration_minutes": duration_minutes,
        "started_at": started_at_iso,
        "status": "in_progress",
    }
    if question_refs is not None:
        doc["question_refs"] = question_refs
    if date_key is not None:
        doc["date_key"] = date_key
    get_db().collection("users").document(user_id).collection("pyq_attempts").document(attempt_id).set(doc)


def submit_pyq_attempt(user_id: str, attempt_id: str, result: dict, submitted_at_iso: str):
    get_db().collection("users").document(user_id).collection("pyq_attempts").document(attempt_id).update({
        "status": "submitted",
        "submitted_at": submitted_at_iso,
        "result": result,
    })


def get_pyq_attempt(user_id: str, attempt_id: str) -> Optional[dict]:
    doc = get_db().collection("users").document(user_id).collection("pyq_attempts").document(attempt_id).get()
    return doc.to_dict() if doc.exists else None


def list_pyq_attempts(user_id: str) -> list[dict]:
    docs = (
        get_db().collection("users").document(user_id).collection("pyq_attempts")
        .where("status", "==", "submitted").stream()
    )
    attempts = [d.to_dict() | {"attempt_id": d.id} for d in docs]
    attempts.sort(key=lambda a: a.get("submitted_at", ""), reverse=True)
    return attempts


def find_pyq_attempt_by_date_key(user_id: str, date_key: str) -> Optional[dict]:
    docs = (
        get_db().collection("users").document(user_id).collection("pyq_attempts")
        .where("date_key", "==", date_key).limit(1).stream()
    )
    for d in docs:
        return d.to_dict() | {"attempt_id": d.id}
    return None


def get_streak(user_id: str) -> dict:
    doc = get_db().collection("users").document(user_id).collection("stats").document("streak").get()
    return doc.to_dict() or {"current_streak": 0, "longest_streak": 0, "last_completed_date": None}


def update_streak_on_completion(user_id: str, completed_date: str) -> dict:
    """Bumps the streak once per calendar day. Consecutive-day completions extend it;
    a gap of more than a day resets it to 1."""
    from datetime import date, timedelta

    ref = get_db().collection("users").document(user_id).collection("stats").document("streak")
    data = ref.get().to_dict() or {"current_streak": 0, "longest_streak": 0, "last_completed_date": None}
    last = data.get("last_completed_date")

    if last != completed_date:
        is_consecutive = last is not None and (
            date.fromisoformat(completed_date) - date.fromisoformat(last) == timedelta(days=1)
        )
        data["current_streak"] = data.get("current_streak", 0) + 1 if is_consecutive else 1
        data["longest_streak"] = max(data.get("longest_streak", 0), data["current_streak"])
        data["last_completed_date"] = completed_date
        ref.set(data)
    return data


def _study_tasks_ref(user_id: str):
    return get_db().collection("users").document(user_id).collection("study_plan_tasks")


def create_study_task(user_id: str, task_id: str, task: dict):
    _study_tasks_ref(user_id).document(task_id).set(task)


def list_study_tasks(user_id: str) -> list[dict]:
    docs = _study_tasks_ref(user_id).stream()
    tasks = [d.to_dict() | {"task_id": d.id} for d in docs]
    tasks.sort(key=lambda t: (t.get("planned_date", ""), t.get("start_time", ""), t.get("created_at", "")))
    return tasks


def update_study_task(user_id: str, task_id: str, updates: dict):
    _study_tasks_ref(user_id).document(task_id).update(updates)


def delete_study_task(user_id: str, task_id: str):
    _study_tasks_ref(user_id).document(task_id).delete()


def get_study_goal(user_id: str) -> dict:
    doc = get_db().collection("users").document(user_id).collection("stats").document("study_goal").get()
    return doc.to_dict() or {"weekly_hours_goal": 20.0}


def set_study_goal(user_id: str, weekly_hours_goal: float):
    get_db().collection("users").document(user_id).collection("stats").document("study_goal").set({
        "weekly_hours_goal": weekly_hours_goal,
    })


def get_study_streak(user_id: str) -> dict:
    doc = get_db().collection("users").document(user_id).collection("stats").document("study_streak").get()
    return doc.to_dict() or {"current_streak": 0, "longest_streak": 0, "last_completed_date": None}


def update_study_streak_on_completion(user_id: str, completed_date: str) -> dict:
    from datetime import date, timedelta

    ref = get_db().collection("users").document(user_id).collection("stats").document("study_streak")
    data = ref.get().to_dict() or {"current_streak": 0, "longest_streak": 0, "last_completed_date": None}
    last = data.get("last_completed_date")

    if last != completed_date:
        is_consecutive = last is not None and (
            date.fromisoformat(completed_date) - date.fromisoformat(last) == timedelta(days=1)
        )
        data["current_streak"] = data.get("current_streak", 0) + 1 if is_consecutive else 1
        data["longest_streak"] = max(data.get("longest_streak", 0), data["current_streak"])
        data["last_completed_date"] = completed_date
        ref.set(data)
    return data


DEFAULT_NOTIFICATION_PREFERENCES = {
    "revision_reminders": True,
    "quiz_alerts": True,
    "exam_updates": True,
    "system_updates": True,
    "daily_challenge": True,
    "push_enabled": False,
}


def get_notification_preferences(user_id: str) -> dict:
    doc = get_db().collection("users").document(user_id).collection("stats").document("notification_preferences").get()
    return DEFAULT_NOTIFICATION_PREFERENCES | (doc.to_dict() or {})


def set_notification_preferences(user_id: str, updates: dict) -> dict:
    allowed = set(DEFAULT_NOTIFICATION_PREFERENCES)
    clean = {key: bool(value) for key, value in updates.items() if key in allowed and value is not None}
    if clean:
        get_db().collection("users").document(user_id).collection("stats").document("notification_preferences").set(clean, merge=True)
    return get_notification_preferences(user_id)


def _notification_reads_ref(user_id: str):
    return get_db().collection("users").document(user_id).collection("notification_reads")


def _notification_history_ref(user_id: str):
    return get_db().collection("users").document(user_id).collection("notification_history")


def list_read_notification_ids(user_id: str) -> set[str]:
    return {doc.id for doc in _notification_reads_ref(user_id).stream()}


def mark_notification_read(user_id: str, notification_id: str):
    _notification_reads_ref(user_id).document(notification_id).set({
        "read_at": datetime.now(timezone.utc).isoformat(),
    }, merge=True)


def mark_notifications_read(user_id: str, notification_ids: list[str]):
    if not notification_ids:
        return
    batch = get_db().batch()
    now = datetime.now(timezone.utc).isoformat()
    for notification_id in notification_ids:
        batch.set(_notification_reads_ref(user_id).document(notification_id), {"read_at": now}, merge=True)
    batch.commit()


def upsert_notification_history(user_id: str, notifications: list[dict]):
    if not notifications:
        return
    batch = get_db().batch()
    now = datetime.now(timezone.utc).isoformat()
    for notification in notifications:
        notification_id = notification["notification_id"]
        data = dict(notification)
        data["last_seen_at"] = now
        data.setdefault("first_seen_at", now)
        batch.set(_notification_history_ref(user_id).document(notification_id), data, merge=True)
    batch.commit()


def list_notification_history(user_id: str, limit: int = 100) -> list[dict]:
    docs = _notification_history_ref(user_id).stream()
    rows = [d.to_dict() | {"notification_id": d.id} for d in docs]
    rows.sort(key=lambda row: row.get("created_at", ""), reverse=True)
    return rows[:limit]


def save_push_token(user_id: str, token: str, platform: str = "unknown", device_name: str = ""):
    get_db().collection("users").document(user_id).collection("push_tokens").document(token).set({
        "token": token,
        "platform": platform,
        "device_name": device_name,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }, merge=True)


def list_all_push_tokens() -> list[str]:
    tokens = []
    try:
        for doc in get_db().collection_group("push_tokens").stream():
            token = (doc.to_dict() or {}).get("token")
            if token:
                tokens.append(token)
    except Exception:
        return []
    return sorted(set(tokens))


def create_admin_announcement(announcement_id: str, announcement: dict):
    get_db().collection("admin_notifications").document(announcement_id).set(announcement)


def list_admin_announcements(include_inactive: bool = False) -> list[dict]:
    docs = get_db().collection("admin_notifications").stream()
    rows = [d.to_dict() | {"notification_id": d.id} for d in docs]
    if not include_inactive:
        rows = [row for row in rows if row.get("active", True)]
    rows.sort(key=lambda row: row.get("created_at", ""), reverse=True)
    return rows[:100]


def update_admin_announcement(announcement_id: str, updates: dict):
    get_db().collection("admin_notifications").document(announcement_id).set(updates, merge=True)

def get_error_notebook_statuses(user_id: str) -> dict:
    docs = get_db().collection("users").document(user_id).collection("error_notebook").stream()
    return {d.id: d.to_dict() for d in docs}


def set_error_notebook_status(user_id: str, notebook_id: str, resolved: Optional[bool] = None, note: Optional[str] = None):
    data = {}
    if resolved is not None:
        data["resolved"] = resolved
    if note is not None:
        data["note"] = note
    if data:
        data["updated_at"] = fb_firestore.SERVER_TIMESTAMP
        get_db().collection("users").document(user_id).collection("error_notebook").document(notebook_id).set(data, merge=True)


def _learning_progress_ref(user_id: str):
    return get_db().collection("users").document(user_id).collection("learning_progress")


def list_learning_progress(user_id: str) -> list[dict]:
    docs = _learning_progress_ref(user_id).stream()
    rows = [d.to_dict() | {"topic_key": d.id} for d in docs]
    rows.sort(key=lambda row: row.get("updated_at", ""), reverse=True)
    return rows


def set_learning_progress(user_id: str, topic_key: str, updates: dict) -> dict:
    clean = {key: value for key, value in updates.items() if value is not None}
    clean["updated_at"] = datetime.now(timezone.utc).isoformat()
    ref = _learning_progress_ref(user_id).document(topic_key)
    ref.set(clean, merge=True)
    return (ref.get().to_dict() or {}) | {"topic_key": topic_key}

def upsert_user_profile(user_id: str, email: str = "", display_name: str = ""):
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "user_id": user_id,
        "email": email,
        "display_name": display_name,
        "last_active_at": now,
    }
    ref = get_db().collection("users").document(user_id)
    existing = ref.get().to_dict() or {}
    if not existing.get("first_seen_at"):
        data["first_seen_at"] = now
    ref.set(data, merge=True)


def list_user_profiles() -> list[dict]:
    try:
        docs = get_db().collection("users").stream()
        return [d.to_dict() | {"user_id": d.id} for d in docs]
    except Exception as exc:
        print(f"Warning: Failed to list user profiles: {exc}")
        return []


def _count_subcollection(user_id: str, collection_name: str) -> int:
    try:
        return sum(1 for _ in get_db().collection("users").document(user_id).collection(collection_name).stream())
    except Exception:
        return 0


def admin_activity_snapshot(firebase_users: list[dict]) -> dict:
    from datetime import datetime, timezone, timedelta

    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    try:
        profiles = {p["user_id"]: p for p in list_user_profiles()}
    except Exception as exc:
        print(f"Warning: Failed to load user profiles: {exc}")
        profiles = {}

    try:
        community_posts = len(list_community_posts())
    except Exception:
        community_posts = 0

    all_users_map: dict[str, dict] = {}
    for fu in firebase_users:
        uid = fu.get("uid")
        if uid:
            all_users_map[uid] = dict(fu)

    for uid, prof in profiles.items():
        if uid not in all_users_map:
            all_users_map[uid] = {
                "uid": uid,
                "email": prof.get("email", ""),
                "display_name": prof.get("display_name", ""),
                "created_at": prof.get("first_seen_at"),
                "last_sign_in_at": prof.get("last_active_at"),
            }

    def parse_dt(value):
        if not value:
            return None
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None

    active_today = active_7d = active_30d = 0
    new_today = new_7d = new_30d = 0

    for uid, udata in all_users_map.items():
        profile = profiles.get(uid, {})
        created_at = udata.get("created_at") or profile.get("first_seen_at")
        last_active_at = profile.get("last_active_at") or udata.get("last_sign_in_at")

        created_dt = parse_dt(created_at)
        active_dt = parse_dt(last_active_at)
        if created_dt:
            if created_dt.date().isoformat() == today:
                new_today += 1
            if created_dt >= week_ago:
                new_7d += 1
            if created_dt >= month_ago:
                new_30d += 1
        if active_dt:
            if active_dt.date().isoformat() == today:
                active_today += 1
            if active_dt >= week_ago:
                active_7d += 1
            if active_dt >= month_ago:
                active_30d += 1

    sorted_user_items = sorted(
        all_users_map.values(),
        key=lambda u: str(
            profiles.get(u.get("uid", ""), {}).get("last_active_at")
            or u.get("last_sign_in_at")
            or u.get("created_at")
            or ""
        ),
        reverse=True,
    )

    total_documents = total_storage = total_attempts = submitted_attempts = planner_tasks = completed_planner_tasks = 0
    total_daily_messages = total_monthly_tokens = 0
    users = []

    for user in sorted_user_items[:50]:
        uid = user.get("uid", "")
        profile = profiles.get(uid, {})
        created_at = user.get("created_at") or profile.get("first_seen_at")
        last_active_at = profile.get("last_active_at") or user.get("last_sign_in_at")

        doc_count = 0
        storage = 0
        attempts_len = 0
        submitted = 0
        tasks_len = 0
        completed_tasks = 0
        daily_msgs = 0
        monthly_toks = 0

        try:
            db = get_db()
            user_ref = db.collection("users").document(uid)

            # 1. Documents & storage (single stream query)
            try:
                doc_docs = list(user_ref.collection("documents").stream())
                doc_count = len(doc_docs)
                storage = sum((d.to_dict() or {}).get("size_bytes", 0) for d in doc_docs)
            except Exception:
                pass

            # 2. PYQ attempts
            try:
                attempts = list(user_ref.collection("pyq_attempts").stream())
                attempts_len = len(attempts)
                submitted = sum(1 for a in attempts if (a.to_dict() or {}).get("status") == "submitted")
            except Exception:
                pass

            # 3. Planner tasks
            try:
                task_docs = list(user_ref.collection("study_plan_tasks").stream())
                tasks_len = len(task_docs)
                completed_tasks = sum(1 for t in task_docs if (t.to_dict() or {}).get("completed"))
            except Exception:
                pass

            # 4. Usage stats
            try:
                usage_doc = user_ref.collection("stats").document("usage").get()
                usage = usage_doc.to_dict() or {}
                daily_msgs = usage.get("daily_messages", 0)
                monthly_toks = usage.get("monthly_tokens", 0)
            except Exception:
                pass

        except Exception as exc:
            print(f"Warning: could not query subcollections for user {uid}: {exc}")

        total_documents += doc_count
        total_storage += storage
        total_attempts += attempts_len
        submitted_attempts += submitted
        planner_tasks += tasks_len
        completed_planner_tasks += completed_tasks
        total_daily_messages += daily_msgs
        total_monthly_tokens += monthly_toks

        users.append({
            "user_id": uid,
            "email": user.get("email") or profile.get("email", ""),
            "display_name": user.get("display_name") or profile.get("display_name", ""),
            "created_at": created_at,
            "last_active_at": last_active_at,
            "documents": doc_count,
            "storage_bytes": storage,
            "attempts": attempts_len,
            "submitted_attempts": submitted,
            "planner_tasks": tasks_len,
            "completed_planner_tasks": completed_tasks,
            "daily_messages": daily_msgs,
            "monthly_tokens": monthly_toks,
        })

    return {
        "generated_at": now.isoformat(),
        "users": {
            "total": len(all_users_map),
            "tracked_profiles": len(profiles),
            "new_today": new_today,
            "new_7d": new_7d,
            "new_30d": new_30d,
            "active_today": active_today,
            "active_7d": active_7d,
            "active_30d": active_30d,
        },
        "activity": {
            "documents": total_documents,
            "storage_bytes": total_storage,
            "pyq_attempts": total_attempts,
            "submitted_attempts": submitted_attempts,
            "planner_tasks": planner_tasks,
            "completed_planner_tasks": completed_planner_tasks,
            "community_posts": community_posts,
            "daily_messages": total_daily_messages,
            "monthly_tokens": total_monthly_tokens,
        },
        "recent_users": users[:50],
    }


def get_admin_content() -> dict:
    try:
        doc = get_db().collection("admin").document("content").get()
        return doc.to_dict() or {}
    except Exception:
        return {}


def set_admin_content(content: dict):
    try:
        get_db().collection("admin").document("content").set(content, merge=True)
    except Exception:
        pass

def create_community_post(user_id: str, post_id: str, post: dict):
    get_db().collection("community_posts").document(post_id).set(post)


def list_community_posts() -> list[dict]:
    docs = get_db().collection("community_posts").stream()
    posts = [d.to_dict() | {"post_id": d.id} for d in docs]
    posts.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    return posts[:50]


def practice_leaderboard() -> list[dict]:
    rows = []
    try:
        for user_doc in get_db().collection("users").stream():
            uid = user_doc.id
            attempts = list_pyq_attempts(uid)
            best = 0.0
            count = 0
            for attempt in attempts:
                result = attempt.get("result") or {}
                max_marks = result.get("max_marks") or 0
                if max_marks:
                    best = max(best, round(100 * result.get("total_marks", 0) / max_marks, 1))
                    count += 1
            if count:
                rows.append({"user_id": uid[:8], "best_score_percent": best, "attempts": count})
    except Exception:
        return []
    rows.sort(key=lambda row: row["best_score_percent"], reverse=True)
    return rows[:20]

def get_all_documents() -> list[dict]:
    """Return every document across all users â€” used to rebuild FAISS on startup."""
    result = []
    try:
        for user_doc in get_db().collection("users").stream():
            uid = user_doc.id
            for doc in get_db().collection("users").document(uid).collection("documents").stream():
                d = doc.to_dict()
                d["user_id"] = uid
                result.append(d)
    except Exception:
        pass
    return result





