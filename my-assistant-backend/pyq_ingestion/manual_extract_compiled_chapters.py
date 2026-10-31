"""
Deterministic/offline extractor for staged GATEOverflow chapter text.

This does not call Groq and does not write to Supabase. It creates reviewable
JSON plus a SQL seed file for chapters where question blocks align exactly with
answer keys.

Usage:
    python pyq_ingestion/manual_extract_compiled_chapters.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
CHAPTER_DIR = ROOT / "compiled_chapters"
OUT_DIR = ROOT / "manual_output"

TITLE_RE = re.compile(
    r"^(?:(?P<topic>.+?):\s*)?GATE\s+(?P<meta>.+?)\|\s*Question:\s*(?P<label>[^\n]+)$",
    re.MULTILINE,
)
ANSWER_RE = re.compile(r"(\d+\.\d+\.\d+)\s*\n(.+)")
SKIP_ANSWERS = {"", "N/A", "X", "TBA"}


def classify_answer(raw: str) -> tuple[str, Any]:
    raw = raw.strip()
    if raw in SKIP_ANSWERS:
        return "SKIP", None
    if re.fullmatch(r"[A-E](;[A-E])*", raw):
        letters = raw.split(";")
        return ("MSQ" if len(letters) > 1 else "MCQ"), letters
    if ":" in raw:
        lo, hi = [p.strip() for p in raw.split(":", 1)]
        try:
            return "NAT", {"min": float(lo), "max": float(hi)}
        except ValueError:
            return "UNKNOWN", {"raw": raw}
    try:
        val = float(raw)
        return "NAT", {"value": int(val) if val.is_integer() else val}
    except ValueError:
        return "UNKNOWN", {"raw": raw}


def normalize_topic(value: str) -> str:
    value = value.lower().replace("&", "and")
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = " ".join(value.split())
    aliases = {
        "no classified topic": "no topic",
        "no topic": "no topic",
        "arp": "arp",
        "icmp": "icmp",
        "osi model": "osi model",
        "csma cd": "csma cd",
        "compiler tokenization": "compiler tokenization",
        "compiler tokenization lexical analysis": "compiler tokenization",
        "infix prefix": "infix prefix",
        "infix prefix postfix notations": "infix prefix",
        "ll parser": "ll parser",
        "lu decomposition": "lu decomposition",
        "identify function": "identify function",
        "identity function": "identify function",
        "dijkstras algorithm": "dijkstras algorithm",
        "prim s algorithm": "prims algorithm",
        "prims algorithm": "prims algorithm",
        "tables tabular data": "tables",
    }
    return aliases.get(value, value)


def toc_topics(body: str) -> list[tuple[str, str]]:
    topics: list[tuple[str, str]] = []
    for match in re.finditer(r"^\s*(\d+\.\d+)\s+(.+?)\s+\(\d+\)\s*$", body, re.MULTILINE):
        name = " ".join(match.group(2).split())
        topics.append((match.group(1), name))
    return topics


def parse_options(text: str) -> dict[str, str | None] | None:
    lines = text.splitlines()
    options: dict[str, list[str]] = {}
    current: str | None = None

    def marker_at(index: int) -> tuple[str, int] | None:
        stripped = lines[index].strip()
        same_line = re.match(r"^([A-D])\s*\.\s*(.*)$", stripped)
        if same_line:
            key, rest = same_line.groups()
            if rest:
                options.setdefault(key, []).append(rest)
            return key, index
        if stripped in {"A", "B", "C", "D"}:
            nxt = index + 1
            while nxt < len(lines) and not lines[nxt].strip():
                nxt += 1
            if nxt < len(lines) and lines[nxt].strip() == ".":
                return stripped, nxt
        return None

    started = False
    i = 0
    while i < len(lines):
        found = marker_at(i)
        if found:
            current, consumed_to = found
            options.setdefault(current, [])
            started = True
            i = consumed_to + 1
            continue
        if started and current:
            stripped = lines[i].strip()
            if (
                stripped.lower().startswith("answer key")
                or re.fullmatch(r"\d+(?:\.\d+){1,2}", stripped)
                or re.fullmatch(r"(?:gate(?:cse)?-?\d{4}|[a-z0-9]+(?:-[a-z0-9]+)+|normal|descriptive|multiple-selects|numerical-answers|one-mark|two-marks)", stripped, re.IGNORECASE)
            ):
                break
            if stripped:
                options[current].append(stripped)
        i += 1

    if not options:
        return None
    cleaned_options: dict[str, str | None] = {}
    for key, value in options.items():
        cleaned = " ".join(value).strip()
        if not cleaned or re.fullmatch(r"[\W_]+", cleaned):
            cleaned = None
        cleaned_options[key] = cleaned
    if set(cleaned_options).issubset({"A", "B", "C", "D"}):
        return {key: cleaned_options.get(key) for key in "ABCD"}
    return options if options else None


def clean_question_text(block: str) -> str:
    lines = block.splitlines()
    body = "\n".join(lines[1:])
    body = re.split(r"\n(?:gate(?:cse)?-?\d{4}|[a-z0-9]+(?:-[a-z0-9]+)+|normal|descriptive|multiple-selects|numerical-answers|one-mark|two-marks)\s*$", body, maxsplit=1, flags=re.IGNORECASE | re.MULTILINE)[0]
    body = re.split(r"\nA\s*\.\s*", body, maxsplit=1)[0]
    return " ".join(body.split())


def parse_block(block: str, fallback_subject: str, answer_index: str, answer_raw: str) -> dict[str, Any]:
    first = block.splitlines()[0]
    match = TITLE_RE.match(first)
    if not match:
        raise ValueError(f"Bad title line: {first!r}")

    meta = match.group("meta")
    year_match = re.search(r"(19\d{2}|20\d{2})", meta)
    set_match = re.search(r"Set\s+(\d+)", meta, re.IGNORECASE)
    label = match.group("label").strip()
    qnum_match = re.match(r"\d+", label)
    qtype, parsed_answer = classify_answer(answer_raw)
    text_lower = block.lower()
    if qtype == "SKIP":
        inferred_type = "DESCRIPTIVE" if "descriptive" in text_lower else "MCQ"
    elif qtype == "UNKNOWN":
        inferred_type = "DESCRIPTIVE"
    else:
        inferred_type = qtype

    return {
        "chapter_index": answer_index,
        "answer_raw": answer_raw.strip(),
        "year": int(year_match.group(1)) if year_match else None,
        "question_number": int(qnum_match.group(0)) if qnum_match else 0,
        "original_label": label,
        "set_label": f"Set {set_match.group(1)}" if set_match else None,
        "subject": match.group("topic") or fallback_subject,
        "type": inferred_type,
        "question_text": clean_question_text(block),
        "options": parse_options(block) if inferred_type in {"MCQ", "MSQ"} else None,
        "correct_answer": parsed_answer,
        "marks": 2 if "two-marks" in text_lower else 1,
        "source_status": "aligned",
    }


def topic_groups(matches: list[re.Match[str]], body: str) -> list[tuple[str, list[str]]]:
    groups: list[tuple[str, list[str]]] = []
    current_topic: str | None = None
    current_blocks: list[str] = []
    for index, match in enumerate(matches):
        topic = match.group("topic") or "No Classified Topic"
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        block = body[match.start() : end].strip()
        if current_topic is None:
            current_topic = topic
        if topic != current_topic:
            groups.append((current_topic, current_blocks))
            current_topic = topic
            current_blocks = []
        current_blocks.append(block)
    if current_topic is not None:
        groups.append((current_topic, current_blocks))
    return groups


def key_groups(keys: list[tuple[str, str]]) -> list[tuple[str, list[tuple[str, str]]]]:
    groups: list[tuple[str, list[tuple[str, str]]]] = []
    current_prefix: str | None = None
    current_keys: list[tuple[str, str]] = []
    for key in keys:
        prefix = ".".join(key[0].split(".")[:2])
        if current_prefix is None:
            current_prefix = prefix
        if prefix != current_prefix:
            groups.append((current_prefix, current_keys))
            current_prefix = prefix
            current_keys = []
        current_keys.append(key)
    if current_prefix is not None:
        groups.append((current_prefix, current_keys))
    return groups


def pair_blocks(
    path_name: str,
    fallback_subject: str,
    body: str,
    matches: list[re.Match[str]],
    keys: list[tuple[str, str]],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if len(matches) == len(keys):
        blocks = []
        for index, match in enumerate(matches):
            end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
            blocks.append(body[match.start() : end].strip())
        return (
            [parse_block(block, fallback_subject, answer_index, answer_raw) for block, (answer_index, answer_raw) in zip(blocks, keys)],
            {"strategy": "chapter_aligned", "recovered_blocks": len(blocks), "unrecovered_groups": []},
        )

    recovered: list[dict[str, Any]] = []
    unrecovered: list[dict[str, Any]] = []
    tgroups = topic_groups(matches, body)
    kgroups = key_groups(keys)
    tgroup_by_name = {normalize_topic(topic): (topic, blocks) for topic, blocks in tgroups}
    toc_by_prefix = dict(toc_topics(body))

    explicit_pairs: dict[int, int] = {}
    used_tgroups: set[int] = set()
    for kidx, (prefix, _) in enumerate(kgroups):
        expected_topic = toc_by_prefix.get(prefix)
        if not expected_topic:
            continue
        normalized = normalize_topic(expected_topic)
        for tidx, (topic, _) in enumerate(tgroups):
            if tidx not in used_tgroups and normalize_topic(topic) == normalized:
                explicit_pairs[kidx] = tidx
                used_tgroups.add(tidx)
                break

    remaining_tidx = [idx for idx in range(len(tgroups)) if idx not in used_tgroups]
    remaining_kidx = [idx for idx in range(len(kgroups)) if idx not in explicit_pairs]

    def pair_strategy(tidx: int, kidx: int) -> tuple[str, list[tuple[str, str]]] | None:
        _, blocks = tgroups[tidx]
        _, grouped_keys = kgroups[kidx]
        if len(blocks) == len(grouped_keys):
            return "topic_aligned", grouped_keys
        non_skip = [key for key in grouped_keys if key[1].strip() not in SKIP_ANSWERS]
        if len(blocks) == len(non_skip):
            return "topic_aligned_skip_omitted", non_skip
        if len(non_skip) < len(blocks) < len(grouped_keys):
            needed_skips = len(blocks) - len(non_skip)
            selected: list[tuple[str, str]] = []
            skips_kept = 0
            for key in grouped_keys:
                if key[1].strip() in SKIP_ANSWERS:
                    if skips_kept < needed_skips:
                        selected.append(key)
                        skips_kept += 1
                else:
                    selected.append(key)
            if len(selected) == len(blocks):
                return "topic_aligned_drop_extra_skips", selected
        return None

    positional_pairs: dict[int, int] = {}
    dp: dict[tuple[int, int], tuple[int, list[tuple[int, int]]]] = {}

    def solve(i: int, j: int) -> tuple[int, list[tuple[int, int]]]:
        if i >= len(remaining_tidx) or j >= len(remaining_kidx):
            return 0, []
        key = (i, j)
        if key in dp:
            return dp[key]
        best_score, best_pairs = solve(i + 1, j)
        score_skip_key, pairs_skip_key = solve(i, j + 1)
        if score_skip_key > best_score:
            best_score, best_pairs = score_skip_key, pairs_skip_key
        strat = pair_strategy(remaining_tidx[i], remaining_kidx[j])
        if strat:
            _, keys_to_use = strat
            score_next, pairs_next = solve(i + 1, j + 1)
            score_pair = len(keys_to_use) + score_next
            if score_pair > best_score:
                best_score = score_pair
                best_pairs = [(remaining_tidx[i], remaining_kidx[j]), *pairs_next]
        dp[key] = (best_score, best_pairs)
        return dp[key]

    _, optimal_pairs = solve(0, 0)
    for tidx, kidx in optimal_pairs:
        positional_pairs[kidx] = tidx

    all_pairs = {**explicit_pairs, **positional_pairs}

    for kidx, (prefix, grouped_keys) in enumerate(kgroups):
        if kidx not in all_pairs:
            non_skip_count = len([key for key in grouped_keys if key[1].strip() not in SKIP_ANSWERS])
            if non_skip_count == 0:
                continue
            unrecovered.append(
                {
                    "topic": toc_by_prefix.get(prefix),
                    "key_prefix": prefix,
                    "question_blocks": 0,
                    "answer_keys": len(grouped_keys),
                    "non_skip_answer_keys": non_skip_count,
                    "reason": "missing_topic_group",
                }
            )
            continue

        topic, blocks = tgroups[all_pairs[kidx]]
        pair = pair_strategy(all_pairs[kidx], kidx)
        strategy = pair[0] if pair else None
        keys_to_use = pair[1] if pair else grouped_keys

        if strategy is None:
            unrecovered.append(
                {
                    "topic": topic,
                    "key_prefix": prefix,
                    "question_blocks": len(blocks),
                    "answer_keys": len(grouped_keys),
                    "non_skip_answer_keys": len([key for key in grouped_keys if key[1].strip() not in SKIP_ANSWERS]),
                }
            )
            continue

        for block, (answer_index, answer_raw) in zip(blocks, keys_to_use):
            q = parse_block(block, fallback_subject, answer_index, answer_raw)
            q["source_status"] = strategy
            q["source_file"] = path_name
            recovered.append(q)

    return (
        recovered,
        {
            "strategy": "topic_group_recovery",
            "recovered_blocks": len(recovered),
            "unrecovered_groups": unrecovered,
        },
    )


def sql_literal(value: str | None) -> str:
    if value is None:
        return "null"
    return "'" + value.replace("'", "''") + "'"


def sql_json(value: Any) -> str:
    if value is None:
        return "null"
    return sql_literal(json.dumps(value, ensure_ascii=False))


def sql_row(q: dict[str, Any]) -> str:
    return (
        "insert into gate_questions "
        "(year, question_number, original_label, set_label, subject, type, question_text, options, correct_answer, explanation, marks) values "
        f"({q['year']}, {q['question_number']}, {sql_literal(q['original_label'])}, {sql_literal(q['set_label'])}, "
        f"{sql_literal(q['subject'])}, {sql_literal(q['type'])}, {sql_literal(q['question_text'])}, "
        f"{sql_json(q['options'])}::jsonb, {sql_json(q['correct_answer'])}::jsonb, null, {q['marks']}) "
        "on conflict (year, subject, original_label, set_label) do update set "
        "question_number = excluded.question_number, type = excluded.type, question_text = excluded.question_text, "
        "options = excluded.options, correct_answer = excluded.correct_answer, marks = excluded.marks;"
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((CHAPTER_DIR / "manifest.json").read_text(encoding="utf-8"))
    title_by_output = {item["output"]: item["title"] for item in manifest}

    all_questions: list[dict[str, Any]] = []
    seed_questions: list[dict[str, Any]] = []
    report: list[dict[str, Any]] = []

    for path in sorted(CHAPTER_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        body, _, answer_section = text.partition("Answer Keys")
        matches = list(TITLE_RE.finditer(body))
        keys = ANSWER_RE.findall(answer_section)
        aligned = len(matches) == len(keys)
        questions, recovery = pair_blocks(path.name, title_by_output.get(path.name, "Unknown"), body, matches, keys)
        report.append(
            {
                "file": path.name,
                "chapter": title_by_output.get(path.name),
                "question_blocks": len(matches),
                "answer_keys": len(keys),
                "aligned": aligned,
                **recovery,
            }
        )
        for q in questions:
            all_questions.append(q)
            if q["year"] and q["correct_answer"] is not None and q["type"] in {"MCQ", "MSQ", "NAT"}:
                if q["type"] in {"MCQ", "MSQ"} and not any((q.get("options") or {}).values()):
                    continue
                seed_questions.append(q)

    (OUT_DIR / "manual_questions_aligned.json").write_text(json.dumps(all_questions, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT_DIR / "manual_seed_questions.json").write_text(json.dumps(seed_questions, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT_DIR / "manual_extraction_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    sql = ["-- Generated by pyq_ingestion/manual_extract_compiled_chapters.py", "begin;"]
    sql.extend(sql_row(q) for q in seed_questions)
    sql.append("commit;")
    (OUT_DIR / "manual_gate_questions_seed.sql").write_text("\n".join(sql) + "\n", encoding="utf-8")

    print(f"Aligned questions: {len(all_questions)}")
    print(f"Seedable gradable questions: {len(seed_questions)}")
    print(f"Report: {OUT_DIR / 'manual_extraction_report.json'}")
    print(f"SQL: {OUT_DIR / 'manual_gate_questions_seed.sql'}")


if __name__ == "__main__":
    main()
