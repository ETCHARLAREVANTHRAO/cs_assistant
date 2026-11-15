from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.auth import optional_verify_token

router = APIRouter(prefix="/flashcards", tags=["flashcards"])

GATE_FLASHCARD_DECKS: List[Dict[str, Any]] = [
    {
        "deck_id": "os_core",
        "subject": "Operating Systems",
        "title": "Virtual Memory, Deadlocks & Scheduling",
        "icon": "memory",
        "color": "from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        "cards": [
            {
                "id": "os-1",
                "front": "What are the four necessary and sufficient conditions for a Deadlock to occur?",
                "back": "1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait (All four must hold simultaneously).",
                "exam_trap": "Banker's Algorithm avoids deadlocks by ensuring the system never enters an unsafe state, but an unsafe state is NOT necessarily a deadlock.",
                "formula": "Available >= Need_i"
            },
            {
                "id": "os-2",
                "front": "How does Effective Memory Access Time (EMAT) calculate with a 2-level page table and TLB?",
                "back": "EMAT = h * (t_tlb + m) + (1 - h) * (t_tlb + 2*m + m)\nwhere h = TLB hit ratio, t_tlb = TLB lookup time, m = main memory access time.",
                "exam_trap": "Remember that page table lookups access main memory. With 2-level paging, a TLB miss costs 2 memory lookups + 1 data lookup = 3 memory accesses.",
                "formula": "EMAT = t_tlb + m + (1-h) * (k * m)"
            },
            {
                "id": "os-3",
                "front": "What is Belady's Anomaly and which page replacement algorithm experiences it?",
                "back": "Belady's Anomaly occurs when allocating more page frames results in MORE page faults. It occurs in FIFO page replacement.",
                "exam_trap": "Stack algorithms like LRU and Optimal page replacement NEVER suffer from Belady's Anomaly.",
                "formula": "Faults(N+1) > Faults(N) for FIFO"
            },
            {
                "id": "os-4",
                "front": "Explain the difference between Preemptive and Non-Preemptive SJF (Shortest Job First).",
                "back": "Non-preemptive SJF lets the running process complete its CPU burst. Preemptive SJF (Shortest Remaining Time First - SRTF) preempts the running process if a newly arrived process has a shorter remaining burst.",
                "exam_trap": "SRTF is provably optimal for minimizing average waiting time among all scheduling algorithms.",
                "formula": "Optimal Average Waiting Time = SRTF"
            }
        ]
    },
    {
        "deck_id": "algo_ds",
        "subject": "Algorithms & Data Structures",
        "title": "Asymptotic Analysis, Trees & Graphs",
        "icon": "account_tree",
        "color": "from-blue-500/10 to-cyan-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
        "cards": [
            {
                "id": "algo-1",
                "front": "State the three cases of Master Theorem for recurrence T(n) = a*T(n/b) + Theta(n^k * log^p n).",
                "back": "Compare log_b(a) with k:\n1. If log_b(a) > k => T(n) = Theta(n^(log_b a))\n2. If log_b(a) == k:\n   - if p > -1 => T(n) = Theta(n^k * log^(p+1) n)\n   - if p == -1 => Theta(n^k * log log n)\n3. If log_b(a) < k => T(n) = Theta(n^k * log^p n)",
                "exam_trap": "If a is not constant or b < 1, Master Theorem does not apply. Use the recursion tree method.",
                "formula": "log_b(a) vs k"
            },
            {
                "id": "algo-2",
                "front": "What is the time complexity of Dijkstra's Algorithm using (a) Array, (b) Binary Min-Heap, (c) Fibonacci Heap?",
                "back": "(a) Array: O(V^2)\n(b) Binary Min-Heap: O((V + E) log V)\n(c) Fibonacci Heap: O(E + V log V)",
                "exam_trap": "Dijkstra fails on graphs with negative edge weights! Use Bellman-Ford (O(V*E)) instead.",
                "formula": "O(E + V log V)"
            },
            {
                "id": "algo-3",
                "front": "What is the maximum number of nodes in an AVL tree of height h?",
                "back": "N_max(h) = 2^(h+1) - 1 (perfect binary tree). Minimum nodes N_min(h) = N_min(h-1) + N_min(h-2) + 1 (Fibonacci-like).",
                "exam_trap": "Height of single node = 0. Maximum height for N nodes is approximately 1.44 * log_2(N).",
                "formula": "N_min(h) = F_{h+3} - 1"
            }
        ]
    },
    {
        "deck_id": "dbms_core",
        "subject": "Databases (DBMS)",
        "title": "Normalization, Transactions & Indexing",
        "icon": "database",
        "color": "from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
        "cards": [
            {
                "id": "dbms-1",
                "front": "State the conditions for a relation R with FDs to be in 3NF versus BCNF.",
                "back": "For every non-trivial FD X -> Y:\n• BCNF: X must be a Super Key.\n• 3NF: Either X is a Super Key OR Y is a Prime Attribute (part of any candidate key).",
                "exam_trap": "BCNF is strictly stronger than 3NF. A dependency-preserving lossless decomposition is ALWAYS achievable in 3NF, but NOT always in BCNF.",
                "formula": "BCNF subset 3NF subset 2NF subset 1NF"
            },
            {
                "id": "dbms-2",
                "front": "What is the test for Conflict Serializability of a schedule?",
                "back": "Construct a Precedence (Serialization) Graph where nodes are transactions. Draw edge Ti -> Tj if Ti executes an operation that conflicts with Tj and Ti comes first. The schedule is conflict serializable IF AND ONLY IF the graph has NO CYCLES.",
                "exam_trap": "Conflict serializable implies View serializable, but View serializable does NOT require conflict serializability.",
                "formula": "Acyclic Precedence Graph <=> Conflict Serializable"
            }
        ]
    },
    {
        "deck_id": "cn_core",
        "subject": "Computer Networks",
        "title": "Subnetting, TCP/IP & Flow Control",
        "icon": "lan",
        "color": "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        "cards": [
            {
                "id": "cn-1",
                "front": "What is the formula for link utilization in Stop-and-Wait and Sliding Window (Go-Back-N)?",
                "back": "• Stop-and-Wait: U = 1 / (1 + 2*a), where a = T_prop / T_trans\n• Sliding Window (Window size W): U = W / (1 + 2*a) (capped at 100% when W >= 1 + 2*a).",
                "exam_trap": "T_prop = Distance / Propagation_Speed; T_trans = Packet_Size / Bandwidth. Always convert bits and bytes carefully!",
                "formula": "W_optimal = 1 + 2 * (T_prop / T_trans)"
            },
            {
                "id": "cn-2",
                "front": "What are the minimum and maximum sequence numbers needed for Go-Back-N and Selective Repeat?",
                "back": "• Go-Back-N (Window W): Min sequence numbers = W + 1 (Sender window = W, Receiver window = 1).\n• Selective Repeat (Window W): Min sequence numbers = 2 * W (Sender window = W, Receiver window = W).",
                "exam_trap": "If k bits are used for sequence numbers, Max sender window in Selective Repeat is 2^(k-1).",
                "formula": "Seq_SR = 2 * W_s"
            }
        ]
    }
]


class Sm2CalculateRequest(BaseModel):
    card_id: str
    rating: int  # 0: Again, 1: Hard, 2: Good, 3: Easy
    reps: int = 0
    interval_days: int = 1
    ease_factor: float = 2.5


class Sm2CalculateResponse(BaseModel):
    card_id: str
    reps: int
    interval_days: int
    ease_factor: float
    next_review_iso: str


@router.get("/decks")
async def list_decks(user_id: Optional[str] = Depends(optional_verify_token)):
    """Returns curated GATE CS flashcard decks with formulas and exam traps."""
    return {"decks": GATE_FLASHCARD_DECKS}


@router.post("/review", response_model=Sm2CalculateResponse)
async def review_card_endpoint(body: Sm2CalculateRequest):
    """
    Computes updated interval and ease factor according to the SuperMemo-2 (SM-2) algorithm.
    Rating mapping:
      0 (Again): Fail, reset interval to 1
      1 (Hard): Pass with effort, interval * 1.2
      2 (Good): Pass normal, interval * ease_factor
      3 (Easy): Pass rapid, interval * ease_factor * 1.3
    """
    q = body.rating + 2  # Map 0..3 to SM-2 quality 2..5
    reps = body.reps
    interval = body.interval_days
    ef = body.ease_factor

    if q >= 3:
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            if body.rating == 1:  # Hard
                interval = max(1, int(interval * 1.2))
            elif body.rating == 3:  # Easy
                interval = max(1, int(interval * ef * 1.3))
            else:  # Good
                interval = max(1, int(interval * ef))
        reps += 1
    else:
        reps = 0
        interval = 1

    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ef = max(1.3, ef)

    next_date = datetime.now(timezone.utc) + timedelta(days=interval)

    return Sm2CalculateResponse(
        card_id=body.card_id,
        reps=reps,
        interval_days=interval,
        ease_factor=round(ef, 2),
        next_review_iso=next_date.isoformat()
    )
