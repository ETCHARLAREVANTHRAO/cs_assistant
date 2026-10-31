import asyncio
import os
import subprocess
import time
from pathlib import Path

import httpx

DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[3] / "Qwen3.5-2B-Q4_K_M.gguf"
DEFAULT_CLI_PATH = Path(r"C:\tmp\llama-cpp-test\llama-cli.exe")
DEFAULT_SERVER_PATH = Path(r"C:\tmp\llama-cpp-test\llama-server.exe")
DEFAULT_SERVER_URL = "http://127.0.0.1:8080"
LOG_DIR = Path(__file__).resolve().parents[2]
SERVER_OUT_LOG = LOG_DIR / "llama-server.log"
SERVER_ERR_LOG = LOG_DIR / "llama-server.err.log"

_server_process: subprocess.Popen | None = None


class LocalModelError(RuntimeError):
    pass


def _resolve_model_path() -> Path:
    configured = os.getenv("LOCAL_LLM_MODEL_PATH", "").strip()
    path = Path(configured) if configured else DEFAULT_MODEL_PATH
    if not path.exists():
        raise LocalModelError(
            f"Local model not found at {path}. Set LOCAL_LLM_MODEL_PATH to the GGUF file."
        )
    return path


def _resolve_runner_path() -> Path:
    configured = os.getenv("LOCAL_LLM_RUNNER_PATH", "").strip()
    path = Path(configured) if configured else DEFAULT_CLI_PATH
    if not path.exists():
        raise LocalModelError(
            f"llama.cpp CLI runner not found at {path}. Set LOCAL_LLM_RUNNER_PATH to llama-cli.exe."
        )
    return path


def _resolve_server_path() -> Path:
    configured = os.getenv("LOCAL_LLM_SERVER_PATH", "").strip()
    path = Path(configured) if configured else DEFAULT_SERVER_PATH
    if not path.exists():
        raise LocalModelError(
            f"llama.cpp server not found at {path}. Set LOCAL_LLM_SERVER_PATH to llama-server.exe."
        )
    return path


def _server_url() -> str:
    return os.getenv("LOCAL_LLM_SERVER_URL", DEFAULT_SERVER_URL).strip().rstrip("/")


def _server_timeout_seconds() -> int:
    return int(os.getenv("LOCAL_LLM_SERVER_START_TIMEOUT", "240"))


def _is_server_ready() -> bool:
    try:
        with httpx.Client(timeout=2.0) as client:
            resp = client.get(f"{_server_url()}/health")
            return resp.status_code < 500
    except Exception:
        return False


def ensure_local_server() -> dict:
    global _server_process
    model_path = _resolve_model_path()
    server_path = _resolve_server_path()
    url = _server_url()

    if _is_server_ready():
        return {
            "server_url": url,
            "server_path": str(server_path),
            "model_path": str(model_path),
            "started": False,
        }

    auto_start = os.getenv("LOCAL_LLM_AUTO_START", "1").strip().lower() not in {"0", "false", "no"}
    if not auto_start:
        raise LocalModelError(f"Local llama-server is not running at {url}.")

    if _server_process is not None and _server_process.poll() is None:
        pass
    else:
        SERVER_OUT_LOG.parent.mkdir(parents=True, exist_ok=True)
        out = SERVER_OUT_LOG.open("ab")
        err = SERVER_ERR_LOG.open("ab")
        cmd = [
            str(server_path),
            "-m",
            str(model_path),
            "--host",
            "127.0.0.1",
            "--port",
            url.rsplit(":", 1)[-1],
            "--reasoning",
            "off",
            "--ctx-size",
            os.getenv("LOCAL_LLM_CTX_SIZE", "2048"),
            "--threads",
            os.getenv("LOCAL_LLM_THREADS", "4"),
        ]
        _server_process = subprocess.Popen(
            cmd,
            stdout=out,
            stderr=err,
            cwd=str(LOG_DIR),
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )

    deadline = time.perf_counter() + _server_timeout_seconds()
    while time.perf_counter() < deadline:
        if _is_server_ready():
            return {
                "server_url": url,
                "server_path": str(server_path),
                "model_path": str(model_path),
                "started": True,
            }
        if _server_process is not None and _server_process.poll() is not None:
            raise LocalModelError(
                f"llama-server exited early with code {_server_process.returncode}. Check {SERVER_ERR_LOG}."
            )
        time.sleep(1)

    raise LocalModelError(f"Timed out waiting for llama-server at {url}.")


def _build_messages(message: str) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": "You are a concise local AI assistant for a GATE CS study app. Answer directly and do not show reasoning.",
        },
        {"role": "user", "content": message.strip()},
    ]


def _clean_reply(text: str) -> str:
    cleaned = text.strip()
    if "</think>" in cleaned:
        cleaned = cleaned.rsplit("</think>", 1)[-1].strip()
    if cleaned.startswith("<think>"):
        return ""
    return cleaned


def generate_local_reply(message: str, max_tokens: int = 128, temperature: float = 0.2) -> dict:
    started = time.perf_counter()
    server = ensure_local_server()
    predict = max(1, min(int(max_tokens), 512))
    temp = max(0.0, min(float(temperature), 2.0))

    payload = {
        "model": "local-qwen",
        "messages": _build_messages(message),
        "max_tokens": predict,
        "temperature": temp,
        "stream": False,
    }

    try:
        with httpx.Client(timeout=max(60, 60 + predict * 8)) as client:
            resp = client.post(f"{server['server_url']}/v1/chat/completions", json=payload)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise LocalModelError(f"llama-server request failed: {exc}") from exc

    try:
        reply = data["choices"][0]["message"]["content"]
    except Exception as exc:
        raise LocalModelError(f"Unexpected llama-server response: {data}") from exc

    elapsed = time.perf_counter() - started
    return {
        "reply": _clean_reply(reply) or "No local answer generated.",
        "model_path": server["model_path"],
        "runner_path": server["server_path"],
        "elapsed_seconds": round(elapsed, 2),
    }


async def generate_local_reply_async(message: str, max_tokens: int = 128, temperature: float = 0.2) -> dict:
    return await asyncio.to_thread(generate_local_reply, message, max_tokens, temperature)