"""
Prepare GATEOverflow compiled-book chapter text files for the existing PYQ
ingestion pipeline.

Usage:
    python pyq_ingestion/prepare_compiled_chapters.py source_pdfs

Writes:
    pyq_ingestion/compiled_pages/*.json
    pyq_ingestion/compiled_chapters/*.txt
    pyq_ingestion/compiled_chapters/manifest.json
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

from pypdf import PdfReader


@dataclass
class Chapter:
    volume: str
    number: int
    title: str
    start_page_index: int
    end_page_index: int
    output: str


def extract_pages(pdf_path: Path, cache_dir: Path) -> list[str]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"{pdf_path.stem}.pypdf.json"
    if cache_file.exists():
        return json.loads(cache_file.read_text(encoding="utf-8"))

    reader = PdfReader(str(pdf_path))
    pages: list[str] = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    cache_file.write_text(json.dumps(pages, ensure_ascii=False), encoding="utf-8")
    return pages


def chapter_heading_re(number: int, title: str) -> re.Pattern[str]:
    words = re.escape(title).replace(r"\ ", r"\s+")
    return re.compile(rf"^\s*{number}\s+{words}\s*$", re.IGNORECASE | re.MULTILINE)


def discover_toc_chapters(pages: list[str]) -> list[tuple[int, str]]:
    toc_text = "\n".join(pages[:12])
    pattern = re.compile(r"^\s*(\d{1,2})\s+(.+?)\s+\(\d+\)\s*$", re.MULTILINE)
    seen: set[int] = set()
    chapters: list[tuple[int, str]] = []
    for match in pattern.finditer(toc_text):
        number = int(match.group(1))
        title = " ".join(match.group(2).split())
        if "." in title or title in {"Table of Contents", "Contributors", "Answer Keys"}:
            continue
        if number not in seen:
            seen.add(number)
            chapters.append((number, title))
    return chapters


def locate_chapters(volume: str, pages: list[str]) -> list[Chapter]:
    toc_chapters = discover_toc_chapters(pages)
    starts: list[tuple[int, int, str]] = []
    for number, title in toc_chapters:
        rx = chapter_heading_re(number, title)
        for idx, text in enumerate(pages):
            if idx < 5:
                continue
            if rx.search(text):
                starts.append((idx, number, title))
                break

    starts.sort()
    chapters: list[Chapter] = []
    for pos, (start, number, title) in enumerate(starts):
        end = starts[pos + 1][0] if pos + 1 < len(starts) else len(pages)
        safe = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
        output = f"{volume}_ch{number:02d}_{safe}.txt"
        chapters.append(Chapter(volume, number, title, start, end, output))
    return chapters


def clean_chapter_text(chapter: Chapter, pages: list[str]) -> str:
    text = "\n\n".join(pages[chapter.start_page_index : chapter.end_page_index])
    marker = "Answer Keys"
    if marker in text:
        body, sep, rest = text.partition(marker)
        next_chapter = re.search(r"\n\s*\d{1,2}\s+(?:Discrete Mathematics|Engineering Mathematics|General Aptitude|Computer Science|Theory of Computation|Algorithms?|Data Structures?|Operating Systems?|Databases?|Computer Networks?|Digital Logic|Compiler Design|Computer Organization|CO\s*&\s*Architecture)", rest)
        if next_chapter:
            rest = rest[: next_chapter.start()]
        text = body + sep + rest
    return text.strip() + "\n"


def main(source_dir: Path) -> None:
    root = Path(__file__).resolve().parent
    page_cache = root / "compiled_pages"
    chapter_dir = root / "compiled_chapters"
    chapter_dir.mkdir(parents=True, exist_ok=True)

    manifest: list[dict[str, object]] = []
    for pdf_path in sorted(source_dir.glob("filter1_volume*.pdf")):
        volume = pdf_path.stem
        pages = extract_pages(pdf_path, page_cache)
        chapters = locate_chapters(volume, pages)
        print(f"{pdf_path.name}: {len(pages)} pages, {len(chapters)} chapters")
        for chapter in chapters:
            out_path = chapter_dir / chapter.output
            out_path.write_text(clean_chapter_text(chapter, pages), encoding="utf-8")
            record = asdict(chapter)
            record["start_page"] = chapter.start_page_index + 1
            record["end_page"] = chapter.end_page_index
            manifest.append(record)
            print(f"  {chapter.number}. {chapter.title}: pages {chapter.start_page_index + 1}-{chapter.end_page_index}")

    (chapter_dir / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {len(manifest)} chapter files to {chapter_dir}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python pyq_ingestion/prepare_compiled_chapters.py <source_pdf_dir>", file=sys.stderr)
        sys.exit(1)
    main(Path(sys.argv[1]))
