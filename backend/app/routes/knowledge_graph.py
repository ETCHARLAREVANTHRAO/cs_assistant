import random
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import optional_verify_token

router = APIRouter(prefix="/knowledge-graph", tags=["knowledge-graph"])

class SkillNode(BaseModel):
    id: str
    subject: str
    title: str
    gate_weightage_marks: float
    mastery_level: int # 0 to 100
    status: str # 'mastered' | 'learning' | 'weak'
    prerequisites: List[str]
    sample_subtopics: List[str]

class KnowledgeStatsResponse(BaseModel):
    overall_mastery_percentage: float
    predicted_gate_score: int
    predicted_marks: float
    estimated_air_bracket: str
    critical_weakness_count: int
    strongest_subject: str
    weakest_subject: str

class WeaknessQuestion(BaseModel):
    id: str
    subject: str
    topic: str
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str
    difficulty: str

GATE_SKILL_TREE: List[Dict[str, Any]] = [
    {
        "id": "os_virt_mem",
        "subject": "Operating Systems",
        "title": "Virtual Memory & Paging",
        "gate_weightage_marks": 4.5,
        "mastery_level": 78,
        "status": "mastered",
        "prerequisites": [],
        "sample_subtopics": ["Multi-level Paging", "TLB Hit Ratio", "Inverted Page Tables", "Belady's Anomaly"]
    },
    {
        "id": "os_concurrency",
        "subject": "Operating Systems",
        "title": "Process Synchronization & Semaphores",
        "gate_weightage_marks": 4.0,
        "mastery_level": 52,
        "status": "weak",
        "prerequisites": ["os_virt_mem"],
        "sample_subtopics": ["Binary & Counting Semaphores", "Peterson's Algorithm", "Dining Philosophers", "Deadlock Avoidance"]
    },
    {
        "id": "dsa_dp",
        "subject": "Algorithms",
        "title": "Dynamic Programming & Recurrences",
        "gate_weightage_marks": 5.0,
        "mastery_level": 64,
        "status": "learning",
        "prerequisites": [],
        "sample_subtopics": ["0/1 Knapsack", "Matrix Chain Multiplication", "Longest Common Subsequence", "Optimal Binary Search Trees"]
    },
    {
        "id": "dsa_graphs",
        "subject": "Algorithms",
        "title": "Graph Algorithms & Shortest Paths",
        "gate_weightage_marks": 4.5,
        "mastery_level": 82,
        "status": "mastered",
        "prerequisites": [],
        "sample_subtopics": ["Dijkstra & Bellman Ford", "Floyd Warshall", "Kruskal & Prim MST", "Bipartite Graph & Topological Sort"]
    },
    {
        "id": "dbms_trans",
        "subject": "Databases (DBMS)",
        "title": "Transactions & Concurrency Control",
        "gate_weightage_marks": 4.0,
        "mastery_level": 48,
        "status": "weak",
        "prerequisites": [],
        "sample_subtopics": ["Conflict & View Serializability", "2-Phase Locking (2PL)", "Timestamp Ordering Protocol", "Cascading Aborts"]
    },
    {
        "id": "dbms_norm",
        "subject": "Databases (DBMS)",
        "title": "Normalization & Functional Dependencies",
        "gate_weightage_marks": 3.5,
        "mastery_level": 85,
        "status": "mastered",
        "prerequisites": [],
        "sample_subtopics": ["Canonical Cover", "3NF Synthesis", "BCNF Decomposition", "Lossless Join & Dependency Preservation"]
    },
    {
        "id": "cn_subnet",
        "subject": "Computer Networks",
        "title": "IPv4 / IPv6 Subnetting & CIDR",
        "gate_weightage_marks": 4.5,
        "mastery_level": 88,
        "status": "mastered",
        "prerequisites": [],
        "sample_subtopics": ["Variable Length Subnet Masking", "Supernetting & Routing Aggregation", "Subnet Broadcast Addresses"]
    },
    {
        "id": "cn_tcp",
        "subject": "Computer Networks",
        "title": "Transport Layer & TCP Congestion",
        "gate_weightage_marks": 4.0,
        "mastery_level": 58,
        "status": "learning",
        "prerequisites": ["cn_subnet"],
        "sample_subtopics": ["Slow Start & AIMD", "Go-Back-N vs Selective Repeat", "TCP Window Size & Bandwidth-Delay Product"]
    },
    {
        "id": "toc_reg",
        "subject": "Theory of Computation",
        "title": "Regular Expressions & Finite Automata",
        "gate_weightage_marks": 4.0,
        "mastery_level": 90,
        "status": "mastered",
        "prerequisites": [],
        "sample_subtopics": ["DFA Minimization (Myhill-Nerode)", "Pumping Lemma for Regular Languages", "Closure Properties"]
    },
    {
        "id": "toc_decid",
        "subject": "Theory of Computation",
        "title": "Decidability & Turing Machines",
        "gate_weightage_marks": 3.5,
        "mastery_level": 44,
        "status": "weak",
        "prerequisites": ["toc_reg"],
        "sample_subtopics": ["Halting Problem & Reducibility", "Rice's Theorem Part 1 & 2", "Post Correspondence Problem (PCP)"]
    }
]

WEAKNESS_DRILL_POOL: List[Dict[str, Any]] = [
    {
        "id": "w_q1",
        "subject": "Operating Systems",
        "topic": "Semaphores & Concurrency",
        "question": "A counting semaphore S is initialized to 10. Then 12 P (wait) operations and 5 V (signal) operations are executed on S. What is the final value of S?",
        "options": ["3", "-2", "5", "8"],
        "correct_option_index": 0,
        "explanation": "Initial S = 10. 12 P operations decrease S by 12: 10 - 12 = -2. 5 V operations increase S by 5: -2 + 5 = 3.",
        "difficulty": "Medium"
    },
    {
        "id": "w_q2",
        "subject": "Databases (DBMS)",
        "topic": "Transactions & 2PL",
        "question": "Which of the following guarantees conflict serializability and ensures freedom from cascading rollbacks?",
        "options": ["Basic 2-Phase Locking", "Strict 2-Phase Locking", "Conservative 2PL", "Read-Committed Isolation"],
        "correct_option_index": 1,
        "explanation": "Strict 2PL requires all exclusive (write) locks to be held until the transaction commits or aborts, eliminating cascading rollbacks.",
        "difficulty": "Hard"
    },
    {
        "id": "w_q3",
        "subject": "Theory of Computation",
        "topic": "Decidability & Rice's Theorem",
        "question": "Which of the following problems is DECIDABLE for a Turing Machine M?",
        "options": [
            "Whether L(M) is empty",
            "Whether L(M) is finite",
            "Whether M halts on empty tape in at most 100 steps",
            "Whether L(M) is regular"
        ],
        "correct_option_index": 2,
        "explanation": "Simulating M for 100 steps takes finite bounded time. Checking a property up to k steps is always decidable. All other options are non-trivial semantic properties and undecidable by Rice's theorem.",
        "difficulty": "Hard"
    },
    {
        "id": "w_q4",
        "subject": "Algorithms",
        "topic": "Dynamic Programming",
        "question": "What is the minimum number of scalar multiplications required to multiply matrix dimensions A(10x30), B(30x5), C(5x60)?",
        "options": ["4,500", "7,500", "18,000", "27,000"],
        "correct_option_index": 0,
        "explanation": "(A*B)*C takes (10*30*5) + (10*5*60) = 1500 + 3000 = 4,500 multiplications. A*(B*C) takes (30*5*60) + (10*30*60) = 9000 + 18000 = 27,000. Optimal is 4,500.",
        "difficulty": "Medium"
    },
    {
        "id": "w_q5",
        "subject": "Computer Networks",
        "topic": "TCP Congestion Control",
        "question": "In TCP Reno, if a packet loss is detected via 3 duplicate ACKs when the current Congestion Window (cwnd) is 32 KB, what will be the new ssthresh and cwnd respectively?",
        "options": ["ssthresh = 16 KB, cwnd = 19 KB", "ssthresh = 16 KB, cwnd = 1 KB", "ssthresh = 8 KB, cwnd = 16 KB", "ssthresh = 32 KB, cwnd = 16 KB"],
        "correct_option_index": 0,
        "explanation": "Under 3 duplicate ACKs (Fast Retransmit & Fast Recovery), ssthresh = cwnd / 2 = 16 KB. cwnd becomes ssthresh + 3 MSS = 16 + 3 = 19 KB.",
        "difficulty": "Hard"
    }
]

@router.get("/tree")
def get_knowledge_tree(user_id: Optional[str] = Depends(optional_verify_token)):
    return {"tree": GATE_SKILL_TREE}

@router.get("/stats", response_model=KnowledgeStatsResponse)
def get_knowledge_stats(user_id: Optional[str] = Depends(optional_verify_token)):
    levels = [s["mastery_level"] for s in GATE_SKILL_TREE]
    avg_mastery = sum(levels) / len(levels) if levels else 0

    # Project GATE marks from mastery
    predicted_marks = round(25.0 + (avg_mastery / 100.0) * 55.0, 1)
    predicted_score = int(predicted_marks * 10.8)

    if predicted_marks >= 70:
        air_bracket = "Top 100 (AIR 1 - 100)"
    elif predicted_marks >= 60:
        air_bracket = "Top 500 (AIR 101 - 500)"
    elif predicted_marks >= 50:
        air_bracket = "Top 1,500 (AIR 501 - 1,500)"
    else:
        air_bracket = "Top 5,000"

    weak_count = sum(1 for s in GATE_SKILL_TREE if s["status"] == "weak")

    return KnowledgeStatsResponse(
        overall_mastery_percentage=round(avg_mastery, 1),
        predicted_gate_score=predicted_score,
        predicted_marks=predicted_marks,
        estimated_air_bracket=air_bracket,
        critical_weakness_count=weak_count,
        strongest_subject="Theory of Computation",
        weakest_subject="Databases (Concurrency) & Decidability"
    )

@router.post("/drill", response_model=List[WeaknessQuestion])
def get_personalized_weakness_drill(user_id: Optional[str] = Depends(optional_verify_token)):
    # Returns 5 targeted questions focusing on student weak areas
    drill = list(WEAKNESS_DRILL_POOL)
    random.shuffle(drill)
    return drill
