import os
import json
import shutil
from pathlib import Path

BASE_DIR = Path("D:/mv-auto-e").resolve()
CACHE_DIR = BASE_DIR / ".cache"
TMP_DIR = CACHE_DIR / "tmp"
WORKSPACE_DIR = BASE_DIR / "workspace"
CLIPS_DIR = WORKSPACE_DIR / "clips"
AUDIO_DIR = WORKSPACE_DIR / "audio"
THUMBS_DIR = WORKSPACE_DIR / "thumbnails"
CONTACT_SHEETS_DIR = WORKSPACE_DIR / "contact_sheets"
EXPORTS_DIR = WORKSPACE_DIR / "exports"
PROJECTS_DIR = WORKSPACE_DIR / "projects"
SETTINGS_FILE = WORKSPACE_DIR / "settings.json"
LIBRARY_FILE = WORKSPACE_DIR / "library.json"

for d in [CACHE_DIR, TMP_DIR, WORKSPACE_DIR, CLIPS_DIR, AUDIO_DIR, THUMBS_DIR, CONTACT_SHEETS_DIR, EXPORTS_DIR, PROJECTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Force all temporary files and model caches onto D:\mv-auto-e\.cache (never C: drive)
os.environ["TMP"] = str(TMP_DIR)
os.environ["TEMP"] = str(TMP_DIR)
os.environ["TMPDIR"] = str(TMP_DIR)
os.environ["HF_HOME"] = str(CACHE_DIR / "huggingface")
os.environ["TORCH_HOME"] = str(CACHE_DIR / "torch")
os.environ["MPLCONFIGDIR"] = str(CACHE_DIR / "matplotlib")


def get_ffmpeg_exe() -> str:
    # 1. Check bundled native Tauri sidecar binary in src-tauri/binaries/
    tauri_candidates = [
        BASE_DIR / "src-tauri" / "binaries" / "ffmpeg-x86_64-pc-windows-msvc.exe",
        BASE_DIR / "src-tauri" / "binaries" / "ffmpeg.exe",
        BASE_DIR / "binaries" / "ffmpeg.exe",
    ]
    for cand in tauri_candidates:
        if cand.exists():
            return str(cand)

    # 2. Check imageio_ffmpeg
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return exe
    except Exception:
        pass

    # 3. Check system PATH
    found = shutil.which("ffmpeg")
    if found:
        return found
    raise RuntimeError("FFmpeg executable not found. Ensure bundled sidecar in src-tauri/binaries or imageio-ffmpeg is installed.")


PROVIDER_PRESETS = {
    "openrouter": {
        "name": "OpenRouter (Free & Aggregated Vision Models)",
        "base_url": "https://openrouter.ai/api/v1",
        "default_model": "google/gemini-2.0-flash-exp:free",
        "requires_key": True,
    },
    "openai": {
        "name": "OpenAI / ChatGPT",
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o-mini",
        "requires_key": True,
    },
    "groq": {
        "name": "Groq Cloud (Fast Vision)",
        "base_url": "https://api.groq.com/openai/v1",
        "default_model": "llama-3.2-11b-vision-preview",
        "requires_key": True,
    },
    "mistral": {
        "name": "Mistral AI (Pixtral Vision)",
        "base_url": "https://api.mistral.ai/v1",
        "default_model": "pixtral-12b-2409",
        "requires_key": True,
    },
    "ollama_v1": {
        "name": "Local Ollama (/v1 OpenAI Schema)",
        "base_url": "http://localhost:11434/v1",
        "default_model": "llava:latest",
        "requires_key": False,
    },
    "koboldcpp": {
        "name": "Local KoboldCpp (/v1 OpenAI Schema)",
        "base_url": "http://localhost:5001/v1",
        "default_model": "koboldcpp-vision",
        "requires_key": False,
    },
    "gemini_openai": {
        "name": "Google Gemini (OpenAI-Compatible Endpoint)",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "default_model": "gemini-2.5-flash",
        "requires_key": True,
    },
}


DEFAULT_SETTINGS = {
    "ai_provider": "hybrid_auto",  # "hybrid_auto", "openai_compat", "local_cv", "gemini", "claude", "ollama"
    "provider_preset": "ollama_v1",
    "universal_base_url": "http://localhost:11434/v1",
    "universal_api_key": "",
    "universal_model": "llava:latest",
    "gemini_api_key": "",
    "gemini_model": "gemini-2.5-flash",
    "claude_api_key": "",
    "claude_model": "claude-3-5-sonnet-latest",
    "ollama_url": "http://localhost:11434",
    "ollama_model": "llava:latest",
    "openai_local_url": "http://localhost:5001/v1",
    "openai_local_model": "local-vision-model",
    "auto_split_scenes": False,
    "scene_split_threshold": 0.42,
}


def load_settings() -> dict:
    if SETTINGS_FILE.exists():
        try:
            data = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
            merged = {**DEFAULT_SETTINGS, **data}
            return merged
        except Exception:
            pass
    return dict(DEFAULT_SETTINGS)


def save_settings(new_settings: dict) -> dict:
    current = load_settings()
    current.update(new_settings)
    SETTINGS_FILE.write_text(json.dumps(current, indent=2), encoding="utf-8")
    return current
