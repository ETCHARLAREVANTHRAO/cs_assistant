import random
import uuid

from app.core import pyq_data

DAILY_COUNT = 10
_MINUTES_PER_QUESTION = 1.8  # rough GATE pacing, mirrors the real exam average


def minutes_for(count: int) -> int:
    return max(10, round(count * _MINUTES_PER_QUESTION))


def filter_pool(
    subjects: list[str] | None = None,
    chapters: list[str] | None = None,
    topics: list[str] | None = None,
    sections: list[str] | None = None,
    difficulty: list[str] | None = None,
    question_types: list[str] | None = None,
) -> list[dict]:
    pool = pyq_data.all_questions_pool()
    subjects = subjects or []
    chapters = chapters or []
    topics = topics or []
    sections = sections or []
    difficulty = difficulty or []
    question_types = question_types or []

    if subjects:
        pool = [q for q in pool if q.get("subject") in subjects]
    if chapters:
        pool = [q for q in pool if q.get("chapter") in chapters]
    if topics:
        pool = [q for q in pool if q.get("topic") in topics]
    if sections:
        pool = [q for q in pool if q["section"] in sections or q["section_title"] in sections]
    if difficulty:
        pool = [q for q in pool if q.get("difficulty") in difficulty]
    if question_types:
        pool = [q for q in pool if q.get("question_type") in question_types]
    return pool


def build_practice_session(
    subjects: list[str],
    chapters: list[str],
    topics: list[str],
    sections: list[str],
    difficulty: list[str],
    question_types: list[str],
    count: int,
) -> tuple[str, list[dict]]:
    pool = filter_pool(subjects, chapters, topics, sections, difficulty, question_types)
    if not pool:
        raise ValueError("No questions match the selected filters.")
    count = max(1, min(count, len(pool)))
    selected = random.sample(pool, count)
    session_id = f"PRACTICE-{uuid.uuid4().hex[:10]}"
    return session_id, selected


def build_daily_session(date_key: str) -> tuple[str, list[dict]]:
    """Deterministic per-day question set, same for every user, changes at UTC midnight."""
    pool = pyq_data.all_questions_pool()
    count = min(DAILY_COUNT, len(pool))
    selected = random.Random(date_key).sample(pool, count)
    session_id = f"DAILY-{date_key}"
    return session_id, selected


def question_refs(questions: list[dict]) -> list[dict]:
    return [{"paper_id": q["paper_id"], "question_id": q["question_id"]} for q in questions]


def resolve_questions(refs: list[dict]) -> list[dict]:
    return [pyq_data.get_question(r["paper_id"], r["question_id"]) for r in refs]