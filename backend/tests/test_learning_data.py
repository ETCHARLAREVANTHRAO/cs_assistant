from fastapi.testclient import TestClient

from app.core.auth import verify_token
from app.core.learning_data import all_subjects_detail
from app.main import app
from app.models import LearningSubjectDetail


def test_learning_corpus_has_complete_structured_resources():
    data = all_subjects_detail()

    assert len(data) >= 22
    assert sum(len(subject["topics"]) for subject in data) >= 158

    for subject in data:
        LearningSubjectDetail(**subject)
        assert subject["topic_count"] == len(subject["topics"])
        assert subject["roadmap"]
        assert subject["exam_strategy"]
        assert subject["milestones"]
        assert len(subject["curated_resources"]) >= 4
        assert "pyq_available" in subject
        if subject["pyq_available"]:
            assert subject["pyq_subject"]

        for topic in subject["topics"]:
            assert topic["concepts"]
            assert topic["difficulty"] in {"Easy", "Medium", "Hard"}
            assert topic["estimated_study_minutes"] > 0
            assert topic["written_notes"]
            assert topic["revision_summary"]
            assert topic["notes_by_language"]["en"]
            assert topic["notes_by_language"]["hi"]
            assert topic["revision_by_language"]["en"]
            assert topic["revision_by_language"]["hi"]
            assert topic["deep_notes"]
            assert topic["formula_sheet"]
            assert topic["mind_map"]
            assert topic["pyq_concepts"]
            assert topic["common_mistakes"]
            assert topic["practice_tasks"]
            assert topic["study_flow"]
            assert topic["prerequisites"]
            assert topic["learning_outcomes"]
            assert topic["quick_checks"]
            assert topic["flashcards"]
            assert topic["interview_prompts"]
            assert topic["diagram"]
            assert topic["quiz_questions"]
            assert topic["worked_examples"]
            assert topic["memory_hooks"]
            assert topic["reading_pointers"]
            assert topic["revision_schedule"]
            assert topic["mastery_rubric"]
            assert len(topic["reference_links"]) >= 4
            assert len(topic["video_lectures"]) >= 3
            assert all(video["url"] for video in topic["video_lectures"])
            assert all(video["embed_url"] for video in topic["video_lectures"])
            assert all(card["front"] and card["back"] for card in topic["flashcards"])
            assert all(question["answer"] in question["options"] for question in topic["quiz_questions"])
            assert all(example["problem"] and example["solution"] for example in topic["worked_examples"])
            assert all(item["when"] and item["task"] for item in topic["revision_schedule"])
            assert all(section["heading"] and section["body"] for section in topic["deep_notes"])


def test_learning_api_serializes_expanded_syllabus():
    app.dependency_overrides[verify_token] = lambda: "learning-test-user"
    client = TestClient(app)

    response = client.get("/learning/syllabus")

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 22
    assert sum(len(subject["topics"]) for subject in data) >= 158
    assert all(subject["roadmap"] for subject in data)
    assert all(topic["reference_links"] for subject in data for topic in subject["topics"])
    assert all(topic["flashcards"] for subject in data for topic in subject["topics"])
    assert any(subject["pyq_available"] for subject in data)

    sheet_response = client.get("/learning/subjects/operating-systems/cheat-sheet")
    assert sheet_response.status_code == 200
    assert "Operating Systems Cheat Sheet" in sheet_response.text
    assert "CPU Scheduling" in sheet_response.text

    all_sheet_response = client.get("/learning/cheat-sheet")
    assert all_sheet_response.status_code == 200
    assert "Operating Systems Cheat Sheet" in all_sheet_response.text
    assert "AI and Machine Learning Cheat Sheet" in all_sheet_response.text

    pdf_response = client.get("/learning/subjects/operating-systems/cheat-sheet.pdf")
    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"] == "application/pdf"
    assert pdf_response.content.startswith(b"%PDF-1.4")

    all_pdf_response = client.get("/learning/cheat-sheet.pdf")
    assert all_pdf_response.status_code == 200
    assert all_pdf_response.content.startswith(b"%PDF-1.4")


def test_learning_progress_api_uses_user_store(monkeypatch):
    from app.core import firestore_service

    saved: dict[str, dict] = {}

    def fake_list(user_id: str):
        assert user_id == "learning-test-user"
        return [value | {"topic_key": key} for key, value in saved.items()]

    def fake_set(user_id: str, topic_key: str, updates: dict):
        assert user_id == "learning-test-user"
        saved[topic_key] = saved.get(topic_key, {}) | updates | {"updated_at": "now"}
        return saved[topic_key] | {"topic_key": topic_key}

    monkeypatch.setattr(firestore_service, "list_learning_progress", fake_list)
    monkeypatch.setattr(firestore_service, "set_learning_progress", fake_set)

    app.dependency_overrides[verify_token] = lambda: "learning-test-user"
    client = TestClient(app)

    update = client.put("/learning/progress/operating-systems:cpu-scheduling", json={"status": "mastered", "bookmarked": True})
    assert update.status_code == 200
    assert update.json()["status"] == "mastered"
    assert update.json()["bookmarked"] is True

    listing = client.get("/learning/progress")
    assert listing.status_code == 200
    assert listing.json()["items"][0]["topic_key"] == "operating-systems:cpu-scheduling"


def test_learning_overrides_can_patch_subject_and_topic():
    from app.core.learning_data import all_subjects_detail, apply_learning_overrides

    data = apply_learning_overrides(
        all_subjects_detail(),
        {
            "subjects": {"operating-systems": {"description": "Custom OS notes"}},
            "topics": {
                "operating-systems:cpu-scheduling": {
                    "written_notes": "Custom scheduling note",
                    "formula_sheet": ["Custom formula"],
                }
            },
        },
    )
    os_subject = next(subject for subject in data if subject["slug"] == "operating-systems")
    scheduling = next(topic for topic in os_subject["topics"] if topic["slug"] == "cpu-scheduling")

    assert os_subject["description"] == "Custom OS notes"
    assert scheduling["written_notes"] == "Custom scheduling note"
    assert scheduling["formula_sheet"] == ["Custom formula"]
