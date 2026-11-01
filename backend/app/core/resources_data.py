from app.core import firestore_service, pyq_data

BOOK_RECOMMENDATIONS = [
    {"subject": "Algorithms", "title": "Introduction to Algorithms", "author": "Cormen, Leiserson, Rivest, Stein", "use_for": "Reference for algorithm design and complexity."},
    {"subject": "Operating Systems", "title": "Operating System Concepts", "author": "Silberschatz, Galvin, Gagne", "use_for": "Process, memory, scheduling, and file-system fundamentals."},
    {"subject": "Databases", "title": "Database System Concepts", "author": "Silberschatz, Korth, Sudarshan", "use_for": "Relational model, SQL, transactions, indexing, and normalization."},
    {"subject": "Computer Networks", "title": "Computer Networking: A Top-Down Approach", "author": "Kurose and Ross", "use_for": "Layer-wise protocol understanding and network numericals."},
    {"subject": "Theory of Computation", "title": "Introduction to Automata Theory, Languages, and Computation", "author": "Hopcroft, Motwani, Ullman", "use_for": "Automata, grammars, decidability, and reductions."},
]
FORMULA_SHEETS = [
    {
        "subject": "Engineering Mathematics",
        "chapter": "Discrete Mathematics",
        "formulas": [
            "Number of edges in complete graph K_n = n(n-1)/2.",
            "Handshaking lemma: sum of degrees = 2|E|.",
            "Euler formula for connected planar graph: V - E + F = 2.",
            "Number of onto functions can be counted using inclusion-exclusion.",
        ],
    },
    {
        "subject": "Algorithms",
        "chapter": "Asymptotic Analysis",
        "formulas": [
            "Master theorem: T(n)=aT(n/b)+f(n). Compare f(n) with n^(log_b a).",
            "Binary heap build time is O(n); insert/delete are O(log n).",
            "Dijkstra with binary heap: O((V+E) log V).",
            "Floyd-Warshall all-pairs shortest path: O(V^3).",
        ],
    },
    {
        "subject": "Operating Systems",
        "chapter": "CPU Scheduling and Memory",
        "formulas": [
            "Turnaround time = completion time - arrival time.",
            "Waiting time = turnaround time - burst time.",
            "Effective access time = hit ratio * cache/TLB path + miss ratio * miss path.",
            "Page fault service time dominates EAT when fault rate is non-trivial.",
        ],
    },
    {
        "subject": "Computer Networks",
        "chapter": "Performance",
        "formulas": [
            "Transmission delay = packet size / bandwidth.",
            "Propagation delay = distance / propagation speed.",
            "Throughput for sliding window is bounded by window size / RTT.",
            "Subnet host count = 2^(host bits) - 2 for traditional IPv4 subnets.",
        ],
    },
    {
        "subject": "Databases",
        "chapter": "Transactions and Normalization",
        "formulas": [
            "Conflict serializability can be checked using an acyclic precedence graph.",
            "BCNF condition: for every non-trivial FD X -> Y, X must be a superkey.",
            "Lossless join for R split into R1,R2 requires (R1 intersection R2) -> R1 or R2.",
            "Candidate keys are minimal superkeys.",
        ],
    },
]

CHEAT_SHEETS = [
    {
        "subject": "Programming and Data Structures",
        "chapter": "Trees and Hashing",
        "points": [
            "BST inorder traversal gives sorted order.",
            "AVL balance factor must stay in {-1, 0, 1}.",
            "Open addressing needs probing; chaining keeps buckets as lists.",
            "Stack fits DFS/recursion, queue fits BFS/level order.",
        ],
    },
    {
        "subject": "Theory of Computation",
        "chapter": "Automata and Decidability",
        "points": [
            "DFA and NFA recognize exactly regular languages.",
            "Regular languages are closed under union, intersection, complement, and difference.",
            "CFGs are closed under union and concatenation, not generally under intersection/complement.",
            "Undecidable problems often reduce from HALT or PCP.",
        ],
    },
    {
        "subject": "Computer Organization and Architecture",
        "chapter": "Pipelining and Cache",
        "points": [
            "Speedup is limited by stalls, hazards, and pipeline fill/drain time.",
            "Direct mapped cache index selects exactly one line.",
            "Set associative cache reduces conflict misses at extra comparison cost.",
            "CPI = ideal CPI + stall cycles per instruction.",
        ],
    },
    {
        "subject": "Compiler Design",
        "chapter": "Parsing",
        "points": [
            "FIRST tells what can begin a string; FOLLOW tells what can appear after a non-terminal.",
            "LL parsers are top-down; LR parsers are bottom-up.",
            "Left recursion blocks naive recursive-descent parsing.",
            "Ambiguous grammars can have multiple parse trees for one string.",
        ],
    },
]

SHORT_TRICKS = [
    {
        "subject": "General Aptitude",
        "title": "Eliminate Extreme Options",
        "trick": "For ratio, percentage, and approximation questions, first remove options with impossible scale before calculating fully.",
        "example": "If a 10% increase is asked, answers showing a 2x change are almost certainly invalid.",
    },
    {
        "subject": "Algorithms",
        "title": "Nested Loop Bound Check",
        "trick": "If the inner loop doubles or halves, think logarithmic even when it is nested.",
        "example": "for i in 1..n, for j=1; j<n; j*=2 gives O(n log n).",
    },
    {
        "subject": "Digital Logic",
        "title": "K-map Group Size",
        "trick": "Always group 1, 2, 4, 8, ... cells and make groups as large as possible before writing terms.",
        "example": "A group of 4 removes two variables from the minterm expression.",
    },
    {
        "subject": "Computer Networks",
        "title": "Delay Units First",
        "trick": "Convert packet size and bandwidth to matching bits/seconds before doing delay arithmetic.",
        "example": "1 KB at 1 Mbps is about 8 ms if KB is treated as 1000 bytes.",
    },
    {
        "subject": "Databases",
        "title": "Key Closure Habit",
        "trick": "For FD questions, compute attribute closure before guessing normal form or candidate keys.",
        "example": "If A+ contains all attributes and no subset does, A is a candidate key.",
    },
]


def pyq_solutions(subject: str = "", chapter: str = "", topic: str = "", limit: int = 80) -> list[dict]:
    rows = []
    for q in pyq_data.all_questions_pool():
        if subject and q.get("subject") != subject:
            continue
        if chapter and q.get("chapter") != chapter:
            continue
        if topic and q.get("topic") != topic:
            continue
        paper_id = q["paper_id"]
        rows.append({
            "paper_id": paper_id,
            "paper_title": pyq_data.PAPERS[paper_id]["title"],
            "question_id": q["question_id"],
            "subject": q.get("subject"),
            "chapter": q.get("chapter"),
            "topic": q.get("topic"),
            "difficulty": q.get("difficulty"),
            "question_type": q["question_type"],
            "marks": q["marks"],
            "question": q["question"],
            "options": q.get("options"),
            "image_url": q.get("image_url"),
            "correct_answer": q["correct_answer"],
            "explanation": q.get("explanation"),
            "solution_steps": q.get("solution_steps"),
        })
    return rows[:max(1, min(limit, 200))]


def _notebook_id(attempt_id: str, question_id: str) -> str:
    return f"{attempt_id}:{question_id}"


def error_notebook(user_id: str | None = None) -> list[dict]:
    if not user_id:
        return []
    statuses = firestore_service.get_error_notebook_statuses(user_id)
    items = []
    for attempt in firestore_service.list_pyq_attempts(user_id):
        result = attempt.get("result") or {}
        for q in result.get("questions", []):
            if q.get("status") != "incorrect":
                continue
            notebook_id = _notebook_id(attempt["attempt_id"], q["question_id"])
            state = statuses.get(notebook_id, {})
            resolved = bool(state.get("resolved", False))
            items.append({
                "notebook_id": notebook_id,
                "attempt_id": attempt["attempt_id"],
                "paper_id": result.get("paper_id") or attempt.get("paper_id", ""),
                "paper_title": result.get("paper_title") or attempt.get("paper_title", "Practice"),
                "submitted_at": result.get("submitted_at") or attempt.get("submitted_at", ""),
                "question_id": q["question_id"],
                "subject": q.get("subject"),
                "chapter": q.get("chapter"),
                "topic": q.get("topic"),
                "difficulty": q.get("difficulty"),
                "question_type": q["question_type"],
                "marks": q["marks"],
                "marks_awarded": q.get("marks_awarded", 0),
                "time_spent_seconds": q.get("time_spent_seconds", 0),
                "question": q["question"],
                "options": q.get("options"),
                "image_url": q.get("image_url"),
                "given_answer": q.get("given_answer"),
                "correct_answer": q.get("correct_answer"),
                "explanation": q.get("explanation"),
                "solution_steps": q.get("solution_steps"),
                "resolved": resolved,
                "status": "resolved" if resolved else "needs_revision",
                "note": state.get("note", ""),
            })
    items.sort(key=lambda item: (item["resolved"], item["submitted_at"]), reverse=False)
    return items


def resource_defaults() -> dict:
    return {
        "book_recommendations": BOOK_RECOMMENDATIONS,
        "formula_sheets": FORMULA_SHEETS,
        "cheat_sheets": CHEAT_SHEETS,
        "short_tricks": SHORT_TRICKS,
    }


def resource_content() -> dict:
    admin = firestore_service.get_admin_content()
    defaults = resource_defaults()
    return {
        "book_recommendations": admin.get("book_recommendations") or defaults["book_recommendations"],
        "formula_sheets": admin.get("formula_sheets") or defaults["formula_sheets"],
        "cheat_sheets": admin.get("cheat_sheets") or defaults["cheat_sheets"],
        "short_tricks": admin.get("short_tricks") or defaults["short_tricks"],
    }


def resources_summary(user_id: str | None = None) -> dict:
    content = resource_content()
    return {
        "pyq_solutions": pyq_solutions(limit=80),
        **content,
        "error_notebook": error_notebook(user_id),
    }
