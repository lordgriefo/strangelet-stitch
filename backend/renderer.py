import math
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from .config import WORKSPACE_DIR, CLIPS_DIR, EXPORTS_DIR, get_ffmpeg_exe
from .ai_analyzer import is_image_file
from .lyric_engine import get_active_lyric_cue


RENDER_JOBS: dict[str, dict] = {}
REVERSE_CACHE_DIR = WORKSPACE_DIR / "cache" / "reversed_clips"
REVERSE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
WEBM_PROXY_CACHE_DIR = WORKSPACE_DIR / "cache" / "webm_proxies"
WEBM_PROXY_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _get_or_create_webm_proxy_clip(src_path: Path) -> Path:
    """
    If the source clip is a WebM file (VP8/VP9/AV1), generate a fast H.264 MP4 proxy
    so OpenCV cv2.VideoCapture can decode frames reliably on Windows without codec errors.
    """
    if src_path.suffix.lower() not in (".webm", ".mkv"):
        return src_path
    proxy_path = WEBM_PROXY_CACHE_DIR / f"proxy_{src_path.stem}.mp4"
    if proxy_path.exists() and proxy_path.stat().st_size > 1024:
        return proxy_path
    try:
        ffmpeg = get_ffmpeg_exe()
        cmd = [
            ffmpeg,
            "-y",
            "-nostdin",
            "-v", "error",
            "-i", str(src_path),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-an",
            str(proxy_path),
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=40)
        if res.returncode == 0 and proxy_path.exists() and proxy_path.stat().st_size > 1024:
            return proxy_path
    except Exception:
        pass
    return src_path


def _get_or_create_ffmpeg_reversed_clip(src_path: Path) -> Path:
    """
    Generate a reversed video clip using FFmpeg `-vf reverse` argument if not already cached,
    falling back gracefully to original path if clip is very long or FFmpeg fails.
    Outputs as standard H.264 MP4 container to avoid WebM container muxing issues.
    """
    rev_path = REVERSE_CACHE_DIR / f"rev_{src_path.stem}.mp4"
    if rev_path.exists() and rev_path.stat().st_size > 1024:
        return rev_path
    try:
        ffmpeg = get_ffmpeg_exe()
        cmd = [
            ffmpeg,
            "-y",
            "-nostdin",
            "-v", "error",
            "-i", str(src_path),
            "-vf", "reverse",
            "-an",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "20",
            "-pix_fmt", "yuv420p",
            str(rev_path),
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        if res.returncode == 0 and rev_path.exists() and rev_path.stat().st_size > 1024:
            return rev_path
    except Exception:
        pass
    return src_path


def apply_ken_burns_motion(
    frame: np.ndarray,
    progress: float,
    preset: str | None,
    reverse: bool = False,
    ping_pong: bool = False,
) -> np.ndarray:
    """
    Apply smooth Ken Burns pan/zoom across [0..1] progress of a cut so still images feel alive.
    Supports Reverse Playback (inverts motion vector: zoom-in -> zoom-out, pan-left -> pan-right)
    and Ping-Pong / Yo-Yo (plays first 50% forward and remaining 50% in reverse).
    """
    h, w = frame.shape[:2]
    p = float(np.clip(progress, 0.0, 1.0))
    if ping_pong:
        p = (p * 2.0) if p <= 0.5 else ((1.0 - p) * 2.0)
    if reverse:
        p = 1.0 - p

    mode = preset or "zoom_in_pan_right"

    if mode == "zoom_in_pan_right":
        scale = 1.04 + 0.14 * p
        tx = (-0.03 + 0.06 * p) * w
        ty = (-0.015 + 0.03 * p) * h
    elif mode == "zoom_out_pan_left":
        scale = 1.18 - 0.14 * p
        tx = (0.03 - 0.06 * p) * w
        ty = (0.015 - 0.03 * p) * h
    elif mode == "pan_up_zoom_in":
        scale = 1.06 + 0.12 * p
        tx = 0.0
        ty = (0.035 - 0.07 * p) * h
    elif mode == "pan_down_zoom_out":
        scale = 1.16 - 0.10 * p
        tx = 0.0
        ty = (-0.035 + 0.07 * p) * h
    elif mode == "drift_left_to_right":
        scale = 1.12
        tx = (-0.045 + 0.09 * p) * w
        ty = 0.0
    else:  # zoom_in_center
        scale = 1.02 + 0.16 * p
        tx = 0.0
        ty = 0.0

    M = np.float32([
        [scale, 0.0, (1.0 - scale) * (w * 0.5) + tx],
        [0.0, scale, (1.0 - scale) * (h * 0.5) + ty],
    ])
    return cv2.warpAffine(frame, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)


def _apply_optical_treatment(
    frame: np.ndarray,
    optical_treatment: str | None = "none",
    prism_mirror: bool = False,
) -> np.ndarray:
    """
    Apply One-Click CSS Optical Treatments in OpenCV for MP4 render synchronization:
      - 'solarized_sabattier': High-contrast inverted midtones with glowing edges
      - 'two_color_crimson_charcoal' / 'two_color_dye': Deep duotone Blood Red / Charcoal wash
      - 'two_color_cyan_amber': Deep duotone Cyan / Amber wash
      - 'infrared_thermal': False-color thermal gradient map
      - 'prism_horizontal_mirror' or prism_mirror=True: Horizontal mirror flip (scaleX(-1))
    """
    opt = (optical_treatment or "none").lower()
    out = frame.copy()

    if prism_mirror or opt == "prism_horizontal_mirror":
        out = cv2.flip(out, 1)

    if opt == "solarized_sabattier":
        # Sabattier solarization curve: fold midtones |2*x - 255| + glowing cyan/amber edge halo
        f32 = out.astype(np.float32) / 255.0
        solar = np.abs(2.0 * f32 - 1.0)
        solar = np.clip(np.power(solar, 0.82) * 255.0, 0, 255).astype(np.uint8)
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 55, 145)
        edges_glow = cv2.GaussianBlur(edges, (5, 5), 0)
        edge_bgr = np.zeros_like(out)
        edge_bgr[:, :, 0] = edges_glow  # Cyan-amber edge glow
        edge_bgr[:, :, 1] = edges_glow
        edge_bgr[:, :, 2] = (edges_glow * 0.65).astype(np.uint8)
        out = cv2.addWeighted(solar, 0.88, edge_bgr, 0.75, 0)
    elif opt in ("two_color_crimson_charcoal", "two_color_dye"):
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        # Map luma [0..1] from Deep Charcoal (24, 18, 20) to Blood Red / Warm Crimson (42, 32, 232)
        c_low = np.array([24.0, 18.0, 20.0], dtype=np.float32)
        c_high = np.array([42.0, 32.0, 232.0], dtype=np.float32)
        g_curve = np.clip(np.power(gray, 1.05), 0.0, 1.0)[..., None]
        duo = (c_low * (1.0 - g_curve) + c_high * g_curve).astype(np.uint8)
        out = cv2.addWeighted(duo, 0.82, out, 0.18, 0)
    elif opt == "two_color_cyan_amber":
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        # Map luma [0..1] from Deep Teal/Cyan (155, 115, 18) to Bright Amber/Gold (45, 195, 255)
        c_low = np.array([155.0, 115.0, 18.0], dtype=np.float32)
        c_high = np.array([45.0, 195.0, 255.0], dtype=np.float32)
        g_curve = np.clip(np.power(gray, 0.95), 0.0, 1.0)[..., None]
        duo = (c_low * (1.0 - g_curve) + c_high * g_curve).astype(np.uint8)
        out = cv2.addWeighted(duo, 0.82, out, 0.18, 0)
    elif opt == "infrared_thermal":
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
        gray_eq = cv2.equalizeHist(gray)
        out = cv2.applyColorMap(gray_eq, cv2.COLORMAP_INFERNO)

    return out


def _apply_geometric_echo_tunnel(
    frame: np.ndarray,
    echo_buffer: np.ndarray | None,
    bass_val: float,
    snare_val: float,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Lightweight 2D Geometric Echo Tunnel (Zero-Overhead Feedback):
      - Redraws previous canvas state onto itself at scale = 1.05 (1.02..1.12 on bass transients),
        rotation = 2 deg (flipped on snare hits), and opacity = 0.90.
      - Snare hits apply a 90-degree hue shift to the feedback tunnel.
    """
    h, w = frame.shape[:2]
    if echo_buffer is None or echo_buffer.shape != frame.shape:
        return frame, frame.copy()

    scale = 1.05 if bass_val <= 0.15 else float(np.clip(1.02 + bass_val * 0.10, 1.02, 1.12))
    angle_deg = -2.0 if snare_val > 0.45 else 2.0

    M = cv2.getRotationMatrix2D((w * 0.5, h * 0.5), angle_deg, scale)
    warped_prev = cv2.warpAffine(echo_buffer, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)

    if snare_val > 0.45:
        # Fast 90-degree hue rotation on the feedback echo layer
        warped_prev = warped_prev[:, :, [1, 2, 0]]

    # Composite feedback tunnel at 0.90 opacity with current frame so tunnel trails recurse infinitely
    tunnel_blend = np.maximum(
        (frame.astype(np.float32) * 0.72 + warped_prev.astype(np.float32) * 0.52),
        warped_prev.astype(np.float32) * 0.90,
    )
    out = np.clip(tunnel_blend, 0, 255).astype(np.uint8)
    # Blend center of current frame cleanly so subject remains sharp inside the tunnel
    out = cv2.addWeighted(frame, 0.48, out, 0.52, 0)
    return out, out.copy()


BURROUGHS_PHRASES = [
    "LANGUAGE IS A VIRUS",
    "WORD FALLING - PHOTO FALLING",
    "STORMING THE REALITY STUDIO",
    "NOTHING IS TRUE, EVERYTHING IS PERMITTED",
    "THE TICKET THAT EXPLODED",
    "RUB OUT THE WORD",
]

ENOCHIAN_GLYPHS = [
    "OL SONF VORSG",
    "ZACAR OD ZAMRAN",
    "MICMA GOHO PIAD",
    "ZIRDO IADNAMAD",
    "LONSA CAPIMAO",
    "BABALON - AETHYR",
]


def _draw_procedural_chaos_sigil(canvas: np.ndarray, seed_val: int) -> None:
    """Draw a high-contrast geometric Chaos Sigil / Austin Osman Spare glyph on a frame."""
    h, w = canvas.shape[:2]
    cx, cy = w // 2, h // 2
    r_outer = int(min(w, h) * 0.30)
    r_inner = int(min(w, h) * 0.14)
    color_main = (240, 248, 255)
    color_crimson = (60, 40, 255)

    cv2.circle(canvas, (cx, cy), r_outer, color_main, 2, cv2.LINE_AA)
    cv2.circle(canvas, (cx, cy), r_inner, color_crimson, 2, cv2.LINE_AA)

    pts = []
    for k in range(8):
        ang = (k * math.pi / 4.0) + (seed_val % 7) * 0.22
        rad = r_outer if k % 2 == 0 else r_inner
        px = int(cx + math.cos(ang) * rad)
        py = int(cy + math.sin(ang) * rad)
        pts.append((px, py))
        cv2.line(canvas, (cx, cy), (px, py), color_main, 2, cv2.LINE_AA)
        cv2.circle(canvas, (px, py), 6, color_crimson, -1, cv2.LINE_AA)

    for i in range(len(pts)):
        cv2.line(canvas, pts[i], pts[(i + 3) % len(pts)], color_main, 2, cv2.LINE_AA)


def _apply_obsidian_scrying_mask(frame: np.ndarray, radial_mirror: bool = False) -> np.ndarray:
    """Apply deep circular obsidian scrying glass falloff and optional outer radial mirror reflection."""
    h, w = frame.shape[:2]
    out = frame.copy()
    yy, xx = np.ogrid[:h, :w]
    nx = (xx - w * 0.5) / (w * 0.46)
    ny = (yy - h * 0.5) / (h * 0.46)
    r2 = nx * nx + ny * ny

    if radial_mirror:
        mirrored = cv2.flip(out, -1)
        ring_mask = np.clip((r2 - 0.55) / 0.50, 0.0, 1.0)[..., None].astype(np.float32)
        out = (out.astype(np.float32) * (1.0 - 0.55 * ring_mask) + mirrored.astype(np.float32) * (0.55 * ring_mask)).astype(np.uint8)

    vignette = np.clip(1.22 - r2 * 0.98, 0.0, 1.0)[..., None].astype(np.float32)
    out = (out.astype(np.float32) * vignette).astype(np.uint8)
    # Faint obsidian specularity rim
    cv2.circle(out, (w // 2, h // 2), int(min(w, h) * 0.44), (75, 65, 55), 1, cv2.LINE_AA)
    return out


def apply_audio_reactive_fx(
    frame: np.ndarray,
    bass_val: float,
    snare_val: float,
    high_val: float,
    fx_cfg: dict,
    time_in_clip: float,
    clip_dur: float,
    transition_type: str,
    fps: int = 30,
    style_fx: str = "clean",
    rms_val: float = 0.5,
    downbeat_punch: bool = False,
    sprocket_slip: bool = False,
    typographic_flashes: bool = False,
    typo_phrase: str | None = None,
    adjacent_frame: np.ndarray | None = None,
    subliminal_sigil_flash: bool = False,
    obsidian_scrying_vignette: bool = False,
    thelemic_dye_bloom: bool = False,
    cosmic_static_glitch: bool = False,
    sigil_frame: np.ndarray | None = None,
    optical_treatment: str | None = "none",
    prism_mirror: bool = False,
    lyrics_active: bool = False,
) -> np.ndarray:
    """
    Apply real-time audio-reactive zoom, camera shake, RGB split, transitions,
    One-Click CSS Optical Treatments, and Core + Avant-Garde & Auteur + Esoteric & Occult Style Engine FX.
    """
    h, w = frame.shape[:2]
    frame_num = int(round(time_in_clip * fps))

    # 0A. Chaos Sigil Flash (Austin Osman Spare / IOT) & 1-Frame Subliminal Sigil Flash Toggle:
    # Sub-bass impacts and kick transients trigger instant negative/inverted 1-frame sigil injections
    # returning immediately to the ongoing story clip.
    eff_sigil = bool(subliminal_sigil_flash or style_fx == "chaos_sigil" or fx_cfg.get("subliminal_sigil_flash"))
    if eff_sigil and bass_val > 0.56 and (frame_num % 5 == 0):
        base_sig = sigil_frame.copy() if (sigil_frame is not None and sigil_frame.shape == frame.shape) else frame.copy()
        inv_sig = cv2.bitwise_not(base_sig)
        _draw_procedural_chaos_sigil(inv_sig, frame_num)
        return inv_sig

    # 0B. Dark Minimalist: Black-frame dropouts on quiet passages
    if style_fx == "dark_minimalist" and rms_val < 0.18 and bass_val < 0.25:
        if rms_val < 0.12 or int(time_in_clip * 12) % 3 == 0:
            return np.zeros_like(frame)

    # 0C. Structural Flicker (Sharits / Conrad): 1-to-2 frame alternating strobes between adjacent clips & pure B/W on hi-hats
    if style_fx == "structural_flicker":
        if high_val > 0.45 or snare_val > 0.50:
            mod = frame_num % 4
            if mod == 0:
                return np.full_like(frame, 255)
            elif mod == 1 and adjacent_frame is not None and adjacent_frame.shape == frame.shape:
                return adjacent_frame.copy()
            elif mod == 2:
                return np.zeros_like(frame)
        elif frame_num % 3 == 1 and adjacent_frame is not None and adjacent_frame.shape == frame.shape:
            frame = adjacent_frame

    # 0D. Enochian Scrying Glass soft dissolve transition at cut boundaries
    if (transition_type == "soft_dissolve" or style_fx == "enochian_scrying") and time_in_clip < 0.65 and adjacent_frame is not None and adjacent_frame.shape == frame.shape:
        alpha_d = float(np.clip(time_in_clip / 0.65, 0.0, 1.0))
        frame = cv2.addWeighted(adjacent_frame, 1.0 - alpha_d, frame, alpha_d, 0)

    out = frame

    bass_zoom_amt = float(fx_cfg.get("bass_zoom", 0.5)) * bass_val
    shake_amt = float(fx_cfg.get("shake", 0.3)) * (bass_val if bass_val > 0.55 else 0.0)
    rgb_amt = float(fx_cfg.get("rgb_split", 0.3)) * max(snare_val, high_val * 0.7)
    flash_amt = float(fx_cfg.get("snare_flash", 0.3)) * (snare_val if snare_val > 0.62 else 0.0)

    two_frame_sec = max(0.068, 2.2 / max(24, fps))
    three_frame_sec = max(0.095, 3.0 / max(24, fps))

    # Social Short / Reel Frenzy: Downbeat zoom-punch at cut start or downbeat
    if style_fx == "reel_frenzy" and (downbeat_punch or time_in_clip < 0.18):
        punch_env = max(0.0, 1.0 - (time_in_clip / 0.18))
        bass_zoom_amt += 0.95 * punch_env
        rgb_amt = max(rgb_amt, 0.45 * punch_env)

    # Dim Carcosa / Aldebaran Gold: Sudden jarring geometric match-cut zoom/flip on downbeats
    if style_fx == "dim_carcosa" and (downbeat_punch or clip_dur <= 0.45):
        out = cv2.flip(out, 1)
        bass_zoom_amt += 0.55

    # Cyber Glitch / Hyper-Chop extra tear
    if style_fx == "cyber_glitch":
        rgb_amt = max(rgb_amt * 1.35, 0.30 if snare_val > 0.4 else 0.18)
        if snare_val > 0.52 or high_val > 0.60:
            flash_amt = max(flash_amt, 0.55 * max(snare_val, high_val))

    # Lynchian Industrial Monochrome: Sub-bass canvas tremors (20-60Hz)
    if style_fx == "lynch_monochrome" and bass_val > 0.30:
        shake_amt = max(shake_amt, bass_val * 0.95)

    # Transition handling at the start of the cut block
    if transition_type in ("flash_white", "flash") and time_in_clip < two_frame_sec:
        punch = 1.0 - (time_in_clip / two_frame_sec)
        flash_amt = max(flash_amt, 0.92 if time_in_clip < (1.1 / fps) else 0.60 * punch)
        bass_zoom_amt += 0.08 * punch

    elif transition_type in ("quick_glitch", "impact") and time_in_clip < three_frame_sec:
        punch = 1.0 - (time_in_clip / three_frame_sec)
        rgb_amt = max(rgb_amt, 1.15 * punch)
        bass_zoom_amt += 0.10 * punch
        out = out.copy()
        num_slices = 5
        for s_i in range(num_slices):
            y0 = int(((s_i * 37 + int(time_in_clip * 1000)) % 100) / 100.0 * (h - 24))
            sh = min(h - y0, max(8, int(h * 0.06)))
            shift = int(math.sin(s_i * 9.1 + time_in_clip * 220.0) * w * 0.045 * punch)
            out[y0:y0 + sh] = np.roll(out[y0:y0 + sh], shift, axis=1)

    # 1. Bass-Reactive Zoom + Camera Shake
    zoom_factor = 1.0 + min(0.28, bass_zoom_amt * 0.16)
    dx = 0.0
    dy = 0.0
    if shake_amt > 0.08:
        freq_x = 180.0 if style_fx == "lynch_monochrome" else 95.0
        freq_y = 210.0 if style_fx == "lynch_monochrome" else 115.0
        dx = math.sin(time_in_clip * freq_x) * shake_amt * (w * 0.018)
        dy = math.cos(time_in_clip * freq_y) * shake_amt * (h * 0.018)

    if zoom_factor > 1.005 or abs(dx) > 0.5 or abs(dy) > 0.5:
        crop_w = w / zoom_factor
        crop_h = h / zoom_factor
        cx = (w * 0.5) + dx
        cy = (h * 0.5) + dy
        x1 = int(np.clip(cx - crop_w * 0.5, 0, w - crop_w))
        y1 = int(np.clip(cy - crop_h * 0.5, 0, h - crop_h))
        x2 = int(min(w, x1 + crop_w))
        y2 = int(min(h, y1 + crop_h))
        if x2 > x1 + 10 and y2 > y1 + 10:
            cropped = out[y1:y2, x1:x2]
            out = cv2.resize(cropped, (w, h), interpolation=cv2.INTER_LINEAR)

    # 2. Chromatic Aberration / RGB Channel Split on Snare/High Transients or Quick Glitch
    if rgb_amt > 0.16 and style_fx != "lynch_monochrome":
        shift_px = max(1, int(round(rgb_amt * (w * 0.009))))
        if shift_px >= 1:
            b, g, r = cv2.split(out)
            r_shifted = np.roll(r, shift_px, axis=1)
            b_shifted = np.roll(b, -shift_px, axis=1)
            out = cv2.merge([b_shifted, g, r_shifted])

    # 3. Style-Specific Post FX (Core + Avant-Garde & Auteur + Esoteric & Occult Suite)
    if style_fx == "vhs_tape":
        out = out.copy()
        out[::3, :, :] = (out[::3, :, :].astype(np.float32) * 0.78).astype(np.uint8)
        if snare_val > 0.42:
            bar_y = int(((time_in_clip * 260.0) % 1.0) * (h - 28))
            out[bar_y:bar_y + 18] = np.roll(out[bar_y:bar_y + 18], int(snare_val * 18), axis=1)
            out[bar_y:bar_y + 6] = np.clip(out[bar_y:bar_y + 6].astype(np.int16) + 65, 0, 255).astype(np.uint8)

    elif style_fx in ("film_16mm", "mekas_bolex", "marker_jetee"):
        blur = cv2.GaussianBlur(out, (0, 0), sigmaX=7.0)
        out = cv2.addWeighted(out, 0.84, blur, 0.22, 4.0)
        rng = np.random.default_rng(int(time_in_clip * 1000) + 17)
        grain = rng.integers(-16, 17, size=(h // 2, w // 2, 1), dtype=np.int16)
        grain_full = cv2.resize(grain.astype(np.float32), (w, h), interpolation=cv2.INTER_NEAREST)[..., None]
        out = np.clip(out.astype(np.float32) + grain_full, 0, 255).astype(np.uint8)

    elif style_fx == "dark_minimalist":
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
        desat = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        blended = cv2.addWeighted(out, 0.45, desat, 0.55, 0)
        out = np.clip((blended.astype(np.float32) - 118.0) * 1.48 + 105.0, 0, 255).astype(np.uint8)

    elif style_fx == "lynch_monochrome":
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32)
        crushed = np.clip((gray - 116.0) * 1.85 + 108.0, 0, 255).astype(np.uint8)
        out = cv2.cvtColor(crushed, cv2.COLOR_GRAY2BGR)
        if snare_val > 0.52:
            tungsten = np.full_like(out, (190, 235, 255))
            out = cv2.addWeighted(out, 0.35, tungsten, 0.65, 0)

    elif style_fx == "brakhage_emulsion":
        out = out.copy()
        rng = np.random.default_rng(int(time_in_clip * 1000) + 99)
        for _ in range(3):
            sx = int(rng.integers(20, max(25, w - 20)))
            color = (210, 240, 255) if rng.random() > 0.4 else (30, 80, 255)
            cv2.line(out, (sx, 0), (sx + int(rng.integers(-12, 13)), h), color, 1 + int(rng.integers(0, 2)))
        if bass_val > 0.48:
            burn = np.zeros_like(out)
            bx = int((0.25 + 0.5 * math.sin(time_in_clip * 17.0)) * w)
            by = int((0.25 + 0.5 * math.cos(time_in_clip * 13.0)) * h)
            rad = int(max(w, h) * (0.28 + 0.32 * bass_val))
            cv2.circle(burn, (bx, by), rad, (20, 125, 255), -1)
            burn = cv2.GaussianBlur(burn, (0, 0), sigmaX=35.0)
            out = cv2.addWeighted(out, 1.0, burn, min(0.75, bass_val * 0.80), 0)

    elif style_fx == "babalon_working":
        # Babalon Working (Parsons / 1946 Mojave): Blood-red & gold duotone shifts + Mojave heat-shimmer displacement
        f_bgr = out.astype(np.float32)
        b_ch, g_ch, r_ch = cv2.split(f_bgr)
        r_new = np.clip(r_ch * 1.42 + 28.0, 0, 255)
        g_new = np.clip(g_ch * 0.88 + r_ch * 0.18, 0, 255)
        b_new = np.clip(b_ch * 0.36, 0, 255)
        out = cv2.merge([b_new, g_new, r_new]).astype(np.uint8)
        # Mojave heat-shimmer horizontal wave displacement
        band_h = max(4, h // 18)
        for b_i in range(0, h - band_h, band_h):
            shimmer_px = int(math.sin(time_in_clip * 18.0 + b_i * 0.09) * (3.0 + 6.0 * bass_val))
            if shimmer_px != 0:
                out[b_i:b_i + band_h] = np.roll(out[b_i:b_i + band_h], shimmer_px, axis=1)

    elif style_fx == "enochian_scrying":
        # Enochian Scrying Glass (Dee & Kelley): Deep obsidian tint + faint Enochian character overlays on cymbal/hi-hat washes
        f_bgr = out.astype(np.float32)
        b_ch, g_ch, r_ch = cv2.split(f_bgr)
        out = cv2.merge([
            np.clip(b_ch * 1.14 + 8.0, 0, 255),
            np.clip(g_ch * 0.96 + 4.0, 0, 255),
            np.clip(r_ch * 0.80, 0, 255),
        ]).astype(np.uint8)
        if high_val > 0.28 or snare_val > 0.42:
            glyph_txt = ENOCHIAN_GLYPHS[(frame_num // 6) % len(ENOCHIAN_GLYPHS)]
            overlay = out.copy()
            cv2.putText(
                overlay,
                glyph_txt,
                (int(w * 0.22), int(h * (0.32 + 0.36 * ((frame_num // 10) % 2)))),
                cv2.FONT_HERSHEY_SIMPLEX,
                max(0.75, w / 920.0),
                (215, 238, 255),
                2,
                cv2.LINE_AA,
            )
            alpha_g = min(0.46, max(high_val, snare_val) * 0.52)
            out = cv2.addWeighted(out, 1.0 - alpha_g, overlay, alpha_g, 0)

    elif style_fx == "typhonian_transmission":
        # Typhonian Transmissions (Grant / Outer Gateways): Deep cosmic violet/void palette + inverted negative stroboscopic pulses
        f_bgr = out.astype(np.float32)
        b_ch, g_ch, r_ch = cv2.split(f_bgr)
        out = cv2.merge([
            np.clip(b_ch * 1.32 + 18.0, 0, 255),
            np.clip(g_ch * 0.62, 0, 255),
            np.clip(r_ch * 1.15 + 10.0, 0, 255),
        ]).astype(np.uint8)
        if (snare_val > 0.48 or high_val > 0.52) and (frame_num % 2 == 0):
            out = cv2.bitwise_not(out)

    elif style_fx == "dim_carcosa":
        # Dim Carcosa / Aldebaran Gold: Tarnished metallic gold, deep amber, and atmospheric dust haze
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32)
        b_gold = np.clip(gray * 0.42 + 12.0, 0, 255)
        g_gold = np.clip(gray * 0.88 + 24.0, 0, 255)
        r_gold = np.clip(gray * 1.24 + 38.0, 0, 255)
        gold_frame = cv2.merge([b_gold, g_gold, r_gold]).astype(np.uint8)
        haze = cv2.GaussianBlur(gold_frame, (0, 0), sigmaX=15.0)
        out = cv2.addWeighted(gold_frame, 0.78, haze, 0.28, 6.0)
        rng = np.random.default_rng(frame_num + 303)
        for _ in range(28):
            dx_p = int(rng.integers(10, max(15, w - 10)))
            dy_p = int(rng.integers(10, max(15, h - 10)))
            cv2.circle(out, (dx_p, dy_p), int(rng.integers(1, 4)), (140, 215, 255), -1)

    # 4. Toggleable Esoteric & Avant-Garde FX Extensions
    eff_thelemic = bool(thelemic_dye_bloom or style_fx == "babalon_working" or fx_cfg.get("thelemic_dye_bloom"))
    if eff_thelemic and (snare_val > 0.42 or (transition_type == "flash_white" and time_in_clip < two_frame_sec)):
        # 2-frame solar overexposure bloom & crimson/gold dye flash on heavy snares
        solar = np.zeros_like(out)
        solar[:, :] = (35, 175, 255) if (frame_num % 2 == 0) else (30, 50, 255)
        bloom_blur = cv2.GaussianBlur(out, (0, 0), sigmaX=18.0)
        solar_mix = cv2.addWeighted(bloom_blur, 0.45, solar, 0.55, 32.0)
        bloom_alpha = min(0.82, max(0.48, snare_val * 0.88))
        out = cv2.addWeighted(out, 1.0 - bloom_alpha * 0.65, solar_mix, bloom_alpha, 0)

    eff_cosmic = bool(cosmic_static_glitch or style_fx == "typhonian_transmission" or fx_cfg.get("cosmic_static_glitch"))
    if eff_cosmic and (high_val > 0.36 or snare_val > 0.44 or bass_val > 0.52):
        out = out.copy()
        rng = np.random.default_rng(frame_num * 31 + 7)
        num_rf_bars = 4 + int(max(high_val, snare_val) * 6)
        for _ in range(num_rf_bars):
            ry = int(rng.integers(0, max(1, h - 14)))
            rh = int(rng.integers(3, 14))
            rf_noise = rng.integers(0, 256, size=(rh, w, 3), dtype=np.uint8)
            out[ry:ry + rh] = cv2.addWeighted(out[ry:ry + rh], 0.30, rf_noise, 0.70, 0)
            out[ry:ry + rh] = np.roll(out[ry:ry + rh], int(rng.integers(-35, 36)), axis=1)

    eff_scrying = bool(obsidian_scrying_vignette or style_fx in ("enochian_scrying", "dim_carcosa") or fx_cfg.get("obsidian_scrying_vignette"))
    if eff_scrying:
        out = _apply_obsidian_scrying_mask(out, radial_mirror=(style_fx == "enochian_scrying"))

    if sprocket_slip or style_fx in ("brakhage_emulsion", "mekas_bolex") or fx_cfg.get("sprocket_slip"):
        if bass_val > 0.45 or snare_val > 0.48:
            out = out.copy()
            slip_y = int(math.sin(time_in_clip * 95.0) * (h * 0.22 * max(bass_val, snare_val)))
            out = np.roll(out, slip_y, axis=0)
            seam_y = slip_y % h
            y_end = min(h, seam_y + 8)
            out[seam_y:y_end, :] = (18, 14, 12)

    eff_typo_muted = bool(fx_cfg.get("typo_muted", False))
    if not eff_typo_muted and (typographic_flashes or style_fx == "burroughs_cutup" or fx_cfg.get("typographic_flashes")) and snare_val > 0.46:
        out = out.copy()
        phrase = typo_phrase or BURROUGHS_PHRASES[int(time_in_clip * 25) % len(BURROUGHS_PHRASES)]
        if lyrics_active:
            banner_y = int(h * (0.16 + 0.03 * math.sin(time_in_clip * 30.0)))
        else:
            banner_y = int(h * (0.42 + 0.16 * math.sin(time_in_clip * 40.0)))
        cv2.rectangle(out, (0, banner_y - 30), (w, banner_y + 16), (10, 10, 14), -1)
        cv2.putText(
            out,
            phrase,
            (max(24, int(w * 0.08)), banner_y),
            cv2.FONT_HERSHEY_DUPLEX,
            max(0.65, w / 1150.0),
            (245, 245, 240),
            2,
            cv2.LINE_AA,
        )

    # 5. 2-Frame Flash-to-White / Snare Exposure Flash
    if flash_amt > 0.08:
        alpha = min(0.88, flash_amt * 0.78)
        white = np.full_like(out, 255)
        out = cv2.addWeighted(out, 1.0 - alpha * 0.65, white, alpha, 0)

    # 6. Per-Block One-Click Optical Treatments & Prism Horizontal Mirror
    if optical_treatment and optical_treatment != "none" or prism_mirror:
        out = _apply_optical_treatment(out, optical_treatment, prism_mirror)

    return out


def fit_frame_to_canvas(frame: np.ndarray, target_w: int, target_h: int) -> np.ndarray:
    h, w = frame.shape[:2]
    if w == target_w and h == target_h:
        return frame
    scale = max(target_w / max(1, w), target_h / max(1, h))
    new_w = max(target_w, int(round(w * scale)))
    new_h = max(target_h, int(round(h * scale)))
    resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    x0 = (new_w - target_w) // 2
    y0 = (new_h - target_h) // 2
    return resized[y0:y0 + target_h, x0:x0 + target_w]


def _draw_lower_third_lyric(frame: np.ndarray, text: str) -> np.ndarray:
    """
    Draw a clean lower-third subtitle on an OpenCV BGR frame when lyrics are active.
    Supports multi-line text, semi-transparent dark backdrop pill, and crisp high-contrast text.
    """
    if not text or not text.strip():
        return frame
    h, w = frame.shape[:2]
    lines = [ln.strip() for ln in str(text).splitlines() if ln.strip()]
    if not lines:
        return frame

    out = frame.copy()
    font = cv2.FONT_HERSHEY_DUPLEX
    font_scale = max(0.55, min(1.15, (w / 1280.0) * 0.78))
    thickness = max(1, int(round(font_scale * 2.0)))
    line_gap = int(round(12 * (h / 720.0)))

    line_Metrics = []
    max_tw = 0
    total_th = 0
    for ln in lines:
        (tw, th), baseline = cv2.getTextSize(ln, font, font_scale, thickness)
        line_Metrics.append((ln, tw, th, baseline))
        max_tw = max(max_tw, tw)
        total_th += th
    total_th += line_gap * (len(lines) - 1)

    pad_x = int(round(22 * (w / 1280.0)))
    pad_y = int(round(12 * (h / 720.0)))
    bottom_margin = int(round(h * 0.085))

    box_w = min(w - 24, max_tw + pad_x * 2)
    box_h = total_th + pad_y * 2
    x0 = max(12, (w - box_w) // 2)
    y1 = max(box_h + 12, h - bottom_margin)
    y0 = max(8, y1 - box_h)
    x1 = min(w - 12, x0 + box_w)

    # Semi-transparent dark lower-third pill backdrop
    roi = out[y0:y1, x0:x1]
    dark_bg = np.full_like(roi, (18, 14, 14), dtype=np.uint8)
    out[y0:y1, x0:x1] = cv2.addWeighted(roi, 0.32, dark_bg, 0.68, 0)
    cv2.rectangle(out, (x0, y0), (x1, y1), (195, 165, 95), 1, cv2.LINE_AA)

    curr_y = y0 + pad_y
    for ln, tw, th, _ in line_Metrics:
        tx = max(x0 + 8, (w - tw) // 2)
        ty = curr_y + th
        # Subtle dark drop shadow / outline + crisp white text
        cv2.putText(out, ln, (tx + 2, ty + 2), font, font_scale, (8, 8, 10), thickness + 2, cv2.LINE_AA)
        cv2.putText(out, ln, (tx, ty), font, font_scale, (248, 250, 255), thickness, cv2.LINE_AA)
        curr_y += th + line_gap

    return out


def render_timeline_to_mp4(
    job_id: str,
    timeline: dict,
    audio_path: Path,
    audio_analysis: dict,
    width: int = 1280,
    height: int = 720,
    fps: int = 30,
    max_duration: float | None = None,
    lyrics_state: dict | None = None,
    include_lyrics: bool | None = None,
    profile: str = "master",
    format_container: str = "mp4",
    custom_filename: str | None = None,
    output_destination: str | None = None,
) -> Path:
    """
    Frame-accurate audio-reactive video, Ken Burns still-image, and 3-Column Fold-In renderer.
    Supports Quality Profiles:
      - 'draft': Lightning Draft (CRF 30 ultrafast MP4 or VP9/speed 5 WebM; up to 10x faster)
      - 'master': Master Archive (CRF 16 medium MP4 with 320k AAC for pristine uncompressed pixel quality)
    Streams processed OpenCV frames directly into FFmpeg encoder + muxes original audio with ETA tracking.
    """
    profile_clean = (profile or "master").lower()
    is_draft = (profile_clean == "draft")
    format_clean = (format_container or "mp4").lower().strip()
    target_ext = ".webm" if (is_draft and format_clean == "webm") else ".mp4"

    # Resolve output filename
    song_stem = Path(audio_path).stem if audio_path else "strangelet_splicer"
    if custom_filename and custom_filename.strip():
        chosen_name = custom_filename.strip()
        if not chosen_name.lower().endswith(target_ext):
            chosen_name += target_ext
        out_filename = chosen_name
    else:
        profile_tag = "lightning_draft" if is_draft else "master_archive"
        out_filename = f"{song_stem}_{profile_tag}_{int(time.time())}{target_ext}"

    # Resolve output path
    if output_destination and output_destination.strip():
        dest_p = Path(output_destination.strip())
        if dest_p.is_dir():
            out_path = dest_p / out_filename
        else:
            dest_p.parent.mkdir(parents=True, exist_ok=True)
            out_path = dest_p
            out_filename = out_path.name
    else:
        out_path = EXPORTS_DIR / out_filename

    RENDER_JOBS[job_id] = {
        "status": "running",
        "progress": 0.0,
        "elapsed_seconds": 0.0,
        "eta_seconds": 0.0,
        "eta_formatted": "Estimating...",
        "fps_speed": 0.0,
        "profile": profile_clean,
        "format": target_ext.lstrip("."),
        "message": f"Initializing Strangelet Splicer [{ '⚡ Draft' if is_draft else '💎 Master' }] render pipeline...",
        "output_url": None,
        "output_path": str(out_path),
        "filename": out_filename,
    }

    try:
        events = timeline.get("events", [])
        if not events:
            raise ValueError("Timeline has no events to render.")

        total_dur = float(timeline.get("total_duration") or events[-1]["end"])
        if max_duration and max_duration > 0:
            total_dur = min(total_dur, float(max_duration))

        ffmpeg = get_ffmpeg_exe()

        # Build codec parameters based on profile and container
        if target_ext == ".webm":
            # ⚡ Lightning Draft: WebM VP9 (speed 5, 1M bitrate) + Opus audio
            video_codec_args = [
                "-c:v", "libvpx-vp9",
                "-b:v", "1M",
                "-speed", "5",
                "-pix_fmt", "yuv420p",
            ]
            audio_codec_args = [
                "-c:a", "libopus",
                "-b:a", "96k",
            ]
        elif is_draft:
            # ⚡ Lightning Draft: H.264 ultrafast CRF 30 + 128k AAC audio (up to 10x faster)
            video_codec_args = [
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "30",
                "-pix_fmt", "yuv420p",
            ]
            audio_codec_args = [
                "-c:a", "aac",
                "-b:a", "128k",
            ]
        else:
            # 💎 Master Archive: H.264 medium CRF 16 (Pristine visual clarity) + 320k Studio AAC
            video_codec_args = [
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "16",
                "-pix_fmt", "yuv420p",
            ]
            audio_codec_args = [
                "-c:a", "aac",
                "-b:a", "320k",
            ]

        cmd = [
            ffmpeg,
            "-y",
            "-nostdin",
            "-v", "error",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", f"{width}x{height}",
            "-framerate", str(fps),
            "-i", "-",
            "-i", str(audio_path),
            "-t", str(round(total_dur, 3)),
            "-map", "0:v:0",
            "-map", "1:a:0",
            *video_codec_args,
            *audio_codec_args,
            "-shortest",
            str(out_path),
        ]

        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)


        env_60 = audio_analysis.get("envelopes_60hz", {})
        env_fps = int(env_60.get("fps", 60))
        bass_arr = env_60.get("bass", [0.0])
        snare_arr = env_60.get("snare", [0.0])
        high_arr = env_60.get("high", [0.0])
        rms_arr = env_60.get("rms", [0.5])

        caps: dict[str, dict] = {}
        static_images: dict[str, np.ndarray] = {}

        def get_media_frame(ev: dict, source_sec: float, progress_in_cut: float) -> np.ndarray:
            clip_filename = ev["clip_filename"]
            cpath = CLIPS_DIR / clip_filename
            is_rev = bool(ev.get("reverse", False))
            is_pp = bool(ev.get("ping_pong", False))

            if ev.get("media_type") == "image" or is_image_file(cpath):
                if clip_filename not in static_images:
                    try:
                        pil_im = Image.open(cpath).convert("RGB")
                        bgr_im = cv2.cvtColor(np.array(pil_im), cv2.COLOR_RGB2BGR)
                        static_images[clip_filename] = fit_frame_to_canvas(bgr_im, width, height)
                    except Exception:
                        static_images[clip_filename] = np.zeros((height, width, 3), dtype=np.uint8)
                base_img = static_images[clip_filename]
                return apply_ken_burns_motion(
                    base_img,
                    progress_in_cut,
                    ev.get("ken_burns"),
                    reverse=is_rev,
                    ping_pong=is_pp,
                )

            # Route WebM files through high-compatibility H.264 proxy for reliable OpenCV frame extraction
            eff_src_path = _get_or_create_webm_proxy_clip(cpath)

            # For pure reverse (without ping-pong), pre-render via FFmpeg -vf reverse for smooth sequential reads
            use_ffmpeg_rev_file = is_rev and not is_pp
            eff_path = _get_or_create_ffmpeg_reversed_clip(eff_src_path) if use_ffmpeg_rev_file else eff_src_path
            cap_key = f"{clip_filename}::rev" if (use_ffmpeg_rev_file and eff_path != eff_src_path) else (
                f"{clip_filename}::proxy" if eff_src_path != cpath else clip_filename
            )

            if cap_key not in caps:
                cap = cv2.VideoCapture(str(eff_path))
                cfps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
                if cfps <= 1.0 or cfps > 240.0:
                    cfps = 30.0
                cframes = max(1, int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 30))
                caps[cap_key] = {
                    "cap": cap,
                    "fps": cfps,
                    "frames": cframes,
                    "last_idx": -999,
                    "last_img": np.zeros((height, width, 3), dtype=np.uint8),
                    "is_pre_reversed": (eff_path != cpath),
                }
            info = caps[cap_key]
            raw_idx = int(round(max(0.0, source_sec) * info["fps"])) % info["frames"]
            if is_rev and not is_pp and not info.get("is_pre_reversed"):
                target_idx = (info["frames"] - 1 - raw_idx) % info["frames"]
            else:
                target_idx = raw_idx

            cap = info["cap"]
            if target_idx != info["last_idx"]:
                if target_idx != info["last_idx"] + 1:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, target_idx)
                ok, frm = cap.read()
                if not ok or frm is None:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ok, frm = cap.read()
                if ok and frm is not None:
                    info["last_img"] = fit_frame_to_canvas(frm, width, height)
                    info["last_idx"] = target_idx
            return info["last_img"]

        total_frames = max(1, int(round(total_dur * fps)))
        ev_idx = 0
        n_events = len(events)
        echo_buffer: np.ndarray | None = None

        start_render_time = time.time()
        for f_idx in range(total_frames):
            t = f_idx / float(fps)
            while ev_idx + 1 < n_events and t >= events[ev_idx]["end"]:
                ev_idx += 1

            ev = events[ev_idx]
            ev_start = float(ev["start"])
            ev_dur = max(0.05, float(ev["duration"]))
            t_local = max(0.0, t - ev_start)
            norm_p = min(1.0, t_local / ev_dur)

            env_i = min(len(bass_arr) - 1, max(0, int(round(t * env_fps))))
            b_val = float(bass_arr[env_i]) if bass_arr else 0.0
            s_val = float(snare_arr[env_i]) if snare_arr else 0.0
            h_val = float(high_arr[env_i]) if high_arr else 0.0
            r_val = float(rms_arr[env_i]) if rms_arr else 0.5

            fx_cfg = ev.get("fx", {})
            style_fx = ev.get("style_fx", timeline.get("style_fx", "clean"))
            step_12 = bool(ev.get("step_print_12fps") or fx_cfg.get("step_print_12fps") or style_fx == "lynch_monochrome")
            rev_stutter = bool(ev.get("reverse_stutter") or fx_cfg.get("reverse_stutter") or style_fx in ("burroughs_cutup", "kubelka_metric"))

            # Handle Ping-Pong / Yo-Yo (first 50% forward, remaining 50% in reverse)
            if ev.get("ping_pong") and ev.get("media_type") != "image":
                pp_p = (norm_p * 2.0) if norm_p <= 0.5 else ((1.0 - norm_p) * 2.0)
                if ev.get("reverse"):
                    pp_p = 1.0 - pp_p
                base_t_local = pp_p * (ev_dur * 0.5)
            else:
                base_t_local = t_local

            eff_t_local = math.floor(base_t_local * 12.0) / 12.0 if step_12 else base_t_local
            # 3-frame tape-drag reverse stutter on kick hits or downbeats
            if rev_stutter and (b_val > 0.58 or (ev.get("downbeat_punch") and t_local < 0.28)):
                stutter_back = (f_idx % 3) * (2.0 / max(24, fps))
                eff_t_local = max(0.0, eff_t_local - stutter_back)

            if fx_cfg.get("speed_ramp", False) and ev.get("media_type") != "image" and not step_12 and not ev.get("ping_pong"):
                warped_p = min(1.0, 1.45 * norm_p - 0.45 * (norm_p ** 2))
                src_time = float(ev.get("in_point", 0.0)) + warped_p * ev_dur
            else:
                src_time = float(ev.get("in_point", 0.0)) + eff_t_local

            raw_frame = get_media_frame(ev, src_time, norm_p)

            # Burroughs 3-Column Fold-In Split Canvas (Asynchronous 3-stream composite)
            fold_cols = int(ev.get("fold_in_columns") or timeline.get("fold_in_columns") or (3 if style_fx == "burroughs_cutup" else 1))
            fold_clips = ev.get("fold_in_clips") or []
            if fold_cols == 3 and len(fold_clips) >= 2:
                col_w = width // 3
                left_desc, right_desc = fold_clips[0], fold_clips[1]
                left_t = float(left_desc.get("in_point", 0.0)) + eff_t_local * float(left_desc.get("rate", 0.88))
                right_t = float(right_desc.get("in_point", 0.0)) + eff_t_local * float(right_desc.get("rate", 1.14))
                left_frm = get_media_frame(left_desc, left_t, norm_p)
                right_frm = get_media_frame(right_desc, right_t, norm_p)

                comp = np.zeros_like(raw_frame)
                x_mid = (width - col_w) // 2
                comp[:, :col_w] = left_frm[:, x_mid:x_mid + col_w]
                comp[:, col_w:col_w * 2] = raw_frame[:, x_mid:x_mid + col_w]
                comp[:, col_w * 2:] = right_frm[:, x_mid:x_mid + (width - col_w * 2)]
                # Vertical fold-in splice seams
                comp[:, col_w - 1:col_w + 1] = (220, 220, 220)
                comp[:, col_w * 2 - 1:col_w * 2 + 1] = (220, 220, 220)
                raw_frame = comp

            adj_frame = None
            if (style_fx in ("structural_flicker", "enochian_scrying") or ev.get("transition") == "soft_dissolve") and ev.get("adjacent_clip_filename"):
                adj_ev = {
                    "clip_filename": ev["adjacent_clip_filename"],
                    "media_type": ev.get("adjacent_media_type", "video"),
                    "ken_burns": "zoom_in_center",
                }
                adj_frame = get_media_frame(adj_ev, float(ev.get("adjacent_in_point", 0.0)) + eff_t_local, norm_p)

            sig_frame = None
            eff_sig_flag = bool(ev.get("subliminal_sigil_flash", timeline.get("subliminal_sigil_flash", False)) or style_fx == "chaos_sigil")
            if eff_sig_flag and b_val > 0.54 and ev.get("sigil_clip_filename"):
                sig_ev = {
                    "clip_filename": ev["sigil_clip_filename"],
                    "media_type": ev.get("sigil_media_type", "image"),
                    "ken_burns": "zoom_in_center",
                }
                sig_frame = get_media_frame(sig_ev, 0.0, 0.5)

            transition = ev.get("transition", "hard_cut")

            eff_include_lyrics = (
                bool(include_lyrics)
                if include_lyrics is not None
                else bool(lyrics_state and lyrics_state.get("include_in_render", True))
            )
            has_lyrics_track = bool(eff_include_lyrics and lyrics_state and lyrics_state.get("cues"))

            final_frame = apply_audio_reactive_fx(
                raw_frame,
                bass_val=b_val,
                snare_val=s_val,
                high_val=h_val,
                fx_cfg=fx_cfg,
                time_in_clip=t_local,
                clip_dur=ev_dur,
                transition_type=transition,
                fps=fps,
                style_fx=style_fx,
                rms_val=r_val,
                downbeat_punch=bool(ev.get("downbeat_punch", False)),
                sprocket_slip=bool(ev.get("sprocket_slip", timeline.get("sprocket_slip", False))),
                typographic_flashes=bool(ev.get("typographic_flashes", timeline.get("typographic_flashes", False))),
                typo_phrase=ev.get("typo_phrase"),
                adjacent_frame=adj_frame,
                subliminal_sigil_flash=eff_sig_flag,
                obsidian_scrying_vignette=bool(ev.get("obsidian_scrying_vignette", timeline.get("obsidian_scrying_vignette", False))),
                thelemic_dye_bloom=bool(ev.get("thelemic_dye_bloom", timeline.get("thelemic_dye_bloom", False))),
                cosmic_static_glitch=bool(ev.get("cosmic_static_glitch", timeline.get("cosmic_static_glitch", False))),
                sigil_frame=sig_frame,
                optical_treatment=str(ev.get("optical_treatment", "none") or "none"),
                prism_mirror=bool(ev.get("prism_mirror", False)),
                lyrics_active=has_lyrics_track,
            )

            # Lightweight Geometric Echo Tunnel (Zero-Overhead 2D Feedback)
            if bool(ev.get("geometric_echo_tunnel", timeline.get("geometric_echo_tunnel", False))):
                final_frame, echo_buffer = _apply_geometric_echo_tunnel(
                    final_frame,
                    echo_buffer,
                    bass_val=b_val,
                    snare_val=s_val,
                )
            else:
                echo_buffer = None

            # Timed Lyric Engine lower-third subtitle overlay (bypassed 100% when Include Lyrics is unchecked)
            if eff_include_lyrics and lyrics_state:
                active_cue = get_active_lyric_cue(lyrics_state, t, respect_render_flag=False)
                if active_cue and active_cue.get("text"):
                    final_frame = _draw_lower_third_lyric(final_frame, active_cue["text"])

            proc.stdin.write(final_frame.tobytes())

            if f_idx % 10 == 0 or f_idx == total_frames - 1:
                elapsed = time.time() - start_render_time
                pct = round((f_idx + 1) / total_frames * 100.0, 1)
                frames_done = f_idx + 1
                fps_speed = (frames_done / elapsed) if elapsed > 0.05 else 0.0
                remaining_frames = total_frames - frames_done
                eta_sec = (remaining_frames / fps_speed) if fps_speed > 0 else 0.0

                if eta_sec >= 60:
                    eta_fmt = f"{int(eta_sec // 60)}m {int(eta_sec % 60):02d}s"
                else:
                    eta_fmt = f"{int(round(eta_sec))}s"

                profile_label = "⚡ Draft" if is_draft else "💎 Master"
                msg = f"[{profile_label}] Frame {frames_done}/{total_frames} ({pct}%) • ETA: {eta_fmt} ({fps_speed:.1f} fps)"

                RENDER_JOBS[job_id]["progress"] = pct
                RENDER_JOBS[job_id]["elapsed_seconds"] = round(elapsed, 1)
                RENDER_JOBS[job_id]["eta_seconds"] = round(eta_sec, 1)
                RENDER_JOBS[job_id]["eta_formatted"] = eta_fmt
                RENDER_JOBS[job_id]["fps_speed"] = round(fps_speed, 1)
                RENDER_JOBS[job_id]["message"] = msg

        proc.stdin.close()
        stderr_bytes = proc.stderr.read()
        proc.wait()

        for cinfo in caps.values():
            try:
                cinfo["cap"].release()
            except Exception:
                pass

        if proc.returncode != 0:
            raise RuntimeError(f"FFmpeg render failed: {stderr_bytes.decode('utf-8', errors='ignore')}")

        elapsed_total = round(time.time() - start_render_time, 1)

        # Mirror to EXPORTS_DIR if custom output path is outside it so web UI can access it
        export_mirror = EXPORTS_DIR / out_filename
        if out_path.resolve() != export_mirror.resolve() and out_path.exists():
            try:
                import shutil
                shutil.copy2(str(out_path), str(export_mirror))
            except Exception:
                pass

        RENDER_JOBS[job_id] = {
            "status": "completed",
            "progress": 100.0,
            "elapsed_seconds": elapsed_total,
            "eta_seconds": 0,
            "eta_formatted": "Complete",
            "message": f"[{'⚡ Draft' if is_draft else '💎 Master'}] Render complete in {elapsed_total}s!",
            "output_url": f"/workspace/exports/{out_filename}",
            "output_path": str(out_path),
            "filename": out_filename,
            "profile": profile_clean,
            "format": target_ext.lstrip("."),
        }
        return out_path

    except Exception as e:
        RENDER_JOBS[job_id] = {
            "status": "failed",
            "progress": 0.0,
            "message": f"Render error: {str(e)}",
            "output_url": None,
        }
        raise


def _sec_to_tc(sec: float, fps: int = 30) -> str:
    total_frames = int(round(sec * fps))
    ff = total_frames % fps
    total_sec = total_frames // fps
    ss = total_sec % 60
    mm = (total_sec // 60) % 60
    hh = total_sec // 3600
    return f"{hh:02d}:{mm:02d}:{ss:02d}:{ff:02d}"


def export_edl_and_xml(timeline: dict, audio_path: Path, fps: int = 30) -> dict:
    """Export CMX3600 EDL (.edl) and Premiere/DaVinci FCP7 XML (.xml) for NLE fine-tuning."""
    ts = int(time.time())
    edl_name = f"strangelet_timeline_{ts}.edl"
    xml_name = f"strangelet_timeline_{ts}.xml"
    edl_path = EXPORTS_DIR / edl_name
    xml_path = EXPORTS_DIR / xml_name

    events = timeline.get("events", [])
    edl_lines = [
        "TITLE: Strangelet Splicer Audio-Reactive Timeline",
        "FCM: NON-DROP FRAME",
        "",
    ]

    for i, ev in enumerate(events, start=1):
        src_in = _sec_to_tc(float(ev.get("in_point", 0.0)), fps)
        src_out = _sec_to_tc(float(ev.get("out_point", ev["duration"])), fps)
        rec_in = _sec_to_tc(float(ev["start"]), fps)
        rec_out = _sec_to_tc(float(ev["end"]), fps)
        reel = f"CLIP{i:04d}"[:8]
        edl_lines.append(f"{i:03d}  {reel:<8} V     C        {src_in} {src_out} {rec_in} {rec_out}")
        edl_lines.append(f"* FROM CLIP NAME: {ev['clip_filename']}")
        edl_lines.append(f"* COMMENT: Section={ev['section_label']} | Transition={ev.get('transition', 'hard_cut')} | Reason={ev.get('match_reason', '')}")
        edl_lines.append("")

    edl_path.write_text("\n".join(edl_lines), encoding="utf-8")

    xmeml = ET.Element("xmeml", version="4")
    seq = ET.SubElement(xmeml, "sequence")
    ET.SubElement(seq, "name").text = f"StrangeletSplicer_{timeline.get('template_id', 'edit')}"
    total_frames = int(round(float(timeline.get("total_duration", 60.0)) * fps))
    ET.SubElement(seq, "duration").text = str(total_frames)
    rate = ET.SubElement(seq, "rate")
    ET.SubElement(rate, "timebase").text = str(fps)
    ET.SubElement(rate, "ntsc").text = "FALSE"

    media = ET.SubElement(seq, "media")
    video = ET.SubElement(media, "video")
    vtrack = ET.SubElement(video, "track")

    for i, ev in enumerate(events, start=1):
        ci = ET.SubElement(vtrack, "clipitem", id=f"clipitem-{i}")
        ET.SubElement(ci, "name").text = ev["clip_filename"]
        r = ET.SubElement(ci, "rate")
        ET.SubElement(r, "timebase").text = str(fps)
        ET.SubElement(r, "ntsc").text = "FALSE"
        ET.SubElement(ci, "start").text = str(int(round(float(ev["start"]) * fps)))
        ET.SubElement(ci, "end").text = str(int(round(float(ev["end"]) * fps)))
        ET.SubElement(ci, "in").text = str(int(round(float(ev.get("in_point", 0.0)) * fps)))
        ET.SubElement(ci, "out").text = str(int(round(float(ev.get("out_point", ev["duration"])) * fps)))

        f_el = ET.SubElement(ci, "file", id=f"file-{ev['clip_id']}")
        ET.SubElement(f_el, "name").text = ev["clip_filename"]
        clip_abs = (CLIPS_DIR / ev["clip_filename"]).as_posix()
        ET.SubElement(f_el, "pathurl").text = f"file://localhost/{clip_abs}"

    audio_el = ET.SubElement(media, "audio")
    atrack = ET.SubElement(audio_el, "track")
    aci = ET.SubElement(atrack, "clipitem", id="audio-main")
    ET.SubElement(aci, "name").text = audio_path.name
    ET.SubElement(aci, "start").text = "0"
    ET.SubElement(aci, "end").text = str(total_frames)
    ET.SubElement(aci, "in").text = "0"
    ET.SubElement(aci, "out").text = str(total_frames)
    af_el = ET.SubElement(aci, "file", id="file-audio-main")
    ET.SubElement(af_el, "name").text = audio_path.name
    ET.SubElement(af_el, "pathurl").text = f"file://localhost/{audio_path.as_posix()}"

    tree = ET.ElementTree(xmeml)
    ET.indent(tree, space="  ")
    tree.write(xml_path, encoding="utf-8", xml_declaration=True)

    return {
        "edl_url": f"/workspace/exports/{edl_name}",
        "xml_url": f"/workspace/exports/{xml_name}",
        "edl_filename": edl_name,
        "xml_filename": xml_name,
    }
