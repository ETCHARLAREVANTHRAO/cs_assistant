import json
import re
from pathlib import Path

import pypdfium2 as pdfium


ROOT = Path(__file__).resolve().parents[2]
QUESTION_PDF = ROOT / "source_replacements" / "gate2021" / "GATE2021_QP_CS2.pdf"
ANSWER_PDF = ROOT / "source_replacements" / "gate2021" / "GATE2021_Key_CS2.pdf"
OUT_DIR = ROOT / "my-assistant-backend" / "app" / "data" / "gate_pyqs" / "gate2021_s2"
IMG_DIR = OUT_DIR / "images"

QUESTION_RE = re.compile(r"\bQ\.\s*(\d{1,2})\b(?!\s*(?:-|–|to))")

PAGE_BY_Q = {
    1: 1, 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
    11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 13, 17: 13, 18: 14, 19: 14, 20: 15,
    21: 16, 22: 16, 23: 17, 24: 17, 25: 18, 26: 19, 27: 19, 28: 19, 29: 19,
    30: 20, 31: 20, 32: 20, 33: 20, 34: 21, 35: 21, 36: 22, 37: 23, 38: 24,
    39: 25, 40: 26, 41: 27, 42: 28, 43: 28, 44: 29, 45: 30, 46: 31, 47: 31,
    48: 32, 49: 32, 50: 33, 51: 33, 52: 34, 53: 35, 54: 36, 55: 37, 56: 38,
    57: 39, 58: 40, 59: 40, 60: 41, 61: 41, 62: 41, 63: 42, 64: 42, 65: 43,
}

CHAPTERS = {
    **{q: "General Aptitude" for q in range(1, 11)},
    11: "Graph Theory", 12: "Data Structures", 13: "Compiler Design",
    14: "Computer Organization and Architecture", 15: "Programming and Data Structures",
    16: "Databases", 17: "Theory of Computation", 18: "Operating Systems",
    19: "Computer Networks", 20: "Algorithms", 21: "Theory of Computation",
    22: "Databases", 23: "Digital Logic", 24: "Computer Networks",
    25: "Computer Organization and Architecture", 26: "Operating Systems",
    27: "Probability", 28: "Programming and Data Structures", 29: "Operating Systems",
    30: "Computer Organization and Architecture", 31: "Databases", 32: "Probability",
    33: "Computer Organization and Architecture", 34: "Operating Systems",
    35: "Computer Organization and Architecture", 36: "Algorithms", 37: "Computer Networks",
    38: "Databases", 39: "Theory of Computation", 40: "Programming and Data Structures",
    41: "Digital Logic", 42: "Operating Systems", 43: "Theory of Computation",
    44: "Algorithms", 45: "Databases", 46: "Algorithms", 47: "Compiler Design",
    48: "Computer Networks", 49: "Programming and Data Structures", 50: "Theory of Computation",
    51: "Operating Systems", 52: "Computer Networks", 53: "Databases", 54: "Databases",
    55: "Computer Organization and Architecture", 56: "Programming and Data Structures",
    57: "Algorithms", 58: "Databases", 59: "Probability",
    60: "Computer Organization and Architecture", 61: "Programming and Data Structures",
    62: "Computer Networks", 63: "Computer Organization and Architecture",
    64: "Compiler Design", 65: "Computer Organization and Architecture",
}


def norm(text: str) -> str:
    text = text.replace("\r", "\n").replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def pdf_text(path: Path) -> list[str]:
    pdf = pdfium.PdfDocument(str(path))
    return [pdf[i].get_textpage().get_text_range() for i in range(len(pdf))]


def parse_key() -> dict[int, dict]:
    text = norm("\n".join(pdf_text(ANSWER_PDF)))
    text = re.sub(r"(\d+\s+to[ \t]*)\n+\s*([0-9.]+\s+[12]\s*0)", r"\1 \2", text)
    rows = {}
    pattern = re.compile(
        r"^(?:(\d{1,2})\s+6|([1-9])6)\s+(MCQ|MSQ|NAT)\s+(GA|CS)\s+(.+?)\s+([12])\s*(?:1/3|2/3|0)$",
        re.M,
    )
    for match in pattern.finditer(text):
        local_no = int(match.group(1) or match.group(2))
        qtype = match.group(3)
        section_name = match.group(4)
        qno = local_no if section_name == "GA" else local_no + 10
        answer = norm(match.group(5))
        if qtype == "MSQ":
            answer = [part.strip() for part in answer.split(";") if part.strip()]
        rows[qno] = {
            "question_type": qtype,
            "section": "GA" if section_name == "GA" else "CS-2",
            "correct_answer": answer,
            "marks": int(match.group(6)),
        }
    missing = sorted(set(range(1, 66)) - set(rows))
    if missing:
        raise RuntimeError(f"missing answer rows: {missing}")
    return rows


def strip_header(text: str) -> str:
    kept = []
    for line in norm(text).splitlines():
        s = line.strip()
        if not s:
            continue
        if s in {"Computer Science and Information Technology (CS, Set-2)", "General Aptitude (GA)"}:
            continue
        if re.fullmatch(r"CS, Set-2 - Copyright © GATE 2021 Page \d+ of 43", s):
            continue
        if re.fullmatch(r"Q\.\s*\d+\s*[-–]\s*Q\.\s*\d+.*", s):
            continue
        kept.append(line)
    return norm("\n".join(kept))


def ga_blocks() -> dict[int, str]:
    blocks = {}
    for raw in pdf_text(QUESTION_PDF)[:9]:
        text = strip_header(raw)
        markers = [
            m for m in QUESTION_RE.finditer(text)
            if "Multiple Choice Question" not in text[max(0, m.start() - 90):m.start()]
        ]
        for i, marker in enumerate(markers):
            qno = int(marker.group(1))
            end = markers[i + 1].start() if i + 1 < len(markers) else len(text)
            blocks[qno] = norm(re.sub(r"^Q\.\s*\d+\s*", "", text[marker.start():end]))
    return blocks


def split_options(block: str, qtype: str):
    if qtype == "NAT":
        return block, None
    matches = list(re.finditer(r"(?:^|\n|\s)\(([A-D])\)\s*", block))
    if len(matches) < 4:
        return block, {letter: f"Option {letter} shown in source image" for letter in "ABCD"}
    options = {}
    for i, match in enumerate(matches[:4]):
        start = match.end()
        end = matches[i + 1].start() if i + 1 < 4 else len(block)
        options[match.group(1)] = norm(block[start:end])
    return norm(block[: matches[0].start()]), options


def render_page_images() -> dict[int, str]:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    pdf = pdfium.PdfDocument(str(QUESTION_PDF))
    rendered_pages = {}
    for page_no in sorted(set(PAGE_BY_Q.values())):
        rel = f"images/page_{page_no:02d}.png"
        pdf[page_no - 1].render(scale=1.8).to_pil().convert("RGB").save(OUT_DIR / rel)
        rendered_pages[page_no] = rel
    return {qno: rendered_pages[page_no] for qno, page_no in PAGE_BY_Q.items()}


def negative(qtype: str, marks: int) -> float:
    if qtype != "MCQ":
        return 0.0
    return 0.33 if marks == 1 else 0.66


def make_json() -> list[dict]:
    key = parse_key()
    images = render_page_images()
    ga_text = ga_blocks()
    data = []
    for qno in range(1, 66):
        info = key[qno]
        if qno <= 10 and qno in ga_text:
            question, options = split_options(ga_text[qno], info["question_type"])
        else:
            question = "See the source image for the full question text."
            options = None if info["question_type"] == "NAT" else {letter: f"Option {letter} shown in source image" for letter in "ABCD"}
        chapter = CHAPTERS.get(qno, "Uncategorized")
        data.append({
            "year": 2021,
            "shift": 2,
            "question_id": f"GATECSE2021S2Q{qno}",
            "question_type": info["question_type"],
            "section": info["section"],
            "subject": "General Aptitude" if info["section"] == "GA" else "Computer Science and Information Technology",
            "chapter": chapter,
            "question": question,
            "image_url": images[qno],
            "options": options,
            "correct_answer": info["correct_answer"],
            "marks": info["marks"],
            "negative_marking": negative(info["question_type"], info["marks"]),
            "topic": chapter,
            "difficulty": "Medium",
            "explanation": "Official final answer key included. Source page image is attached for exact question formatting.",
            "solution_steps": [],
        })
    return data


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = make_json()
    out_file = OUT_DIR / "CS2_2021_S2.json"
    out_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("wrote", out_file)
    print("questions", len(data), "marks", sum(q["marks"] for q in data), "images", len({q["image_url"] for q in data}))


if __name__ == "__main__":
    main()
