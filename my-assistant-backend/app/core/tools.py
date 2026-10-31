import json
import os
import httpx
from datetime import datetime
from pathlib import Path
from langchain_core.tools import tool

from . import vectorstore, config

CALENDAR_FILE = Path("./calendar.json")
CLIENT_KWARGS = {"timeout": 10.0, "verify": False, "follow_redirects": True}


@tool
def search_documents(query: str) -> str:
    """Search the user's uploaded documents for relevant information."""
    result = vectorstore.search_documents(query)
    return result or "No relevant content found in uploaded documents."


@tool
def internet_search(query: str) -> str:
    """Search the internet for current news, sports scores, facts, or anything not in the user's documents."""
    try:
        from ddgs import DDGS
        results = DDGS(verify=False).text(query, max_results=5)
        if not results:
            return f"No results found for '{query}'."
        return "\n\n".join(
            f"{r['title']}\n{r['body']}" for r in results
        )
    except Exception as e:
        return f"Web search failed: {type(e).__name__}: {e}"


@tool
def execute_code(code: str, language: str = "c") -> str:
    """Execute a code snippet in C, C++, or Python to verify code tracing, pointers, recursion, or output."""
    try:
        with httpx.Client(**CLIENT_KWARGS) as client:
            if language.lower() in ["c", "cpp", "c++"]:
                compiler = "gcc-head"
                payload = {"code": code, "compiler": compiler}
                resp = client.post(config.WANDBOX_API_URL, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    out = data.get("program_output") or data.get("compiler_error") or "Program finished with no output."
                    return f"Execution Output:\n{out.strip()}"
            # Python fallback / execution
            elif language.lower() in ["python", "py"]:
                payload = {"source_code": code, "language_id": 71}
                resp = client.post(f"{config.JUDGE0_API_URL}/submissions?wait=true", json=payload)
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    out = data.get("stdout") or data.get("stderr") or data.get("compile_output") or "Finished with no output."
                    return f"Execution Output:\n{out.strip()}"
            return f"Unsupported language '{language}'. Please use 'c', 'cpp', or 'python'."
    except Exception as e:
        return f"Code execution failed: {type(e).__name__}: {e}"


@tool
def solve_math(expression: str, operation: str = "simplify") -> str:
    """Evaluate symbolic math expressions, calculus (simplify, derive, integrate, factor, zero) for Engineering Math and NAT questions."""
    op = operation.lower().strip()
    if op not in ["simplify", "factor", "derive", "integrate", "zero", "tangent", "area", "cos", "sin", "tan"]:
        op = "simplify"
    try:
        with httpx.Client(**CLIENT_KWARGS) as client:
            resp = client.get(f"{config.NEWTON_MATH_API_URL}/{op}/{expression}")
            if resp.status_code == 200:
                result = resp.json().get("result")
                return f"Math Result ({op} {expression}): {result}"
            # Fallback to mathjs
            resp_mathjs = client.get(f"{config.MATHJS_API_URL}/", params={"expr": expression})
            if resp_mathjs.status_code == 200:
                return f"Evaluated Expression ({expression}): {resp_mathjs.text.strip()}"
            return f"Could not solve math expression '{expression}'."
    except Exception as e:
        return f"Math solver failed: {type(e).__name__}: {e}"


@tool
def lookup_vocabulary(word: str) -> str:
    """Look up dictionary definition, synonyms, and verbal aptitude context for a word."""
    try:
        with httpx.Client(**CLIENT_KWARGS) as client:
            resp = client.get(f"{config.DICTIONARY_API_URL}/{word.strip()}")
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and data:
                    meanings = data[0].get("meanings", [])
                    defs = []
                    for m in meanings[:2]:
                        part = m.get("partOfSpeech", "")
                        d_list = [d.get("definition") for d in m.get("definitions", [])[:2]]
                        defs.append(f"[{part}] " + "; ".join(d_list))
                    return f"Word: '{word}'\n" + "\n".join(defs)
            # Datamuse fallback for related words
            resp_dm = client.get(f"{config.DATAMUSE_API_URL}/words", params={"ml": word, "max": 4})
            if resp_dm.status_code == 200:
                related = [item.get("word") for item in resp_dm.json()]
                return f"Related words/synonyms for '{word}': {', '.join(related)}"
            return f"No definition found for '{word}'."
    except Exception as e:
        return f"Vocabulary lookup failed: {type(e).__name__}: {e}"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for any city using Open-Meteo or OpenWeatherMap."""
    # Try Open-Meteo first (100% keyless & reliable)
    try:
        with httpx.Client(**CLIENT_KWARGS) as client:
            geo_resp = client.get(config.OPEN_METEO_GEOCODING_URL, params={"name": city, "count": 1})
            if geo_resp.status_code == 200 and geo_resp.json().get("results"):
                loc = geo_resp.json()["results"][0]
                lat, lon = loc["latitude"], loc["longitude"]
                w_resp = client.get(
                    config.OPEN_METEO_API_URL,
                    params={"latitude": lat, "longitude": lon, "current_weather": True},
                )
                if w_resp.status_code == 200:
                    cw = w_resp.json().get("current_weather", {})
                    country = loc.get("country", "")
                    return f"Weather in {loc.get('name')}, {country}: {cw.get('temperature')}°C, Wind: {cw.get('windspeed')} km/h"
    except Exception:
        pass

    # Fallback to OpenWeatherMap if configured
    if config.OPENWEATHER_API_KEY:
        try:
            with httpx.Client(**CLIENT_KWARGS) as client:
                resp = client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"q": city, "appid": config.OPENWEATHER_API_KEY, "units": "metric"},
                )
                resp.raise_for_status()
                d = resp.json()
                return (
                    f"Weather in {d['name']}: {d['weather'][0]['description'].capitalize()}, "
                    f"{d['main']['temp']}°C (feels like {d['main']['feels_like']}°C), "
                    f"Humidity: {d['main']['humidity']}%, Wind: {d['wind']['speed']} m/s"
                )
        except Exception as e:
            return f"Could not fetch weather for '{city}': {e}"

    return f"Weather service temporarily unavailable for '{city}'."


@tool
def get_datetime(timezone: str = "") -> str:
    """Get the current date and time. The timezone parameter is optional and ignored."""
    now = datetime.now()
    return now.strftime("Today is %A, %B %d, %Y. The time is %I:%M %p.")


@tool
def add_calendar_event(title: str, date: str, time: str = "", notes: str = "") -> str:
    """Add an event to the calendar. Date must be in YYYY-MM-DD format. Time is optional (HH:MM)."""
    events = json.loads(CALENDAR_FILE.read_text()) if CALENDAR_FILE.exists() else []
    events.append({"title": title, "date": date, "time": time, "notes": notes})
    events.sort(key=lambda e: (e["date"], e.get("time", "")))
    CALENDAR_FILE.write_text(json.dumps(events, indent=2))
    time_str = f" at {time}" if time else ""
    return f"Event '{title}' added for {date}{time_str}."


@tool
def get_calendar_events(date_filter: str = "all") -> str:
    """Get upcoming calendar events. Pass a date in YYYY-MM-DD format to filter, or 'all' for all upcoming events."""
    if not CALENDAR_FILE.exists():
        return "No calendar events found."
    events = json.loads(CALENDAR_FILE.read_text())
    today = datetime.now().strftime("%Y-%m-%d")
    upcoming = [e for e in events if e["date"] >= today]
    if date_filter and date_filter != "all":
        upcoming = [e for e in upcoming if e["date"] == date_filter]
    if not upcoming:
        return "No upcoming events."
    lines = []
    for e in upcoming[:10]:
        line = f"• {e['date']}"
        if e.get("time"):
            line += f" at {e['time']}"
        line += f": {e['title']}"
        if e.get("notes"):
            line += f" — {e['notes']}"
        lines.append(line)
    return "\n".join(lines)


def get_all_tools():
    return [
        internet_search,
        execute_code,
        solve_math,
        lookup_vocabulary,
        get_weather,
        get_datetime,
        add_calendar_event,
        get_calendar_events,
    ]
