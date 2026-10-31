import json
import re
from pathlib import Path

from PIL import Image, ImageDraw
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
QUESTION_PDF = ROOT / "CS" / "CS" / "CS2023.pdf"
ANSWER_PDF = ROOT / "CS" / "CS-answers" / "CS_ANS_GATE2023.pdf"
PAGE_DIR = ROOT / "my-assistant-backend" / "tmp_2023_pages"
OUT_DIR = ROOT / "my-assistant-backend" / "app" / "data" / "gate_pyqs" / "gate2023_s1"
IMG_DIR = OUT_DIR / "images"


PAGE_RANGES = {
    1: [1], 2: [1], 3: [2], 4: [3], 5: [3], 6: [4], 7: [5], 8: [6], 9: [6], 10: [7],
    11: [8], 12: [9], 13: [10], 14: [11], 15: [12], 16: [13], 17: [14], 18: [15],
    19: [16, 17], 20: [18], 21: [19], 22: [20], 23: [21], 24: [22], 25: [23],
    26: [24], 27: [25], 28: [26], 29: [27], 30: [28], 31: [29], 32: [30],
    33: [31], 34: [32], 35: [33], 36: [35, 36], 37: [37, 38], 38: [39],
    39: [40], 40: [41], 41: [42], 42: [43, 44], 43: [45], 44: [46, 47],
    45: [48], 46: [49], 47: [50], 48: [51], 49: [52], 50: [53], 51: [54],
    52: [55], 53: [56], 54: [57], 55: [58], 56: [59], 57: [60], 58: [61],
    59: [62], 60: [63], 61: [64], 62: [65, 66], 63: [67], 64: [68], 65: [69],
}


IMAGE_QS = {10, 14, 19, 21, 30, 36, 37, 40, 42, 43, 44, 47, 62}


META = {
    1: ("General Aptitude", "Verbal Ability", "Verbal Ability - Sentence Completion", "Easy"),
    2: ("General Aptitude", "Verbal Ability", "Verbal Ability - Word Analogy", "Easy"),
    3: ("General Aptitude", "Sequences", "Quantitative Aptitude - Recurrence Backtracking", "Easy"),
    4: ("General Aptitude", "Percentages", "Quantitative Aptitude - Percentage Inference", "Easy"),
    5: ("General Aptitude", "Spatial Aptitude", "Spatial Aptitude - Surface Curvature", "Easy"),
    6: ("General Aptitude", "Logical Reasoning", "Verbal Reasoning - Logical Inference", "Medium"),
    7: ("General Aptitude", "Functions", "Quantitative Aptitude - Function Growth", "Medium"),
    8: ("General Aptitude", "Verbal Reasoning", "Verbal Ability - Sentence Ordering", "Medium"),
    9: ("General Aptitude", "Functions", "Quantitative Aptitude - Constant Functions", "Medium"),
    10: ("General Aptitude", "Spatial Aptitude", "Spatial Aptitude - Rotation and Reflection", "Medium"),
    11: ("Computer Science and Information Technology", "Compiler Design", "Compiler Design - Front End and Back End", "Easy"),
    12: ("Computer Science and Information Technology", "Algorithms", "Algorithms - Sorting and Searching", "Easy"),
    13: ("Computer Science and Information Technology", "Data Structures", "Linked Lists - Delete Node", "Easy"),
    14: ("Computer Science and Information Technology", "Theory of Computation", "DFA to Regular Expression", "Medium"),
    15: ("Computer Science and Information Technology", "Recurrence Relations", "Discrete Mathematics - Lucas Sequence", "Easy"),
    16: ("Computer Science and Information Technology", "Computer Organization and Architecture", "Instruction Set Architecture", "Easy"),
    17: ("Computer Science and Information Technology", "Computer Networks", "Point-to-Point Link Utilization", "Medium"),
    18: ("Computer Science and Information Technology", "Linear Algebra", "Linear Algebra - Determinants", "Medium"),
    19: ("Computer Science and Information Technology", "Theory of Computation", "NFA for Lexical Tokens", "Medium"),
    20: ("Computer Science and Information Technology", "Algorithms", "Universal Hashing", "Easy"),
    21: ("Computer Science and Information Technology", "Digital Logic", "Multiplexer Feedback Circuit", "Medium"),
    22: ("Computer Science and Information Technology", "Operating Systems", "Thread Context Switch", "Easy"),
    23: ("Computer Science and Information Technology", "Databases", "SQL Aggregation and Grouping", "Easy"),
    24: ("Computer Science and Information Technology", "Theory of Computation", "Regular Languages and Decidability", "Medium"),
    25: ("Computer Science and Information Technology", "Discrete Mathematics", "Predicate Logic", "Medium"),
    26: ("Computer Science and Information Technology", "Discrete Mathematics", "Predicate Logic - Sufficient Conditions", "Medium"),
    27: ("Computer Science and Information Technology", "Operating Systems", "CPU Scheduling Algorithms", "Medium"),
    28: ("Computer Science and Information Technology", "Calculus", "Calculus - Polynomial Roots", "Medium"),
    29: ("Computer Science and Information Technology", "Asymptotic Analysis", "Algorithms - Big-O Notation", "Medium"),
    30: ("Computer Science and Information Technology", "Graph Theory", "Graph Theory - Adjacency Matrix Trace", "Medium"),
    31: ("Computer Science and Information Technology", "Calculus", "Calculus - Definite Triple Integral", "Medium"),
    32: ("Computer Science and Information Technology", "Number Systems", "Computer Organization - Base Conversion", "Easy"),
    33: ("Computer Science and Information Technology", "Computer Organization and Architecture", "Pipelining - Throughput and Latency", "Medium"),
    34: ("Computer Science and Information Technology", "Computer Organization and Architecture", "Polling versus Interrupts", "Medium"),
    35: ("Computer Science and Information Technology", "C Programming", "C Programming - Static Variables", "Easy"),
    36: ("Computer Science and Information Technology", "Compiler Design", "Runtime Environments - Activation Trees", "Medium"),
    37: ("Computer Science and Information Technology", "Compiler Design", "Compiler Design - Liveness Analysis", "Medium"),
    38: ("Computer Science and Information Technology", "Operating Systems", "Semaphores and Race Conditions", "Medium"),
    39: ("Computer Science and Information Technology", "Theory of Computation", "Context-Free Grammars", "Medium"),
    40: ("Computer Science and Information Technology", "Theory of Computation", "Pushdown Automata", "Hard"),
    41: ("Computer Science and Information Technology", "Computer Organization and Architecture", "Assembly Code and Addressing", "Medium"),
    42: ("Computer Science and Information Technology", "Computer Organization and Architecture", "Memory Address Decoding", "Medium"),
    43: ("Computer Science and Information Technology", "Digital Logic", "Sequential Circuits", "Medium"),
    44: ("Computer Science and Information Technology", "Digital Logic", "Multiplexer-based Boolean Function", "Hard"),
    45: ("Computer Science and Information Technology", "Computer Organization and Architecture", "IEEE 754 Floating Point", "Medium"),
    46: ("Computer Science and Information Technology", "Data Structures", "Priority Queue Operations", "Medium"),
    47: ("Computer Science and Information Technology", "Data Structures", "Binary Trees and Recursion", "Medium"),
    48: ("Computer Science and Information Technology", "Combinatorics", "Permutations Separating Sets", "Hard"),
    49: ("Computer Science and Information Technology", "Discrete Mathematics", "Functions and Surjections", "Medium"),
    50: ("Computer Science and Information Technology", "Databases", "Relational Schema Design", "Medium"),
    51: ("Computer Science and Information Technology", "Set Theory", "Power Set Cardinality", "Medium"),
    52: ("Computer Science and Information Technology", "Computer Networks", "DNS and HTTP Timing", "Medium"),
    53: ("Computer Science and Information Technology", "Probability", "Conditional Probability", "Medium"),
    54: ("Computer Science and Information Technology", "Algorithms", "Asymptotic Analysis of Loops", "Medium"),
    55: ("Computer Science and Information Technology", "Graph Theory", "Greedy Graph Coloring", "Medium"),
    56: ("Computer Science and Information Technology", "Graph Theory", "BFS Orderings on Subset Graphs", "Hard"),
    57: ("Computer Science and Information Technology", "Operating Systems", "Demand Paging and LRU", "Hard"),
    58: ("Computer Science and Information Technology", "Operating Systems", "Multilevel Page Tables", "Medium"),
    59: ("Computer Science and Information Technology", "Data Structures", "Stack and Queue Operations", "Medium"),
    60: ("Computer Science and Information Technology", "Compiler Design", "Syntax Directed Translation", "Hard"),
    61: ("Computer Science and Information Technology", "Databases", "SQL Selection Query", "Easy"),
    62: ("Computer Science and Information Technology", "Databases", "Indexing and Ordered Files", "Medium"),
    63: ("Computer Science and Information Technology", "Theory of Computation", "DFA State Minimization", "Medium"),
    64: ("Computer Science and Information Technology", "Computer Organization and Architecture", "Cache Address Fields", "Medium"),
    65: ("Computer Science and Information Technology", "Computer Networks", "Longest Prefix Matching", "Medium"),
}


def norm(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def pdf_pages(path: Path) -> list[str]:
    return [page.extract_text() or "" for page in PdfReader(str(path)).pages]


def strip_boilerplate(text: str) -> str:
    kept = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped in {
            "GATE 2023 Computer Science and Information Technology (CS)",
            "Computer Science and Information Technology (CS)",
            "Organizing Institute: IIT Kanpur",
            "General Aptitude (GA)",
        }:
            continue
        if re.fullmatch(r"CS Page \d+ of 83", stripped):
            continue
        if re.fullmatch(r"Page \d+ of 7", stripped):
            continue
        if re.fullmatch(r"Q\.\d+\s+[–-]\s+Q\.\d+\s+Carry\s+(?:ONE|TWO)\s+marks?\s+each\.?", stripped, re.I):
            continue
        if re.fullmatch(r"Q\.\d+", stripped):
            continue
        kept.append(line)
    return norm("\n".join(kept))


def parse_key() -> dict[int, dict]:
    rows = {}
    for line in norm("\n".join(pdf_pages(ANSWER_PDF))).replace(",", ";").splitlines():
        m = re.match(r"^\s*(\d{1,2})\s+\d+\s+(MCQ|MSQ|NAT)\s+(GA|CS)\s+(.+?)\s+([12])\s*$", line)
        if not m:
            continue
        qno = int(m.group(1))
        qtype = m.group(2)
        raw = norm(m.group(4)).replace(" OR ", " or ")
        if qtype == "MSQ":
            # 2023 Q27 has an official alternate key. The current scorer supports one exact set,
            # so keep the broader key that the official key lists first.
            raw = raw.split(" or ")[0]
            parts = [part.strip() for part in raw.split(";") if part.strip()]
            answer = parts if len(parts) > 1 else parts[0]
        else:
            answer = re.sub(r"\s+to\s+", " to ", raw)
        section = "GA" if m.group(3) == "GA" else "CS-1"
        rows[qno] = {"question_type": qtype, "section": section, "correct_answer": answer, "marks": int(m.group(5))}
    return rows


def block_from_pages(qno: int, pages: list[str]) -> str:
    raw = "\n".join(pages[p - 1] for p in PAGE_RANGES[qno])
    text = strip_boilerplate(raw)
    marker = re.search(rf"(?:^|\n)\s*Q\.\s*{qno}\b(?!\s*[–-])", text)
    if marker:
        text = text[marker.end():]
    next_marker = re.search(rf"(?:^|\n)\s*Q\.\s*{qno + 1}\b(?!\s*[–-])", text)
    if next_marker:
        text = text[: next_marker.start()]
    text = re.sub(r"^[–-]\s*Q\.\d+\s+Carry\s+(?:ONE|TWO)\s+marks?\s+each\.?", "", text, flags=re.I)
    return norm(text)


def split_options(block: str, qtype: str) -> tuple[str, dict[str, str] | None]:
    if qtype == "NAT":
        return block, None
    matches = list(re.finditer(r"(?:^|\n|\s)\(([A-D])\)\s*", block))
    if len(matches) < 4:
        return block, {letter: f"Option {letter}" for letter in "ABCD"}
    options = {}
    for idx, match in enumerate(matches[:4]):
        start = match.end()
        end = matches[idx + 1].start() if idx < 3 else len(block)
        options[match.group(1)] = norm(block[start:end])
    return norm(block[: matches[0].start()]), options


def negative(qtype: str, marks: int) -> float:
    if qtype != "MCQ":
        return 0.0
    return 0.33 if marks == 1 else 0.66


def make_json() -> list[dict]:
    pages = pdf_pages(QUESTION_PDF)
    key = parse_key()
    data = []
    for qno in range(1, 66):
        info = key[qno]
        question, options = split_options(block_from_pages(qno, pages), info["question_type"])
        subject, chapter, topic, difficulty = META[qno]
        data.append({
            "year": 2023,
            "shift": 1,
            "question_id": f"GATECSE2023S1Q{qno}",
            "question_type": info["question_type"],
            "section": info["section"],
            "subject": subject,
            "chapter": chapter,
            "question": question,
            "image_url": f"images/Q{qno}_figure.png" if qno in IMAGE_QS else None,
            "options": options,
            "correct_answer": info["correct_answer"],
            "marks": info["marks"],
            "negative_marking": negative(info["question_type"], info["marks"]),
            "topic": topic,
            "difficulty": difficulty,
            "explanation": "Official answer key included. Detailed step-by-step solution is not available in the source PDFs.",
            "solution_steps": [],
        })
    return data


def make_crops() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    crops = {
        10: ("page_07.png", (260, 225, 930, 455)),
        14: ("page_11.png", (480, 260, 760, 500)),
        19: ("page_16.png", (190, 410, 930, 1120)),
        21: ("page_19.png", (410, 210, 690, 430)),
        30: ("page_28.png", (375, 195, 650, 445)),
        36: ("page_35.png", (205, 470, 455, 1060)),
        37: ("page_37.png", (390, 195, 805, 715)),
        40: ("page_41.png", (255, 380, 860, 690)),
        42: ("page_43.png", (125, 365, 990, 625)),
        43: ("page_45.png", (285, 285, 785, 520)),
        44: ("page_46.png", (155, 305, 950, 700)),
        47: ("page_50.png", (650, 250, 905, 520)),
        62: ("page_65.png", (300, 330, 850, 930)),
    }
    if not PAGE_DIR.exists() and all((IMG_DIR / f"Q{qno}_figure.png").exists() for qno in crops):
        return
    for qno, (page_name, box) in crops.items():
        Image.open(PAGE_DIR / page_name).convert("RGB").crop(box).save(IMG_DIR / f"Q{qno}_figure.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    make_crops()
    data = make_json()
    (OUT_DIR / "CS1_2023_S1.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("wrote", len(data), "marks", sum(q["marks"] for q in data), "images", sum(bool(q["image_url"]) for q in data))


if __name__ == "__main__":
    main()
