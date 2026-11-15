import random
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/battle", tags=["battle"])

BATTLE_QUESTIONS_POOL: List[Dict[str, Any]] = [
    {
        "id": "bq-1",
        "subject": "Algorithms",
        "question": "What is the worst-case time complexity of QuickSort when the pivot is always chosen as the minimum element?",
        "options": ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
        "correct_index": 1,
        "explanation": "If the chosen pivot is always the extreme (minimum or maximum) element, the recursion tree becomes degenerate with depth n, leading to O(n^2) time complexity."
    },
    {
        "id": "bq-2",
        "subject": "Operating Systems",
        "question": "Which of the following conditions is NOT required for a deadlock to occur in an operating system?",
        "options": ["Mutual exclusion", "Hold and wait", "Preemption allowed", "Circular wait"],
        "correct_index": 2,
        "explanation": "Deadlock requires NO PREEMPTION. If preemption is allowed, resources can be reclaimed to break deadlock cycles."
    },
    {
        "id": "bq-3",
        "subject": "Databases",
        "question": "If every non-trivial functional dependency X -> Y in relation R satisfies that X is a superkey, then R is guaranteed to be in:",
        "options": ["1NF only", "2NF only", "3NF only", "BCNF"],
        "correct_index": 3,
        "explanation": "Boyce-Codd Normal Form (BCNF) strictly requires that for every non-trivial FD X -> Y, the determinant X must be a superkey."
    },
    {
        "id": "bq-4",
        "subject": "Computer Networks",
        "question": "In a Go-Back-N ARQ protocol with an m-bit sequence number field, what is the maximum sender window size?",
        "options": ["2^m", "2^m - 1", "2^(m-1)", "m"],
        "correct_index": 1,
        "explanation": "In Go-Back-N, the sender window size must be at most 2^m - 1 to prevent ambiguity when all ACKs are lost."
    },
    {
        "id": "bq-5",
        "subject": "Theory of Computation",
        "question": "Which of the following languages is NOT Context-Free?",
        "options": ["L = {a^n b^n | n >= 0}", "L = {w w^R | w in {a, b}*}", "L = {a^n b^n c^n | n >= 0}", "L = {a^n b^2n | n >= 0}"],
        "correct_index": 2,
        "explanation": "L = {a^n b^n c^n | n >= 0} requires simultaneously checking counts across three symbols, which cannot be tracked by a single stack Pushdown Automaton. It is Context-Sensitive."
    },
    {
        "id": "bq-6",
        "subject": "Computer Organization",
        "question": "In an instruction pipeline with 5 stages (each taking 10ns), what is the ideal throughput for a sequence of 1000 independent instructions?",
        "options": ["100 MIPS", "10 MIPS", "50 MIPS", "1000 MIPS"],
        "correct_index": 0,
        "explanation": "After the initial fill latency, 1 instruction completes every 10ns (cycle time). Throughput = 1 / 10ns = 100 million instructions per second (100 MIPS)."
    }
]

BOT_PROFILES = [
    {"name": "GATE_Aspirant_Priya", "title": "Mock AIR 48", "accuracy": 0.82, "avg_speed": 6.8},
    {"name": "AlgoMaster_Rohan", "title": "Top 1% Solver", "accuracy": 0.85, "avg_speed": 5.4},
    {"name": "SysEng_Arjun", "title": "GATE Prep Streak 45d", "accuracy": 0.78, "avg_speed": 7.2},
]


class BattleStartResponse(BaseModel):
    match_id: str
    opponent: Dict[str, Any]
    questions: List[Dict[str, Any]]
    time_per_question: int = 20


class BattleSubmitRequest(BaseModel):
    match_id: str
    answers: List[int]  # Selected option indices (-1 for timeout)
    times_seconds: List[float]  # Seconds taken per question


class BattleSubmitResponse(BaseModel):
    match_id: str
    user_score: int
    opponent_score: int
    user_correct_count: int
    opponent_correct_count: int
    winner: str  # "user", "opponent", "tie"
    rating_change: int
    detailed_results: List[Dict[str, Any]]


@router.post("/start", response_model=BattleStartResponse)
async def start_battle_endpoint():
    """Starts a rapid-fire 1v1 GATE CS Speed Battle with simulated opponent."""
    import time
    match_id = f"battle_{int(time.time())}"
    bot = random.choice(BOT_PROFILES)
    questions = random.sample(BATTLE_QUESTIONS_POOL, min(5, len(BATTLE_QUESTIONS_POOL)))

    # Hide correct answers from client payload
    client_questions = []
    for q in questions:
        client_questions.append({
            "id": q["id"],
            "subject": q["subject"],
            "question": q["question"],
            "options": q["options"],
        })

    return BattleStartResponse(
        match_id=match_id,
        opponent=bot,
        questions=client_questions,
        time_per_question=20
    )


@router.post("/submit", response_model=BattleSubmitResponse)
async def submit_battle_endpoint(body: BattleSubmitRequest):
    """Evaluates 1v1 battle results, calculates speed bonuses, and announces winner."""
    questions = BATTLE_QUESTIONS_POOL[:len(body.answers)]
    bot = BOT_PROFILES[0]

    user_score = 0
    opponent_score = 0
    user_correct = 0
    opponent_correct = 0
    details = []

    for i, q in enumerate(questions):
        user_ans = body.answers[i] if i < len(body.answers) else -1
        user_time = body.times_seconds[i] if i < len(body.times_seconds) else 20.0
        is_user_correct = (user_ans == q["correct_index"])

        # Simulated bot answer
        bot_is_correct = random.random() < bot["accuracy"]
        bot_ans = q["correct_index"] if bot_is_correct else (q["correct_index"] + 1) % len(q["options"])
        bot_time = round(random.uniform(bot["avg_speed"] - 1.5, bot["avg_speed"] + 2.0), 1)

        # Points: 100 for correct + up to 50 speed bonus
        user_pts = 0
        if is_user_correct:
            user_correct += 1
            speed_bonus = max(0, int((20.0 - user_time) * 2.5))
            user_pts = 100 + speed_bonus
            user_score += user_pts

        bot_pts = 0
        if bot_is_correct:
            opponent_correct += 1
            bot_speed_bonus = max(0, int((20.0 - bot_time) * 2.5))
            bot_pts = 100 + bot_speed_bonus
            opponent_score += bot_pts

        details.append({
            "question": q["question"],
            "correct_option": q["options"][q["correct_index"]],
            "explanation": q["explanation"],
            "user_correct": is_user_correct,
            "user_time": user_time,
            "opponent_correct": bot_is_correct,
            "opponent_time": bot_time,
            "user_points": user_pts,
            "opponent_points": bot_pts,
        })

    if user_score > opponent_score:
        winner = "user"
        rating_change = +25
    elif opponent_score > user_score:
        winner = "opponent"
        rating_change = -12
    else:
        winner = "tie"
        rating_change = +5

    return BattleSubmitResponse(
        match_id=body.match_id,
        user_score=user_score,
        opponent_score=opponent_score,
        user_correct_count=user_correct,
        opponent_correct_count=opponent_correct,
        winner=winner,
        rating_change=rating_change,
        detailed_results=details
    )
