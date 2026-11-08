"""
Academic Concept & Adaptive Roadmap Service
===========================================
Detects intent and generates structured learning roadmaps for academic questions
while guaranteeing zero overhead/diagrams for non-academic questions (weather, time, chitchat).
"""

from __future__ import annotations

import re
from typing import Any, Optional

# Non-academic regex patterns (weather, time, calendar, chitchat)
NON_ACADEMIC_PATTERNS = [
    r"\b(weather|temperature|forecast|rain|humidity|climate|wind)\b",
    r"\b(time|date|day|clock|current time|today's date)\b",
    r"\b(calendar|schedule|meeting|event|reminder|appointment)\b",
    r"\b(hi|hello|hey|who are you|how are you|good morning|thanks|thank you)\b",
]

# Core high-yield GATE CS taxonomy
GATE_TAXONOMY: dict[str, dict[str, Any]] = {
    "dram": {
        "concept_key": "dram",
        "title": "DRAM (Dynamic RAM)",
        "subject": "Computer Organization & Architecture",
        "unit": "Memory Hierarchy & Primary Storage",
        "gate_weightage": "High Yield (Asked in 6 of last 10 GATE exams)",
        "prerequisites_above": [
            {"level": "Subject", "title": "Computer Organization & Architecture"},
            {"level": "Unit", "title": "Memory Systems & Hierarchy"},
            {"level": "Subsystem", "title": "Semiconductor RAM (Primary Storage)"}
        ],
        "current_focus": {
            "title": "DRAM (Dynamic RAM)",
            "cell_type": "1-Transistor 1-Capacitor (1T-1C)",
            "core_mechanism": "Periodic Refresh Cycle (Charge Leakage)",
            "advantages": "High density, lowest cost per gigabyte",
            "drawbacks": "Slower access (20-60ns) vs SRAM cache"
        },
        "exam_trap": "⚠️ Exam Trap: Refresh intervals are typically in milliseconds (ms), but cycle time is in nanoseconds (ns). Always convert both to nanoseconds before computing memory availability percentage!",
        "what_to_learn_below": [
            {"title": "SRAM vs DRAM Comparison", "category": "Core Trade-off", "desc": "Static flip-flop speed vs dynamic capacitor density"},
            {"title": "Refresh Overhead Calculations", "category": "GATE Numerical", "desc": "Formula: Overhead = (Rows * Cycle Time) / Refresh Period"},
            {"title": "SDRAM to DDR4/DDR5", "category": "Modern Evolution", "desc": "Synchronous clocks, prefetch buffers, dual channels"},
            {"title": "Memory Controller & Timings", "category": "Interface Latency", "desc": "RAS (Row Access) & CAS (Column Access) strobe delays"}
        ],
        "click_to_ask_chips": [
            "Show SRAM vs DRAM comparison table",
            "Solve a GATE DRAM refresh calculation problem",
            "How does DDR5 double-pumped bus work?"
        ],
        "practice_pyq": "GATE CS 2021 (Set 2, Q20) & GATE CS 2018 (Q15)"
    },
    "sram": {
        "concept_key": "sram",
        "title": "SRAM (Static RAM)",
        "subject": "Computer Organization & Architecture",
        "unit": "Memory Hierarchy & Cache Memory",
        "gate_weightage": "High Yield (Cache Architecture questions)",
        "prerequisites_above": [
            {"level": "Subject", "title": "Computer Organization & Architecture"},
            {"level": "Unit", "title": "Memory Hierarchy"},
            {"level": "Subsystem", "title": "CPU Cache (L1, L2, L3)"}
        ],
        "current_focus": {
            "title": "SRAM (Static RAM)",
            "cell_type": "6-Transistor Cross-Coupled Inverter (6T)",
            "core_mechanism": "Bistable Latching (No refresh needed)",
            "advantages": "Ultra-fast access (0.5 - 2 ns)",
            "drawbacks": "Low density, high power consumption and cost"
        },
        "exam_trap": "⚠️ Exam Trap: SRAM does not require refresh cycles as long as power is maintained, but it remains volatile (loses data on power down).",
        "what_to_learn_below": [
            {"title": "Direct Mapped vs Set Associative Cache", "category": "Cache Mapping", "desc": "Tag, index, and word offset split"},
            {"title": "Cache Write Policies", "category": "Consistency", "desc": "Write-through vs Write-back, Write-allocate vs No-write-allocate"},
            {"title": "Average Memory Access Time (AMAT)", "category": "Performance", "desc": "Formula: AMAT = Hit Time + Miss Rate * Miss Penalty"}
        ],
        "click_to_ask_chips": [
            "Calculate AMAT for 2-level cache hierarchy",
            "Explain 2-way Set Associative tag bits calculation",
            "Write-through vs Write-back tradeoffs"
        ],
        "practice_pyq": "GATE CS 2022 (Q14) & GATE CS 2019 (Q22)"
    },
    "paging": {
        "concept_key": "paging",
        "title": "Multi-Level Paging & Address Translation",
        "subject": "Operating Systems",
        "unit": "Memory Management & Virtual Memory",
        "gate_weightage": "Top Priority (100% guarantee in GATE CSE, 2-4 Marks)",
        "prerequisites_above": [
            {"level": "Subject", "title": "Operating Systems"},
            {"level": "Unit", "title": "Memory Management Unit (MMU)"},
            {"level": "Foundation", "title": "Virtual Memory & Non-Contiguous Allocation"}
        ],
        "current_focus": {
            "title": "Multi-Level Paging",
            "cell_type": "Hierarchical Page Table Tree",
            "core_mechanism": "Splits logical address into p1, p2, ... and offset d",
            "advantages": "Eliminates huge contiguous memory allocation for unused page tables",
            "drawbacks": "Multiple memory lookups per virtual access without TLB"
        },
        "exam_trap": "⚠️ Exam Trap: If a Translation Lookaside Buffer (TLB) hits, memory is accessed only ONCE (for data). If it misses, memory is accessed (Levels + 1) times! Don't double count TLB time when parallel lookup is stated.",
        "what_to_learn_below": [
            {"title": "Translation Lookaside Buffer (TLB)", "category": "Hardware Speedup", "desc": "Effective Memory Access Time (EMAT) calculations"},
            {"title": "Inverted Page Tables", "category": "Scalability", "desc": "Frame-indexed hashing for 64-bit address spaces"},
            {"title": "Page Fault Handling & Demand Paging", "category": "OS Mechanism", "desc": "Swap space, disk I/O latency, and context switching"},
            {"title": "Page Replacement Algorithms", "category": "GATE Numericals", "desc": "FIFO, LRU, Optimal & Belady's Anomaly"}
        ],
        "click_to_ask_chips": [
            "Calculate EMAT with 90% TLB hit ratio",
            "Solve 2-level paging address split for 32-bit architecture",
            "What is Belady's Anomaly in FIFO replacement?"
        ],
        "practice_pyq": "GATE CS 2023 (Q34), GATE CS 2021 (Q41) & GATE CS 2017 (Q28)"
    },
    "pipeline": {
        "concept_key": "pipeline",
        "title": "Instruction Pipelining & Hazards",
        "subject": "Computer Organization & Architecture",
        "unit": "Processor Design & Datapath",
        "gate_weightage": "High Yield (Speedup and CPI calculations)",
        "prerequisites_above": [
            {"level": "Subject", "title": "Computer Organization & Architecture"},
            {"level": "Unit", "title": "CPU Microarchitecture"},
            {"level": "Foundation", "title": "Instruction Cycle (Fetch, Decode, Execute, Writeback)"}
        ],
        "current_focus": {
            "title": "Instruction Pipelining",
            "cell_type": "Multi-stage Overlapped Execution",
            "core_mechanism": "Pipeline registers between stages clocking synchronous instructions",
            "advantages": "Increases instruction throughput ideally by k times (k stages)",
            "drawbacks": "Pipeline stalls from structural, data, and branch hazards"
        },
        "exam_trap": "⚠️ Exam Trap: Clock cycle time in a non-pipelined CPU is max stage delay + setup time. In a pipelined CPU, clock cycle is determined by the SLOWEST stage + pipeline register delay!",
        "what_to_learn_below": [
            {"title": "Data Hazards & Operand Forwarding", "category": "RAW, WAR, WAW", "desc": "Bypassing ALU output directly to dependent instruction"},
            {"title": "Branch Prediction & Control Hazards", "category": "Speculative Execution", "desc": "Static vs Dynamic branch history tables"},
            {"title": "Pipeline Speedup & Efficiency Formula", "category": "GATE Numericals", "desc": "Speedup = (Non-pipelined time) / (Pipelined time)"}
        ],
        "click_to_ask_chips": [
            "Calculate pipeline speedup with 20% branch stalls",
            "Explain RAW hazard resolution using forwarding",
            "Calculate cycle time for a 5-stage pipeline"
        ],
        "practice_pyq": "GATE CS 2022 (Q38) & GATE CS 2020 (Q19)"
    },
    "semaphore": {
        "concept_key": "semaphore",
        "title": "Process Synchronization & Semaphores",
        "subject": "Operating Systems",
        "unit": "Concurrency & Critical Section Problem",
        "gate_weightage": "Top Priority (Counting & Binary semaphore tracing)",
        "prerequisites_above": [
            {"level": "Subject", "title": "Operating Systems"},
            {"level": "Unit", "title": "Process Management"},
            {"level": "Foundation", "title": "Race Conditions & Mutual Exclusion"}
        ],
        "current_focus": {
            "title": "Semaphores (Wait / Signal)",
            "cell_type": "Atomic Synchronization Primitive",
            "core_mechanism": "Wait (P) decrements and blocks if < 0; Signal (V) increments and wakes up",
            "advantages": "Solves mutual exclusion without busy waiting (using queue blocking)",
            "drawbacks": "Risk of deadlock and priority inversion if misordered"
        },
        "exam_trap": "⚠️ Exam Trap: In counting semaphores, if initial value is S and there are M wait operations and N signal operations, final value is S - M + N. If negative, |S - M + N| processes are currently blocked in the queue!",
        "what_to_learn_below": [
            {"title": "Producer-Consumer Problem", "category": "Classical Problem", "desc": "Using empty, full, and mutex semaphores"},
            {"title": "Dining Philosophers & Deadlock Prevention", "category": "Resource Allocation", "desc": "Asymmetric picking to break circular wait"},
            {"title": "Peterson's Algorithm", "category": "Software Solution", "desc": "2-process mutual exclusion with turn and flag variables"}
        ],
        "click_to_ask_chips": [
            "Trace a counting semaphore problem with blocked queue",
            "Solve Producer-Consumer bounded buffer problem",
            "Prove mutual exclusion in Peterson's algorithm"
        ],
        "practice_pyq": "GATE CS 2023 (Q18), GATE CS 2021 (Q12) & GATE CS 2016 (Q24)"
    },
    "b_tree": {
        "concept_key": "b_tree",
        "title": "B-Trees & B+ Trees Indexing",
        "subject": "Databases & Data Structures",
        "unit": "Storage Indexing & File Organization",
        "gate_weightage": "Top Priority (Order, keys, pointers, and block size numericals)",
        "prerequisites_above": [
            {"level": "Subject", "title": "Databases & Data Structures"},
            {"level": "Unit", "title": "Secondary Storage & Tree Data Structures"},
            {"level": "Foundation", "title": "Balanced Search Trees (BST & AVL Trees)"}
        ],
        "current_focus": {
            "title": "B-Trees & B+ Trees",
            "cell_type": "Multi-way Balanced Search Tree",
            "core_mechanism": "Node size matches disk block size to minimize disk I/O seek operations",
            "advantages": "All leaf nodes at equal depth; supports range scans efficiently in B+ trees",
            "drawbacks": "Node splits and merges require disk block rewrites during rebalancing"
        },
        "exam_trap": "⚠️ Exam Trap: Pay attention to whether the question defines 'Order p' as the maximum number of child pointers OR the maximum number of keys! A node of order p has at most p pointers and (p - 1) keys.",
        "what_to_learn_below": [
            {"title": "Calculate Maximum Order p from Block Size", "category": "GATE Numerical", "desc": "Formula: p * PointerSize + (p - 1) * KeySize <= BlockSize"},
            {"title": "B+ Tree vs B-Tree Differences", "category": "Core Trade-off", "desc": "B+ trees store data pointers only at leaves linked sequentially"},
            {"title": "Minimum & Maximum Keys in B-Tree of Depth h", "category": "Bounds Calculation", "desc": "Root min 1 key, internal nodes min ceil(p/2) - 1 keys"}
        ],
        "click_to_ask_chips": [
            "Calculate B+ tree order for 4KB block size",
            "Difference between B-Tree and B+ Tree indexing",
            "Minimum number of keys in B-Tree of height 3"
        ],
        "practice_pyq": "GATE CS 2022 (Q45), GATE CS 2020 (Q30) & GATE CS 2017 (Q48)"
    }
}


def classify_intent_and_roadmap(query: str) -> tuple[str, Optional[dict[str, Any]]]:
    """
    Analyzes user message.
    Returns:
        ("NON_ACADEMIC", None) for weather, time, greetings, calendar.
        ("ACADEMIC_SUBJECT", roadmap_dict) for computer science/exam topics.
    """
    cleaned = query.lower().strip()

    # 1. Non-academic pattern check
    for pat in NON_ACADEMIC_PATTERNS:
        if re.search(pat, cleaned):
            return "NON_ACADEMIC", None

    # 2. Check exact matches in curated taxonomy
    for key, data in GATE_TAXONOMY.items():
        if key in cleaned:
            return "ACADEMIC_SUBJECT", data
        # Check alias terms
        if key == "dram" and ("dynamic ram" in cleaned or "memory refresh" in cleaned):
            return "ACADEMIC_SUBJECT", data
        if key == "sram" and ("static ram" in cleaned or "cache memory" in cleaned):
            return "ACADEMIC_SUBJECT", data
        if key == "paging" and ("page table" in cleaned or "virtual memory" in cleaned or "tlb" in cleaned):
            return "ACADEMIC_SUBJECT", data
        if key == "pipeline" and ("pipelining" in cleaned or "hazard" in cleaned or "branch stall" in cleaned):
            return "ACADEMIC_SUBJECT", data
        if key == "semaphore" and ("synchronization" in cleaned or "mutex" in cleaned or "critical section" in cleaned):
            return "ACADEMIC_SUBJECT", data
        if key == "b_tree" and ("b+ tree" in cleaned or "btree" in cleaned or "b-tree" in cleaned or "indexing" in cleaned):
            return "ACADEMIC_SUBJECT", data

    # 3. Check for general academic/CS keywords
    academic_signals = [
        "algorithm", "complexity", "recurrence", "cache", "memory", "tlb",
        "cpu", "disk", "deadlock", "process", "thread", "sql", "normalization",
        "compiler", "parser", "dfa", "nfa", "turing", "graph", "tree", "sorting",
        "binary search", "stack", "queue", "network", "tcp", "udp", "ip address",
        "subnet", "routing", "gate", "pyq", "formula", "theorem", "solve"
    ]
    for signal in academic_signals:
        if signal in cleaned:
            # Generate a dynamic high-yield academic roadmap
            dynamic_title = query.strip().capitalize()
            if len(dynamic_title) > 40:
                dynamic_title = dynamic_title[:37] + "..."
            return "ACADEMIC_SUBJECT", {
                "concept_key": signal,
                "title": dynamic_title,
                "subject": "GATE Computer Science & IT",
                "unit": "Core Subject Foundations",
                "gate_weightage": "High-Yield Exam Topic",
                "prerequisites_above": [
                    {"level": "Foundation", "title": "Core CS Fundamentals"},
                    {"level": "Subject", "title": "Theoretical & Applied Concepts"},
                    {"level": "Prerequisite", "title": f"Key Principles of {signal.upper()}"}
                ],
                "current_focus": {
                    "title": dynamic_title,
                    "cell_type": "Core Concept",
                    "core_mechanism": "Direct analytical problem solving",
                    "advantages": "Frequent appearance in GATE / Technical Interviews",
                    "drawbacks": "Prone to edge-case and boundary value mistakes"
                },
                "exam_trap": "⚠️ Exam Trap: Always double-check edge conditions, base cases (e.g. n=0 or n=1), and unit conversions before marking the final answer!",
                "what_to_learn_below": [
                    {"title": f"Advanced {signal.capitalize()} Variations", "category": "Deep Dive", "desc": "Complex configurations and optimizations"},
                    {"title": "Previous Years Question (PYQ) Patterns", "category": "Exam Prep", "desc": "Standard question formulations from past 15 years"},
                    {"title": "Time & Space Complexity Bounds", "category": "Analysis", "desc": "Worst-case, average-case and amortized bounds"}
                ],
                "click_to_ask_chips": [
                    f"Show a worked GATE numerical for {signal}",
                    f"Key formulas and shortcut tricks for {signal}",
                    f"What is the most common mistake students make in {signal}?"
                ],
                "practice_pyq": "Search GATE CS PYQs on this topic"
            }

    # Default to NON_ACADEMIC for casual conversation
    return "NON_ACADEMIC", None
