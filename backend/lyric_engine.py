import re
from pathlib import Path

LRC_TIME_PATTERN = re.compile(r"\[(\d{1,3}):(\d{2})(?:[\.:](\d{1,3}))?\]")
LRC_OFFSET_PATTERN = re.compile(r"\[\s*offset\s*:\s*([+-]?\d+)\s*\]", re.IGNORECASE)
SRT_TIMECODE_PATTERN = re.compile(
    r"(?:(\d{1,2}):)?(\d{2}):(\d{2})[,\.](\d{1,3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[,\.](\d{1,3})"
)
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")


def _fraction_to_seconds(frac_str: str | None) -> float:
    if not frac_str:
        return 0.0
    digits = frac_str.strip()
    if len(digits) == 1:
        return int(digits) / 10.0
    if len(digits) == 2:
        return int(digits) / 100.0
    return int(digits[:3]) / 1000.0


def parse_lrc_content(raw_text: str, total_duration: float = 300.0) -> list[dict]:
    """
    Robust LRC parser:
    - Extracts [mm:ss.xx] or [mm:ss.xxx] timestamps (supports multiple timestamps per line).
    - Respects optional [offset:+/-ms] header tag.
    - Sets each line's duration up to the next timestamp (empty timestamped lines act as end-markers).
    """
    text = (raw_text or "").lstrip("\ufeff")
    lines = text.splitlines()

    header_offset_sec = 0.0
    for line in lines:
        m_off = LRC_OFFSET_PATTERN.search(line)
        if m_off:
            try:
                header_offset_sec = int(m_off.group(1)) / 1000.0
            except ValueError:
                pass

    raw_events: list[tuple[float, str]] = []
    for line in lines:
        matches = list(LRC_TIME_PATTERN.finditer(line))
        if not matches:
            continue
        # Strip all timestamp tags and inline word tags <mm:ss.xx> to get clean lyric text
        lyric_body = LRC_TIME_PATTERN.sub("", line)
        lyric_body = re.sub(r"<\d{1,3}:\d{2}(?:[\.:]\d{1,3})?>", "", lyric_body)
        lyric_body = HTML_TAG_PATTERN.sub("", lyric_body).strip()

        for m in matches:
            mins = int(m.group(1))
            secs = int(m.group(2))
            frac = _fraction_to_seconds(m.group(3))
            t_sec = max(0.0, mins * 60.0 + secs + frac + header_offset_sec)
            raw_events.append((t_sec, lyric_body))

    if not raw_events:
        return []

    raw_events.sort(key=lambda x: x[0])

    cues: list[dict] = []
    n = len(raw_events)
    for i, (start_t, txt) in enumerate(raw_events):
        # Empty lyric lines in LRC act as a cutoff timestamp for the previous line
        if not txt:
            continue
        if i + 1 < n:
            end_t = raw_events[i + 1][0]
            if end_t <= start_t + 0.05:
                end_t = start_t + 2.5
        else:
            fallback_end = start_t + 4.5
            if total_duration and total_duration > start_t + 0.5:
                end_t = min(float(total_duration), fallback_end)
            else:
                end_t = fallback_end

        dur = max(0.10, end_t - start_t)
        cues.append({
            "index": len(cues),
            "start": round(float(start_t), 3),
            "end": round(float(start_t + dur), 3),
            "duration": round(float(dur), 3),
            "text": txt,
        })

    return cues


def _srt_parts_to_sec(h_str: str | None, m_str: str, s_str: str, ms_str: str) -> float:
    h = int(h_str) if h_str else 0
    m = int(m_str)
    s = int(s_str)
    ms = _fraction_to_seconds(ms_str)
    return max(0.0, h * 3600.0 + m * 60.0 + s + ms)


def parse_srt_content(raw_text: str) -> list[dict]:
    """
    Robust SRT parser:
    - Extracts explicit start and end timecodes (HH:MM:SS,mmm --> HH:MM:SS,mmm) and text blocks.
    """
    text = (raw_text or "").lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    blocks = re.split(r"\n\s*\n", text.strip())
    cues: list[dict] = []

    for block in blocks:
        b_lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
        if not b_lines:
            continue

        tc_line_idx = -1
        tc_match = None
        for idx, ln in enumerate(b_lines):
            m = SRT_TIMECODE_PATTERN.search(ln)
            if m:
                tc_line_idx = idx
                tc_match = m
                break

        if tc_match is None:
            continue

        start_t = _srt_parts_to_sec(
            tc_match.group(1), tc_match.group(2), tc_match.group(3), tc_match.group(4)
        )
        end_t = _srt_parts_to_sec(
            tc_match.group(5), tc_match.group(6), tc_match.group(7), tc_match.group(8)
        )
        if end_t <= start_t + 0.04:
            end_t = start_t + 2.0

        text_lines = []
        for raw_ln in b_lines[tc_line_idx + 1:]:
            cleaned = HTML_TAG_PATTERN.sub("", raw_ln).strip()
            if cleaned:
                text_lines.append(cleaned)

        lyric_text = " / ".join(text_lines).strip()
        if not lyric_text:
            continue

        dur = max(0.05, end_t - start_t)
        cues.append({
            "index": len(cues),
            "start": round(float(start_t), 3),
            "end": round(float(end_t), 3),
            "duration": round(float(dur), 3),
            "text": lyric_text,
        })

    cues.sort(key=lambda c: c["start"])
    for idx, c in enumerate(cues):
        c["index"] = idx
    return cues


def parse_lyrics_file(
    filename: str,
    raw_text: str,
    total_duration: float = 300.0,
    global_offset: float = 0.0,
    include_in_render: bool = True,
) -> dict:
    ext = Path(filename or "lyrics.lrc").suffix.lower()
    if ext == ".srt" or ("-->" in (raw_text or "") and not LRC_TIME_PATTERN.search(raw_text or "")):
        fmt = "srt"
        cues = parse_srt_content(raw_text)
    else:
        fmt = "lrc"
        cues = parse_lrc_content(raw_text, total_duration=total_duration)
        if not cues and "-->" in (raw_text or ""):
            fmt = "srt"
            cues = parse_srt_content(raw_text)

    clamped_offset = round(max(-5.0, min(5.0, float(global_offset or 0.0))), 3)
    return {
        "filename": filename,
        "format": fmt,
        "global_offset": clamped_offset,
        "include_in_render": bool(include_in_render),
        "cue_count": len(cues),
        "cues": cues,
    }


def get_active_lyric_cue(
    lyrics_state: dict | None,
    current_time: float,
    respect_render_flag: bool = False,
) -> dict | None:
    if not lyrics_state or not isinstance(lyrics_state, dict):
        return None
    if respect_render_flag and not lyrics_state.get("include_in_render", True):
        return None
    cues = lyrics_state.get("cues") or []
    if not cues:
        return None


    offset = float(lyrics_state.get("global_offset", 0.0) or 0.0)
    t = float(current_time)

    for cue in cues:
        eff_start = float(cue["start"]) + offset
        eff_end = float(cue["end"]) + offset
        if eff_start <= t < eff_end:
            dur = max(0.05, eff_end - eff_start)
            return {
                "index": cue.get("index", 0),
                "text": cue.get("text", ""),
                "start": eff_start,
                "end": eff_end,
                "duration": dur,
                "progress": min(1.0, max(0.0, (t - eff_start) / dur)),
            }
    return None


def generate_demo_lyrics(total_duration: float = 24.0) -> dict:
    demo_lrc = """[ti:Strangelet Splicer Synth Demo]
[ar:Strangelet Splicer]
[00:00.50]Signal locked inside the splicing machine
[00:04.00]Chasing neon ghosts across the silver screen
[00:08.00]Voltage rising as the transients align
[00:12.00]Cut the frame and bend the timeline
[00:16.00]Every kick drum fractures through the night
[00:20.00]Strangelet echoes fading into light
[00:23.50]
"""
    return parse_lyrics_file(
        filename="strangelet_demo_lyrics.lrc",
        raw_text=demo_lrc,
        total_duration=total_duration,
        global_offset=0.0,
        include_in_render=True,
    )
