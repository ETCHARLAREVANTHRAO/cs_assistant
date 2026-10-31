"""
Centralized configuration for external Public APIs and environment variables.
Provides clean access with sensible defaults matching public-apis/public-apis catalog.
"""
import os
from typing import Optional

# ------------------------------------------------------------------------------
# Coding, Execution & STEM Tools
# ------------------------------------------------------------------------------
# Wandbox & Judge0: Open code execution engines (C, C++, Python, etc.)
WANDBOX_API_URL: str = os.getenv("WANDBOX_API_URL", "https://wandbox.org/api/compile.json")
JUDGE0_API_URL: str = os.getenv("JUDGE0_API_URL", "https://ce.judge0.com")
JUDGE0_API_KEY: Optional[str] = os.getenv("JUDGE0_API_KEY")
PISTON_API_URL: str = os.getenv("PISTON_API_URL", "https://emkc.org/api/v2/piston")

NEWTON_MATH_API_URL: str = os.getenv("NEWTON_MATH_API_URL", "https://newton.vercel.app/api/v2")
MATHJS_API_URL: str = os.getenv("MATHJS_API_URL", "https://api.mathjs.org/v4")

ARXIV_API_URL: str = os.getenv("ARXIV_API_URL", "https://export.arxiv.org/api/query")
STACKEXCHANGE_API_URL: str = os.getenv("STACKEXCHANGE_API_URL", "https://api.stackexchange.com/2.3")
STACKEXCHANGE_API_KEY: Optional[str] = os.getenv("STACKEXCHANGE_API_KEY")

# ------------------------------------------------------------------------------
# Books, Academic References & Wikipedia
# ------------------------------------------------------------------------------
OPEN_LIBRARY_API_URL: str = os.getenv("OPEN_LIBRARY_API_URL", "https://openlibrary.org")
GOOGLE_BOOKS_API_URL: str = os.getenv("GOOGLE_BOOKS_API_URL", "https://www.googleapis.com/books/v1/volumes")
GOOGLE_BOOKS_API_KEY: Optional[str] = os.getenv("GOOGLE_BOOKS_API_KEY")

WIKIPEDIA_API_URL: str = os.getenv("WIKIPEDIA_API_URL", "https://en.wikipedia.org/api/rest_v1")

# ------------------------------------------------------------------------------
# General Aptitude (GA), English & Vocabulary
# ------------------------------------------------------------------------------
DATAMUSE_API_URL: str = os.getenv("DATAMUSE_API_URL", "https://api.datamuse.com")
DICTIONARY_API_URL: str = os.getenv("DICTIONARY_API_URL", "https://api.dictionaryapi.dev/api/v2/entries/en")

# ------------------------------------------------------------------------------
# Productivity, Motivation & Assistant Utilities
# ------------------------------------------------------------------------------
OPEN_METEO_API_URL: str = os.getenv("OPEN_METEO_API_URL", "https://api.open-meteo.com/v1/forecast")
OPEN_METEO_GEOCODING_URL: str = os.getenv("OPEN_METEO_GEOCODING_URL", "https://geocoding-api.open-meteo.com/v1/search")
OPENWEATHER_API_KEY: Optional[str] = os.getenv("weather") or os.getenv("OPENWEATHER_API_KEY")

ZENQUOTES_API_URL: str = os.getenv("ZENQUOTES_API_URL", "https://zenquotes.io/api")
ZENQUOTES_API_KEY: Optional[str] = os.getenv("ZENQUOTES_API_KEY")
QUOTABLE_API_URL: str = os.getenv("QUOTABLE_API_URL", "https://api.quotable.io")

NAGER_DATE_API_URL: str = os.getenv("NAGER_DATE_API_URL", "https://date.nager.at/api/v3")
HACKER_NEWS_API_URL: str = os.getenv("HACKER_NEWS_API_URL", "https://hacker-news.firebaseio.com/v0")

