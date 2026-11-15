import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.routes.resume import (
    DEFAULT_RESUME,
    ResumeAnalyzeRequest,
    ResumeJdRequest,
    ResumeSaveRequest,
    _calculate_ats_score,
    _clean_json_from_llm,
    _merge_resume_updates,
    analyze_resume_endpoint,
    get_default_resume,
    match_job_description_endpoint,
    save_cloud_resume,
    list_cloud_resumes,
    load_cloud_resume,
    delete_cloud_resume,
)


def test_calculate_ats_score():
    score_data = _calculate_ats_score(DEFAULT_RESUME)
    assert score_data["score"] >= 80
    assert "contact_info" in score_data["breakdown"]
    assert "experience" in score_data["breakdown"]
    assert len(score_data["strengths"]) > 0


def test_clean_json_and_repair():
    text_with_json = """Here is your updated summary:
```json
{
  "summary": "High-impact Backend Engineer with distributed systems expertise."
}
```
All set!"""
    res = _clean_json_from_llm(text_with_json)
    assert res is not None
    assert "summary" in res
    assert "Backend Engineer" in res["summary"]


def test_merge_resume_updates():
    original = {
        "personalInfo": {"fullName": "Alex Rivera", "headline": "Dev"},
        "summary": "Old summary",
        "experience": [],
    }
    updates = {
        "summary": "New summary",
        "personalInfo": {"headline": "Senior Architect"},
    }
    merged = _merge_resume_updates(original, updates)
    assert merged["summary"] == "New summary"
    assert merged["personalInfo"]["fullName"] == "Alex Rivera"
    assert merged["personalInfo"]["headline"] == "Senior Architect"


def test_get_default_resume_endpoint():
    res = asyncio.run(get_default_resume())
    assert "resume" in res
    assert res["resume"]["personalInfo"]["fullName"] == "Alex Rivera"


def test_analyze_resume_endpoint():
    req = ResumeAnalyzeRequest(resume=DEFAULT_RESUME)
    res = asyncio.run(analyze_resume_endpoint(req))
    assert res.score >= 80
    assert len(res.strengths) > 0


def test_jd_match_endpoint():
    jd_req = ResumeJdRequest(
        resume=DEFAULT_RESUME,
        jd_text="Looking for a Backend Software Engineer with Go, Docker, PostgreSQL, Redis and Kubernetes experience."
    )
    res = asyncio.run(match_job_description_endpoint(jd_req))
    assert res.match_percentage >= 70
    assert "Go" in res.matching_skills or "Docker" in res.matching_skills
    assert len(res.recommendations) > 0


def test_cloud_endpoints():
    save_req = ResumeSaveRequest(
        resume_id="test-cloud-id",
        title="My Automated Test Resume",
        resume=DEFAULT_RESUME,
        ats_score=92
    )
    saved = asyncio.run(save_cloud_resume(save_req, user_id="test_user_ci"))
    assert saved.get("resume_id") == "test-cloud-id"

    listed = asyncio.run(list_cloud_resumes(user_id="test_user_ci"))
    assert isinstance(listed.get("resumes", []), list)

    deleted = asyncio.run(delete_cloud_resume("test-cloud-id", user_id="test_user_ci"))
    assert deleted.get("success") is True


if __name__ == "__main__":
    test_calculate_ats_score()
    test_clean_json_and_repair()
    test_merge_resume_updates()
    test_get_default_resume_endpoint()
    test_analyze_resume_endpoint()
    test_jd_match_endpoint()
    test_cloud_endpoints()
    print("All backend/tests/test_resume.py assertions passed successfully!")
