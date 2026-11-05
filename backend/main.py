import asyncio
import json
import shutil
import threading
import uuid
import httpx
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .config import (
    BASE_DIR,
    WORKSPACE_DIR,
    CLIPS_DIR,
    AUDIO_DIR,
    LIBRARY_FILE,
    PROVIDER_PRESETS,
    load_settings,
    save_settings,
)
from .audio_engine import analyze_audio_file
from .ai_analyzer import (
    IMAGE_EXTS,
    VIDEO_EXTS,
    analyze_clip_local_cv,
    enrich_clip_with_ai,
    split_video_into_scenes,
    generate_library_contact_sheet,
    discover_openai_compatible_models,
)
from .edit_planner import TEMPLATES, load_preset_bank, save_custom_preset_to_bank, build_automated_timeline
from .renderer import RENDER_JOBS, render_timeline_to_mp4, export_edl_and_xml
from .demo_generator import create_synth_demo_track, create_demo_clips
from .lyric_engine import parse_lyrics_file, generate_demo_lyrics


app = FastAPI(title="Strangelet Stitch — AI Audio-Reactive Video Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_library_state() -> dict:
    if LIBRARY_FILE.exists():
        try:
            data = json.loads(LIBRARY_FILE.read_text(encoding="utf-8"))
            if "lyrics" not in data:
                data["lyrics"] = None
            return data
        except Exception:
            pass
    return {
        "audio": None,
        "clips": [],
        "timeline": None,
        "lyrics": None,
    }


def save_library_state(state: dict) -> None:
    LIBRARY_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


STATE = load_library_state()


class SettingsPayload(BaseModel):
    ai_provider: str | None = None
    provider_preset: str | None = None
    universal_base_url: str | None = None
    universal_api_key: str | None = None
    universal_model: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str | None = None
    claude_api_key: str | None = None
    claude_model: str | None = None
    ollama_url: str | None = None
    ollama_model: str | None = None
    openai_local_url: str | None = None
    openai_local_model: str | None = None
    auto_split_scenes: bool | None = None


class DiscoverModelsPayload(BaseModel):
    base_url: str
    api_key: str = ""


class SaveCustomPresetPayload(BaseModel):
    id: str | None = None
    category: str = "avant_garde"
    name: str
    description: str = "Custom user-configured Strangelet Splicer preset."
    base_template_id: str = "narrative_storyboard"
    min_cut_floor: float = 0.25
    max_cut_ceiling: float = 4.0
    preserve_full_duration: bool = True
    story_vs_chop: float = 0.50
    fx_intensity: float = 1.0
    transition_mode: str = "auto_intensity"
    sorting_logic: str = "story_spine"
    motion_behavior: str = "natural_ken_burns"
    style_fx: str = "clean"
    fold_in_columns: int = 1
    sprocket_slip: bool = False
    typographic_flashes: bool = False
    step_print_12fps: bool = False
    reverse_stutter: bool = False
    subliminal_sigil_flash: bool = False
    obsidian_scrying_vignette: bool = False
    thelemic_dye_bloom: bool = False
    cosmic_static_glitch: bool = False
    geometric_echo_tunnel: bool = False


class GenerateTimelinePayload(BaseModel):
    template_id: str = "narrative_storyboard"
    global_prompt: str = ""
    sections: list[dict] | None = None
    fx_intensity: float = 1.0
    min_clip_duration: float = 0.25
    transition_mode: str = "auto_intensity"
    preserve_full_duration: bool = True
    story_vs_chop: float = 0.50
    use_story_spine: bool = True
    sprocket_slip: bool | None = None
    typographic_flashes: bool | None = None
    step_print_12fps: bool | None = None
    fold_in_columns: int | None = None
    subliminal_sigil_flash: bool | None = None
    obsidian_scrying_vignette: bool | None = None
    thelemic_dye_bloom: bool | None = None
    cosmic_static_glitch: bool | None = None
    geometric_echo_tunnel: bool | None = None
    still_duration: float | None = None
    exhaustion_mode: str = "loop_vary_motion"


class SwapClipPayload(BaseModel):
    event_index: int
    new_clip_id: str
    in_point: float | None = None
    transition: str | None = None
    pinned: bool | None = None
    reverse: bool | None = None
    ping_pong: bool | None = None
    optical_treatment: str | None = None
    prism_mirror: bool | None = None


class UpdateTimelineEventPayload(BaseModel):
    event_index: int
    new_clip_id: str | None = None
    in_point: float | None = None
    transition: str | None = None
    pinned: bool | None = None
    reverse: bool | None = None
    ping_pong: bool | None = None
    optical_treatment: str | None = None
    prism_mirror: bool | None = None
    speed: float | None = None
    style_fx: str | None = None
    vhs_glitch: bool | None = None
    strobe: bool | None = None
    ken_burns: str | None = None
    typo_muted: bool | None = None


class TrimTimelineEventPayload(BaseModel):
    event_index: int
    new_start: float | None = None
    new_end: float | None = None


class SplitTimelinePayload(BaseModel):
    split_time: float | None = None
    time: float | None = None
    event_index: int | None = None


class AddManualBlockPayload(BaseModel):
    clip_id: str | None = None
    start_time: float | None = None
    start: float | None = None
    duration: float = 2.5


class DeleteTimelineEventPayload(BaseModel):
    event_index: int


class PasteTimelineEventPayload(BaseModel):
    block_data: dict
    target_time: float | None = None


class UpdateClipTagsPayload(BaseModel):
    description: str | None = None
    vibe_tags: list[str] | None = None
    lyric_keywords: list[str] | None = None
    recommended_sections: list[str] | None = None
    motion_score: float | None = None
    sequence_order: int | None = None


class ImportWebTagsPayload(BaseModel):
    raw_json: str


class LocalPathIngestPayload(BaseModel):
    path: str
    max_files: int = 40
    recursive: bool = True


class RenderRequestPayload(BaseModel):
    width: int = 1280
    height: int = 720
    fps: int = 30
    max_duration: float | None = None
    include_lyrics: bool | None = None
    profile: str = "master"
    format: str = "mp4"
    custom_filename: str | None = None
    output_destination: str | None = None
    is_tauri: bool = False


class PickSavePathPayload(BaseModel):
    default_filename: str = "strangelet_splicer.mp4"
    filter_ext: str = "mp4"
    title: str = "Choose Export Destination"



class LyricConfigPayload(BaseModel):
    global_offset: float | None = None
    include_in_render: bool | None = None


@app.get("/api/state")
async def get_state():
    bank = load_preset_bank()
    return {
        "settings": load_settings(),
        "provider_presets": PROVIDER_PRESETS,
        "templates": list(bank.values()),
        "audio": STATE.get("audio"),
        "clips": STATE.get("clips", []),
        "timeline": STATE.get("timeline"),
        "lyrics": STATE.get("lyrics"),
        "storage_root": str(BASE_DIR),
    }


@app.post("/api/state/restore")
async def restore_state(payload: dict):
    if "audio" in payload:
        STATE["audio"] = payload["audio"]
    if "clips" in payload:
        STATE["clips"] = payload["clips"]
    if "timeline" in payload:
        STATE["timeline"] = payload["timeline"]
    if "lyrics" in payload:
        STATE["lyrics"] = payload["lyrics"]
    save_library_state(STATE)
    return {
        "status": "ok",
        "audio": STATE.get("audio"),
        "clips": STATE.get("clips", []),
        "timeline": STATE.get("timeline"),
        "lyrics": STATE.get("lyrics"),
    }


@app.post("/api/session/new")
async def new_session():
    STATE["audio"] = None
    STATE["clips"] = []
    STATE["timeline"] = None
    STATE["lyrics"] = None
    save_library_state(STATE)
    return {
        "status": "ok",
        "message": "Project session reset to clean slate",
        "audio": None,
        "clips": [],
        "timeline": None,
        "lyrics": None,
    }


@app.post("/api/presets/save")
async def save_custom_preset(payload: SaveCustomPresetPayload):
    saved = save_custom_preset_to_bank(payload.model_dump())
    bank = load_preset_bank()
    return {
        "preset": saved,
        "templates": list(bank.values()),
    }


@app.post("/api/settings")
async def update_settings(payload: SettingsPayload):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = save_settings(updates)
    return {"settings": updated}


@app.post("/api/ai/discover-models")
async def api_discover_models(payload: DiscoverModelsPayload):
    return await discover_openai_compatible_models(payload.base_url, payload.api_key)


@app.get("/api/ollama/models")
async def list_ollama_models():
    settings = load_settings()
    base = settings.get("universal_base_url") or settings.get("ollama_url", "http://localhost:11434")
    return await discover_openai_compatible_models(base, settings.get("universal_api_key", ""))


@app.post("/api/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    safe_name = Path(file.filename or "track.mp3").name
    dest = AUDIO_DIR / safe_name
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        analysis = await asyncio.to_thread(analyze_audio_file, dest)
        analysis["audio_url"] = f"/workspace/audio/{safe_name}"
        analysis["audio_path"] = str(dest)
        STATE["audio"] = analysis
        save_library_state(STATE)
        return {"audio": analysis}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audio analysis failed: {str(e)}")


@app.post("/api/lyrics/upload")
async def upload_lyrics_file(file: UploadFile = File(...)):
    safe_name = Path(file.filename or "lyrics.lrc").name
    raw_bytes = await file.read()
    try:
        raw_text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raw_text = raw_bytes.decode("latin-1", errors="replace")

    audio = STATE.get("audio") or {}
    tl = STATE.get("timeline") or {}
    total_dur = float(audio.get("duration") or tl.get("total_duration") or 300.0)
    prev_lyrics = STATE.get("lyrics") or {}
    prev_offset = float(prev_lyrics.get("global_offset", 0.0) or 0.0)
    prev_include = bool(prev_lyrics.get("include_in_render", True))

    parsed = parse_lyrics_file(
        filename=safe_name,
        raw_text=raw_text,
        total_duration=total_dur,
        global_offset=prev_offset,
        include_in_render=prev_include,
    )
    if not parsed.get("cues"):
        raise HTTPException(
            status_code=400,
            detail=f"No valid timed lyric cues found in '{safe_name}'. Expected .lrc [mm:ss.xx] or .srt timecodes.",
        )

    STATE["lyrics"] = parsed
    save_library_state(STATE)
    return {"lyrics": parsed}


@app.post("/api/lyrics/config")
async def update_lyrics_config(payload: LyricConfigPayload):
    current = STATE.get("lyrics") or {
        "filename": "No lyrics loaded",
        "format": "lrc",
        "global_offset": 0.0,
        "include_in_render": True,
        "cue_count": 0,
        "cues": [],
    }
    if payload.global_offset is not None:
        # Clamp to [-5.0, +5.0] and snap to 50ms (0.05s) increments
        clamped = max(-5.0, min(5.0, float(payload.global_offset)))
        snapped = round(round(clamped / 0.05) * 0.05, 2)
        current["global_offset"] = snapped
    if payload.include_in_render is not None:
        current["include_in_render"] = bool(payload.include_in_render)

    STATE["lyrics"] = current
    save_library_state(STATE)
    return {"lyrics": current}


@app.delete("/api/lyrics")
async def clear_lyrics():
    STATE["lyrics"] = None
    save_library_state(STATE)
    return {"lyrics": None}


@app.post("/api/clips/upload")
async def upload_clips(
    files: list[UploadFile] = File(...),
    provider: str | None = Form(None),
):
    settings = load_settings()
    valid_media_exts = VIDEO_EXTS | IMAGE_EXTS
    added_clips = []

    for up in files:
        raw_name = up.filename or f"media_{uuid.uuid4().hex[:6]}.mp4"
        safe_name = Path(raw_name).name
        ext = Path(safe_name).suffix.lower()
        if ext not in valid_media_exts:
            continue

        dest = CLIPS_DIR / safe_name
        with dest.open("wb") as f:
            shutil.copyfileobj(up.file, f)

        if ext in VIDEO_EXTS and settings.get("auto_split_scenes", False):
            target_paths = await asyncio.to_thread(
                split_video_into_scenes,
                dest,
                float(settings.get("scene_split_threshold", 0.42)),
            )
        else:
            target_paths = [dest]

        for p in target_paths:
            clip_id = f"clip_{uuid.uuid4().hex[:8]}"
            meta = await asyncio.to_thread(analyze_clip_local_cv, p, clip_id)
            meta = await enrich_clip_with_ai(meta, provider_override=provider)
            STATE["clips"] = [c for c in STATE.get("clips", []) if c["filename"] != p.name]
            STATE["clips"].append(meta)
            added_clips.append(meta)

    save_library_state(STATE)
    return {"added": added_clips, "clips": STATE["clips"]}


@app.post("/api/ingest/local-path")
async def ingest_from_local_path(payload: LocalPathIngestPayload):
    src = Path(payload.path.strip().strip('"'))
    if not src.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {src}")

    audio_exts = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"}
    valid_media_exts = VIDEO_EXTS | IMAGE_EXTS

    if src.is_file():
        ext = src.suffix.lower()
        if ext in audio_exts:
            dest = AUDIO_DIR / src.name
            if src.resolve() != dest.resolve():
                shutil.copy2(src, dest)
            analysis = await asyncio.to_thread(analyze_audio_file, dest)
            analysis["audio_url"] = f"/workspace/audio/{dest.name}"
            analysis["audio_path"] = str(dest)
            STATE["audio"] = analysis
            save_library_state(STATE)
            return {"type": "audio", "audio": analysis}
        elif ext in valid_media_exts:
            dest = CLIPS_DIR / src.name
            if src.resolve() != dest.resolve():
                shutil.copy2(src, dest)
            clip_id = f"clip_{uuid.uuid4().hex[:8]}"
            meta = await asyncio.to_thread(analyze_clip_local_cv, dest, clip_id)
            meta = await enrich_clip_with_ai(meta)
            STATE["clips"] = [c for c in STATE.get("clips", []) if c["filename"] != dest.name]
            STATE["clips"].append(meta)
            save_library_state(STATE)
            return {"type": "clips", "added": [meta], "clips": STATE["clips"]}
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file extension: {ext}")

    iterator = src.rglob("*") if payload.recursive else src.iterdir()
    found_media = []
    found_audio = None
    for p in sorted(iterator):
        if not p.is_file():
            continue
        ext = p.suffix.lower()
        if ext in valid_media_exts:
            found_media.append(p)
            if len(found_media) >= max(1, min(80, payload.max_files)):
                break
        elif ext in audio_exts and found_audio is None and STATE.get("audio") is None:
            found_audio = p

    if found_audio and STATE.get("audio") is None:
        dest_aud = AUDIO_DIR / found_audio.name
        if found_audio.resolve() != dest_aud.resolve():
            shutil.copy2(found_audio, dest_aud)
        try:
            analysis = await asyncio.to_thread(analyze_audio_file, dest_aud)
            analysis["audio_url"] = f"/workspace/audio/{dest_aud.name}"
            analysis["audio_path"] = str(dest_aud)
            STATE["audio"] = analysis
        except Exception:
            pass

    if not found_media:
        raise HTTPException(status_code=400, detail=f"No valid media files ({', '.join(valid_media_exts)}) found in {src}")

    added = []
    for vp in found_media:
        dest = CLIPS_DIR / vp.name
        if vp.resolve() != dest.resolve():
            shutil.copy2(vp, dest)
        clip_id = f"clip_{uuid.uuid4().hex[:8]}"
        meta = await asyncio.to_thread(analyze_clip_local_cv, dest, clip_id)
        meta = await enrich_clip_with_ai(meta)
        STATE["clips"] = [c for c in STATE.get("clips", []) if c["filename"] != dest.name]
        STATE["clips"].append(meta)
        added.append(meta)

    save_library_state(STATE)
    return {"type": "clips", "added": added, "clips": STATE["clips"], "audio": STATE.get("audio")}


@app.post("/api/clips/reanalyze-all")
async def reanalyze_all_clips(provider: str | None = None):
    updated = []
    for c in STATE.get("clips", []):
        enriched = await enrich_clip_with_ai(c, provider_override=provider)
        updated.append(enriched)
    STATE["clips"] = updated
    save_library_state(STATE)
    return {"clips": STATE["clips"]}


@app.put("/api/clips/{clip_id}")
async def update_clip_metadata(clip_id: str, payload: UpdateClipTagsPayload):
    for c in STATE.get("clips", []):
        if c["id"] == clip_id:
            if payload.description is not None:
                c["description"] = payload.description
            if payload.vibe_tags is not None:
                c["vibe_tags"] = [t.strip().lower() for t in payload.vibe_tags if t.strip()]
            if payload.lyric_keywords is not None:
                c["lyric_keywords"] = [k.strip().lower() for k in payload.lyric_keywords if k.strip()]
            if payload.recommended_sections is not None:
                c["recommended_sections"] = [s.strip().lower() for s in payload.recommended_sections if s.strip()]
            if payload.motion_score is not None:
                c["motion_score"] = round(float(payload.motion_score), 3)
            if payload.sequence_order is not None:
                c["sequence_order"] = payload.sequence_order if payload.sequence_order > 0 else None
            c["ai_provider_used"] = "manual_edit"
            save_library_state(STATE)
            return {"clip": c}
    raise HTTPException(status_code=404, detail="Clip not found")


@app.delete("/api/clips/{clip_id}")
async def delete_clip(clip_id: str):
    STATE["clips"] = [c for c in STATE.get("clips", []) if c["id"] != clip_id]
    save_library_state(STATE)
    return {"clips": STATE["clips"]}


@app.delete("/api/clips/clear/{media_type}")
async def clear_clips_bay(media_type: str):
    if media_type in ("video", "videos"):
        STATE["clips"] = [c for c in STATE.get("clips", []) if c.get("media_type") == "image"]
        if STATE.get("timeline") and isinstance(STATE["timeline"].get("events"), list):
            STATE["timeline"]["events"] = [e for e in STATE["timeline"]["events"] if e.get("media_type") == "image"]
    elif media_type in ("still", "stills", "image", "images"):
        STATE["clips"] = [c for c in STATE.get("clips", []) if c.get("media_type") != "image"]
        if STATE.get("timeline") and isinstance(STATE["timeline"].get("events"), list):
            STATE["timeline"]["events"] = [e for e in STATE["timeline"]["events"] if e.get("media_type") != "image"]
    save_library_state(STATE)
    return {"clips": STATE["clips"], "timeline": STATE.get("timeline")}


@app.post("/api/clips/contact-sheet")
async def create_contact_sheet():
    clips = STATE.get("clips", [])
    if not clips:
        raise HTTPException(status_code=400, detail="Upload at least one clip or image first.")
    res = await asyncio.to_thread(generate_library_contact_sheet, clips)
    return res


@app.post("/api/clips/import-web-tags")
async def import_web_ai_tags(payload: ImportWebTagsPayload):
    raw = payload.raw_json.strip()
    try:
        start_b = raw.find("[")
        end_b = raw.rfind("]")
        if start_b != -1 and end_b != -1:
            raw = raw[start_b:end_b + 1]
        items = json.loads(raw)
        if not isinstance(items, list):
            raise ValueError("Expected a JSON array of clip tag objects.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse JSON array: {str(e)}")

    by_id = {c["id"]: c for c in STATE.get("clips", [])}
    updated_count = 0
    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        target = by_id.get(item.get("id"))
        if not target and idx < len(STATE.get("clips", [])):
            target = STATE["clips"][idx]
        if target:
            if item.get("description"):
                target["description"] = str(item["description"])
            if isinstance(item.get("vibe_tags"), list):
                target["vibe_tags"] = [str(x).lower() for x in item["vibe_tags"]]
            if isinstance(item.get("lyric_keywords"), list):
                target["lyric_keywords"] = [str(x).lower() for x in item["lyric_keywords"]]
            if item.get("camera_motion") and target.get("media_type") != "image":
                target["camera_motion"] = str(item["camera_motion"])
            if isinstance(item.get("energy_override"), (int, float)):
                target["motion_score"] = round(float(item["energy_override"]), 3)
            if isinstance(item.get("recommended_sections"), list):
                target["recommended_sections"] = [str(x).lower() for x in item["recommended_sections"]]
            target["ai_provider_used"] = "universal_ai_bridge"
            updated_count += 1

    save_library_state(STATE)
    return {"updated_count": updated_count, "clips": STATE["clips"]}


@app.post("/api/timeline/generate")
async def generate_timeline(payload: GenerateTimelinePayload):
    audio = STATE.get("audio")
    clips = STATE.get("clips", [])
    if not audio:
        raise HTTPException(status_code=400, detail="Please load or upload an audio track first.")
    if not clips and payload.template_id != "manual_workbench_slate":
        raise HTTPException(status_code=400, detail="Please load or upload video clips or images first.")

    if payload.sections:
        audio["sections"] = payload.sections

    if payload.still_duration and payload.still_duration > 0:
        for c in clips:
            if c.get("media_type") == "image":
                c["duration"] = round(float(payload.still_duration), 3)

    existing_tl = STATE.get("timeline") or {}
    pinned_events = [
        dict(ev)
        for ev in (existing_tl.get("events") or [])
        if isinstance(ev, dict) and ev.get("pinned")
    ]

    timeline = build_automated_timeline(
        audio_analysis=audio,
        clips=clips,
        template_id=payload.template_id,
        global_prompt=payload.global_prompt,
        section_overrides=payload.sections,
        fx_intensity=payload.fx_intensity,
        min_clip_duration=payload.min_clip_duration,
        transition_mode=payload.transition_mode,
        preserve_full_duration=payload.preserve_full_duration,
        story_vs_chop=payload.story_vs_chop,
        use_story_spine=payload.use_story_spine,
        sprocket_slip=payload.sprocket_slip,
        typographic_flashes=payload.typographic_flashes,
        step_print_12fps=payload.step_print_12fps,
        fold_in_columns=payload.fold_in_columns,
        subliminal_sigil_flash=payload.subliminal_sigil_flash,
        obsidian_scrying_vignette=payload.obsidian_scrying_vignette,
        thelemic_dye_bloom=payload.thelemic_dye_bloom,
        cosmic_static_glitch=payload.cosmic_static_glitch,
        geometric_echo_tunnel=payload.geometric_echo_tunnel,
        pinned_events=pinned_events,
        exhaustion_mode=payload.exhaustion_mode,
    )
    STATE["timeline"] = timeline
    save_library_state(STATE)
    return {"timeline": timeline, "audio": audio}


def _apply_event_overrides(ev: dict, payload, clips: list[dict]) -> None:
    if getattr(payload, "new_clip_id", None):
        clip = next((c for c in clips if c["id"] == payload.new_clip_id), None)
        if not clip:
            raise HTTPException(status_code=404, detail="Selected clip not found.")
        ev["clip_id"] = clip["id"]
        ev["clip_filename"] = clip["filename"]
        ev["media_type"] = clip.get("media_type", "video")
        ev["ken_burns"] = clip.get("ken_burns_preset", "zoom_in_pan_right") if ev["media_type"] == "image" else None
        ev["clip_thumbnail"] = clip["thumbnail"]
        ev["clip_url"] = f"/workspace/clips/{clip['filename']}"
        ev["clip_duration"] = clip["duration"]
        ev["clip_energy"] = clip["motion_score"]
        ev["vibe_tags"] = clip.get("vibe_tags", [])[:5]
        in_pt = payload.in_point if payload.in_point is not None else clip.get("best_start_sec", 0.0)
        ev["in_point"] = round(float(in_pt), 3)
        ev["out_point"] = round(min(float(clip["duration"]), float(in_pt) + float(ev["duration"])), 3)
        ev["match_reason"] = "Manual Studio Swap"
    elif getattr(payload, "in_point", None) is not None:
        in_pt = max(0.0, float(payload.in_point))
        ev["in_point"] = round(in_pt, 3)
        ev["out_point"] = round(min(float(ev.get("clip_duration", 5.0)), in_pt + float(ev["duration"])), 3)

    if getattr(payload, "transition", None):
        ev["transition"] = payload.transition
    if getattr(payload, "pinned", None) is not None:
        ev["pinned"] = bool(payload.pinned)
    if getattr(payload, "reverse", None) is not None:
        ev["reverse"] = bool(payload.reverse)
    if getattr(payload, "ping_pong", None) is not None:
        ev["ping_pong"] = bool(payload.ping_pong)
    if getattr(payload, "optical_treatment", None) is not None:
        ev["optical_treatment"] = str(payload.optical_treatment)
    if getattr(payload, "prism_mirror", None) is not None:
        ev["prism_mirror"] = bool(payload.prism_mirror)
    if getattr(payload, "speed", None) is not None:
        ev["speed"] = float(payload.speed)
    if getattr(payload, "style_fx", None) is not None:
        ev["style_fx"] = str(payload.style_fx)
    if getattr(payload, "vhs_glitch", None) is not None:
        ev["vhs_glitch"] = bool(payload.vhs_glitch)
    if getattr(payload, "strobe", None) is not None:
        ev["strobe"] = bool(payload.strobe)
    if getattr(payload, "ken_burns", None) is not None:
        ev["ken_burns"] = str(payload.ken_burns) if payload.ken_burns else None
    if getattr(payload, "typo_muted", None) is not None:
        ev["typo_muted"] = bool(payload.typo_muted)
        ev.setdefault("fx", {})["typo_muted"] = bool(payload.typo_muted)


@app.post("/api/timeline/swap-clip")
async def swap_timeline_clip(payload: SwapClipPayload):
    tl = STATE.get("timeline")
    if not tl or "events" not in tl:
        raise HTTPException(status_code=400, detail="No active timeline.")
    events = tl["events"]
    if payload.event_index < 0 or payload.event_index >= len(events):
        raise HTTPException(status_code=400, detail="Invalid event index.")

    ev = events[payload.event_index]
    _apply_event_overrides(ev, payload, STATE.get("clips", []))

    save_library_state(STATE)
    return {"timeline": tl}


@app.post("/api/timeline/update-event")
async def update_timeline_event(payload: UpdateTimelineEventPayload):
    tl = STATE.get("timeline")
    if not tl or "events" not in tl:
        raise HTTPException(status_code=400, detail="No active timeline.")
    events = tl["events"]
    if payload.event_index < 0 or payload.event_index >= len(events):
        raise HTTPException(status_code=400, detail="Invalid event index.")

    ev = events[payload.event_index]
    _apply_event_overrides(ev, payload, STATE.get("clips", []))

    save_library_state(STATE)
    return {"timeline": tl, "event": ev}


@app.post("/api/timeline/trim-event")
async def trim_timeline_event(payload: TrimTimelineEventPayload):
    tl = STATE.get("timeline")
    if not tl or "events" not in tl:
        raise HTTPException(status_code=400, detail="No active timeline.")
    events = tl["events"]
    idx = payload.event_index
    if idx < 0 or idx >= len(events):
        raise HTTPException(status_code=400, detail="Invalid event index.")

    total_dur = float(tl.get("total_duration") or (STATE.get("audio") or {}).get("duration", 24.0))
    ev = events[idx]
    min_dur = 0.12

    if payload.new_start is not None:
        prev_ev = events[idx - 1] if idx > 0 else None
        was_contiguous = prev_ev is not None and abs(float(prev_ev["end"]) - float(ev["start"])) < 0.04
        min_start = (float(prev_ev["start"]) + min_dur) if (prev_ev and was_contiguous) else (float(prev_ev["end"]) if prev_ev else 0.0)
        max_start = float(ev["end"]) - min_dur
        clamped_start = round(float(max(0.0, min(max_start, max(min_start, payload.new_start)))), 4)
        delta = clamped_start - float(ev["start"])
        ev["start"] = clamped_start
        ev["duration"] = round(float(ev["end"]) - clamped_start, 4)
        if ev.get("media_type") != "image":
            c_dur = max(0.5, float(ev.get("clip_duration", 5.0)))
            ev["in_point"] = round(max(0.0, min(c_dur - 0.1, float(ev.get("in_point", 0.0)) + delta)), 3)
            ev["out_point"] = round(min(c_dur, float(ev["in_point"]) + float(ev["duration"])), 3)
        if prev_ev and was_contiguous:
            prev_ev["end"] = clamped_start
            prev_ev["duration"] = round(clamped_start - float(prev_ev["start"]), 4)
            prev_ev["out_point"] = round(min(float(prev_ev.get("clip_duration", 5.0)), float(prev_ev.get("in_point", 0.0)) + float(prev_ev["duration"])), 3)

    if payload.new_end is not None:
        next_ev = events[idx + 1] if idx + 1 < len(events) else None
        was_contiguous = next_ev is not None and abs(float(next_ev["start"]) - float(ev["end"])) < 0.04
        min_end = float(ev["start"]) + min_dur
        max_end = (float(next_ev["end"]) - min_dur) if (next_ev and was_contiguous) else (float(next_ev["start"]) if next_ev else total_dur)
        clamped_end = round(float(min(total_dur, max(min_end, min(max_end, payload.new_end)))), 4)
        ev["end"] = clamped_end
        ev["duration"] = round(clamped_end - float(ev["start"]), 4)
        ev["out_point"] = round(min(float(ev.get("clip_duration", 5.0)), float(ev.get("in_point", 0.0)) + float(ev["duration"])), 3)
        if next_ev and was_contiguous:
            delta_next = clamped_end - float(next_ev["start"])
            next_ev["start"] = clamped_end
            next_ev["duration"] = round(float(next_ev["end"]) - clamped_end, 4)
            if next_ev.get("media_type") != "image":
                c_dur = max(0.5, float(next_ev.get("clip_duration", 5.0)))
                next_ev["in_point"] = round(max(0.0, min(c_dur - 0.1, float(next_ev.get("in_point", 0.0)) + delta_next)), 3)
                next_ev["out_point"] = round(min(c_dur, float(next_ev["in_point"]) + float(next_ev["duration"])), 3)

    save_library_state(STATE)
    return {"timeline": tl}


@app.post("/api/timeline/split-at-playhead")
async def split_timeline_at_playhead(payload: SplitTimelinePayload):
    tl = STATE.get("timeline")
    if not tl or "events" not in tl:
        raise HTTPException(status_code=400, detail="No active timeline.")
    events = tl["events"]
    if not events:
        raise HTTPException(status_code=400, detail="Timeline has no cut blocks to split.")

    raw_split = payload.split_time if payload.split_time is not None else payload.time
    t_split = float(raw_split or 0.0)
    target_idx = payload.event_index
    if target_idx is None or target_idx < 0 or target_idx >= len(events):
        target_idx = next(
            (i for i, e in enumerate(events) if float(e["start"]) + 0.08 <= t_split <= float(e["end"]) - 0.08),
            None,
        )
    if target_idx is None:
        raise HTTPException(status_code=400, detail="Move playhead inside a cut block (at least 0.08s from its edges) to split.")

    ev = events[target_idx]
    e0, e1 = float(ev["start"]), float(ev["end"])
    if not (e0 + 0.08 <= t_split <= e1 - 0.08):
        # If user selected a block and hit S while playhead wasn't inside, split at midpoint of selected block
        t_split = round(0.5 * (e0 + e1), 4)
        if e1 - e0 < 0.20:
            raise HTTPException(status_code=400, detail="Cut block is too short to split further.")

    left_dur = round(t_split - e0, 4)
    right_dur = round(e1 - t_split, 4)
    c_dur = max(0.5, float(ev.get("clip_duration", 5.0)))
    base_in = float(ev.get("in_point", 0.0))

    left_ev = dict(ev)
    left_ev["fx"] = dict(ev.get("fx", {}))
    left_ev["start"] = round(e0, 4)
    left_ev["end"] = round(t_split, 4)
    left_ev["duration"] = left_dur
    left_ev["out_point"] = round(min(c_dur, base_in + left_dur), 3)
    left_ev["match_reason"] = f"{ev.get('match_reason', 'Cut')} (Split A)"

    right_ev = dict(ev)
    right_ev["fx"] = dict(ev.get("fx", {}))
    right_ev["start"] = round(t_split, 4)
    right_ev["end"] = round(e1, 4)
    right_ev["duration"] = right_dur
    if ev.get("media_type") != "image":
        right_in = (base_in + left_dur) % c_dur
        right_ev["in_point"] = round(right_in, 3)
        right_ev["out_point"] = round(min(c_dur, right_in + right_dur), 3)
    right_ev["match_reason"] = f"{ev.get('match_reason', 'Cut')} (Split B)"

    events[target_idx:target_idx + 1] = [left_ev, right_ev]
    for i, item in enumerate(events):
        item["index"] = i
    tl["cut_count"] = len(events)

    save_library_state(STATE)
    return {"timeline": tl, "split_index": target_idx + 1}


@app.post("/api/timeline/add-manual-block")
async def add_manual_timeline_block(payload: AddManualBlockPayload):
    audio = STATE.get("audio")
    clips = STATE.get("clips", [])
    if not audio:
        raise HTTPException(status_code=400, detail="Load an audio track first.")
    if not clips:
        raise HTTPException(status_code=400, detail="Upload or load at least one media clip first.")

    tl = STATE.get("timeline")
    if not tl:
        tl = build_automated_timeline(
            audio_analysis=audio,
            clips=clips,
            template_id="manual_workbench_slate",
        )
        STATE["timeline"] = tl

    events = tl.setdefault("events", [])
    total_dur = float(tl.get("total_duration") or audio.get("duration", 24.0))
    clip = next((c for c in clips if c["id"] == payload.clip_id), None) if payload.clip_id else clips[len(events) % len(clips)]
    if not clip:
        clip = clips[0]

    req_start = payload.start_time if payload.start_time is not None else payload.start
    if req_start is not None:
        t0 = max(0.0, min(total_dur - 0.25, float(req_start)))
    else:
        t0 = float(events[-1]["end"]) if events else 0.0
        if t0 >= total_dur - 0.15:
            t0 = max(0.0, total_dur - payload.duration)

    dur = max(0.20, min(float(payload.duration), total_dur - t0))
    t1 = round(t0 + dur, 4)
    c_dur = float(clip.get("duration", 4.0))
    media_type = clip.get("media_type", "video")
    in_pt = float(clip.get("best_start_sec", 0.0)) if media_type != "image" else 0.0

    new_ev = {
        "index": len(events),
        "role": "manual_block",
        "style_fx": tl.get("style_fx", "clean"),
        "downbeat_punch": False,
        "start": round(t0, 4),
        "end": t1,
        "duration": round(dur, 4),
        "section_id": "sec_manual",
        "section_type": "verse",
        "section_label": "MANUAL",
        "clip_id": clip["id"],
        "clip_filename": clip["filename"],
        "media_type": media_type,
        "ken_burns": "zoom_in_pan_right" if media_type == "image" else None,
        "clip_thumbnail": clip["thumbnail"],
        "clip_url": f"/workspace/clips/{clip['filename']}",
        "clip_duration": c_dur,
        "in_point": round(in_pt, 3),
        "out_point": round(min(c_dur, in_pt + dur), 3),
        "target_energy": 0.6,
        "clip_energy": clip.get("motion_score", 0.5),
        "match_score": 1.0,
        "match_reason": "🛠️ Manual Workbench Placement",
        "vibe_tags": clip.get("vibe_tags", [])[:5],
        "transition": tl.get("transition_mode", "hard_cut") if tl.get("transition_mode") != "auto_intensity" else "hard_cut",
        "transient_triggered": False,
        "pinned": True,
        "reverse": False,
        "ping_pong": False,
        "optical_treatment": "none",
        "prism_mirror": False,
        "fx": {
            "bass_zoom": 0.45,
            "snare_flash": 0.35,
            "shake": 0.20,
            "rgb_split": 0.25,
            "speed_ramp": False,
            "style_fx": tl.get("style_fx", "clean"),
        },
    }
    events.append(new_ev)
    events.sort(key=lambda x: float(x["start"]))
    for i, item in enumerate(events):
        item["index"] = i
    tl["cut_count"] = len(events)

    save_library_state(STATE)
    return {"timeline": tl}


@app.post("/api/timeline/populate-workbench")
async def populate_workbench_timeline(payload: dict):
    clips = STATE.get("clips", [])
    audio = STATE.get("audio")
    if not clips:
        raise HTTPException(status_code=400, detail="No media clips loaded.")

    tl = STATE.get("timeline")
    total_dur = float((audio or {}).get("duration", 24.0))
    if not tl:
        tl = {
            "template_id": "manual_workbench_slate",
            "template_name": "🛠️ Manual Workbench (Empty Slate)",
            "style_fx": "clean",
            "sorting_logic": "manual_empty_slate",
            "motion_behavior": "natural_ken_burns",
            "min_cut_floor": 0.25,
            "max_cut_ceiling": 8.0,
            "fx_intensity": 0.5,
            "transition_mode": "hard_cut",
            "story_spine_active": False,
            "preserve_full_duration": False,
            "story_vs_chop": 0.0,
            "total_duration": total_dur,
            "bpm": float((audio or {}).get("bpm", 120.0)),
            "cut_count": 0,
            "unique_clips_used": 0,
            "events": [],
        }
        STATE["timeline"] = tl

    events = tl.setdefault("events", [])
    new_clips = payload.get("clips") or clips
    still_dur = float(payload.get("still_duration") or 2.0)

    for c in new_clips:
        t0 = float(events[-1]["end"]) if events else 0.0
        if t0 >= total_dur - 0.15:
            break
        is_still = c.get("media_type") == "image"
        c_dur = still_dur if is_still else float(c.get("duration", 4.0))
        block_dur = max(0.20, min(c_dur, total_dur - t0))
        t1 = round(t0 + block_dur, 4)
        in_pt = float(c.get("best_start_sec", 0.0)) if not is_still else 0.0

        ev = {
            "index": len(events),
            "role": "manual_block",
            "style_fx": tl.get("style_fx", "clean"),
            "downbeat_punch": False,
            "start": round(t0, 4),
            "end": t1,
            "duration": round(block_dur, 4),
            "section_id": "sec_manual",
            "section_type": "verse",
            "section_label": "MANUAL",
            "clip_id": c["id"],
            "clip_filename": c["filename"],
            "media_type": c.get("media_type", "video"),
            "ken_burns": "zoom_in_pan_right" if is_still else None,
            "clip_thumbnail": c["thumbnail"],
            "clip_url": f"/workspace/clips/{c['filename']}",
            "clip_duration": c_dur,
            "in_point": round(in_pt, 3),
            "out_point": round(min(c_dur, in_pt + block_dur), 3),
            "target_energy": 0.6,
            "clip_energy": c.get("motion_score", 0.5),
            "match_score": 1.0,
            "match_reason": "🛠️ Manual Workbench Placement",
            "vibe_tags": c.get("vibe_tags", [])[:5],
            "transition": "hard_cut",
            "transient_triggered": False,
            "pinned": True,
            "reverse": False,
            "ping_pong": False,
            "optical_treatment": "none",
            "prism_mirror": False,
            "fx": {
                "bass_zoom": 0.45,
                "snare_flash": 0.35,
                "shake": 0.20,
                "rgb_split": 0.25,
                "speed_ramp": False,
                "style_fx": "clean",
            },
        }
        events.append(ev)

    events.sort(key=lambda x: float(x["start"]))
    for i, item in enumerate(events):
        item["index"] = i
    tl["cut_count"] = len(events)
    tl["unique_clips_used"] = len({e.get("clip_id") for e in events if e.get("clip_id")})
    save_library_state(STATE)
    return {"timeline": tl}


@app.post("/api/timeline/delete-event")
async def delete_timeline_event(payload: DeleteTimelineEventPayload):
    tl = STATE.get("timeline")
    if not tl or "events" not in tl:
        raise HTTPException(status_code=400, detail="No active timeline.")
    events = tl["events"]
    if payload.event_index < 0 or payload.event_index >= len(events):
        raise HTTPException(status_code=400, detail="Invalid event index.")
    events.pop(payload.event_index)
    for i, item in enumerate(events):
        item["index"] = i
    tl["cut_count"] = len(events)
    save_library_state(STATE)
    return {"timeline": tl}


@app.post("/api/timeline/paste-event")
async def paste_timeline_event(payload: PasteTimelineEventPayload):
    tl = STATE.get("timeline")
    audio = STATE.get("audio")
    total_dur = float((audio or {}).get("duration", 24.0))

    if not tl:
        tl = {
            "template_id": "manual_workbench_slate",
            "template_name": "🛠️ Manual Workbench (Empty Slate)",
            "style_fx": "clean",
            "sorting_logic": "manual_empty_slate",
            "motion_behavior": "natural_ken_burns",
            "min_cut_floor": 0.25,
            "max_cut_ceiling": 8.0,
            "preserve_full_duration": False,
            "story_vs_chop": 0.0,
            "fx_intensity": 0.5,
            "transition_mode": "hard_cut",
            "total_duration": total_dur,
            "cut_count": 0,
            "events": [],
        }
        STATE["timeline"] = tl

    events = tl.setdefault("events", [])
    block_data = payload.block_data
    if not block_data or not isinstance(block_data, dict):
        raise HTTPException(status_code=400, detail="Invalid block data in clipboard.")

    dur = max(0.15, float(block_data.get("duration", 2.5)))
    t_req = payload.target_time
    if t_req is None:
        t_req = 0.0
    t0 = max(0.0, min(max(0.0, total_dur - 0.1), float(t_req)))
    t1 = min(total_dur, t0 + dur)
    actual_dur = round(t1 - t0, 4)
    if actual_dur <= 0.05:
        t0 = max(0.0, total_dur - dur)
        t1 = total_dur
        actual_dur = round(t1 - t0, 4)

    new_ev = dict(block_data)
    new_ev["start"] = round(t0, 4)
    new_ev["end"] = round(t1, 4)
    new_ev["duration"] = actual_dur
    new_ev["match_reason"] = "📋 Pasted Block"
    new_ev["pinned"] = True

    in_pt = float(block_data.get("in_point", 0.0))
    c_dur = float(block_data.get("clip_duration", 5.0))
    if new_ev.get("media_type") != "image":
        new_ev["in_point"] = round(min(c_dur, in_pt), 3)
        new_ev["out_point"] = round(min(c_dur, new_ev["in_point"] + actual_dur), 3)
    else:
        new_ev["in_point"] = 0.0
        new_ev["out_point"] = actual_dur

    updated_events = []
    for ev in events:
        e_start = float(ev["start"])
        e_end = float(ev["end"])

        # Case A: ev is entirely before pasted block
        if e_end <= t0 + 0.02:
            updated_events.append(ev)
        # Case B: ev is entirely after pasted block
        elif e_start >= t1 - 0.02:
            updated_events.append(ev)
        # Case C: ev completely wraps the pasted block (e_start < t0 and e_end > t1)
        elif e_start < t0 - 0.02 and e_end > t1 + 0.02:
            # Left slice
            left_ev = dict(ev)
            left_ev["end"] = round(t0, 4)
            left_dur = round(t0 - e_start, 4)
            left_ev["duration"] = left_dur
            if left_ev.get("media_type") != "image":
                left_ev["out_point"] = round(min(float(left_ev.get("clip_duration", 5.0)), float(left_ev.get("in_point", 0.0)) + left_dur), 3)
            updated_events.append(left_ev)

            # Right slice
            right_ev = dict(ev)
            right_ev["start"] = round(t1, 4)
            right_dur = round(e_end - t1, 4)
            right_ev["duration"] = right_dur
            if right_ev.get("media_type") != "image":
                shift = round(t1 - e_start, 4)
                right_ev["in_point"] = round(float(ev.get("in_point", 0.0)) + shift, 3)
                right_ev["out_point"] = round(min(float(right_ev.get("clip_duration", 5.0)), float(right_ev["in_point"]) + right_dur), 3)
            updated_events.append(right_ev)
        # Case D: ev starts before t0 and ends inside [t0, t1]
        elif e_start < t0 - 0.02:
            trimmed_ev = dict(ev)
            trimmed_ev["end"] = round(t0, 4)
            trim_dur = round(t0 - e_start, 4)
            trimmed_ev["duration"] = trim_dur
            if trimmed_ev.get("media_type") != "image":
                trimmed_ev["out_point"] = round(min(float(trimmed_ev.get("clip_duration", 5.0)), float(trimmed_ev.get("in_point", 0.0)) + trim_dur), 3)
            updated_events.append(trimmed_ev)
        # Case E: ev starts inside [t0, t1] and ends after t1
        elif e_end > t1 + 0.02:
            trimmed_ev = dict(ev)
            trimmed_ev["start"] = round(t1, 4)
            trim_dur = round(e_end - t1, 4)
            trimmed_ev["duration"] = trim_dur
            if trimmed_ev.get("media_type") != "image":
                shift = round(t1 - e_start, 4)
                trimmed_ev["in_point"] = round(float(ev.get("in_point", 0.0)) + shift, 3)
                trimmed_ev["out_point"] = round(min(float(trimmed_ev.get("clip_duration", 5.0)), float(trimmed_ev["in_point"]) + trim_dur), 3)
            updated_events.append(trimmed_ev)
        # Case F: ev is entirely covered by [t0, t1] -> replaced by new_ev

    updated_events.append(new_ev)
    updated_events.sort(key=lambda x: float(x["start"]))
    for i, it in enumerate(updated_events):
        it["index"] = i
    tl["events"] = updated_events
    tl["cut_count"] = len(updated_events)
    save_library_state(STATE)
    pasted_index = updated_events.index(new_ev)
    return {"timeline": tl, "pasted_index": pasted_index}


@app.post("/api/dialog/pick-save-path")
async def pick_save_path(payload: PickSavePathPayload):
    """Open native Windows Save File Dialog to choose export directory and filename."""
    def _run_dialog():
        ext = (payload.filter_ext or "mp4").lower().lstrip(".")
        filter_str = "MP4 Video (*.mp4)|*.mp4|All Files (*.*)|*.*" if ext == "mp4" else "WebM Video (*.webm)|*.webm|All Files (*.*)|*.*"
        default_name = payload.default_filename
        init_dir = str(EXPORTS_DIR)
        ps_cmd = f"""
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.SaveFileDialog
$dlg.FileName = '{default_name}'
$dlg.InitialDirectory = '{init_dir}'
$dlg.Filter = '{filter_str}'
$dlg.Title = '{payload.title}'
if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{
    Write-Output $dlg.FileName
}}
"""
        try:
            res = subprocess.run(
                ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", ps_cmd],
                capture_output=True,
                text=True,
                timeout=60,
            )
            out = res.stdout.strip()
            if out:
                return out
        except Exception as e:
            print("Native dialog prompt error:", e)
        return None

    selected = await asyncio.to_thread(_run_dialog)
    return {"selected_path": selected}


@app.post("/api/render/mp4")
async def start_mp4_render(payload: RenderRequestPayload):
    tl = STATE.get("timeline")
    audio = STATE.get("audio")
    if not tl or not audio:
        raise HTTPException(status_code=400, detail="Generate a timeline before rendering.")

    audio_path = Path(audio["audio_path"])
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file missing on disk.")

    job_id = f"render_{uuid.uuid4().hex[:8]}"
    RENDER_JOBS[job_id] = {
        "status": "starting",
        "progress": 0.0,
        "message": f"Queued render job ({payload.profile.upper()})...",
        "output_url": None,
    }

    if payload.include_lyrics is not None and STATE.get("lyrics"):
        STATE["lyrics"]["include_in_render"] = bool(payload.include_lyrics)
        save_library_state(STATE)

    thread = threading.Thread(
        target=render_timeline_to_mp4,
        kwargs={
            "job_id": job_id,
            "timeline": tl,
            "audio_path": audio_path,
            "audio_analysis": audio,
            "width": payload.width,
            "height": payload.height,
            "fps": payload.fps,
            "max_duration": payload.max_duration,
            "lyrics_state": STATE.get("lyrics"),
            "include_lyrics": payload.include_lyrics,
            "profile": payload.profile,
            "format_container": payload.format,
            "custom_filename": payload.custom_filename,
            "output_destination": payload.output_destination,
        },
        daemon=True,
    )
    thread.start()
    return {"job_id": job_id}


@app.get("/api/render/status/{job_id}")
async def get_render_status(job_id: str):
    job = RENDER_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found.")
    return job


@app.post("/api/export/nle")
async def export_timeline_for_nle():
    tl = STATE.get("timeline")
    audio = STATE.get("audio")
    if not tl or not audio:
        raise HTTPException(status_code=400, detail="Generate a timeline first.")
    res = await asyncio.to_thread(export_edl_and_xml, tl, Path(audio["audio_path"]), 30)
    return res


@app.post("/api/demo/load")
async def load_demo_project():
    """Synthesize a 24s electronic track + 6 procedural video clips + 2 Ken Burns still images with Story Spine + Demo Lyrics."""
    wav_path = AUDIO_DIR / "demo_cyber_pulse_128bpm.wav"
    await asyncio.to_thread(create_synth_demo_track, wav_path, 24.0, 22050, 128.0)
    analysis = await asyncio.to_thread(analyze_audio_file, wav_path)
    analysis["audio_url"] = f"/workspace/audio/{wav_path.name}"
    analysis["audio_path"] = str(wav_path)
    STATE["audio"] = analysis

    clip_paths = await asyncio.to_thread(create_demo_clips)
    demo_descriptions = {
        "demo_01_neon_cyber_tunnel.mp4": (
            "Hyperspeed neon magenta-cyan cyberpunk tunnel rushing forward",
            ["neon", "cyberpunk", "tunnel", "high-energy", "futuristic", "fast"],
            ["pulse", "rush", "light", "future", "electric", "speed"],
            ["drop", "chorus", "build"],
        ),
        "demo_02_calm_midnight_horizon.mp4": (
            "Deep midnight blue ocean waves drifting in slow atmospheric motion",
            ["calm", "midnight", "ocean", "blue", "atmospheric", "slow"],
            ["night", "deep", "breathe", "alone", "horizon", "quiet"],
            ["intro", "verse", "outro"],
        ),
        "demo_03_solar_fire_storm.mp4": (
            "Explosive golden-orange solar plasma particles swirling rapidly",
            ["fire", "golden", "explosive", "intense", "particles", "warm"],
            ["burn", "fire", "sun", "ignite", "heat", "explosion"],
            ["drop", "chorus"],
        ),
        "demo_04_kinetic_matrix_pulse.mp4": (
            "Rhythmic emerald green digital grid bars pulsing in sync",
            ["emerald", "digital", "grid", "rhythmic", "cyber", "medium-energy"],
            ["code", "signal", "rhythm", "system", "heartbeat", "grid"],
            ["verse", "build", "chorus"],
        ),
        "demo_05_golden_sunset_drift.mp4": (
            "Warm amber glowing orbs floating gently across a twilight sky",
            ["warm", "amber", "dreamy", "floating", "cinematic", "soft"],
            ["dream", "float", "sky", "memory", "gold", "fade"],
            ["intro", "verse", "outro"],
        ),
        "demo_06_strobe_hyper_drop.mp4": (
            "High-impact crimson and white strobe shockwaves bursting outward",
            ["strobe", "flash", "impact", "shockwave", "climax", "high-contrast"],
            ["drop", "impact", "flash", "thunder", "break", "overload"],
            ["drop", "build"],
        ),
        "demo_07_strangelet_nebula_still.png": (
            "Still Image (Ken Burns): Cosmic violet-cyan Strangelet nebula glowing in deep space",
            ["still-image", "cosmic", "nebula", "strangelet", "violet", "atmospheric"],
            ["cosmos", "stars", "void", "strangelet", "infinite", "dream"],
            ["intro", "verse", "chorus", "outro"],
        ),
        "demo_08_cyber_citadel_still.png": (
            "Still Image (Ken Burns): Neon synthwave citadel skyline over a magenta laser grid",
            ["still-image", "synthwave", "citadel", "neon", "grid", "cyberpunk"],
            ["city", "horizon", "neon", "grid", "future", "night"],
            ["verse", "build", "chorus"],
        ),
    }

    demo_clips = []
    for cp in clip_paths:
        cid = f"clip_{cp.stem[:14]}"
        meta = await asyncio.to_thread(analyze_clip_local_cv, cp, cid)
        if cp.name in demo_descriptions:
            desc, vtags, lkeys, rsecs = demo_descriptions[cp.name]
            meta["description"] = desc
            meta["vibe_tags"] = vtags
            meta["lyric_keywords"] = lkeys
            meta["recommended_sections"] = rsecs
        demo_clips.append(meta)

    STATE["clips"] = demo_clips
    if not STATE.get("lyrics") or not STATE["lyrics"].get("cues"):
        STATE["lyrics"] = generate_demo_lyrics(float(analysis.get("duration", 24.0)))

    timeline = build_automated_timeline(
        audio_analysis=analysis,
        clips=demo_clips,
        template_id="narrative_storyboard",
        global_prompt="neon cyberpunk high-energy drop with atmospheric midnight intro",
        fx_intensity=0.65,
        min_clip_duration=4.0,
        transition_mode="hard_cut",
        preserve_full_duration=True,
        story_vs_chop=0.10,
        use_story_spine=True,
    )
    STATE["timeline"] = timeline
    save_library_state(STATE)
    return {
        "audio": analysis,
        "clips": demo_clips,
        "timeline": timeline,
        "lyrics": STATE.get("lyrics"),
    }


app.mount("/workspace", StaticFiles(directory=str(WORKSPACE_DIR)), name="workspace")

FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/")
async def serve_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.get("/styles.css")
async def serve_styles():
    return FileResponse(str(FRONTEND_DIR / "styles.css"))


@app.get("/app.js")
async def serve_app_js():
    return FileResponse(str(FRONTEND_DIR / "app.js"))


@app.get("/presets.json")
async def serve_presets_json():
    return FileResponse(str(FRONTEND_DIR / "presets.json"))


@app.get("/jszip.min.js")
async def serve_jszip_js():
    return FileResponse(str(FRONTEND_DIR / "jszip.min.js"))


app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
