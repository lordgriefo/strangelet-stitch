import base64
import io
import json
import re
import subprocess
import uuid
import cv2
import httpx
import numpy as np
from PIL import Image, ImageDraw
from pathlib import Path
from .config import CLIPS_DIR, THUMBS_DIR, CONTACT_SHEETS_DIR, get_ffmpeg_exe, load_settings

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO_EXTS = {".mp4", ".mov", ".webm", ".mkv", ".avi"}
KEN_BURNS_PRESETS = [
    "zoom_in_pan_right",
    "zoom_out_pan_left",
    "pan_up_zoom_in",
    "pan_down_zoom_out",
    "zoom_in_center",
    "drift_left_to_right",
]


def is_image_file(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTS


def is_video_file(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTS


def _ensure_webm_analysis_proxy(video_path: Path) -> Path:
    """If video is a WebM file, ensure a fast H.264 MP4 proxy exists so OpenCV can extract frames and keyframes reliably."""
    if video_path.suffix.lower() not in (".webm", ".mkv"):
        return video_path
    proxy_dir = CLIPS_DIR.parent / "cache" / "webm_proxies"
    proxy_dir.mkdir(parents=True, exist_ok=True)
    proxy_file = proxy_dir / f"proxy_{video_path.stem}.mp4"
    if proxy_file.exists() and proxy_file.stat().st_size > 1024:
        return proxy_file
    try:
        ffmpeg = get_ffmpeg_exe()
        cmd = [
            ffmpeg, "-y", "-nostdin", "-v", "error",
            "-i", str(video_path),
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "22",
            "-pix_fmt", "yuv420p", "-an",
            str(proxy_file)
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=40)
        if res.returncode == 0 and proxy_file.exists() and proxy_file.stat().st_size > 1024:
            return proxy_file
    except Exception:
        pass
    return video_path


def extract_sequence_order(filename: str) -> int | None:
    """
    Detect chronological Story Spine numbering from filenames such as:
      - '01_intro.mp4', '02_verse.mp4', '003-drop.mp4'
      - 'clip_1.mp4', 'clip_2.mp4', 'scene_01.mp4', 'shot04.png', 'demo_01_neon.mp4'
    """
    stem = Path(filename).stem
    # 1. Leading number prefix: "01_...", "02-...", "1. ..."
    m1 = re.match(r"^\s*(\d{1,4})(?:[\s_\-\.]+|$)", stem)
    if m1:
        return int(m1.group(1))
    # 2. Common narrative prefix + number: "clip_1", "scene_02", "shot-3", "part4", "demo_01"
    m2 = re.match(
        r"^\s*(?:clip|scene|shot|part|seq|act|ch|chapter|img|still|frame|vid|video|demo|stage)[\s_\-]*(\d{1,4})(?:[\s_\-\.]+|$)",
        stem,
        re.IGNORECASE,
    )
    if m2:
        return int(m2.group(1))
    return None


def classify_visual_mood(mean_h: float, mean_s: float, mean_v: float, contrast: float, motion_score: float, flicker_score: float) -> list[str]:
    tags = []
    if motion_score >= 0.72:
        tags.extend(["high-energy", "intense", "action", "dynamic"])
    elif motion_score >= 0.42:
        tags.extend(["medium-energy", "rhythmic", "moving"])
    else:
        tags.extend(["calm", "atmospheric", "slow", "cinematic"])

    if flicker_score >= 0.35:
        tags.extend(["strobe", "flash", "glitchy"])

    if mean_v < 75:
        tags.extend(["dark", "moody", "shadowy", "night"])
    elif mean_v > 185:
        tags.extend(["bright", "airy", "daylight"])

    if mean_s > 135:
        tags.append("vibrant")
        if 125 <= mean_h <= 172:
            tags.extend(["neon", "cyberpunk", "magenta", "purple"])
        elif 5 <= mean_h <= 32:
            tags.extend(["warm", "golden", "fiery"])
        elif 85 <= mean_h < 125:
            tags.extend(["cool", "cyan", "electric"])
    elif mean_s < 45:
        tags.extend(["monochrome", "desaturated", "gritty"])
    else:
        if 8 <= mean_h <= 30:
            tags.append("warm")
        elif 90 <= mean_h <= 130:
            tags.append("cool")

    if contrast > 65:
        tags.append("high-contrast")

    return list(dict.fromkeys(tags))


def recommend_sections_from_metrics(motion_score: float, mean_v: float, flicker_score: float) -> list[str]:
    recs = []
    if motion_score >= 0.68 or flicker_score >= 0.4:
        recs.extend(["drop", "chorus"])
    if 0.40 <= motion_score <= 0.78:
        recs.extend(["chorus", "build"])
    if 0.22 <= motion_score <= 0.62:
        recs.append("verse")
    if motion_score <= 0.45:
        recs.extend(["intro", "outro", "verse"])
    return list(dict.fromkeys(recs)) or ["verse", "chorus"]


def analyze_image_local_cv(image_path: Path, clip_id: str) -> dict:
    """Analyze a static image (.png, .jpg, .webp) and configure it for Ken Burns motion sequencing."""
    pil_img = Image.open(image_path).convert("RGB")
    width, height = pil_img.size
    rgb = np.array(pil_img)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    small = cv2.resize(bgr, (240, 135), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)

    mean_h, mean_s, mean_v = [float(x) for x in np.mean(hsv.reshape(-1, 3), axis=0)]
    rgb_avg = np.mean(rgb.reshape(-1, 3), axis=0)
    contrast = float(np.std(gray))

    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    edge_energy = float(np.mean(np.hypot(gx, gy))) / 115.0
    sat_boost = (mean_s / 255.0) * 0.25
    synthetic_energy = float(np.clip(0.28 + 0.50 * edge_energy + sat_boost, 0.20, 0.88))

    dom_hex = "#{:02x}{:02x}{:02x}".format(
        int(np.clip(rgb_avg[0], 0, 255)),
        int(np.clip(rgb_avg[1], 0, 255)),
        int(np.clip(rgb_avg[2], 0, 255)),
    )

    thumb_img = pil_img.copy()
    thumb_img.thumbnail((480, 270), Image.Resampling.LANCZOS)
    thumb_path = THUMBS_DIR / f"{clip_id}.jpg"
    thumb_img.save(thumb_path, "JPEG", quality=86)

    strip_w, strip_h = 320, 180
    grid_img = Image.new("RGB", (strip_w * 2, strip_h * 2), (16, 16, 22))
    crops = [
        pil_img,
        pil_img.crop((int(width * 0.1), int(height * 0.1), int(width * 0.85), int(height * 0.85))),
        pil_img.crop((0, int(height * 0.15), int(width * 0.8), int(height * 0.95))),
        pil_img.crop((int(width * 0.2), 0, width, int(height * 0.8))),
    ]
    for idx_k, c_img in enumerate(crops):
        resized = c_img.resize((strip_w, strip_h), Image.Resampling.LANCZOS)
        grid_img.paste(resized, ((idx_k % 2) * strip_w, (idx_k // 2) * strip_h))
    strip_path = THUMBS_DIR / f"{clip_id}_grid.jpg"
    grid_img.save(strip_path, "JPEG", quality=82)

    vibe_tags = classify_visual_mood(mean_h, mean_s, mean_v, contrast, synthetic_energy, 0.0)
    if "still-image" not in vibe_tags:
        vibe_tags.insert(0, "still-image")
    recommended_sections = recommend_sections_from_metrics(synthetic_energy, mean_v, 0.0)
    for sec in ("intro", "verse", "chorus"):
        if sec not in recommended_sections:
            recommended_sections.append(sec)

    kb_preset = KEN_BURNS_PRESETS[sum(ord(ch) for ch in clip_id) % len(KEN_BURNS_PRESETS)]
    seq_order = extract_sequence_order(image_path.name)

    return {
        "id": clip_id,
        "filename": image_path.name,
        "path": str(image_path),
        "media_type": "image",
        "sequence_order": seq_order,
        "ken_burns_preset": kb_preset,
        "thumbnail": f"/workspace/thumbnails/{clip_id}.jpg",
        "grid_image": f"/workspace/thumbnails/{clip_id}_grid.jpg",
        "duration": 4.0,
        "fps": 30.0,
        "width": width,
        "height": height,
        "motion_score": round(synthetic_energy, 3),
        "flicker_score": 0.0,
        "brightness": round(mean_v / 255.0, 3),
        "dominant_color": dom_hex,
        "peak_time": 0.0,
        "best_start_sec": 0.0,
        "motion_curve": [round(synthetic_energy, 3)] * 8,
        "internal_cuts": [],
        "vibe_tags": vibe_tags,
        "lyric_keywords": [],
        "camera_motion": f"ken-burns ({kb_preset})",
        "description": f"Still Image ({kb_preset.replace('_', ' ')}): {', '.join(vibe_tags[1:4]).title()}",
        "recommended_sections": recommended_sections,
        "ai_provider_used": "local_cv",
    }


def analyze_clip_local_cv(video_path: Path, clip_id: str) -> dict:
    """Fast local OpenCV optical-motion, color mood, peak window, and keyframe extractor for videos or images."""
    if is_image_file(video_path):
        return analyze_image_local_cv(video_path, clip_id)

    eff_path = _ensure_webm_analysis_proxy(video_path)
    cap = cv2.VideoCapture(str(eff_path))
    if not cap.isOpened():
        raise ValueError(f"Could not open media file: {video_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    if fps <= 1.0 or fps > 240.0:
        fps = 30.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1280)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 720)
    duration = float(frame_count / fps) if frame_count > 0 else 5.0

    sample_fps = 6.0
    step = max(1, int(round(fps / sample_fps)))
    max_samples = 360

    prev_gray = None
    motion_vals = []
    sample_times = []
    luma_vals = []
    hsv_means = []
    rgb_means = []
    contrast_vals = []
    scene_cuts = []

    frame_idx = 0
    sampled = 0
    while True:
        ret = cap.grab()
        if not ret:
            break
        if frame_idx % step == 0:
            ok, frame = cap.retrieve()
            if not ok or frame is None:
                break
            t_sec = frame_idx / fps
            small = cv2.resize(frame, (160, 90), interpolation=cv2.INTER_AREA)
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
            rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

            luma = float(np.mean(gray))
            luma_vals.append(luma)
            contrast_vals.append(float(np.std(gray)))
            hsv_means.append(np.mean(hsv.reshape(-1, 3), axis=0))
            rgb_means.append(np.mean(rgb.reshape(-1, 3), axis=0))

            if prev_gray is not None:
                diff = cv2.absdiff(gray, prev_gray)
                mot = float(np.mean(diff)) / 38.0
                motion_vals.append(min(1.5, mot))
                sample_times.append(round(t_sec, 3))
                if mot > 0.95 and (not scene_cuts or (t_sec - scene_cuts[-1]) > 1.0):
                    scene_cuts.append(round(t_sec, 3))
            else:
                motion_vals.append(0.0)
                sample_times.append(round(t_sec, 3))

            prev_gray = gray
            sampled += 1
            if sampled >= max_samples:
                break
        frame_idx += 1

    keyframe_images = []
    num_keys = 4
    for k in range(num_keys):
        frac = (k + 0.5) / num_keys
        target_frame = min(max(0, frame_count - 1), int(frac * frame_count))
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        ok, frame = cap.read()
        if ok and frame is not None:
            rgb_f = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_f)
            keyframe_images.append(pil_img)

    cap.release()

    if not keyframe_images:
        keyframe_images = [Image.new("RGB", (640, 360), (25, 25, 35))]

    mid_img = keyframe_images[len(keyframe_images) // 2].copy()
    mid_img.thumbnail((480, 270), Image.Resampling.LANCZOS)
    thumb_path = THUMBS_DIR / f"{clip_id}.jpg"
    mid_img.save(thumb_path, "JPEG", quality=85)

    strip_w, strip_h = 320, 180
    grid_img = Image.new("RGB", (strip_w * 2, strip_h * 2), (16, 16, 22))
    for idx_k, k_img in enumerate(keyframe_images[:4]):
        resized = k_img.resize((strip_w, strip_h), Image.Resampling.LANCZOS)
        gx = (idx_k % 2) * strip_w
        gy = (idx_k // 2) * strip_h
        grid_img.paste(resized, (gx, gy))
    strip_path = THUMBS_DIR / f"{clip_id}_grid.jpg"
    grid_img.save(strip_path, "JPEG", quality=82)

    mot_arr = np.array(motion_vals, dtype=np.float32) if motion_vals else np.array([0.3], dtype=np.float32)
    motion_score = float(np.clip(np.percentile(mot_arr, 75), 0.05, 1.0))

    peak_idx = int(np.argmax(mot_arr)) if len(mot_arr) > 0 else 0
    peak_time = float(sample_times[peak_idx]) if sample_times else duration * 0.5
    best_start_sec = max(0.0, min(max(0.0, duration - 1.5), peak_time - 0.5))

    curve_bins = min(40, max(4, int(duration * 2)))
    if len(mot_arr) >= curve_bins:
        chunks = np.array_split(mot_arr, curve_bins)
        motion_curve = [round(float(np.clip(np.mean(c), 0.0, 1.0)), 3) for c in chunks]
    else:
        motion_curve = [round(float(np.clip(x, 0.0, 1.0)), 3) for x in mot_arr]

    luma_arr = np.array(luma_vals, dtype=np.float32) if luma_vals else np.array([120.0])
    flicker_score = float(np.clip(np.mean(np.abs(np.diff(luma_arr))) / 25.0, 0.0, 1.0)) if len(luma_arr) > 1 else 0.0

    hsv_avg = np.mean(hsv_means, axis=0) if hsv_means else np.array([0.0, 50.0, 128.0])
    rgb_avg = np.mean(rgb_means, axis=0) if rgb_means else np.array([100.0, 100.0, 120.0])
    contrast_avg = float(np.mean(contrast_vals)) if contrast_vals else 45.0

    dom_hex = "#{:02x}{:02x}{:02x}".format(
        int(np.clip(rgb_avg[0], 0, 255)),
        int(np.clip(rgb_avg[1], 0, 255)),
        int(np.clip(rgb_avg[2], 0, 255)),
    )

    vibe_tags = classify_visual_mood(
        float(hsv_avg[0]),
        float(hsv_avg[1]),
        float(hsv_avg[2]),
        contrast_avg,
        motion_score,
        flicker_score,
    )
    recommended_sections = recommend_sections_from_metrics(motion_score, float(hsv_avg[2]), flicker_score)
    seq_order = extract_sequence_order(video_path.name)

    return {
        "id": clip_id,
        "filename": video_path.name,
        "path": str(video_path),
        "media_type": "video",
        "sequence_order": seq_order,
        "ken_burns_preset": None,
        "thumbnail": f"/workspace/thumbnails/{clip_id}.jpg",
        "grid_image": f"/workspace/thumbnails/{clip_id}_grid.jpg",
        "duration": round(duration, 3),
        "fps": round(fps, 2),
        "width": width,
        "height": height,
        "motion_score": round(motion_score, 3),
        "flicker_score": round(flicker_score, 3),
        "brightness": round(float(hsv_avg[2]) / 255.0, 3),
        "dominant_color": dom_hex,
        "peak_time": round(peak_time, 3),
        "best_start_sec": round(best_start_sec, 3),
        "motion_curve": motion_curve,
        "internal_cuts": scene_cuts,
        "vibe_tags": vibe_tags,
        "lyric_keywords": [],
        "camera_motion": "dynamic" if motion_score > 0.6 else ("gentle-move" if motion_score > 0.28 else "locked/slow"),
        "description": f"{', '.join(vibe_tags[:3]).title()} clip ({round(duration, 1)}s, energy {int(motion_score * 100)}%)",
        "recommended_sections": recommended_sections,
        "ai_provider_used": "local_cv",
    }


def split_video_into_scenes(video_path: Path, threshold: float = 0.42) -> list[Path]:
    """Optional automatic scene splitter using OpenCV frame histogram/luma jumps + FFmpeg stream/fast copy."""
    if is_image_file(video_path):
        return [video_path]

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return [video_path]
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = frame_count / max(1.0, fps)
    if duration < 4.0:
        cap.release()
        return [video_path]

    step = max(1, int(round(fps / 8.0)))
    prev_hist = None
    cut_times = [0.0]
    idx = 0
    while True:
        ret = cap.grab()
        if not ret:
            break
        if idx % step == 0:
            ok, frame = cap.retrieve()
            if not ok or frame is None:
                break
            hsv = cv2.cvtColor(cv2.resize(frame, (128, 72)), cv2.COLOR_BGR2HSV)
            hist = cv2.calcHist([hsv], [0, 1], None, [32, 32], [0, 180, 0, 256])
            cv2.normalize(hist, hist)
            t = idx / fps
            if prev_hist is not None:
                dist = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA)
                if dist >= threshold and (t - cut_times[-1]) >= 1.5 and (duration - t) >= 1.2:
                    cut_times.append(round(t, 3))
            prev_hist = hist
        idx += 1
    cap.release()

    if len(cut_times) <= 1:
        return [video_path]

    cut_times.append(round(duration, 3))
    ffmpeg = get_ffmpeg_exe()
    sub_paths = []
    stem = video_path.stem
    for i in range(len(cut_times) - 1):
        s, e = cut_times[i], cut_times[i + 1]
        if (e - s) < 1.0:
            continue
        out_p = CLIPS_DIR / f"{stem}_scene{i+1:02d}.mp4"
        cmd = [
            ffmpeg, "-y", "-nostdin", "-v", "error",
            "-ss", str(s), "-to", str(e),
            "-i", str(video_path),
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
            "-c:a", "aac",
            str(out_p),
        ]
        subprocess.run(cmd, check=True)
        sub_paths.append(out_p)
    return sub_paths if sub_paths else [video_path]


VISION_SYSTEM_PROMPT = """You are an expert AI Music Video & Short Film Editor analyzing a 2x2 keyframe grid from a video clip or still image.
Return ONLY valid JSON (no markdown fences) with these exact keys:
{
  "description": "1 concise sentence describing visual subject, action, lighting, and atmosphere",
  "vibe_tags": ["5 to 8 lowercase mood/style/visual tags, e.g. neon, dark, euphoric, crowd, closeup, nature, cyberpunk, slow-mo"],
  "lyric_keywords": ["5 to 8 thematic/lyric words or metaphors that match this visual, e.g. fire, night, running, alone, sky, pulse"],
  "camera_motion": "one of: static, slow-pan, handheld, fast-action, zoom, aerial, tracking, ken-burns",
  "energy_override": 0.0 to 1.0 float rating visual intensity,
  "recommended_sections": ["subset of: intro, verse, build, drop, chorus, outro"]
}"""


def _parse_ai_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        cleaned = match.group(0)
    return json.loads(cleaned)


async def analyze_with_openai_compatible(
    grid_path: Path,
    clip_meta: dict,
    base_url: str,
    model: str,
    api_key: str = "",
) -> dict:
    """
    Universal OpenAI-compatible Vision API caller.
    Works with OpenAI (api.openai.com/v1), OpenRouter (openrouter.ai/api/v1),
    Groq (api.groq.com/openai/v1), Mistral (api.mistral.ai/v1),
    Ollama (localhost:11434/v1), and KoboldCpp (localhost:5001/v1).
    """
    img_b64 = base64.b64encode(grid_path.read_bytes()).decode("utf-8")
    clean_base = base_url.rstrip("/")
    if not clean_base.endswith("/v1") and "openai" not in clean_base and "openrouter" not in clean_base:
        # If user passed http://localhost:11434 without /v1, append /v1 for standard OpenAI schema
        clean_base = f"{clean_base}/v1"
    url = f"{clean_base}/chat/completions"

    headers = {"Content-Type": "application/json"}
    if api_key and api_key.strip():
        headers["Authorization"] = f"Bearer {api_key.strip()}"
    if "openrouter.ai" in clean_base:
        headers["HTTP-Referer"] = "http://localhost:8765"
        headers["X-Title"] = "Strangelet Splicer"

    payload = {
        "model": model,
        "temperature": 0.2,
        "max_tokens": 500,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"{VISION_SYSTEM_PROMPT}\nMedia filename: {clip_meta['filename']}, type: {clip_meta.get('media_type', 'video')}, energy score: {clip_meta['motion_score']}.",
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"},
                },
            ],
        }],
    }
    timeout_cfg = httpx.Timeout(20.0, connect=3.0)
    async with httpx.AsyncClient(timeout=timeout_cfg) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        text = data["choices"][0]["message"]["content"]
        parsed = _parse_ai_json(text)
        parsed["ai_provider_used"] = f"openai_compat ({model})"
        return parsed


async def discover_openai_compatible_models(base_url: str, api_key: str = "") -> dict:
    """Query /v1/models (or Ollama /api/tags fallback) for any OpenAI-compatible provider."""
    clean_base = base_url.rstrip("/")
    headers = {}
    if api_key and api_key.strip():
        headers["Authorization"] = f"Bearer {api_key.strip()}"

    models_url = f"{clean_base}/models" if (clean_base.endswith("/v1") or "openai" in clean_base) else f"{clean_base}/v1/models"
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            resp = await client.get(models_url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            items = data.get("data", [])
            models = [m.get("id") for m in items if isinstance(m, dict) and m.get("id")]
            return {"online": True, "models": models[:60], "endpoint": models_url}
        except Exception as e1:
            # Try Ollama /api/tags fallback if localhost:11434
            try:
                root_url = re.sub(r"/v1$", "", clean_base)
                resp2 = await client.get(f"{root_url}/api/tags")
                resp2.raise_for_status()
                d2 = resp2.json()
                models = [m["name"] for m in d2.get("models", [])]
                return {"online": True, "models": models, "endpoint": f"{root_url}/api/tags"}
            except Exception:
                return {"online": False, "models": [], "error": str(e1)}


async def analyze_with_gemini(grid_path: Path, clip_meta: dict, api_key: str, model: str = "gemini-2.5-flash") -> dict:
    img_b64 = base64.b64encode(grid_path.read_bytes()).decode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": f"{VISION_SYSTEM_PROMPT}\nMedia filename: {clip_meta['filename']}, type: {clip_meta.get('media_type', 'video')}, duration: {clip_meta['duration']}s, energy score: {clip_meta['motion_score']}."},
                {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}},
            ]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }
    async with httpx.AsyncClient(timeout=35.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code != 200 and model != "gemini-2.0-flash":
            url_fb = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            resp = await client.post(url_fb, json=payload)
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = _parse_ai_json(text)
        parsed["ai_provider_used"] = f"gemini ({model})"
        return parsed


async def analyze_with_claude(grid_path: Path, clip_meta: dict, api_key: str, model: str = "claude-3-5-sonnet-latest") -> dict:
    img_b64 = base64.b64encode(grid_path.read_bytes()).decode("utf-8")
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": 500,
        "temperature": 0.2,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64},
                },
                {
                    "type": "text",
                    "text": f"{VISION_SYSTEM_PROMPT}\nMedia filename: {clip_meta['filename']}, type: {clip_meta.get('media_type', 'video')}, energy score: {clip_meta['motion_score']}.",
                },
            ],
        }],
    }
    async with httpx.AsyncClient(timeout=35.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        text = data["content"][0]["text"]
        parsed = _parse_ai_json(text)
        parsed["ai_provider_used"] = f"claude ({model})"
        return parsed


def is_local_server_open(base_url: str) -> bool:
    """Quick 0.15s socket probe to verify a localhost LLM server is actually running."""
    import socket
    from urllib.parse import urlparse
    try:
        parsed = urlparse(base_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        with socket.create_connection((host, port), timeout=0.15):
            return True
    except Exception:
        return False


async def enrich_clip_with_ai(clip_meta: dict, provider_override: str | None = None) -> dict:
    """Route clip/image analysis to Universal OpenAI-Compatible API, Gemini, Claude, Ollama, or Local CV."""
    settings = load_settings()
    provider = provider_override or settings.get("ai_provider", "local_cv")
    grid_path = THUMBS_DIR / f"{clip_meta['id']}_grid.jpg"
    if not grid_path.exists():
        return clip_meta

    if provider == "local_cv":
        return clip_meta

    ai_result = None
    errors = []

    async def try_universal_openai():
        base_url = settings.get("universal_base_url", "").strip()
        model = settings.get("universal_model", "").strip()
        api_key = settings.get("universal_api_key", "").strip()
        if not base_url or not model:
            return None
        is_local = "localhost" in base_url or "127.0.0.1" in base_url
        if is_local:
            if not is_local_server_open(base_url):
                return None
        elif not api_key and provider == "hybrid_auto":
            return None
        return await analyze_with_openai_compatible(grid_path, clip_meta, base_url, model, api_key)

    async def try_gemini():
        key = settings.get("gemini_api_key", "").strip()
        if not key:
            return None
        return await analyze_with_gemini(grid_path, clip_meta, key, settings.get("gemini_model", "gemini-2.5-flash"))

    async def try_claude():
        key = settings.get("claude_api_key", "").strip()
        if not key:
            return None
        return await analyze_with_claude(grid_path, clip_meta, key, settings.get("claude_model", "claude-3-5-sonnet-latest"))

    try:
        if provider in ("openai_compat", "ollama", "openai_local"):
            ai_result = await try_universal_openai()
        elif provider == "gemini":
            ai_result = await try_gemini()
        elif provider == "claude":
            ai_result = await try_claude()
        elif provider == "hybrid_auto":
            for fn in (try_universal_openai, try_gemini, try_claude):
                try:
                    res = await fn()
                    if res:
                        ai_result = res
                        break
                except Exception as e:
                    errors.append(str(e))
    except Exception as e:
        errors.append(str(e))

    if ai_result and isinstance(ai_result, dict):
        if ai_result.get("description"):
            clip_meta["description"] = str(ai_result["description"])
        if isinstance(ai_result.get("vibe_tags"), list):
            merged_tags = list(dict.fromkeys([str(t).lower() for t in ai_result["vibe_tags"]] + clip_meta.get("vibe_tags", [])))
            clip_meta["vibe_tags"] = merged_tags[:12]
        if isinstance(ai_result.get("lyric_keywords"), list):
            clip_meta["lyric_keywords"] = [str(k).lower() for k in ai_result["lyric_keywords"][:12]]
        if ai_result.get("camera_motion") and clip_meta.get("media_type") != "image":
            clip_meta["camera_motion"] = str(ai_result["camera_motion"])
        if isinstance(ai_result.get("energy_override"), (int, float)):
            clip_meta["motion_score"] = round(
                0.6 * float(clip_meta["motion_score"]) + 0.4 * float(np.clip(ai_result["energy_override"], 0.0, 1.0)),
                3,
            )
        if isinstance(ai_result.get("recommended_sections"), list) and ai_result["recommended_sections"]:
            clip_meta["recommended_sections"] = [str(s).lower() for s in ai_result["recommended_sections"]]
        clip_meta["ai_provider_used"] = ai_result.get("ai_provider_used", provider)
    elif errors:
        clip_meta["ai_notice"] = f"Used Local CV ({errors[0][:100]})"

    return clip_meta


def generate_library_contact_sheet(clips: list[dict]) -> dict:
    """
    Create a single numbered contact sheet image of all clips/stills + a universal prompt
    for any LLM Web Chat or Vision Bridge (ChatGPT, OpenRouter, Claude, Gemini, Local WebUI).
    """
    if not clips:
        raise ValueError("No media items in library to generate a contact sheet.")

    row_h = 150
    col_w = 760
    img_h = max(200, len(clips) * row_h + 60)
    sheet = Image.new("RGB", (col_w, img_h), (15, 17, 24))
    draw = ImageDraw.Draw(sheet)

    draw.text((20, 16), "Strangelet Splicer — UNIVERSAL AI ENGINE & VISION CONTACT SHEET", fill=(235, 240, 255))
 
    clip_ids_list = []
    for idx, c in enumerate(clips):
        y0 = 52 + idx * row_h
        draw.rectangle([12, y0, col_w - 12, y0 + row_h - 10], fill=(26, 30, 42), outline=(55, 65, 90))
        mtype = (c.get("media_type") or "video").upper()
        seq_str = f" | Story #{c['sequence_order']:02d}" if c.get("sequence_order") is not None else ""
        label = f"#{idx + 1} [{mtype}{seq_str}] | ID: {c['id']} | {c['filename'][:24]} | Energy: {int(c['motion_score']*100)}%"
        draw.text((24, y0 + 10), label, fill=(130, 220, 255))
        draw.text((24, y0 + 32), f"Auto-CV Tags: {', '.join(c.get('vibe_tags', [])[:5])}", fill=(180, 190, 210))

        grid_p = THUMBS_DIR / f"{c['id']}_grid.jpg"
        thumb_p = THUMBS_DIR / f"{c['id']}.jpg"
        src_p = grid_p if grid_p.exists() else thumb_p
        if src_p.exists():
            try:
                im = Image.open(src_p).convert("RGB")
                im.thumbnail((240, row_h - 24), Image.Resampling.LANCZOS)
                sheet.paste(im, (col_w - 265, y0 + 8))
            except Exception:
                pass
        clip_ids_list.append({
            "index": idx + 1,
            "id": c["id"],
            "filename": c["filename"],
            "media_type": mtype,
            "sequence_order": c.get("sequence_order"),
        })

    out_file = CONTACT_SHEETS_DIR / "library_contact_sheet.jpg"
    sheet.save(out_file, "JPEG", quality=88)

    prompt_text = (
        "Attached is a numbered contact sheet of video clips and still images for 'Strangelet Splicer' automated audio-reactive music video engine.\n"
        "For EACH item shown in the image, return a JSON array of objects with these exact fields:\n"
        "[\n"
        "  {\n"
        '    "id": "exact clip ID shown on that row",\n'
        '    "description": "short 1-sentence visual description",\n'
        '    "vibe_tags": ["5 lowercase mood/visual tags"],\n'
        '    "lyric_keywords": ["5 thematic or lyric keywords matching the visual"],\n'
        '    "camera_motion": "static | slow-pan | handheld | fast-action | zoom | ken-burns",\n'
        '    "energy_override": 0.0 to 1.0,\n'
        '    "recommended_sections": ["intro", "verse", "build", "drop", "chorus", "outro"]\n'
        "  }\n"
        "]\n"
        f"Media items to tag: {json.dumps(clip_ids_list)}\n"
        "Respond with ONLY the valid JSON array."
    )

    return {
        "contact_sheet_url": "/workspace/contact_sheets/library_contact_sheet.jpg",
        "contact_sheet_path": str(out_file),
        "prompt": prompt_text,
        "clip_count": len(clips),
    }
