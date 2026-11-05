import json
import re
import numpy as np
from pathlib import Path
from .config import WORKSPACE_DIR
from .ai_analyzer import KEN_BURNS_PRESETS, extract_sequence_order

PRESETS_FILE = WORKSPACE_DIR / "presets.json"

BURROUGHS_PHRASES = [
    "LANGUAGE IS A VIRUS",
    "WORD FALLING - PHOTO FALLING",
    "STORMING THE REALITY STUDIO",
    "NOTHING IS TRUE, EVERYTHING IS PERMITTED",
    "THE TICKET THAT EXPLODED",
    "RUB OUT THE WORD",
]

DEFAULT_PRESET_BANK = {
    # ── Core & Commercial Styles (8 Presets incl. Manual Workbench) ──
    "manual_workbench_slate": {
        "id": "manual_workbench_slate",
        "category": "core",
        "name": "🛠️ Manual Workbench (Empty Slate)",
        "description": "Loads the audio waveform, BPM beat/bar grid, and transient markers without auto-cuts (preserving any Pinned blocks) for total hands-on drag-and-drop assembly, edge trimming, and playhead splitting.",
        "min_cut_floor": 0.25,
        "max_cut_ceiling": 8.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.0,
        "fx_intensity": 0.50,
        "transition_mode": "hard_cut",
        "sorting_logic": "manual_empty_slate",
        "motion_behavior": "natural_ken_burns",
        "style_fx": "clean",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "subliminal_sigil_flash": False,
        "obsidian_scrying_vignette": False,
        "thelemic_dye_bloom": False,
        "cosmic_static_glitch": False,
        "geometric_echo_tunnel": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.10, 0.50], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.20, "shake": 0.10, "rgb_split": 0.15, "speed_ramp": False}},
            "verse": {"cut_mode": "2_bars", "target_energy": [0.20, 0.65], "transition": "hard_cut", "fx": {"bass_zoom": 0.30, "snare_flash": 0.25, "shake": 0.15, "rgb_split": 0.20, "speed_ramp": False}},
            "build": {"cut_mode": "1_bar", "target_energy": [0.35, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.35, "shake": 0.25, "rgb_split": 0.30, "speed_ramp": False}},
            "drop": {"cut_mode": "1_bar", "target_energy": [0.50, 1.00], "transition": "hard_cut", "fx": {"bass_zoom": 0.65, "snare_flash": 0.50, "shake": 0.35, "rgb_split": 0.40, "speed_ramp": False}},
            "chorus": {"cut_mode": "1_bar", "target_energy": [0.40, 0.90], "transition": "hard_cut", "fx": {"bass_zoom": 0.50, "snare_flash": 0.40, "shake": 0.25, "rgb_split": 0.30, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.15, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
        },
    },
    "narrative_storyboard": {
        "id": "narrative_storyboard",
        "category": "core",
        "name": "🎬 Narrative Storyboard",
        "description": "01/02 chronological spine, 4.0s+ holds, full clip duration preservation, and clean frame-accurate cuts.",
        "min_cut_floor": 4.0,
        "max_cut_ceiling": 8.0,
        "preserve_full_duration": True,
        "story_vs_chop": 0.0,
        "fx_intensity": 0.35,
        "transition_mode": "hard_cut",
        "sorting_logic": "story_spine",
        "motion_behavior": "gentle_ken_burns",
        "style_fx": "clean",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.50], "transition": "hard_cut", "fx": {"bass_zoom": 0.15, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "verse": {"cut_mode": "2_bars", "target_energy": [0.15, 0.65], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "build": {"cut_mode": "1_bar", "target_energy": [0.35, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "drop": {"cut_mode": "1_bar", "target_energy": [0.50, 1.00], "transition": "hard_cut", "fx": {"bass_zoom": 0.35, "snare_flash": 0.0, "shake": 0.05, "rgb_split": 0.0, "speed_ramp": False}},
            "chorus": {"cut_mode": "1_bar", "target_energy": [0.40, 0.90], "transition": "hard_cut", "fx": {"bass_zoom": 0.30, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.10, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
        },
    },
    "lofi_vhs_tape": {
        "id": "lofi_vhs_tape",
        "category": "core",
        "name": "📼 Lo-Fi VHS Tape Deck",
        "description": "2.0s–4.0s cuts, subtle CRT scanlines, tape tracking flicker on snares, and slow nostalgic Ken Burns drift.",
        "min_cut_floor": 2.0,
        "max_cut_ceiling": 4.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.30,
        "fx_intensity": 0.85,
        "transition_mode": "hard_cut",
        "sorting_logic": "vibe_warm",
        "motion_behavior": "slow_drift",
        "style_fx": "vhs_tape",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "energy_arc", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.35, "shake": 0.15, "rgb_split": 0.40, "speed_ramp": False}},
            "verse": {"cut_mode": "energy_arc", "target_energy": [0.20, 0.55], "transition": "hard_cut", "fx": {"bass_zoom": 0.30, "snare_flash": 0.45, "shake": 0.20, "rgb_split": 0.45, "speed_ramp": False}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.35, 0.75], "transition": "hard_cut", "fx": {"bass_zoom": 0.40, "snare_flash": 0.60, "shake": 0.30, "rgb_split": 0.55, "speed_ramp": False}},
            "drop": {"cut_mode": "energy_arc", "target_energy": [0.50, 0.90], "transition": "quick_glitch", "fx": {"bass_zoom": 0.55, "snare_flash": 0.75, "shake": 0.40, "rgb_split": 0.65, "speed_ramp": False}},
            "chorus": {"cut_mode": "energy_arc", "target_energy": [0.40, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.55, "shake": 0.25, "rgb_split": 0.50, "speed_ramp": False}},
            "outro": {"cut_mode": "energy_arc", "target_energy": [0.05, 0.40], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.25, "shake": 0.10, "rgb_split": 0.35, "speed_ramp": False}},
        },
    },
    "cyber_glitch_hyperchop": {
        "id": "cyber_glitch_hyperchop",
        "category": "core",
        "name": "⚡ Cyber Glitch / Hyper-Chop",
        "description": "0.20s–0.45s rapid transient slicing, aggressive RGB channel tear, horizontal slice displacement, and strobe flash.",
        "min_cut_floor": 0.20,
        "max_cut_ceiling": 0.45,
        "preserve_full_duration": False,
        "story_vs_chop": 1.0,
        "fx_intensity": 1.35,
        "transition_mode": "quick_glitch",
        "sorting_logic": "high_energy",
        "motion_behavior": "hyper_kinetic",
        "style_fx": "cyber_glitch",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "transients_or_beat", "target_energy": [0.40, 0.80], "transition": "quick_glitch", "fx": {"bass_zoom": 0.75, "snare_flash": 0.70, "shake": 0.55, "rgb_split": 0.80, "speed_ramp": True}},
            "verse": {"cut_mode": "transients_or_beat", "target_energy": [0.55, 0.90], "transition": "quick_glitch", "fx": {"bass_zoom": 0.85, "snare_flash": 0.80, "shake": 0.65, "rgb_split": 0.85, "speed_ramp": True}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.65, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 1.00, "snare_flash": 0.95, "shake": 0.85, "rgb_split": 0.95, "speed_ramp": True}},
            "drop": {"cut_mode": "energy_arc", "target_energy": [0.80, 1.00], "transition": "quick_glitch", "fx": {"bass_zoom": 1.20, "snare_flash": 1.00, "shake": 1.00, "rgb_split": 1.00, "speed_ramp": True}},
            "chorus": {"cut_mode": "energy_arc", "target_energy": [0.70, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 1.00, "snare_flash": 0.90, "shake": 0.80, "rgb_split": 0.90, "speed_ramp": True}},
            "outro": {"cut_mode": "transients_or_beat", "target_energy": [0.35, 0.75], "transition": "quick_glitch", "fx": {"bass_zoom": 0.60, "snare_flash": 0.50, "shake": 0.40, "rgb_split": 0.65, "speed_ramp": True}},
        },
    },
    "scene_cluster_montage": {
        "id": "scene_cluster_montage",
        "category": "core",
        "name": "🧩 Scene Cluster Montage",
        "description": "Anchors 01_video clips while firing rapid 01_a / 01_b still-image stabs on hi-hat and snare fills.",
        "min_cut_floor": 0.22,
        "max_cut_ceiling": 3.5,
        "preserve_full_duration": True,
        "story_vs_chop": 0.65,
        "fx_intensity": 1.05,
        "transition_mode": "auto_intensity",
        "sorting_logic": "scene_cluster",
        "motion_behavior": "cluster_anchor_plus_stabs",
        "style_fx": "cluster_stab",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "1_bar", "target_energy": [0.15, 0.55], "transition": "hard_cut", "fx": {"bass_zoom": 0.35, "snare_flash": 0.25, "shake": 0.10, "rgb_split": 0.20, "speed_ramp": False}},
            "verse": {"cut_mode": "2_beats", "target_energy": [0.25, 0.68], "transition": "hard_cut", "fx": {"bass_zoom": 0.50, "snare_flash": 0.40, "shake": 0.20, "rgb_split": 0.30, "speed_ramp": False}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.45, 0.92], "transition": "flash_white", "fx": {"bass_zoom": 0.80, "snare_flash": 0.75, "shake": 0.55, "rgb_split": 0.65, "speed_ramp": True}},
            "drop": {"cut_mode": "energy_arc", "target_energy": [0.70, 1.00], "transition": "quick_glitch", "fx": {"bass_zoom": 1.00, "snare_flash": 0.90, "shake": 0.80, "rgb_split": 0.85, "speed_ramp": True}},
            "chorus": {"cut_mode": "1_beat", "target_energy": [0.55, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.80, "snare_flash": 0.65, "shake": 0.50, "rgb_split": 0.55, "speed_ramp": True}},
            "outro": {"cut_mode": "1_bar", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.10, "shake": 0.0, "rgb_split": 0.10, "speed_ramp": False}},
        },
    },
    "analog_16mm_film": {
        "id": "analog_16mm_film",
        "category": "core",
        "name": "🎞️ Analog 16mm Film Reel",
        "description": "3.0s–5.0s phrase-locked cuts, animated 16mm film grain overlay, warm halation glow, and subtle gate weave.",
        "min_cut_floor": 3.0,
        "max_cut_ceiling": 5.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.25,
        "fx_intensity": 0.70,
        "transition_mode": "hard_cut",
        "sorting_logic": "story_spine",
        "motion_behavior": "organic_16mm",
        "style_fx": "film_16mm",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.15, "shake": 0.08, "rgb_split": 0.10, "speed_ramp": False}},
            "verse": {"cut_mode": "2_bars", "target_energy": [0.15, 0.60], "transition": "hard_cut", "fx": {"bass_zoom": 0.30, "snare_flash": 0.20, "shake": 0.10, "rgb_split": 0.15, "speed_ramp": False}},
            "build": {"cut_mode": "1_bar", "target_energy": [0.35, 0.75], "transition": "flash_white", "fx": {"bass_zoom": 0.45, "snare_flash": 0.35, "shake": 0.18, "rgb_split": 0.20, "speed_ramp": False}},
            "drop": {"cut_mode": "1_bar", "target_energy": [0.55, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.60, "snare_flash": 0.45, "shake": 0.25, "rgb_split": 0.25, "speed_ramp": False}},
            "chorus": {"cut_mode": "1_bar", "target_energy": [0.45, 0.85], "transition": "hard_cut", "fx": {"bass_zoom": 0.50, "snare_flash": 0.30, "shake": 0.15, "rgb_split": 0.20, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.40], "transition": "hard_cut", "fx": {"bass_zoom": 0.15, "snare_flash": 0.10, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
        },
    },
    "dark_minimalist": {
        "id": "dark_minimalist",
        "category": "core",
        "name": "🌑 Dark Minimalist",
        "description": "5.0s–8.0s hypnotic holds, high-contrast shadow crush, and automatic black-frame dropouts on quiet passages.",
        "min_cut_floor": 5.0,
        "max_cut_ceiling": 8.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.15,
        "fx_intensity": 0.65,
        "transition_mode": "hard_cut",
        "sorting_logic": "dark_low_luma",
        "motion_behavior": "slow_tension",
        "style_fx": "dark_minimalist",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.35], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "verse": {"cut_mode": "2_bars", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.10, "shake": 0.0, "rgb_split": 0.05, "speed_ramp": False}},
            "build": {"cut_mode": "2_bars", "target_energy": [0.25, 0.65], "transition": "hard_cut", "fx": {"bass_zoom": 0.40, "snare_flash": 0.25, "shake": 0.10, "rgb_split": 0.15, "speed_ramp": False}},
            "drop": {"cut_mode": "1_bar", "target_energy": [0.45, 0.85], "transition": "flash_white", "fx": {"bass_zoom": 0.65, "snare_flash": 0.45, "shake": 0.25, "rgb_split": 0.25, "speed_ramp": False}},
            "chorus": {"cut_mode": "2_bars", "target_energy": [0.35, 0.75], "transition": "hard_cut", "fx": {"bass_zoom": 0.50, "snare_flash": 0.20, "shake": 0.10, "rgb_split": 0.15, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.30], "transition": "hard_cut", "fx": {"bass_zoom": 0.15, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
        },
    },
    "social_reel_frenzy": {
        "id": "social_reel_frenzy",
        "category": "core",
        "name": "🔥 Social Short / Reel Frenzy",
        "description": "Relentless beat-locked cuts (0.35s–1.0s) with hard zoom-punch impacts on every downbeat and snare.",
        "min_cut_floor": 0.35,
        "max_cut_ceiling": 1.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.85,
        "fx_intensity": 1.25,
        "transition_mode": "auto_intensity",
        "sorting_logic": "high_energy",
        "motion_behavior": "downbeat_zoom_punch",
        "style_fx": "reel_frenzy",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "1_beat", "target_energy": [0.45, 0.85], "transition": "flash_white", "fx": {"bass_zoom": 0.90, "snare_flash": 0.65, "shake": 0.50, "rgb_split": 0.55, "speed_ramp": True}},
            "verse": {"cut_mode": "1_beat", "target_energy": [0.50, 0.90], "transition": "hard_cut", "fx": {"bass_zoom": 0.95, "snare_flash": 0.60, "shake": 0.55, "rgb_split": 0.50, "speed_ramp": True}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.65, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 1.15, "snare_flash": 0.85, "shake": 0.75, "rgb_split": 0.75, "speed_ramp": True}},
            "drop": {"cut_mode": "energy_arc", "target_energy": [0.75, 1.00], "transition": "quick_glitch", "fx": {"bass_zoom": 1.35, "snare_flash": 0.95, "shake": 0.90, "rgb_split": 0.85, "speed_ramp": True}},
            "chorus": {"cut_mode": "1_beat", "target_energy": [0.65, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 1.15, "snare_flash": 0.80, "shake": 0.70, "rgb_split": 0.70, "speed_ramp": True}},
            "outro": {"cut_mode": "2_beats", "target_energy": [0.40, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.80, "snare_flash": 0.45, "shake": 0.35, "rgb_split": 0.40, "speed_ramp": True}},
        },
    },
    "downbeat_anchored": {
        "id": "downbeat_anchored",
        "category": "core",
        "name": "🎯 Downbeat Anchored (Verse/Chorus Dynamic)",
        "description": "Verses cut every 1-2 bars on downbeat; Choruses cut every 2 beats on snare hits.",
        "min_cut_floor": 1.0,
        "max_cut_ceiling": 4.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.40,
        "fx_intensity": 0.85,
        "transition_mode": "hard_cut",
        "sorting_logic": "downbeat_anchored",
        "motion_behavior": "downbeat_zoom_punch",
        "style_fx": "downbeat_dynamic",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.10, 0.50], "transition": "hard_cut", "fx": {"bass_zoom": 0.30, "snare_flash": 0.20, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
            "verse": {"cut_mode": "1_or_2_bars_downbeat", "target_energy": [0.20, 0.65], "transition": "hard_cut", "fx": {"bass_zoom": 0.40, "snare_flash": 0.25, "shake": 0.10, "rgb_split": 0.15, "speed_ramp": False}},
            "build": {"cut_mode": "1_bar", "target_energy": [0.35, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.55, "snare_flash": 0.45, "shake": 0.20, "rgb_split": 0.25, "speed_ramp": False}},
            "drop": {"cut_mode": "2_beats_snare", "target_energy": [0.55, 1.00], "transition": "quick_glitch", "fx": {"bass_zoom": 0.85, "snare_flash": 0.75, "shake": 0.40, "rgb_split": 0.50, "speed_ramp": True}},
            "chorus": {"cut_mode": "2_beats_snare", "target_energy": [0.45, 0.90], "transition": "flash_white", "fx": {"bass_zoom": 0.75, "snare_flash": 0.65, "shake": 0.30, "rgb_split": 0.40, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.15, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
        },
    },
    "ambient_shoegaze_drift": {
        "id": "ambient_shoegaze_drift",
        "category": "core",
        "name": "🌫️ Ambient / Shoegaze Drift (Long Form)",
        "description": "Ignore transients; 6.0s–10.0s block lengths, subtle Ken Burns drifts, 500ms soft dissolves.",
        "min_cut_floor": 6.0,
        "max_cut_ceiling": 10.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.10,
        "fx_intensity": 0.40,
        "transition_mode": "soft_dissolve",
        "sorting_logic": "vibe_warm",
        "motion_behavior": "slow_drift",
        "style_fx": "shoegaze_drift",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "ambient_long_drift", "target_energy": [0.05, 0.35], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.10, "snare_flash": 0.05, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "verse": {"cut_mode": "ambient_long_drift", "target_energy": [0.10, 0.45], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.15, "snare_flash": 0.05, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "build": {"cut_mode": "ambient_long_drift", "target_energy": [0.20, 0.60], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.20, "snare_flash": 0.10, "shake": 0.0, "rgb_split": 0.05, "speed_ramp": False}},
            "drop": {"cut_mode": "ambient_long_drift", "target_energy": [0.30, 0.75], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.30, "snare_flash": 0.15, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
            "chorus": {"cut_mode": "ambient_long_drift", "target_energy": [0.25, 0.70], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.25, "snare_flash": 0.10, "shake": 0.0, "rgb_split": 0.05, "speed_ramp": False}},
            "outro": {"cut_mode": "ambient_long_drift", "target_energy": [0.05, 0.30], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.10, "snare_flash": 0.0, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
        },
    },
    "snare_lock_halftime": {
        "id": "snare_lock_halftime",
        "category": "core",
        "name": "🥁 Snare-Lock Half-Time (Urban / Lo-Fi)",
        "description": "Anchor cuts exclusively to snare/clap transients (beats 2 & 4), ignore hi-hat/sub-bass.",
        "min_cut_floor": 1.0,
        "max_cut_ceiling": 3.5,
        "preserve_full_duration": False,
        "story_vs_chop": 0.65,
        "fx_intensity": 0.95,
        "transition_mode": "hard_cut",
        "sorting_logic": "snare_lock",
        "motion_behavior": "downbeat_zoom_punch",
        "style_fx": "snare_lock",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "snare_exclusive", "target_energy": [0.15, 0.50], "transition": "hard_cut", "fx": {"bass_zoom": 0.35, "snare_flash": 0.40, "shake": 0.10, "rgb_split": 0.20, "speed_ramp": False}},
            "verse": {"cut_mode": "snare_exclusive", "target_energy": [0.25, 0.70], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.55, "shake": 0.15, "rgb_split": 0.25, "speed_ramp": False}},
            "build": {"cut_mode": "snare_exclusive", "target_energy": [0.40, 0.85], "transition": "hard_cut", "fx": {"bass_zoom": 0.60, "snare_flash": 0.75, "shake": 0.25, "rgb_split": 0.35, "speed_ramp": False}},
            "drop": {"cut_mode": "snare_exclusive", "target_energy": [0.60, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 0.90, "snare_flash": 0.95, "shake": 0.45, "rgb_split": 0.50, "speed_ramp": True}},
            "chorus": {"cut_mode": "snare_exclusive", "target_energy": [0.50, 0.90], "transition": "hard_cut", "fx": {"bass_zoom": 0.75, "snare_flash": 0.85, "shake": 0.35, "rgb_split": 0.40, "speed_ramp": False}},
            "outro": {"cut_mode": "snare_exclusive", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.30, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
        },
    },
    "dynamic_energy_ramping": {
        "id": "dynamic_energy_ramping",
        "category": "core",
        "name": "📈 Dynamic Energy Ramping (Build-up)",
        "description": "Read RMS energy; < -18dB holds 4+ bars; > -6dB cuts 1/4 bar staccato bursts.",
        "min_cut_floor": 0.25,
        "max_cut_ceiling": 8.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.60,
        "fx_intensity": 1.10,
        "transition_mode": "auto_intensity",
        "sorting_logic": "high_energy",
        "motion_behavior": "hyper_kinetic",
        "style_fx": "energy_ramping",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "energy_ramping", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.25, "shake": 0.10, "rgb_split": 0.15, "speed_ramp": False}},
            "verse": {"cut_mode": "energy_ramping", "target_energy": [0.20, 0.60], "transition": "hard_cut", "fx": {"bass_zoom": 0.40, "snare_flash": 0.35, "shake": 0.15, "rgb_split": 0.25, "speed_ramp": False}},
            "build": {"cut_mode": "energy_ramping", "target_energy": [0.45, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.85, "snare_flash": 0.80, "shake": 0.50, "rgb_split": 0.65, "speed_ramp": True}},
            "drop": {"cut_mode": "energy_ramping", "target_energy": [0.70, 1.00], "transition": "quick_glitch", "fx": {"bass_zoom": 1.10, "snare_flash": 0.95, "shake": 0.75, "rgb_split": 0.85, "speed_ramp": True}},
            "chorus": {"cut_mode": "energy_ramping", "target_energy": [0.55, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.80, "snare_flash": 0.70, "shake": 0.40, "rgb_split": 0.55, "speed_ramp": True}},
            "outro": {"cut_mode": "energy_ramping", "target_energy": [0.05, 0.40], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.15, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
        },
    },

    # ── Avant-Garde & Auteur Grammars (8 Experimental Presets) ──
    "burroughs_cutup_machine": {
        "id": "burroughs_cutup_machine",
        "category": "avant_garde",
        "name": "✂️ Burroughs Cut-Up Machine",
        "description": "3-column vertical Fold-In split canvas sequencing streams asynchronously, snare typographic flash injection, and 3-frame kick reverse-stutter.",
        "min_cut_floor": 0.45,
        "max_cut_ceiling": 2.4,
        "preserve_full_duration": False,
        "story_vs_chop": 0.70,
        "fx_intensity": 1.25,
        "transition_mode": "quick_glitch",
        "sorting_logic": "cutup_fold_in",
        "motion_behavior": "3_column_fold_in",
        "style_fx": "burroughs_cutup",
        "fold_in_columns": 3,
        "sprocket_slip": False,
        "typographic_flashes": True,
        "step_print_12fps": False,
        "reverse_stutter": True,
        "section_rules": {
            "intro": {"cut_mode": "2_beats", "target_energy": [0.25, 0.75], "transition": "quick_glitch", "fx": {"bass_zoom": 0.55, "snare_flash": 0.75, "shake": 0.35, "rgb_split": 0.65, "speed_ramp": False}},
            "verse": {"cut_mode": "transients_or_beat", "target_energy": [0.35, 0.85], "transition": "quick_glitch", "fx": {"bass_zoom": 0.65, "snare_flash": 0.85, "shake": 0.45, "rgb_split": 0.75, "speed_ramp": False}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.55, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.85, "snare_flash": 0.95, "shake": 0.65, "rgb_split": 0.85, "speed_ramp": True}},
            "drop": {"cut_mode": "energy_arc", "target_energy": [0.70, 1.00], "transition": "quick_glitch", "fx": {"bass_zoom": 1.05, "snare_flash": 1.00, "shake": 0.85, "rgb_split": 0.95, "speed_ramp": True}},
            "chorus": {"cut_mode": "1_beat", "target_energy": [0.55, 0.95], "transition": "quick_glitch", "fx": {"bass_zoom": 0.80, "snare_flash": 0.90, "shake": 0.55, "rgb_split": 0.80, "speed_ramp": False}},
            "outro": {"cut_mode": "2_beats", "target_energy": [0.20, 0.65], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.60, "shake": 0.25, "rgb_split": 0.50, "speed_ramp": False}},
        },
    },
    "brakhage_emulsion_decay": {
        "id": "brakhage_emulsion_decay",
        "category": "avant_garde",
        "name": "🔥 Brakhage Emulsion Decay",
        "description": "Vertical sprocket jumps, hand-scratched celluloid emulsion lines, and organic copper/amber heat burns keyed to bass drops.",
        "min_cut_floor": 0.35,
        "max_cut_ceiling": 2.2,
        "preserve_full_duration": False,
        "story_vs_chop": 0.65,
        "fx_intensity": 1.30,
        "transition_mode": "flash_white",
        "sorting_logic": "high_energy",
        "motion_behavior": "sprocket_jitter",
        "style_fx": "brakhage_emulsion",
        "fold_in_columns": 1,
        "sprocket_slip": True,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "2_beats", "target_energy": [0.20, 0.65], "transition": "flash_white", "fx": {"bass_zoom": 0.60, "snare_flash": 0.65, "shake": 0.50, "rgb_split": 0.45, "speed_ramp": False}},
            "verse": {"cut_mode": "transients_or_beat", "target_energy": [0.35, 0.80], "transition": "flash_white", "fx": {"bass_zoom": 0.75, "snare_flash": 0.75, "shake": 0.65, "rgb_split": 0.55, "speed_ramp": True}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.55, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.95, "snare_flash": 0.90, "shake": 0.80, "rgb_split": 0.70, "speed_ramp": True}},
            "drop": {"cut_mode": "energy_arc", "target_energy": [0.75, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 1.25, "snare_flash": 1.00, "shake": 0.95, "rgb_split": 0.85, "speed_ramp": True}},
            "chorus": {"cut_mode": "1_beat", "target_energy": [0.60, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.95, "snare_flash": 0.85, "shake": 0.75, "rgb_split": 0.65, "speed_ramp": True}},
            "outro": {"cut_mode": "1_bar", "target_energy": [0.15, 0.55], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.45, "shake": 0.35, "rgb_split": 0.30, "speed_ramp": False}},
        },
    },
    "structural_flicker_sharits": {
        "id": "structural_flicker_sharits",
        "category": "avant_garde",
        "name": "⚡ Structural Flicker (Sharits / Conrad)",
        "description": "1-to-2 frame alternating strobes between adjacent clips and pure black/white frames on cymbal and hi-hat transients.",
        "min_cut_floor": 0.20,
        "max_cut_ceiling": 1.1,
        "preserve_full_duration": False,
        "story_vs_chop": 0.90,
        "fx_intensity": 1.40,
        "transition_mode": "flash_white",
        "sorting_logic": "high_energy",
        "motion_behavior": "structural_strobe",
        "style_fx": "structural_flicker",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "1_beat", "target_energy": [0.30, 0.75], "transition": "flash_white", "fx": {"bass_zoom": 0.40, "snare_flash": 0.95, "shake": 0.20, "rgb_split": 0.50, "speed_ramp": False}},
            "verse": {"cut_mode": "transients_or_beat", "target_energy": [0.45, 0.85], "transition": "flash_white", "fx": {"bass_zoom": 0.50, "snare_flash": 1.00, "shake": 0.30, "rgb_split": 0.60, "speed_ramp": False}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.60, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 0.70, "snare_flash": 1.00, "shake": 0.45, "rgb_split": 0.75, "speed_ramp": False}},
            "drop": {"cut_mode": "energy_arc", "target_energy": [0.75, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 0.85, "snare_flash": 1.00, "shake": 0.60, "rgb_split": 0.85, "speed_ramp": False}},
            "chorus": {"cut_mode": "1_beat", "target_energy": [0.60, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.65, "snare_flash": 1.00, "shake": 0.40, "rgb_split": 0.70, "speed_ramp": False}},
            "outro": {"cut_mode": "2_beats", "target_energy": [0.25, 0.65], "transition": "flash_white", "fx": {"bass_zoom": 0.30, "snare_flash": 0.80, "shake": 0.15, "rgb_split": 0.40, "speed_ramp": False}},
        },
    },
    "metric_time_stutter_kubelka": {
        "id": "metric_time_stutter_kubelka",
        "category": "avant_garde",
        "name": "📐 Metric Time-Stutter (Kubelka)",
        "description": "Strict Fibonacci-ratio frame slicing (1, 2, 3, 5, 8, 13 units) with 3-frame reverse-stutter loops on every downbeat.",
        "min_cut_floor": 0.22,
        "max_cut_ceiling": 2.6,
        "preserve_full_duration": False,
        "story_vs_chop": 0.80,
        "fx_intensity": 1.15,
        "transition_mode": "hard_cut",
        "sorting_logic": "fibonacci_metric",
        "motion_behavior": "metric_reverse_stutter",
        "style_fx": "kubelka_metric",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": True,
        "section_rules": {
            "intro": {"cut_mode": "fibonacci_metric", "target_energy": [0.20, 0.70], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.35, "shake": 0.20, "rgb_split": 0.30, "speed_ramp": False}},
            "verse": {"cut_mode": "fibonacci_metric", "target_energy": [0.35, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.55, "snare_flash": 0.45, "shake": 0.25, "rgb_split": 0.35, "speed_ramp": False}},
            "build": {"cut_mode": "fibonacci_metric", "target_energy": [0.50, 0.95], "transition": "hard_cut", "fx": {"bass_zoom": 0.75, "snare_flash": 0.65, "shake": 0.40, "rgb_split": 0.50, "speed_ramp": False}},
            "drop": {"cut_mode": "fibonacci_metric", "target_energy": [0.70, 1.00], "transition": "hard_cut", "fx": {"bass_zoom": 0.95, "snare_flash": 0.80, "shake": 0.55, "rgb_split": 0.65, "speed_ramp": False}},
            "chorus": {"cut_mode": "fibonacci_metric", "target_energy": [0.55, 0.90], "transition": "hard_cut", "fx": {"bass_zoom": 0.70, "snare_flash": 0.60, "shake": 0.35, "rgb_split": 0.45, "speed_ramp": False}},
            "outro": {"cut_mode": "fibonacci_metric", "target_energy": [0.15, 0.60], "transition": "hard_cut", "fx": {"bass_zoom": 0.35, "snare_flash": 0.25, "shake": 0.15, "rgb_split": 0.20, "speed_ramp": False}},
        },
    },
    "lynchian_industrial_monochrome": {
        "id": "lynchian_industrial_monochrome",
        "category": "avant_garde",
        "name": "🏭 Lynchian Industrial Monochrome (Eraserhead)",
        "description": "Chalk-and-soot high-contrast monochrome, 12fps step-print cadence, sub-bass canvas tremors (20–60Hz), and 1-frame tungsten arc flashes on snares.",
        "min_cut_floor": 2.5,
        "max_cut_ceiling": 6.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.30,
        "fx_intensity": 1.10,
        "transition_mode": "hard_cut",
        "sorting_logic": "dark_low_luma",
        "motion_behavior": "step_print_tremor",
        "style_fx": "lynch_monochrome",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": True,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.40], "transition": "hard_cut", "fx": {"bass_zoom": 0.35, "snare_flash": 0.85, "shake": 0.75, "rgb_split": 0.0, "speed_ramp": False}},
            "verse": {"cut_mode": "2_bars", "target_energy": [0.10, 0.50], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.90, "shake": 0.85, "rgb_split": 0.0, "speed_ramp": False}},
            "build": {"cut_mode": "1_bar", "target_energy": [0.25, 0.70], "transition": "flash_white", "fx": {"bass_zoom": 0.60, "snare_flash": 1.00, "shake": 0.95, "rgb_split": 0.0, "speed_ramp": False}},
            "drop": {"cut_mode": "1_bar", "target_energy": [0.45, 0.90], "transition": "flash_white", "fx": {"bass_zoom": 0.80, "snare_flash": 1.00, "shake": 1.10, "rgb_split": 0.0, "speed_ramp": False}},
            "chorus": {"cut_mode": "1_bar", "target_energy": [0.35, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.65, "snare_flash": 0.95, "shake": 0.90, "rgb_split": 0.0, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.35], "transition": "hard_cut", "fx": {"bass_zoom": 0.30, "snare_flash": 0.75, "shake": 0.65, "rgb_split": 0.0, "speed_ramp": False}},
        },
    },
    "mekas_bolex_diary": {
        "id": "mekas_bolex_diary",
        "category": "avant_garde",
        "name": "📽️ Mekas Bolex Diary",
        "description": "Rapid 2-to-4 frame bursts of stills and clips on transients resolving into lyrical 2.0s–3.0s contemplative holds.",
        "min_cut_floor": 0.20,
        "max_cut_ceiling": 3.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.60,
        "fx_intensity": 0.95,
        "transition_mode": "flash_white",
        "sorting_logic": "mekas_burst_hold",
        "motion_behavior": "bolex_diary_flutter",
        "style_fx": "mekas_bolex",
        "fold_in_columns": 1,
        "sprocket_slip": True,
        "typographic_flashes": False,
        "step_print_12fps": True,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "mekas_burst_hold", "target_energy": [0.10, 0.55], "transition": "flash_white", "fx": {"bass_zoom": 0.30, "snare_flash": 0.65, "shake": 0.35, "rgb_split": 0.20, "speed_ramp": False}},
            "verse": {"cut_mode": "mekas_burst_hold", "target_energy": [0.20, 0.65], "transition": "flash_white", "fx": {"bass_zoom": 0.40, "snare_flash": 0.70, "shake": 0.40, "rgb_split": 0.25, "speed_ramp": False}},
            "build": {"cut_mode": "mekas_burst_hold", "target_energy": [0.40, 0.85], "transition": "flash_white", "fx": {"bass_zoom": 0.55, "snare_flash": 0.85, "shake": 0.55, "rgb_split": 0.35, "speed_ramp": False}},
            "drop": {"cut_mode": "mekas_burst_hold", "target_energy": [0.55, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.70, "snare_flash": 0.95, "shake": 0.65, "rgb_split": 0.45, "speed_ramp": False}},
            "chorus": {"cut_mode": "mekas_burst_hold", "target_energy": [0.45, 0.85], "transition": "flash_white", "fx": {"bass_zoom": 0.55, "snare_flash": 0.80, "shake": 0.50, "rgb_split": 0.35, "speed_ramp": False}},
            "outro": {"cut_mode": "mekas_burst_hold", "target_energy": [0.10, 0.50], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.50, "shake": 0.25, "rgb_split": 0.15, "speed_ramp": False}},
        },
    },
    "marker_photo_montage_jetee": {
        "id": "marker_photo_montage_jetee",
        "category": "avant_garde",
        "name": "🖼️ Marker Photo-Montage (La Jetée)",
        "description": "Stills-only sequence holding 3.0s–5.0s across bars, awakening into a single moving video clip at peak track loudness.",
        "min_cut_floor": 3.0,
        "max_cut_ceiling": 5.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.15,
        "fx_intensity": 0.65,
        "transition_mode": "hard_cut",
        "sorting_logic": "la_jetee_stills_plus_peak_video",
        "motion_behavior": "gentle_ken_burns",
        "style_fx": "marker_jetee",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.15, "snare_flash": 0.10, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "verse": {"cut_mode": "2_bars", "target_energy": [0.10, 0.55], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.15, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
            "build": {"cut_mode": "1_bar", "target_energy": [0.30, 0.75], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.20, "shake": 0.05, "rgb_split": 0.0, "speed_ramp": False}},
            "drop": {"cut_mode": "1_bar", "target_energy": [0.60, 1.00], "transition": "flash_white", "fx": {"bass_zoom": 0.40, "snare_flash": 0.35, "shake": 0.10, "rgb_split": 0.05, "speed_ramp": False}},
            "chorus": {"cut_mode": "2_bars", "target_energy": [0.40, 0.85], "transition": "hard_cut", "fx": {"bass_zoom": 0.30, "snare_flash": 0.20, "shake": 0.05, "rgb_split": 0.0, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.40], "transition": "hard_cut", "fx": {"bass_zoom": 0.10, "snare_flash": 0.05, "shake": 0.0, "rgb_split": 0.0, "speed_ramp": False}},
        },
    },
    "debord_detournement": {
        "id": "debord_detournement",
        "category": "avant_garde",
        "name": "⚖️ Debord Détournement",
        "description": "Dialectical tension: 6.0s–8.0s unbroken shots during high-energy sections vs. rapid staccato cuts during quiet passages.",
        "min_cut_floor": 0.25,
        "max_cut_ceiling": 8.0,
        "preserve_full_duration": False,
        "story_vs_chop": 0.55,
        "fx_intensity": 0.90,
        "transition_mode": "hard_cut",
        "sorting_logic": "dialectical_debord",
        "motion_behavior": "counter_dialectic",
        "style_fx": "debord_detournement",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": True,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "section_rules": {
            "intro": {"cut_mode": "dialectical_debord", "target_energy": [0.55, 0.95], "transition": "hard_cut", "fx": {"bass_zoom": 0.40, "snare_flash": 0.45, "shake": 0.20, "rgb_split": 0.30, "speed_ramp": False}},
            "verse": {"cut_mode": "dialectical_debord", "target_energy": [0.50, 0.90], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.50, "shake": 0.25, "rgb_split": 0.35, "speed_ramp": False}},
            "build": {"cut_mode": "dialectical_debord", "target_energy": [0.15, 0.55], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.20, "shake": 0.10, "rgb_split": 0.15, "speed_ramp": False}},
            "drop": {"cut_mode": "dialectical_debord", "target_energy": [0.05, 0.40], "transition": "hard_cut", "fx": {"bass_zoom": 0.15, "snare_flash": 0.10, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
            "chorus": {"cut_mode": "dialectical_debord", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.20, "snare_flash": 0.15, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
            "outro": {"cut_mode": "dialectical_debord", "target_energy": [0.60, 0.95], "transition": "hard_cut", "fx": {"bass_zoom": 0.35, "snare_flash": 0.40, "shake": 0.20, "rgb_split": 0.25, "speed_ramp": False}},
        },
    },
    # ═══════════════════════════════════════════════════════════════════════════
    # ESOTERIC & OCCULT TRADITIONS (5 PRESETS)
    # ═══════════════════════════════════════════════════════════════════════════
    "babalon_working_parsons": {
        "id": "babalon_working_parsons",
        "category": "esoteric",
        "name": "🔥 Babalon Working (Parsons / 1946 Mojave)",
        "description": "Saturated desert solar flares, blood-red & gold duotone shifts, heat-shimmer displacement. Strict 7-beat and 11-beat rhythmic intervals with 2-frame solar overexposure blooms & crimson flashes on heavy snares.",
        "min_cut_floor": 2.40,
        "max_cut_ceiling": 6.00,
        "preserve_full_duration": False,
        "story_vs_chop": 0.40,
        "fx_intensity": 1.25,
        "transition_mode": "flash_white",
        "sorting_logic": "thelemic_7_11",
        "motion_behavior": "mojave_heat_shimmer",
        "style_fx": "babalon_working",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "subliminal_sigil_flash": False,
        "obsidian_scrying_vignette": False,
        "thelemic_dye_bloom": True,
        "cosmic_static_glitch": False,
        "section_rules": {
            "intro": {"cut_mode": "thelemic_7_11", "target_energy": [0.35, 0.70], "transition": "flash_white", "fx": {"bass_zoom": 0.45, "snare_flash": 0.95, "shake": 0.20, "rgb_split": 0.25, "speed_ramp": False}},
            "verse": {"cut_mode": "thelemic_7_11", "target_energy": [0.45, 0.80], "transition": "flash_white", "fx": {"bass_zoom": 0.55, "snare_flash": 1.05, "shake": 0.25, "rgb_split": 0.30, "speed_ramp": False}},
            "build": {"cut_mode": "thelemic_7_11", "target_energy": [0.60, 0.90], "transition": "flash_white", "fx": {"bass_zoom": 0.70, "snare_flash": 1.15, "shake": 0.35, "rgb_split": 0.40, "speed_ramp": True}},
            "drop": {"cut_mode": "thelemic_7_11", "target_energy": [0.75, 1.0], "transition": "flash_white", "fx": {"bass_zoom": 0.90, "snare_flash": 1.35, "shake": 0.50, "rgb_split": 0.50, "speed_ramp": True}},
            "chorus": {"cut_mode": "thelemic_7_11", "target_energy": [0.65, 0.95], "transition": "flash_white", "fx": {"bass_zoom": 0.75, "snare_flash": 1.20, "shake": 0.40, "rgb_split": 0.40, "speed_ramp": True}},
            "outro": {"cut_mode": "thelemic_7_11", "target_energy": [0.30, 0.65], "transition": "flash_white", "fx": {"bass_zoom": 0.40, "snare_flash": 0.85, "shake": 0.15, "rgb_split": 0.20, "speed_ramp": False}},
        },
    },
    "chaos_sigil_flash_spare": {
        "id": "chaos_sigil_flash_spare",
        "category": "esoteric",
        "name": "🜏 Chaos Sigil Flash (Austin Osman Spare / IOT)",
        "description": "Slices graphic glyphs & stills as 1-frame (16ms) subconscious flashes. Sub-bass impacts and kick transients trigger instant negative/inverted 1-frame sigil injections returning immediately to the ongoing story clip.",
        "min_cut_floor": 0.35,
        "max_cut_ceiling": 3.50,
        "preserve_full_duration": True,
        "story_vs_chop": 0.55,
        "fx_intensity": 1.30,
        "transition_mode": "quick_glitch",
        "sorting_logic": "story_spine",
        "motion_behavior": "sigil_gnosis",
        "style_fx": "chaos_sigil",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "subliminal_sigil_flash": True,
        "obsidian_scrying_vignette": False,
        "thelemic_dye_bloom": False,
        "cosmic_static_glitch": False,
        "section_rules": {
            "intro": {"cut_mode": "energy_arc", "target_energy": [0.25, 0.65], "transition": "hard_cut", "fx": {"bass_zoom": 0.55, "snare_flash": 0.65, "shake": 0.25, "rgb_split": 0.45, "speed_ramp": False}},
            "verse": {"cut_mode": "energy_arc", "target_energy": [0.40, 0.75], "transition": "hard_cut", "fx": {"bass_zoom": 0.65, "snare_flash": 0.75, "shake": 0.35, "rgb_split": 0.55, "speed_ramp": False}},
            "build": {"cut_mode": "energy_arc", "target_energy": [0.60, 0.92], "transition": "quick_glitch", "fx": {"bass_zoom": 0.85, "snare_flash": 0.90, "shake": 0.50, "rgb_split": 0.75, "speed_ramp": True}},
            "drop": {"cut_mode": "transients_or_beat", "target_energy": [0.78, 1.0], "transition": "quick_glitch", "fx": {"bass_zoom": 1.15, "snare_flash": 1.10, "shake": 0.70, "rgb_split": 0.95, "speed_ramp": True}},
            "chorus": {"cut_mode": "energy_arc", "target_energy": [0.65, 0.95], "transition": "quick_glitch", "fx": {"bass_zoom": 0.95, "snare_flash": 0.95, "shake": 0.55, "rgb_split": 0.80, "speed_ramp": True}},
            "outro": {"cut_mode": "energy_arc", "target_energy": [0.20, 0.55], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.50, "shake": 0.20, "rgb_split": 0.35, "speed_ramp": False}},
        },
    },
    "enochian_scrying_glass_dee": {
        "id": "enochian_scrying_glass_dee",
        "category": "esoteric",
        "name": "🔮 Enochian Scrying Glass (Dee & Kelley)",
        "description": "Dark obsidian vignette falloff and radial mirror reflections. Hypnotic 5.0s–8.0s scrying holds with soft dissolves; cymbal/hi-hat washes trigger faint Enochian angelic character overlays.",
        "min_cut_floor": 5.00,
        "max_cut_ceiling": 8.00,
        "preserve_full_duration": True,
        "story_vs_chop": 0.15,
        "fx_intensity": 0.95,
        "transition_mode": "soft_dissolve",
        "sorting_logic": "dark_low_luma",
        "motion_behavior": "obsidian_mirror",
        "style_fx": "enochian_scrying",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "subliminal_sigil_flash": False,
        "obsidian_scrying_vignette": True,
        "thelemic_dye_bloom": False,
        "cosmic_static_glitch": False,
        "section_rules": {
            "intro": {"cut_mode": "2_bars", "target_energy": [0.10, 0.45], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.20, "snare_flash": 0.20, "shake": 0.05, "rgb_split": 0.15, "speed_ramp": False}},
            "verse": {"cut_mode": "2_bars", "target_energy": [0.15, 0.55], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.25, "snare_flash": 0.25, "shake": 0.08, "rgb_split": 0.20, "speed_ramp": False}},
            "build": {"cut_mode": "2_bars", "target_energy": [0.25, 0.65], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.35, "snare_flash": 0.35, "shake": 0.12, "rgb_split": 0.30, "speed_ramp": False}},
            "drop": {"cut_mode": "2_bars", "target_energy": [0.35, 0.75], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.45, "snare_flash": 0.45, "shake": 0.15, "rgb_split": 0.35, "speed_ramp": False}},
            "chorus": {"cut_mode": "2_bars", "target_energy": [0.30, 0.70], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.40, "snare_flash": 0.40, "shake": 0.12, "rgb_split": 0.30, "speed_ramp": False}},
            "outro": {"cut_mode": "2_bars", "target_energy": [0.05, 0.35], "transition": "soft_dissolve", "fx": {"bass_zoom": 0.15, "snare_flash": 0.15, "shake": 0.05, "rgb_split": 0.10, "speed_ramp": False}},
        },
    },
    "typhonian_transmissions_grant": {
        "id": "typhonian_transmissions_grant",
        "category": "esoteric",
        "name": "👁️ Typhonian Transmissions (Grant / Outer Gateways)",
        "description": "Deep cosmic voids, inverted negative stroboscopic pulses, and erratic radio-frequency static glitches keyed to unpredictable transient spikes from beyond the Mauve Zone.",
        "min_cut_floor": 0.30,
        "max_cut_ceiling": 2.60,
        "preserve_full_duration": False,
        "story_vs_chop": 0.80,
        "fx_intensity": 1.35,
        "transition_mode": "quick_glitch",
        "sorting_logic": "dark_low_luma",
        "motion_behavior": "outer_gateway_static",
        "style_fx": "typhonian_transmission",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": True,
        "subliminal_sigil_flash": True,
        "obsidian_scrying_vignette": False,
        "thelemic_dye_bloom": False,
        "cosmic_static_glitch": True,
        "section_rules": {
            "intro": {"cut_mode": "transients_or_beat", "target_energy": [0.20, 0.65], "transition": "quick_glitch", "fx": {"bass_zoom": 0.50, "snare_flash": 0.75, "shake": 0.45, "rgb_split": 0.85, "speed_ramp": False}},
            "verse": {"cut_mode": "transients_or_beat", "target_energy": [0.35, 0.80], "transition": "quick_glitch", "fx": {"bass_zoom": 0.65, "snare_flash": 0.85, "shake": 0.55, "rgb_split": 0.95, "speed_ramp": True}},
            "build": {"cut_mode": "transients_or_beat", "target_energy": [0.55, 0.95], "transition": "quick_glitch", "fx": {"bass_zoom": 0.85, "snare_flash": 1.00, "shake": 0.75, "rgb_split": 1.15, "speed_ramp": True}},
            "drop": {"cut_mode": "transients_or_beat", "target_energy": [0.75, 1.0], "transition": "quick_glitch", "fx": {"bass_zoom": 1.10, "snare_flash": 1.25, "shake": 0.95, "rgb_split": 1.35, "speed_ramp": True}},
            "chorus": {"cut_mode": "transients_or_beat", "target_energy": [0.60, 0.95], "transition": "quick_glitch", "fx": {"bass_zoom": 0.90, "snare_flash": 1.05, "shake": 0.80, "rgb_split": 1.15, "speed_ramp": True}},
            "outro": {"cut_mode": "transients_or_beat", "target_energy": [0.15, 0.55], "transition": "quick_glitch", "fx": {"bass_zoom": 0.40, "snare_flash": 0.65, "shake": 0.35, "rgb_split": 0.70, "speed_ramp": False}},
        },
    },
    "dim_carcosa_aldebaran_gold": {
        "id": "dim_carcosa_aldebaran_gold",
        "category": "esoteric",
        "name": "👑 Dim Carcosa / Aldebaran Gold",
        "description": "Tarnished metallic gold, deep amber, and atmospheric dust haze. Slow, unhurried structural long takes alternating with sudden, jarring geometric match-cuts on downbeats.",
        "min_cut_floor": 0.35,
        "max_cut_ceiling": 6.50,
        "preserve_full_duration": False,
        "story_vs_chop": 0.35,
        "fx_intensity": 1.05,
        "transition_mode": "hard_cut",
        "sorting_logic": "carcosa_long_jarring",
        "motion_behavior": "aldebaran_dust",
        "style_fx": "dim_carcosa",
        "fold_in_columns": 1,
        "sprocket_slip": False,
        "typographic_flashes": False,
        "step_print_12fps": False,
        "reverse_stutter": False,
        "subliminal_sigil_flash": False,
        "obsidian_scrying_vignette": True,
        "thelemic_dye_bloom": False,
        "cosmic_static_glitch": False,
        "section_rules": {
            "intro": {"cut_mode": "carcosa_long_jarring", "target_energy": [0.15, 0.55], "transition": "hard_cut", "fx": {"bass_zoom": 0.35, "snare_flash": 0.40, "shake": 0.15, "rgb_split": 0.25, "speed_ramp": False}},
            "verse": {"cut_mode": "carcosa_long_jarring", "target_energy": [0.25, 0.65], "transition": "hard_cut", "fx": {"bass_zoom": 0.45, "snare_flash": 0.50, "shake": 0.20, "rgb_split": 0.30, "speed_ramp": False}},
            "build": {"cut_mode": "carcosa_long_jarring", "target_energy": [0.40, 0.80], "transition": "hard_cut", "fx": {"bass_zoom": 0.60, "snare_flash": 0.65, "shake": 0.30, "rgb_split": 0.40, "speed_ramp": False}},
            "drop": {"cut_mode": "carcosa_long_jarring", "target_energy": [0.55, 0.95], "transition": "hard_cut", "fx": {"bass_zoom": 0.80, "snare_flash": 0.85, "shake": 0.45, "rgb_split": 0.55, "speed_ramp": True}},
            "chorus": {"cut_mode": "carcosa_long_jarring", "target_energy": [0.45, 0.85], "transition": "hard_cut", "fx": {"bass_zoom": 0.65, "snare_flash": 0.70, "shake": 0.35, "rgb_split": 0.45, "speed_ramp": False}},
            "outro": {"cut_mode": "carcosa_long_jarring", "target_energy": [0.10, 0.45], "transition": "hard_cut", "fx": {"bass_zoom": 0.25, "snare_flash": 0.30, "shake": 0.10, "rgb_split": 0.20, "speed_ramp": False}},
        },
    },
}


def load_preset_bank() -> dict[str, dict]:
    bank = dict(DEFAULT_PRESET_BANK)
    updated_on_disk = False
    if PRESETS_FILE.exists():
        try:
            saved = json.loads(PRESETS_FILE.read_text(encoding="utf-8"))
            if isinstance(saved, dict):
                for k, v in saved.items():
                    if isinstance(v, dict) and "id" in v and "name" in v:
                        # Keep built-in defaults fresh while preserving custom user presets
                        if k in DEFAULT_PRESET_BANK:
                            bank[k] = DEFAULT_PRESET_BANK[k]
                        else:
                            bank[k] = v
                if len(bank) != len(saved) or any(k not in saved for k in DEFAULT_PRESET_BANK):
                    updated_on_disk = True
        except Exception:
            updated_on_disk = True
    else:
        updated_on_disk = True

    if updated_on_disk:
        PRESETS_FILE.write_text(json.dumps(bank, indent=2), encoding="utf-8")
    return bank


def save_custom_preset_to_bank(preset_data: dict) -> dict:
    bank = load_preset_bank()
    pid = preset_data.get("id") or re.sub(r"[^a-z0-9_]+", "_", preset_data.get("name", "custom_preset").lower()).strip("_")
    preset_data["id"] = pid
    if "category" not in preset_data:
        sfx = preset_data.get("style_fx", "")
        if sfx in ("babalon_working", "chaos_sigil", "enochian_scrying", "typhonian_transmission", "dim_carcosa"):
            preset_data["category"] = "esoteric"
        elif sfx in (
            "burroughs_cutup", "brakhage_emulsion", "structural_flicker", "kubelka_metric",
            "lynch_monochrome", "mekas_bolex", "marker_jetee", "debord_detournement"
        ):
            preset_data["category"] = "avant_garde"
        else:
            preset_data["category"] = "core"
    if "section_rules" not in preset_data:
        base_id = preset_data.get("base_template_id", "narrative_storyboard")
        base_rules = bank.get(base_id, DEFAULT_PRESET_BANK["narrative_storyboard"])["section_rules"]
        preset_data["section_rules"] = base_rules
    bank[pid] = preset_data
    PRESETS_FILE.write_text(json.dumps(bank, indent=2), encoding="utf-8")
    return preset_data


TEMPLATES = load_preset_bank()


def extract_cluster_info(filename: str) -> tuple[int | None, str | None]:
    """
    Parse Scene Cluster filenames such as:
      - '01_video.mp4' -> (1, None) [Anchor clip for cluster 1]
      - '01_a.png', '01_b.jpg', '01a_stab.webp' -> (1, 'a'), (1, 'b') [Companion image stabs for cluster 1]
    """
    stem = Path(filename).stem
    m = re.match(r"^\s*(?:clip|scene|shot|demo|vid|img|still)?[\s_\-]*(\d{1,4})(?:[\s_\-]*([a-z]))?(?:[\s_\-\.]+|$)", stem, re.IGNORECASE)
    if m:
        num = int(m.group(1))
        sub = m.group(2).lower() if m.group(2) else None
        return num, sub
    return extract_sequence_order(filename), None


def _tokenize_prompt(text: str) -> set[str]:
    if not text:
        return set()
    words = re.findall(r"[a-z0-9]+", text.lower())
    stop = {"the", "and", "for", "with", "that", "this", "from", "into", "clip", "video", "shot", "scene"}
    return {w for w in words if len(w) > 2 and w not in stop}


def compute_semantic_match_score(clip: dict, section_prompt: str, global_prompt: str) -> float:
    query_tokens = _tokenize_prompt(f"{section_prompt} {global_prompt}")
    if not query_tokens:
        return 0.5

    clip_corpus = " ".join([
        clip.get("description", ""),
        " ".join(clip.get("vibe_tags", [])),
        " ".join(clip.get("lyric_keywords", [])),
        clip.get("camera_motion", ""),
        clip.get("filename", ""),
    ]).lower()
    clip_tokens = _tokenize_prompt(clip_corpus)

    hits = 0.0
    for qt in query_tokens:
        if qt in clip_tokens:
            hits += 1.0
        elif qt in clip_corpus:
            hits += 0.65

    return float(np.clip(hits / max(1, len(query_tokens)), 0.0, 1.0))


def detect_story_spine(clips: list[dict], sorting_logic: str = "story_spine") -> tuple[list[dict], list[dict]]:
    """
    Partition clips into Story Spine / Anchors and B-Roll / Companion Stabs.
    Supports Scene Cluster Montage (anchoring 01_video with 01_a / 01_b image stabs).
    """
    numbered_videos = []
    companion_stills = []
    unnumbered = []

    for c in clips:
        c_num, c_sub = extract_cluster_info(c.get("filename", ""))
        if c.get("sequence_order") is None and c_num is not None:
            c["sequence_order"] = c_num
        c["cluster_id"] = c_num
        c["cluster_sub"] = c_sub

        if sorting_logic == "scene_cluster":
            # In Scene Cluster Montage, videos are anchors and images (or 01_a/01_b) are rapid stabs
            if c.get("media_type") == "image" or c_sub is not None:
                companion_stills.append(c)
            elif c_num is not None:
                numbered_videos.append(c)
            else:
                unnumbered.append(c)
        else:
            if c.get("sequence_order") is not None:
                numbered_videos.append(c)
            else:
                unnumbered.append(c)

    numbered_videos.sort(key=lambda x: (int(x.get("sequence_order") or 9999), x.get("filename", "")))

    if sorting_logic == "scene_cluster":
        anchors = numbered_videos if numbered_videos else [c for c in clips if c.get("media_type") != "image"] or clips
        stabs = companion_stills if companion_stills else unnumbered or clips
        return anchors, stabs

    if len(numbered_videos) >= 2:
        broll = unnumbered if unnumbered else sorted(clips, key=lambda x: float(x.get("motion_score", 0.5)), reverse=True)
        return numbered_videos, broll
    return [], clips


def generate_section_cut_points(
    sec_start: float,
    sec_end: float,
    sec_type: str,
    sec_energy: float,
    cut_mode: str,
    beats: list[float],
    downbeats: list[float],
    transients: list[float],
    kick_transients: list[float],
    bpm: float,
    min_clip_dur: float = 0.25,
    max_clip_dur: float = 8.0,
    snare_transients: list[float] | None = None,
) -> list[float]:
    beat_dur = 60.0 / max(60.0, bpm)
    sec_beats = [b for b in beats if sec_start - 0.05 <= b <= sec_end + 0.05]
    sec_bars = [d for d in downbeats if sec_start - 0.05 <= d <= sec_end + 0.05]
    all_trans = sorted(set(transients + kick_transients))
    sec_trans = [t for t in all_trans if sec_start + 0.18 <= t <= sec_end - 0.18]

    if not sec_beats:
        sec_beats = list(np.arange(sec_start, sec_end, beat_dur))
    if not sec_bars:
        sec_bars = sec_beats[::4] if len(sec_beats) >= 4 else [sec_start]

    raw_points = [sec_start]

    if cut_mode == "fibonacci_metric":
        # Kubelka Metric Time-Stutter: Fibonacci-ratio frame slicing (1, 2, 3, 5, 8, 13, 8, 5, 3, 2, 1)
        fib_units = [1, 2, 3, 5, 8, 13, 8, 5, 3, 2, 1]
        base_unit = max(0.18, beat_dur * 0.25)
        t_cur = sec_start
        f_idx = 0
        while t_cur < sec_end - 0.18:
            step = fib_units[f_idx % len(fib_units)] * base_unit
            t_cur = round(t_cur + step, 4)
            if t_cur < sec_end - 0.15:
                raw_points.append(t_cur)
            f_idx += 1
    elif cut_mode == "mekas_burst_hold":
        # Mekas Bolex Diary: Rapid 2-4 frame bursts on transients resolving into 2.0s-3.0s holds
        t_cur = sec_start
        burst_idx = 0
        while t_cur < sec_end - 0.20:
            # Find next transient or beat for burst start
            next_tr = next((tr for tr in sec_trans if tr >= t_cur + 0.05), t_cur + 0.15)
            if next_tr < sec_end - 0.35:
                t_cur = round(next_tr, 4)
                raw_points.append(t_cur)
                # 2 to 3 rapid Bolex diary bursts (0.14s - 0.18s each)
                for b_step in range(2 + (burst_idx % 2)):
                    t_cur = round(t_cur + 0.15, 4)
                    if t_cur < sec_end - 0.25:
                        raw_points.append(t_cur)
            # Resolve into 2.0s - 2.8s lyrical hold
            hold_dur = 2.1 + (burst_idx % 3) * 0.35
            t_cur = round(t_cur + hold_dur, 4)
            if t_cur < sec_end - 0.25:
                raw_points.append(t_cur)
            burst_idx += 1
        min_clip_dur = min(min_clip_dur, 0.12)
    elif cut_mode == "dialectical_debord":
        # Debord Détournement: 6-8s unbroken shots during high-energy sections; rapid staccato cuts during quiet passages
        is_high_energy_sec = sec_type in ("drop", "chorus", "build") or sec_energy >= 0.58
        if is_high_energy_sec:
            t_cur = sec_start + 6.5
            while t_cur < sec_end - 1.5:
                raw_points.append(round(t_cur, 4))
                t_cur += 6.5
            min_clip_dur = min(4.0, sec_end - sec_start)
            max_clip_dur = 8.0
        else:
            step = 0.34
            t_cur = sec_start + step
            while t_cur < sec_end - 0.20:
                raw_points.append(round(t_cur, 4))
                t_cur += step
            min_clip_dur = 0.22
            max_clip_dur = 0.55
    elif cut_mode == "thelemic_7_11":
        # Babalon Working (Parsons / 1946 Mojave): Strict 7-beat and 11-beat rhythmic intervals
        intervals = [7, 11]
        t_cur = sec_start
        step_i = 0
        while t_cur < sec_end - 0.35:
            beat_count = intervals[step_i % 2]
            t_next = t_cur + beat_count * beat_dur
            # Snap to nearest detected beat if within half a beat
            nearest_beats = [b for b in sec_beats if abs(b - t_next) <= beat_dur * 0.55]
            if nearest_beats:
                t_next = min(nearest_beats, key=lambda b: abs(b - t_next))
            t_cur = round(float(t_next), 4)
            if t_cur < sec_end - 0.25:
                raw_points.append(t_cur)
            step_i += 1
        min_clip_dur = min(min_clip_dur, max(1.0, 5.0 * beat_dur))
        max_clip_dur = max(max_clip_dur, 12.5 * beat_dur)
    elif cut_mode == "carcosa_long_jarring":
        # Dim Carcosa / Aldebaran Gold: Slow unhurried structural long takes alternating with sudden jarring geometric match-cuts on downbeats
        t_cur = sec_start
        cycle_idx = 0
        while t_cur < sec_end - 0.25:
            if cycle_idx % 2 == 0:
                # Unhurried structural long take (4.2s - 5.8s) snapping to a downbeat
                target_next = t_cur + 4.6
                cand_bars = [d for d in sec_bars if d >= t_cur + 3.2]
                t_next = cand_bars[0] if cand_bars else target_next
                t_cur = round(float(t_next), 4)
                if t_cur < sec_end - 0.20:
                    raw_points.append(t_cur)
            else:
                # Sudden jarring geometric match-cut burst on the downbeat (0.35s - 0.45s)
                for j_step in range(2):
                    t_cur = round(t_cur + 0.38, 4)
                    if t_cur < sec_end - 0.20:
                        raw_points.append(t_cur)
            cycle_idx += 1
        min_clip_dur = min(min_clip_dur, 0.28)
        max_clip_dur = max(max_clip_dur, 6.5)
    elif max_clip_dur <= 0.55:
        # Hyper-Chop 0.20s - 0.45s mode
        sub_grid = list(np.arange(sec_start, sec_end, max(0.20, min_clip_dur * 1.15)))
        candidates = sorted(set(sec_trans + sub_grid))
        for c in candidates:
            if c - raw_points[-1] >= min_clip_dur and (c - raw_points[-1] <= max_clip_dur or True):
                raw_points.append(c)
    elif min_clip_dur >= 1.9:
        # Long-Hold Preset Mode (VHS 2-4s, 16mm Film 3-5s, Narrative 4s+, Dark Minimalist 5-8s, Lynchian 2.5-6s, La Jetée 3-5s, Enochian 5-8s)
        target_hold = 0.5 * (min_clip_dur + max_clip_dur)
        candidates = sorted(set(sec_bars + sec_beats))
        for c in candidates:
            if c - raw_points[-1] >= min_clip_dur:
                raw_points.append(c)
        if len(raw_points) == 1 and (sec_end - sec_start) >= min_clip_dur * 1.6:
            t_step = sec_start + target_hold
            while t_step < sec_end - min_clip_dur * 0.6:
                raw_points.append(round(t_step, 4))
                t_step += target_hold
    elif cut_mode == "energy_arc":
        if sec_type in ("intro", "verse", "outro") or (sec_energy < 0.45 and sec_type not in ("build", "drop")):
            target_hold = np.clip(3.2 if sec_type in ("intro", "outro") else (3.6 - sec_energy * 1.8), min_clip_dur, max_clip_dur)
            candidates = sorted(set(sec_bars + sec_beats))
            for c in candidates:
                gap = c - raw_points[-1]
                if gap >= max(min_clip_dur, target_hold * 0.82):
                    raw_points.append(c)
        elif sec_type == "build":
            span = max(0.1, sec_end - sec_start)
            sub_beats = []
            for b in sec_beats:
                sub_beats.extend([b, round(b + beat_dur * 0.5, 4), round(b + beat_dur * 0.25, 4), round(b + beat_dur * 0.75, 4)])
            candidates = sorted(set(sub_beats + sec_trans))
            for c in candidates:
                if c <= sec_start or c >= sec_end:
                    continue
                prog = (c - sec_start) / span
                target_gap = 1.6 if prog < 0.35 else (0.75 if prog < 0.65 else (0.42 if prog < 0.82 else 0.25))
                target_gap = float(np.clip(target_gap, min_clip_dur, max_clip_dur))
                if c - raw_points[-1] >= target_gap:
                    raw_points.append(c)
        elif sec_type == "drop":
            sub_beats = []
            for b in sec_beats:
                sub_beats.extend([b, round(b + beat_dur * 0.5, 4), round(b + beat_dur * 0.25, 4)])
            candidates = sorted(set(sec_trans + sub_beats))
            for c in candidates:
                if c <= sec_start or c >= sec_end:
                    continue
                gap = c - raw_points[-1]
                is_transient = any(abs(c - tr) < 0.035 for tr in sec_trans)
                min_allowed = max(0.20, min_clip_dur)
                if (is_transient and gap >= min_allowed) or (gap >= min(max_clip_dur, max(min_allowed, 0.42))):
                    raw_points.append(c)
        else:
            candidates = sorted(set(sec_beats + sec_trans))
            for c in candidates:
                if c - raw_points[-1] >= max(min_clip_dur, min(max_clip_dur, beat_dur)):
                    raw_points.append(c)
    elif cut_mode == "2_bars":
        raw_points.extend(sec_bars[::2])
    elif cut_mode == "1_bar":
        raw_points.extend(sec_bars)
    elif cut_mode == "2_beats":
        raw_points.extend(sec_beats[::2])
    elif cut_mode == "1_beat":
        raw_points.extend(sec_beats)
    elif cut_mode == "1_or_2_bars_downbeat":
        step = 2 if len(sec_bars) >= 6 else 1
        raw_points.extend(sec_bars[::step])
    elif cut_mode == "2_beats_snare":
        cand_snares = [s for s in (snare_transients or []) if sec_start + 0.1 <= s <= sec_end - 0.1]
        if cand_snares:
            for s in cand_snares:
                if s - raw_points[-1] >= max(0.55, min_clip_dur):
                    raw_points.append(round(s, 4))
        else:
            raw_points.extend(sec_beats[::2])
    elif cut_mode == "ambient_long_drift":
        t_cur = sec_start
        target_hold = 7.5
        while t_cur < sec_end - 3.0:
            target_t = t_cur + target_hold
            near_bars = [b for b in sec_bars if abs(b - target_t) <= 1.5 and b > t_cur + 5.5]
            t_next = near_bars[0] if near_bars else target_t
            t_cur = round(float(t_next), 4)
            if t_cur < sec_end - 2.0:
                raw_points.append(t_cur)
        min_clip_dur = 6.0
        max_clip_dur = 10.0
    elif cut_mode == "snare_exclusive":
        cand_snares = [s for s in (snare_transients or []) if sec_start + 0.1 <= s <= sec_end - 0.1]
        if not cand_snares:
            cand_snares = [b for i, b in enumerate(sec_beats) if (i % 4) in (1, 3)]
        for s in cand_snares:
            if s - raw_points[-1] >= max(0.85, min_clip_dur):
                raw_points.append(round(s, 4))
    elif cut_mode == "energy_ramping":
        if sec_energy < 0.35 and sec_type not in ("build", "drop"):
            raw_points.extend(sec_bars[::4] if len(sec_bars) >= 8 else (sec_bars[::2] if len(sec_bars) >= 4 else sec_bars))
        elif sec_energy >= 0.70 or sec_type in ("build", "drop"):
            staccato_step = max(0.20, bar_dur * 0.25)
            candidates = sorted(set(sec_beats + list(np.arange(sec_start, sec_end, staccato_step))))
            for c in candidates:
                if c - raw_points[-1] >= max(0.22, min_clip_dur):
                    raw_points.append(round(c, 4))
        else:
            raw_points.extend(sec_bars[::2] if len(sec_bars) >= 4 else sec_bars)
    elif cut_mode == "transients_or_beat":
        candidates = sorted(set(sec_beats + sec_trans))
        for c in candidates:
            if c - raw_points[-1] >= min_clip_dur:
                raw_points.append(c)
    else:
        raw_points.extend(sec_bars)

    raw_points.append(sec_end)
    raw_points = sorted(set(round(float(p), 4) for p in raw_points if sec_start <= p <= sec_end))

    # Enforce min_clip_dur and max_clip_dur ceiling
    cleaned = [raw_points[0]]
    for p in raw_points[1:]:
        while p - cleaned[-1] > max_clip_dur + 0.05:
            nxt = round(cleaned[-1] + max_clip_dur, 4)
            if sec_end - nxt < min_clip_dur * 0.7:
                break
            cleaned.append(nxt)
        if p - cleaned[-1] >= min_clip_dur:
            cleaned.append(p)
        elif p == raw_points[-1]:
            cleaned[-1] = p

    if cleaned[-1] < sec_end - 0.05:
        cleaned.append(round(sec_end, 4))
    if len(cleaned) < 2:
        cleaned = [round(sec_start, 4), round(sec_end, 4)]
    return cleaned


def resolve_cut_transition(
    transition_mode: str,
    rule_default: str,
    cut_time: float,
    sec_type: str,
    slot_energy: float,
    snare_transients: list[float],
    kick_transients: list[float],
    event_index: int,
) -> tuple[str, bool]:
    if event_index == 0:
        return "hard_cut", False

    near_snare = any(abs(cut_time - st) <= 0.055 for st in snare_transients)
    near_kick = any(abs(cut_time - kt) <= 0.055 for kt in kick_transients)
    on_heavy_transient = near_snare or (near_kick and slot_energy >= 0.62)

    if transition_mode in ("hard_cut", "flash_white", "quick_glitch", "soft_dissolve"):
        return transition_mode, on_heavy_transient

    if rule_default == "soft_dissolve":
        return "soft_dissolve", on_heavy_transient

    if on_heavy_transient:
        if near_snare and (sec_type in ("drop", "build") or event_index % 2 == 0):
            return "flash_white", True
        return "quick_glitch", True

    if sec_type == "drop" and slot_energy >= 0.78 and event_index % 3 == 0:
        return ("quick_glitch" if event_index % 2 == 0 else "flash_white"), False

    return "hard_cut", False


def _find_section_at_time(sections: list[dict], t: float) -> dict:
    for s in sections:
        if float(s.get("start", 0.0)) <= t + 0.01 <= float(s.get("end", 9999.0)):
            return s
    return sections[-1] if sections else {"id": "sec_0", "type": "chorus", "label": "Main", "energy": 0.6}


def build_story_spine_preserved_timeline(
    audio_analysis: dict,
    story_spine: list[dict],
    broll_pool: list[dict],
    template: dict,
    sections: list[dict],
    fx_intensity: float = 1.0,
    transition_mode: str = "auto_intensity",
    story_vs_chop: float = 0.50,
    style_fx: str = "clean",
    sorting_logic: str = "story_spine",
    exhaustion_mode: str = "loop_vary_motion",
) -> dict:
    """
    Chronological Story Spine + Scene Cluster Montage + Preserve Full AI Clip Duration Engine:
      - Plays Story Spine / Anchor clips in numbered order (#01 -> #02 -> #03...) from song start to finish.
      - Never cuts an anchor clip short before its ending frames resolve (`in_point` progresses 0.0 -> full `clip_duration`).
      - In 'scene_cluster' mode ("Scene Cluster Montage"), pairs anchor 01_video with rapid 01_a / 01_b image stabs
        on hi-hat & snare fills!
    """
    total_dur = float(audio_analysis.get("duration", 24.0))
    bpm = float(audio_analysis.get("bpm", 120.0))
    snare_transients = audio_analysis.get("snare_transients", [])
    kick_transients = audio_analysis.get("kick_transients", [])
    downbeats = audio_analysis.get("downbeats", [])
    all_transients = sorted(set(snare_transients + kick_transients))

    chop = float(np.clip(story_vs_chop, 0.0, 1.0))
    fx_scale = float(np.clip(fx_intensity, 0.0, 2.0))

    timeline_events = []
    usage_counts = {c["id"]: 0 for c in (story_spine + broll_pool)}
    event_index = 0

    t_curr = 0.0
    spine_idx = 0
    n_spine = len(story_spine)

    while t_curr < total_dur - 0.04:
        pass_num = spine_idx // n_spine if n_spine > 0 else 0
        if exhaustion_mode == "hold_last":
            actual_clip_idx = min(spine_idx, n_spine - 1)
        elif exhaustion_mode == "ping_pong":
            cycle_len = max(1, 2 * n_spine - 2)
            c_mod = spine_idx % cycle_len
            actual_clip_idx = c_mod if c_mod < n_spine else cycle_len - c_mod
        else:
            # "loop_vary_motion" (default auto-wrap)
            actual_clip_idx = spine_idx % n_spine

        story_clip = story_spine[actual_clip_idx]
        story_dur = float(story_clip.get("duration", 4.0))
        story_cursor = 0.0
        usage_counts[story_clip["id"]] = usage_counts.get(story_clip["id"], 0) + 1
        anchor_cluster_id = story_clip.get("cluster_id") or story_clip.get("sequence_order")

        while story_cursor < story_dur - 0.04 and t_curr < total_dur - 0.04:
            rem_story = story_dur - story_cursor
            rem_song = total_dur - t_curr
            seg_max_dur = min(rem_story, rem_song)

            sec = _find_section_at_time(sections, t_curr)
            sec_type = sec.get("type", "verse").lower()
            sec_energy = float(sec.get("energy", 0.5))
            rules = template["section_rules"].get(sec_type, template["section_rules"]["verse"])

            next_transient = None
            if chop > 0.05 and seg_max_dur > 0.70:
                sec_boost = 1.35 if sec_type in ("drop", "build") else (1.0 if sec_type == "chorus" else 0.55)
                effective_chop = min(1.0, chop * sec_boost)
                if effective_chop >= 0.12:
                    min_story_hold = max(0.40, 2.6 - effective_chop * 2.0)
                    search_start = t_curr + min_story_hold
                    search_end = t_curr + seg_max_dur - 0.30
                    if search_end > search_start:
                        cand_snares = [st for st in snare_transients if search_start <= st <= search_end]
                        cand_all = [tr for tr in all_transients if search_start <= tr <= search_end]
                        pool = cand_snares if cand_snares else (cand_all if effective_chop > 0.40 else [])
                        if pool:
                            next_transient = float(pool[0])

            play_until = next_transient if next_transient is not None else (t_curr + seg_max_dur)
            seg_dur = round(play_until - t_curr, 4)

            if seg_dur > 0.04:
                media_type = story_clip.get("media_type", "video")
                if media_type == "image":
                    # Randomize / vary Ken Burns motion across passes
                    kb_preset = KEN_BURNS_PRESETS[(actual_clip_idx + pass_num * 2 + event_index) % len(KEN_BURNS_PRESETS)]
                else:
                    kb_preset = None
                trans_type, is_trig = resolve_cut_transition(
                    transition_mode=transition_mode,
                    rule_default=rules["transition"],
                    cut_time=t_curr,
                    sec_type=sec_type,
                    slot_energy=sec_energy,
                    snare_transients=snare_transients,
                    kick_transients=kick_transients,
                    event_index=event_index,
                )
                base_fx = rules["fx"]
                is_downbeat = any(abs(t_curr - db) <= 0.06 for db in downbeats)
                event_fx = {
                    "bass_zoom": round(min(1.5, base_fx["bass_zoom"] * fx_scale), 2),
                    "snare_flash": round(min(1.5, base_fx["snare_flash"] * fx_scale), 2),
                    "shake": round(min(1.5, base_fx["shake"] * fx_scale), 2),
                    "rgb_split": round(min(1.5, base_fx["rgb_split"] * fx_scale), 2),
                    "speed_ramp": False,
                    "style_fx": style_fx,
                    "downbeat_punch": is_downbeat,
                }

                seq_num = story_clip.get("sequence_order") or (spine_idx + 1)
                resume_tag = " (Resumed)" if story_cursor > 0.05 else ""
                role_label = "Cluster Anchor" if sorting_logic == "scene_cluster" else "Story Spine"
                timeline_events.append({
                    "index": event_index,
                    "role": "story_spine",
                    "style_fx": style_fx,
                    "start": round(t_curr, 4),
                    "end": round(t_curr + seg_dur, 4),
                    "duration": round(seg_dur, 4),
                    "section_id": sec.get("id", "sec_0"),
                    "section_type": sec_type,
                    "section_label": sec.get("label", sec_type.title()),
                    "clip_id": story_clip["id"],
                    "clip_filename": story_clip["filename"],
                    "media_type": media_type,
                    "ken_burns": kb_preset,
                    "clip_thumbnail": story_clip["thumbnail"],
                    "clip_url": f"/workspace/clips/{story_clip['filename']}",
                    "clip_duration": story_dur,
                    "in_point": round(story_cursor, 3),
                    "out_point": round(story_cursor + seg_dur, 3),
                    "target_energy": round(sec_energy, 3),
                    "clip_energy": story_clip.get("motion_score", 0.5),
                    "match_score": 0.98,
                    "match_reason": f"{role_label} #{seq_num:02d}{resume_tag} [{story_cursor:.2f}s→{story_cursor+seg_dur:.2f}s / {story_dur:.1f}s]",
                    "vibe_tags": story_clip.get("vibe_tags", [])[:5],
                    "transition": trans_type,
                    "transient_triggered": is_trig,
                    "fx": event_fx,
                })
                event_index += 1
                t_curr = round(t_curr + seg_dur, 4)
                story_cursor = round(story_cursor + seg_dur, 4)

            if next_transient is not None and t_curr < total_dur - 0.30 and story_cursor < story_dur - 0.15:
                # In Scene Cluster Montage, fire a rapid 1-to-2 image stab burst (01_a / 01_b) on hi-hat/snare fills!
                num_stabs = 2 if (sorting_logic == "scene_cluster" and sec_type in ("drop", "build") and (total_dur - t_curr) > 0.55) else 1
                for stab_k in range(num_stabs):
                    stab_dur = round(min(0.22 if num_stabs == 2 else 0.26, total_dur - t_curr), 4)
                    if stab_dur <= 0.05:
                        break

                    # Match same-cluster companion stills (e.g. 01_a, 01_b) first if available, else any still image or B-roll
                    same_cluster_stills = [
                        c for c in broll_pool
                        if c["id"] != story_clip["id"] and (c.get("cluster_id") == anchor_cluster_id or c.get("media_type") == "image")
                    ]
                    cutaway_candidates = same_cluster_stills or [c for c in broll_pool if c["id"] != story_clip["id"]] or [story_clip]
                    cutaway_clip = cutaway_candidates[(event_index + spine_idx + stab_k) % len(cutaway_candidates)]
                    usage_counts[cutaway_clip["id"]] = usage_counts.get(cutaway_clip["id"], 0) + 1

                    c_dur = float(cutaway_clip.get("duration", 4.0))
                    c_in = float(cutaway_clip.get("best_start_sec", 0.0))
                    if c_in + stab_dur > c_dur:
                        c_in = 0.0
                    c_media_type = cutaway_clip.get("media_type", "video")
                    c_kb = KEN_BURNS_PRESETS[(event_index + stab_k) % len(KEN_BURNS_PRESETS)] if c_media_type == "image" else None

                    stab_trans = "flash_white" if (event_index + stab_k) % 2 == 0 else "quick_glitch"
                    if transition_mode in ("hard_cut", "flash_white", "quick_glitch", "soft_dissolve"):
                        stab_trans = transition_mode

                    base_fx = rules["fx"]
                    stab_fx = {
                        "bass_zoom": round(min(1.5, max(0.85, base_fx["bass_zoom"]) * fx_scale), 2),
                        "snare_flash": round(min(1.5, max(0.85, base_fx["snare_flash"]) * fx_scale), 2),
                        "shake": round(min(1.5, max(0.65, base_fx["shake"]) * fx_scale), 2),
                        "rgb_split": round(min(1.5, max(0.80, base_fx["rgb_split"]) * fx_scale), 2),
                        "speed_ramp": True if c_media_type == "video" else False,
                        "style_fx": style_fx,
                        "downbeat_punch": True,
                    }

                    stab_label = "🧩 Cluster Image Stab" if sorting_logic == "scene_cluster" else "⚡ Transient Cutaway Stab"
                    timeline_events.append({
                        "index": event_index,
                        "role": "cutaway_stab",
                        "style_fx": style_fx,
                        "start": round(t_curr, 4),
                        "end": round(t_curr + stab_dur, 4),
                        "duration": round(stab_dur, 4),
                        "section_id": sec.get("id", "sec_0"),
                        "section_type": sec_type,
                        "section_label": sec.get("label", sec_type.title()),
                        "clip_id": cutaway_clip["id"],
                        "clip_filename": cutaway_clip["filename"],
                        "media_type": c_media_type,
                        "ken_burns": c_kb,
                        "clip_thumbnail": cutaway_clip["thumbnail"],
                        "clip_url": f"/workspace/clips/{cutaway_clip['filename']}",
                        "clip_duration": c_dur,
                        "in_point": round(c_in, 3),
                        "out_point": round(min(c_dur, c_in + stab_dur), 3),
                        "target_energy": 0.95,
                        "clip_energy": cutaway_clip.get("motion_score", 0.7),
                        "match_score": 0.95,
                        "match_reason": f"{stab_label} (Returns to #{story_clip.get('sequence_order') or (spine_idx+1):02d} @ {story_cursor:.2f}s)",
                        "vibe_tags": cutaway_clip.get("vibe_tags", [])[:5],
                        "transition": stab_trans,
                        "transient_triggered": True,
                        "fx": stab_fx,
                    })
                    event_index += 1
                    t_curr = round(t_curr + stab_dur, 4)

        spine_idx += 1

    return {
        "template_id": template["id"],
        "template_name": template["name"],
        "style_fx": style_fx,
        "sorting_logic": sorting_logic,
        "motion_behavior": template.get("motion_behavior", "natural_ken_burns"),
        "min_cut_floor": float(template.get("min_cut_floor", 0.25)),
        "max_cut_ceiling": float(template.get("max_cut_ceiling", 8.0)),
        "fx_intensity": round(float(fx_intensity), 2),
        "transition_mode": transition_mode,
        "story_spine_active": True,
        "preserve_full_duration": True,
        "story_vs_chop": round(chop, 2),
        "total_duration": total_dur,
        "bpm": bpm,
        "cut_count": len(timeline_events),
        "unique_clips_used": sum(1 for v in usage_counts.values() if v > 0),
        "events": timeline_events,
    }


def _merge_pinned_events_into_timeline(
    auto_events: list[dict],
    pinned_events: list[dict] | None,
) -> list[dict]:
    """
    Preserve Pinned / Locked cut blocks when Splice Edit is recalculated.
    Any auto-generated event overlapping a pinned block [p_start, p_end] is trimmed or split
    around the pinned block so pinned blocks remain untouched.
    """
    if not pinned_events:
        return auto_events

    valid_pins = []
    for p in pinned_events:
        if not isinstance(p, dict) or not p.get("pinned"):
            continue
        p_copy = dict(p)
        p_copy["pinned"] = True
        p_copy["start"] = round(float(p_copy.get("start", 0.0)), 4)
        p_copy["end"] = round(float(p_copy.get("end", p_copy["start"] + 1.0)), 4)
        p_copy["duration"] = round(max(0.05, p_copy["end"] - p_copy["start"]), 4)
        valid_pins.append(p_copy)

    if not valid_pins:
        return auto_events

    valid_pins.sort(key=lambda x: x["start"])
    remaining = list(auto_events)

    for pin in valid_pins:
        p0, p1 = pin["start"], pin["end"]
        next_rem = []
        for ev in remaining:
            e0, e1 = float(ev["start"]), float(ev["end"])
            if e1 <= p0 + 0.01 or e0 >= p1 - 0.01:
                next_rem.append(ev)
                continue
            # Left remnant before pinned block
            if e0 < p0 - 0.08:
                left_ev = dict(ev)
                left_dur = round(p0 - e0, 4)
                left_ev["start"] = round(e0, 4)
                left_ev["end"] = round(p0, 4)
                left_ev["duration"] = left_dur
                left_ev["out_point"] = round(min(float(left_ev.get("clip_duration", 5.0)), float(left_ev.get("in_point", 0.0)) + left_dur), 3)
                next_rem.append(left_ev)
            # Right remnant after pinned block
            if e1 > p1 + 0.08:
                right_ev = dict(ev)
                right_dur = round(e1 - p1, 4)
                offset_in = max(0.0, p1 - e0)
                new_in = round(float(right_ev.get("in_point", 0.0)) + offset_in, 3)
                c_dur = float(right_ev.get("clip_duration", 5.0))
                if right_ev.get("media_type") != "image" and new_in >= c_dur:
                    new_in = round(new_in % max(0.5, c_dur), 3)
                right_ev["start"] = round(p1, 4)
                right_ev["end"] = round(e1, 4)
                right_ev["duration"] = right_dur
                right_ev["in_point"] = new_in
                right_ev["out_point"] = round(min(c_dur, new_in + right_dur), 3)
                next_rem.append(right_ev)
        remaining = next_rem

    merged = sorted(remaining + valid_pins, key=lambda x: (float(x["start"]), 0 if x.get("pinned") else 1))
    for i, ev in enumerate(merged):
        ev["index"] = i
    return merged


def _enrich_timeline_with_avant_garde_metadata(
    tl: dict,
    clips: list[dict],
    template: dict,
    sprocket_slip: bool | None = None,
    typographic_flashes: bool | None = None,
    step_print_12fps: bool | None = None,
    fold_in_columns: int | None = None,
    subliminal_sigil_flash: bool | None = None,
    obsidian_scrying_vignette: bool | None = None,
    thelemic_dye_bloom: bool | None = None,
    cosmic_static_glitch: bool | None = None,
    geometric_echo_tunnel: bool | None = None,
) -> dict:
    eff_sprocket = bool(template.get("sprocket_slip", False) if sprocket_slip is None else sprocket_slip)
    eff_typo = bool(template.get("typographic_flashes", False) if typographic_flashes is None else typographic_flashes)
    eff_step12 = bool(template.get("step_print_12fps", False) if step_print_12fps is None else step_print_12fps)
    eff_rev_stutter = bool(template.get("reverse_stutter", False))
    eff_fold_cols = int(template.get("fold_in_columns", 1) if fold_in_columns is None else fold_in_columns)

    eff_sigil = bool(template.get("subliminal_sigil_flash", False) if subliminal_sigil_flash is None else subliminal_sigil_flash)
    eff_scrying = bool(template.get("obsidian_scrying_vignette", False) if obsidian_scrying_vignette is None else obsidian_scrying_vignette)
    eff_thelemic = bool(template.get("thelemic_dye_bloom", False) if thelemic_dye_bloom is None else thelemic_dye_bloom)
    eff_cosmic = bool(template.get("cosmic_static_glitch", False) if cosmic_static_glitch is None else cosmic_static_glitch)
    eff_echo = bool(template.get("geometric_echo_tunnel", False) if geometric_echo_tunnel is None else geometric_echo_tunnel)

    tl["category"] = template.get("category", "core")
    tl["sprocket_slip"] = eff_sprocket
    tl["typographic_flashes"] = eff_typo
    tl["step_print_12fps"] = eff_step12
    tl["reverse_stutter"] = eff_rev_stutter
    tl["fold_in_columns"] = eff_fold_cols
    tl["subliminal_sigil_flash"] = eff_sigil
    tl["obsidian_scrying_vignette"] = eff_scrying
    tl["thelemic_dye_bloom"] = eff_thelemic
    tl["cosmic_static_glitch"] = eff_cosmic
    tl["geometric_echo_tunnel"] = eff_echo

    events = tl.get("events", [])
    n_clips = len(clips)
    still_clips = [c for c in clips if c.get("media_type") == "image"] or clips

    for idx, ev in enumerate(events):
        ev["index"] = idx
        fx = ev.setdefault("fx", {})
        fx["sprocket_slip"] = eff_sprocket
        fx["typographic_flashes"] = eff_typo
        fx["step_print_12fps"] = eff_step12
        fx["reverse_stutter"] = eff_rev_stutter
        fx["fold_in_columns"] = eff_fold_cols
        fx["subliminal_sigil_flash"] = eff_sigil
        fx["obsidian_scrying_vignette"] = eff_scrying
        fx["thelemic_dye_bloom"] = eff_thelemic
        fx["cosmic_static_glitch"] = eff_cosmic
        fx["geometric_echo_tunnel"] = eff_echo

        ev["sprocket_slip"] = eff_sprocket
        ev["typographic_flashes"] = eff_typo
        ev["step_print_12fps"] = eff_step12
        ev["reverse_stutter"] = eff_rev_stutter
        ev["fold_in_columns"] = eff_fold_cols
        ev["subliminal_sigil_flash"] = eff_sigil
        ev["obsidian_scrying_vignette"] = eff_scrying
        ev["thelemic_dye_bloom"] = eff_thelemic
        ev["cosmic_static_glitch"] = eff_cosmic
        ev["geometric_echo_tunnel"] = eff_echo
        ev.setdefault("typo_phrase", BURROUGHS_PHRASES[idx % len(BURROUGHS_PHRASES)])

        # Manual Workbench / Cut Inspector per-shot overrides (preserved if already set)
        ev.setdefault("pinned", False)
        ev.setdefault("reverse", False)
        ev.setdefault("ping_pong", False)
        ev.setdefault("optical_treatment", "none")
        ev.setdefault("prism_mirror", False)

        # Adjacent clip reference for Structural Flicker (Sharits / Conrad) & Enochian Scrying Soft Dissolves
        adj_ev = events[(idx + 1) % len(events)] if len(events) > 1 else ev
        ev["adjacent_clip_filename"] = adj_ev["clip_filename"]
        ev["adjacent_clip_url"] = adj_ev["clip_url"]
        ev["adjacent_media_type"] = adj_ev.get("media_type", "video")
        ev["adjacent_in_point"] = adj_ev.get("in_point", 0.0)

        # Subliminal 1-Frame Sigil / Glyph Still Reference (Austin Osman Spare / IOT)
        if still_clips:
            sigil_clip = still_clips[idx % len(still_clips)]
            ev["sigil_clip_filename"] = sigil_clip["filename"]
            ev["sigil_clip_url"] = f"/workspace/clips/{sigil_clip['filename']}"
            ev["sigil_media_type"] = sigil_clip.get("media_type", "image")

        # Burroughs 3-Column Fold-In asynchronous companion streams
        if eff_fold_cols == 3 and n_clips > 0:
            left_clip = clips[(idx + 1) % n_clips]
            right_clip = clips[(idx + 2) % n_clips] if n_clips > 2 else clips[(idx + 1) % n_clips]
            ev["fold_in_clips"] = [
                {
                    "col": "left",
                    "clip_id": left_clip["id"],
                    "clip_filename": left_clip["filename"],
                    "clip_url": f"/workspace/clips/{left_clip['filename']}",
                    "media_type": left_clip.get("media_type", "video"),
                    "clip_duration": float(left_clip.get("duration", 4.0)),
                    "in_point": round((float(left_clip.get("best_start_sec", 0.0)) + idx * 0.65) % max(0.5, float(left_clip.get("duration", 4.0)) * 0.7), 3),
                    "rate": 0.88,
                },
                {
                    "col": "right",
                    "clip_id": right_clip["id"],
                    "clip_filename": right_clip["filename"],
                    "clip_url": f"/workspace/clips/{right_clip['filename']}",
                    "media_type": right_clip.get("media_type", "video"),
                    "clip_duration": float(right_clip.get("duration", 4.0)),
                    "in_point": round((float(right_clip.get("best_start_sec", 0.0)) + idx * 1.15) % max(0.5, float(right_clip.get("duration", 4.0)) * 0.7), 3),
                    "rate": 1.14,
                },
            ]
        else:
            ev["fold_in_clips"] = []

    tl["cut_count"] = len(events)
    return tl


def build_automated_timeline(
    audio_analysis: dict,
    clips: list[dict],
    template_id: str = "narrative_storyboard",
    global_prompt: str = "",
    section_overrides: list[dict] | None = None,
    fx_intensity: float = 1.0,
    min_clip_duration: float = 0.25,
    transition_mode: str = "auto_intensity",
    preserve_full_duration: bool = False,
    story_vs_chop: float = 0.50,
    use_story_spine: bool = True,
    sprocket_slip: bool | None = None,
    typographic_flashes: bool | None = None,
    step_print_12fps: bool | None = None,
    fold_in_columns: int | None = None,
    subliminal_sigil_flash: bool | None = None,
    obsidian_scrying_vignette: bool | None = None,
    thelemic_dye_bloom: bool | None = None,
    cosmic_static_glitch: bool | None = None,
    geometric_echo_tunnel: bool | None = None,
    pinned_events: list[dict] | None = None,
    exhaustion_mode: str = "loop_vary_motion",
) -> dict:
    """
    Assemble a complete beat-synced, AI-matched, audio-reactive video timeline
    driven by the 21-Preset Core + Avant-Garde / Auteur + Esoteric & Occult Style Engine.
    Preserves any Pinned / Locked cut blocks (`pinned=True`) across recalculations.
    """
    if not clips and template_id != "manual_workbench_slate":
        raise ValueError("Please upload at least one video clip or image to generate an edit.")

    bank = load_preset_bank()
    template = bank.get(template_id) or next(iter(bank.values()))
    style_fx = template.get("style_fx", "clean")
    sorting_logic = template.get("sorting_logic", "story_spine")
    preset_floor = float(template.get("min_cut_floor", 0.25))
    preset_ceiling = float(template.get("max_cut_ceiling", 8.0))
    chop = float(np.clip(story_vs_chop, 0.0, 1.0))

    # Manual Workbench (Empty Slate) preset: loads audio waveform without auto-cuts (keeping only pinned blocks)
    if template_id == "manual_workbench_slate" or sorting_logic == "manual_empty_slate":
        kept_pins = _merge_pinned_events_into_timeline([], pinned_events)
        tl = {
            "template_id": template["id"],
            "template_name": template["name"],
            "style_fx": style_fx,
            "sorting_logic": "manual_empty_slate",
            "motion_behavior": template.get("motion_behavior", "natural_ken_burns"),
            "min_cut_floor": preset_floor,
            "max_cut_ceiling": preset_ceiling,
            "fx_intensity": round(float(fx_intensity), 2),
            "transition_mode": transition_mode,
            "story_spine_active": False,
            "preserve_full_duration": False,
            "story_vs_chop": round(chop, 2),
            "total_duration": float(audio_analysis.get("duration", 24.0)),
            "bpm": float(audio_analysis.get("bpm", 120.0)),
            "cut_count": len(kept_pins),
            "unique_clips_used": len({e.get("clip_id") for e in kept_pins if e.get("clip_id")}),
            "events": kept_pins,
        }
        return _enrich_timeline_with_avant_garde_metadata(
            tl,
            clips,
            template,
            sprocket_slip,
            typographic_flashes,
            step_print_12fps,
            fold_in_columns,
            subliminal_sigil_flash,
            obsidian_scrying_vignette,
            thelemic_dye_bloom,
            cosmic_static_glitch,
            geometric_echo_tunnel,
        )

    sections = section_overrides if section_overrides else audio_analysis.get("sections", [])
    story_spine, broll_pool = detect_story_spine(clips, sorting_logic=sorting_logic)
    has_spine = bool(use_story_spine and len(story_spine) >= 2 and sorting_logic in ("story_spine", "scene_cluster"))

    if preserve_full_duration:
        ordered_spine = story_spine if has_spine else clips
        tl = build_story_spine_preserved_timeline(
            audio_analysis=audio_analysis,
            story_spine=ordered_spine,
            broll_pool=broll_pool if has_spine else clips,
            template=template,
            sections=sections,
            fx_intensity=fx_intensity,
            transition_mode=transition_mode,
            story_vs_chop=chop,
            style_fx=style_fx,
            sorting_logic=sorting_logic,
            exhaustion_mode=exhaustion_mode,
        )
        tl["events"] = _merge_pinned_events_into_timeline(tl.get("events", []), pinned_events)
        return _enrich_timeline_with_avant_garde_metadata(
            tl,
            clips,
            template,
            sprocket_slip,
            typographic_flashes,
            step_print_12fps,
            fold_in_columns,
            subliminal_sigil_flash,
            obsidian_scrying_vignette,
            thelemic_dye_bloom,
            cosmic_static_glitch,
            geometric_echo_tunnel,
        )

    beats = audio_analysis.get("beats", [])
    downbeats = audio_analysis.get("downbeats", [])
    snare_transients = audio_analysis.get("snare_transients", [])
    kick_transients = audio_analysis.get("kick_transients", [])
    transients = snare_transients or audio_analysis.get("transients", [])
    bpm = float(audio_analysis.get("bpm", 120.0))

    # Effective cut floor respects both user slider and preset bounds
    effective_min_dur = max(min_clip_duration, preset_floor * (1.0 - 0.55 * max(0.0, chop - 0.5)))
    if preset_ceiling <= 0.55 or sorting_logic in ("fibonacci_metric", "mekas_burst_hold", "dialectical_debord", "thelemic_7_11", "carcosa_long_jarring"):
        effective_min_dur = max(0.14, min(min_clip_duration, preset_floor))
    effective_max_dur = max(effective_min_dur + 0.10, preset_ceiling)

    usage_counts = {c["id"]: 0 for c in clips}
    last_used_ids: list[str] = []
    timeline_events = []
    event_index = 0
    spine_cursor_idx = 0

    anti_repeat_window = min(4, max(0, len(clips) - 1))

    # For Marker Photo-Montage (La Jetée): Stills-only except at peak loudness section
    still_pool = [c for c in clips if c.get("media_type") == "image"]
    video_pool = [c for c in clips if c.get("media_type") != "image"]
    peak_sec_id = None
    if sorting_logic == "la_jetee_stills_plus_peak_video" and sections:
        peak_sec = max(sections, key=lambda s: (1.0 if s.get("type") == "drop" else 0.0, float(s.get("energy", 0.5))))
        peak_sec_id = peak_sec.get("id")
    peak_video_used = False

    for sec in sections:
        sec_type = sec.get("type", "verse").lower()
        sec_start = float(sec.get("start", 0.0))
        sec_end = float(sec.get("end", sec_start + 4.0))
        sec_energy = float(sec.get("energy", 0.5))
        sec_prompt = sec.get("prompt", "")
        rules = template["section_rules"].get(sec_type, template["section_rules"]["verse"])
        cut_mode = sec.get("cut_mode") or rules["cut_mode"]

        cut_points = generate_section_cut_points(
            sec_start=sec_start,
            sec_end=sec_end,
            sec_type=sec_type,
            sec_energy=sec_energy,
            cut_mode=cut_mode,
            beats=beats,
            downbeats=downbeats,
            transients=transients,
            kick_transients=kick_transients,
            bpm=bpm,
            min_clip_dur=effective_min_dur,
            max_clip_dur=effective_max_dur,
            snare_transients=snare_transients,
        )

        num_slots = max(1, len(cut_points) - 1)
        e_low, e_high = rules["target_energy"]

        for slot_i in range(num_slots):
            t0 = cut_points[slot_i]
            t1 = cut_points[slot_i + 1]
            slot_dur = round(t1 - t0, 4)
            if slot_dur <= 0.05:
                continue

            slot_prog = slot_i / max(1, num_slots - 1)
            target_e = (e_low + slot_prog * (e_high - e_low)) if sec_type == "build" else (0.5 * (e_low + e_high))

            near_transient = any(abs(t0 - tr) <= 0.055 for tr in snare_transients)
            is_cutaway_slot = bool(has_spine and near_transient and slot_dur <= 0.55 and chop >= 0.35 and (event_index % 3 == 1))

            # Marker Photo-Montage (La Jetée): Stills across bars, awakening into 1 moving video at peak loudness
            if sorting_logic == "la_jetee_stills_plus_peak_video":
                is_peak_slot = (not peak_video_used) and (sec.get("id") == peak_sec_id) and (slot_i == 0)
                if is_peak_slot and video_pool:
                    chosen = max(video_pool, key=lambda x: float(x.get("motion_score", 0.5)))
                    best_score = 0.99
                    best_reason = "🖼️ La Jetée Peak Loudness Awakening (Moving Video)"
                    peak_video_used = True
                else:
                    pool = still_pool if still_pool else clips
                    chosen = pool[event_index % len(pool)]
                    best_score = 0.94
                    best_reason = "🖼️ La Jetée Photo-Montage Still Hold"
            elif has_spine and not is_cutaway_slot:
                chosen = story_spine[spine_cursor_idx % len(story_spine)]
                seq_num = chosen.get("sequence_order") or (spine_cursor_idx + 1)
                best_score = 0.96
                best_reason = f"Story Spine #{seq_num:02d} ({template['name']})"
                spine_cursor_idx += 1
            else:
                recent_forbidden = set(last_used_ids[-anti_repeat_window:]) if anti_repeat_window > 0 else set()
                any_unused_available = any(
                    usage_counts[c["id"]] == 0 and c["id"] not in recent_forbidden
                    for c in clips
                )

                best_clip = None
                best_score = -999.0
                best_reason = ""

                for c in clips:
                    cid = c["id"]
                    if cid in recent_forbidden:
                        continue

                    is_unused = usage_counts.get(cid, 0) == 0
                    unused_bonus = 0.45 if (any_unused_available and is_unused) else 0.0

                    sem_score = compute_semantic_match_score(c, sec_prompt, global_prompt)
                    rec_secs = c.get("recommended_sections", [])
                    sec_fit = 1.0 if sec_type in rec_secs else 0.45
                    mot_diff = abs(float(c.get("motion_score", 0.5)) - target_e)
                    energy_fit = max(0.0, 1.0 - mot_diff * 1.35)

                    style_bonus = 0.0
                    if sorting_logic == "dark_low_luma":
                        style_bonus = (1.0 - float(c.get("brightness", 0.5))) * 0.25
                    elif sorting_logic == "high_energy":
                        style_bonus = float(c.get("motion_score", 0.5)) * 0.22
                    elif sorting_logic in ("vibe_warm", "thelemic_7_11", "carcosa_long_jarring"):
                        if any(t in c.get("vibe_tags", []) for t in ("warm", "golden", "dreamy", "calm", "still-image")):
                            style_bonus = 0.20

                    usage_penalty = min(0.40, usage_counts.get(cid, 0) * (0.50 / max(1, len(clips))))
                    tie_jitter = ((event_index * 17 + len(cid)) % 11) * 0.004

                    total_score = (
                        0.32 * sem_score
                        + 0.18 * sec_fit
                        + 0.24 * energy_fit
                        + 0.16 * (1.0 - usage_penalty)
                        + unused_bonus
                        + style_bonus
                        + tie_jitter
                    )

                    if total_score > best_score:
                        best_score = total_score
                        best_clip = c
                        reasons = [template["name"]]
                        if is_unused:
                            reasons.append("Fresh Media")
                        if energy_fit > 0.70:
                            reasons.append(f"Energy {int(c.get('motion_score', 0.5)*100)}%")
                        best_reason = " • ".join(reasons)

                chosen = best_clip or clips[event_index % len(clips)]

            cid = chosen["id"]
            use_num = usage_counts[cid]
            usage_counts[cid] += 1
            last_used_ids.append(cid)

            media_type = chosen.get("media_type", "video")
            clip_dur = float(chosen.get("duration", 5.0))
            base_start = float(chosen.get("best_start_sec", 0.0))

            if media_type == "image":
                in_point = 0.0
                if exhaustion_mode == "hold_last" and use_num > 0:
                    kb_preset = chosen.get("ken_burns_preset") or "zoom_in_center"
                elif exhaustion_mode == "ping_pong" and (use_num % 2 == 1):
                    # Alternate zoom-in / zoom-out pairs on ping pong
                    kb_preset = KEN_BURNS_PRESETS[(event_index + use_num * 3 + 1) % len(KEN_BURNS_PRESETS)]
                else:
                    # Loop & Vary Motion: dynamically shift motion parameters on every pass
                    kb_preset = "drift_left_to_right" if style_fx == "vhs_tape" else KEN_BURNS_PRESETS[(event_index + use_num * 2) % len(KEN_BURNS_PRESETS)]
            else:
                kb_preset = None
                if clip_dur > slot_dur + 0.25:
                    max_start = max(0.0, clip_dur - slot_dur - 0.05)
                    offset = (use_num * max(1.1, slot_dur * 0.85)) % max(0.1, max_start) if use_num > 0 else 0.0
                    in_point = round(min(max_start, (base_start + offset) % max(0.1, max_start)), 3)
                else:
                    in_point = 0.0

            resolved_trans, is_transient_trig = resolve_cut_transition(
                transition_mode=transition_mode,
                rule_default=rules["transition"],
                cut_time=t0,
                sec_type=sec_type,
                slot_energy=target_e,
                snare_transients=snare_transients,
                kick_transients=kick_transients,
                event_index=event_index,
            )

            is_downbeat = any(abs(t0 - db) <= 0.06 for db in downbeats)
            base_fx = rules["fx"]
            fx_scale = float(np.clip(fx_intensity, 0.0, 2.0))
            event_fx = {
                "bass_zoom": round(min(1.5, base_fx["bass_zoom"] * fx_scale), 2),
                "snare_flash": round(min(1.5, base_fx["snare_flash"] * fx_scale), 2),
                "shake": round(min(1.5, base_fx["shake"] * fx_scale), 2),
                "rgb_split": round(min(1.5, base_fx["rgb_split"] * fx_scale), 2),
                "speed_ramp": bool(base_fx["speed_ramp"] and fx_scale >= 0.4 and media_type == "video"),
                "style_fx": style_fx,
                "downbeat_punch": is_downbeat,
            }

            timeline_events.append({
                "index": event_index,
                "role": "cutaway_stab" if is_cutaway_slot else ("story_spine" if has_spine else "beat_cut"),
                "style_fx": style_fx,
                "downbeat_punch": is_downbeat,
                "start": round(t0, 4),
                "end": round(t1, 4),
                "duration": round(slot_dur, 4),
                "section_id": sec.get("id", "sec_0"),
                "section_type": sec_type,
                "section_label": sec.get("label", sec_type.title()),
                "clip_id": cid,
                "clip_filename": chosen["filename"],
                "media_type": media_type,
                "ken_burns": kb_preset,
                "clip_thumbnail": chosen["thumbnail"],
                "clip_url": f"/workspace/clips/{chosen['filename']}",
                "clip_duration": clip_dur,
                "in_point": in_point,
                "out_point": round(min(clip_dur, in_point + slot_dur), 3),
                "target_energy": round(target_e, 3),
                "clip_energy": chosen.get("motion_score", 0.5),
                "match_score": round(float(np.clip(best_score, 0.1, 0.99)), 2),
                "match_reason": best_reason,
                "vibe_tags": chosen.get("vibe_tags", [])[:5],
                "transition": resolved_trans,
                "transient_triggered": is_transient_trig,
                "fx": event_fx,
            })
            event_index += 1

    timeline_events = _merge_pinned_events_into_timeline(timeline_events, pinned_events)

    tl = {
        "template_id": template["id"],
        "template_name": template["name"],
        "style_fx": style_fx,
        "sorting_logic": sorting_logic,
        "motion_behavior": template.get("motion_behavior", "natural_ken_burns"),
        "min_cut_floor": effective_min_dur,
        "max_cut_ceiling": effective_max_dur,
        "fx_intensity": round(float(fx_intensity), 2),
        "transition_mode": transition_mode,
        "story_spine_active": has_spine,
        "preserve_full_duration": False,
        "story_vs_chop": round(chop, 2),
        "total_duration": audio_analysis.get("duration", 0.0),
        "bpm": bpm,
        "cut_count": len(timeline_events),
        "unique_clips_used": sum(1 for v in usage_counts.values() if v > 0),
        "events": timeline_events,
    }
    return _enrich_timeline_with_avant_garde_metadata(
        tl,
        clips,
        template,
        sprocket_slip,
        typographic_flashes,
        step_print_12fps,
        fold_in_columns,
        subliminal_sigil_flash,
        obsidian_scrying_vignette,
        thelemic_dye_bloom,
        cosmic_static_glitch,
        geometric_echo_tunnel,
    )
