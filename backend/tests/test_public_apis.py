"""
Test suite for external Public APIs configured in .env and app.core.config.
Tests reachability, response time, status codes, and parses response payloads.
"""
import os
import sys
import time
import httpx
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Load .env
load_dotenv(find_dotenv(usecwd=True))

from app.core import config

TIMEOUT = 12.0
CLIENT_KWARGS = {"timeout": TIMEOUT, "verify": False, "follow_redirects": True}


def test_wandbox():
    """Test Wandbox API for remote C code compilation & execution."""
    url = config.WANDBOX_API_URL
    payload = {
        "code": '#include <stdio.h>\nint main(){printf("Hello Wandbox C\\n");return 0;}',
        "compiler": "gcc-head",
    }
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.post(url, json=payload)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    output = resp.json().get("program_output", "").strip()
    return f"Compiled & Executed C snippet: '{output}' ({elapsed}ms)"


def test_judge0():
    """Test Judge0 CE for Python execution."""
    url = f"{config.JUDGE0_API_URL}/submissions?wait=true"
    payload = {"source_code": "print('Judge0 Python OK')", "language_id": 71}
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.post(url, json=payload)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code in [200, 201], f"Status: {resp.status_code}"
    stdout = resp.json().get("stdout", "").strip()
    return f"Stdout: '{stdout}' ({elapsed}ms)"


def test_open_meteo():
    """Test Open-Meteo Geocoding & Weather forecast without API key."""
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        # 1. Geocoding
        geo_resp = client.get(config.OPEN_METEO_GEOCODING_URL, params={"name": "New Delhi", "count": 1})
        assert geo_resp.status_code == 200, f"Geocoding status: {geo_resp.status_code}"
        results = geo_resp.json().get("results")
        assert results, "No geocoding results found"
        lat = results[0]["latitude"]
        lon = results[0]["longitude"]

        # 2. Weather
        w_resp = client.get(
            config.OPEN_METEO_API_URL,
            params={"latitude": lat, "longitude": lon, "current_weather": True},
        )
        assert w_resp.status_code == 200, f"Weather status: {w_resp.status_code}"
        data = w_resp.json().get("current_weather", {})
    elapsed = int((time.time() - t0) * 1000)
    return f"New Delhi: {data.get('temperature')}°C, wind: {data.get('windspeed')} km/h ({elapsed}ms)"


def test_newton_math():
    """Test Newton Symbolic Math API."""
    url = f"{config.NEWTON_MATH_API_URL}/simplify/2^3+4"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    res = resp.json().get("result")
    return f"2^3+4 = {res} ({elapsed}ms)"


def test_mathjs():
    """Test Math.js expression API."""
    url = f"{config.MATHJS_API_URL}/"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url, params={"expr": "sqrt(144) + 5"})
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    return f"sqrt(144)+5 = {resp.text.strip()} ({elapsed}ms)"


def test_arxiv():
    """Test arXiv API for CS preprints."""
    url = config.ARXIV_API_URL
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url, params={"search_query": "cat:cs.AI", "max_results": 1})
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    has_feed = "<feed" in resp.text
    assert has_feed, "Response does not contain XML feed"
    return f"Atom feed received with {len(resp.text)} chars ({elapsed}ms)"


def test_open_library():
    """Test Open Library for Computer Science textbooks."""
    url = f"{config.OPEN_LIBRARY_API_URL}/search.json"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url, params={"q": "Operating System Concepts Silberschatz", "limit": 1})
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    docs = resp.json().get("docs", [])
    title = docs[0].get("title", "Unknown") if docs else "None"
    return f"Found book: '{title}' ({elapsed}ms)"


def test_wikipedia():
    """Test Wikipedia REST API for CS concept definition."""
    url = f"{config.WIKIPEDIA_API_URL}/page/summary/Computer_science"
    headers = {"User-Agent": "MyAssistantBot/1.0 (https://github.com/my-assistant; student.assistant@gmail.com)"}
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url, headers=headers)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    extract = resp.json().get("extract", "")[:60]
    return f"Extract: '{extract}...' ({elapsed}ms)"


def test_datamuse():
    """Test Datamuse API for word associations (GATE General Aptitude)."""
    url = f"{config.DATAMUSE_API_URL}/words"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url, params={"ml": "algorithm", "max": 2})
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    words = [item.get("word") for item in resp.json()]
    return f"Related words for 'algorithm': {words} ({elapsed}ms)"


def test_dictionary():
    """Test Free Dictionary API."""
    url = f"{config.DICTIONARY_API_URL}/automaton"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    data = resp.json()
    word = data[0].get("word") if isinstance(data, list) else ""
    return f"Definition for '{word}' retrieved ({elapsed}ms)"


def test_zenquotes():
    """Test ZenQuotes daily motivation API."""
    url = f"{config.ZENQUOTES_API_URL}/random"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    data = resp.json()
    quote = data[0].get("q", "")[:50] if isinstance(data, list) else ""
    author = data[0].get("a", "") if isinstance(data, list) else ""
    return f"Quote: \"{quote}...\" — {author} ({elapsed}ms)"


def test_quotable():
    """Test Quotable API as alternative quote provider."""
    url = f"{config.QUOTABLE_API_URL}/random"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    data = resp.json()
    content = data.get("content", "")[:50]
    return f"Quote: \"{content}...\" ({elapsed}ms)"


def test_nager_date():
    """Test Nager.Date API for public holidays."""
    url = f"{config.NAGER_DATE_API_URL}/PublicHolidays/2025/US"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    data = resp.json()
    holiday_count = len(data) if isinstance(data, list) else 0
    first_holiday = data[0].get("localName") if data else "None"
    return f"Fetched {holiday_count} holidays (e.g. {first_holiday}) ({elapsed}ms)"


def test_hacker_news():
    """Test Hacker News Firebase API for tech updates."""
    url = f"{config.HACKER_NEWS_API_URL}/item/8863.json"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url)
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    data = resp.json()
    title = data.get("title", "")
    return f"Story: '{title}' ({elapsed}ms)"


def test_stack_exchange():
    """Test Stack Exchange API for Computer Science questions."""
    url = f"{config.STACKEXCHANGE_API_URL}/questions"
    t0 = time.time()
    with httpx.Client(**CLIENT_KWARGS) as client:
        resp = client.get(url, params={"order": "desc", "sort": "activity", "site": "stackoverflow", "pagesize": 1})
    elapsed = int((time.time() - t0) * 1000)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    items = resp.json().get("items", [])
    title = items[0].get("title", "")[:50] if items else "None"
    return f"Question: '{title}...' ({elapsed}ms)"


ALL_TESTS = [
    ("Wandbox (C/C++ Code Execution)", test_wandbox),
    ("Judge0 CE (Python/Multi-lang Execution)", test_judge0),
    ("Open-Meteo (Weather & Geocoding)", test_open_meteo),
    ("Newton Math (Calculus & Simplification)", test_newton_math),
    ("Math.js (Expression Evaluation)", test_mathjs),
    ("arXiv (CS Research Papers)", test_arxiv),
    ("Open Library (GATE CS Textbooks)", test_open_library),
    ("Wikipedia REST (CS Concepts)", test_wikipedia),
    ("Datamuse (GATE General Aptitude)", test_datamuse),
    ("Free Dictionary (Vocabulary)", test_dictionary),
    ("ZenQuotes (Daily Motivation)", test_zenquotes),
    ("Quotable (Alternative Motivation)", test_quotable),
    ("Nager.Date (Study Timetable / Holidays)", test_nager_date),
    ("Hacker News (Tech News Feed)", test_hacker_news),
    ("Stack Exchange (Doubt Solving)", test_stack_exchange),
]


def run_all():
    print("=" * 80)
    print("PUBLIC APIs CONNECTIVITY & VALIDATION TEST")
    print(f"Loaded config from: {backend_dir / '.env'}")
    print("=" * 80)

    passed = 0
    failed = 0

    for name, test_func in ALL_TESTS:
        try:
            detail = test_func()
            print(f"[PASS] {name:40} -> {detail}")
            passed += 1
        except Exception as e:
            err_msg = f"{type(e).__name__}: {e}"
            print(f"[FAIL] {name:40} -> {err_msg}")
            failed += 1

    print("=" * 80)
    print(f"Summary: {passed} passed, {failed} failed out of {len(ALL_TESTS)} APIs tested.")
    print("=" * 80)
    return failed == 0


if __name__ == "__main__":
    success = run_all()
    sys.exit(0 if success else 1)
