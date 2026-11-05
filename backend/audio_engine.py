import subprocess
import numpy as np
from scipy import signal
from scipy.ndimage import gaussian_filter1d, maximum_filter1d
from pathlib import Path
from .config import get_ffmpeg_exe


def load_audio_pcm(audio_path: Path, sr: int = 22050) -> tuple[np.ndarray, int]:
    """Decode any audio/video file to mono float32 PCM via FFmpeg without touching C: drive."""
    ffmpeg = get_ffmpeg_exe()
    cmd = [
        ffmpeg,
        "-nostdin",
        "-v", "error",
        "-i", str(audio_path),
        "-f", "f32le",
        "-acodec", "pcm_f32le",
        "-ac", "1",
        "-ar", str(sr),
        "pipe:1",
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    y = np.frombuffer(proc.stdout, dtype=np.float32).copy()
    if len(y) == 0:
        raise ValueError(f"Decoded audio is empty for {audio_path}")
    max_val = np.max(np.abs(y))
    if max_val > 1e-6:
        y = y / max_val
    return y, sr


def bandpass_filter(y: np.ndarray, sr: int, low_hz: float, high_hz: float, order: int = 4) -> np.ndarray:
    nyq = 0.5 * sr
    low = max(low_hz / nyq, 0.001)
    high = min(high_hz / nyq, 0.995)
    if low >= high:
        return y
    sos = signal.butter(order, [low, high], btype="bandpass", output="sos")
    return signal.sosfiltfilt(sos, y)


def compute_onset_envelope(y: np.ndarray, sr: int, hop_length: int = 512) -> tuple[np.ndarray, np.ndarray]:
    """Compute log-power mel-like spectral flux onset strength envelope."""
    n_fft = 2048
    freqs, times, Zxx = signal.stft(y, fs=sr, window="hann", nperseg=n_fft, noverlap=n_fft - hop_length)
    mag = np.abs(Zxx)
    log_mag = np.log1p(10.0 * mag)
    diff = np.diff(log_mag, axis=1, prepend=log_mag[:, :1])
    flux = np.sum(np.maximum(0.0, diff), axis=0)
    flux = gaussian_filter1d(flux, sigma=1.2)
    p99 = np.percentile(flux, 99) if len(flux) > 0 else 1.0
    if p99 > 1e-8:
        flux = np.clip(flux / p99, 0.0, 1.5)
    return flux, times


def detect_peaks(env: np.ndarray, times: np.ndarray, threshold: float = 0.28, min_dist_sec: float = 0.10) -> list[dict]:
    if len(env) < 3:
        return []
    dt = float(times[1] - times[0]) if len(times) > 1 else 0.023
    min_samples = max(1, int(round(min_dist_sec / dt)))
    local_max = maximum_filter1d(env, size=min_samples * 2 + 1)
    mean_local = gaussian_filter1d(env, sigma=max(4, min_samples * 3))
    peaks = []
    last_idx = -min_samples * 2
    for i in range(1, len(env) - 1):
        if env[i] == local_max[i] and env[i] > threshold and (env[i] - mean_local[i]) > threshold * 0.45:
            if i - last_idx >= min_samples:
                peaks.append({
                    "time": round(float(times[i]), 4),
                    "strength": round(float(min(1.0, env[i])), 3),
                })
                last_idx = i
    return peaks


def estimate_tempo_and_beats(onset_env: np.ndarray, times: np.ndarray) -> tuple[float, list[float], list[float]]:
    """Dynamic-programming beat tracker & tempo estimator."""
    if len(onset_env) < 10:
        return 120.0, [0.0], [0.0]

    dt = float(times[1] - times[0])
    duration = float(times[-1])

    # Autocorrelation of onset envelope for BPM between 72 and 180
    env_zero = onset_env - np.mean(onset_env)
    ac = signal.correlate(env_zero, env_zero, mode="full")[len(env_zero) - 1:]
    min_lag = max(1, int(round((60.0 / 180.0) / dt)))
    max_lag = min(len(ac) - 1, int(round((60.0 / 72.0) / dt)))

    if max_lag > min_lag:
        lags = np.arange(min_lag, max_lag + 1)
        bpms = 60.0 / (lags * dt)
        # Perceptual prior centered around 124 BPM
        prior = np.exp(-0.5 * ((np.log2(bpms / 124.0)) / 0.45) ** 2)
        weighted_ac = ac[min_lag:max_lag + 1] * prior
        best_lag = lags[int(np.argmax(weighted_ac))]
        bpm = float(60.0 / (best_lag * dt))
    else:
        best_lag = int(round(0.5 / dt))
        bpm = 120.0

    # Normalize BPM into 80..165 range
    while bpm < 80.0:
        bpm *= 2.0
    while bpm > 165.0:
        bpm /= 2.0
    period_frames = int(round((60.0 / bpm) / dt))
    period_frames = max(4, period_frames)

    # Ellis (2007) dynamic programming beat tracking
    N = len(onset_env)
    cumscore = np.zeros(N, dtype=np.float64)
    backlink = np.full(N, -1, dtype=np.int32)
    alpha = 180.0  # rigidity of tempo grid
    search_min = max(2, int(round(period_frames * 0.55)))
    search_max = int(round(period_frames * 1.85))

    for i in range(N):
        best_prev_score = 0.0
        best_prev_idx = -1
        start_prev = max(0, i - search_max)
        end_prev = i - search_min
        if end_prev >= start_prev:
            prev_indices = np.arange(start_prev, end_prev + 1)
            intervals = i - prev_indices
            tx_cost = -alpha * (np.log(intervals / float(period_frames))) ** 2
            scores = cumscore[prev_indices] + tx_cost
            arg_best = int(np.argmax(scores))
            if scores[arg_best] > 0:
                best_prev_score = float(scores[arg_best])
                best_prev_idx = int(prev_indices[arg_best])
        cumscore[i] = onset_env[i] + best_prev_score
        backlink[i] = best_prev_idx

    # Backtrack from the highest scoring frame near the end
    tail_window = min(N, period_frames * 3)
    curr = int(N - tail_window + np.argmax(cumscore[N - tail_window:]))
    beat_frames = []
    while curr >= 0:
        beat_frames.append(curr)
        curr = int(backlink[curr])
    beat_frames.reverse()

    beats = [round(float(times[idx]), 4) for idx in beat_frames]
    if not beats:
        beat_sec = 60.0 / bpm
        beats = [round(t, 4) for t in np.arange(0.0, duration, beat_sec)]

    # Fill leading or trailing gaps if song starts with ambient intro/outro
    beat_sec = 60.0 / bpm
    while beats[0] - beat_sec >= 0.08:
        beats.insert(0, round(beats[0] - beat_sec, 4))
    while beats[-1] + beat_sec < duration - 0.05:
        beats.append(round(beats[-1] + beat_sec, 4))

    # Determine downbeat phase (0, 1, 2, or 3) that maximizes onset + bass accent
    best_phase = 0
    best_phase_score = -1.0
    for phase in range(4):
        phase_frames = [beat_frames[i] for i in range(phase, len(beat_frames), 4) if i < len(beat_frames)]
        if phase_frames:
            score = float(np.mean(onset_env[phase_frames]))
            if score > best_phase_score:
                best_phase_score = score
                best_phase = phase

    downbeats = [beats[i] for i in range(best_phase, len(beats), 4)]
    if downbeats and downbeats[0] > beat_sec * 1.5 and beats[0] not in downbeats:
        downbeats.insert(0, beats[0])

    return round(bpm, 1), beats, downbeats


def segment_song_structure(
    duration: float,
    downbeats: list[float],
    rms_60hz: np.ndarray,
    bass_60hz: np.ndarray,
    snare_60hz: np.ndarray,
    fps_env: int = 60,
) -> list[dict]:
    """Automatically segment track into musical sections (intro, verse, build, drop, chorus, outro)."""
    if len(downbeats) < 4:
        return [{
            "id": "sec_0",
            "type": "chorus",
            "label": "Main Section",
            "start": 0.0,
            "end": round(duration, 3),
            "energy": 0.7,
            "prompt": "",
        }]

    # Group bars into 4-bar phrases (or 2-bar for short tracks)
    bars_per_phrase = 4 if len(downbeats) >= 16 else 2
    phrase_starts = [0.0]
    for i in range(bars_per_phrase, len(downbeats), bars_per_phrase):
        if duration - downbeats[i] >= 3.0:
            phrase_starts.append(downbeats[i])
    phrase_ends = phrase_starts[1:] + [round(duration, 3)]

    phrase_stats = []
    for s, e in zip(phrase_starts, phrase_ends):
        i0 = max(0, int(s * fps_env))
        i1 = min(len(rms_60hz), max(i0 + 1, int(e * fps_env)))
        seg_rms = float(np.mean(rms_60hz[i0:i1])) if i1 > i0 else 0.3
        seg_bass = float(np.mean(bass_60hz[i0:i1])) if i1 > i0 else 0.3
        seg_snare = float(np.mean(snare_60hz[i0:i1])) if i1 > i0 else 0.3
        # Check slope inside phrase (for build-up detection)
        mid = (i0 + i1) // 2
        slope = 0.0
        if mid > i0 and i1 > mid:
            slope = float(np.mean(rms_60hz[mid:i1]) - np.mean(rms_60hz[i0:mid]))
        composite = 0.45 * seg_rms + 0.35 * seg_bass + 0.20 * seg_snare
        phrase_stats.append({
            "start": round(s, 3),
            "end": round(e, 3),
            "rms": seg_rms,
            "bass": seg_bass,
            "snare": seg_snare,
            "slope": slope,
            "energy": composite,
        })

    energies = np.array([p["energy"] for p in phrase_stats])
    e_min = float(np.min(energies)) if len(energies) else 0.0
    e_max = float(np.max(energies)) if len(energies) else 1.0
    e_span = max(0.05, e_max - e_min)

    sections = []
    n_phrases = len(phrase_stats)
    for idx, p in enumerate(phrase_stats):
        norm_e = float(np.clip((p["energy"] - e_min) / e_span, 0.05, 1.0))
        next_norm_e = (
            float(np.clip((phrase_stats[idx + 1]["energy"] - e_min) / e_span, 0.05, 1.0))
            if idx + 1 < n_phrases
            else norm_e
        )

        if idx == 0 and norm_e < 0.62 and n_phrases > 2:
            sec_type = "intro"
            label = "Intro"
        elif idx == n_phrases - 1 and norm_e < 0.58 and n_phrases > 2:
            sec_type = "outro"
            label = "Outro"
        elif (p["slope"] > 0.06 or (next_norm_e - norm_e > 0.24)) and next_norm_e >= 0.72:
            sec_type = "build"
            label = "Build-Up"
        elif norm_e >= 0.78 and p["bass"] >= np.percentile([x["bass"] for x in phrase_stats], 65):
            sec_type = "drop"
            label = "Drop / Climax"
        elif norm_e >= 0.62:
            sec_type = "chorus"
            label = "Chorus"
        else:
            sec_type = "verse"
            label = "Verse"

        # Merge adjacent identical section types if they are both verse or both chorus and short
        if (
            sections
            and sections[-1]["type"] == sec_type
            and sec_type in ("verse", "chorus", "drop")
            and (p["end"] - sections[-1]["start"]) <= 28.0
        ):
            prev = sections[-1]
            prev["end"] = p["end"]
            prev["energy"] = round(float(0.5 * (prev["energy"] + norm_e)), 3)
        else:
            sections.append({
                "id": f"sec_{len(sections)}",
                "type": sec_type,
                "label": f"{label} {sum(1 for s in sections if s['type'] == sec_type) + 1}",
                "start": p["start"],
                "end": p["end"],
                "energy": round(norm_e, 3),
                "prompt": "",
            })

    return sections


def analyze_audio_file(audio_path: Path) -> dict:
    """Full audio intelligence pipeline: stems, beats, downbeats, transients, 60fps envelopes, and sections."""
    y, sr = load_audio_pcm(audio_path, sr=22050)
    duration = float(len(y) / sr)

    # 1. Frequency stem separation (Kick/Sub-bass, Mid/Snare, High/Hat)
    y_bass = bandpass_filter(y, sr, 20.0, 145.0)
    y_mid = bandpass_filter(y, sr, 180.0, 4200.0)
    y_high = bandpass_filter(y, sr, 4200.0, 10000.0)

    # 2. Onset envelopes & transients
    onset_full, times_onset = compute_onset_envelope(y, sr, hop_length=512)
    onset_bass, _ = compute_onset_envelope(y_bass, sr, hop_length=512)
    onset_mid, _ = compute_onset_envelope(y_mid, sr, hop_length=512)

    kick_peaks = detect_peaks(onset_bass, times_onset, threshold=0.30, min_dist_sec=0.14)
    snare_peaks = detect_peaks(onset_mid, times_onset, threshold=0.32, min_dist_sec=0.12)
    transients = detect_peaks(onset_full, times_onset, threshold=0.26, min_dist_sec=0.10)

    # 3. Tempo, Beats, Downbeats (Bars)
    bpm, beats, downbeats = estimate_tempo_and_beats(onset_full, times_onset)

    # 4. 60 FPS continuous reactive envelopes for WebGL/Canvas preview & FFmpeg FX
    fps_env = 60
    n_env = max(1, int(np.ceil(duration * fps_env)))
    samples_per_frame = max(1, int(sr / fps_env))

    def frame_rms_curve(sig: np.ndarray, smooth_sigma: float = 1.2) -> np.ndarray:
        pad_len = n_env * samples_per_frame
        if len(sig) < pad_len:
            sig_p = np.pad(sig, (0, pad_len - len(sig)))
        else:
            sig_p = sig[:pad_len]
        frames = sig_p.reshape(n_env, samples_per_frame)
        rms = np.sqrt(np.mean(frames ** 2, axis=1))
        if smooth_sigma > 0:
            rms = gaussian_filter1d(rms, sigma=smooth_sigma)
        p98 = float(np.percentile(rms, 98)) if len(rms) else 1.0
        if p98 > 1e-8:
            rms = np.clip(rms / p98, 0.0, 1.0)
        return np.round(rms, 3)

    rms_60hz = frame_rms_curve(y, smooth_sigma=1.2)
    bass_60hz = frame_rms_curve(y_bass, smooth_sigma=1.0)
    snare_60hz = frame_rms_curve(y_mid, smooth_sigma=0.7)
    high_60hz = frame_rms_curve(y_high, smooth_sigma=0.8)

    # 5. Waveform peaks for UI display (1200 bins)
    n_wave = min(1400, max(200, int(duration * 12)))
    chunk = max(1, len(y) // n_wave)
    trimmed = np.abs(y[:n_wave * chunk]).reshape(n_wave, chunk)
    waveform_peaks = np.round(np.max(trimmed, axis=1), 3).tolist()

    # 6. Automatic structural segmentation
    sections = segment_song_structure(duration, downbeats, rms_60hz, bass_60hz, snare_60hz, fps_env=fps_env)

    return {
        "filename": audio_path.name,
        "duration": round(duration, 3),
        "bpm": bpm,
        "beats": beats,
        "downbeats": downbeats,
        "transients": [t["time"] for t in transients],
        "kick_transients": [t["time"] for t in kick_peaks],
        "snare_transients": [t["time"] for t in snare_peaks],
        "sections": sections,
        "waveform_peaks": waveform_peaks,
        "envelopes_60hz": {
            "fps": fps_env,
            "rms": rms_60hz.tolist(),
            "bass": bass_60hz.tolist(),
            "snare": snare_60hz.tolist(),
            "high": high_60hz.tolist(),
        },
    }
