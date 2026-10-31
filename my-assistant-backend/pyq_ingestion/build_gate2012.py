import json
import re
from pathlib import Path

import pypdfium2 as pdfium


ROOT = Path(__file__).resolve().parents[2]
QUESTION_PDF = ROOT / "CS" / "CS" / "CS2012.pdf"
OUT_DIR = ROOT / "my-assistant-backend" / "app" / "data" / "gate_pyqs" / "gate2012_s1"
IMG_DIR = OUT_DIR / "images"


QUESTION_RE = re.compile(r"\bQ\.\s*(\d{1,2})\b(?!\s*(?:to|–|-))")

COMPLEX_HINTS = (
    "shown",
    "figure",
    "graph",
    "table",
    "program",
    "code",
    "pseudocode",
    "karnaugh",
    "relations",
    "grammar",
    "parsing table",
    "tree",
    "network",
    "circuit",
    "common data",
    "linked answer",
)


CHAPTERS = {
    **{q: "General Aptitude" for q in range(56, 66)},
    1: "Logic",
    2: "Databases",
    3: "Discrete Mathematics",
    4: "Databases",
    5: "Digital Logic",
    6: "Digital Logic",
    7: "Computer Organization and Architecture",
    8: "Operating Systems",
    9: "Calculus",
    10: "Operating Systems",
    11: "Algorithms",
    12: "Compilers",
    13: "Discrete Mathematics",
    14: "Databases",
    15: "Digital Logic",
    16: "Operating Systems",
    17: "Programming",
    18: "Data Structures",
    19: "Computer Networks",
    20: "Theory of Computation",
    21: "Programming",
    22: "Computer Networks",
    23: "Computer Networks",
    24: "Theory of Computation",
    25: "Theory of Computation",
    26: "Graph Theory",
    27: "Databases",
    28: "Numerical Methods",
    29: "Compilers",
    30: "Digital Logic",
    31: "Operating Systems",
    32: "Computer Organization and Architecture",
    33: "Computer Networks",
    34: "Computer Networks",
    35: "Data Structures",
    36: "Compilers",
    37: "Combinatorics",
    38: "Graph Theory",
    39: "Algorithms",
    40: "Graph Theory",
    41: "Theory of Computation",
    42: "Algorithms",
    43: "Databases",
    44: "Computer Networks",
    45: "Digital Logic",
    46: "Algorithms",
    47: "Data Structures",
    48: "Programming",
    49: "Programming",
    50: "Databases",
    51: "Databases",
    52: "Compilers",
    53: "Compilers",
    54: "Computer Organization and Architecture",
    55: "Computer Organization and Architecture",
}


def norm(text: str) -> str:
    text = text.replace("\r", "\n").replace("\u00a0", " ")
    text = text.replace("", "->").replace("", "->").replace("", "∨").replace("", "∧")
    text = text.replace("", "∀").replace("", "∃").replace("", "ε")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def page_texts(pdf: pdfium.PdfDocument) -> list[str]:
    return [pdf[i].get_textpage().get_text_range() for i in range(len(pdf))]


def strip_page_header(text: str) -> str:
    lines = []
    for line in norm(text).splitlines():
        s = line.strip()
        if not s:
            continue
        if re.fullmatch(r"2012 COMPUTER SCIENCE & INFORMATION TECH\. – CS", s):
            continue
        if re.fullmatch(r"CS-A \d+/20", s):
            continue
        if re.fullmatch(r"Q\.\s*\d+\s*(?:to|–|-)\s*Q\.\s*\d+.*", s, re.I):
            continue
        if s in {"General Aptitude (GA) Questions", "Common Data Questions", "Linked Answer Questions"}:
            continue
        lines.append(line)
    return norm("\n".join(lines))


def option_answer(raw: str):
    raw = raw.strip()
    return "ALL" if raw == "Marks to All" else raw


def parse_key(texts: list[str]) -> dict[int, str]:
    key_text = "\n".join(texts[17:19]).replace("\u00a0", " ")
    answers = {}
    for m in re.finditer(r"CS\s+(\d{1,2})\s*(Marks to All|[A-D])", key_text):
        answers[int(m.group(1))] = option_answer(m.group(2))
    missing = sorted(set(range(1, 66)) - set(answers))
    if missing:
        raise RuntimeError(f"missing answer keys: {missing}")
    return answers


def split_options(block: str) -> tuple[str, dict[str, str]]:
    matches = list(re.finditer(r"(?:^|\n|\s)\(([A-D])\)\s*", block))
    if len(matches) < 4:
        return block, {letter: f"See source image for option {letter}" for letter in "ABCD"}
    options = {}
    for idx, match in enumerate(matches[:4]):
        start = match.end()
        end = matches[idx + 1].start() if idx < 3 else len(block)
        options[match.group(1)] = norm(block[start:end])
    return norm(block[: matches[0].start()]), options


def extract_blocks(texts: list[str]) -> dict[int, str]:
    blocks = {}
    for page_no in range(1, 17):
        text = strip_page_header(texts[page_no])
        markers = list(QUESTION_RE.finditer(text))
        for idx, marker in enumerate(markers):
            qno = int(marker.group(1))
            if qno in blocks:
                continue
            start = marker.start()
            if idx == 0 and re.search(r"(Common Data|Statement for Linked Answer)", text[:start], re.I):
                start = 0
            end = markers[idx + 1].start() if idx + 1 < len(markers) else len(text)
            block = norm(text[start:end])
            block = re.sub(r"^Q\.\s*\d+\s*", "", block).strip()
            blocks[qno] = block
    missing = sorted(set(range(1, 66)) - set(blocks))
    if missing:
        raise RuntimeError(f"missing questions: {missing}")
    return blocks


def marks_for(qno: int) -> int:
    return 1 if qno <= 25 or 56 <= qno <= 60 else 2


def negative_for(marks: int) -> float:
    return 0.33 if marks == 1 else 0.66


def section_for(qno: int) -> str:
    return "GA" if qno >= 56 else "CS-1"


def subject_for(qno: int) -> str:
    return "General Aptitude" if qno >= 56 else "Computer Science and Information Technology"


def should_attach_source_image(qno: int, text: str) -> bool:
    haystack = text.lower()
    return qno in {26, 30, 36, 40, 45, 48, 49, 50, 51, 52, 53, 54, 55} or any(h in haystack for h in COMPLEX_HINTS)


def question_page_map(texts: list[str]) -> dict[int, int]:
    mapping = {}
    for page_no in range(1, 17):
        for marker in QUESTION_RE.finditer(strip_page_header(texts[page_no])):
            qno = int(marker.group(1))
            mapping.setdefault(qno, page_no)
    return mapping


def render_question_crops(pdf: pdfium.PdfDocument, texts: list[str]) -> dict[int, str]:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    page_markers: dict[int, list[tuple[int, float]]] = {}
    for page_no in range(1, 17):
        page = pdf[page_no]
        textpage = page.get_textpage()
        found = []
        for qno in range(1, 66):
            hit = textpage.search(f"Q.{qno}", match_case=False).get_next()
            if not hit:
                hit = textpage.search(f"Q. {qno}", match_case=False).get_next()
            if hit:
                idx, count = hit
                boxes = [textpage.get_charbox(i) for i in range(idx, idx + count)]
                top = max(box[3] for box in boxes)
                found.append((qno, top))
        if found:
            page_markers[page_no] = sorted(found, key=lambda item: item[1], reverse=True)

    paths = {}
    scale = 2.5
    for page_no, markers in page_markers.items():
        page = pdf[page_no]
        width, height = page.get_width(), page.get_height()
        bitmap = page.render(scale=scale).to_pil().convert("RGB")
        for idx, (qno, top_y) in enumerate(markers):
            next_top = markers[idx + 1][1] if idx + 1 < len(markers) else 25
            crop_top = 70 if idx == 0 else max(0, int((height - top_y - 18) * scale))
            crop_bottom = min(bitmap.height, int((height - next_top + 14) * scale))
            crop = bitmap.crop((35, crop_top, bitmap.width - 35, crop_bottom))
            rel = f"images/Q{qno}_source.png"
            crop.save(OUT_DIR / rel)
            paths[qno] = rel
    return paths


def make_json() -> list[dict]:
    pdf = pdfium.PdfDocument(str(QUESTION_PDF))
    texts = page_texts(pdf)
    answers = parse_key(texts)
    blocks = extract_blocks(texts)
    crop_paths = render_question_crops(pdf, texts)

    data = []
    for qno in range(1, 66):
        question, options = split_options(blocks[qno])
        chapter = CHAPTERS.get(qno, "Uncategorized")
        image_url = crop_paths.get(qno) if should_attach_source_image(qno, blocks[qno]) else None
        data.append(
            {
                "year": 2012,
                "shift": 1,
                "question_id": f"GATECSE2012S1Q{qno}",
                "question_type": "MCQ",
                "section": section_for(qno),
                "subject": subject_for(qno),
                "chapter": chapter,
                "question": question,
                "image_url": image_url,
                "options": options,
                "correct_answer": answers[qno],
                "marks": marks_for(qno),
                "negative_marking": negative_for(marks_for(qno)),
                "topic": chapter,
                "difficulty": "Medium",
                "explanation": "Official answer key included in the source PDF. Detailed step-by-step solution is not available in the source PDFs.",
                "solution_steps": [],
            }
        )
    return data


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = make_json()
    out_file = OUT_DIR / "CS1_2012_S1.json"
    out_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("wrote", out_file)
    print("questions", len(data), "marks", sum(q["marks"] for q in data), "images", sum(bool(q["image_url"]) for q in data))


if __name__ == "__main__":
    main()
