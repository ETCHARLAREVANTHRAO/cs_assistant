# PYQ Exam Feature â€” Progress Tracker

> **Note:** There are now two separate, complementary PYQ systems in this codebase â€” don't confuse them:
> - **This doc** describes the Supabase-backed, year-keyed practice bank (`gate_questions` / `gate_exam_attempts`), built incrementally from the compiled-book ingestion pipeline. Long-term project, sparse today.
> - **`app/core/pyq_data.py` / `app/core/pyq_scoring.py` / `app/routes/pyq.py`** is a separate system: two complete, curated 65-question full-length mock exams (GATE CS 2026 Session 1 & 2) served from local JSON in `app/data/gate_pyqs/`, keyed by `paper_id`, with a real exam UI (timer, palette, MCQ/MSQ/NAT, negative marking, solution review) in the Expo app. Ready to use now.
>
> Both live under the `/pyq/*` prefix with non-overlapping route names (`/pyq/papers*`/`/pyq/attempts*` vs. the `/pyq/years`/`/pyq/exam/{year}` planned below). Keep it that way, or consolidate deliberately â€” don't let one silently overwrite the other.

## âœ… What Has Been Done

### 1. Architecture â€” revised
Originally planned as a separate `exam-rag-backend` service; **consolidated into the existing `my-assistant-backend`** instead (reuses the same Supabase project, Firebase auth, and patterns already in place). The `exam-rag-backend` repo referenced in earlier notes is not part of this plan anymore.

### 2. Database Schema
`supabase_pyq_setup.sql` creates:
- `gate_questions` â€” year, subject, type (MCQ/MSQ/NAT/DESCRIPTIVE), question text, options, correct answer, marks. Unique key is `(year, subject, original_label, set_label)` â€” `question_number` alone isn't reliable since old GATE papers use non-integer numbering (`9d`, `1.25`) and some years split into multiple sets that restart numbering.
- `gate_exam_attempts` â€” per-user exam sessions, answers, scores.
- Both tables are live in Supabase (created via the pooler connection â€” see `pyq_ingestion/README.md` for why the direct connection doesn't work from this network).

### 3. Ingestion Pipeline (`pyq_ingestion/`)
Working end-to-end, validated on one chapter:
- `extract_compiled_chapter.py` â€” parses a GATEOverflow compiled-book chapter (Answer Keys via regex, question structuring via LLM â€” never inventing missing content).
- `finalize_and_insert.py` â€” classifies gradability from the answer value itself, upserts into `gate_questions`.
- `ocr_year_papers.py` â€” OCRs the original year-wise scanned papers (`CS/CS/*.pdf` in the shared Drive folder).
- `enrich_options_from_year_papers.py` â€” fills blank MCQ options by cross-referencing the OCR'd year papers, matching by question content.

**Validated result:** Graph Theory chapter (volume 1) â†’ 17 gradable questions ingested, 3 of 4 MCQs enriched with real option text from year papers.

---

## âŒ What Still Needs To Be Done

### Ingestion â€” most of the corpus remains
- [x] Download public GATEOverflow source PDFs into `source_pdfs/` (`filter1_volume1.pdf`, `filter1_volume2.pdf`, `filter1_volume3.pdf`)
- [x] Prepare chapter text files with `pyq_ingestion/prepare_compiled_chapters.py`; 22 chapter files are staged in `pyq_ingestion/compiled_chapters/`
- [x] Generate offline/manual extraction output with `pyq_ingestion/manual_extract_compiled_chapters.py`; current local seed has 1,178 validated gradable rows from exact chapter alignment plus safe topic-group recovery
- [ ] Run `extract_compiled_chapter.py` for validated chapters once `GROQ_API_KEY` is available
- [ ] Run `finalize_and_insert.py <pooler_db_password>` once the Supabase pooler DB password is available
- [ ] Run `enrich_options_from_year_papers.py <pooler_db_password>` after inserts
- [ ] Repair remaining unrecovered topic groups where PDF text extraction drops question titles/content; see `pyq_ingestion/manual_output/manual_extraction_report.json`
- [ ] Repair or re-source the 4 corrupted year papers (`CS2011`, `CS2012`, `CS1-2017`, `CS2-2021`) if better copies become available â€” currently unreadable by any method
- [ ] 2015 Set 2/3 papers aren't in the Drive folder at all â€” some enrichment matches can't be attempted for that year

### API endpoints (not started)
- [x] `GET /pyq/years` â€” list available years + user's best score
- [x] `GET /pyq/exam/{year}` â€” fetch questions for a year (no answer keys sent to client)
- [x] `POST /pyq/exam/{year}/submit` â€” grade answers, return solutions, write to `gate_exam_attempts`

### Web app (`my-assistant-mobile/web/`)
- [x] Wire the existing (currently mock-data) Quiz pages to these real endpoints
- [x] Build a year/exam selector, timed exam interface, and results/review screen

### Data quality
- [ ] Only ~19% of source questions per chapter end up gradable at present (mostly NAT) â€” MCQ/MSQ yield is much lower due to blank math options in the compiled book. Enrichment from year papers helps prose-based questions only.
---

## Product Roadmap - Prioritized Feature Backlog

Work through these one by one, from most important to least important.

### 1. Learning
- [x] Complete syllabus, organized topic-wise
- [x] Video lectures (backend/UI slots support iframe embed URLs; add real links per topic)
- [x] Written notes
- [x] Revision notes as 1-2 page summaries
- [x] Formula sheets
- [x] Mind maps
- [x] Previous year concepts linked to each topic

### 2. Practice
- [x] Topic-wise MCQs
- [x] Subject-wise tests
- [x] Chapter-wise PYQs
- [x] Mixed practice sets
- [x] Daily practice questions
- [x] Difficulty levels from Easy to Hard

### 3. Mock Tests
- [x] Full-length GATE simulator with exact exam-style UI
- [x] Sectional tests
- [x] Adaptive tests
- [x] Instant analysis
- [x] Percentile prediction
- [x] Time spent per question

### 4. Performance Analytics
- [x] Weak and strong topics
- [x] Accuracy by subject
- [x] Time management analysis
- [x] Improvement graph
- [x] Rank prediction
- [x] Personalized study plan

### 5. Doubt Solving
- [x] AI doubt solver
- [x] Community discussion
- [x] Faculty answers
- [x] Image upload for handwritten questions

### 6. Study Planning
- [x] Daily planner
- [x] Custom timetable
- [x] Goal tracking
- [x] Streaks
- [x] Revision reminders

### 7. Resources
- [x] PYQs with solutions
- [x] Standard book recommendations
- [x] Important formulas
- [x] Cheat sheets
- [x] Error notebook
- [x] Short tricks

### 8. AI Features
- [x] AI tutor that teaches concepts
- [x] AI quiz generator
- [x] AI interview/exam mentor
- [x] AI explains why an option is wrong
- [x] AI creates revision plans

### 9. Community
- [x] Discussion forum
- [x] Leaderboards
- [x] Study groups
- [x] Mentor sessions
- [x] Success stories

### 10. Exam Information
- [x] GATE notifications
- [x] Syllabus updates
- [x] Exam pattern
- [x] Cutoffs
- [x] College predictor
- [x] PSU information
- [x] M.Tech admission guidance

### 11. Motivation
- [x] Daily quote
- [x] Daily challenge
- [x] Study timer using Pomodoro
- [x] Progress badges
- [x] Consistency rewards

### 12. Revision
- [x] 7-day revision plan
- [x] 30-day crash course
- [x] Last-minute notes
- [x] Most repeated PYQs
- [x] Frequently asked concepts






### Production Admin Controls
- [x] Admin UI to manage formulas, cheat sheets, book recommendations, exam notices, mentor sessions, and short tricks

