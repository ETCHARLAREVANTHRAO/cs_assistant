from app.core import firestore_service


def _bump(buckets: dict, key: str, q: dict):
    b = buckets.setdefault(
        key,
        {
            "key": key,
            "attempted": 0,
            "correct": 0,
            "incorrect": 0,
            "unattempted": 0,
            "total_time_seconds": 0,
        },
    )
    q_time = max(0, int(q.get("time_spent_seconds", 0) or 0))
    b["total_time_seconds"] += q_time
    if q["status"] == "unattempted":
        b["unattempted"] += 1
    else:
        b["attempted"] += 1
        b[q["status"]] += 1


def _finalize(buckets: dict) -> list[dict]:
    out = []
    for b in buckets.values():
        accuracy = round(100 * b["correct"] / b["attempted"], 1) if b["attempted"] else 0.0
        avg_time = round(b["total_time_seconds"] / b["attempted"], 1) if b["attempted"] else 0.0
        out.append({**b, "accuracy": accuracy, "avg_time_seconds": avg_time})
    out.sort(key=lambda b: b["attempted"], reverse=True)
    return out


def _rank_prediction(overall_accuracy: float, score_percent: float) -> str:
    signal = max(overall_accuracy, score_percent)
    if signal >= 85:
        return "Excellent: likely top-tier if maintained in full-length mocks."
    if signal >= 70:
        return "Strong: competitive range, focus on reducing avoidable mistakes."
    if signal >= 50:
        return "Building: clear upside, prioritize weak subjects and timed drills."
    return "Foundation: focus on concept coverage and short accuracy-first practice."


def _percentile_prediction(overall_accuracy: float, score_percent: float) -> float:
    signal = max(overall_accuracy, score_percent)
    return round(min(99.5, max(5.0, 35 + signal * 0.65)), 1)


def _study_plan(weak_topics: list[dict], weak_subjects: list[dict], time_summary: dict) -> list[str]:
    plan = []
    for item in weak_subjects[:2]:
        plan.append(f"Revise {item['key']} and attempt a 15-question subject drill.")
    for item in weak_topics[:3]:
        plan.append(f"Practice {item['key']} until accuracy crosses 70%.")
    if time_summary["overtime_questions"]:
        plan.append("Do one timed mixed set and cap each question near the GATE average pace.")
    if not plan:
        plan.append("Take a mixed practice set to generate more personalized recommendations.")
    return plan[:5]


def compute_analytics(user_id: str) -> dict:
    """Aggregates submitted attempts into topic, subject, chapter, section, difficulty, timing,
    improvement, weak/strong areas, and lightweight rank/study-plan guidance."""
    attempts = firestore_service.list_pyq_attempts(user_id)

    topic_buckets: dict[str, dict] = {}
    subject_buckets: dict[str, dict] = {}
    chapter_buckets: dict[str, dict] = {}
    section_buckets: dict[str, dict] = {}
    difficulty_buckets: dict[str, dict] = {}
    improvement_graph = []
    all_question_times = []
    correct_times = []
    incorrect_times = []
    overtime_questions = 0
    total_marks = total_max = 0.0
    correct = incorrect = unattempted = 0

    for a in reversed(attempts):
        result = a.get("result") or {}
        total_marks += result.get("total_marks", 0)
        total_max += result.get("max_marks", 0)
        attempted_in_result = result.get("correct", 0) + result.get("incorrect", 0)
        accuracy = round(100 * result.get("correct", 0) / attempted_in_result, 1) if attempted_in_result else 0.0
        improvement_graph.append({
            "submitted_at": result.get("submitted_at") or a.get("submitted_at", ""),
            "paper_title": result.get("paper_title") or a.get("paper_title", "Practice"),
            "total_marks": round(result.get("total_marks", 0), 2),
            "max_marks": round(result.get("max_marks", 0), 2),
            "accuracy": accuracy,
        })

        for q in result.get("questions", []):
            _bump(topic_buckets, q.get("topic") or "Uncategorized", q)
            _bump(subject_buckets, q.get("subject") or "Uncategorized", q)
            _bump(chapter_buckets, q.get("chapter") or "Uncategorized", q)
            _bump(section_buckets, q.get("section_title") or q.get("section", "?"), q)
            _bump(difficulty_buckets, q.get("difficulty") or "Unknown", q)

            q_time = max(0, int(q.get("time_spent_seconds", 0) or 0))
            if q_time:
                all_question_times.append(q_time)
                if q_time > 120:
                    overtime_questions += 1
            if q["status"] == "correct":
                correct += 1
                if q_time:
                    correct_times.append(q_time)
            elif q["status"] == "incorrect":
                incorrect += 1
                if q_time:
                    incorrect_times.append(q_time)
            else:
                unattempted += 1

    topics = _finalize(topic_buckets)
    subjects = _finalize(subject_buckets)
    chapters = _finalize(chapter_buckets)
    sections = _finalize(section_buckets)
    difficulty = _finalize(difficulty_buckets)

    scored_topics = [t for t in topics if t["attempted"] >= 2]
    scored_subjects = [s for s in subjects if s["attempted"] >= 2]
    weak = sorted(scored_topics, key=lambda t: (t["accuracy"], -t["attempted"]))[:5]
    strong = sorted(scored_topics, key=lambda t: (t["accuracy"], t["attempted"]), reverse=True)[:5]
    weak_subjects = sorted(scored_subjects, key=lambda s: (s["accuracy"], -s["attempted"]))[:3]

    total_attempted = correct + incorrect
    overall_accuracy = round(100 * correct / total_attempted, 1) if total_attempted else 0.0
    score_percent = round(100 * total_marks / total_max, 1) if total_max else 0.0
    total_time = sum(all_question_times)
    time_summary = {
        "total_time_seconds": total_time,
        "avg_time_per_attempted_seconds": round(total_time / total_attempted, 1) if total_attempted else 0.0,
        "fastest_correct_seconds": min(correct_times) if correct_times else None,
        "slowest_incorrect_seconds": max(incorrect_times) if incorrect_times else None,
        "overtime_questions": overtime_questions,
    }

    return {
        "total_attempts": len(attempts),
        "total_marks": round(total_marks, 2),
        "total_max_marks": round(total_max, 2),
        "overall_accuracy": overall_accuracy,
        "correct": correct,
        "incorrect": incorrect,
        "unattempted": unattempted,
        "topics": topics,
        "subjects": subjects,
        "chapters": chapters,
        "sections": sections,
        "difficulty": difficulty,
        "weak_topics": weak,
        "strong_topics": strong,
        "improvement_graph": improvement_graph[-12:],
        "time_management": time_summary,
        "rank_prediction": _rank_prediction(overall_accuracy, score_percent),
        "personalized_study_plan": _study_plan(weak, weak_subjects, time_summary),
    }