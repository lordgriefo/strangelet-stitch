import math
import subprocess
import numpy as np
import soundfile as sf
import cv2
from PIL import Image, ImageDraw
from pathlib import Path
from .config import AUDIO_DIR, CLIPS_DIR, get_ffmpeg_exe


def create_synth_demo_track(out_wav: Path, duration: float = 24.0, sr: int = 22050, bpm: float = 128.0) -> Path:
    """Synthesize a punchy 24s electronic track with clear Intro -> Verse -> Build -> Drop -> Outro structure."""
    if out_wav.exists():
        return out_wav

    n_samples = int(duration * sr)
    t = np.linspace(0.0, duration, n_samples, endpoint=False)
    beat_sec = 60.0 / bpm
    y = np.zeros(n_samples, dtype=np.float32)

    pad = (
        0.16 * np.sin(2 * np.pi * 110.0 * t)
        + 0.12 * np.sin(2 * np.pi * 164.81 * t)
        + 0.10 * np.sin(2 * np.pi * 220.0 * t)
    )
    pad_env = np.ones_like(t) * 0.45
    pad_env[t < 4.5] = 0.75
    pad_env[t >= 20.25] = np.linspace(0.7, 0.05, np.sum(t >= 20.25))
    y += pad * pad_env

    beat_times = np.arange(0.0, duration, beat_sec)
    rng = np.random.default_rng(42)

    for b_idx, bt in enumerate(beat_times):
        s0 = int(bt * sr)
        if s0 >= n_samples:
            break

        if (4.5 <= bt < 9.0) or (13.5 <= bt < 20.25):
            k_len = min(int(0.28 * sr), n_samples - s0)
            kt = np.linspace(0.0, k_len / sr, k_len, endpoint=False)
            freq_sweep = 135.0 * np.exp(-kt * 26.0) + 46.0
            phase = 2 * np.pi * np.cumsum(freq_sweep) / sr
            amp = 0.85 if bt >= 13.5 else 0.55
            kick = amp * np.sin(phase) * np.exp(-kt * 9.5)
            y[s0:s0 + k_len] += kick

            if bt >= 13.5:
                sub_len = min(int(beat_sec * 0.88 * sr), n_samples - s0)
                st = np.linspace(0.0, sub_len / sr, sub_len, endpoint=False)
                bass_note = 55.0 if (b_idx // 4) % 2 == 0 else 65.41
                sub = 0.52 * np.tanh(2.2 * np.sin(2 * np.pi * bass_note * st)) * np.exp(-st * 2.5)
                y[s0:s0 + sub_len] += sub

        if b_idx % 2 == 1 and ((4.5 <= bt < 9.0) or (13.5 <= bt < 20.25)):
            sn_len = min(int(0.18 * sr), n_samples - s0)
            snt = np.linspace(0.0, sn_len / sr, sn_len, endpoint=False)
            noise = rng.normal(0, 1, sn_len).astype(np.float32)
            body = np.sin(2 * np.pi * 210.0 * snt) * np.exp(-snt * 22.0)
            sn_amp = 0.72 if bt >= 13.5 else 0.42
            snare = sn_amp * (0.75 * noise * np.exp(-snt * 18.0) + 0.45 * body)
            y[s0:s0 + sn_len] += snare

    build_t = 9.0
    while build_t < 13.45:
        prog = (build_t - 9.0) / 4.5
        step_sec = beat_sec * (0.5 if prog < 0.45 else (0.25 if prog < 0.78 else 0.125))
        s0 = int(build_t * sr)
        sn_len = min(int(0.10 * sr), n_samples - s0)
        if sn_len > 0:
            snt = np.linspace(0.0, sn_len / sr, sn_len, endpoint=False)
            noise = rng.normal(0, 1, sn_len).astype(np.float32)
            tone = np.sin(2 * np.pi * (240.0 + 380.0 * prog) * snt)
            hit = (0.30 + 0.55 * prog) * (0.65 * noise + 0.35 * tone) * np.exp(-snt * 24.0)
            y[s0:s0 + sn_len] += hit
        build_t += step_sec

    max_v = np.max(np.abs(y))
    if max_v > 1e-5:
        y = (y / max_v) * 0.92

    sf.write(str(out_wav), y, sr)
    return out_wav


def create_demo_clips() -> list[Path]:
    """Generate 6 stylized procedural MP4 video clips + 2 high-res static images for Ken Burns testing."""
    presets = [
        {
            "name": "demo_01_neon_cyber_tunnel.mp4",
            "color1": (255, 40, 190),
            "color2": (30, 220, 255),
            "speed": 4.2,
            "mode": "tunnel",
            "duration": 4.0,
        },
        {
            "name": "demo_02_calm_midnight_horizon.mp4",
            "color1": (35, 25, 75),
            "color2": (90, 140, 220),
            "speed": 0.6,
            "mode": "waves",
            "duration": 4.5,
        },
        {
            "name": "demo_03_solar_fire_storm.mp4",
            "color1": (20, 95, 255),
            "color2": (40, 220, 255),
            "speed": 5.0,
            "mode": "particles",
            "duration": 3.8,
        },
        {
            "name": "demo_04_kinetic_matrix_pulse.mp4",
            "color1": (30, 240, 120),
            "color2": (10, 45, 30),
            "speed": 2.4,
            "mode": "bars",
            "duration": 4.0,
        },
        {
            "name": "demo_05_golden_sunset_drift.mp4",
            "color1": (30, 70, 190),
            "color2": (90, 180, 255),
            "speed": 0.9,
            "mode": "orbs",
            "duration": 4.5,
        },
        {
            "name": "demo_06_strobe_hyper_drop.mp4",
            "color1": (245, 60, 90),
            "color2": (250, 245, 255),
            "speed": 6.5,
            "mode": "burst",
            "duration": 3.5,
        },
    ]

    ffmpeg = get_ffmpeg_exe()
    w, h, fps = 640, 360, 30
    created = []

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w * 0.5, h * 0.5
    rad = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    ang = np.arctan2(yy - cy, xx - cx)

    for p in presets:
        out_p = CLIPS_DIR / p["name"]
        if out_p.exists():
            created.append(out_p)
            continue

        cmd = [
            ffmpeg, "-y", "-nostdin", "-v", "error",
            "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps),
            "-i", "-",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "22", "-pix_fmt", "yuv420p",
            str(out_p),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        n_frames = int(p["duration"] * fps)
        c1 = np.array(p["color1"], dtype=np.float32)
        c2 = np.array(p["color2"], dtype=np.float32)
        spd = p["speed"]
        mode = p["mode"]

        for fi in range(n_frames):
            t = fi / float(fps)
            if mode == "tunnel":
                val = 0.5 + 0.5 * np.sin(rad * 0.06 - t * spd * 3.5 + np.sin(ang * 4.0))
            elif mode == "waves":
                val = 0.5 + 0.5 * np.sin(yy * 0.025 + np.sin(xx * 0.015 + t * spd * 2.0))
            elif mode == "particles":
                val = 0.5 + 0.5 * np.sin((xx * 0.04 + t * spd * 4.0)) * np.cos((yy * 0.04 - t * spd * 3.2))
            elif mode == "bars":
                val = 0.5 + 0.5 * np.sin(xx * 0.05 - t * spd * 4.0 + np.cos(yy * 0.02))
            elif mode == "orbs":
                ox = cx + math.sin(t * spd * 2.0) * 120.0
                oy = cy + math.cos(t * spd * 1.5) * 60.0
                d2 = np.sqrt((xx - ox) ** 2 + (yy - oy) ** 2)
                val = np.clip(1.0 - d2 / 240.0, 0.0, 1.0)
            else:
                strobe = 0.5 + 0.5 * math.sin(t * spd * 6.5)
                val = np.clip(np.sin(rad * 0.08 - t * spd * 5.0) * strobe, 0.0, 1.0)

            frame = (val[..., None] * c1 + (1.0 - val[..., None]) * c2).astype(np.uint8)
            proc.stdin.write(frame.tobytes())

        proc.stdin.close()
        proc.wait()
        created.append(out_p)

    # Create 2 high-res static images (.png) to showcase Ken Burns Still Image Motion
    still_1 = CLIPS_DIR / "demo_07_strangelet_nebula_still.png"
    if not still_1.exists():
        sw, sh = 1280, 720
        syy, sxx = np.mgrid[0:sh, 0:sw].astype(np.float32)
        srad = np.sqrt((sxx - sw * 0.5) ** 2 + (syy - sh * 0.5) ** 2)
        sang = np.arctan2(syy - sh * 0.5, sxx - sw * 0.5)
        n1 = 0.5 + 0.5 * np.sin(srad * 0.025 + np.cos(sang * 5.0) * 2.5)
        n2 = 0.5 + 0.5 * np.cos(sxx * 0.012 - syy * 0.015)
        r = np.clip(n1 * 210 + 35, 0, 255)
        g = np.clip(n2 * 150 + 20, 0, 255)
        b = np.clip((1.0 - n1 * 0.5) * 245, 0, 255)
        rgb = np.stack([r, g, b], axis=-1).astype(np.uint8)
        Image.fromarray(rgb).save(still_1, "PNG")
    created.append(still_1)

    still_2 = CLIPS_DIR / "demo_08_cyber_citadel_still.png"
    if not still_2.exists():
        sw, sh = 1280, 720
        im = Image.new("RGB", (sw, sh), (12, 16, 28))
        draw = ImageDraw.Draw(im)
        # Horizon grid & neon towers
        for x in range(0, sw, 40):
            draw.line([(x, sh // 2), (int((x - sw / 2) * 2.4 + sw / 2), sh)], fill=(0, 210, 255), width=2)
        for y_line in range(sh // 2, sh, 28):
            draw.line([(0, y_line), (sw, y_line)], fill=(230, 45, 165), width=2)
        for tx in range(120, sw - 120, 95):
            th = 110 + ((tx * 37) % 190)
            draw.rectangle([tx, sh // 2 - th, tx + 52, sh // 2], fill=(22, 28, 48), outline=(56, 189, 248), width=2)
        im.save(still_2, "PNG")
    created.append(still_2)

    return created
