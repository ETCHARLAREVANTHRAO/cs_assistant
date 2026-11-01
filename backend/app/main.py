import os

# Clean invalid/inaccessible SSLKEYLOGFILE if present to avoid SSL context crashes
if "SSLKEYLOGFILE" in os.environ:
    try:
        with open(os.environ["SSLKEYLOGFILE"], "a"):
            pass
    except Exception:
        os.environ.pop("SSLKEYLOGFILE", None)

from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(usecwd=True))

from app.routes import (
    chat,
    documents,
    weather,
    usage,
    pyq,
    learning,
    doubts,
    planner,
    resources,
    complete,
    admin_content,
    admin_dashboard,
    local_chat,
    notifications,
    research,
)


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

# Register all API routers under root (''), '/api', and '/backend' prefixes
# to ensure zero 404s regardless of proxy routing or client base URL configuration.
_api_routers = [
    chat.router,
    documents.router,
    weather.router,
    usage.router,
    pyq.router,
    learning.router,
    doubts.router,
    planner.router,
    resources.router,
    complete.router,
    admin_content.router,
    admin_dashboard.router,
    local_chat.router,
    notifications.router,
    research.router,
]

for router in _api_routers:
    app.include_router(router)
    app.include_router(router, prefix="/api")
    app.include_router(router, prefix="/backend")

_pyq_assets_dir = os.path.join(os.path.dirname(__file__), "data", "gate_pyqs")
if os.path.exists(_pyq_assets_dir):
    app.mount("/pyq-assets", StaticFiles(directory=_pyq_assets_dir), name="pyq-assets")
    app.mount("/api/pyq-assets", StaticFiles(directory=_pyq_assets_dir), name="api-pyq-assets")
    app.mount("/backend/pyq-assets", StaticFiles(directory=_pyq_assets_dir), name="backend-pyq-assets")


@app.get("/")
@app.head("/")
@app.get("/api")
@app.head("/api")
@app.get("/backend")
@app.head("/backend")
async def root():
    return {
        "status": "ok",
        "service": "my_assistant API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
@app.head("/health")
@app.get("/api/health")
@app.head("/api/health")
@app.get("/backend/health")
@app.head("/backend/health")
async def health():
    return {"status": "ok"}


@app.get("/favicon.ico")
@app.head("/favicon.ico")
async def favicon():
    return Response(content=b"", media_type="image/x-icon")


@app.get("/robots.txt")
async def robots():
    return Response(content="User-agent: *\nAllow: /\n", media_type="text/plain")


@app.get("/login")
@app.head("/login")
@app.post("/login")
@app.get("/auth/login")
@app.head("/auth/login")
@app.post("/auth/login")
@app.get("/api/login")
@app.post("/api/login")
@app.get("/backend/login")
@app.post("/backend/login")
async def login_info():
    return {
        "status": "ok",
        "message": "Authentication is client-side via Firebase Auth. To sign in, open https://mycsassistant.in/login",
        "login_url": "https://mycsassistant.in/login",
    }


@app.get("/chat")
async def chat_get_info():
    return {"detail": "Chat endpoint is active. Use HTTP POST with JSON body {'message': '...', 'session_id': '...'}"}


@app.get("/doubts/solve")
async def doubts_get_info():
    return {"detail": "Doubts endpoint is active. Use HTTP POST with form data 'message' and optional 'file'"}
