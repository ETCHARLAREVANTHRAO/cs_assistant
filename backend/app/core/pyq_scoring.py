from app.core import pyq_data

# GATE marking scheme:
# MCQ: +marks if selected option matches, negative_marking if wrong, 0 if unattempted.
# MSQ: +marks only for the exact selected set; no negative marking unless encoded in JSON.
# NAT: +marks if numeric answer is within the accepted range; no negative marking unless encoded.


def _parse_nat_range(correct_answer: str) -> tuple[float, float]:
    s = correct_answer.strip()
    lowered = s.lower()
    if " to " in lowered:
        idx = lowered.index(" to ")
        lo = float(s[:idx].strip())
        hi = float(s[idx + 4:].strip())
        return lo, hi
    val = float(s)
    return val, val


def _nat_answer_matches(correct_answer: str, given_val: float) -> bool:
    for part in correct_answer.split(" or "):
        lo, hi = _parse_nat_range(part)
        if lo - 1e-9 <= given_val <= hi + 1e-9:
            return True
    return False


def grade_question(question: dict, given) -> tuple[str, float]:
    """Returns (status, marks_awarded), where status is correct/incorrect/unattempted."""
    qtype = question["question_type"]
    marks = float(question["marks"])
    negative = float(question["negative_marking"])
    correct_answer = question["correct_answer"]

    if isinstance(correct_answer, str) and correct_answer.strip().upper() == "MTA":
        return "correct", marks

    if qtype == "MCQ":
        if not given:
            return "unattempted", 0.0
        return ("correct", marks) if given == correct_answer else ("incorrect", -negative)

    if qtype == "MSQ":
        if not given:
            return "unattempted", 0.0
        given_set = set(given) if isinstance(given, list) else {given}
        correct_set = set(correct_answer) if isinstance(correct_answer, list) else {correct_answer}
        return ("correct", marks) if given_set == correct_set else ("incorrect", -negative)

    if qtype == "NAT":
        if given is None or given == "":
            return "unattempted", 0.0
        try:
            given_val = float(given)
        except (TypeError, ValueError):
            return "incorrect", -negative
        if _nat_answer_matches(correct_answer, given_val):
            return "correct", marks
        return "incorrect", -negative

    raise ValueError(f"Unknown question_type: {qtype}")


def score_attempt(paper_id: str, answers: dict, time_spent_seconds: dict | None = None) -> dict:
    """answers: {question_id: given_answer}. Missing/omitted keys count as unattempted."""
    return score_questions(pyq_data.full_questions(paper_id), answers, time_spent_seconds)


def score_questions(questions: list[dict], answers: dict, time_spent_seconds: dict | None = None) -> dict:
    """Score a real paper or generated practice session and include per-question timing."""
    time_spent_seconds = time_spent_seconds or {}
    section_order: list[str] = []
    section_stats: dict[str, dict] = {}
    question_results = []
    correct = incorrect = unattempted = 0
    total_scored = 0.0
    max_marks = 0.0

    for q in questions:
        section = q["section"]
        given = answers.get(q["question_id"])
        status, awarded = grade_question(q, given)
        q_time = max(0, int(time_spent_seconds.get(q["question_id"], 0) or 0))

        total_scored += awarded
        max_marks += q["marks"]
        if status == "correct":
            correct += 1
        elif status == "incorrect":
            incorrect += 1
        else:
            unattempted += 1

        if section not in section_stats:
            section_stats[section] = {
                "section": section,
                "section_title": q["section_title"],
                "total_questions": 0,
                "time_spent_seconds": 0,
                "attempted": 0,
                "correct": 0,
                "incorrect": 0,
                "unattempted": 0,
                "max_marks": 0.0,
                "marks_scored": 0.0,
            }
            section_order.append(section)
        st = section_stats[section]
        st["total_questions"] += 1
        st["max_marks"] += q["marks"]
        st["marks_scored"] += awarded
        st["time_spent_seconds"] += q_time
        if status == "unattempted":
            st["unattempted"] += 1
        else:
            st["attempted"] += 1
            st[status] += 1

        question_results.append({
            "question_id": q["question_id"],
            "section": section,
            "section_title": q["section_title"],
            "subject": q.get("subject"),
            "chapter": q.get("chapter"),
            "question_type": q["question_type"],
            "marks": q["marks"],
            "negative_marking": q["negative_marking"],
            "given_answer": given,
            "correct_answer": q["correct_answer"],
            "status": status,
            "marks_awarded": round(awarded, 2),
            "time_spent_seconds": q_time,
            "question": q["question"],
            "options": q.get("options"),
            "image_url": q.get("image_url"),
            "explanation": q.get("explanation"),
            "solution_steps": q.get("solution_steps"),
            "topic": q.get("topic"),
            "difficulty": q.get("difficulty"),
        })

    sections = [
        {
            **section_stats[s],
            "max_marks": round(section_stats[s]["max_marks"], 2),
            "marks_scored": round(section_stats[s]["marks_scored"], 2),
        }
        for s in section_order
    ]

    return {
        "total_marks": round(total_scored, 2),
        "max_marks": round(max_marks, 2),
        "correct": correct,
        "incorrect": incorrect,
        "unattempted": unattempted,
        "sections": sections,
        "questions": question_results,
    }
