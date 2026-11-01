from datetime import date
import httpx
from app.core import firestore_service, pyq_analytics, pyq_data, resources_data, config

_QUOTE_CACHE = {"date": None, "quote": None, "author": None}


def _get_daily_quote(today_ord: int) -> str:
    today_str = date.today().isoformat()
    if _QUOTE_CACHE["date"] == today_str and _QUOTE_CACHE["quote"]:
        return f'"{_QUOTE_CACHE["quote"]}" — {_QUOTE_CACHE["author"]}'

    # Fetch fresh quote from ZenQuotes
    try:
        with httpx.Client(timeout=4.0, verify=False, follow_redirects=True) as client:
            resp = client.get(f"{config.ZENQUOTES_API_URL}/today")
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and data:
                    q = data[0].get("q")
                    a = data[0].get("a")
                    _QUOTE_CACHE["date"] = today_str
                    _QUOTE_CACHE["quote"] = q
                    _QUOTE_CACHE["author"] = a
                    return f'"{q}" — {a}'
    except Exception:
        pass

    return QUOTES[today_ord % len(QUOTES)]

EXAM_INFO = {
    "last_updated": "2026-08-01",
    "official_source": "https://gate2027.iitm.ac.in/",
    "organizer": "IIT Madras",
    "notifications": [
        "GATE 2027 official website is live.",
        "GATE 2027 has 30 test papers.",
        "Syllabi for GATE 2027 test papers have been revised; candidates should check the official syllabus.",
        "New Robotics and Automation paper introduced.",
    ],
    "important_dates": [
        {"label": "GOAPS registration opens", "date": "2026-08-14"},
        {"label": "Regular registration closes", "date": "2026-09-21"},
        {"label": "Extended registration closes", "date": "2026-09-30"},
        {"label": "Exam week 1", "date": "2027-02-06 to 2027-02-07"},
        {"label": "Exam week 2", "date": "2027-02-13 to 2027-02-14"},
        {"label": "Exam week 3", "date": "2027-02-20 to 2027-02-21"},
        {"label": "Results", "date": "2027-03-19"},
    ],
    "exam_pattern": [
        "Computer-based test for 3 hours.",
        "Total marks: 100, including General Aptitude and subject questions.",
        "Question types include MCQ, MSQ, and NAT.",
        "MCQs may carry negative marking; MSQ/NAT generally do not unless specified by paper instructions.",
    ],
    "cutoffs": [
        {"category": "General", "note": "Varies yearly by paper; use official scorecard/CCMT notices for final values."},
        {"category": "OBC-NCL/EWS", "note": "Usually lower than General cutoff; confirm from official result year."},
        {"category": "SC/ST/PwD", "note": "Usually lower than OBC/EWS cutoff; confirm from official result year."},
    ],
    "college_predictor": [
        "70+ marks in CS: target old IIT/IISc shortlist range, depending on year difficulty.",
        "60-70 marks: strong NIT/IIT possibilities; verify branch and category-specific cutoffs.",
        "50-60 marks: good NIT/IIIT and state opportunities; prioritize CCMT choices carefully.",
        "Below 50 marks: use score strategically for state colleges, self-sponsored M.Tech, or prepare next attempt.",
    ],
    "psu_information": [
        "Some PSUs shortlist using valid GATE scores; each PSU releases separate vacancies and eligibility.",
        "CS candidates should track roles from organizations such as IOCL, BARC/PSU technical streams, and IT/cyber-specific recruitments when announced.",
        "GATE qualification does not guarantee PSU recruitment; always verify official PSU notifications.",
    ],
    "mtech_guidance": [
        "Use GATE score for IIT direct applications and CCMT for many NIT/IIIT/CFTI programs.",
        "Prepare SOP/research interests for research-oriented M.Tech/MS interviews.",
        "Track separate institute portals because many IITs do not rely only on CCMT.",
    ],
}

QUOTES = [
    "Consistency beats intensity when the exam is far away.",
    "One solved mistake is more valuable than ten ignored questions.",
    "Accuracy first, speed second, rank third.",
    "A small daily streak becomes a syllabus-sized advantage.",
]

CHALLENGES = [
    "Solve 10 questions from your weakest topic.",
    "Revise one formula sheet and write three traps from memory.",
    "Take a 25-minute timed mixed drill.",
    "Review every incorrect question from your last attempt.",
]

BADGES = [
    {"name": "First Drill", "rule": "Complete one PYQ/practice attempt."},
    {"name": "Accuracy Builder", "rule": "Reach 70% accuracy in any subject."},
    {"name": "Streak Starter", "rule": "Complete study tasks on 3 different days."},
    {"name": "Error Cleaner", "rule": "Resolve 10 error notebook items."},
]

REVISION_PLANS = {
    "7_day": [
        "Day 1: Engineering Mathematics + aptitude formulas.",
        "Day 2: Programming, data structures, and algorithms patterns.",
        "Day 3: Operating systems and DBMS high-weight chapters.",
        "Day 4: Computer networks and COA numericals.",
        "Day 5: TOC, compiler design, and digital logic.",
        "Day 6: Full mock + detailed error notebook review.",
        "Day 7: Formula sheets, repeated PYQs, and calm final revision.",
    ],
    "30_day": [
        "Days 1-5: Mathematics, aptitude, and discrete foundations.",
        "Days 6-10: Programming, data structures, and algorithms.",
        "Days 11-15: OS and DBMS with daily PYQs.",
        "Days 16-20: CN, COA, and digital logic numericals.",
        "Days 21-24: TOC and compiler design.",
        "Days 25-28: Full mocks, sectional mocks, and weak-topic repair.",
        "Days 29-30: Last-minute notes, formulas, and error notebook only.",
    ],
    "last_minute": [
        "Do not start a brand-new large topic unless it is very high weight.",
        "Revise formula sheets and solved mistakes first.",
        "Take short timed sets, not exhausting all-day tests.",
        "Sleep and exam-day logistics are part of preparation.",
    ],
}

COMMUNITY_SEED = {
    "study_groups": [
        {"name": "GATE CS 2027 Core", "focus": "Daily accountability and full syllabus coverage."},
        {"name": "PYQ Revision Circle", "focus": "Repeated PYQs, solution discussion, and error review."},
        {"name": "Mock Test Lab", "focus": "Weekly full mocks and rank improvement analysis."},
    ],
    "mentor_sessions": [
        {"title": "How to analyze mocks", "status": "planned"},
        {"title": "High-weight CS subjects strategy", "status": "planned"},
    ],
    "success_stories": [
        "Aspirants who improve fastest usually revise mistakes within 24 hours.",
        "Stable rank growth comes from timed practice plus topic repair, not random question volume.",
    ],
}


def exam_info():
    try:
        admin = firestore_service.get_admin_content()
        return admin.get("exam_info") or EXAM_INFO
    except Exception:
        return EXAM_INFO


def motivation(user_id: str):
    today_ord = date.today().toordinal()
    streak = {"current_streak": 0, "longest_streak": 0}
    rewards = []
    if user_id and user_id != "anonymous":
        try:
            analytics = pyq_analytics.compute_analytics(user_id)
            streak = firestore_service.get_study_streak(user_id)
            if analytics.get("total_attempts"):
                rewards.append("First Drill")
            if analytics.get("overall_accuracy", 0) >= 70:
                rewards.append("Accuracy Builder")
            if streak.get("current_streak", 0) >= 3:
                rewards.append("Streak Starter")
            resolved_errors = sum(1 for item in resources_data.error_notebook(user_id) if item.get("resolved"))
            if resolved_errors >= 10:
                rewards.append("Error Cleaner")
        except Exception:
            pass
    return {
        "daily_quote": _get_daily_quote(today_ord),
        "daily_challenge": CHALLENGES[today_ord % len(CHALLENGES)],
        "pomodoro": {"focus_minutes": 25, "short_break_minutes": 5, "long_break_minutes": 15, "cycles": 4},
        "progress_badges": BADGES,
        "earned_rewards": rewards,
        "consistency": {"current_streak": streak.get("current_streak", 0), "longest_streak": streak.get("longest_streak", 0)},
    }


def revision(user_id: str):
    repeated = pyq_data.topic_frequency()[:12]
    personalized = []
    if user_id and user_id != "anonymous":
        try:
            analytics = pyq_analytics.compute_analytics(user_id)
            personalized = analytics.get("personalized_study_plan", [])
        except Exception:
            pass
    return {
        **REVISION_PLANS,
        "most_repeated_pyqs": repeated,
        "frequently_asked_concepts": [item["topic"] for item in repeated],
        "personalized_focus": personalized,
    }


def community(user_id: str):
    seed = dict(COMMUNITY_SEED)
    posts = []
    leaderboard = []
    try:
        admin = firestore_service.get_admin_content()
        if admin.get("mentor_sessions"):
            seed["mentor_sessions"] = admin["mentor_sessions"]
        posts = firestore_service.list_community_posts()
        leaderboard = firestore_service.practice_leaderboard()
    except Exception:
        pass
    return {
        "posts": posts,
        "leaderboard": leaderboard,
        **seed,
    }


