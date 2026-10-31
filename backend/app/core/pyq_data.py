import json
import os

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "gate_pyqs")

# Static registry — the source JSON files carry no exam-level metadata
# (duration, paper title), so it's declared here per paper.
PAPERS = {
    "GATECSE2026S1": {
        "title": "GATE CS 1 — Computer Science and Information Technology Mock",
        "year": 2026,
        "shift": 1,
        "duration_minutes": 180,
        "asset_folder": "gate2026_s1",
        "json_file": "gate2026_s1/CS1_2026_S1.json",
        "section_titles": {"GA": "General Aptitude", "CS-1": "CS 1 Computer Science and Information Technology"},
    },
    "GATECSE2026S2": {
        "title": "GATE CS 2 — Computer Science and Information Technology Mock",
        "year": 2026,
        "shift": 2,
        "duration_minutes": 180,
        "asset_folder": "gate2026_s2",
        "json_file": "gate2026_s2/CS2_2026_S2.json",
        "section_titles": {"GA": "General Aptitude", "CS-2": "CS 2 Computer Science and Information Technology"},
    },
    "GATECSE2025S1": {
        "title": "GATE CS 1 2025 — Computer Science and Information Technology Mock",
        "year": 2025,
        "shift": 1,
        "duration_minutes": 180,
        "asset_folder": "gate2025_s1",
        "json_file": "gate2025_s1/CS1_2025_S1.json",
        "section_titles": {"GA": "General Aptitude", "CS-1": "CS 1 Computer Science and Information Technology"},
    },
    "GATECSE2025S2": {
        "title": "GATE CS 2 2025 — Computer Science and Information Technology Mock",
        "year": 2025,
        "shift": 2,
        "duration_minutes": 180,
        "asset_folder": "gate2025_s2",
        "json_file": "gate2025_s2/CS2_2025_S2.json",
        "section_titles": {"GA": "General Aptitude", "CS-2": "CS 2 Computer Science and Information Technology"},
    },
    "GATECSE2024S1": {
        "title": "GATE CS 1 2024 - Computer Science and Information Technology Mock",
        "year": 2024,
        "shift": 1,
        "duration_minutes": 180,
        "asset_folder": "gate2024_s1",
        "json_file": "gate2024_s1/CS1_2024_S1.json",
        "section_titles": {"GA": "General Aptitude", "CS-1": "CS 1 Computer Science and Information Technology"},
    },
    "GATECSE2024S2": {
        "title": "GATE CS 2 2024 - Computer Science and Information Technology Mock",
        "year": 2024,
        "shift": 2,
        "duration_minutes": 180,
        "asset_folder": "gate2024_s2",
        "json_file": "gate2024_s2/CS2_2024_S2.json",
        "section_titles": {"GA": "General Aptitude", "CS-2": "CS 2 Computer Science and Information Technology"},
    },
    "GATECSE2023S1": {
        "title": "GATE CS 2023 - Computer Science and Information Technology Mock",
        "year": 2023,
        "shift": 1,
        "duration_minutes": 180,
        "asset_folder": "gate2023_s1",
        "json_file": "gate2023_s1/CS1_2023_S1.json",
        "section_titles": {"GA": "General Aptitude", "CS-1": "Computer Science and Information Technology"},
    },
    "GATECSE2021S2": {
        "title": "GATE CS 2021 Set 2 - Computer Science and Information Technology Mock",
        "year": 2021,
        "shift": 2,
        "duration_minutes": 180,
        "asset_folder": "gate2021_s2",
        "json_file": "gate2021_s2/CS2_2021_S2.json",
        "section_titles": {"GA": "General Aptitude", "CS-2": "Computer Science and Information Technology"},
    },
    "GATECSE2017S1": {
        "title": "GATE CS 2017 Set 1 - Computer Science and Information Technology Mock",
        "year": 2017,
        "shift": 1,
        "duration_minutes": 180,
        "asset_folder": "gate2017_s1",
        "json_file": "gate2017_s1/CS1_2017_S1.json",
        "section_titles": {"GA": "General Aptitude", "CS-1": "Computer Science and Information Technology"},
    },
    "GATECSE2012S1": {
        "title": "GATE CS 2012 - Computer Science and Information Technology Mock",
        "year": 2012,
        "shift": 1,
        "duration_minutes": 180,
        "asset_folder": "gate2012_s1",
        "json_file": "gate2012_s1/CS1_2012_S1.json",
        "section_titles": {"GA": "General Aptitude", "CS-1": "Computer Science and Information Technology"},
    },
}

_cache: dict[str, list[dict]] = {}


def _is_asset_path(value) -> bool:
    return isinstance(value, str) and value.startswith("images/")


def _resolve_asset(asset_folder: str, value):
    if _is_asset_path(value):
        return f"/pyq-assets/{asset_folder}/{value}"
    return value


def _load_raw(paper_id: str) -> list[dict]:
    if paper_id not in PAPERS:
        raise KeyError(paper_id)
    if paper_id not in _cache:
        path = os.path.join(_DATA_DIR, PAPERS[paper_id]["json_file"])
        with open(path, encoding="utf-8") as f:
            _cache[paper_id] = json.load(f)
    return _cache[paper_id]


def _with_resolved_assets(paper_id: str, question: dict) -> dict:
    meta = PAPERS[paper_id]
    q = dict(question)
    q["image_url"] = _resolve_asset(meta["asset_folder"], q.get("image_url"))
    if q.get("options"):
        q["options"] = {k: _resolve_asset(meta["asset_folder"], v) for k, v in q["options"].items()}
    q["section_title"] = meta["section_titles"].get(q["section"], q["section"])
    return q


def _section_summary(paper_id: str, questions: list[dict]) -> list[dict]:
    titles = PAPERS[paper_id]["section_titles"]
    order: list[str] = []
    totals: dict[str, dict] = {}
    for q in questions:
        section = q["section"]
        if section not in totals:
            totals[section] = {
                "section": section,
                "section_title": titles.get(section, section),
                "question_count": 0,
                "total_marks": 0.0,
            }
            order.append(section)
        totals[section]["question_count"] += 1
        totals[section]["total_marks"] += q["marks"]
    return [totals[s] for s in order]


def paper_summary(paper_id: str) -> dict:
    meta = PAPERS[paper_id]
    questions = _load_raw(paper_id)
    return {
        "paper_id": paper_id,
        "title": meta["title"],
        "year": meta["year"],
        "shift": meta["shift"],
        "duration_minutes": meta["duration_minutes"],
        "total_questions": len(questions),
        "total_marks": sum(q["marks"] for q in questions),
        "sections": _section_summary(paper_id, questions),
    }


def list_papers() -> list[dict]:
    return [paper_summary(pid) for pid in PAPERS]


def paper_detail_public(paper_id: str) -> dict:
    """Full paper + questions with correct_answer/explanation/solution_steps/topic/difficulty
    stripped out — safe to send to the client before/during an attempt."""
    summary = paper_summary(paper_id)
    hidden = {"correct_answer", "explanation", "solution_steps", "topic", "difficulty", "year", "shift"}
    questions = [
        {k: v for k, v in _with_resolved_assets(paper_id, q).items() if k not in hidden}
        for q in _load_raw(paper_id)
    ]
    summary["questions"] = questions
    return summary


def full_questions(paper_id: str) -> list[dict]:
    """Full questions (answers + explanations included) with assets resolved — used for scoring
    and post-submission solution review only, never sent to the client before submit."""
    return [_with_resolved_assets(paper_id, q) for q in _load_raw(paper_id)]


def get_question(paper_id: str, question_id: str) -> dict:
    """A single fully-resolved question (with correct_answer etc.) tagged with its origin paper_id
    — used to reconstruct practice/daily sessions from stored question_refs for scoring."""
    for q in full_questions(paper_id):
        if q["question_id"] == question_id:
            return {**q, "paper_id": paper_id}
    raise KeyError(f"{question_id} not found in {paper_id}")


def all_questions_pool() -> list[dict]:
    """Every question across every paper, tagged with its origin paper_id — the source pool for
    topic/section-filtered practice sessions and cross-paper topic-frequency stats."""
    return [{**q, "paper_id": pid} for pid in PAPERS for q in full_questions(pid)]


def topic_frequency() -> list[dict]:
    """Question count + total marks per topic across the whole PYQ bank, most-asked first."""
    counts: dict[str, dict] = {}
    for q in all_questions_pool():
        topic = q.get("topic") or "Uncategorized"
        entry = counts.setdefault(topic, {"topic": topic, "question_count": 0, "total_marks": 0.0})
        entry["question_count"] += 1
        entry["total_marks"] += q["marks"]
    return sorted(counts.values(), key=lambda e: e["question_count"], reverse=True)




def _count_options(questions: list[dict], key: str) -> list[dict]:
    counts: dict[str, int] = {}
    for q in questions:
        value = q.get(key) or "Uncategorized"
        counts[value] = counts.get(value, 0) + 1
    return [
        {"name": name, "question_count": counts[name]}
        for name in sorted(counts, key=lambda n: (-counts[n], n))
    ]


def practice_taxonomy() -> dict:
    """Build subject/chapter/topic/difficulty filters directly from the PYQ JSON bank."""
    questions = all_questions_pool()

    chapter_counts: dict[tuple[str, str], int] = {}
    topic_counts: dict[tuple[str, str, str], int] = {}
    for q in questions:
        subject = q.get("subject") or "Uncategorized"
        chapter = q.get("chapter") or "Uncategorized"
        topic = q.get("topic") or "Uncategorized"
        chapter_key = (subject, chapter)
        topic_key = (subject, chapter, topic)
        chapter_counts[chapter_key] = chapter_counts.get(chapter_key, 0) + 1
        topic_counts[topic_key] = topic_counts.get(topic_key, 0) + 1

    return {
        "subjects": _count_options(questions, "subject"),
        "chapters": [
            {"subject": subject, "name": chapter, "question_count": count}
            for (subject, chapter), count in sorted(chapter_counts.items(), key=lambda item: (item[0][0], item[0][1]))
        ],
        "topics": [
            {"subject": subject, "chapter": chapter, "name": topic, "question_count": count}
            for (subject, chapter, topic), count in sorted(topic_counts.items(), key=lambda item: (item[0][0], item[0][1], item[0][2]))
        ],
        "difficulty": _count_options(questions, "difficulty"),
        "question_types": _count_options(questions, "question_type"),
    }

def _generic_section_summary(questions: list[dict]) -> list[dict]:
    order: list[str] = []
    totals: dict[str, dict] = {}
    for q in questions:
        section = q["section"]
        if section not in totals:
            totals[section] = {
                "section": section, "section_title": q["section_title"],
                "question_count": 0, "total_marks": 0.0,
            }
            order.append(section)
        totals[section]["question_count"] += 1
        totals[section]["total_marks"] += q["marks"]
    return [totals[s] for s in order]


def public_view(question: dict) -> dict:
    """Strip answer/explanation/origin fields from an already-resolved pool question —
    the practice/daily equivalent of paper_detail_public's per-question redaction."""
    hidden = {"correct_answer", "explanation", "solution_steps", "topic", "difficulty", "year", "shift", "paper_id"}
    return {k: v for k, v in question.items() if k not in hidden}


def build_session_paper(session_id: str, title: str, questions: list[dict], duration_minutes: int) -> dict:
    """Wraps an ad-hoc question list (practice or daily) in the same shape as a real PYQ paper so
    the existing exam player / result / solution-review screens work unmodified."""
    return {
        "paper_id": session_id,
        "title": title,
        "year": 0,
        "shift": 0,
        "duration_minutes": duration_minutes,
        "total_questions": len(questions),
        "total_marks": sum(q["marks"] for q in questions),
        "sections": _generic_section_summary(questions),
        "questions": [public_view(q) for q in questions],
    }
