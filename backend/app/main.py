import os

# Clean invalid/inaccessible SSLKEYLOGFILE if present to avoid SSL context crashes
if "SSLKEYLOGFILE" in os.environ:
    try:
        with open(os.environ["SSLKEYLOGFILE"], "a"):
            pass
    except Exception:
        os.environ.pop("SSLKEYLOGFILE", None)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(usecwd=True))

from app.routes import chat, documents, weather, usage, pyq, learning, doubts, planner, resources, complete, admin_content, admin_dashboard, local_chat, notifications, research


@asynccontextmanager
async def lifespan(_: FastAPI):
    from app.core.rag import _log
    from app.core.vectorstore import get_embeddings, get_vectorstore

    try:
        get_embeddings()    # load ONNX model into memory
        get_vectorstore()   # initialise Supabase client
    except Exception as exc:
        _log(f"Startup warmup skipped: {exc}")

    yield


app = FastAPI(title="my_assistant API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mycsassistant.in",
        "https://www.mycsassistant.in",
        "https://api.mycsassistant.in",
        "https://my-assistant-mobile.vercel.app",
        "https://my-assistant-mobile.pages.dev",
        "https://20701fbc.my-assistant-mobile.pages.dev",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173",
    ],
    allow_origin_regex=r"^https://([a-zA-Z0-9-]+\.)*(mycsassistant\.in|pages\.dev|vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(weather.router)
app.include_router(usage.router)
app.include_router(pyq.router)
app.include_router(learning.router)
app.include_router(doubts.router)
app.include_router(planner.router)
app.include_router(resources.router)
app.include_router(complete.router)
app.include_router(admin_content.router)
app.include_router(admin_dashboard.router)
app.include_router(local_chat.router)
app.include_router(notifications.router)
app.include_router(research.router)

_pyq_assets_dir = os.path.join(os.path.dirname(__file__), "data", "gate_pyqs")
app.mount("/pyq-assets", StaticFiles(directory=_pyq_assets_dir), name="pyq-assets")


@app.get("/health")
async def health():
    return {"status": "ok"}
