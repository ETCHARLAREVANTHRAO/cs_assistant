import json
import re
from pathlib import Path

import pypdfium2 as pdfium


ROOT = Path(__file__).resolve().parents[2]
QUESTION_PDF = ROOT / "source_replacements" / "gate2017" / "GATE2017_QP_CS1.pdf"
ANSWER_PDF = ROOT / "source_replacements" / "gate2017" / "GATE2017_Key_CS1.pdf"
OUT_DIR = ROOT / "my-assistant-backend" / "app" / "data" / "gate_pyqs" / "gate2017_s1"
IMG_DIR = OUT_DIR / "images"


CHAPTERS = {
    **{q: "General Aptitude" for q in range(56, 66)},
    1: "Discrete Mathematics",
    2: "Discrete Mathematics",
    3: "Calculus",
    4: "Databases",
    5: "Operating Systems",
    6: "Programming and Data Structures",
    7: "Theory of Computation",
    8: "Computer Organization and Architecture",
    9: "Algorithms",
    10: "Compiler Design",
    11: "Computer Networks",
    12: "Computer Organization and Architecture",
    13: "Operating Systems",
    14: "Programming and Data Structures",
    15: "Databases",
    16: "Computer Organization and Architecture",
    17: "Theory of Computation",
    18: "Digital Logic",
    19: "Discrete Mathematics",
    20: "Theory of Computation",
    21: "Operating Systems",
    22: "Algorithms",
    23: "Computer Organization and Architecture",
    24: "Digital Logic",
    25: "Programming and Data Structures",
    26: "Computer Organization and Architecture",
    27: "Computer Networks",
    28: "Programming and Data Structures",
    29: "Compiler Design",
    30: "Databases",
    31: "Operating Systems",
    32: "Algorithms",
    33: "Computer Networks",
    34: "Theory of Computation",
    35: "Operating Systems",
    36: "Databases",
    37: "Programming and Data Structures",
    38: "Theory of Computation",
    39: "Databases",
    40: "Computer Organization and Architecture",
    41: "Compiler Design",
    42: "Computer Networks",
    43: "Operating Systems",
    44: "Computer Organization and Architecture",
    45: "Computer Networks",
    46: "Programming and Data Structures",
    47: "Programming and Data Structures",
    48: "Algorithms",
    49: "Discrete Mathematics",
    50: "Calculus",
    51: "Computer Organization and Architecture",
    52: "Operating Systems",
    53: "Computer Networks",
    54: "Theory of Computation",
    55: "Operating Systems",
}


def norm(text: str) -> str:
    text = text.replace("\r", "\n").replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def key_answer(raw: str, qtype: str):
    raw = raw.strip()
    if qtype == "MSQ":
        return [part.strip() for part in raw.split(";") if part.strip()]
    return raw


def parse_key() -> dict[int, dict]:
    pdf = pdfium.PdfDocument(str(ANSWER_PDF))
    text = norm("\n".join(pdf[i].get_textpage().get_text_range() for i in range(len(pdf))))
    rows = {}
    pattern = re.compile(r"^(\d{1,2})\s+(MCQ|MSQ|NAT)\s+(CS-1|GA)\s+(.+?)\s+([12])$", re.M)
    for match in pattern.finditer(text):
        qno = int(match.group(1))
        qtype = match.group(2)
        section = match.group(3)
        rows[qno] = {
            "question_type": qtype,
            "section": section,
            "correct_answer": key_answer(match.group(4), qtype),
            "marks": int(match.group(5)),
        }
    missing = sorted(set(range(1, 66)) - set(rows))
    if missing:
        raise RuntimeError(f"missing answer rows: {missing}")
    return rows


def red_header_centers(image) -> list[int]:
    red_rows = []
    for y in range(image.height):
        red_count = 0
        for x in range(0, image.width, 4):
            r, g, b = image.getpixel((x, y))
            if r > 150 and g < 90 and b < 90:
                red_count += 1
        if red_count > 3:
            red_rows.append(y)

    clusters = []
    for y in red_rows:
        if not clusters or y - clusters[-1][1] > 8:
            clusters.append([y, y])
        else:
            clusters[-1][1] = y
    return [(start + end) // 2 for start, end in clusters if end - start > 3]


def render_question_crops() -> dict[int, str]:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    pdf = pdfium.PdfDocument(str(QUESTION_PDF))
    scale = 2.0
    qno = 1
    paths = {}
    for page_index in range(1, 27):
        page = pdf[page_index]
        image = page.render(scale=scale).to_pil().convert("RGB")
        centers = red_header_centers(image)
        for idx, center in enumerate(centers):
            top = max(0, center - 45)
            bottom = centers[idx + 1] - 35 if idx + 1 < len(centers) else image.height - 80
            crop = image.crop((20, top, image.width - 20, min(image.height, bottom)))
            rel = f"images/Q{qno}_source.png"
            crop.save(OUT_DIR / rel)
            paths[qno] = rel
            qno += 1
    if qno != 66:
        raise RuntimeError(f"expected 65 question crops, got {qno - 1}")
    return paths


def negative(qtype: str, marks: int) -> float:
    if qtype != "MCQ":
        return 0.0
    return 0.33 if marks == 1 else 0.66


def make_json() -> list[dict]:
    key = parse_key()
    crops = render_question_crops()
    data = []
    for qno in range(1, 66):
        info = key[qno]
        chapter = CHAPTERS.get(qno, "Uncategorized")
        is_ga = info["section"] == "GA"
        data.append(
            {
                "year": 2017,
                "shift": 1,
                "question_id": f"GATECSE2017S1Q{qno}",
                "question_type": info["question_type"],
                "section": info["section"],
                "subject": "General Aptitude" if is_ga else "Computer Science and Information Technology",
                "chapter": chapter,
                "question": "See the source image for the full question text.",
                "image_url": crops[qno],
                "options": {letter: f"Option {letter} shown in source image" for letter in "ABCD"}
                if info["question_type"] != "NAT"
                else None,
                "correct_answer": info["correct_answer"],
                "marks": info["marks"],
                "negative_marking": negative(info["question_type"], info["marks"]),
                "topic": chapter,
                "difficulty": "Medium",
                "explanation": "Official answer key included. Question text/options are preserved as source images because this PDF is image-based.",
                "solution_steps": [],
            }
        )
    return data


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = make_json()
    out_file = OUT_DIR / "CS1_2017_S1.json"
    out_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("wrote", out_file)
    print("questions", len(data), "marks", sum(q["marks"] for q in data), "images", sum(bool(q["image_url"]) for q in data))


if __name__ == "__main__":
    main()
