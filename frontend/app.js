const Studio = {
  settings: {},
  providerPresets: {},
  templates: [],
  projectName: 'Untitled Project',
  audio: null,
  clips: [],
  timeline: null,
  lyrics: null,
  lastActiveLyricIndex: -1,
  pxPerSec: 65,
  isPlaying: false,
  selectedCutIndex: null,
  inspectedClipId: null,
  activeSlotIndex: -1,
  preloadedNextIndex: -1,
  activeDecoder: 'A',
  imageCache: {},
  hasUnsavedChanges: false,
  autoSaveTimer: null,
  splicerMode: 'preset',
  lastPresetId: 'narrative_storyboard',
  autoVary: {
    enabled: false,
    frequency: 'section',
    lastTriggerKey: null,
    lastTriggerTime: 0,
    recentPresets: [],
    activeAutoFx: null,
    hardwareFlashActive: false,
  },
  kineticState: {
    punchScale: 1.0,
    punchVel: 0.0,
    lastCueIndex: -1,
    cueTriggerTime: 0,
  },
  burroughsSettings: {
    textEnabled: true,
    textMode: 'burroughs_cutup',
    customText: '',
  },
};

const BURROUGHS_PHRASES = [
  'LANGUAGE IS A VIRUS',
  'WORD FALLING - PHOTO FALLING',
  'STORMING THE REALITY STUDIO',
  'NOTHING IS TRUE, EVERYTHING IS PERMITTED',
  'THE TICKET THAT EXPLODED',
  'RUB OUT THE WORD',
];

const ENOCHIAN_GLYPHS = [
  'OL SONUF VAORESAJI',
  'ZACARE OD ZAMRAN',
  'MICMA GOHO PIAD',
  'ZIRDO NOCO MAD',
  'LAP ZIRDO NOCO',
  'DS BRIN PRAF CHIS',
];

const VALID_MEDIA_EXT_REGEX = /\.(mp4|mov|webm|mkv|avi|png|jpg|jpeg|webp)$/i;
const VALID_VIDEO_EXT_REGEX = /\.(mp4|mov|webm|mkv|avi)$/i;
const VALID_IMAGE_EXT_REGEX = /\.(png|jpg|jpeg|webp)$/i;
const VALID_AUDIO_EXT_REGEX = /\.(mp3|wav|flac|m4a|ogg|aac)$/i;
const VALID_LYRIC_EXT_REGEX = /\.(lrc|srt)$/i;

const els = {
  projectTitleInput: document.getElementById('projectTitleInput'),
  clipCountBadge: document.getElementById('clipCountBadge'),
  videoCountBadge: document.getElementById('videoCountBadge'),
  stillCountBadge: document.getElementById('stillCountBadge'),
  clipLibraryList: document.getElementById('clipLibraryList'),
  videoLibraryList: document.getElementById('videoLibraryList'),
  stillLibraryList: document.getElementById('stillLibraryList'),
  clipFileInput: document.getElementById('clipFileInput'),
  videoFileInput: document.getElementById('videoFileInput'),
  stillFileInput: document.getElementById('stillFileInput'),
  folderFileInput: document.getElementById('folderFileInput'),
  lyricFileInput: document.getElementById('lyricFileInput'),
  mediaDropzone: document.getElementById('mediaDropzone'),
  videoDropzone: document.getElementById('videoDropzone'),
  stillDropzone: document.getElementById('stillDropzone'),
  stillDurationSelect: document.getElementById('stillDurationSelect'),
  stillCustomDurationWrap: document.getElementById('stillCustomDurationWrap'),
  stillCustomDurationInput: document.getElementById('stillCustomDurationInput'),
  audioFileInput: document.getElementById('audioFileInput'),
  audioTrackLabel: document.getElementById('audioTrackLabel'),
  audioStatsLabel: document.getElementById('audioStatsLabel'),
  templateSelect: document.getElementById('templateSelect'),
  templateDescText: document.getElementById('templateDescText'),
  presetConfigBadges: document.getElementById('presetConfigBadges'),
  btnSaveCustomPreset: document.getElementById('btnSaveCustomPreset'),
  chkSprocketSlip: document.getElementById('chkSprocketSlip'),
  chkTypoFlashes: document.getElementById('chkTypoFlashes'),
  chkStepPrint12fps: document.getElementById('chkStepPrint12fps'),
  chkSubliminalSigil: document.getElementById('chkSubliminalSigil'),
  chkObsidianScrying: document.getElementById('chkObsidianScrying'),
  chkThelemicBloom: document.getElementById('chkThelemicBloom'),
  chkCosmicStatic: document.getElementById('chkCosmicStatic'),
  chkEchoTunnel: document.getElementById('chkEchoTunnel'),
  foldInBadge: document.getElementById('foldInBadge'),
  chkPreserveFullDuration: document.getElementById('chkPreserveFullDuration'),
  storyVsChopSlider: document.getElementById('storyVsChopSlider'),
  storyVsChopVal: document.getElementById('storyVsChopVal'),
  transitionModeSelect: document.getElementById('transitionModeSelect'),
  exhaustionModeSelect: document.getElementById('exhaustionModeSelect'),
  globalPromptInput: document.getElementById('globalPromptInput'),
  fxIntensitySlider: document.getElementById('fxIntensitySlider'),
  fxIntensityVal: document.getElementById('fxIntensityVal'),
  minCutSlider: document.getElementById('minCutSlider'),
  minCutVal: document.getElementById('minCutVal'),
  sectionsSlotList: document.getElementById('sectionsSlotList'),
  previewCanvas: document.getElementById('previewCanvas'),
  hudStatusStrip: document.getElementById('hudStatusStrip'),
  hudSection: document.getElementById('hudSection'),
  hudClipName: document.getElementById('hudClipName'),
  hudMatchReason: document.getElementById('hudMatchReason'),
  btnPlayPause: document.getElementById('btn-play-pause') || document.getElementById('btnPlayPause'),
  btnStop: document.getElementById('btn-stop') || document.getElementById('btnStop'),
  btnGotoStart: document.getElementById('btn-goto-start'),
  btnGotoEnd: document.getElementById('btn-goto-end'),
  btnLoopToggle: document.getElementById('btn-loop-toggle'),
  timecodeDisplay: document.getElementById('timecodeDisplay'),
  meterBass: document.getElementById('meterBass'),
  meterSnare: document.getElementById('meterSnare'),
  meterHigh: document.getElementById('meterHigh'),
  valBass: document.getElementById('valBass'),
  valSnare: document.getElementById('valSnare'),
  valHigh: document.getElementById('valHigh'),
  chkLiveFx: document.getElementById('chkLiveFx'),
  chkShowHud: document.getElementById('chkShowHud'),
  statBpm: document.getElementById('statBpm'),
  statCuts: document.getElementById('statCuts'),
  statSpineBadge: document.getElementById('statSpineBadge'),
  btnSplitAtPlayhead: document.getElementById('btnSplitAtPlayhead'),
  btnAddManualBlock: document.getElementById('btnAddManualBlock'),
  saveLedWrap: document.getElementById('saveLedWrap'),
  saveLed: document.getElementById('saveLed'),
  saveLedText: document.getElementById('saveLedText'),
  btnSaveProject: document.getElementById('btnSaveProject'),
  openProjectInput: document.getElementById('openProjectInput'),
  lyricOffsetSlider: document.getElementById('lyricOffsetSlider'),
  lyricOffsetInput: document.getElementById('lyricOffsetInput'),
  lyricOffsetVal: document.getElementById('lyricOffsetVal'),
  btnResetLyricOffset: document.getElementById('btnResetLyricOffset'),
  lyricFontSelect: document.getElementById('lyricFontSelect'),
  lyricAnimSelect: document.getElementById('lyricAnimSelect'),
  chkMajorMonoAltCase: document.getElementById('chkMajorMonoAltCase'),
  chkIncludeLyricsExport: document.getElementById('chkIncludeLyricsExport'),
  timelineZoomSlider: document.getElementById('timelineZoomSlider'),
  timelineScroll: document.getElementById('timelineScroll'),
  timelineTracks: document.getElementById('timelineTracks'),
  sectionsTrack: document.getElementById('sectionsTrack'),
  waveformCanvas: document.getElementById('waveformCanvas'),
  lyricsTrack: document.getElementById('lyricsTrack'),
  cutsTrack: document.getElementById('cutsTrack'),
  playheadLine: document.getElementById('playheadLine'),
  mainAudio: document.getElementById('mainAudioPlayer'),
  vidA: document.getElementById('videoDecoderA'),
  vidB: document.getElementById('videoDecoderB'),
  vidL: document.getElementById('videoDecoderL'),
  vidR: document.getElementById('videoDecoderR'),
  modePresetBtn: document.getElementById('mode-preset-btn'),
  modeManualBtn: document.getElementById('mode-manual-btn'),
  btnLoadAudio: document.getElementById('btn-load-audio'),
  btnEjectAudio: document.getElementById('btn-eject-audio'),
  audioFileInputDedicated: document.getElementById('audio-file-input'),
  btnClearVideos: document.getElementById('btn-clear-videos'),
  btnClearStills: document.getElementById('btn-clear-stills'),
  toggleAutoFx: document.getElementById('toggle-auto-fx'),
  autoFxFrequency: document.getElementById('auto-fx-frequency'),
  toggleBurroughsText: document.getElementById('toggle-burroughs-text'),
  burroughsTextMode: document.getElementById('burroughs-text-mode'),
  burroughsCustomText: document.getElementById('burroughs-custom-text'),
  burroughsStatusBadge: document.getElementById('burroughsStatusBadge'),
  exportResolutionSelect: document.getElementById('export-resolution'),
};

const ctxPreview = els.previewCanvas.getContext('2d');

// Lightweight 2D Geometric Echo Tunnel offscreen feedback canvas (Zero WebGL/Shader Overhead)
const echoFeedbackCanvas = document.createElement('canvas');
echoFeedbackCanvas.width = 1280;
echoFeedbackCanvas.height = 720;
const ctxEcho = echoFeedbackCanvas.getContext('2d');
let echoBufferReady = false;

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(2).padStart(5, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
}

function formatSignedOffset(sec) {
  const num = Number.isFinite(sec) ? Math.max(-5.0, Math.min(5.0, Math.round(sec / 0.05) * 0.05)) : 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}s`;
}

// Read CSS Variable with fallback
function getCssColor(varName, fallback) {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return val || fallback;
  } catch (_) {
    return fallback;
  }
}

// Convert Hex or RGB color to RGBA with custom opacity
function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return null;
  const h = hex.trim();
  if (h.startsWith('rgba')) {
    return h.replace(/[\d\.]+\)$/, `${alpha})`);
  }
  if (h.startsWith('rgb')) {
    return h.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  let c = h.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length === 6) {
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
  return null;
}

// Client-Side LRC & SRT Parser (extracts [mm:ss.xx] LRC timestamps and SRT start-->end timecodes)
function parseLrcContentClient(rawText, totalDuration = 300.0) {
  const lines = String(rawText || '').split(/\r?\n/);
  const tagRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const offsetMatch = String(rawText || '').match(/\[offset:\s*([+-]?\d+)\s*\]/i);
  const headerOffsetSec = offsetMatch ? Number(offsetMatch[1]) / 1000.0 : 0.0;
  const rawEntries = [];

  for (const line of lines) {
    const matches = [...line.matchAll(tagRegex)];
    if (!matches.length) continue;
    const cleanedText = line.replace(tagRegex, '').replace(/<[^>]+>/g, '').trim();
    for (const m of matches) {
      const mm = parseInt(m[1], 10);
      const ss = parseInt(m[2], 10);
      const fracStr = m[3] || '0';
      const frac = fracStr.length === 1 ? parseInt(fracStr, 10) / 10.0
        : (fracStr.length === 2 ? parseInt(fracStr, 10) / 100.0 : parseInt(fracStr, 10) / 1000.0);
      const tSec = Math.max(0.0, mm * 60.0 + ss + frac + headerOffsetSec);
      rawEntries.push({ start: tSec, text: cleanedText });
    }
  }
  rawEntries.sort((a, b) => a.start - b.start);
  const cues = [];
  for (let i = 0; i < rawEntries.length; i++) {
    const item = rawEntries[i];
    if (!item.text) continue;
    const nextStart = i + 1 < rawEntries.length
      ? rawEntries[i + 1].start
      : Math.min(Math.max(item.start + 3.5, totalDuration), item.start + 6.0);
    const endSec = Math.max(item.start + 0.20, nextStart);
    cues.push({
      index: cues.length,
      start: Number(item.start.toFixed(3)),
      end: Number(endSec.toFixed(3)),
      duration: Number((endSec - item.start).toFixed(3)),
      text: item.text,
    });
  }
  return cues;
}

function parseSrtContentClient(rawText) {
  const blocks = String(rawText || '').trim().split(/\r?\n\s*\r?\n/);
  const tcRegex = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;
  const cues = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let tcIdx = -1;
    let match = null;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(tcRegex);
      if (m) {
        tcIdx = i;
        match = m;
        break;
      }
    }
    if (!match) continue;
    const toSec = (hh, mm, ss, msStr) => {
      const ms = parseInt(String(msStr).padEnd(3, '0').slice(0, 3), 10);
      return parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseInt(ss, 10) + ms / 1000.0;
    };
    const startSec = Math.max(0, toSec(match[1], match[2], match[3], match[4]));
    const endSec = Math.max(startSec + 0.15, toSec(match[5], match[6], match[7], match[8]));
    const textBody = lines.slice(tcIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (!textBody) continue;
    cues.push({
      index: cues.length,
      start: Number(startSec.toFixed(3)),
      end: Number(endSec.toFixed(3)),
      duration: Number((endSec - startSec).toFixed(3)),
      text: textBody,
    });
  }
  cues.sort((a, b) => a.start - b.start);
  cues.forEach((c, idx) => { c.index = idx; });
  return cues;
}

function isLyricsRenderEnabled() {
  if (els.chkIncludeLyricsExport) {
    return Boolean(els.chkIncludeLyricsExport.checked);
  }
  return Boolean(!Studio.lyrics || Studio.lyrics.include_in_render !== false);
}

function getLyricGlobalOffset() {
  if (els.lyricOffsetSlider) {
    const v = Number(els.lyricOffsetSlider.value);
    if (Number.isFinite(v)) return Math.max(-5.0, Math.min(5.0, Math.round(v / 0.05) * 0.05));
  }
  return Number((Studio.lyrics && Studio.lyrics.global_offset) || 0.0);
}

function syncLyricsUiControls() {
  const offset = Number((Studio.lyrics && Studio.lyrics.global_offset) || 0.0);
  const clamped = Math.max(-5.0, Math.min(5.0, Math.round(offset / 0.05) * 0.05));
  if (els.lyricOffsetSlider) els.lyricOffsetSlider.value = clamped;
  if (els.lyricOffsetInput) els.lyricOffsetInput.value = clamped.toFixed(2);
  if (els.lyricOffsetVal) els.lyricOffsetVal.textContent = formatSignedOffset(clamped);

  const inc = Studio.lyrics ? Studio.lyrics.include_in_render !== false : true;
  if (els.chkIncludeLyricsExport) els.chkIncludeLyricsExport.checked = inc;
  const laneChk = document.getElementById('chkIncludeLyricsLane');
  if (laneChk) laneChk.checked = inc;

  if (Studio.lyrics && Studio.lyrics.cues && Studio.lyrics.cues.length > 0 && els.burroughsStatusBadge) {
    els.burroughsStatusBadge.textContent = 'Upper Scrim Protected (Lyrics Active)';
    els.burroughsStatusBadge.style.color = '#38bdf8';
  } else if (els.burroughsStatusBadge) {
    els.burroughsStatusBadge.textContent = 'Upper Scrim Protected';
    els.burroughsStatusBadge.style.color = '#94a3b8';
  }
}

function getActiveLyricCueAtTime(t) {
  if (!Studio.lyrics || !Array.isArray(Studio.lyrics.cues) || !Studio.lyrics.cues.length) {
    return null;
  }
  const offset = getLyricGlobalOffset();
  for (let i = 0; i < Studio.lyrics.cues.length; i++) {
    const cue = Studio.lyrics.cues[i];
    const effStart = Number(cue.start) + offset;
    const effEnd = Number(cue.end) + offset;
    if (t >= effStart && t < effEnd) {
      return {
        ...cue,
        effective_start: effStart,
        effective_end: effEnd,
      };
    }
  }
  return null;
}

function applyAlternatingCase(str) {
  let res = '';
  let upper = true;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (/[a-zA-Z]/.test(ch)) {
      res += upper ? ch.toUpperCase() : ch.toLowerCase();
      upper = !upper;
    } else {
      res += ch;
    }
  }
  return res;
}

function drawLowerThirdLyricOnCanvas(ctx, w, h, cueOrText, t = 0, bassVal = 0, snareVal = 0) {
  const cue = (typeof cueOrText === 'object' && cueOrText !== null) ? cueOrText : { text: String(cueOrText || '') };
  let rawText = String(cue.text || '').trim();
  if (!rawText) return;

  // Major Mono alternating mixed case handler
  if (els.chkMajorMonoAltCase && els.chkMajorMonoAltCase.checked) {
    rawText = applyAlternatingCase(rawText);
  }

  const animStyle = (els.lyricAnimSelect && els.lyricAnimSelect.value) ? els.lyricAnimSelect.value : 'classic';
  const selectedFont = (els.lyricFontSelect && els.lyricFontSelect.value) ? els.lyricFontSelect.value : 'Space Mono';
  const fontSize = Math.max(18, Math.round((w / 1280) * 28));
  const lineGap = Math.round(fontSize * 0.36);

  // Cue timing parameters
  const cueStart = Number(cue.effective_start ?? cue.start ?? 0);
  const cueEnd = Number(cue.effective_end ?? cue.end ?? (cueStart + 3.0));
  const cueDur = Math.max(0.1, cueEnd - cueStart);
  const elapsed = Math.max(0, t - cueStart);

  // Style: Typewriter sequential character reveal
  if (animStyle === 'typewriter') {
    const typingDuration = Math.min(cueDur * 0.78, Math.max(0.6, rawText.length * 0.055));
    const progress = Math.min(1.0, elapsed / typingDuration);
    const charLen = Math.min(rawText.length, Math.floor(progress * (rawText.length + 1)));
    let displayText = rawText.substring(0, charLen);
    if (progress < 1.0 && (Math.floor(elapsed * 5) % 2 === 0)) {
      displayText += '▮';
    }
    rawText = displayText;
  }

  // Style: Burroughs Flash (Centered bold all-caps typographic banner with transient flicker)
  if (animStyle === 'burroughs_flash') {
    rawText = rawText.toUpperCase();
    const isFlicker = (snareVal > 0.42 || bassVal > 0.50) && (Math.floor(t * 30) % 2 === 0);
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;

    ctx.save();
    ctx.font = `900 ${Math.max(22, Math.round(fontSize * 1.25))}px "${selectedFont}", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bannerH = Math.max(68, Math.floor(h * 0.17));
    const bannerY = Math.floor(h * 0.5 - bannerH * 0.5);

    if (isFlicker) {
      // Inverted negative flash banner on transients
      ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
      ctx.fillRect(0, bannerY, w, bannerH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, bannerY + 4, w - 24, bannerH - 8);
      ctx.fillStyle = '#06070a';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    } else {
      // High-contrast stark black banner
      ctx.fillStyle = 'rgba(8, 10, 14, 0.93)';
      ctx.fillRect(0, bannerY, w, bannerH);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(12, bannerY + 4, w - 24, bannerH - 8);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    }

    const totalTextH = lines.length * fontSize + (lines.length - 1) * lineGap;
    let currY = bannerY + (bannerH - totalTextH) * 0.5 + fontSize * 0.5;
    for (const ln of lines) {
      ctx.lineWidth = 4;
      ctx.strokeText(ln, w * 0.5, currY);
      ctx.fillText(ln, w * 0.5, currY);
      currY += fontSize + lineGap;
    }
    ctx.restore();
    return;
  }

  // Common Layout & Bounds Calculation for Lower-Third Styles
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return;

  ctx.save();
  ctx.font = `700 ${fontSize}px "${selectedFont}", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let maxTw = 0;
  for (const ln of lines) {
    const m = ctx.measureText(ln);
    if (m.width > maxTw) maxTw = m.width;
  }

  const padX = Math.round((w / 1280) * 26);
  const padY = Math.round((h / 720) * 14);
  const totalTextH = lines.length * fontSize + (lines.length - 1) * lineGap;
  const boxW = Math.min(w - 40, maxTw + padX * 2);
  const boxH = totalTextH + padY * 2;
  const boxX = (w - boxW) * 0.5;
  const bottomMargin = Math.round(h * 0.075);
  const boxY = Math.max(16, h - bottomMargin - boxH);
  const cx = boxX + boxW * 0.5;
  const cy = boxY + boxH * 0.5;

  // Style: Classic Subtitle (Soft Alpha Fade-In / Fade-Out)
  if (animStyle === 'classic') {
    const fadeIn = Math.min(1.0, Math.max(0.0, elapsed / 0.22));
    const fadeOut = Math.min(1.0, Math.max(0.0, (cueEnd - t) / 0.22));
    const alpha = Math.max(0.04, Math.min(1.0, Math.min(fadeIn, fadeOut)));
    ctx.globalAlpha = alpha;
  }

  // Style: Kinetic Punch (Spring Scale Decay on Bass Spikes)
  if (animStyle === 'kinetic_punch') {
    if (bassVal > 0.45) {
      Studio.kineticState.punchVel += (bassVal - 0.35) * 0.24;
    }
    const springK = 0.22;
    const damping = 0.72;
    const force = (1.0 - Studio.kineticState.punchScale) * springK;
    Studio.kineticState.punchVel = (Studio.kineticState.punchVel + force) * damping;
    Studio.kineticState.punchScale += Studio.kineticState.punchVel;
    Studio.kineticState.punchScale = Math.max(0.85, Math.min(1.35, Studio.kineticState.punchScale));
    if (Math.abs(Studio.kineticState.punchScale - 1.0) < 0.005 && Math.abs(Studio.kineticState.punchVel) < 0.005) {
      Studio.kineticState.punchScale = 1.0;
      Studio.kineticState.punchVel = 0;
    }

    ctx.translate(cx, cy);
    ctx.scale(Studio.kineticState.punchScale, Studio.kineticState.punchScale);
    ctx.translate(-cx, -cy);

    if (bassVal > 0.48) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
    }
  }

  // Style: Slam Zoom (Rapid Scale-Down from 2.5x to 1.0x with Impact Shake)
  if (animStyle === 'slam_zoom') {
    const cueIdx = Number(cue.index ?? -1);
    if (cueIdx >= 0 && cueIdx !== Studio.kineticState.lastCueIndex) {
      Studio.kineticState.lastCueIndex = cueIdx;
      Studio.kineticState.cueTriggerTime = t;
    }
    const timeSinceTrigger = Math.max(0, t - Studio.kineticState.cueTriggerTime);
    let slamScale = 1.0;
    let slamShakeX = 0;
    let slamShakeY = 0;
    if (timeSinceTrigger < 0.120) {
      const ratio = timeSinceTrigger / 0.120;
      slamScale = 2.5 - 1.5 * Math.pow(ratio, 0.5);
      const shakeMag = (1.0 - ratio) * 12.0;
      slamShakeX = (Math.random() - 0.5) * shakeMag;
      slamShakeY = (Math.random() - 0.5) * shakeMag;
    }
    ctx.translate(cx + slamShakeX, cy + slamShakeY);
    ctx.scale(slamScale, slamScale);
    ctx.translate(-cx, -cy);
  }

  // Style: Glitch Shake (Random 1-5px letter offsets + transient chromatic red/cyan split)
  let glitchDx = 0;
  let glitchDy = 0;
  let isGlitchSplit = false;
  let splitOffset = 0;
  if (animStyle === 'glitch_shake') {
    const baseShift = 1.0 + Math.random() * 4.0;
    const spike = Math.max(bassVal > 0.45 ? bassVal : 0, snareVal > 0.42 ? snareVal : 0);
    const mult = spike > 0 ? 1.0 + spike * 3.5 : 1.0;
    glitchDx = (Math.random() - 0.5) * baseShift * mult;
    glitchDy = (Math.random() - 0.5) * baseShift * mult;
    if (spike > 0) {
      isGlitchSplit = true;
      splitOffset = 3.5 * mult;
    }
    ctx.translate(glitchDx, glitchDy);
  }

  // Semi-transparent lower-third pill backdrop
  ctx.fillStyle = 'rgba(10, 12, 18, 0.78)';
  ctx.strokeStyle = (animStyle === 'kinetic_punch' && bassVal > 0.45)
    ? '#f59e0b'
    : 'rgba(250, 204, 21, 0.55)';
  ctx.lineWidth = 1.5;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
  }

  // Style: Wave / Sine Crawl (yOffset = Math.sin((t * 4) + (charIndex * 0.4)) * amplitude)
  if (animStyle === 'wave_sine') {
    const waveAmp = 5.0 + (bassVal > 0.4 ? bassVal * 9.0 : 0);
    let currY = boxY + padY + fontSize * 0.5;
    for (const ln of lines) {
      const lineW = ctx.measureText(ln).width;
      let charX = (w - lineW) * 0.5;
      for (let c = 0; c < ln.length; c++) {
        const ch = ln[c];
        const chW = ctx.measureText(ch).width;
        const yOff = Math.sin((t * 4.0) + (c * 0.4)) * waveAmp;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.strokeText(ch, charX + chW * 0.5, currY + yOff);
        ctx.fillStyle = '#fefce8';
        ctx.fillText(ch, charX + chW * 0.5, currY + yOff);
        charX += chW;
      }
      currY += fontSize + lineGap;
    }
  } else {
    // If chromatic split is triggered on transient spike, render red & cyan offset passes first
    if (isGlitchSplit) {
      let cyY = boxY + padY + fontSize * 0.5;
      for (const ln of lines) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.82)'; // Cyan channel (-offset)
        ctx.fillText(ln, (w * 0.5) - splitOffset, cyY);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.82)'; // Red channel (+offset)
        ctx.fillText(ln, (w * 0.5) + splitOffset, cyY);
        cyY += fontSize + lineGap;
      }
    }

    let currY = boxY + padY + fontSize * 0.5;
    for (const ln of lines) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.strokeText(ln, w * 0.5, currY);
      ctx.fillStyle = '#fefce8';
      ctx.fillText(ln, w * 0.5, currY);
      currY += fontSize + lineGap;
    }
  }
  ctx.restore();
}

// Workspace State Serialization & Centralized State Manager
function serializeWorkspaceState() {
  return {
    format: 'strangelet_splicer_project',
    version: '1.0',
    saved_at: new Date().toISOString(),
    projectName: Studio.projectName || (els.projectTitleInput ? els.projectTitleInput.value : 'Untitled Project'),
    audio: Studio.audio,
    clips: Studio.clips,
    timeline: Studio.timeline,
    lyrics: Studio.lyrics,
    selectedPreset: (els.templateSelect && els.templateSelect.value) || null,
    uiSettings: {
      preserveFullDuration: Boolean(els.chkPreserveFullDuration && els.chkPreserveFullDuration.checked),
      storyVsChop: Number(els.storyVsChopSlider ? els.storyVsChopSlider.value : 50),
      minCutFloor: Number(els.minCutSlider ? els.minCutSlider.value : 0.25),
      fxIntensity: Number(els.fxIntensitySlider ? els.fxIntensitySlider.value : 1.0),
      transitionMode: els.transitionModeSelect ? els.transitionModeSelect.value : 'auto_intensity',
      exhaustionMode: els.exhaustionModeSelect ? els.exhaustionModeSelect.value : 'loop_vary_motion',
      globalPrompt: els.globalPromptInput ? els.globalPromptInput.value : '',
      sprocketSlip: Boolean(els.chkSprocketSlip && els.chkSprocketSlip.checked),
      typoFlashes: Boolean(els.chkTypoFlashes && els.chkTypoFlashes.checked),
      stepPrint12fps: Boolean(els.chkStepPrint12fps && els.chkStepPrint12fps.checked),
      subliminalSigil: Boolean(els.chkSubliminalSigil && els.chkSubliminalSigil.checked),
      obsidianScrying: Boolean(els.chkObsidianScrying && els.chkObsidianScrying.checked),
      thelemicBloom: Boolean(els.chkThelemicBloom && els.chkThelemicBloom.checked),
      cosmicStatic: Boolean(els.chkCosmicStatic && els.chkCosmicStatic.checked),
      echoTunnel: Boolean(els.chkEchoTunnel && els.chkEchoTunnel.checked),
      lyricOffset: getLyricGlobalOffset(),
      lyricFont: (els.lyricFontSelect && els.lyricFontSelect.value) ? els.lyricFontSelect.value : 'Space Mono',
      lyricAnim: (els.lyricAnimSelect && els.lyricAnimSelect.value) ? els.lyricAnimSelect.value : 'classic',
      lyricAltCase: Boolean(els.chkMajorMonoAltCase && els.chkMajorMonoAltCase.checked),
      includeLyricsInRender: isLyricsRenderEnabled(),
      timelineZoom: Number(els.timelineZoomSlider ? els.timelineZoomSlider.value : 65),
      isLooping: Boolean(Studio.isLooping),
      autoFxEnabled: Boolean(Studio.autoVary && Studio.autoVary.enabled),
      autoFxFrequency: (Studio.autoVary && Studio.autoVary.frequency) || 'section',
      burroughsTextEnabled: Boolean(Studio.burroughsSettings && Studio.burroughsSettings.textEnabled),
      burroughsTextMode: (Studio.burroughsSettings && Studio.burroughsSettings.textMode) || 'burroughs_cutup',
      burroughsCustomText: (Studio.burroughsSettings && Studio.burroughsSettings.customText) || '',
      exportResolution: els.exportResolutionSelect ? els.exportResolutionSelect.value : '1080p',
    },
  };
}

function triggerWorkspaceAutoSave() {
  Studio.hasUnsavedChanges = true;
  if (els.saveLed) {
    els.saveLed.classList.remove('saved');
    els.saveLed.classList.add('pulsing');
  }
  if (els.saveLedText) {
    els.saveLedText.textContent = 'SAVING...';
  }
  if (Studio.autoSaveTimer) {
    clearTimeout(Studio.autoSaveTimer);
  }
  Studio.autoSaveTimer = setTimeout(() => {
    commitWorkspaceAutoSave();
  }, 2000);
}

async function commitWorkspaceAutoSave() {
  try {
    const data = serializeWorkspaceState();
    localStorage.setItem('strangelet_splicer_active_session', JSON.stringify(data));
    api('/api/state/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: Studio.audio,
        clips: Studio.clips,
        timeline: Studio.timeline,
        lyrics: Studio.lyrics,
      }),
    }).catch(() => {});
  } catch (err) {
    console.warn('Auto-save error:', err);
  } finally {
    Studio.hasUnsavedChanges = false;
    if (els.saveLed) {
      els.saveLed.classList.remove('pulsing');
      els.saveLed.classList.add('saved');
    }
    if (els.saveLedText) {
      els.saveLedText.textContent = 'SAVED';
    }
  }
}

async function restoreWorkspaceState(state, isInitialBoot = false) {
  if (!state || typeof state !== 'object') return false;
  try {
    if (state.audio) Studio.audio = state.audio;
    if (Array.isArray(state.clips)) Studio.clips = state.clips;
    if (state.timeline) Studio.timeline = state.timeline;
    if (state.lyrics) Studio.lyrics = state.lyrics;
    if (state.projectName) {
      Studio.projectName = state.projectName;
      if (els.projectTitleInput) els.projectTitleInput.value = state.projectName;
      document.title = `Strangelet Splicer — ${state.projectName}`;
    }

    if (state.uiSettings) {
      const ui = state.uiSettings;
      if (typeof ui.preserveFullDuration === 'boolean' && els.chkPreserveFullDuration) {
        els.chkPreserveFullDuration.checked = ui.preserveFullDuration;
      }
      if (typeof ui.storyVsChop === 'number' && els.storyVsChopSlider) {
        els.storyVsChopSlider.value = ui.storyVsChop;
        updateStoryVsChopLabel();
      }
      if (typeof ui.minCutFloor === 'number' && els.minCutSlider) {
        els.minCutSlider.value = ui.minCutFloor;
        if (els.minCutVal) els.minCutVal.textContent = `${Number(ui.minCutFloor).toFixed(2)}s`;
      }
      if (typeof ui.fxIntensity === 'number' && els.fxIntensitySlider) {
        els.fxIntensitySlider.value = ui.fxIntensity;
        if (els.fxIntensityVal) els.fxIntensityVal.textContent = `${Math.round(ui.fxIntensity * 100)}%`;
      }
      if (ui.transitionMode && els.transitionModeSelect) {
        els.transitionModeSelect.value = ui.transitionMode;
      }
      if (ui.exhaustionMode && els.exhaustionModeSelect) {
        els.exhaustionModeSelect.value = ui.exhaustionMode;
      }
      if (typeof ui.globalPrompt === 'string' && els.globalPromptInput) {
        els.globalPromptInput.value = ui.globalPrompt;
      }
      if (els.chkSprocketSlip && typeof ui.sprocketSlip === 'boolean') els.chkSprocketSlip.checked = ui.sprocketSlip;
      if (els.chkTypoFlashes && typeof ui.typoFlashes === 'boolean') els.chkTypoFlashes.checked = ui.typoFlashes;
      if (els.chkStepPrint12fps && typeof ui.stepPrint12fps === 'boolean') els.chkStepPrint12fps.checked = ui.stepPrint12fps;
      if (els.chkSubliminalSigil && typeof ui.subliminalSigil === 'boolean') els.chkSubliminalSigil.checked = ui.subliminalSigil;
      if (els.chkObsidianScrying && typeof ui.obsidianScrying === 'boolean') els.chkObsidianScrying.checked = ui.obsidianScrying;
      if (els.chkThelemicBloom && typeof ui.thelemicBloom === 'boolean') els.chkThelemicBloom.checked = ui.thelemicBloom;
      if (els.chkCosmicStatic && typeof ui.cosmicStatic === 'boolean') els.chkCosmicStatic.checked = ui.cosmicStatic;
      if (els.chkEchoTunnel && typeof ui.echoTunnel === 'boolean') els.chkEchoTunnel.checked = ui.echoTunnel;

      if (typeof ui.lyricOffset === 'number') {
        setLyricGlobalOffset(ui.lyricOffset, false);
      }
      if (ui.lyricFont && els.lyricFontSelect) {
        els.lyricFontSelect.value = ui.lyricFont;
      }
      if (ui.lyricAnim && els.lyricAnimSelect) {
        els.lyricAnimSelect.value = ui.lyricAnim;
      }
      if (typeof ui.lyricAltCase === 'boolean' && els.chkMajorMonoAltCase) {
        els.chkMajorMonoAltCase.checked = ui.lyricAltCase;
      }
      if (typeof ui.includeLyricsInRender === 'boolean') {
        setIncludeLyricsInRender(ui.includeLyricsInRender);
      }
      if (typeof ui.timelineZoom === 'number' && els.timelineZoomSlider) {
        els.timelineZoomSlider.value = ui.timelineZoom;
        Studio.pxPerSec = ui.timelineZoom;
      }
      if (typeof ui.isLooping === 'boolean') {
        Studio.isLooping = ui.isLooping;
        updateTransportUI();
      }
      if (typeof ui.autoFxEnabled === 'boolean') {
        Studio.autoVary.enabled = ui.autoFxEnabled;
        if (els.toggleAutoFx) els.toggleAutoFx.checked = ui.autoFxEnabled;
      }
      if (ui.autoFxFrequency) {
        Studio.autoVary.frequency = ui.autoFxFrequency;
        if (els.autoFxFrequency) els.autoFxFrequency.value = ui.autoFxFrequency;
      }
      if (typeof ui.burroughsTextEnabled === 'boolean') {
        Studio.burroughsSettings.textEnabled = ui.burroughsTextEnabled;
        if (els.toggleBurroughsText) els.toggleBurroughsText.checked = ui.burroughsTextEnabled;
      }
      if (ui.burroughsTextMode) {
        Studio.burroughsSettings.textMode = ui.burroughsTextMode;
        if (els.burroughsTextMode) els.burroughsTextMode.value = ui.burroughsTextMode;
        if (els.burroughsCustomText) {
          els.burroughsCustomText.style.display = ui.burroughsTextMode === 'custom_text' ? 'block' : 'none';
        }
      }
      if (typeof ui.burroughsCustomText === 'string') {
        Studio.burroughsSettings.customText = ui.burroughsCustomText;
        if (els.burroughsCustomText) els.burroughsCustomText.value = ui.burroughsCustomText;
      }
      if (ui.exportResolution && els.exportResolutionSelect) {
        els.exportResolutionSelect.value = ui.exportResolution;
      }
    }

    if (typeof state.isLooping === 'boolean') {
      Studio.isLooping = state.isLooping;
      updateTransportUI();
    }

    const presetId = state.selectedPreset || (Studio.timeline ? Studio.timeline.template_id : null);
    if (presetId && els.templateSelect) {
      populateTemplates(presetId);
    }

    syncLyricsUiControls();
    preloadStillImages();
    renderClipLibrary();
    renderAudioState();
    renderTimelineView();
    syncVideoDecodersToTime(0, true);
    if (Studio.audio && Studio.audio.audio_url) {
      AudioEngine.loadAudioFromUrl(Studio.audio.audio_url).then(() => {
        if (Studio.audio && Studio.audio.sliceEdits && Studio.audio.sliceEdits.length) {
          AudioEngine.applyToMainAudio().then(() => {
            renderTimelineView();
          });
        }
      }).catch((e) => console.warn('AudioEngine restore error:', e));
    }

    api('/api/state/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: Studio.audio,
        clips: Studio.clips,
        timeline: Studio.timeline,
        lyrics: Studio.lyrics,
      }),
    }).catch(() => {});

    Studio.hasUnsavedChanges = false;
    if (els.saveLed) {
      els.saveLed.classList.remove('pulsing');
      els.saveLed.classList.add('saved');
    }
    if (els.saveLedText) {
      els.saveLedText.textContent = 'SAVED';
    }
    return true;
  } catch (err) {
    console.error('Failed to restore workspace state:', err);
    return false;
  }
}

const TAURI_BACKEND_ORIGIN = 'http://127.0.0.1:8765';
function resolveApiUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const isTauri = typeof window !== 'undefined' && (
    Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__) ||
    window.location.protocol === 'tauri:' ||
    window.location.hostname === 'tauri.localhost'
  );
  if (isTauri) {
    return `${TAURI_BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  return path;
}

const toAssetUrl = (filePath) => {
  if (!filePath) return '';
  if (typeof filePath !== 'string') return filePath;
  if (filePath.startsWith('blob:') || filePath.startsWith('data:')) return filePath;
  if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.convertFileSrc === 'function') {
    if (/^[a-zA-Z]:[\\\/]/.test(filePath) || filePath.startsWith('file://')) {
      const cleanPath = filePath.replace(/^file:\/\/\/?/, '');
      return window.__TAURI__.core.convertFileSrc(cleanPath);
    }
    if (filePath.startsWith('/') || filePath.startsWith('./')) {
      return resolveApiUrl(filePath);
    }
    return window.__TAURI__.core.convertFileSrc(filePath);
  }
  return resolveApiUrl(filePath);
};

function getStillDefaultDuration() {
  const mode = (els.stillDurationSelect && els.stillDurationSelect.value) || '1_bar';
  const bpm = Number((Studio.audio && Studio.audio.bpm) || 120);
  const beatSec = 60.0 / Math.max(30.0, Math.min(280.0, bpm));
  const barSec = beatSec * 4.0;

  if (mode === 'half_bar') {
    return Math.max(0.25, Number((barSec * 0.5).toFixed(3)));
  } else if (mode === '2_bars') {
    return Math.max(0.5, Number((barSec * 2.0).toFixed(3)));
  } else if (mode === 'custom') {
    const customVal = Number(els.stillCustomDurationInput ? els.stillCustomDurationInput.value : 2.0);
    return Math.max(0.25, Math.min(15.0, Number(customVal.toFixed(3))));
  }
  return Math.max(0.5, Number(barSec.toFixed(3)));
}

async function api(path, options = {}) {
  const url = resolveApiUrl(path);
  const resp = await fetch(url, options);
  if (!resp.ok) {
    let errText = resp.statusText;
    try {
      const j = await resp.json();
      errText = j.detail || JSON.stringify(j);
    } catch (_) {}
    throw new Error(errText);
  }
  return resp.json();
}

function preloadStillImages() {
  (Studio.clips || []).forEach((c) => {
    if (c.media_type === 'image' || c.is_image) {
      const rawUrl = c.clip_url || `/workspace/clips/${c.filename}`;
      const url = toAssetUrl(rawUrl);
      if (url && !Studio.imageCache[url]) {
        const im = new Image();
        im.src = url;
        Studio.imageCache[url] = im;
      }
    }
  });
}

function updateStoryVsChopLabel() {
  const val = Number(els.storyVsChopSlider.value);
  let desc = 'Story + Cutaways';
  if (val === 0) desc = 'Pure Sequential Story';
  else if (val <= 30) desc = 'Mostly Story Flow';
  else if (val >= 85) desc = 'Fast Transient Chop';
  else if (val >= 65) desc = 'Heavy Cutaway Chop';
  els.storyVsChopVal.textContent = `${val}% (${desc})`;
}

async function initStudio() {
  VideoPool.init();
  try {
    const data = await api('/api/state');
    Studio.settings = data.settings || {};
    Studio.providerPresets = data.provider_presets || {};
    Studio.templates = data.templates || [];
    Studio.audio = data.audio || null;
    Studio.clips = data.clips || [];
    Studio.timeline = data.timeline || null;
    Studio.lyrics = data.lyrics || null;

    let restoredFromSession = false;
    const savedSessionRaw = localStorage.getItem('strangelet_splicer_active_session');
    if (savedSessionRaw) {
      try {
        const savedSession = JSON.parse(savedSessionRaw);
        if (savedSession && (savedSession.timeline || savedSession.audio || (savedSession.clips && savedSession.clips.length))) {
          console.log('Restoring workspace state from active session cache...');
          restoredFromSession = await restoreWorkspaceState(savedSession, true);
        }
      } catch (sessErr) {
        console.warn('Could not restore cached session:', sessErr);
      }
    }

    if (!restoredFromSession) {
      syncLyricsUiControls();
      preloadStillImages();
      populateTemplates(Studio.timeline ? Studio.timeline.template_id : null);

      if (Studio.timeline) {
        if (typeof Studio.timeline.preserve_full_duration === 'boolean') {
          els.chkPreserveFullDuration.checked = Studio.timeline.preserve_full_duration;
        }
        if (typeof Studio.timeline.story_vs_chop === 'number') {
          els.storyVsChopSlider.value = Math.round(Studio.timeline.story_vs_chop * 100);
        }
        if (typeof Studio.timeline.min_cut_floor === 'number') {
          els.minCutSlider.value = Studio.timeline.min_cut_floor;
          els.minCutVal.textContent = `${Number(Studio.timeline.min_cut_floor).toFixed(2)}s`;
        }
        if (typeof Studio.timeline.fx_intensity === 'number') {
          els.fxIntensitySlider.value = Studio.timeline.fx_intensity;
          els.fxIntensityVal.textContent = `${Math.round(Studio.timeline.fx_intensity * 100)}%`;
        }
        if (els.chkSprocketSlip && typeof Studio.timeline.sprocket_slip === 'boolean') {
          els.chkSprocketSlip.checked = Studio.timeline.sprocket_slip;
        }
        if (els.chkTypoFlashes && typeof Studio.timeline.typographic_flashes === 'boolean') {
          els.chkTypoFlashes.checked = Studio.timeline.typographic_flashes;
        }
        if (els.chkStepPrint12fps && typeof Studio.timeline.step_print_12fps === 'boolean') {
          els.chkStepPrint12fps.checked = Studio.timeline.step_print_12fps;
        }
        if (els.chkSubliminalSigil && typeof Studio.timeline.subliminal_sigil_flash === 'boolean') {
          els.chkSubliminalSigil.checked = Studio.timeline.subliminal_sigil_flash;
        }
        if (els.chkObsidianScrying && typeof Studio.timeline.obsidian_scrying_vignette === 'boolean') {
          els.chkObsidianScrying.checked = Studio.timeline.obsidian_scrying_vignette;
        }
        if (els.chkThelemicBloom && typeof Studio.timeline.thelemic_dye_bloom === 'boolean') {
          els.chkThelemicBloom.checked = Studio.timeline.thelemic_dye_bloom;
        }
        if (els.chkCosmicStatic && typeof Studio.timeline.cosmic_static_glitch === 'boolean') {
          els.chkCosmicStatic.checked = Studio.timeline.cosmic_static_glitch;
        }
        if (els.chkEchoTunnel && typeof Studio.timeline.geometric_echo_tunnel === 'boolean') {
          els.chkEchoTunnel.checked = Studio.timeline.geometric_echo_tunnel;
        }
      }
      updateStoryVsChopLabel();

      populateSettingsModal();
      renderClipLibrary();
      renderAudioState();
      renderTimelineView();
      drawIdleCanvas();
    } else {
      populateSettingsModal();
      updateStoryVsChopLabel();
      drawIdleCanvas();
    }
  } catch (err) {
    console.error('Init failed:', err);
  }
  if (els.chkShowHud && els.chkShowHud.onchange) {
    els.chkShowHud.onchange();
  }
  updateClipboardUIState();
  requestAnimationFrame(renderLoop);
}

function renderPresetBadges(preset) {
  if (!els.presetConfigBadges || !preset) return;
  const floor = Number(preset.min_cut_floor ?? 0.25).toFixed(2);
  const ceil = Number(preset.max_cut_ceiling ?? 4.0).toFixed(2);
  const sortLabel = {
    manual_empty_slate: 'Manual Empty Slate (Drag & Drop)',
    story_spine: '01/02 Story Spine',
    scene_cluster: '01_video + 01_a/b Cluster',
    high_energy: 'High-Energy Peak',
    dark_low_luma: 'Dark Shadow Luma',
    fold_in_3col: '3-Column Fold-In Async',
    fibonacci_metric: 'Fibonacci 1-2-3-5-8-13',
    mekas_burst_hold: '2-4f Burst -> 2.5s Hold',
    la_jetee_stills_plus_peak_video: 'Stills + 1 Peak Video',
    dialectical_debord: 'Dialectical Inversion',
    thelemic_7_11: 'Strict 7-Beat & 11-Beat Intervals',
    carcosa_long_jarring: 'Long Takes + Downbeat Match-Cut',
  }[preset.sorting_logic] || preset.sorting_logic || 'Story Spine';

  const fxLabel = {
    manual_workbench: 'Hands-On Assembly + Pinned Locks',
    clean: 'Clean Cuts',
    vhs_tape: 'VHS Scanlines + Snare Flicker',
    cyber_glitch: 'RGB Tear + Strobe Flash',
    cluster_stab: 'Hi-Hat/Snare Image Stabs',
    film_16mm: '16mm Grain + Halation Glow',
    dark_minimalist: 'Shadow Crush + Quiet Blackouts',
    reel_frenzy: 'Downbeat Zoom-Punch',
    burroughs_cutup: '3-Col Fold-In + Typo + 3f Rev',
    brakhage_emulsion: 'Sprocket Slip + Scratches + Burns',
    structural_flicker: '1-2f Clip & B/W Strobes',
    kubelka_metric: 'Fibonacci Slicing + 3f Reverse',
    lynch_monochrome: 'Chalk/Soot B/W + 12fps + Arc Flash',
    mekas_bolex: 'Bolex Burst + Warm Grain',
    mekas_diary: 'Bolex Burst + Warm Grain',
    marker_jetee: '3-5s Stills + Peak Motion Miracle',
    la_jetee_photomontage: '3-5s Stills + Peak Motion Miracle',
    debord_detournement: '6-8s Loud Holds / Rapid Quiet Cuts',
    babalon_working: '7/11 Beat + Mojave Crimson/Gold + Solar Bloom',
    chaos_sigil: '1-Frame (16ms) Inverted Subliminal Sigil',
    enochian_scrying: 'Obsidian Mirror + Soft Dissolves + Glyphs',
    typhonian_transmission: 'Cosmic Void + Negative Strobe + RF Static',
    dim_carcosa: 'Aldebaran Gold Haze + Downbeat Match-Cut',
  }[preset.style_fx] || preset.style_fx || 'Clean';

  const foldCols = Number(preset.fold_in_columns || 1);
  if (els.foldInBadge) {
    els.foldInBadge.textContent = foldCols === 3 ? '3-Column Fold-In Active' : '1-Stream Canvas';
    els.foldInBadge.style.color = foldCols === 3 ? '#f43f5e' : '#c084fc';
  }

  els.presetConfigBadges.innerHTML = `
    <span class="tag" style="background:rgba(56,189,248,0.14);color:#7dd3fc;border-color:rgba(56,189,248,0.35);">⏱ ${floor}s–${ceil}s</span>
    <span class="tag" style="background:rgba(168,85,247,0.14);color:#d8b4fe;border-color:rgba(168,85,247,0.35);">🧭 ${sortLabel}</span>
    <span class="tag" style="background:rgba(245,158,11,0.14);color:#fcd34d;border-color:rgba(245,158,11,0.35);">✨ ${fxLabel}</span>
  `;
}

function applyPresetConfiguration(preset, autoRebuild = false) {
  if (!preset) return;
  els.templateDescText.textContent = preset.description || '';
  renderPresetBadges(preset);

  const isManual = Boolean(preset && preset.id === 'manual_workbench_slate');
  Studio.splicerMode = isManual ? 'manual' : 'preset';
  if (!isManual && preset && preset.id) {
    Studio.lastPresetId = preset.id;
  }
  if (els.modePresetBtn) els.modePresetBtn.classList.toggle('active', !isManual);
  if (els.modeManualBtn) els.modeManualBtn.classList.toggle('active', isManual);

  if (typeof preset.min_cut_floor === 'number') {
    els.minCutSlider.value = preset.min_cut_floor;
    els.minCutVal.textContent = `${Number(preset.min_cut_floor).toFixed(2)}s`;
  }
  if (typeof preset.preserve_full_duration === 'boolean') {
    els.chkPreserveFullDuration.checked = preset.preserve_full_duration;
  }
  if (typeof preset.story_vs_chop === 'number') {
    els.storyVsChopSlider.value = Math.round(preset.story_vs_chop * 100);
    updateStoryVsChopLabel();
  }
  if (typeof preset.fx_intensity === 'number') {
    els.fxIntensitySlider.value = preset.fx_intensity;
    els.fxIntensityVal.textContent = `${Math.round(preset.fx_intensity * 100)}%`;
  }
  if (preset.transition_mode) {
    els.transitionModeSelect.value = preset.transition_mode;
  }
  if (els.chkSprocketSlip) {
    els.chkSprocketSlip.checked = Boolean(preset.sprocket_slip || preset.style_fx === 'brakhage_emulsion');
  }
  if (els.chkTypoFlashes) {
    els.chkTypoFlashes.checked = Boolean(preset.typographic_flashes || preset.style_fx === 'burroughs_cutup');
  }
  if (els.chkStepPrint12fps) {
    els.chkStepPrint12fps.checked = Boolean(preset.step_print_12fps || preset.style_fx === 'lynch_monochrome');
  }
  if (els.chkSubliminalSigil) {
    els.chkSubliminalSigil.checked = Boolean(
      preset.subliminal_sigil_flash ||
      preset.style_fx === 'chaos_sigil' ||
      preset.style_fx === 'typhonian_transmission'
    );
  }
  if (els.chkObsidianScrying) {
    els.chkObsidianScrying.checked = Boolean(
      preset.obsidian_scrying_vignette ||
      preset.style_fx === 'enochian_scrying' ||
      preset.style_fx === 'dim_carcosa'
    );
  }
  if (els.chkThelemicBloom) {
    els.chkThelemicBloom.checked = Boolean(
      preset.thelemic_dye_bloom ||
      preset.style_fx === 'babalon_working'
    );
  }
  if (els.chkCosmicStatic) {
    els.chkCosmicStatic.checked = Boolean(
      preset.cosmic_static_glitch ||
      preset.style_fx === 'typhonian_transmission'
    );
  }
  if (els.chkEchoTunnel && typeof preset.geometric_echo_tunnel === 'boolean') {
    els.chkEchoTunnel.checked = preset.geometric_echo_tunnel;
  }

  if (autoRebuild && Studio.audio && (Studio.clips.length || preset.id === 'manual_workbench_slate')) {
    triggerGenerateTimeline();
  }
}

function populateTemplates(selectedId = null) {
  els.templateSelect.innerHTML = '';

  const optgroupCore = document.createElement('optgroup');
  optgroupCore.label = '── Core & Commercial Styles ──';

  const optgroupAvant = document.createElement('optgroup');
  optgroupAvant.label = '── Avant-Garde & Auteur Grammars ──';

  const optgroupEsoteric = document.createElement('optgroup');
  optgroupEsoteric.label = '── Esoteric & Occult Traditions ──';

  Studio.templates.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    const cat = (t.category || 'core').toLowerCase();
    if (cat === 'avant_garde') {
      optgroupAvant.appendChild(opt);
    } else if (cat === 'esoteric') {
      optgroupEsoteric.appendChild(opt);
    } else {
      optgroupCore.appendChild(opt);
    }
  });

  if (!optgroupEsoteric.children.length) {
    const placeholder = document.createElement('option');
    placeholder.value = '__esoteric_placeholder__';
    placeholder.disabled = true;
    placeholder.textContent = 'Coming Soon — Alchemical & Occult Splicing Grammars';
    optgroupEsoteric.appendChild(placeholder);
  }

  els.templateSelect.appendChild(optgroupCore);
  els.templateSelect.appendChild(optgroupAvant);
  els.templateSelect.appendChild(optgroupEsoteric);

  if (selectedId && Studio.templates.some((t) => t.id === selectedId)) {
    els.templateSelect.value = selectedId;
  }
  const activePreset = Studio.templates.find((t) => t.id === els.templateSelect.value) || Studio.templates[0];
  applyPresetConfiguration(activePreset, false);

  els.templateSelect.onchange = () => {
    const sel = Studio.templates.find((t) => t.id === els.templateSelect.value);
    if (sel) {
      applyPresetConfiguration(sel, true);
      triggerWorkspaceAutoSave();
    }
  };
}

function setSplicerMode(mode, autoRebuild = true) {
  Studio.splicerMode = mode;
  const isPreset = (mode === 'preset');
  if (els.modePresetBtn) els.modePresetBtn.classList.toggle('active', isPreset);
  if (els.modeManualBtn) els.modeManualBtn.classList.toggle('active', !isPreset);

  if (isPreset) {
    let targetPresetId = Studio.lastPresetId;
    if (!targetPresetId || targetPresetId === 'manual_workbench_slate') {
      const firstPreset = Studio.templates.find((t) => t.id !== 'manual_workbench_slate');
      targetPresetId = firstPreset ? firstPreset.id : 'narrative_storyboard';
    }
    if (els.templateSelect) {
      els.templateSelect.value = targetPresetId;
      const sel = Studio.templates.find((t) => t.id === targetPresetId);
      if (sel) {
        applyPresetConfiguration(sel, autoRebuild);
      }
    }
  } else {
    if (els.templateSelect && els.templateSelect.value !== 'manual_workbench_slate') {
      Studio.lastPresetId = els.templateSelect.value;
      els.templateSelect.value = 'manual_workbench_slate';
      const sel = Studio.templates.find((t) => t.id === 'manual_workbench_slate');
      if (sel) {
        applyPresetConfiguration(sel, autoRebuild);
      }
    }
  }
  triggerWorkspaceAutoSave();
}

if (els.modePresetBtn) {
  els.modePresetBtn.onclick = () => setSplicerMode('preset', true);
}
if (els.modeManualBtn) {
  els.modeManualBtn.onclick = () => setSplicerMode('manual', true);
}

// Floating Quick-Look Hover Preview Popover
function positionMediaHoverPreview(e) {
  const popover = document.getElementById('mediaHoverPreview');
  if (!popover || popover.style.display !== 'flex') return;
  const popW = popover.offsetWidth || 280;
  const popH = popover.offsetHeight || 190;
  let x = e.clientX + 15;
  let y = e.clientY - 10;
  if (x + popW > window.innerWidth - 12) {
    x = e.clientX - popW - 15;
  }
  if (y + popH > window.innerHeight - 12) {
    y = window.innerHeight - popH - 12;
  }
  if (x < 10) x = 10;
  if (y < 10) y = 10;
  popover.style.left = `${Math.round(x)}px`;
  popover.style.top = `${Math.round(y)}px`;
}

function showMediaHoverPreview(e, c, isStill) {
  const popover = document.getElementById('mediaHoverPreview');
  if (!popover || !c) return;

  const srcUrl = toAssetUrl(c.clip_url || `/workspace/clips/${c.filename}`);
  const resLabel = (c.width && c.height) ? `${c.width}x${c.height}` : 'HD';

  let mediaHtml = '';
  if (isStill) {
    mediaHtml = `
      <div class="media-hover-media-wrap">
        <img src="${srcUrl}" alt="${c.filename}" />
      </div>
      <div class="media-hover-footer">
        <div class="media-hover-title" title="${c.filename}">🖼 ${c.filename}</div>
        <div class="media-hover-meta">
          <span class="clip-res-badge">${resLabel}</span>
          <span style="color:#c084fc;">KB: ${(c.ken_burns_preset || 'zoom_in_pan_right').replace(/_/g, ' ')}</span>
        </div>
      </div>
    `;
  } else {
    mediaHtml = `
      <div class="media-hover-media-wrap">
        <video src="${srcUrl}" autoplay muted loop playsinline></video>
      </div>
      <div class="media-hover-footer">
        <div class="media-hover-title" title="${c.filename}">🎬 ${c.filename}</div>
        <div class="media-hover-meta">
          <span class="clip-res-badge">${resLabel}</span>
          <span style="color:#38bdf8;">${Number(c.duration || 0).toFixed(1)}s • ${c.fps ? Math.round(c.fps) + 'fps' : '30fps'}</span>
        </div>
      </div>
    `;
  }

  popover.innerHTML = mediaHtml;
  popover.style.display = 'flex';
  positionMediaHoverPreview(e);
}

function hideMediaHoverPreview() {
  const popover = document.getElementById('mediaHoverPreview');
  if (!popover) return;
  popover.innerHTML = '';
  popover.style.display = 'none';
}

window.addEventListener('dragstart', hideMediaHoverPreview, true);
window.addEventListener('scroll', hideMediaHoverPreview, true);


function createMediaClipCard(c, isStill) {
  const card = document.createElement('div');
  card.className = 'clip-card';
  card.draggable = true;
  card.title = 'Click to inspect • Drag onto any timeline cut block to replace its media (or onto empty timeline space to add a block)';
  card.ondragstart = (e) => {
    hideMediaHoverPreview();
    e.dataTransfer.setData('text/plain', c.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const energyPct = Math.round((c.motion_score || 0.4) * 100);
  const curDur = isStill ? Number(c.duration || getStillDefaultDuration()) : Number(c.duration || 4.0);
  const badgeText = isStill ? `🖼 ${curDur.toFixed(1)}s` : `${curDur.toFixed(1)}s`;
  const resText = (c.width && c.height) ? `${c.width}x${c.height}` : 'HD';
  const seqBadge =
    c.sequence_order !== null && c.sequence_order !== undefined
      ? `<span class="tag" style="background:rgba(16,185,129,0.18);color:#6ee7b7;border-color:rgba(16,185,129,0.4);font-weight:700;">#${String(c.sequence_order).padStart(2, '0')} STORY</span>`
      : '';
  const kbBadge = isStill
    ? `<span class="clip-kb-badge">KB: ${(c.ken_burns_preset || 'zoom_in_pan_right').replace(/_/g, ' ')}</span>`
    : '';
  const resBadge = `<span class="clip-res-badge">${resText}</span>`;
  const vtags = (c.vibe_tags || []).slice(0, 3).map((t) => `<span class="tag">${t}</span>`).join('');
  const stags = (c.recommended_sections || []).slice(0, 2).map((s) => `<span class="tag tag-sec">${s}</span>`).join('');

  card.innerHTML = `
    <div class="clip-thumb-wrap">
      <img src="${toAssetUrl(c.thumbnail)}?t=${Date.now()}" alt="${c.filename}" />
      <span class="clip-dur-badge" style="${isStill ? 'background:rgba(124,58,237,0.88);' : ''}">${badgeText}</span>
      <div class="clip-energy-bar" style="width:${energyPct}%;"></div>
    </div>
    <div class="clip-info">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
        <div class="clip-title" title="${c.filename}">${c.filename}</div>
        <span style="font-size:10px;color:var(--amber);font-weight:700;flex-shrink:0;">⚡${energyPct}%</span>
      </div>
      <div class="clip-desc">${c.description || ''}</div>
      <div class="tag-row">${seqBadge}${resBadge}${kbBadge}${vtags}${stags}</div>
    </div>
  `;

  const thumbWrap = card.querySelector('.clip-thumb-wrap');
  if (thumbWrap) {
    thumbWrap.onmouseenter = (e) => showMediaHoverPreview(e, c, isStill);
    thumbWrap.onmousemove = (e) => positionMediaHoverPreview(e);
    thumbWrap.onmouseleave = () => hideMediaHoverPreview();
  }

  card.onclick = () => openClipInspector(c.id);
  return card;
}

function renderClipLibrary() {
  const totalClips = Studio.clips.length;
  if (els.clipCountBadge) els.clipCountBadge.textContent = totalClips;
  preloadStillImages();

  // Sort display so numbered Story Spine clips appear in chronological order first
  const sortedClips = [...Studio.clips].sort((a, b) => {
    const sa = a.sequence_order !== null && a.sequence_order !== undefined ? a.sequence_order : 99999;
    const sb = b.sequence_order !== null && b.sequence_order !== undefined ? b.sequence_order : 99999;
    if (sa !== sb) return sa - sb;
    return (a.filename || '').localeCompare(b.filename || '');
  });

  const videoClips = sortedClips.filter((c) => c.media_type !== 'image');
  const stillClips = sortedClips.filter((c) => c.media_type === 'image');

  if (els.videoCountBadge) els.videoCountBadge.textContent = videoClips.length;
  if (els.stillCountBadge) els.stillCountBadge.textContent = stillClips.length;

  // Render Video Clips Bay
  if (els.videoLibraryList) {
    els.videoLibraryList.innerHTML = '';
    if (!videoClips.length) {
      els.videoLibraryList.innerHTML = `<div class="empty-bay-hint">No video clips (.mp4, .mov, .webm) loaded yet.</div>`;
    } else {
      videoClips.forEach((c) => {
        els.videoLibraryList.appendChild(createMediaClipCard(c, false));
      });
    }
  }

  // Render Still Images Bay
  if (els.stillLibraryList) {
    els.stillLibraryList.innerHTML = '';
    if (!stillClips.length) {
      els.stillLibraryList.innerHTML = `<div class="empty-bay-hint">No still images (.png, .jpg, .webp) loaded yet.</div>`;
    } else {
      stillClips.forEach((c) => {
        els.stillLibraryList.appendChild(createMediaClipCard(c, true));
      });
    }
  }

  // Fallback flat list for backward compatibility
  if (els.clipLibraryList) {
    els.clipLibraryList.innerHTML = '';
    sortedClips.forEach((c) => {
      els.clipLibraryList.appendChild(createMediaClipCard(c, c.media_type === 'image'));
    });
  }
}

function renderAudioState() {
  if (!Studio.audio) {
    if (els.audioTrackLabel) els.audioTrackLabel.textContent = '🎵 Drop Music Track (.mp3, .wav, .flac)';
    if (els.audioStatsLabel) els.audioStatsLabel.textContent = 'Extracts BPM, Downbeats, Kick/Snare Stems & Energy-Arc Sections';
    if (els.statBpm) els.statBpm.textContent = 'BPM: --';
    if (els.btnLoadAudio) {
      els.btnLoadAudio.textContent = '🎵 LOAD AUDIO TRACK';
      els.btnLoadAudio.classList.remove('has-track');
    }
    if (els.btnEjectAudio) {
      els.btnEjectAudio.style.display = 'none';
    }
    return;
  }

  const a = Studio.audio;
  if (els.audioTrackLabel) els.audioTrackLabel.textContent = `🎵 ${a.filename}`;
  if (els.audioStatsLabel) els.audioStatsLabel.textContent = `${a.bpm} BPM • ${a.duration.toFixed(1)}s • ${a.beats.length} Beats • ${a.downbeats.length} Bars • ${a.snare_transients.length} Snare Hits`;
  if (els.statBpm) els.statBpm.textContent = `BPM: ${a.bpm}`;

  if (els.btnLoadAudio) {
    els.btnLoadAudio.textContent = `🎵 Track: ${a.filename}`;
    els.btnLoadAudio.classList.add('has-track');
  }
  if (els.btnEjectAudio) {
    els.btnEjectAudio.style.display = 'inline-block';
  }

  const resolvedAudioUrl = toAssetUrl(a.audio_url);
  if (els.mainAudio.getAttribute('data-src') !== resolvedAudioUrl) {
    els.mainAudio.src = resolvedAudioUrl;
    els.mainAudio.setAttribute('data-src', resolvedAudioUrl);
  }

  renderSectionsSlotEditor();
}

function renderSectionsSlotEditor() {
  const sections = (Studio.audio && Studio.audio.sections) || [];
  if (!sections.length) return;
  els.sectionsSlotList.innerHTML = '';

  sections.forEach((sec, idx) => {
    const card = document.createElement('div');
    card.className = 'section-slot-card';
    card.setAttribute('data-type', sec.type);

    card.innerHTML = `
      <div class="section-slot-top">
        <select class="form-select sec-type-select" data-idx="${idx}" style="padding:3px 6px;font-weight:700;font-size:11px;">
          ${['intro', 'verse', 'build', 'drop', 'chorus', 'outro'].map((t) =>
            `<option value="${t}" ${sec.type === t ? 'selected' : ''}>${t.toUpperCase()}</option>`
          ).join('')}
        </select>
        <span style="font-size:11px;color:var(--text-muted);font-family:monospace;">
          ${sec.start.toFixed(1)}s – ${sec.end.toFixed(1)}s
        </span>
        <select class="form-select sec-cut-select" data-idx="${idx}" style="padding:3px 5px;font-size:11px;" title="Override cut pacing for this section">
          <option value="" ${!sec.cut_mode ? 'selected' : ''}>Auto (Energy-Arc)</option>
          <option value="energy_arc" ${sec.cut_mode === 'energy_arc' ? 'selected' : ''}>Energy Arc (2-4s -> 0.25s)</option>
          <option value="2_bars" ${sec.cut_mode === '2_bars' ? 'selected' : ''}>Every 2 Bars</option>
          <option value="1_bar" ${sec.cut_mode === '1_bar' ? 'selected' : ''}>Every 1 Bar</option>
          <option value="2_beats" ${sec.cut_mode === '2_beats' ? 'selected' : ''}>Every 2 Beats</option>
          <option value="1_beat" ${sec.cut_mode === '1_beat' ? 'selected' : ''}>Every 1 Beat</option>
          <option value="accelerate" ${sec.cut_mode === 'accelerate' ? 'selected' : ''}>Accelerate Build</option>
          <option value="transients_or_beat" ${sec.cut_mode === 'transients_or_beat' ? 'selected' : ''}>Kick/Snare Hits</option>
        </select>
      </div>
      <input type="text" class="form-input sec-prompt-input" data-idx="${idx}"
        placeholder="Section lyrics or visual vibe prompt (e.g. fire crowd, calm night)..."
        value="${sec.prompt || ''}" style="padding:4px 7px;font-size:11px;" />
    `;
    els.sectionsSlotList.appendChild(card);
  });

  els.sectionsSlotList.querySelectorAll('.sec-type-select').forEach((el) => {
    el.onchange = (e) => {
      const i = Number(e.target.getAttribute('data-idx'));
      Studio.audio.sections[i].type = e.target.value;
      Studio.audio.sections[i].label = `${e.target.value.toUpperCase()} ${i + 1}`;
      renderSectionsSlotEditor();
    };
  });
  els.sectionsSlotList.querySelectorAll('.sec-cut-select').forEach((el) => {
    el.onchange = (e) => {
      const i = Number(e.target.getAttribute('data-idx'));
      Studio.audio.sections[i].cut_mode = e.target.value || undefined;
    };
  });
  els.sectionsSlotList.querySelectorAll('.sec-prompt-input').forEach((el) => {
    el.oninput = (e) => {
      const i = Number(e.target.getAttribute('data-idx'));
      Studio.audio.sections[i].prompt = e.target.value;
    };
  });
}

function startEdgeTrimDrag(e, eventIndex, side) {
  e.stopPropagation();
  e.preventDefault();
  const events = (Studio.timeline && Studio.timeline.events) || [];
  const ev = events[eventIndex];
  if (!ev) return;

  const startMouseX = e.clientX;
  const origStart = Number(ev.start);
  const origEnd = Number(ev.end);
  const blockEl = e.currentTarget.parentElement;

  const onMove = (moveEv) => {
    const deltaSec = (moveEv.clientX - startMouseX) / Studio.pxPerSec;
    if (side === 'left') {
      const newStart = Math.max(0, Math.min(origEnd - 0.08, origStart + deltaSec));
      const newDur = origEnd - newStart;
      blockEl.style.left = `${newStart * Studio.pxPerSec}px`;
      blockEl.style.width = `${Math.max(5, newDur * Studio.pxPerSec - 1)}px`;
    } else {
      const maxDur = (Studio.audio && Studio.audio.duration) || 300;
      const newEnd = Math.min(maxDur, Math.max(origStart + 0.08, origEnd + deltaSec));
      const newDur = newEnd - origStart;
      blockEl.style.width = `${Math.max(5, newDur * Studio.pxPerSec - 1)}px`;
    }
  };

  const onUp = async (upEv) => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    const deltaSec = (upEv.clientX - startMouseX) / Studio.pxPerSec;
    if (Math.abs(deltaSec) < 0.015) return;

    const payload = { event_index: eventIndex };
    if (side === 'left') {
      payload.new_start = Number(Math.max(0, Math.min(origEnd - 0.08, origStart + deltaSec)).toFixed(3));
    } else {
      const maxDur = (Studio.audio && Studio.audio.duration) || 300;
      payload.new_end = Number(Math.min(maxDur, Math.max(origStart + 0.08, origEnd + deltaSec)).toFixed(3));
    }

    try {
      const res = await api('/api/timeline/trim-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      Studio.timeline = res.timeline;
      Studio.activeSlotIndex = -1;
      renderTimelineView();
      syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
    } catch (err) {
      console.error('Trim failed:', err);
      renderTimelineView();
    }
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function renderTimelineView() {
  const dur = (Studio.audio && Studio.audio.duration) || (Studio.timeline && Studio.timeline.total_duration) || 24.0;
  const totalWidth = Math.max(800, Math.ceil(dur * Studio.pxPerSec));
  els.timelineTracks.style.width = `${totalWidth}px`;

  const numberedCount = (Studio.clips || []).filter((c) => c.sequence_order !== null && c.sequence_order !== undefined).length;
  const preserveOn = Studio.timeline && Studio.timeline.preserve_full_duration;
  els.statSpineBadge.textContent = numberedCount >= 2
    ? `Story Spine: ${numberedCount} Ordered${preserveOn ? ' • Full Duration Preserved' : ''}`
    : (preserveOn ? 'Full Clip Duration: Active' : 'Story Spine: Dynamic AI');

  // 1. Render Sections Track
  els.sectionsTrack.innerHTML = '';
  if (Studio.audio && Studio.audio.sections) {
    Studio.audio.sections.forEach((sec) => {
      const block = document.createElement('div');
      block.className = `section-block ${sec.type}`;
      block.style.left = `${sec.start * Studio.pxPerSec}px`;
      block.style.width = `${Math.max(4, (sec.end - sec.start) * Studio.pxPerSec - 2)}px`;
      block.textContent = `${sec.type.toUpperCase()} (${(sec.end - sec.start).toFixed(1)}s)`;
      els.sectionsTrack.appendChild(block);
    });
  }

  // 2. Render Waveform + Beat/Bar/Transient Grid
  const wfCanvas = els.waveformCanvas;
  wfCanvas.width = totalWidth;
  wfCanvas.height = 76;
  const wctx = wfCanvas.getContext('2d');
  
  const bgDarkest = getCssColor('--bg-darkest', '#090a0c');
  const colorPrimary = getCssColor('--color-primary', '#dc2626');
  const colorPrimaryHover = getCssColor('--color-primary-hover', '#ef4444');
  const colorSecondary = getCssColor('--color-secondary', '#2563eb');

  wctx.fillStyle = bgDarkest;
  wctx.fillRect(0, 0, totalWidth, 76);

  if (Studio.audio) {
    const peaks = Studio.audio.waveform_peaks || [];
    const midY = 38;

    // High-contrast vertical gradient combining Royal Blue and Crimson Red
    const peakGrad = wctx.createLinearGradient(0, 4, 0, 72);
    peakGrad.addColorStop(0, hexToRgba(colorSecondary, 0.70) || 'rgba(37, 99, 235, 0.70)');
    peakGrad.addColorStop(0.5, hexToRgba(colorPrimary, 0.85) || 'rgba(220, 38, 38, 0.85)');
    peakGrad.addColorStop(1, hexToRgba(colorSecondary, 0.70) || 'rgba(37, 99, 235, 0.70)');
    wctx.fillStyle = peakGrad;

    for (let x = 0; x < totalWidth; x += 2) {
      const pIdx = Math.floor((x / totalWidth) * peaks.length);
      const amp = (peaks[pIdx] || 0.05) * 32;
      wctx.fillRect(x, midY - amp, 1.5, amp * 2);
    }

    // Beats grid (subtle secondary blue)
    wctx.strokeStyle = hexToRgba(colorSecondary, 0.25) || 'rgba(37, 99, 235, 0.25)';
    wctx.lineWidth = 1;
    (Studio.audio.beats || []).forEach((bt) => {
      const bx = bt * Studio.pxPerSec;
      wctx.beginPath();
      wctx.moveTo(bx, 0);
      wctx.lineTo(bx, 76);
      wctx.stroke();
    });

    // Downbeats / Bar markers (Crimson red accent with high contrast label)
    wctx.strokeStyle = hexToRgba(colorPrimary, 0.85) || 'rgba(220, 38, 38, 0.85)';
    wctx.lineWidth = 1.5;
    (Studio.audio.downbeats || []).forEach((db, barIdx) => {
      const dx = db * Studio.pxPerSec;
      wctx.beginPath();
      wctx.moveTo(dx, 0);
      wctx.lineTo(dx, 76);
      wctx.stroke();
      wctx.fillStyle = colorPrimaryHover;
      wctx.font = 'bold 9px monospace';
      wctx.fillText(`B${barIdx + 1}`, dx + 3, 10);
    });

    // Snare / transient hits (Crimson Red / Accent dots)
    wctx.fillStyle = colorPrimary;
    (Studio.audio.snare_transients || []).forEach((st) => {
      const sx = st * Studio.pxPerSec;
      wctx.beginPath();
      wctx.arc(sx, 68, 2.2, 0, Math.PI * 2);
      wctx.fill();
    });

    // 2a. Render Audio Slice Edits Tinting Over Waveform (Reverse, Chop, Halftime, Mute)
    const sliceEdits = Studio.audio.sliceEdits || [];
    sliceEdits.forEach((edit) => {
      const sx = edit.start * Studio.pxPerSec;
      const ex = edit.end * Studio.pxPerSec;
      const sw = Math.max(2, ex - sx);

      if (edit.action === 'reverse') {
        // Amber tint for reverse
        wctx.fillStyle = 'rgba(245, 158, 11, 0.38)';
        wctx.fillRect(sx, 0, sw, 76);
        wctx.strokeStyle = '#f59e0b';
        wctx.lineWidth = 1.5;
        wctx.strokeRect(sx, 0, sw, 76);
        wctx.fillStyle = '#fef08a';
        wctx.font = 'bold 9px monospace';
        wctx.fillText('↺ REV', sx + 3, 22);
      } else if (edit.action === 'chop') {
        // Cyan stripes for chops
        wctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
        wctx.fillRect(sx, 0, sw, 76);
        wctx.save();
        wctx.beginPath();
        wctx.rect(sx, 0, sw, 76);
        wctx.clip();
        wctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        wctx.lineWidth = 2;
        for (let lx = sx - 76; lx < ex + 76; lx += 10) {
          wctx.beginPath();
          wctx.moveTo(lx, 76);
          wctx.lineTo(lx + 76, 0);
          wctx.stroke();
        }
        wctx.restore();
        wctx.strokeStyle = '#38bdf8';
        wctx.lineWidth = 1.5;
        wctx.strokeRect(sx, 0, sw, 76);
        wctx.fillStyle = '#bae6fd';
        wctx.font = 'bold 9px monospace';
        wctx.fillText('⚡ CHOP', sx + 3, 22);
      } else if (edit.action === 'halftime') {
        // Purple tint for half-speed tape stop
        wctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
        wctx.fillRect(sx, 0, sw, 76);
        wctx.strokeStyle = '#a855f7';
        wctx.lineWidth = 1.5;
        wctx.strokeRect(sx, 0, sw, 76);
        wctx.fillStyle = '#e9d5ff';
        wctx.font = 'bold 9px monospace';
        wctx.fillText('🐢 0.5x', sx + 3, 22);
      } else if (edit.action === 'mute') {
        // Muted dark red drop-out
        wctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        wctx.fillRect(sx, 0, sw, 76);
        wctx.strokeStyle = '#ef4444';
        wctx.lineWidth = 1.5;
        wctx.strokeRect(sx, 0, sw, 76);
        wctx.fillStyle = '#fca5a5';
        wctx.font = 'bold 9px monospace';
        wctx.fillText('🔇 MUTE', sx + 3, 22);
      }
    });
  }

  // 2b. Render Dedicated Timed Lyrics Lane (.lrc / .srt) Below Audio Waveform
  if (els.lyricsTrack) {
    els.lyricsTrack.innerHTML = '';
    const lyricCues = (Studio.lyrics && Array.isArray(Studio.lyrics.cues)) ? Studio.lyrics.cues : [];
    const lyricOffset = getLyricGlobalOffset();
    const renderEnabled = isLyricsRenderEnabled();

    const headerPill = document.createElement('div');
    headerPill.className = 'lyrics-lane-header';
    const fmtBadge = Studio.lyrics && Studio.lyrics.format ? Studio.lyrics.format.toUpperCase() : 'LRC/SRT';
    headerPill.innerHTML = `
      <span>📝 LYRICS (${lyricCues.length ? `${lyricCues.length} ${fmtBadge} cues` : 'None'})</span>
      <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;color:#a7f3d0;" title="Master toggle: Include Lyrics in Final Render">
        <input type="checkbox" id="chkIncludeLyricsLane" ${renderEnabled ? 'checked' : ''} />
        <span>Include Lyrics in Final Render</span>
      </label>
      ${lyricCues.length
        ? `<button class="btn btn-sm" id="btnClearLyricsLane" style="padding:0px 5px;font-size:9.5px;" title="Clear loaded lyrics">✕</button>`
        : `<button class="btn btn-sm btn-accent" id="btnImportLyricsLane" style="padding:0px 6px;font-size:9.5px;">+ .lrc/.srt</button>`
      }
    `;
    els.lyricsTrack.appendChild(headerPill);

    const laneChk = headerPill.querySelector('#chkIncludeLyricsLane');
    if (laneChk) {
      laneChk.onchange = (e) => {
        e.stopPropagation();
        setIncludeLyricsInRender(laneChk.checked);
      };
    }
    const clearBtn = headerPill.querySelector('#btnClearLyricsLane');
    if (clearBtn) {
      clearBtn.onclick = async (e) => {
        e.stopPropagation();
        await api('/api/lyrics', { method: 'DELETE' });
        Studio.lyrics = null;
        renderTimelineView();
      };
    }
    const impBtn = headerPill.querySelector('#btnImportLyricsLane');
    if (impBtn && els.lyricFileInput) {
      impBtn.onclick = (e) => {
        e.stopPropagation();
        els.lyricFileInput.click();
      };
    }

    const currPlayhead = els.mainAudio.currentTime || 0;
    lyricCues.forEach((cue, cIdx) => {
      const effStart = Number(cue.start) + lyricOffset;
      const effEnd = Number(cue.end) + lyricOffset;
      if (effEnd <= 0) return;
      const visStart = Math.max(0, effStart);
      const visDur = Math.max(0.15, effEnd - visStart);

      const cueDiv = document.createElement('div');
      const isActive = currPlayhead >= effStart && currPlayhead < effEnd;
      cueDiv.className = `lyric-cue-block ${isActive ? 'active' : ''} ${!renderEnabled ? 'bypassed' : ''}`;
      cueDiv.setAttribute('data-lyric-idx', String(cIdx));
      cueDiv.style.left = `${visStart * Studio.pxPerSec}px`;
      cueDiv.style.width = `${Math.max(18, visDur * Studio.pxPerSec - 2)}px`;
      const singleLineText = String(cue.text || '').replace(/\s+/g, ' ').trim();
      cueDiv.textContent = singleLineText;
      cueDiv.title = `[${formatTime(effStart)} → ${formatTime(effEnd)}] (raw ${formatTime(cue.start)}, offset ${formatSignedOffset(lyricOffset)})\n${cue.text}`;
      cueDiv.onclick = (e) => {
        e.stopPropagation();
        seekToTime(Math.max(0, effStart + 0.01));
      };
      els.lyricsTrack.appendChild(cueDiv);
    });

    els.lyricsTrack.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };
    els.lyricsTrack.ondrop = async (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files || []);
      const lrcFile = files.find((f) => /\.(lrc|srt|txt)$/i.test(f.name));
      if (lrcFile) {
        await uploadLyricsFileToStudio(lrcFile);
      }
    };
  }

  // 3. Render Assembled Story-Spine & Cutaway Blocks
  els.cutsTrack.innerHTML = '';
  const events = (Studio.timeline && Studio.timeline.events) || [];
  const pinnedCount = events.filter((e) => e.pinned).length;
  els.statCuts.textContent = `Cuts: ${events.length}${pinnedCount ? ` (${pinnedCount} 📌)` : ''}`;

  // Allow dropping a clip from the Library directly onto empty timeline track space
  els.cutsTrack.ondragover = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    els.cutsTrack.classList.add('drag-over');
  };
  els.cutsTrack.ondragleave = (e) => {
    if (e.target === els.cutsTrack) {
      els.cutsTrack.classList.remove('drag-over');
    }
  };
  els.cutsTrack.ondrop = async (e) => {
    if (e.target.closest('.cut-block')) return;
    e.preventDefault();
    const droppedClipId = e.dataTransfer.getData('text/plain');
    if (!droppedClipId) return;
    const rect = els.cutsTrack.getBoundingClientRect();
    const dropSec = Math.max(0, (e.clientX - rect.left) / Studio.pxPerSec);
    const droppedClip = Studio.clips.find((c) => c.id === droppedClipId);
    const isStill = droppedClip && droppedClip.media_type === 'image';
    const blockDur = isStill ? getStillDefaultDuration() : 2.5;
    try {
      const res = await api('/api/timeline/add-manual-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_id: droppedClipId, start: Number(dropSec.toFixed(3)), duration: blockDur }),
      });
      Studio.timeline = res.timeline;
      Studio.activeSlotIndex = -1;
      renderTimelineView();
      syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
    } catch (err) {
      alert(`Add block failed: ${err.message}`);
    }
  };

  if (!events.length) {
    const emptyHint = document.createElement('div');
    emptyHint.style.cssText = 'position:sticky;left:24px;display:inline-flex;align-items:center;gap:8px;height:100%;color:var(--text-muted);font-size:12px;padding:0 18px;pointer-events:none;';
    emptyHint.innerHTML = '🛠️ <b>Manual Workbench (Empty Slate):</b> Drag any clip/image from the Library onto this track or click <b>"+ Add Block"</b> to assemble cuts manually.';
    els.cutsTrack.appendChild(emptyHint);
    return;
  }

  const opticalIconMap = {
    solarized_sabattier: '☀️',
    two_color_crimson_charcoal: '🩸',
    two_color_cyan_amber: '🧪',
    infrared_thermal: '🌡️',
    prism_horizontal_mirror: '🪞',
  };

  events.forEach((ev, idx) => {
    const div = document.createElement('div');
    const isCutaway = ev.role === 'cutaway_stab';
    const isPinned = Boolean(ev.pinned);
    div.className = `cut-block ${Studio.selectedCutIndex === idx ? 'selected' : ''} ${isPinned ? 'pinned' : ''}`;
    div.setAttribute('data-cut-idx', String(idx));
    div.style.left = `${ev.start * Studio.pxPerSec}px`;
    div.style.width = `${Math.max(5, ev.duration * Studio.pxPerSec - 1)}px`;
    if (isCutaway && !isPinned) {
      div.style.borderColor = '#f59e0b';
      div.style.background = 'rgba(245, 158, 11, 0.18)';
    }

    const pinIcon = isPinned ? '📌' : '';
    const revIcon = ev.ping_pong ? '🔁' : (ev.reverse ? '⏪' : '');
    const optIcon = opticalIconMap[ev.optical_treatment] || (ev.prism_mirror ? '🪞' : '');
    const transIcon = ev.transition === 'flash_white' ? '💥' : (ev.transition === 'quick_glitch' ? '⚡' : '');
    const kbLabel = ev.media_type === 'image' ? '🖼KB ' : '';
    const roleTag = isCutaway ? '⚡STAB ' : '';
    const speedIcon = (ev.speed && ev.speed !== 1.0) ? ` [${ev.speed}x]` : '';
    const fxIcon = (ev.style_fx && ev.style_fx !== 'clean') || ev.vhs_glitch || ev.strobe ? '✨' : '';
    div.title = `#${idx + 1}: ${ev.clip_filename} (${ev.duration.toFixed(2)}s | in:${(ev.in_point||0).toFixed(2)}s→out:${(ev.out_point||0).toFixed(2)}s)${isPinned ? ' [PINNED]' : ''}${ev.reverse ? ' [REVERSE]' : ''}${speedIcon}\nRight-click for Video Actions (Split, Reverse, Speeds, Video FX, Delete)\nDrag a clip here to replace media • Drag left/right edges to trim`;

    div.innerHTML = `
      <div class="cut-trim-handle left" title="Drag left edge to trim start time"></div>
      <div class="cut-trim-handle right" title="Drag right edge to trim duration"></div>
      <div class="cut-block-bg" style="background-image:url('${toAssetUrl(ev.clip_thumbnail)}')"></div>
      <div class="cut-block-label">${pinIcon}${revIcon}${optIcon}${fxIcon}${roleTag}${transIcon}${kbLabel}${ev.clip_filename}</div>
      <div class="cut-block-meta">${ev.duration.toFixed(2)}s [${(ev.in_point||0).toFixed(1)}s]${speedIcon}</div>
    `;

    const leftHandle = div.querySelector('.cut-trim-handle.left');
    const rightHandle = div.querySelector('.cut-trim-handle.right');
    if (leftHandle) leftHandle.onmousedown = (e) => startEdgeTrimDrag(e, idx, 'left');
    if (rightHandle) rightHandle.onmousedown = (e) => startEdgeTrimDrag(e, idx, 'right');

    // Drag & Drop clip from Library onto timeline block to replace media while keeping cut boundaries intact
    div.ondragover = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      div.classList.add('drag-over');
    };
    div.ondragleave = (e) => {
      if (!e.relatedTarget || !div.contains(e.relatedTarget)) {
        div.classList.remove('drag-over');
      }
    };
    div.ondrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      div.classList.remove('drag-over');
      const droppedClipId = e.dataTransfer.getData('text/plain');
      if (!droppedClipId) return;
      try {
        const res = await api('/api/timeline/swap-clip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_index: idx,
            new_clip_id: droppedClipId,
          }),
        });
        Studio.timeline = res.timeline;
        Studio.selectedCutIndex = idx;
        Studio.activeSlotIndex = -1;
        renderTimelineView();
        syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
      } catch (err) {
        alert(`Media replace failed: ${err.message}`);
      }
    };

    div.onclick = (e) => {
      e.stopPropagation();
      Studio.selectedCutIndex = idx;
      seekToTime(ev.start + 0.01);
      renderTimelineView();
      openClipInspector(ev.clip_id, idx);
    };
    els.cutsTrack.appendChild(div);
  });
  if (Studio.timeline && Studio.timeline.events && Studio.timeline.events.length) {
    triggerWorkspaceAutoSave();
  }
}

function seekToTime(t) {
  if (!Studio.audio) return;
  const clamped = Math.max(0, Math.min(Studio.audio.duration, t));
  els.mainAudio.currentTime = clamped;
  Studio.activeSlotIndex = -1;
  syncVideoDecodersToTime(clamped, true);
}

els.waveformCanvas.addEventListener('click', (e) => {
  const rect = els.waveformCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const targetSec = x / Studio.pxPerSec;
  seekToTime(targetSec);
});

/* =========================================================================
   DUAL-PLAYER PING-PONG BUFFERING POOL & FRAME-DROP FAILSAFE
   ========================================================================= */
function fastSeekVideo(video, targetTime) {
  if (!video || !Number.isFinite(targetTime) || targetTime < 0) return;
  try {
    if (typeof video.fastSeek === 'function') {
      video.fastSeek(targetTime);
    } else {
      video.currentTime = targetTime;
    }
  } catch (_) {
    try { video.currentTime = targetTime; } catch (__) {}
  }
}

const VideoPool = {
  playerA: null,
  playerB: null,
  activeTag: 'A', // 'A' | 'B'
  preloadedCutIdx: -1,
  preloadedUrl: null,
  isStandbyReady: false,
  lastRenderedCanvas: null,
  ctxLastRendered: null,
  hasCachedFrame: false,

  init() {
    this.playerA = els.vidA || document.getElementById('videoDecoderA');
    this.playerB = els.vidB || document.getElementById('videoDecoderB');
    if (!this.playerA) {
      this.playerA = document.createElement('video');
      this.playerA.id = 'videoDecoderA';
      document.body.appendChild(this.playerA);
      els.vidA = this.playerA;
    }
    if (!this.playerB) {
      this.playerB = document.createElement('video');
      this.playerB.id = 'videoDecoderB';
      document.body.appendChild(this.playerB);
      els.vidB = this.playerB;
    }

    [this.playerA, this.playerB, els.vidL, els.vidR].forEach((v) => {
      if (v) {
        v.preload = 'auto';
        v.muted = true;
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('muted', '');
        v.style.display = 'none';
        v.volume = 0;
      }
    });

    this.lastRenderedCanvas = document.createElement('canvas');
    this.lastRenderedCanvas.width = (els.previewCanvas && els.previewCanvas.width) ? els.previewCanvas.width : 1280;
    this.lastRenderedCanvas.height = (els.previewCanvas && els.previewCanvas.height) ? els.previewCanvas.height : 720;
    this.ctxLastRendered = this.lastRenderedCanvas.getContext('2d');
  },

  getActive() {
    if (!this.playerA || !this.playerB) this.init();
    return this.activeTag === 'A' ? this.playerA : this.playerB;
  },

  getStandby() {
    if (!this.playerA || !this.playerB) this.init();
    return this.activeTag === 'A' ? this.playerB : this.playerA;
  },

  swap() {
    const oldActive = this.getActive();
    try { oldActive.pause(); } catch (_) {}
    this.activeTag = this.activeTag === 'A' ? 'B' : 'A';
    Studio.activeDecoder = this.activeTag;
    this.preloadedCutIdx = -1;
    this.isStandbyReady = false;
    return this.getActive();
  },

  preloadNextCut(nextEv, nextIdx) {
    if (!nextEv || nextEv.media_type === 'image' || !nextEv.clip_url) return;
    const standby = this.getStandby();
    if (!standby) return;

    const resolvedUrl = toAssetUrl(nextEv.clip_url);
    const inPoint = Number(nextEv.in_point || 0);

    // If standby is already primed for this upcoming cut index and source URL:
    if (this.preloadedCutIdx === nextIdx && standby.getAttribute('data-clip') === resolvedUrl) {
      return;
    }

    this.preloadedCutIdx = nextIdx;
    this.preloadedUrl = resolvedUrl;
    this.isStandbyReady = false;
    Studio.preloadedNextIndex = nextIdx;

    // Avoid re-assigning .src if the same video clip is reused in subsequent slices
    const currentClip = standby.getAttribute('data-clip');
    if (currentClip !== resolvedUrl) {
      standby.setAttribute('data-clip', resolvedUrl);
      standby.src = resolvedUrl;
      standby.preload = 'auto';
      try { standby.load(); } catch (_) {}
    }

    const onSeekReady = () => {
      standby.removeEventListener('loadedmetadata', onSeekReady);
      standby.removeEventListener('canplay', onSeekReady);
      fastSeekVideo(standby, inPoint);
      try { standby.pause(); } catch (_) {}
      this.isStandbyReady = true;
    };

    if (standby.readyState >= 1) {
      fastSeekVideo(standby, inPoint);
      try { standby.pause(); } catch (_) {}
      this.isStandbyReady = standby.readyState >= 2;
    } else {
      standby.addEventListener('loadedmetadata', onSeekReady, { once: true });
      standby.addEventListener('canplay', onSeekReady, { once: true });
    }
  },

  cacheCurrentFrame(canvas) {
    if (!canvas || !canvas.width || !canvas.height) return;
    if (!this.lastRenderedCanvas) {
      this.lastRenderedCanvas = document.createElement('canvas');
      this.lastRenderedCanvas.width = canvas.width;
      this.lastRenderedCanvas.height = canvas.height;
      this.ctxLastRendered = this.lastRenderedCanvas.getContext('2d');
    }
    if (this.lastRenderedCanvas.width !== canvas.width || this.lastRenderedCanvas.height !== canvas.height) {
      this.lastRenderedCanvas.width = canvas.width;
      this.lastRenderedCanvas.height = canvas.height;
    }
    this.ctxLastRendered.drawImage(canvas, 0, 0);
    this.hasCachedFrame = true;
  }
};

function getActiveDecoderVideo() {
  return VideoPool.getActive();
}

function getStandbyDecoderVideo() {
  return VideoPool.getStandby();
}

function findNextVideoCut(events, currentIdx) {
  if (!events || !events.length) return null;
  for (let i = currentIdx + 1; i < events.length; i++) {
    if (events[i] && events[i].media_type !== 'image' && events[i].clip_url) {
      return { event: events[i], index: i };
    }
  }
  if (Studio.isLooping) {
    for (let i = 0; i <= currentIdx; i++) {
      if (events[i] && events[i].media_type !== 'image' && events[i].clip_url) {
        return { event: events[i], index: i };
      }
    }
  }
  return null;
}

function syncCompanionMedia(clipInfo, videoEl, localT, stepPrint12, revStutterKick, forceSeek = false) {
  if (!clipInfo || !clipInfo.clip_url) return null;
  const resolvedUrl = toAssetUrl(clipInfo.clip_url);
  if (clipInfo.media_type === 'image') {
    if (!Studio.imageCache[resolvedUrl]) {
      const im = new Image();
      im.src = resolvedUrl;
      Studio.imageCache[resolvedUrl] = im;
    }
    const img = Studio.imageCache[resolvedUrl];
    return img && img.complete ? img : null;
  }

  // Avoid re-assigning .src if the same video clip is reused
  if (videoEl.getAttribute('data-clip') !== resolvedUrl) {
    videoEl.setAttribute('data-clip', resolvedUrl);
    videoEl.src = resolvedUrl;
    videoEl.preload = 'auto';
    try { videoEl.load(); } catch (_) {}
  }
  const cDur = Math.max(0.5, clipInfo.clip_duration || 4.0);
  let effLocalT = stepPrint12 ? Math.floor(localT * 12) / 12 : localT;
  if (revStutterKick) {
    effLocalT = Math.max(0, effLocalT - 0.10);
  }
  const targetT = ((clipInfo.in_point || 0) + effLocalT) % cDur;
  try {
    if (stepPrint12 || revStutterKick || forceSeek || Math.abs(videoEl.currentTime - targetT) > 0.22) {
      fastSeekVideo(videoEl, targetT);
    }
  } catch (_) {}
  if (Studio.isPlaying && !stepPrint12) {
    videoEl.play().catch(() => {});
  } else {
    videoEl.pause();
  }
  return videoEl.readyState >= 2 ? videoEl : (VideoPool.hasCachedFrame ? VideoPool.lastRenderedCanvas : null);
}

function syncVideoDecodersToTime(t, forceSeek = false, bassVal = 0) {
  const events = (Studio.timeline && Studio.timeline.events) || [];
  if (!events.length) return null;

  let idx = events.findIndex((ev) => t >= ev.start && t < ev.end);
  if (idx === -1) idx = events.length - 1;

  const ev = events[idx];
  const rawLocalT = Math.max(0, t - ev.start);
  const evDur = Math.max(0.05, Number(ev.duration) || 1.0);
  const normP = Math.min(1.0, rawLocalT / evDur);
  const isReverse = Boolean(ev.reverse);
  const isPingPong = Boolean(ev.ping_pong);

  const styleFx = ev.style_fx || (Studio.timeline && Studio.timeline.style_fx) || 'clean';
  const liveFxOn = els.chkLiveFx.checked;
  const stepPrint12 = liveFxOn && Boolean(
    (els.chkStepPrint12fps && els.chkStepPrint12fps.checked) ||
    ev.step_print_12fps ||
    styleFx === 'lynch_monochrome'
  );
  const revStutterOn = liveFxOn && Boolean(
    ev.reverse_stutter ||
    styleFx === 'burroughs_cutup' ||
    styleFx === 'kubelka_metric'
  );
  const isRevStutterActive = revStutterOn && (bassVal > 0.54 || (ev.downbeat_punch && rawLocalT < 0.14));

  // Speed multiplier, Reverse Playback & Ping-Pong (Yo-Yo 50% forward / 50% reverse) time mapping
  const speed = Number(ev.speed) || 1.0;
  let mappedLocalT = rawLocalT * speed;
  let isCurrentlyReversing = false;
  if (isPingPong) {
    const firstHalf = normP <= 0.5;
    let ppP = firstHalf ? (normP * 2.0) : ((1.0 - normP) * 2.0);
    if (isReverse) {
      ppP = 1.0 - ppP;
      isCurrentlyReversing = firstHalf;
    } else {
      isCurrentlyReversing = !firstHalf;
    }
    mappedLocalT = ppP * (evDur * 0.5);
  } else if (isReverse) {
    mappedLocalT = Math.max(0, evDur - (rawLocalT * speed));
    isCurrentlyReversing = true;
  }

  let localT = stepPrint12 ? Math.floor(mappedLocalT * 12) / 12 : mappedLocalT;
  if (isRevStutterActive) {
    const cycleFrame = Math.floor(rawLocalT * 30) % 3;
    localT = Math.max(0, localT - (3 - cycleFrame) * (1.0 / 30.0));
  }

  // Sync 3-Column Fold-In companion streams (Left & Right) or Structural Flicker adjacent clip
  let leftDrawable = null;
  let rightDrawable = null;
  let adjacentDrawable = null;

  const foldCols = Number(ev.fold_in_columns || (Studio.timeline && Studio.timeline.fold_in_columns) || (styleFx === 'burroughs_cutup' ? 3 : 1));
  if (foldCols === 3 && Array.isArray(ev.fold_in_clips) && ev.fold_in_clips.length >= 2) {
    leftDrawable = syncCompanionMedia(ev.fold_in_clips[0], els.vidL, localT, stepPrint12, isRevStutterActive, forceSeek);
    rightDrawable = syncCompanionMedia(ev.fold_in_clips[1], els.vidR, localT, stepPrint12, isRevStutterActive, forceSeek);
  } else if (styleFx === 'structural_flicker' && ev.adjacent_clip_url) {
    adjacentDrawable = syncCompanionMedia(
      {
        clip_url: ev.adjacent_clip_url,
        media_type: ev.adjacent_media_type || 'video',
        in_point: ev.adjacent_in_point || 0,
        clip_duration: 4.0,
      },
      els.vidL,
      localT,
      stepPrint12,
      false,
      forceSeek
    );
  }

  if (ev.media_type === 'image') {
    const resolvedImgUrl = toAssetUrl(ev.clip_url);
    if (!Studio.imageCache[resolvedImgUrl]) {
      const im = new Image();
      im.src = resolvedImgUrl;
      Studio.imageCache[resolvedImgUrl] = im;
    }
    Studio.activeSlotIndex = idx;

    // Pause video decoders while image is active
    try { VideoPool.getActive().pause(); } catch (_) {}
    try { VideoPool.getStandby().pause(); } catch (_) {}

    // Look ahead and preload upcoming video cut on standby player
    const nextCut = findNextVideoCut(events, idx);
    if (nextCut) {
      VideoPool.preloadNextCut(nextCut.event, nextCut.index);
    }

    return {
      ev,
      idx,
      localT,
      rawLocalT,
      normP,
      isImage: true,
      imageEl: Studio.imageCache[resolvedImgUrl],
      leftDrawable,
      rightDrawable,
      adjacentDrawable,
      foldCols,
      stepPrint12,
      isRevStutterActive,
    };
  }

  const cDur = Math.max(0.5, ev.clip_duration || 4.0);
  const targetClipTime = ((ev.in_point || 0) + localT) % cDur;
  const isNewSlot = idx !== Studio.activeSlotIndex;
  const resolvedClipUrl = toAssetUrl(ev.clip_url);

  if (isNewSlot || forceSeek) {
    const standby = VideoPool.getStandby();
    
    // Check if standbyPlayer was pre-buffered and primed for this upcoming cut
    if (isNewSlot && !forceSeek && (VideoPool.preloadedCutIdx === idx || standby.getAttribute('data-clip') === resolvedClipUrl)) {
      // Immediate ping-pong swap: activePlayer becomes standbyPlayer with zero decode hitch
      VideoPool.swap();
      const activeVid = VideoPool.getActive();
      try { activeVid.playbackRate = speed; } catch (_) {}
      
      // If slight drift on start offset, fastSeek
      if (Math.abs(activeVid.currentTime - targetClipTime) > 0.08) {
        fastSeekVideo(activeVid, targetClipTime);
      }

      if (Studio.isPlaying && !stepPrint12 && !isCurrentlyReversing) {
        activeVid.play().catch(() => {});
      } else {
        activeVid.pause();
      }
    } else {
      // Direct activation on current active player (scrubbing or un-buffered start)
      const activeVid = VideoPool.getActive();
      // Avoid re-assigning .src if the same video clip is reused in subsequent slices
      if (activeVid.getAttribute('data-clip') !== resolvedClipUrl) {
        activeVid.setAttribute('data-clip', resolvedClipUrl);
        activeVid.src = resolvedClipUrl;
        activeVid.preload = 'auto';
        try { activeVid.load(); } catch (_) {}
      }
      fastSeekVideo(activeVid, targetClipTime);
      try { activeVid.playbackRate = speed; } catch (_) {}
      if (Studio.isPlaying && !stepPrint12 && !isCurrentlyReversing) {
        activeVid.play().catch(() => {});
      } else {
        activeVid.pause();
      }
    }

    Studio.activeSlotIndex = idx;

    // Immediately instruct standby player to look ahead and preload the NEXT slice
    const nextCut = findNextVideoCut(events, idx);
    if (nextCut) {
      VideoPool.preloadNextCut(nextCut.event, nextCut.index);
    }
  } else {
    // Already in active slot: look ahead as playhead approaches the cut boundary
    const timeRemaining = ev.end - t;
    if (timeRemaining < 1.8) {
      const nextCut = findNextVideoCut(events, idx);
      if (nextCut && VideoPool.preloadedCutIdx !== nextCut.index) {
        VideoPool.preloadNextCut(nextCut.event, nextCut.index);
      }
    }
  }

  const activeVid = VideoPool.getActive();
  if (stepPrint12 || isRevStutterActive || isReverse || isPingPong) {
    if (isCurrentlyReversing && !activeVid.paused) {
      activeVid.pause();
    } else if (Studio.isPlaying && !stepPrint12 && !isCurrentlyReversing && activeVid.paused) {
      activeVid.play().catch(() => {});
    }
    try {
      if (Math.abs(activeVid.currentTime - targetClipTime) > 0.032) {
        fastSeekVideo(activeVid, targetClipTime);
      }
    } catch (_) {}
  } else if (!activeVid.paused && Math.abs(activeVid.currentTime - targetClipTime) > 0.22) {
    // Normal forward playback: only fastSeek if audio/video drift exceeds 220ms
    fastSeekVideo(activeVid, targetClipTime);
  }

  if (Studio.isPlaying && ev.fx && ev.fx.speed_ramp && els.chkLiveFx.checked && !stepPrint12 && !isReverse && !isPingPong) {
    const rate = Math.max(0.45, Math.min(2.0, 1.65 - 1.05 * normP));
    activeVid.playbackRate = rate;
  } else {
    activeVid.playbackRate = speed;
  }

  return {
    ev,
    idx,
    localT,
    rawLocalT,
    normP,
    isImage: false,
    videoEl: activeVid,
    leftDrawable,
    rightDrawable,
    adjacentDrawable,
    foldCols,
    stepPrint12,
    isRevStutterActive,
  };
}

function computeKenBurnsTransform(progress, preset, w, h, reverse = false, pingPong = false) {
  let p = Math.max(0, Math.min(1, progress));
  if (pingPong) {
    p = p <= 0.5 ? p * 2.0 : (1.0 - p) * 2.0;
  }
  if (reverse) {
    p = 1.0 - p;
  }
  const mode = preset || 'zoom_in_pan_right';
  let scale = 1.08, tx = 0, ty = 0;

  if (mode === 'zoom_in_pan_right') {
    scale = 1.04 + 0.14 * p;
    tx = (-0.03 + 0.06 * p) * w;
    ty = (-0.015 + 0.03 * p) * h;
  } else if (mode === 'zoom_out_pan_left') {
    scale = 1.18 - 0.14 * p;
    tx = (0.03 - 0.06 * p) * w;
    ty = (0.015 - 0.03 * p) * h;
  } else if (mode === 'pan_up_zoom_in') {
    scale = 1.06 + 0.12 * p;
    ty = (0.035 - 0.07 * p) * h;
  } else if (mode === 'pan_down_zoom_out') {
    scale = 1.16 - 0.10 * p;
    ty = (-0.035 + 0.07 * p) * h;
  } else if (mode === 'drift_left_to_right') {
    scale = 1.12;
    tx = (-0.045 + 0.09 * p) * w;
  } else {
    scale = 1.02 + 0.16 * p;
  }
  return { scale, tx, ty };
}

function drawIdleCanvas() {
  const w = els.previewCanvas.width;
  const h = els.previewCanvas.height;
  const bgDark = getCssColor('--bg-dark', '#101216');
  const bgDarkest = getCssColor('--bg-darkest', '#090a0c');
  const textPrimary = getCssColor('--text-primary', '#f3f4f6');
  const textMuted = getCssColor('--text-muted', '#64748b');

  const grad = ctxPreview.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, w * 0.6);
  grad.addColorStop(0, bgDark);
  grad.addColorStop(1, bgDarkest);
  ctxPreview.fillStyle = grad;
  ctxPreview.fillRect(0, 0, w, h);

  ctxPreview.fillStyle = textPrimary;
  ctxPreview.font = '600 22px Inter, sans-serif';
  ctxPreview.textAlign = 'center';
  ctxPreview.fillText('Strangelet Splicer — Audio-Reactive Studio', w * 0.5, h * 0.46);
  ctxPreview.font = '15px Inter, sans-serif';
  ctxPreview.fillStyle = textMuted;
  ctxPreview.fillText('Click "⚡ Load Demo Track & Media" or "📂 Import Folder" to splice a music video', w * 0.5, h * 0.53);
}

function drawSourceInColumn(ctx, src, colIdx, colW, h) {
  if (!src) return;
  const sw = src.videoWidth || src.naturalWidth || src.width || 1280;
  const sh = src.videoHeight || src.naturalHeight || src.height || 720;
  const cropW = Math.max(1, Math.floor(sw * 0.42));
  const sx = Math.max(0, Math.floor((sw - cropW) * (0.2 + 0.3 * colIdx)));
  ctx.drawImage(src, sx, 0, cropW, sh, colIdx * colW, 0, colW, h);
}

function drawProceduralChaosSigil(ctx, w, h, seed = 1) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const radius = Math.min(w, h) * 0.30;

  ctx.save();
  ctx.strokeStyle = '#fff8eb';
  ctx.fillStyle = '#f43f5e';
  ctx.lineWidth = 4;

  // Outer containment circle & inner sigil ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  // 8-ray Chaos / IOT star + Austin Osman Spare monogram vectors
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + ((seed % 7) * 0.12);
    const x2 = cx + Math.cos(angle) * radius * 1.14;
    const y2 = cy + Math.sin(angle) * radius * 1.14;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Terminal bar / arrow
    const perp = angle + Math.PI * 0.5;
    const bx = cx + Math.cos(angle) * radius * 0.92;
    const by = cy + Math.sin(angle) * radius * 0.92;
    ctx.beginPath();
    ctx.moveTo(bx - Math.cos(perp) * 14, by - Math.sin(perp) * 14);
    ctx.lineTo(bx + Math.cos(perp) * 14, by + Math.sin(perp) * 14);
    ctx.stroke();
  }

  // Asymmetric Spare desire-monogrambind
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a1 = ((k * 137 + seed * 29) % 360) * (Math.PI / 180);
    const r1 = radius * (0.35 + ((k * 43 + seed) % 45) / 100.0);
    const px = cx + Math.cos(a1) * r1;
    const py = cy + Math.sin(a1) * r1;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Central all-seeing anchor eye
  ctx.fillStyle = '#09090d';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}

function renderLoop() {
  const t = els.mainAudio.currentTime || 0;
  const dur = (Studio.audio && Studio.audio.duration) || 0;
  els.timecodeDisplay.textContent = `${formatTime(t)} / ${formatTime(dur)}`;
  els.playheadLine.style.left = `${t * Studio.pxPerSec}px`;

  if (Studio.isPlaying) {
    if (Studio.isLooping && dur > 0 && t >= dur - 0.05) {
      gotoStart();
      requestAnimationFrame(renderLoop);
      return;
    }
    const playX = t * Studio.pxPerSec;
    const sc = els.timelineScroll;
    if (playX > sc.scrollLeft + sc.clientWidth * 0.85 || playX < sc.scrollLeft) {
      sc.scrollLeft = Math.max(0, playX - sc.clientWidth * 0.25);
    }
  }

  let bassVal = 0, snareVal = 0, highVal = 0, rmsVal = 0.5;
  if (Studio.audio && Studio.audio.envelopes_60hz) {
    const env = Studio.audio.envelopes_60hz;
    const ei = Math.min((env.bass || []).length - 1, Math.max(0, Math.floor(t * (env.fps || 60))));
    bassVal = (env.bass && env.bass[ei]) || 0;
    snareVal = (env.snare && env.snare[ei]) || 0;
    highVal = (env.high && env.high[ei]) || 0;
    rmsVal = (env.rms && env.rms[ei]) !== undefined ? env.rms[ei] : 0.5;
  }

  els.meterBass.style.width = `${Math.round(bassVal * 100)}%`;
  els.meterSnare.style.width = `${Math.round(snareVal * 100)}%`;
  els.meterHigh.style.width = `${Math.round(highVal * 100)}%`;
  els.valBass.textContent = `${Math.round(bassVal * 100)}%`;
  els.valSnare.textContent = `${Math.round(snareVal * 100)}%`;
  els.valHigh.textContent = `${Math.round(highVal * 100)}%`;

  const syncState = syncVideoDecodersToTime(t, false, bassVal);
  let isFrameDropFallback = false;
  let drawableSource = null;

  if (syncState) {
    if (syncState.isImage) {
      drawableSource = (syncState.imageEl && syncState.imageEl.complete) ? syncState.imageEl : null;
    } else {
      const vid = syncState.videoEl;
      if (vid && vid.readyState >= 2 && !vid.seeking) {
        drawableSource = vid;
      } else if (VideoPool.hasCachedFrame) {
        // FRAME-DROP FAILSAFE: Video frame not decoded in time for a 1-frame or 2-frame cut;
        // draw the last cached canvas frame rather than stalling playback or freezing audio.
        drawableSource = VideoPool.lastRenderedCanvas;
        isFrameDropFallback = true;
      }
    }
  }

  if (syncState && drawableSource) {
    const {
      ev,
      localT,
      rawLocalT,
      isImage,
      leftDrawable,
      rightDrawable,
      adjacentDrawable,
      foldCols,
      stepPrint12,
      isRevStutterActive,
    } = syncState;
    const w = els.previewCanvas.width;
    const h = els.previewCanvas.height;
    const activeAutoShader = (Studio.autoVary && Studio.autoVary.enabled) ? Studio.autoVary.activeAutoFx : null;
    const styleFx = activeAutoShader || ev.style_fx || (Studio.timeline && Studio.timeline.style_fx) || 'clean';
    const liveFxOn = els.chkLiveFx.checked;

    if (els.previewCanvas) {
      els.previewCanvas.classList.toggle('fx-crt-phosphor', styleFx === 'fx-crt-phosphor' || styleFx === 'crt_phosphor');
      els.previewCanvas.classList.toggle('fx-bleach-bypass', styleFx === 'fx-bleach-bypass' || styleFx === 'bleach_bypass');
      els.previewCanvas.classList.toggle('fx-thermal-solar', styleFx === 'fx-thermal-solar' || styleFx === 'thermal_solar');
      els.previewCanvas.classList.toggle('fx-tape-degrade', styleFx === 'fx-tape-degrade' || styleFx === 'tape_degrade');
      els.previewCanvas.classList.toggle('fx-sepia-rotogravure', styleFx === 'fx-sepia-rotogravure' || styleFx === 'sepia_rotogravure');
      els.previewCanvas.classList.toggle('fx-rgb-split-strobe', styleFx === 'fx-rgb-split-strobe' || styleFx === 'rgb_split_strobe');
    }

    const sprocketSlipOn = liveFxOn && Boolean(
      (els.chkSprocketSlip && els.chkSprocketSlip.checked) ||
      ev.sprocket_slip ||
      styleFx === 'brakhage_emulsion'
    );
    const typoFlashesOn = liveFxOn && Boolean(
      (els.chkTypoFlashes && els.chkTypoFlashes.checked) ||
      ev.typographic_flashes ||
      styleFx === 'burroughs_cutup'
    );
    const subliminalSigilOn = liveFxOn && Boolean(
      (els.chkSubliminalSigil && els.chkSubliminalSigil.checked) ||
      ev.subliminal_sigil_flash ||
      styleFx === 'chaos_sigil' ||
      styleFx === 'typhonian_transmission'
    );
    const obsidianScryingOn = liveFxOn && Boolean(
      (els.chkObsidianScrying && els.chkObsidianScrying.checked) ||
      ev.obsidian_scrying_vignette ||
      styleFx === 'enochian_scrying' ||
      styleFx === 'dim_carcosa'
    );
    const thelemicBloomOn = liveFxOn && Boolean(
      (els.chkThelemicBloom && els.chkThelemicBloom.checked) ||
      ev.thelemic_dye_bloom ||
      styleFx === 'babalon_working'
    );
    const cosmicStaticOn = liveFxOn && Boolean(
      (els.chkCosmicStatic && els.chkCosmicStatic.checked) ||
      ev.cosmic_static_glitch ||
      styleFx === 'typhonian_transmission'
    );

    const echoTunnelOn = liveFxOn && Boolean(
      (els.chkEchoTunnel && els.chkEchoTunnel.checked) ||
      ev.geometric_echo_tunnel ||
      (Studio.timeline && Studio.timeline.geometric_echo_tunnel)
    );
    const opticalMode = String(ev.optical_treatment || 'none');
    const prismMirrorOn = Boolean(ev.prism_mirror || opticalMode === 'prism_horizontal_mirror');

    const transLabel =
      ev.transition === 'flash_white'
        ? ' • 💥2F-FLASH'
        : ev.transition === 'quick_glitch'
          ? ' • ⚡GLITCH'
          : ev.transition === 'soft_dissolve'
            ? ' • 🌫DISSOLVE'
            : '';
    const kbHud = isImage ? ` • KEN BURNS (${ev.ken_burns || 'pan/zoom'})` : '';
    const roleHud = ev.role === 'cutaway_stab' ? ' • ⚡STAB' : ev.role === 'sigil_flash' ? ' • 🜏1F-SIGIL' : '';
    const pinHud = ev.pinned ? ' • 📌PINNED' : '';
    const revModeHud = ev.ping_pong ? ' • 🔁PING-PONG' : (ev.reverse ? ' • ⏪REVERSE' : '');
    const optHud = opticalMode !== 'none' ? ` • 🎨${opticalMode.toUpperCase()}` : (prismMirrorOn ? ' • 🪞MIRROR' : '');
    const echoHud = echoTunnelOn ? ' • 🌀ECHO-TUNNEL' : '';
    const foldHud = foldCols === 3 ? ' • 3-COL FOLD-IN' : '';
    const stepHud = stepPrint12 ? ' • 12FPS' : '';
    const revHud = isRevStutterActive ? ' • ⏪3F-REV' : '';
    const styleHud = styleFx !== 'clean' ? ` • [${styleFx.toUpperCase()}]` : '';
    els.hudSection.textContent = `${ev.section_label} • CUT #${ev.index + 1}${pinHud}${revModeHud}${optHud}${echoHud}${roleHud}${foldHud}${stepHud}${revHud}${transLabel}${kbHud}${styleHud}`;
    els.hudClipName.textContent = `${ev.clip_filename} (Energy ${Math.round((ev.clip_energy || 0.5) * 100)}%)`;
    els.hudMatchReason.textContent = ev.match_reason || '';

    ctxPreview.save();
    ctxPreview.fillStyle = '#000';
    ctxPreview.fillRect(0, 0, w, h);

    const fx = ev.fx || {};
    const frame30 = Math.floor(t * 30);
    const frame60 = Math.floor(t * 60);

    // 1. Dark Minimalist: Black-frame dropouts on quiet passages
    if (liveFxOn && styleFx === 'dark_minimalist' && rmsVal < 0.18 && bassVal < 0.25) {
      if (rmsVal < 0.12 || Math.floor(localT * 12) % 3 === 0) {
        ctxPreview.restore();
        requestAnimationFrame(renderLoop);
        return;
      }
    }

    // 2. Structural Flicker (Sharits / Conrad): 1-to-2 frame pure black/white strobes on cymbal/hi-hat transients
    if (liveFxOn && styleFx === 'structural_flicker' && (highVal > 0.36 || snareVal > 0.45)) {
      const m4 = frame30 % 4;
      if (m4 === 1) {
        ctxPreview.fillStyle = '#ffffff';
        ctxPreview.fillRect(0, 0, w, h);
        ctxPreview.restore();
        requestAnimationFrame(renderLoop);
        return;
      } else if (m4 === 3 && highVal > 0.48) {
        ctxPreview.fillStyle = '#000000';
        ctxPreview.fillRect(0, 0, w, h);
        ctxPreview.restore();
        requestAnimationFrame(renderLoop);
        return;
      }
    }

    // 2b. Chaos Sigil Flash (Austin Osman Spare / IOT) & 1-Frame Subliminal Sigil Toggle:
    // Slices graphic glyphs/stills as 1-frame (16ms) negative/inverted flashes on kick/sub-bass impacts
    const isOneFrameSigilTrigger =
      subliminalSigilOn &&
      ((ev.role === 'sigil_flash' && rawLocalT < 0.025) ||
        (bassVal > 0.54 && frame60 % 6 === 0));

    if (isOneFrameSigilTrigger) {
      let sigilImg = null;
      if (ev.sigil_clip_url) {
        if (!Studio.imageCache[ev.sigil_clip_url]) {
          const im = new Image();
          im.src = ev.sigil_clip_url;
          Studio.imageCache[ev.sigil_clip_url] = im;
        }
        const cached = Studio.imageCache[ev.sigil_clip_url];
        if (cached && cached.complete) sigilImg = cached;
      }
      ctxPreview.save();
      ctxPreview.filter = 'invert(1.0) contrast(2.35) saturate(1.8)';
      ctxPreview.drawImage(sigilImg || drawableSource, 0, 0, w, h);
      ctxPreview.filter = 'none';
      drawProceduralChaosSigil(ctxPreview, w, h, ev.index + frame60);
      ctxPreview.restore();
      ctxPreview.restore();
      requestAnimationFrame(renderLoop);
      return;
    }

    let kbScale = 1.0, kbTx = 0, kbTy = 0;
    if (isImage) {
      const cutProg = rawLocalT / Math.max(0.08, ev.duration || 2.0);
      const kb = computeKenBurnsTransform(
        cutProg,
        ev.ken_burns,
        w,
        h,
        Boolean(ev.reverse),
        Boolean(ev.ping_pong)
      );
      kbScale = kb.scale;
      kbTx = kb.tx;
      kbTy = kb.ty;
    }

    let zoom = kbScale;
    let dx = kbTx, dy = kbTy;
    let flashAlpha = 0;
    let rgbShift = 0;
    let isGlitchCutWindow = false;
    let carcosaMirrorFlip = false;

    const filterParts = [];

    if (liveFxOn) {
      let bassZoomAmt = (fx.bass_zoom || 0.5) * bassVal;

      // Social Short / Reel Frenzy: Downbeat zoom-punch
      if (styleFx === 'reel_frenzy' && (ev.downbeat_punch || rawLocalT < 0.18)) {
        const punchEnv = Math.max(0, 1.0 - (rawLocalT / 0.18));
        bassZoomAmt += 0.95 * punchEnv;
        rgbShift = Math.max(rgbShift, 9.0 * punchEnv);
      }

      // Dim Carcosa / Aldebaran Gold: Sudden jarring geometric match-cut on downbeats
      if (styleFx === 'dim_carcosa' && ((ev.downbeat_punch && rawLocalT < 0.16) || ev.duration <= 0.42)) {
        carcosaMirrorFlip = true;
        bassZoomAmt += 0.65;
      }

      // Cyber Glitch / Hyper-Chop extra tear & strobe
      if (styleFx === 'cyber_glitch') {
        rgbShift = Math.max(rgbShift, snareVal > 0.4 ? 14.0 : 6.0);
        if (snareVal > 0.52 || highVal > 0.60) {
          flashAlpha = Math.max(flashAlpha, 0.45 * Math.max(snareVal, highVal));
        }
      }

      // Lynchian Industrial Monochrome (Eraserhead): Sub-bass canvas tremors (20-60Hz)
      if (styleFx === 'lynch_monochrome') {
        if (bassVal > 0.30) {
          const tre = bassVal * 15.0;
          dx += Math.sin(t * 175.0) * tre;
          dy += Math.cos(t * 230.0) * tre * 0.85;
        }
      }

      // Tape Degrade: Slight vertical tape flutter jitter
      if (styleFx === 'fx-tape-degrade' || styleFx === 'tape_degrade') {
        dy += Math.sin(t * 85.0) * (2.2 + bassVal * 4.0);
        rgbShift = Math.max(rgbShift, 6.0 + (snareVal > 0.4 ? snareVal * 12.0 : 0));
      }

      // RGB Split Strobe Transient: Heavy chromatic aberration splitting on snare/hi-hat hits
      if (styleFx === 'fx-rgb-split-strobe' || styleFx === 'rgb_split_strobe') {
        const splitAmt = 8.0 + (snareVal > 0.3 ? snareVal * 32.0 : (highVal > 0.3 ? highVal * 20.0 : 0));
        rgbShift = Math.max(rgbShift, splitAmt);
      }

      if ((ev.transition === 'flash_white' || ev.transition === 'flash') && rawLocalT < 0.068) {
        const punch = (0.068 - rawLocalT) / 0.068;
        flashAlpha = Math.max(flashAlpha, rawLocalT < 0.034 ? 0.92 : 0.60 * punch);
        bassZoomAmt += 0.08 * punch;
      }

      if ((ev.transition === 'quick_glitch' || ev.transition === 'impact') && rawLocalT < 0.095) {
        const punch = (0.095 - rawLocalT) / 0.095;
        rgbShift = Math.max(rgbShift, 22.0 * punch);
        bassZoomAmt += 0.12 * punch;
        isGlitchCutWindow = true;
      }

      zoom = kbScale * (1.0 + Math.min(0.28, bassZoomAmt * 0.16));

      const shakeAmt = (fx.shake || 0.3) * (bassVal > 0.55 ? bassVal : 0);
      if (shakeAmt > 0.08) {
        dx += Math.sin(t * 95.0) * shakeAmt * 22.0;
        dy += Math.cos(t * 115.0) * shakeAmt * 18.0;
      }

      if (snareVal > 0.62) {
        flashAlpha = Math.max(flashAlpha, Math.min(0.65, (fx.snare_flash || 0.3) * snareVal * 0.55));
      }

      const rgbAmt = (fx.rgb_split || 0.3) * Math.max(snareVal, highVal * 0.7);
      if (rgbAmt > 0.18) {
        rgbShift = Math.max(rgbShift, rgbAmt * 14.0);
      }

      // Style-specific CSS canvas filters (Core, Avant-Garde & Esoteric)
      if (styleFx === 'dark_minimalist') {
        filterParts.push('contrast(1.45) saturate(0.45) brightness(0.92)');
      } else if (styleFx === 'lynch_monochrome') {
        filterParts.push('grayscale(1.0) contrast(1.88) brightness(0.94)');
      } else if (styleFx === 'marker_jetee' || styleFx === 'la_jetee_photomontage') {
        filterParts.push(
          isImage
            ? 'grayscale(0.92) sepia(0.14) contrast(1.32)'
            : 'grayscale(0.35) contrast(1.12) brightness(1.05)'
        );
      } else if (styleFx === 'film_16mm' || styleFx === 'mekas_bolex' || styleFx === 'mekas_diary') {
        filterParts.push('sepia(0.18) contrast(1.14) brightness(1.04)');
      } else if (styleFx === 'vhs_tape') {
        filterParts.push('saturate(1.22) contrast(1.06)');
      } else if (styleFx === 'brakhage_emulsion') {
        filterParts.push('saturate(1.38) contrast(1.22)');
      } else if (styleFx === 'babalon_working') {
        filterParts.push('sepia(0.55) saturate(2.15) contrast(1.28) hue-rotate(-14deg)');
      } else if (styleFx === 'enochian_scrying') {
        filterParts.push('contrast(1.24) saturate(0.78) brightness(0.92)');
      } else if (styleFx === 'typhonian_transmission') {
        const isNegStrobe = (snareVal > 0.48 || highVal > 0.46) && (frame30 % 2 === 0);
        filterParts.push(
          isNegStrobe
            ? 'invert(1.0) contrast(1.45) hue-rotate(175deg)'
            : 'contrast(1.36) saturate(1.35) hue-rotate(245deg) brightness(0.88)'
        );
      } else if (styleFx === 'dim_carcosa') {
        filterParts.push('sepia(0.72) saturate(1.48) contrast(1.22) brightness(0.95)');
      } else if (styleFx === 'chaos_sigil') {
        filterParts.push('contrast(1.28) saturate(1.15)');
      } else if (styleFx === 'fx-crt-phosphor' || styleFx === 'crt_phosphor') {
        filterParts.push('sepia(0.85) hue-rotate(85deg) saturate(3.2) contrast(1.35) brightness(1.15)');
      } else if (styleFx === 'fx-bleach-bypass' || styleFx === 'bleach_bypass') {
        filterParts.push('contrast(1.70) saturate(0.35) brightness(0.90)');
      } else if (styleFx === 'fx-thermal-solar' || styleFx === 'thermal_solar') {
        filterParts.push('invert(0.85) hue-rotate(180deg) saturate(2.8) contrast(1.5)');
      } else if (styleFx === 'fx-tape-degrade' || styleFx === 'tape_degrade') {
        filterParts.push('contrast(1.15) saturate(1.30)');
      } else if (styleFx === 'fx-sepia-rotogravure' || styleFx === 'sepia_rotogravure') {
        filterParts.push('sepia(0.85) contrast(1.30) brightness(0.95)');
      } else if (styleFx === 'fx-rgb-split-strobe' || styleFx === 'rgb_split_strobe') {
        filterParts.push('contrast(1.25) saturate(1.40)');
      }
    }

    // Per-Block One-Click CSS Optical Treatments
    if (opticalMode === 'solarized_sabattier') {
      filterParts.push('contrast(1.85) invert(0.42) saturate(1.75) brightness(1.08)');
    } else if (opticalMode === 'two_color_crimson_charcoal' || opticalMode === 'two_color_cyan_amber') {
      filterParts.push('grayscale(1.0) contrast(1.42) brightness(1.02)');
    } else if (opticalMode === 'infrared_thermal') {
      filterParts.push('invert(0.85) hue-rotate(165deg) saturate(2.65) contrast(1.48)');
    }

    if (filterParts.length) {
      ctxPreview.filter = filterParts.join(' ');
    }

    // Structural Flicker (Sharits / Conrad): 1-to-2 frame alternating strobe with adjacent clip
    let primaryDrawable = drawableSource;
    if (liveFxOn && styleFx === 'structural_flicker' && adjacentDrawable && (frame30 % 3 === 1)) {
      primaryDrawable = adjacentDrawable;
    }

    // Soft Dissolve fade-in support (Enochian Scrying Glass & soft_dissolve transition mode)
    if (liveFxOn && ev.transition === 'soft_dissolve' && rawLocalT < 0.42) {
      ctxPreview.globalAlpha = Math.max(0.18, Math.min(1.0, rawLocalT / 0.42));
    }

    const flipHoriz = Boolean(carcosaMirrorFlip !== prismMirrorOn);

    // Draw either 3-Column Fold-In Split Canvas (Burroughs) or full-frame canvas
    if (foldCols === 3) {
      const colW = Math.floor(w / 3);
      ctxPreview.save();
      ctxPreview.translate(w * 0.5 + dx * 0.4, h * 0.5 + dy * 0.4);
      ctxPreview.scale(flipHoriz ? -zoom : zoom, zoom);
      ctxPreview.translate(-w * 0.5, -h * 0.5);

      drawSourceInColumn(ctxPreview, leftDrawable || primaryDrawable, 0, colW, h);
      drawSourceInColumn(ctxPreview, primaryDrawable, 1, colW, h);
      drawSourceInColumn(ctxPreview, rightDrawable || leftDrawable || primaryDrawable, 2, w - colW * 2, h);

      // Vertical Fold-In splice seams
      ctxPreview.fillStyle = 'rgba(15, 18, 25, 0.92)';
      ctxPreview.fillRect(colW - 2, 0, 4, h);
      ctxPreview.fillRect(colW * 2 - 2, 0, 4, h);
      if (snareVal > 0.45) {
        ctxPreview.fillStyle = 'rgba(244, 63, 94, 0.75)';
        ctxPreview.fillRect(colW - 1, 0, 2, h);
        ctxPreview.fillRect(colW * 2 - 1, 0, 2, h);
      }
      ctxPreview.restore();
    } else {
      ctxPreview.translate(w * 0.5 + dx, h * 0.5 + dy);
      ctxPreview.scale(flipHoriz ? -zoom : zoom, zoom);
      ctxPreview.drawImage(primaryDrawable, -w * 0.5, -h * 0.5, w, h);

      // Solarized Sabattier glowing edge pass
      if (opticalMode === 'solarized_sabattier') {
        ctxPreview.save();
        ctxPreview.filter = 'invert(1.0) contrast(2.35) saturate(1.9)';
        ctxPreview.globalCompositeOperation = 'difference';
        ctxPreview.globalAlpha = 0.55;
        ctxPreview.drawImage(primaryDrawable, -w * 0.5 + 2, -h * 0.5 + 1, w, h);
        ctxPreview.restore();
      }

      if (rgbShift > 1.5 && styleFx !== 'lynch_monochrome') {
        ctxPreview.globalCompositeOperation = 'screen';
        ctxPreview.globalAlpha = 0.38;
        ctxPreview.drawImage(primaryDrawable, -w * 0.5 + rgbShift, -h * 0.5, w, h);
        ctxPreview.drawImage(primaryDrawable, -w * 0.5 - rgbShift, -h * 0.5, w, h);
        ctxPreview.globalAlpha = 1.0;
        ctxPreview.globalCompositeOperation = 'source-over';
      }
    }
    ctxPreview.restore();

    // Post-Pass for One-Click CSS Optical Treatments (Duotone Dye Washes & Infrared Thermal Map)
    if (opticalMode === 'two_color_crimson_charcoal') {
      ctxPreview.save();
      const duoGrad = ctxPreview.createLinearGradient(0, 0, w, h);
      duoGrad.addColorStop(0, 'rgba(220, 30, 40, 0.52)');
      duoGrad.addColorStop(0.55, 'rgba(155, 22, 32, 0.42)');
      duoGrad.addColorStop(1, 'rgba(20, 18, 24, 0.68)');
      ctxPreview.globalCompositeOperation = 'overlay';
      ctxPreview.fillStyle = duoGrad;
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.globalCompositeOperation = 'color';
      ctxPreview.fillStyle = 'rgba(210, 28, 38, 0.58)';
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.restore();
    } else if (opticalMode === 'two_color_cyan_amber') {
      ctxPreview.save();
      const caGrad = ctxPreview.createLinearGradient(0, 0, w, h);
      caGrad.addColorStop(0, 'rgba(8, 145, 178, 0.58)');
      caGrad.addColorStop(0.5, 'rgba(14, 116, 144, 0.36)');
      caGrad.addColorStop(1, 'rgba(245, 158, 11, 0.62)');
      ctxPreview.globalCompositeOperation = 'overlay';
      ctxPreview.fillStyle = caGrad;
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.restore();
    } else if (opticalMode === 'infrared_thermal') {
      ctxPreview.save();
      const thermGrad = ctxPreview.createRadialGradient(w * 0.5, h * 0.5, w * 0.1, w * 0.5, h * 0.5, w * 0.65);
      thermGrad.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
      thermGrad.addColorStop(0.45, 'rgba(244, 63, 94, 0.32)');
      thermGrad.addColorStop(0.8, 'rgba(124, 58, 237, 0.35)');
      thermGrad.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
      ctxPreview.globalCompositeOperation = 'color-dodge';
      ctxPreview.fillStyle = thermGrad;
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.restore();
    }

    // 3. Vertical Sprocket Slip (Brakhage Emulsion Decay or Sprocket Slip Toggle)
    if (sprocketSlipOn && (bassVal > 0.46 || snareVal > 0.54)) {
      const shiftY = Math.floor(((Math.sin(t * 43.0) * 0.5 + 0.5) * 0.36 + 0.14) * h);
      if (shiftY > 12 && shiftY < h - 12) {
        const tempY = shiftY;
        ctxPreview.drawImage(els.previewCanvas, 0, 0, w, h - tempY, 0, tempY, w, h - tempY);
        ctxPreview.fillStyle = '#060504';
        ctxPreview.fillRect(0, tempY - 6, w, 12);
        ctxPreview.fillStyle = 'rgba(255, 225, 180, 0.55)';
        ctxPreview.fillRect(0, tempY - 1, w, 2);
        ctxPreview.fillStyle = 'rgba(255, 248, 230, 0.82)';
        for (let py = 24; py < h; py += 76) {
          ctxPreview.fillRect(14, (py + tempY) % h, 18, 12);
        }
      }
    }

    // 4. Brakhage Emulsion Decay: Procedural hand-etched film scratches + Heat Burns on bass drops
    if (liveFxOn && styleFx === 'brakhage_emulsion') {
      ctxPreview.save();
      const numScratches = 2 + (bassVal > 0.5 ? 3 : 0);
      for (let s = 0; s < numScratches; s++) {
        const sx = ((frame30 * 131 + s * 397) % (w - 40)) + 20;
        ctxPreview.strokeStyle = s % 2 === 0 ? 'rgba(255, 248, 225, 0.72)' : 'rgba(245, 158, 11, 0.65)';
        ctxPreview.lineWidth = s === 0 ? 2.2 : 1.3;
        ctxPreview.beginPath();
        ctxPreview.moveTo(sx, 0);
        ctxPreview.lineTo(sx + Math.sin(t * 25 + s) * 14, h);
        ctxPreview.stroke();
      }
      if (bassVal > 0.44) {
        const burnAlpha = Math.min(0.78, (bassVal - 0.35) * 1.15);
        const bx = w * (0.28 + 0.44 * ((frame30 * 19) % 7) / 7.0);
        const by = h * (0.25 + 0.50 * ((frame30 * 31) % 5) / 5.0);
        const burnGrad = ctxPreview.createRadialGradient(bx, by, 15, bx, by, w * 0.42);
        burnGrad.addColorStop(0, `rgba(255, 245, 200, ${(burnAlpha * 0.9).toFixed(2)})`);
        burnGrad.addColorStop(0.35, `rgba(234, 88, 12, ${(burnAlpha * 0.75).toFixed(2)})`);
        burnGrad.addColorStop(0.7, `rgba(124, 45, 18, ${(burnAlpha * 0.45).toFixed(2)})`);
        burnGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctxPreview.globalCompositeOperation = 'screen';
        ctxPreview.fillStyle = burnGrad;
        ctxPreview.fillRect(0, 0, w, h);
      }
      ctxPreview.restore();
    }

    // 5. Post-Overlay Style FX (VHS / 16mm / Mekas Bolex / Lynchian Industrial Monochrome)
    if (liveFxOn && styleFx === 'vhs_tape') {
      ctxPreview.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let sy = 0; sy < h; sy += 4) {
        ctxPreview.fillRect(0, sy, w, 1.5);
      }
      if (snareVal > 0.42) {
        const barY = Math.floor(((t * 260) % 1.0) * (h - 28));
        ctxPreview.drawImage(els.previewCanvas, 0, barY, w, 18, snareVal * 22, barY, w, 18);
        ctxPreview.fillStyle = `rgba(255, 250, 235, ${(snareVal * 0.35).toFixed(2)})`;
        ctxPreview.fillRect(0, barY, w, 5);
      }
    } else if (liveFxOn && (styleFx === 'film_16mm' || styleFx === 'mekas_bolex' || styleFx === 'mekas_diary')) {
      const halGrad = ctxPreview.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.65);
      halGrad.addColorStop(0, 'rgba(255, 190, 110, 0.05)');
      halGrad.addColorStop(1, 'rgba(15, 8, 4, 0.35)');
      ctxPreview.fillStyle = halGrad;
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.fillStyle = 'rgba(255, 245, 220, 0.14)';
      for (let g = 0; g < 45; g++) {
        const gx = ((g * 997 + Math.floor(t * 950)) % w);
        const gy = ((g * 613 + Math.floor(t * 1370)) % h);
        ctxPreview.fillRect(gx, gy, 2, 2);
      }
      if ((styleFx === 'mekas_bolex' || styleFx === 'mekas_diary') && ev.duration <= 0.20 && (frame30 % 3 === 0)) {
        ctxPreview.fillStyle = 'rgba(255, 180, 90, 0.24)';
        ctxPreview.fillRect(0, 0, w * 0.22, h);
      }
    } else if (liveFxOn && styleFx === 'lynch_monochrome') {
      const sootGrad = ctxPreview.createRadialGradient(w * 0.5, h * 0.5, w * 0.2, w * 0.5, h * 0.5, w * 0.68);
      sootGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      sootGrad.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
      ctxPreview.fillStyle = sootGrad;
      ctxPreview.fillRect(0, 0, w, h);

      if (snareVal > 0.52) {
        ctxPreview.fillStyle = 'rgba(255, 252, 242, 0.88)';
        ctxPreview.fillRect(0, 0, w, h);
      }
    }

    // 5b. Esoteric Tradition 1: Babalon Working (1946 Mojave) & Thelemic Crimson/Gold Dye Bloom
    if (liveFxOn && styleFx === 'babalon_working') {
      const shimmerBands = 5;
      for (let sb = 0; sb < shimmerBands; sb++) {
        const bandY = Math.floor(((sb * 0.19 + (t * 0.35) % 1.0) % 1.0) * (h - 24));
        const shiftX = Math.sin(t * 18.0 + sb * 2.1) * (4.5 + bassVal * 8.0);
        ctxPreview.drawImage(els.previewCanvas, 0, bandY, w, 16, shiftX, bandY, w, 16);
      }
      const mojaveGrad = ctxPreview.createLinearGradient(0, 0, w, h);
      mojaveGrad.addColorStop(0, 'rgba(185, 28, 28, 0.22)');
      mojaveGrad.addColorStop(0.55, 'rgba(217, 119, 6, 0.16)');
      mojaveGrad.addColorStop(1, 'rgba(127, 29, 29, 0.28)');
      ctxPreview.fillStyle = mojaveGrad;
      ctxPreview.fillRect(0, 0, w, h);
    }

    if (thelemicBloomOn && snareVal > 0.42) {
      ctxPreview.save();
      const bloomStrength = Math.min(0.92, (snareVal - 0.32) * 1.35);
      const solarGrad = ctxPreview.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.45, w * 0.65);
      solarGrad.addColorStop(0, `rgba(255, 250, 215, ${(bloomStrength * 0.92).toFixed(2)})`);
      solarGrad.addColorStop(0.45, `rgba(245, 158, 11, ${(bloomStrength * 0.72).toFixed(2)})`);
      solarGrad.addColorStop(0.85, `rgba(185, 28, 28, ${(bloomStrength * 0.58).toFixed(2)})`);
      solarGrad.addColorStop(1, 'rgba(127, 29, 29, 0.18)');
      ctxPreview.globalCompositeOperation = 'screen';
      ctxPreview.fillStyle = solarGrad;
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.restore();
    }

    // 5c. Esoteric Tradition 2: Dim Carcosa / Aldebaran Gold dust haze & Twin Suns geometry
    if (liveFxOn && styleFx === 'dim_carcosa') {
      ctxPreview.save();
      const hazeGrad = ctxPreview.createRadialGradient(w * 0.5, h * 0.38, 30, w * 0.5, h * 0.5, w * 0.68);
      hazeGrad.addColorStop(0, 'rgba(251, 191, 36, 0.16)');
      hazeGrad.addColorStop(0.6, 'rgba(180, 83, 9, 0.18)');
      hazeGrad.addColorStop(1, 'rgba(24, 16, 6, 0.52)');
      ctxPreview.fillStyle = hazeGrad;
      ctxPreview.fillRect(0, 0, w, h);

      ctxPreview.fillStyle = 'rgba(253, 224, 71, 0.32)';
      for (let m = 0; m < 36; m++) {
        const mx = (m * 317 + Math.floor(t * (28 + (m % 7) * 5))) % w;
        const my = (m * 193 + Math.floor(t * (16 + (m % 5) * 4))) % h;
        const r = 1 + (m % 3);
        ctxPreview.fillRect(mx, my, r, r);
      }

      if (carcosaMirrorFlip) {
        ctxPreview.strokeStyle = 'rgba(251, 191, 36, 0.65)';
        ctxPreview.lineWidth = 2.2;
        const rad = Math.min(w, h) * 0.24;
        ctxPreview.beginPath();
        ctxPreview.arc(w * 0.46, h * 0.5, rad, 0, Math.PI * 2);
        ctxPreview.stroke();
        ctxPreview.beginPath();
        ctxPreview.arc(w * 0.54, h * 0.5, rad, 0, Math.PI * 2);
        ctxPreview.stroke();
      }
      ctxPreview.restore();
    }

    // 5d. Esoteric Tradition 3: Enochian Scrying Glass & Obsidian Scrying Vignette Toggle
    if (obsidianScryingOn) {
      ctxPreview.save();
      const cx = w * 0.5;
      const cy = h * 0.5;
      const scryRadius = Math.min(w, h) * 0.44;

      const obsGrad = ctxPreview.createRadialGradient(cx, cy, scryRadius * 0.58, cx, cy, w * 0.58);
      obsGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      obsGrad.addColorStop(0.65, 'rgba(4, 6, 12, 0.58)');
      obsGrad.addColorStop(0.88, 'rgba(2, 3, 7, 0.92)');
      obsGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
      ctxPreview.fillStyle = obsGrad;
      ctxPreview.fillRect(0, 0, w, h);

      ctxPreview.strokeStyle = 'rgba(148, 163, 184, 0.26)';
      ctxPreview.lineWidth = 1.8;
      ctxPreview.beginPath();
      ctxPreview.arc(cx, cy, scryRadius, 0, Math.PI * 2);
      ctxPreview.stroke();

      ctxPreview.strokeStyle = 'rgba(217, 119, 6, 0.22)';
      ctxPreview.lineWidth = 1.2;
      ctxPreview.beginPath();
      ctxPreview.arc(cx, cy, scryRadius * 0.93, 0, Math.PI * 2);
      ctxPreview.stroke();
      ctxPreview.restore();
    }

    if (liveFxOn && styleFx === 'enochian_scrying' && highVal > 0.28) {
      ctxPreview.save();
      const glyphAlpha = Math.min(0.62, (highVal - 0.20) * 1.1);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const rHep = Math.min(w, h) * 0.34;

      ctxPreview.strokeStyle = `rgba(251, 191, 36, ${(glyphAlpha * 0.55).toFixed(2)})`;
      ctxPreview.lineWidth = 1.5;
      ctxPreview.beginPath();
      for (let i = 0; i <= 7; i++) {
        const a = ((i * 2) % 7) * ((Math.PI * 2) / 7) - Math.PI * 0.5 + t * 0.15;
        const px = cx + Math.cos(a) * rHep;
        const py = cy + Math.sin(a) * rHep;
        if (i === 0) ctxPreview.moveTo(px, py);
        else ctxPreview.lineTo(px, py);
      }
      ctxPreview.stroke();

      const enochianLine = ENOCHIAN_GLYPHS[(ev.index + Math.floor(t * 2)) % ENOCHIAN_GLYPHS.length];
      ctxPreview.fillStyle = `rgba(253, 224, 71, ${glyphAlpha.toFixed(2)})`;
      ctxPreview.font = '600 22px "Georgia", serif';
      ctxPreview.textAlign = 'center';
      ctxPreview.fillText(`✧ ${enochianLine} ✧`, cx, h * 0.84);
      ctxPreview.restore();
    }

    // 5e. Esoteric Tradition 4: Typhonian Transmissions & Cosmic Static Glitch Toggle
    if (cosmicStaticOn && (snareVal > 0.42 || highVal > 0.38 || bassVal > 0.56)) {
      ctxPreview.save();
      const numStaticBars = 5 + Math.floor(Math.max(snareVal, highVal) * 8);
      for (let b = 0; b < numStaticBars; b++) {
        const by = ((frame60 * 89 + b * 173) % (h - 14));
        const bh = 3 + (b % 4) * 3;
        const shift = ((b % 2 === 0 ? 1 : -1) * (12 + Math.floor(snareVal * 32)));
        ctxPreview.drawImage(els.previewCanvas, 0, by, w, bh, shift, by, w, bh);
        ctxPreview.fillStyle = b % 2 === 0 ? 'rgba(168, 85, 247, 0.38)' : 'rgba(56, 189, 248, 0.34)';
        ctxPreview.fillRect(0, by, w, 2);
      }
      ctxPreview.fillStyle = 'rgba(226, 232, 240, 0.65)';
      for (let p = 0; p < 70; p++) {
        const px = (p * 521 + frame60 * 389) % w;
        const py = (p * 293 + frame60 * 617) % h;
        ctxPreview.fillRect(px, py, 3, 2);
      }
      ctxPreview.restore();
    }

    if (isGlitchCutWindow) {
      for (let s = 0; s < 4; s++) {
        const sy = Math.floor(((s * 173 + Math.floor(t * 1000)) % 90) / 100 * h);
        const sh = Math.min(h - sy, 42);
        const offset = (s % 2 === 0 ? 1 : -1) * 28;
        ctxPreview.drawImage(els.previewCanvas, 0, sy, w, sh, offset, sy, w, sh);
      }
    }

    if (flashAlpha > 0.03) {
      ctxPreview.fillStyle = `rgba(255, 255, 255, ${flashAlpha.toFixed(3)})`;
      ctxPreview.fillRect(0, 0, w, h);
    }

    // 5f. New Visual Shader Overlays
    // 1. CRT Phosphor Terminal (scanlines, barrel distortion vignette, phosphorescent bloom)
    if (liveFxOn && (styleFx === 'fx-crt-phosphor' || styleFx === 'crt_phosphor')) {
      ctxPreview.save();
      // Phosphor scanlines
      ctxPreview.fillStyle = 'rgba(0, 20, 0, 0.32)';
      for (let sy = 0; sy < h; sy += 3) {
        ctxPreview.fillRect(0, sy, w, 1.2);
      }
      // Subtle barrel distortion vignette
      const crtVignette = ctxPreview.createRadialGradient(w * 0.5, h * 0.5, w * 0.38, w * 0.5, h * 0.5, w * 0.72);
      crtVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      crtVignette.addColorStop(0.7, 'rgba(0, 25, 5, 0.25)');
      crtVignette.addColorStop(1, 'rgba(0, 15, 0, 0.75)');
      ctxPreview.fillStyle = crtVignette;
      ctxPreview.fillRect(0, 0, w, h);
      // Phosphorescent bloom
      ctxPreview.globalCompositeOperation = 'screen';
      ctxPreview.fillStyle = `rgba(34, 197, 94, ${(0.14 + (snareVal > 0.4 ? snareVal * 0.28 : 0)).toFixed(2)})`;
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.restore();
    }

    // 2. Bleach Bypass (Silver Halide / 90s Film Stock)
    if (liveFxOn && (styleFx === 'fx-bleach-bypass' || styleFx === 'bleach_bypass')) {
      ctxPreview.save();
      ctxPreview.globalCompositeOperation = 'overlay';
      ctxPreview.fillStyle = 'rgba(215, 225, 235, 0.12)';
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.restore();
    }

    // 3. Thermal Infrared Solarization (False-color infrared map via multi-stop difference)
    if (liveFxOn && (styleFx === 'fx-thermal-solar' || styleFx === 'thermal_solar')) {
      ctxPreview.save();
      const thermSolar = ctxPreview.createLinearGradient(0, 0, w, h);
      thermSolar.addColorStop(0, 'rgba(253, 224, 71, 0.42)');
      thermSolar.addColorStop(0.3, 'rgba(244, 63, 94, 0.45)');
      thermSolar.addColorStop(0.7, 'rgba(168, 85, 247, 0.48)');
      thermSolar.addColorStop(1, 'rgba(6, 182, 212, 0.45)');
      ctxPreview.globalCompositeOperation = 'difference';
      ctxPreview.fillStyle = thermSolar;
      ctxPreview.fillRect(0, 0, w, h);
      ctxPreview.restore();
    }

    // 4. Tape Degrade (VHS tracking bars & noise)
    if (liveFxOn && (styleFx === 'fx-tape-degrade' || styleFx === 'tape_degrade')) {
      ctxPreview.save();
      const trackY = Math.floor(((t * 140) % 1.0) * (h - 22));
      ctxPreview.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctxPreview.fillRect(0, trackY, w, 4);
      ctxPreview.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctxPreview.fillRect(0, trackY + 4, w, 6);
      for (let tx = 0; tx < w; tx += 14) {
        if ((tx + frame30) % 6 === 0) {
          ctxPreview.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctxPreview.fillRect(tx, trackY, 8, 2);
        }
      }
      ctxPreview.restore();
    }

    // 5. 1920s Sepia Rotogravure (Print grain, warm sepia duotone, fluctuating film flicker)
    if (liveFxOn && (styleFx === 'fx-sepia-rotogravure' || styleFx === 'sepia_rotogravure')) {
      ctxPreview.save();
      const flickerAlpha = 0.88 + Math.random() * 0.12;
      const sepiaGrad = ctxPreview.createRadialGradient(w * 0.5, h * 0.5, w * 0.22, w * 0.5, h * 0.5, w * 0.72);
      sepiaGrad.addColorStop(0, 'rgba(120, 53, 15, 0.15)');
      sepiaGrad.addColorStop(1, 'rgba(69, 26, 3, 0.52)');
      ctxPreview.fillStyle = sepiaGrad;
      ctxPreview.fillRect(0, 0, w, h);

      ctxPreview.fillStyle = `rgba(254, 243, 199, ${(0.07 * flickerAlpha).toFixed(3)})`;
      for (let g = 0; g < 42; g++) {
        const gx = ((g * 857 + Math.floor(t * 710)) % w);
        const gy = ((g * 521 + Math.floor(t * 1180)) % h);
        ctxPreview.fillRect(gx, gy, 2, 2);
      }
      ctxPreview.restore();
    }

    // 6. RGB Split Strobe Transient (Heavy chromatic aberration + strobe flash)
    if (liveFxOn && (styleFx === 'fx-rgb-split-strobe' || styleFx === 'rgb_split_strobe')) {
      if (snareVal > 0.55 || highVal > 0.65) {
        ctxPreview.save();
        ctxPreview.fillStyle = `rgba(255, 255, 255, ${Math.min(0.75, (Math.max(snareVal, highVal) - 0.45) * 1.6).toFixed(2)})`;
        ctxPreview.fillRect(0, 0, w, h);
        ctxPreview.restore();
      }
    }

    // 6. Burroughs Cut-Up Typographic Flash Injection on Snare Transients
    const isBlockTypoAllowed = !Boolean(ev.typo_muted);
    const burroughsTextOn = Boolean(Studio.burroughsSettings && Studio.burroughsSettings.textEnabled);
    const isTypoTextAllowed = typoFlashesOn && burroughsTextOn && isBlockTypoAllowed;

    if (isTypoTextAllowed && snareVal > 0.45) {
      const mode = (Studio.burroughsSettings && Studio.burroughsSettings.textMode) || 'burroughs_cutup';
      let phrase = '';

      if (mode === 'lyrics_only') {
        const cues = (Studio.lyrics && Studio.lyrics.cues) || [];
        if (cues.length) {
          const cueIdx = (ev.index + Math.floor(t * 3)) % cues.length;
          phrase = (cues[cueIdx] && cues[cueIdx].text) ? cues[cueIdx].text.replace(/\s+/g, ' ').trim().toUpperCase() : BURROUGHS_PHRASES[0];
        } else {
          phrase = BURROUGHS_PHRASES[(ev.index + Math.floor(t * 4)) % BURROUGHS_PHRASES.length];
        }
      } else if (mode === 'custom_text') {
        phrase = (Studio.burroughsSettings.customText && Studio.burroughsSettings.customText.trim())
          ? Studio.burroughsSettings.customText.trim().toUpperCase()
          : (ev.typo_phrase || 'SUBVERT CONTROL');
      } else if (mode === 'sigils_noise') {
        const sigilPhrases = [
          '✦ 🜏 ⛥ 🜍 🜂 🜄 🜁 🜃',
          '▲ ⊗ ⌖ ◈ ⨀ ⏣ ⎈ ⍜',
          '᚛ ᚜ ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ',
          '☿ ☉ ☽ ♃ ♄ ♅ ♆ ♇',
          '01001100 01010011 01000100',
          '⌁ ⌂ ⍝ ⍟ ⍡ ⍨ ⎔ ⏣',
        ];
        phrase = sigilPhrases[(ev.index + Math.floor(t * 4)) % sigilPhrases.length];
      } else {
        // 'burroughs_cutup'
        phrase =
          ev.typo_phrase ||
          BURROUGHS_PHRASES[(ev.index + Math.floor(t * 4)) % BURROUGHS_PHRASES.length];
      }

      ctxPreview.save();
      const lyricsRunning = Boolean(Studio.lyrics && Studio.lyrics.cues && Studio.lyrics.cues.length && isLyricsRenderEnabled());
      let bannerH, bannerY;
      if (lyricsRunning) {
        // Upper third scrim / background layer behind video subjects, never in the lower subtitle banner area
        bannerH = Math.floor(h * 0.13);
        bannerY = Math.floor(h * 0.12);
      } else {
        bannerH = Math.floor(h * 0.16);
        bannerY = Math.floor(h * 0.42);
      }

      ctxPreview.fillStyle = 'rgba(8, 8, 12, 0.88)';
      ctxPreview.fillRect(0, bannerY, w, bannerH);
      ctxPreview.strokeStyle = 'rgba(244, 63, 94, 0.85)';
      ctxPreview.lineWidth = 2;
      ctxPreview.strokeRect(18, bannerY + 4, w - 36, bannerH - 8);

      ctxPreview.fillStyle = '#f8fafc';
      ctxPreview.font = `${lyricsRunning ? '800 24px' : '900 32px'} "Courier New", monospace`;
      ctxPreview.textAlign = 'center';
      ctxPreview.textBaseline = 'middle';
      ctxPreview.fillText(phrase, w * 0.5, bannerY + bannerH * 0.5);
      ctxPreview.restore();
    }

    // 7. Lightweight Geometric Echo Tunnel (Zero-Overhead 2D Feedback)
    // Redraws previous canvas state onto itself with ctx.drawImage at scale=1.05 (bass bumps 1.02->1.12),
    // rotation=2deg (snare flips rotation & applies hue-rotate(90deg)), and opacity=0.90.
    if (echoTunnelOn) {
      if (echoBufferReady) {
        const echoScale = bassVal > 0.30
          ? 1.02 + Math.min(0.10, bassVal * 0.10)
          : 1.05;
        const echoAngleRad = ((snareVal > 0.45 ? -2.0 : 2.0) * Math.PI) / 180.0;
        ctxPreview.save();
        ctxPreview.globalAlpha = 0.90;
        ctxPreview.globalCompositeOperation = 'screen';
        if (snareVal > 0.45) {
          ctxPreview.filter = 'hue-rotate(90deg) saturate(1.35)';
        }
        ctxPreview.translate(w * 0.5, h * 0.5);
        ctxPreview.rotate(echoAngleRad);
        ctxPreview.scale(echoScale, echoScale);
        ctxPreview.drawImage(echoFeedbackCanvas, -w * 0.5, -h * 0.5, w, h);
        ctxPreview.restore();
      }
      ctxEcho.clearRect(0, 0, w, h);
      ctxEcho.drawImage(els.previewCanvas, 0, 0, w, h);
      echoBufferReady = true;
    } else {
      echoBufferReady = false;
    }
    // Cache current successfully rendered canvas frame for frame-drop failsafe
    if (!isFrameDropFallback) {
      VideoPool.cacheCurrentFrame(els.previewCanvas);
    }
  } else {
    // When a video frame has dropped or decoded late, draw the cached frame to prevent any visual or audio stall
    if (VideoPool.hasCachedFrame && syncState) {
      ctxPreview.drawImage(VideoPool.lastRenderedCanvas, 0, 0);
    } else if (!Studio.timeline || !Studio.timeline.events || !Studio.timeline.events.length) {
      // When no timeline events are loaded (clean slate session), keep the preview canvas solid black
      ctxPreview.fillStyle = '#000000';
      ctxPreview.fillRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
    }
  }

  // 8. Timed Lyric Engine (.lrc / .srt): Highlight active cue on Lyrics lane & draw Lower-Third Subtitle
  const activeLyricCue = getActiveLyricCueAtTime(t);
  const newLyricIdx = activeLyricCue ? activeLyricCue.index : -1;
  if (newLyricIdx !== Studio.lastActiveLyricIndex && els.lyricsTrack) {
    Studio.lastActiveLyricIndex = newLyricIdx;
    els.lyricsTrack.querySelectorAll('.lyric-cue-block').forEach((el) => {
      el.classList.toggle('active', Number(el.getAttribute('data-lyric-idx')) === newLyricIdx);
    });
  }
  // When [x] Include Lyrics in Final Render is unchecked, bypass text rendering 100%
  if (activeLyricCue && activeLyricCue.text && isLyricsRenderEnabled()) {
    drawLowerThirdLyricOnCanvas(ctxPreview, els.previewCanvas.width, els.previewCanvas.height, activeLyricCue, t, bassVal, snareVal);
  }

  // 1-Frame Physical Hardware Cut Flash on Preset / Auto-Vary boundary switch
  if (Studio.autoVary && Studio.autoVary.hardwareFlashActive) {
    ctxPreview.save();
    if (Math.random() > 0.4) {
      ctxPreview.fillStyle = '#ffffff';
      ctxPreview.fillRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
    } else {
      ctxPreview.globalCompositeOperation = 'difference';
      ctxPreview.fillStyle = '#ffffff';
      ctxPreview.fillRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
    }
    ctxPreview.restore();
    Studio.autoVary.hardwareFlashActive = false;
  }

  // 9. Auto-Vary / Generative Preset Switcher boundary monitor
  if (Studio.isPlaying && Studio.autoVary && Studio.autoVary.enabled && Studio.audio) {
    checkAutoVaryBoundary(t, bassVal, snareVal, highVal);
  }

  requestAnimationFrame(renderLoop);
}

// Timed Lyric Engine: Upload (.lrc / .srt), Global Offset (-5.0s to +5.0s in 50ms increments), & Render Toggle
async function uploadLyricsFileToStudio(file) {
  if (!file) return;
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api('/api/lyrics/upload', { method: 'POST', body: fd });
    Studio.lyrics = res.lyrics;
    Studio.lastActiveLyricIndex = -1;
    syncLyricsUiControls();
    renderTimelineView();
  } catch (err) {
    // Fallback to client-side LRC/SRT parser if offline or custom extension
    try {
      const text = await file.text();
      const totalDur = (Studio.audio && Studio.audio.duration) || 300.0;
      const isSrt = /\.srt$/i.test(file.name) || text.includes('-->');
      const cues = isSrt ? parseSrtContentClient(text) : parseLrcContentClient(text, totalDur);
      if (!cues.length) throw err;
      Studio.lyrics = {
        filename: file.name,
        format: isSrt ? 'srt' : 'lrc',
        global_offset: getLyricGlobalOffset(),
        include_in_render: isLyricsRenderEnabled(),
        cue_count: cues.length,
        cues,
      };
      Studio.lastActiveLyricIndex = -1;
      syncLyricsUiControls();
      renderTimelineView();
    } catch (innerErr) {
      alert(`Lyrics import failed: ${err.message}`);
    }
  }
}

async function setLyricGlobalOffset(rawVal, persist = false) {
  const num = Number(rawVal);
  const clamped = Number.isFinite(num)
    ? Math.max(-5.0, Math.min(5.0, Math.round(num / 0.05) * 0.05))
    : 0.0;
  const snapped = Number(clamped.toFixed(2));
  if (Studio.lyrics) {
    Studio.lyrics.global_offset = snapped;
  }
  if (els.lyricOffsetSlider) els.lyricOffsetSlider.value = snapped;
  if (els.lyricOffsetInput) els.lyricOffsetInput.value = snapped.toFixed(2);
  if (els.lyricOffsetVal) els.lyricOffsetVal.textContent = formatSignedOffset(snapped);
  Studio.lastActiveLyricIndex = -1;
  renderTimelineView();

  if (persist) {
    try {
      const res = await api('/api/lyrics/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ global_offset: snapped }),
      });
      if (res && res.lyrics) Studio.lyrics = res.lyrics;
    } catch (_) {}
  }
}

async function setIncludeLyricsInRender(enabled) {
  const flag = Boolean(enabled);
  if (Studio.lyrics) {
    Studio.lyrics.include_in_render = flag;
  }
  if (els.chkIncludeLyricsExport) els.chkIncludeLyricsExport.checked = flag;
  const laneChk = document.getElementById('chkIncludeLyricsLane');
  if (laneChk) laneChk.checked = flag;
  renderTimelineView();
  if (!Studio.isPlaying) {
    syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
  }
  try {
    const res = await api('/api/lyrics/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ include_in_render: flag }),
    });
    if (res && res.lyrics) Studio.lyrics = res.lyrics;
  } catch (_) {}
}

if (els.lyricFileInput) {
  els.lyricFileInput.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      await uploadLyricsFileToStudio(file);
      e.target.value = '';
    }
  };
}

if (els.lyricOffsetSlider) {
  els.lyricOffsetSlider.oninput = (e) => setLyricGlobalOffset(e.target.value, false);
  els.lyricOffsetSlider.onchange = (e) => setLyricGlobalOffset(e.target.value, true);
}

if (els.lyricOffsetInput) {
  els.lyricOffsetInput.onchange = (e) => setLyricGlobalOffset(e.target.value, true);
}

if (els.btnResetLyricOffset) {
  els.btnResetLyricOffset.onclick = () => setLyricGlobalOffset(0.0, true);
}

if (els.chkIncludeLyricsExport) {
  els.chkIncludeLyricsExport.onchange = (e) => setIncludeLyricsInRender(e.target.checked);
}

if (els.lyricFontSelect) {
  els.lyricFontSelect.onchange = () => {
    triggerWorkspaceAutoSave();
    if (!Studio.isPlaying) syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
  };
}

if (els.lyricAnimSelect) {
  els.lyricAnimSelect.onchange = () => {
    triggerWorkspaceAutoSave();
    if (!Studio.isPlaying) syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
  };
}

if (els.chkMajorMonoAltCase) {
  els.chkMajorMonoAltCase.onchange = () => {
    triggerWorkspaceAutoSave();
    if (!Studio.isPlaying) syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
  };
}

if (els.projectTitleInput) {
  els.projectTitleInput.oninput = (e) => {
    Studio.projectName = e.target.value.trim() || 'Untitled Project';
    document.title = `Strangelet Splicer — ${Studio.projectName}`;
    triggerWorkspaceAutoSave();
  };
}

// Project Workspace Save (.splicer) & Open Handlers
if (els.btnSaveProject) {
  els.btnSaveProject.onclick = () => {
    try {
      const data = serializeWorkspaceState();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const baseName = Studio.projectName && Studio.projectName !== 'Untitled Project'
        ? Studio.projectName.replace(/[^a-zA-Z0-9_\-]/g, '_')
        : ((Studio.audio && Studio.audio.filename)
            ? Studio.audio.filename.replace(/\.[^/.]+$/, '')
            : 'strangelet_project');
      a.href = url;
      a.download = `${baseName}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.stitch`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Studio.hasUnsavedChanges = false;
      if (els.saveLed) {
        els.saveLed.classList.remove('pulsing');
        els.saveLed.classList.add('saved');
      }
      if (els.saveLedText) {
        els.saveLedText.textContent = 'SAVED';
      }
    } catch (err) {
      alert(`Save Project failed: ${err.message}`);
    }
  };
}

/* =========================================================================
   PROJECT BUNDLE ENGINE (.zip) — COLLECT ALL & PORTABLE EXPORT / IMPORT
   ========================================================================= */
async function exportProjectBundle() {
  if (typeof JSZip === 'undefined' || !window.JSZip) {
    alert('JSZip library is not loaded. Please ensure jszip.min.js is present or check your network connection.');
    return;
  }

  const state = serializeWorkspaceState();
  if (!state.audio && (!state.clips || !state.clips.length) && (!state.timeline || !state.timeline.events || !state.timeline.events.length)) {
    alert('Nothing to bundle. Please load an audio track or media clips into your session first.');
    return;
  }

  const baseName = Studio.projectName && Studio.projectName !== 'Untitled Project'
    ? Studio.projectName.replace(/[^a-zA-Z0-9_\-]/g, '_')
    : ((Studio.audio && Studio.audio.filename)
        ? Studio.audio.filename.replace(/\.[^/.]+$/, '')
        : 'strangelet_project');
  const defaultZipName = `${baseName}_bundle_${new Date().toISOString().slice(0, 10)}.zip`;

  if (els.saveLed) {
    els.saveLed.classList.remove('saved');
    els.saveLed.classList.add('pulsing');
  }
  if (els.saveLedText) {
    els.saveLedText.textContent = 'BUNDLING...';
  }

  try {
    const zip = new JSZip();
    const bundleState = JSON.parse(JSON.stringify(state));

    const audioFolder = zip.folder('audio');
    const mediaFolder = zip.folder('media');
    const lyricsFolder = zip.folder('lyrics');

    let totalAssets = 0;
    let fetchedAssets = 0;

    // 1. Audio track
    if (bundleState.audio) {
      const a = bundleState.audio;
      const audioFilename = a.filename || 'audio_track.mp3';
      const audioUrl = toAssetUrl(a.audio_url || a.filepath);
      if (audioUrl) {
        totalAssets++;
        try {
          const resp = await fetch(audioUrl);
          if (resp.ok) {
            const blob = await resp.blob();
            audioFolder.file(audioFilename, blob);
            fetchedAssets++;
          } else {
            console.warn('Could not fetch audio track for bundle:', audioUrl);
          }
        } catch (e) {
          console.warn('Audio fetch error:', e);
        }
      }
      a.audio_url = `./audio/${audioFilename}`;
      a.filepath = `./audio/${audioFilename}`;
    }

    // 2. Media clips & stills (Deduplicated)
    const usedClipsMap = new Map();
    (bundleState.clips || []).forEach((c) => {
      if (c && c.filename) {
        usedClipsMap.set(c.filename, {
          filename: c.filename,
          url: c.clip_url || c.filepath || `/workspace/clips/${c.filename}`,
          is_image: !!(c.is_image || c.media_type === 'image'),
        });
      }
    });

    (bundleState.timeline?.events || []).forEach((ev) => {
      if (ev && ev.clip_filename && !usedClipsMap.has(ev.clip_filename)) {
        usedClipsMap.set(ev.clip_filename, {
          filename: ev.clip_filename,
          url: ev.clip_url || ev.clip_filepath || `/workspace/clips/${ev.clip_filename}`,
          is_image: !!(ev.is_image || ev.media_type === 'image'),
        });
      }
    });

    for (const [filename, item] of usedClipsMap.entries()) {
      totalAssets++;
      const mediaUrl = toAssetUrl(item.url);
      try {
        const resp = await fetch(mediaUrl);
        if (resp.ok) {
          const blob = await resp.blob();
          mediaFolder.file(filename, blob);
          fetchedAssets++;
        } else {
          console.warn(`Could not fetch media for bundle (${filename}):`, mediaUrl);
        }
      } catch (err) {
        console.warn(`Error fetching media clip ${filename}:`, err);
      }
    }

    // Remap clips array
    if (Array.isArray(bundleState.clips)) {
      bundleState.clips.forEach((c) => {
        if (c && c.filename) {
          c.clip_url = `./media/${c.filename}`;
          c.filepath = `./media/${c.filename}`;
          if (c.thumbnail && (c.is_image || c.media_type === 'image')) {
            c.thumbnail = `./media/${c.filename}`;
          }
        }
      });
    }

    // Remap timeline events array
    if (bundleState.timeline && Array.isArray(bundleState.timeline.events)) {
      bundleState.timeline.events.forEach((ev) => {
        if (ev && ev.clip_filename) {
          ev.clip_url = `./media/${ev.clip_filename}`;
          ev.clip_filepath = `./media/${ev.clip_filename}`;
          if (ev.is_image) {
            ev.clip_thumbnail = `./media/${ev.clip_filename}`;
          }
        }
      });
    }

    // 3. Lyrics
    if (bundleState.lyrics) {
      const l = bundleState.lyrics;
      const lyricFilename = l.filename || 'lyrics.lrc';
      if (l.raw_text) {
        lyricsFolder.file(lyricFilename, l.raw_text);
        fetchedAssets++;
        totalAssets++;
      } else if (l.url || l.filepath) {
        totalAssets++;
        try {
          const resp = await fetch(toAssetUrl(l.url || l.filepath));
          if (resp.ok) {
            const blob = await resp.blob();
            lyricsFolder.file(lyricFilename, blob);
            fetchedAssets++;
          }
        } catch (e) {
          console.warn('Lyric fetch error:', e);
        }
      }
      l.url = `./lyrics/${lyricFilename}`;
      l.filepath = `./lyrics/${lyricFilename}`;
    }

    // 4. Manifest project.json
    bundleState.bundle_format = 'strangelet_project_bundle';
    bundleState.bundled_at = new Date().toISOString();
    zip.file('project.json', JSON.stringify(bundleState, null, 2));

    // 5. Generate ZIP
    if (els.saveLedText) els.saveLedText.textContent = 'ZIPPING...';
    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (metadata) => {
        if (els.saveLedText) {
          els.saveLedText.textContent = `ZIP ${Math.round(metadata.percent)}%`;
        }
      }
    );

    // 6. Download / Save dialog trigger
    const downloadUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = defaultZipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);

    alert(`Project Bundle successfully exported!\n\n• File: ${defaultZipName}\n• Packaged: ${fetchedAssets} of ${totalAssets} assets\n• Portable Structure: /project.json, /audio, /media, /lyrics`);
  } catch (err) {
    alert(`Failed to export project bundle: ${err.message}`);
  } finally {
    if (els.saveLed) {
      els.saveLed.classList.remove('pulsing');
      els.saveLed.classList.add('saved');
    }
    if (els.saveLedText) {
      els.saveLedText.textContent = 'SAVED';
    }
  }
}

if (els.openProjectInput) {
  els.openProjectInput.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');

    if (isZip) {
      if (typeof JSZip === 'undefined' || !window.JSZip) {
        alert('JSZip library is not loaded. Cannot unpack .zip bundle without JSZip.');
        e.target.value = '';
        return;
      }
      try {
        if (els.saveLed) {
          els.saveLed.classList.remove('saved');
          els.saveLed.classList.add('pulsing');
        }
        if (els.saveLedText) els.saveLedText.textContent = 'UNPACKING...';

        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Find project.json
        let projectEntry = zip.file('project.json');
        if (!projectEntry) {
          const jsonEntries = zip.file(/\.json$/i);
          if (jsonEntries.length > 0) projectEntry = jsonEntries[0];
        }
        if (!projectEntry) {
          throw new Error('Invalid project bundle: Missing project.json inside ZIP.');
        }

        const projectJsonText = await projectEntry.async('string');
        const projectData = JSON.parse(projectJsonText);

        // Extract all media blobs into in-memory Blob URLs
        const pathMap = {};
        const fileMap = {};

        for (const [relPath, entry] of Object.entries(zip.files)) {
          if (entry.dir) continue;
          const normPath = relPath.replace(/\\/g, '/');
          const blob = await entry.async('blob');
          const blobUrl = URL.createObjectURL(blob);

          pathMap[normPath] = blobUrl;
          pathMap['./' + normPath] = blobUrl;
          pathMap['/' + normPath] = blobUrl;

          const fname = normPath.split('/').pop();
          if (fname) {
            fileMap[fname.toLowerCase()] = blobUrl;
          }
        }

        // 1. Resolve Audio
        if (projectData.audio) {
          const a = projectData.audio;
          const resolvedAudio = pathMap[a.audio_url] || pathMap[a.filepath] || (a.filename && fileMap[a.filename.toLowerCase()]);
          if (resolvedAudio) {
            a.audio_url = resolvedAudio;
            a.filepath = resolvedAudio;
          }
        }

        // 2. Resolve Media Clips & Stills
        if (Array.isArray(projectData.clips)) {
          projectData.clips.forEach((c) => {
            if (c) {
              const resolvedClip = pathMap[c.clip_url] || pathMap[c.filepath] || (c.filename && fileMap[c.filename.toLowerCase()]);
              if (resolvedClip) {
                c.clip_url = resolvedClip;
                c.filepath = resolvedClip;
                if (c.is_image || c.media_type === 'image') {
                  c.thumbnail = resolvedClip;
                }
              }
            }
          });
        }

        // 3. Resolve Timeline Events
        if (projectData.timeline && Array.isArray(projectData.timeline.events)) {
          projectData.timeline.events.forEach((ev) => {
            if (ev) {
              const resolvedEv = pathMap[ev.clip_url] || pathMap[ev.clip_filepath] || (ev.clip_filename && fileMap[ev.clip_filename.toLowerCase()]);
              if (resolvedEv) {
                ev.clip_url = resolvedEv;
                ev.clip_filepath = resolvedEv;
                if (ev.is_image) {
                  ev.clip_thumbnail = resolvedEv;
                }
              }
            }
          });
        }

        // 4. Resolve Lyrics
        if (projectData.lyrics) {
          const l = projectData.lyrics;
          const resolvedLyric = pathMap[l.url] || pathMap[l.filepath] || (l.filename && fileMap[l.filename.toLowerCase()]);
          if (resolvedLyric) {
            l.url = resolvedLyric;
            l.filepath = resolvedLyric;
          }
          if (!l.raw_text && l.filename) {
            const lyricEntry = zip.file(`lyrics/${l.filename}`) || zip.file(l.filename);
            if (lyricEntry) {
              l.raw_text = await lyricEntry.async('string');
            }
          }
        }

        // 5. Restore full workspace state
        await restoreWorkspaceState(projectData);
        renderAudioState();
        renderClipLibrary();
        renderTimelineView();
        syncLyricsUiControls();
        syncVideoDecodersToTime(0, true);
        seekToTime(0);

        alert(`Project Bundle "${file.name}" successfully opened!\n\nAll media files, audio stems, cuts, and lyrics have been loaded into your workspace.`);
      } catch (err) {
        alert(`Failed to open project bundle: ${err.message}`);
      } finally {
        if (els.saveLed) {
          els.saveLed.classList.remove('pulsing');
          els.saveLed.classList.add('saved');
        }
        if (els.saveLedText) els.saveLedText.textContent = 'SAVED';
        e.target.value = '';
      }
    } else {
      // Standard .splicer / .json project
      try {
        const text = await file.text();
        const projectData = JSON.parse(text);
        if (!projectData || (projectData.format !== 'strangelet_splicer_project' && !projectData.timeline && !projectData.audio)) {
          throw new Error('Invalid Strangelet Splicer project file.');
        }
        await restoreWorkspaceState(projectData);
      } catch (err) {
        alert(`Failed to open project: ${err.message}`);
      } finally {
        e.target.value = '';
      }
    }
  };
}

// Warn user on page leave if there are active unsaved timeline cuts
window.addEventListener('beforeunload', (e) => {
  if (Studio.hasUnsavedChanges && Studio.timeline && Studio.timeline.events && Studio.timeline.events.length > 0) {
    e.preventDefault();
    e.returnValue = 'You have unsaved timeline cuts. Leave anyway?';
    return e.returnValue;
  }
});

// Save Custom Preset & Export as JSON
if (els.btnSaveCustomPreset) {
  els.btnSaveCustomPreset.onclick = async () => {
    const currentPreset = Studio.templates.find((t) => t.id === els.templateSelect.value) || Studio.templates[0] || {};
    const nameInput = prompt(
      'Enter a name for your Custom Preset (saves to Preset Bank & downloads JSON):',
      `${(currentPreset.name || 'Custom').replace(/^[^\w]+/, '').trim()} Custom`
    );
    if (!nameInput || !nameInput.trim()) return;

    const minFloor = Number(els.minCutSlider.value);
    const maxCeil = Math.max(minFloor + 0.25, Number(currentPreset.max_cut_ceiling || Math.max(2.5, minFloor * 2.0)));

    const payload = {
      name: `✨ ${nameInput.trim()}`,
      category: currentPreset.category || 'esoteric',
      description: `Custom Preset (${minFloor.toFixed(2)}s–${maxCeil.toFixed(2)}s cuts, ${els.transitionModeSelect.value}, Story/Chop ${els.storyVsChopSlider.value}%)`,
      base_template_id: currentPreset.id || 'narrative_storyboard',
      min_cut_floor: minFloor,
      max_cut_ceiling: maxCeil,
      preserve_full_duration: Boolean(els.chkPreserveFullDuration.checked),
      story_vs_chop: Number(els.storyVsChopSlider.value) / 100.0,
      fx_intensity: Number(els.fxIntensitySlider.value),
      transition_mode: els.transitionModeSelect.value,
      sorting_logic: currentPreset.sorting_logic || 'story_spine',
      motion_behavior: currentPreset.motion_behavior || 'natural_ken_burns',
      style_fx: currentPreset.style_fx || 'clean',
      sprocket_slip: Boolean(els.chkSprocketSlip && els.chkSprocketSlip.checked),
      typographic_flashes: Boolean(els.chkTypoFlashes && els.chkTypoFlashes.checked),
      step_print_12fps: Boolean(els.chkStepPrint12fps && els.chkStepPrint12fps.checked),
      subliminal_sigil_flash: Boolean(els.chkSubliminalSigil && els.chkSubliminalSigil.checked),
      obsidian_scrying_vignette: Boolean(els.chkObsidianScrying && els.chkObsidianScrying.checked),
      thelemic_dye_bloom: Boolean(els.chkThelemicBloom && els.chkThelemicBloom.checked),
      cosmic_static_glitch: Boolean(els.chkCosmicStatic && els.chkCosmicStatic.checked),
      geometric_echo_tunnel: Boolean(els.chkEchoTunnel && els.chkEchoTunnel.checked),
      fold_in_columns: Number(currentPreset.fold_in_columns || 1),
    };

    try {
      const res = await api('/api/presets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      Studio.templates = res.templates || Studio.templates;
      const savedPreset = res.preset || payload;
      populateTemplates(savedPreset.id);

      // Trigger JSON file download for portable backup/sharing
      const blob = new Blob([JSON.stringify(savedPreset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${savedPreset.id || 'strangelet_custom_preset'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed to save custom preset: ${err.message}`);
    }
  };
}

/* =========================================================================
   AUTO-VARY / GENERATIVE PRESET & SHADER SWITCHER ENGINE
   ========================================================================= */
const AUTO_FX_POOL = [
  'fx-crt-phosphor',
  'fx-bleach-bypass',
  'fx-thermal-solar',
  'fx-tape-degrade',
  'fx-sepia-rotogravure',
  'fx-rgb-split-strobe',
  'vhs_tape',
  'film_16mm',
  'cyber_glitch',
  'burroughs_cutup',
  'brakhage_emulsion',
  'structural_flicker',
  'lynch_monochrome',
  'babalon_working',
  'typhonian_transmission',
  'dim_carcosa',
];

function triggerAutoVarySwitch(reason = '') {
  if (!Studio.autoVary || !Studio.autoVary.enabled) return;

  // 1. Pick an unused visual FX / shader from the pool
  const candidateFx = AUTO_FX_POOL.filter((fx) => !(Studio.autoVary.recentPresets || []).includes(fx));
  const chosenFx = candidateFx.length
    ? candidateFx[Math.floor(Math.random() * candidateFx.length)]
    : AUTO_FX_POOL[Math.floor(Math.random() * AUTO_FX_POOL.length)];

  // 2. Pick an unused cutting template preset if available
  const availableTemplates = (Studio.templates || []).filter(
    (t) => t.id !== 'manual_workbench_slate' && !(Studio.autoVary.recentPresets || []).includes(t.id)
  );
  const chosenTemplate = availableTemplates.length
    ? availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
    : (Studio.templates || []).find((t) => t.id !== 'manual_workbench_slate');

  // Track recent presets (keep max 2)
  if (!Studio.autoVary.recentPresets) Studio.autoVary.recentPresets = [];
  Studio.autoVary.recentPresets.push(chosenFx);
  if (chosenTemplate) {
    Studio.autoVary.recentPresets.push(chosenTemplate.id);
  }
  while (Studio.autoVary.recentPresets.length > 2) {
    Studio.autoVary.recentPresets.shift();
  }

  // 3. Set active visual FX
  Studio.autoVary.activeAutoFx = chosenFx;

  // 4. Update preset controls dynamically without interrupting audio playback
  if (chosenTemplate && els.templateSelect) {
    els.templateSelect.value = chosenTemplate.id;
    applyPresetConfiguration(chosenTemplate, false);
  }

  // 5. Trigger 1-frame physical hardware cut flash (invert / whiteout)
  Studio.autoVary.hardwareFlashActive = true;

  if (els.hudMatchReason) {
    els.hudMatchReason.textContent = `🎲 Auto-Vary: ${chosenFx.toUpperCase()} ${reason ? `(${reason})` : ''}`;
  }
}

function checkAutoVaryBoundary(t, bassVal, snareVal, highVal) {
  if (!Studio.autoVary || !Studio.autoVary.enabled) return;
  const mode = Studio.autoVary.frequency || 'section';
  const nowMs = performance.now();
  if (nowMs - (Studio.autoVary.lastTriggerTime || 0) < 450) {
    return;
  }

  if (mode === 'section') {
    const sections = (Studio.audio && Studio.audio.sections) || [];
    let curSecIdx = -1;
    for (let i = 0; i < sections.length; i++) {
      if (t >= sections[i].start && t < sections[i].end) {
        curSecIdx = i;
        break;
      }
    }
    if (curSecIdx >= 0 && curSecIdx !== Studio.autoVary.lastTriggerKey) {
      Studio.autoVary.lastTriggerKey = curSecIdx;
      Studio.autoVary.lastTriggerTime = nowMs;
      triggerAutoVarySwitch(`Section ${sections[curSecIdx].label || curSecIdx + 1}`);
    }
  } else if (mode === 'bar-4') {
    const downbeats = (Studio.audio && Studio.audio.downbeats) || [];
    if (downbeats.length) {
      let dbIdx = 0;
      for (let i = 0; i < downbeats.length; i++) {
        if (t >= downbeats[i]) dbIdx = i;
        else break;
      }
      const cluster4 = Math.floor(dbIdx / 4);
      if (cluster4 !== Studio.autoVary.lastTriggerKey) {
        Studio.autoVary.lastTriggerKey = cluster4;
        Studio.autoVary.lastTriggerTime = nowMs;
        triggerAutoVarySwitch(`Bar ${cluster4 * 4 + 1}`);
      }
    }
  } else if (mode === 'bar-1') {
    const downbeats = (Studio.audio && Studio.audio.downbeats) || [];
    if (downbeats.length) {
      let dbIdx = 0;
      for (let i = 0; i < downbeats.length; i++) {
        if (t >= downbeats[i]) dbIdx = i;
        else break;
      }
      if (dbIdx !== Studio.autoVary.lastTriggerKey) {
        Studio.autoVary.lastTriggerKey = dbIdx;
        Studio.autoVary.lastTriggerTime = nowMs;
        triggerAutoVarySwitch(`Downbeat ${dbIdx + 1}`);
      }
    }
  } else if (mode === 'transient') {
    const isHeavyTransient = (snareVal > 0.62 || bassVal > 0.65 || highVal > 0.68);
    if (isHeavyTransient && (nowMs - (Studio.autoVary.lastTriggerTime || 0) > 850)) {
      Studio.autoVary.lastTriggerKey = Math.floor(t * 10);
      Studio.autoVary.lastTriggerTime = nowMs;
      triggerAutoVarySwitch('Heavy Transient Spike');
    }
  }
}

if (els.toggleAutoFx) {
  els.toggleAutoFx.onchange = () => {
    if (!Studio.autoVary) {
      Studio.autoVary = { enabled: false, frequency: 'section', recentPresets: [] };
    }
    Studio.autoVary.enabled = !!els.toggleAutoFx.checked;
    if (!Studio.autoVary.enabled) {
      Studio.autoVary.activeAutoFx = null;
      if (els.previewCanvas) {
        els.previewCanvas.classList.remove(
          'fx-crt-phosphor', 'fx-bleach-bypass', 'fx-thermal-solar',
          'fx-tape-degrade', 'fx-sepia-rotogravure', 'fx-rgb-split-strobe'
        );
      }
    } else {
      triggerAutoVarySwitch('Auto-Vary Engaged');
    }
    triggerWorkspaceAutoSave();
  };
}

if (els.autoFxFrequency) {
  els.autoFxFrequency.onchange = () => {
    if (!Studio.autoVary) {
      Studio.autoVary = { enabled: false, frequency: 'section', recentPresets: [] };
    }
    Studio.autoVary.frequency = els.autoFxFrequency.value;
    Studio.autoVary.lastTriggerKey = null;
    triggerWorkspaceAutoSave();
  };
}

/* =========================================================================
   BURROUGHS CUT-UP / TYPOGRAPHIC FLASH ENGINE CONTROLS
   ========================================================================= */
if (els.toggleBurroughsText) {
  els.toggleBurroughsText.onchange = () => {
    if (!Studio.burroughsSettings) {
      Studio.burroughsSettings = { textEnabled: true, textMode: 'burroughs_cutup', customText: '' };
    }
    Studio.burroughsSettings.textEnabled = !!els.toggleBurroughsText.checked;
    triggerWorkspaceAutoSave();
    if (!Studio.isPlaying) syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime || 0 : 0, true);
  };
}

if (els.burroughsTextMode) {
  els.burroughsTextMode.onchange = () => {
    if (!Studio.burroughsSettings) {
      Studio.burroughsSettings = { textEnabled: true, textMode: 'burroughs_cutup', customText: '' };
    }
    Studio.burroughsSettings.textMode = els.burroughsTextMode.value;
    if (els.burroughsCustomText) {
      els.burroughsCustomText.style.display = els.burroughsTextMode.value === 'custom_text' ? 'block' : 'none';
    }
    triggerWorkspaceAutoSave();
    if (!Studio.isPlaying) syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime || 0 : 0, true);
  };
}

if (els.burroughsCustomText) {
  els.burroughsCustomText.oninput = () => {
    if (!Studio.burroughsSettings) {
      Studio.burroughsSettings = { textEnabled: true, textMode: 'burroughs_cutup', customText: '' };
    }
    Studio.burroughsSettings.customText = els.burroughsCustomText.value;
    triggerWorkspaceAutoSave();
  };
}

// Export Resolution Synchronization (Strip <-> Modal)
if (els.exportResolutionSelect) {
  els.exportResolutionSelect.onchange = (e) => {
    const val = e.target.value;
    const modalSelect = document.getElementById('exportResolution');
    if (modalSelect) {
      if (val === '1080p') modalSelect.value = '1920x1080';
      else if (val === '4k') modalSelect.value = '3840x2160';
      else if (val === 'vertical') modalSelect.value = '1080x1920';
      else if (val === 'square') modalSelect.value = '1080x1080';
    }
    triggerWorkspaceAutoSave();
  };
}


/* =========================================================================
   STUDIO TRANSPORT ENGINE (Play/Pause, Stop, Go to Start, Go to End, Loop)
   ========================================================================= */
Studio.isLooping = false;

function updateTransportUI() {
  const playBtn = document.getElementById('btn-play-pause') || els.btnPlayPause;
  if (playBtn) {
    playBtn.textContent = Studio.isPlaying ? '⏸' : '▶';
    playBtn.title = Studio.isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)';
  }
  const loopBtn = document.getElementById('btn-loop-toggle') || els.btnLoopToggle;
  if (loopBtn) {
    loopBtn.classList.toggle('active', Boolean(Studio.isLooping));
    loopBtn.setAttribute('aria-pressed', Boolean(Studio.isLooping).toString());
  }
}

function gotoStart() {
  const wasPlaying = Studio.isPlaying;
  const dur = (Studio.audio && Studio.audio.duration) || (Studio.timeline && Studio.timeline.total_duration) || 0;

  if (els.mainAudio) {
    els.mainAudio.currentTime = 0;
  }
  [els.vidA, els.vidB, els.vidL, els.vidR].forEach((v) => {
    if (v) {
      try { fastSeekVideo(v, 0); } catch (_) {}
    }
  });

  if (els.playheadLine) els.playheadLine.style.left = '0px';
  if (els.timelineScroll) els.timelineScroll.scrollLeft = 0;
  if (els.timecodeDisplay) {
    els.timecodeDisplay.textContent = `${formatTime(0)} / ${formatTime(dur)}`;
  }

  syncVideoDecodersToTime(0, true);

  if (wasPlaying) {
    if (els.mainAudio && els.mainAudio.paused) {
      els.mainAudio.play().catch(() => {});
    }
    const activeVid = getActiveDecoderVideo();
    if (activeVid && activeVid.paused) {
      activeVid.play().catch(() => {});
    }
    Studio.isPlaying = true;
  }
  updateTransportUI();
}

function gotoEnd() {
  const dur = (Studio.audio && Studio.audio.duration) || (Studio.timeline && Studio.timeline.total_duration) || 0;
  if (els.mainAudio) {
    els.mainAudio.pause();
    els.mainAudio.currentTime = Math.max(0, dur);
  }
  [els.vidA, els.vidB, els.vidL, els.vidR].forEach((v) => {
    if (v) {
      try { v.pause(); fastSeekVideo(v, Math.max(0, dur)); } catch (_) {}
    }
  });

  Studio.isPlaying = false;
  if (els.playheadLine) els.playheadLine.style.left = `${dur * Studio.pxPerSec}px`;
  if (els.timecodeDisplay) {
    els.timecodeDisplay.textContent = `${formatTime(dur)} / ${formatTime(dur)}`;
  }

  syncVideoDecodersToTime(dur, true);
  updateTransportUI();
}

function togglePlayPause() {
  if (!Studio.audio) return;

  if (Studio.isPlaying) {
    if (els.mainAudio) els.mainAudio.pause();
    [els.vidA, els.vidB, els.vidL, els.vidR].forEach((v) => {
      if (v) {
        try { v.pause(); } catch (_) {}
      }
    });
    Studio.isPlaying = false;
  } else {
    const dur = (Studio.audio && Studio.audio.duration) || (Studio.timeline && Studio.timeline.total_duration) || 0;
    if (els.mainAudio && dur > 0 && els.mainAudio.currentTime >= dur - 0.05) {
      els.mainAudio.currentTime = 0;
    }
    if (els.mainAudio) {
      els.mainAudio.play().catch(() => {});
    }
    const activeVid = getActiveDecoderVideo();
    if (activeVid) {
      activeVid.play().catch(() => {});
    }
    Studio.isPlaying = true;
  }
  updateTransportUI();
}

function stopPlayback() {
  if (els.mainAudio) {
    try { els.mainAudio.pause(); } catch (_) {}
    els.mainAudio.currentTime = 0;
  }
  [els.vidA, els.vidB, els.vidL, els.vidR].forEach((v) => {
    if (v) {
      try { v.pause(); fastSeekVideo(v, 0); } catch (_) {}
    }
  });

  Studio.isPlaying = false;
  const dur = (Studio.audio && Studio.audio.duration) || (Studio.timeline && Studio.timeline.total_duration) || 0;
  if (els.playheadLine) els.playheadLine.style.left = '0px';
  if (els.timelineScroll) els.timelineScroll.scrollLeft = 0;
  if (els.timecodeDisplay) {
    els.timecodeDisplay.textContent = `${formatTime(0)} / ${formatTime(dur)}`;
  }
  if (Studio.autoVary) {
    Studio.autoVary.lastTriggerKey = null;
    Studio.autoVary.hardwareFlashActive = false;
  }
  syncVideoDecodersToTime(0, true);
  updateTransportUI();
}

function toggleLoop() {
  Studio.isLooping = !Studio.isLooping;
  updateTransportUI();
}

// Bind transport buttons
const playPauseBtn = document.getElementById('btn-play-pause') || els.btnPlayPause;
if (playPauseBtn) playPauseBtn.onclick = togglePlayPause;

const stopBtn = document.getElementById('btn-stop') || els.btnStop;
if (stopBtn) stopBtn.onclick = stopPlayback;

const gotoStartBtn = document.getElementById('btn-goto-start') || els.btnGotoStart;
if (gotoStartBtn) gotoStartBtn.onclick = gotoStart;

const gotoEndBtn = document.getElementById('btn-goto-end') || els.btnGotoEnd;
if (gotoEndBtn) gotoEndBtn.onclick = gotoEnd;

const loopToggleBtn = document.getElementById('btn-loop-toggle') || els.btnLoopToggle;
if (loopToggleBtn) loopToggleBtn.onclick = toggleLoop;

if (els.mainAudio) {
  els.mainAudio.onended = () => {
    if (Studio.isLooping) {
      gotoStart();
      if (els.mainAudio.paused) {
        els.mainAudio.play().catch(() => {});
      }
      Studio.isPlaying = true;
      updateTransportUI();
    } else {
      Studio.isPlaying = false;
      updateTransportUI();
    }
  };
}

if (els.chkShowHud) {
  els.chkShowHud.onchange = () => {
    const isShown = !!els.chkShowHud.checked;
    if (els.hudStatusStrip) {
      els.hudStatusStrip.style.display = isShown ? 'flex' : 'none';
    }
    const labelEl = document.getElementById('menuLabelToggleHud');
    if (labelEl) {
      labelEl.textContent = isShown ? 'Hide HUD Readout' : 'Show HUD Readout';
    }
  };
}

if (els.fxIntensitySlider) {
  els.fxIntensitySlider.oninput = () => {
    if (els.fxIntensityVal) els.fxIntensityVal.textContent = `${Math.round(Number(els.fxIntensitySlider.value) * 100)}%`;
  };
  els.fxIntensitySlider.onchange = () => {
    triggerWorkspaceAutoSave();
  };
}

if (els.minCutSlider) {
  els.minCutSlider.oninput = () => {
    if (els.minCutVal) els.minCutVal.textContent = `${Number(els.minCutSlider.value).toFixed(2)}s`;
  };
  els.minCutSlider.onchange = () => {
    triggerWorkspaceAutoSave();
  };
}

if (els.storyVsChopSlider) {
  els.storyVsChopSlider.oninput = () => {
    updateStoryVsChopLabel();
  };
  els.storyVsChopSlider.onchange = () => {
    if (Studio.audio && Studio.clips.length) triggerGenerateTimeline();
    else triggerWorkspaceAutoSave();
  };
}

if (els.chkPreserveFullDuration) {
  els.chkPreserveFullDuration.onchange = () => {
    if (Studio.audio && Studio.clips.length) triggerGenerateTimeline();
    else triggerWorkspaceAutoSave();
  };
}

[
  els.chkSprocketSlip,
  els.chkTypoFlashes,
  els.chkStepPrint12fps,
  els.chkSubliminalSigil,
  els.chkObsidianScrying,
  els.chkThelemicBloom,
  els.chkCosmicStatic,
  els.chkEchoTunnel,
].forEach((chk) => {
  if (chk) {
    chk.onchange = () => {
      if (Studio.audio && Studio.clips.length) triggerGenerateTimeline();
      else triggerWorkspaceAutoSave();
    };
  }
});

if (els.timelineZoomSlider) {
  els.timelineZoomSlider.oninput = () => {
    Studio.pxPerSec = Number(els.timelineZoomSlider.value);
    renderTimelineView();
  };
  els.timelineZoomSlider.onchange = () => {
    triggerWorkspaceAutoSave();
  };
}

// Playhead Split Hotkey ('S' or 'C') & Manual Block Toolbar Buttons
async function splitCutAtPlayhead() {
  if (!Studio.timeline || !Studio.timeline.events || !Studio.timeline.events.length) {
    return;
  }
  const playheadSec = Number(els.mainAudio.currentTime || 0);
  try {
    const res = await api('/api/timeline/split-at-playhead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: playheadSec }),
    });
    Studio.timeline = res.timeline;
    Studio.selectedCutIndex = res.split_index;
    Studio.activeSlotIndex = -1;
    renderTimelineView();
    syncVideoDecodersToTime(playheadSec, true);
  } catch (err) {
    alert(`Split at playhead: ${err.message}`);
  }
}

if (els.btnSplitAtPlayhead) {
  els.btnSplitAtPlayhead.onclick = splitCutAtPlayhead;
}

if (els.btnAddManualBlock) {
  els.btnAddManualBlock.onclick = async () => {
    if (!Studio.clips.length) {
      alert('Load or import at least one clip or image into the Library first.');
      return;
    }
    const clipToAdd = Studio.clips.find((c) => c.id === Studio.inspectedClipId) || Studio.clips[0];
    const events = (Studio.timeline && Studio.timeline.events) || [];
    const defaultStart = events.length
      ? Number(events[events.length - 1].end)
      : Number(els.mainAudio.currentTime || 0);
    const isStill = clipToAdd.media_type === 'image';
    const blockDur = isStill ? getStillDefaultDuration() : Math.min(3.5, Math.max(1.5, Number(clipToAdd.duration || 2.5)));
    try {
      const res = await api('/api/timeline/add-manual-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clipToAdd.id,
          start: Number(defaultStart.toFixed(3)),
          duration: blockDur,
        }),
      });
      Studio.timeline = res.timeline;
      Studio.activeSlotIndex = -1;
      renderTimelineView();
      syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
    } catch (err) {
      alert(`Add manual block failed: ${err.message}`);
    }
  };
}

// Global Timeline Zoom Helper
function zoomTimeline(delta) {
  if (!els.timelineZoomSlider) return;
  const cur = Number(els.timelineZoomSlider.value) || 65;
  const next = Math.max(15, Math.min(200, cur + delta));
  els.timelineZoomSlider.value = next;
  Studio.pxPerSec = next;
  renderTimelineView();
  triggerWorkspaceAutoSave();
}

// 1-Click Load Synth Demo Track & Media
const btnLoadDemo = document.getElementById('btnLoadDemo');
if (btnLoadDemo) {
  btnLoadDemo.onclick = async (e) => {
    const btn = e.currentTarget;
    const orig = btn.textContent;
    btn.textContent = '⏳ Synthesizing Demo...';
    btn.disabled = true;
    try {
      const res = await api('/api/demo/load', { method: 'POST' });
      Studio.audio = res.audio;
      Studio.clips = res.clips;
      Studio.timeline = res.timeline;
      if (res.lyrics) {
        Studio.lyrics = res.lyrics;
        syncLyricsUiControls();
      }
      if (els.globalPromptInput) {
        els.globalPromptInput.value = 'neon cyberpunk high-energy drop with atmospheric midnight intro';
      }
      renderClipLibrary();
      renderAudioState();
      renderTimelineView();
      if (Studio.audio && Studio.audio.audio_url) {
        AudioEngine.loadAudioFromUrl(Studio.audio.audio_url);
      }
      seekToTime(0);
    } catch (err) {
      alert(`Failed to load demo: ${err.message}`);
    } finally {
      btn.textContent = orig;
      btn.disabled = false;
    }
  };
}

// Upload Audio Track
if (els.audioFileInput) {
  els.audioFileInput.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await uploadSingleAudioFile(file);
    e.target.value = '';
  };
}

if (els.btnLoadAudio) {
  els.btnLoadAudio.onclick = () => {
    if (els.audioFileInputDedicated) {
      els.audioFileInputDedicated.click();
    } else if (els.audioFileInput) {
      els.audioFileInput.click();
    }
  };
}

if (els.audioFileInputDedicated) {
  els.audioFileInputDedicated.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await uploadSingleAudioFile(file);
    e.target.value = '';
  };
}

async function ejectAudioTrack() {
  stopPlayback();
  AudioEngine.reset();
  if (window.audioBufferSource) {
    try { window.audioBufferSource.stop(); } catch (e) {}
    try { window.audioBufferSource.disconnect(); } catch (e) {}
    window.audioBufferSource = null;
  }
  if (els.mainAudio) {
    try { els.mainAudio.pause(); } catch (e) {}
    els.mainAudio.removeAttribute('src');
    els.mainAudio.src = '';
    els.mainAudio.removeAttribute('data-src');
    try { els.mainAudio.load(); } catch (e) {}
    els.mainAudio.currentTime = 0;
  }
  Studio.audio = null;
  Studio.audioBuffer = null;
  Studio.currentAudioUrl = null;
  Studio.audioDuration = 0;
  window.audioBuffer = null;
  window.audioDuration = 0;
  window.currentAudioUrl = null;
  window.peaks = [];
  if (window.waveformDrawer && typeof window.waveformDrawer.clear === 'function') {
    try { window.waveformDrawer.clear(); } catch (e) {}
  }
  if (els.waveformCanvas) {
    const wfCanvas = els.waveformCanvas;
    const totalW = 800;
    wfCanvas.width = totalW;
    wfCanvas.height = 76;
    const wctx = wfCanvas.getContext('2d');
    wctx.fillStyle = '#090c14';
    wctx.fillRect(0, 0, totalW, 76);
  }
  if (els.sectionsSlotList) {
    els.sectionsSlotList.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px;">Upload an audio track to auto-detect Intro / Verse / Build / Drop / Chorus sections.</div>';
  }
  renderAudioState();
  renderTimelineView();

  try {
    await api('/api/state/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: null }),
    });
  } catch (_) {}
  triggerWorkspaceAutoSave();
}

if (els.btnEjectAudio) {
  els.btnEjectAudio.onclick = ejectAudioTrack;
}

// Media Bay Purging (Video Clips & Still Images)
async function clearVideos() {
  Studio.clips = (Studio.clips || []).filter((c) => c.media_type === 'image' || c.is_image);
  if (Studio.timeline && Array.isArray(Studio.timeline.events)) {
    Studio.timeline.events = Studio.timeline.events.filter((e) => e.media_type === 'image' || e.is_image);
  }
  try {
    await api('/api/clips/clear/video', { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend clear videos error:', err);
  }
  renderClipLibrary();
  renderTimelineView();
  syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime : 0, true);
  triggerWorkspaceAutoSave();
}

async function clearStills() {
  Studio.clips = (Studio.clips || []).filter((c) => c.media_type !== 'image' && !c.is_image);
  if (Studio.timeline && Array.isArray(Studio.timeline.events)) {
    Studio.timeline.events = Studio.timeline.events.filter((e) => e.media_type !== 'image' && !e.is_image);
  }
  try {
    await api('/api/clips/clear/still', { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend clear stills error:', err);
  }
  renderClipLibrary();
  renderTimelineView();
  syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime : 0, true);
  triggerWorkspaceAutoSave();
}

if (els.btnClearVideos) {
  els.btnClearVideos.onclick = clearVideos;
}

if (els.btnClearStills) {
  els.btnClearStills.onclick = clearStills;
}

async function uploadSingleAudioFile(file) {
  if (els.audioTrackLabel) els.audioTrackLabel.textContent = `⏳ Analyzing ${file.name}...`;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await api('/api/audio/upload', { method: 'POST', body: fd });
    Studio.audio = res.audio;
    renderAudioState();
    if (Studio.audio && Studio.audio.audio_url) {
      AudioEngine.loadAudioFromUrl(Studio.audio.audio_url);
    }
    if (Studio.clips.length > 0 || (els.templateSelect && els.templateSelect.value === 'manual_workbench_slate')) {
      await triggerGenerateTimeline();
    } else {
      renderTimelineView();
    }
  } catch (err) {
    alert(`Audio upload failed: ${err.message}`);
    renderAudioState();
  }
}

async function uploadMediaBatch(fileList) {
  const mediaFiles = fileList.filter((f) => VALID_MEDIA_EXT_REGEX.test(f.name));
  const audioFiles = fileList.filter((f) => VALID_AUDIO_EXT_REGEX.test(f.name));
  const lyricFiles = fileList.filter((f) => VALID_LYRIC_EXT_REGEX.test(f.name));

  if (lyricFiles.length > 0) {
    await uploadLyricsFileToStudio(lyricFiles[0]);
  }

  if (audioFiles.length > 0 && !Studio.audio) {
    await uploadSingleAudioFile(audioFiles[0]);
  }

  if (!mediaFiles.length) {
    if (!audioFiles.length) {
      alert('No supported video (.mp4, .mov, .webm, .mkv) or image (.png, .jpg, .webp) files found.');
    }
    return;
  }

  const chunkSize = 12;
  for (let i = 0; i < mediaFiles.length; i += chunkSize) {
    const chunk = mediaFiles.slice(i, i + chunkSize);
    const fd = new FormData();
    chunk.forEach((f) => fd.append('files', f));
    els.clipLibraryList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--accent);">⏳ Analyzing media ${i + 1}–${Math.min(mediaFiles.length, i + chunk.length)} of ${mediaFiles.length}...</div>`;
    const res = await api('/api/clips/upload', { method: 'POST', body: fd });
    Studio.clips = res.clips;
  }

  const stillDur = getStillDefaultDuration();
  (Studio.clips || []).forEach((c) => {
    if (c.media_type === 'image') {
      c.duration = stillDur;
    }
  });

  // 1. Immediately update the library counter badges in the UI
  renderClipLibrary();

  // 2. Automatically invoke timeline re-evaluation / rebuild
  const isManualWorkbench = (els.templateSelect && els.templateSelect.value === 'manual_workbench_slate');
  const hasEmptyTimeline = !Studio.timeline || !Studio.timeline.events || !Studio.timeline.events.length;

  if (Studio.audio) {
    if (isManualWorkbench && hasEmptyTimeline) {
      // If currently on Manual Workbench with empty slate awaiting visuals, populate workbench immediately
      try {
        const res = await api('/api/timeline/populate-workbench', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clips: Studio.clips, still_duration: stillDur }),
        });
        Studio.timeline = res.timeline;
        renderTimelineView();
        syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime || 0 : 0, true);
      } catch (err) {
        console.warn('Populate workbench error:', err);
        await triggerGenerateTimeline();
      }
    } else {
      // Rebuild story spine and timeline
      await triggerGenerateTimeline();
    }
  } else {
    // If no audio track is loaded yet, prepare workbench timeline state with newly added clips
    renderTimelineView();
  }
}

if (els.clipFileInput) {
  els.clipFileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length) await uploadMediaBatch(files);
  };
}

if (els.videoFileInput) {
  els.videoFileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length) await uploadMediaBatch(files);
  };
}

if (els.stillFileInput) {
  els.stillFileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length) await uploadMediaBatch(files);
  };
}

if (els.folderFileInput) {
  els.folderFileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length) await uploadMediaBatch(files);
  };
}

const btnImportVideos = document.getElementById('import-videos-btn');
if (btnImportVideos && els.videoFileInput) {
  btnImportVideos.onclick = (e) => {
    if (e.target !== els.videoFileInput) {
      els.videoFileInput.click();
    }
  };
}

const btnImportStills = document.getElementById('import-stills-btn');
if (btnImportStills && els.stillFileInput) {
  btnImportStills.onclick = (e) => {
    if (e.target !== els.stillFileInput) {
      els.stillFileInput.click();
    }
  };
}

if (els.stillDurationSelect) {
  els.stillDurationSelect.onchange = () => {
    const isCustom = els.stillDurationSelect.value === 'custom';
    if (els.stillCustomDurationWrap) {
      els.stillCustomDurationWrap.style.display = isCustom ? 'inline-flex' : 'none';
    }
    const dur = getStillDefaultDuration();
    (Studio.clips || []).forEach((c) => {
      if (c.media_type === 'image') {
        c.duration = dur;
      }
    });
    renderClipLibrary();
    triggerWorkspaceAutoSave();
  };
}

if (els.stillCustomDurationInput) {
  els.stillCustomDurationInput.oninput = () => {
    const dur = getStillDefaultDuration();
    (Studio.clips || []).forEach((c) => {
      if (c.media_type === 'image') {
        c.duration = dur;
      }
    });
    renderClipLibrary();
    triggerWorkspaceAutoSave();
  };
}

async function readEntryRecursively(entry) {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => resolve([file]), () => resolve([]));
    });
  }
  if (entry.isDirectory) {
    const reader = entry.createReader();
    const entries = await new Promise((resolve) => {
      const all = [];
      function readBatch() {
        reader.readEntries((batch) => {
          if (!batch.length) resolve(all);
          else {
            all.push(...batch);
            readBatch();
          }
        }, () => resolve(all));
      }
      readBatch();
    });
    const nested = await Promise.all(entries.map(readEntryRecursively));
    return nested.flat();
  }
  return [];
}

function setupDropzoneEvents(dropzoneEl, highlightBorder = 'var(--accent-cyan)') {
  if (!dropzoneEl) return;
  dropzoneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzoneEl.style.borderColor = highlightBorder;
  });
  dropzoneEl.addEventListener('dragleave', () => {
    dropzoneEl.style.borderColor = '#3e4759';
  });
  dropzoneEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzoneEl.style.borderColor = '#3e4759';
    const items = Array.from(e.dataTransfer.items || []);
    let collected = [];

    if (items.length && items[0].webkitGetAsEntry) {
      const entries = items.map((it) => it.webkitGetAsEntry()).filter(Boolean);
      const arrays = await Promise.all(entries.map(readEntryRecursively));
      collected = arrays.flat();
    } else {
      collected = Array.from(e.dataTransfer.files || []);
    }

    if (collected.length) {
      await uploadMediaBatch(collected);
    }
  });
}

setupDropzoneEvents(els.videoDropzone, 'var(--accent-cyan)');
setupDropzoneEvents(document.getElementById('drop-video-clips'), 'var(--accent-cyan)');
setupDropzoneEvents(els.stillDropzone, '#c084fc');
setupDropzoneEvents(document.getElementById('drop-still-images'), '#c084fc');
setupDropzoneEvents(els.mediaDropzone, 'var(--accent)');

// Direct Local Drive Path Recursive Ingest (D:, E:, F:)
const btnIngestPath = document.getElementById('btnIngestLocalPath');
if (btnIngestPath) {
  btnIngestPath.onclick = async () => {
    const pathEl = document.getElementById('localPathInput');
    const pathVal = pathEl ? pathEl.value.trim() : '';
    if (!pathVal) {
      alert('Enter a local folder or file path on D:, E:, or F: (e.g. F:\\mp4)');
      return;
    }
    btnIngestPath.textContent = '⏳ Scanning...';
    btnIngestPath.disabled = true;
    try {
      const res = await api('/api/ingest/local-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathVal, max_files: 40, recursive: true }),
      });
      if (res.audio) {
        Studio.audio = res.audio;
        renderAudioState();
      }
      if (res.clips) {
        Studio.clips = res.clips;
        renderClipLibrary();
      }
      if (Studio.audio && Studio.clips.length > 0) {
        await triggerGenerateTimeline();
      } else {
        renderTimelineView();
      }
    } catch (err) {
      alert(`Local path import error: ${err.message}`);
    } finally {
      btnIngestPath.textContent = 'Scan & Import';
      btnIngestPath.disabled = false;
    }
  };
}

// Generate / Rebuild Beat-Synced & Story-Spine Timeline
async function triggerGenerateTimeline() {
  const isManualSlate = els.templateSelect && els.templateSelect.value === 'manual_workbench_slate';
  if (!Studio.audio || (!Studio.clips.length && !isManualSlate)) {
    alert('Please load both an audio track and at least one video clip or image first.');
    return;
  }
  const btn = document.getElementById('btnGenerateEdit');
  if (btn) {
    btn.textContent = '⏳ Splicing...';
    btn.disabled = true;
  }
  try {
    const activePreset = Studio.templates.find((t) => t.id === (els.templateSelect ? els.templateSelect.value : '')) || {};
    const payload = {
      template_id: els.templateSelect ? els.templateSelect.value : '',
      global_prompt: els.globalPromptInput ? els.globalPromptInput.value.trim() : '',
      sections: Studio.audio.sections,
      fx_intensity: Number(els.fxIntensitySlider ? els.fxIntensitySlider.value : 0.5),
      min_clip_duration: Number(els.minCutSlider ? els.minCutSlider.value : 0.5),
      transition_mode: els.transitionModeSelect ? els.transitionModeSelect.value : 'jump_cut',
      preserve_full_duration: Boolean(els.chkPreserveFullDuration && els.chkPreserveFullDuration.checked),
      story_vs_chop: Number(els.storyVsChopSlider ? els.storyVsChopSlider.value : 50) / 100.0,
      use_story_spine: true,
      sprocket_slip: Boolean(els.chkSprocketSlip && els.chkSprocketSlip.checked),
      typographic_flashes: Boolean(els.chkTypoFlashes && els.chkTypoFlashes.checked),
      step_print_12fps: Boolean(els.chkStepPrint12fps && els.chkStepPrint12fps.checked),
      subliminal_sigil_flash: Boolean(els.chkSubliminalSigil && els.chkSubliminalSigil.checked),
      obsidian_scrying_vignette: Boolean(els.chkObsidianScrying && els.chkObsidianScrying.checked),
      thelemic_dye_bloom: Boolean(els.chkThelemicBloom && els.chkThelemicBloom.checked),
      cosmic_static_glitch: Boolean(els.chkCosmicStatic && els.chkCosmicStatic.checked),
      geometric_echo_tunnel: Boolean(els.chkEchoTunnel && els.chkEchoTunnel.checked),
      fold_in_columns: Number(activePreset.fold_in_columns || 1),
      still_duration: getStillDefaultDuration(),
      exhaustion_mode: els.exhaustionModeSelect ? els.exhaustionModeSelect.value : 'loop_vary_motion',
    };
    const res = await api('/api/timeline/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    Studio.timeline = res.timeline;
    Studio.activeSlotIndex = -1;
    renderTimelineView();
    syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime || 0 : 0, true);
  } catch (err) {
    alert(`Timeline generation failed: ${err.message}`);
  } finally {
    if (btn) {
      btn.textContent = '⚡ Splice Edit';
      btn.disabled = false;
    }
  }
}

const btnGenerate = document.getElementById('btnGenerateEdit');
if (btnGenerate) btnGenerate.onclick = triggerGenerateTimeline;
if (els.transitionModeSelect) {
  els.transitionModeSelect.onchange = () => {
    if (Studio.audio && Studio.clips.length) triggerGenerateTimeline();
  };
}
if (els.exhaustionModeSelect) {
  els.exhaustionModeSelect.onchange = () => {
    if (Studio.audio && Studio.clips.length) triggerGenerateTimeline();
    else triggerWorkspaceAutoSave();
  };
}

const btnAddSec = document.getElementById('btnAddSection');
if (btnAddSec) {
  btnAddSec.onclick = () => {
    if (!Studio.audio) return;
    const secs = Studio.audio.sections || [];
    const lastEnd = secs.length ? secs[secs.length - 1].end : Studio.audio.duration;
    const start = Math.max(0, lastEnd - 4.0);
    secs.push({
      id: `sec_${Date.now()}`,
      type: 'drop',
      label: `DROP ${secs.length + 1}`,
      start: Number(start.toFixed(2)),
      end: Number(Studio.audio.duration.toFixed(2)),
      energy: 0.85,
      prompt: '',
    });
    renderSectionsSlotEditor();
  };
}

// Re-Analyze All Clips with Selected AI Provider
async function runBatchAiRetag() {
  if (!Studio.clips.length) {
    alert('Upload or load media first.');
    return;
  }
  const btn = document.getElementById('btnReanalyzeAll');
  if (btn) {
    btn.textContent = '⏳ Tagging...';
    btn.disabled = true;
  }
  try {
    const res = await api('/api/clips/reanalyze-all', { method: 'POST' });
    Studio.clips = res.clips;
    renderClipLibrary();
  } catch (err) {
    alert(`Re-analyze error: ${err.message}`);
  } finally {
    if (btn) {
      btn.textContent = '🔄 Re-Tag';
      btn.disabled = false;
    }
  }
}

const btnReanalyzeEl = document.getElementById('btnReanalyzeAll');
if (btnReanalyzeEl) btnReanalyzeEl.onclick = runBatchAiRetag;

// AI Provider Settings Modal (Universal OpenAI Schema + Presets)
function populateSettingsModal() {
  const s = Studio.settings || {};
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  const setChecked = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  };
  setVal('settingAiProvider', s.ai_provider || 'hybrid_auto');
  setVal('settingProviderPreset', s.provider_preset || 'ollama_v1');
  setVal('settingUniversalBaseUrl', s.universal_base_url || 'http://localhost:11434/v1');
  setVal('settingUniversalApiKey', s.universal_api_key || '');
  setVal('settingUniversalModel', s.universal_model || 'llava:latest');
  setVal('settingGeminiKey', s.gemini_api_key || '');
  setVal('settingGeminiModel', s.gemini_model || 'gemini-2.5-flash');
  setVal('settingClaudeKey', s.claude_api_key || '');
  setVal('settingClaudeModel', s.claude_model || 'claude-3-5-sonnet-latest');
  setChecked('settingAutoSplitScenes', s.auto_split_scenes);
}

const elSettingPreset = document.getElementById('settingProviderPreset');
if (elSettingPreset) {
  elSettingPreset.onchange = (e) => {
    const presetKey = e.target.value;
    const preset = Studio.providerPresets[presetKey];
    if (preset) {
      const uBase = document.getElementById('settingUniversalBaseUrl');
      if (uBase) uBase.value = preset.base_url;
      const uModel = document.getElementById('settingUniversalModel');
      if (uModel) uModel.value = preset.default_model;
      const aiProv = document.getElementById('settingAiProvider');
      if (aiProv) aiProv.value = 'openai_compat';
    }
  };
}

const btnDiscover = document.getElementById('btnDiscoverModels');
if (btnDiscover) {
  btnDiscover.onclick = async () => {
    const baseUrl = (document.getElementById('settingUniversalBaseUrl')?.value || '').trim();
    const apiKey = (document.getElementById('settingUniversalApiKey')?.value || '').trim();
    const statusEl = document.getElementById('discoverStatusMsg');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = `⏳ Probing ${baseUrl}...`;
    }

    try {
      const res = await api('/api/ai/discover-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl, api_key: apiKey }),
      });
      const dl = document.getElementById('discoveredModelsList');
      if (dl) dl.innerHTML = '';
      if (res.online && res.models.length) {
        if (dl) {
          res.models.forEach((m) => {
            const opt = document.createElement('option');
            opt.value = m;
            dl.appendChild(opt);
          });
        }
        const uModel = document.getElementById('settingUniversalModel');
        if (uModel) uModel.value = res.models[0];
        if (statusEl) {
          statusEl.style.color = 'var(--emerald)';
          statusEl.textContent = `✅ Connected! Found ${res.models.length} model(s): ${res.models.slice(0, 4).join(', ')}`;
        }
      } else if (res.online) {
        if (statusEl) {
          statusEl.style.color = 'var(--amber)';
          statusEl.textContent = '⚠️ Endpoint reachable, but returned an empty model list. Enter model name manually.';
        }
      } else {
        if (statusEl) {
          statusEl.style.color = 'var(--pink)';
          statusEl.textContent = `❌ Connection failed: ${res.error || 'Endpoint offline'}`;
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.style.color = 'var(--pink)';
        statusEl.textContent = `❌ Error: ${err.message}`;
      }
    }
  };
}

const btnOpenAi = document.getElementById('btnOpenAiSettings');
if (btnOpenAi) {
  btnOpenAi.onclick = () => {
    populateSettingsModal();
    const modal = document.getElementById('modalAiSettings');
    if (modal) modal.classList.add('open');
  };
}

const btnCloseAi = document.getElementById('btnCloseAiSettings');
if (btnCloseAi) {
  btnCloseAi.onclick = () => {
    const modal = document.getElementById('modalAiSettings');
    if (modal) modal.classList.remove('open');
  };
}

const btnSaveAi = document.getElementById('btnSaveAiSettings');
if (btnSaveAi) {
  btnSaveAi.onclick = async () => {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    const isChecked = (id) => {
      const el = document.getElementById(id);
      return el ? Boolean(el.checked) : false;
    };
    const payload = {
      ai_provider: getVal('settingAiProvider'),
      provider_preset: getVal('settingProviderPreset'),
      universal_base_url: getVal('settingUniversalBaseUrl'),
      universal_api_key: getVal('settingUniversalApiKey'),
      universal_model: getVal('settingUniversalModel'),
      gemini_api_key: getVal('settingGeminiKey'),
      gemini_model: getVal('settingGeminiModel'),
      claude_api_key: getVal('settingClaudeKey'),
      claude_model: getVal('settingClaudeModel'),
      auto_split_scenes: isChecked('settingAutoSplitScenes'),
    };
    const res = await api('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    Studio.settings = res.settings;
    const modal = document.getElementById('modalAiSettings');
    if (modal) modal.classList.remove('open');
  };
}

// Universal AI Engine & Bridge Modal
const btnOpenBridge = document.getElementById('btnOpenWebBridge');
if (btnOpenBridge) {
  btnOpenBridge.onclick = () => {
    const modal = document.getElementById('modalWebBridge');
    if (modal) modal.classList.add('open');
  };
}

const btnCloseBridge = document.getElementById('btnCloseWebBridge');
if (btnCloseBridge) {
  btnCloseBridge.onclick = () => {
    const modal = document.getElementById('modalWebBridge');
    if (modal) modal.classList.remove('open');
  };
}

const btnBridgeSettings = document.getElementById('btnBridgeToSettings');
if (btnBridgeSettings) {
  btnBridgeSettings.onclick = () => {
    const modalBridge = document.getElementById('modalWebBridge');
    if (modalBridge) modalBridge.classList.remove('open');
    populateSettingsModal();
    const modalAi = document.getElementById('modalAiSettings');
    if (modalAi) modalAi.classList.add('open');
  };
}

const btnBridgeDirect = document.getElementById('btnBridgeRunDirectAi');
if (btnBridgeDirect) {
  btnBridgeDirect.onclick = async () => {
    const modal = document.getElementById('modalWebBridge');
    if (modal) modal.classList.remove('open');
    await runBatchAiRetag();
  };
}

const btnBuildContact = document.getElementById('btnBuildContactSheet');
if (btnBuildContact) {
  btnBuildContact.onclick = async () => {
    try {
      const res = await api('/api/clips/contact-sheet', { method: 'POST' });
      const imgUrl = `${toAssetUrl(res.contact_sheet_url)}?t=${Date.now()}`;
      const img = document.getElementById('contactSheetImg');
      if (img) img.src = imgUrl;
      const wrap = document.getElementById('contactSheetPreviewWrap');
      if (wrap) wrap.style.display = 'block';
      const link = document.getElementById('linkOpenContactSheet');
      if (link) {
        link.href = imgUrl;
        link.style.display = 'inline-flex';
      }
      const promptTxt = document.getElementById('webBridgePromptText');
      if (promptTxt) promptTxt.value = res.prompt;
    } catch (err) {
      alert(err.message);
    }
  };
}

const btnCopyPrompt = document.getElementById('btnCopyWebPrompt');
if (btnCopyPrompt) {
  btnCopyPrompt.onclick = () => {
    const promptTxt = document.getElementById('webBridgePromptText');
    const txt = promptTxt ? promptTxt.value : '';
    if (!txt) {
      alert('Click "1. Generate Contact Sheet Image" first.');
      return;
    }
    navigator.clipboard.writeText(txt);
    alert('Universal Prompt copied! Drag or paste the Contact Sheet image + this prompt into ChatGPT, OpenRouter, Claude, Gemini, or your local WebUI.');
  };
}

const btnApplyTags = document.getElementById('btnApplyWebTags');
if (btnApplyTags) {
  btnApplyTags.onclick = async () => {
    const input = document.getElementById('webBridgeJsonInput');
    const raw = input ? input.value.trim() : '';
    if (!raw) {
      alert('Paste the JSON array response first.');
      return;
    }
    try {
      const res = await api('/api/clips/import-web-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_json: raw }),
      });
      Studio.clips = res.clips;
      renderClipLibrary();
      const modal = document.getElementById('modalWebBridge');
      if (modal) modal.classList.remove('open');
      alert(`Updated ${res.updated_count} media item(s) with AI tags!`);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };
}

function syncOpticalChipButtons(activeOptical) {
  const val = activeOptical || 'none';
  const sel = document.getElementById('inspectOpticalTreatment');
  if (sel) sel.value = val;
  document.querySelectorAll('#opticalQuickBtnGroup .optical-chip').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-optical') === val);
  });
}

async function applyLiveCutEventOverride(partialFields) {
  if (Studio.selectedCutIndex === null || !Studio.timeline || !Studio.timeline.events[Studio.selectedCutIndex]) {
    return;
  }
  try {
    const res = await api('/api/timeline/update-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_index: Studio.selectedCutIndex,
        ...partialFields,
      }),
    });
    Studio.timeline = res.timeline;
    Studio.activeSlotIndex = -1;
    renderTimelineView();
    syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
  } catch (err) {
    console.error('Update cut event failed:', err);
  }
}

// Clip Inspector & Manual Timeline Cut Swapper
function openClipInspector(clipId, timelineCutIdx = null) {
  const c = Studio.clips.find((x) => x.id === clipId);
  if (!c) return;
  Studio.inspectedClipId = clipId;
  if (timelineCutIdx !== null) {
    Studio.selectedCutIndex = timelineCutIdx;
  }

  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setText('inspectorTitle', timelineCutIdx !== null ? `Cut #${timelineCutIdx + 1} — Shot Overrides, Reverse & Optical Inspector` : `Media Inspector (${c.ai_provider_used || 'local_cv'})`);
  const imgEl = document.getElementById('inspectGridImg');
  if (imgEl) imgEl.src = `${toAssetUrl(c.grid_image || c.thumbnail)}?t=${Date.now()}`;
  setText('inspectFilename', c.filename);
  const mType = (c.media_type || 'video').toUpperCase();
  setText('inspectMetrics', `[${mType}] ${c.width}x${c.height} • ${c.duration}s • Motion Mode: ${c.camera_motion}`);
  setVal('inspectSeqOrder', c.sequence_order !== null && c.sequence_order !== undefined ? c.sequence_order : '');
  setVal('inspectMotionScore', c.motion_score ?? 0);
  setVal('inspectDesc', c.description || '');
  setVal('inspectVibeTags', (c.vibe_tags || []).join(', '));
  setVal('inspectLyricKeywords', (c.lyric_keywords || []).join(', '));
  setVal('inspectSections', (c.recommended_sections || []).join(', '));

  const assignBtn = document.getElementById('btnAssignToSelectedCut');
  const transWrap = document.getElementById('inspectTransitionWrap');
  const cutControlsBox = document.getElementById('inspectCutBlockControls');

  if (Studio.selectedCutIndex !== null && Studio.timeline && Studio.timeline.events[Studio.selectedCutIndex]) {
    const ev = Studio.timeline.events[Studio.selectedCutIndex];
    if (assignBtn) {
      assignBtn.style.display = 'inline-flex';
      assignBtn.textContent = `⇄ Apply Overrides & Media to Cut #${Studio.selectedCutIndex + 1}`;
    }
    if (transWrap) transWrap.style.display = 'flex';
    setVal('inspectCutTransition', ev.transition || 'hard_cut');

    if (cutControlsBox) {
      cutControlsBox.style.display = 'flex';
      const setChk = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
      };
      setChk('inspectPinBlock', ev.pinned);
      setChk('inspectReverseClip', ev.reverse);
      setChk('inspectPingPongClip', ev.ping_pong);
      setChk('inspectPrismMirror', ev.prism_mirror);
      syncOpticalChipButtons(ev.optical_treatment || 'none');
    }
  } else {
    if (assignBtn) assignBtn.style.display = 'none';
    if (transWrap) transWrap.style.display = 'none';
    if (cutControlsBox) cutControlsBox.style.display = 'none';
  }

  const modal = document.getElementById('modalClipInspector');
  if (modal) modal.classList.add('open');
}

// Instant live updates when toggling Pin, Reverse, Ping-Pong, Prism Mirror, or Optical Treatments in the Cut Inspector
['inspectPinBlock', 'inspectReverseClip', 'inspectPingPongClip', 'inspectPrismMirror', 'inspectCutTransition', 'inspectOpticalTreatment'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.onchange = () => {
    const optVal = document.getElementById('inspectOpticalTreatment')?.value || 'none';
    if (id === 'inspectOpticalTreatment') {
      if (optVal === 'prism_horizontal_mirror') {
        const pm = document.getElementById('inspectPrismMirror');
        if (pm) pm.checked = true;
      }
      syncOpticalChipButtons(optVal);
    }
    applyLiveCutEventOverride({
      pinned: Boolean(document.getElementById('inspectPinBlock')?.checked),
      reverse: Boolean(document.getElementById('inspectReverseClip')?.checked),
      ping_pong: Boolean(document.getElementById('inspectPingPongClip')?.checked),
      prism_mirror: Boolean(document.getElementById('inspectPrismMirror')?.checked),
      transition: document.getElementById('inspectCutTransition')?.value || 'hard_cut',
      optical_treatment: optVal,
    });
  };
});

document.querySelectorAll('#opticalQuickBtnGroup .optical-chip').forEach((btn) => {
  btn.onclick = () => {
    const optVal = btn.getAttribute('data-optical') || 'none';
    syncOpticalChipButtons(optVal);
    if (optVal === 'prism_horizontal_mirror') {
      const pm = document.getElementById('inspectPrismMirror');
      if (pm) pm.checked = true;
    }
    applyLiveCutEventOverride({
      optical_treatment: optVal,
      prism_mirror: Boolean(document.getElementById('inspectPrismMirror')?.checked),
    });
  };
});

const btnDeleteCutBlock = document.getElementById('btnDeleteCutBlock');
if (btnDeleteCutBlock) {
  btnDeleteCutBlock.onclick = async () => {
    if (Studio.selectedCutIndex === null) return;
    try {
      const res = await api('/api/timeline/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_index: Studio.selectedCutIndex }),
      });
      Studio.timeline = res.timeline;
      Studio.selectedCutIndex = null;
      Studio.activeSlotIndex = -1;
      renderTimelineView();
      const modal = document.getElementById('modalClipInspector');
      if (modal) modal.classList.remove('open');
    } catch (err) {
      alert(`Delete cut block failed: ${err.message}`);
    }
  };
}

const btnCloseInsp = document.getElementById('btnCloseInspector');
if (btnCloseInsp) {
  btnCloseInsp.onclick = () => {
    const modal = document.getElementById('modalClipInspector');
    if (modal) modal.classList.remove('open');
  };
}

const btnSaveMeta = document.getElementById('btnSaveClipMeta');
if (btnSaveMeta) {
  btnSaveMeta.onclick = async () => {
    if (!Studio.inspectedClipId) return;
    const seqRaw = (document.getElementById('inspectSeqOrder')?.value || '').trim();
    const payload = {
      sequence_order: seqRaw === '' ? 0 : Number(seqRaw),
      motion_score: Number(document.getElementById('inspectMotionScore')?.value || 0),
      description: (document.getElementById('inspectDesc')?.value || '').trim(),
      vibe_tags: (document.getElementById('inspectVibeTags')?.value || '').split(','),
      lyric_keywords: (document.getElementById('inspectLyricKeywords')?.value || '').split(','),
      recommended_sections: (document.getElementById('inspectSections')?.value || '').split(','),
    };
    const res = await api(`/api/clips/${Studio.inspectedClipId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const idx = Studio.clips.findIndex((x) => x.id === Studio.inspectedClipId);
    if (idx !== -1) Studio.clips[idx] = res.clip;
    renderClipLibrary();
    const modal = document.getElementById('modalClipInspector');
    if (modal) modal.classList.remove('open');
  };
}

const btnAssignCut = document.getElementById('btnAssignToSelectedCut');
if (btnAssignCut) {
  btnAssignCut.onclick = async () => {
    if (Studio.selectedCutIndex === null || !Studio.inspectedClipId) return;
    const res = await api('/api/timeline/swap-clip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_index: Studio.selectedCutIndex,
        new_clip_id: Studio.inspectedClipId,
        transition: document.getElementById('inspectCutTransition')?.value || 'hard_cut',
        pinned: Boolean(document.getElementById('inspectPinBlock')?.checked),
        reverse: Boolean(document.getElementById('inspectReverseClip')?.checked),
        ping_pong: Boolean(document.getElementById('inspectPingPongClip')?.checked),
        prism_mirror: Boolean(document.getElementById('inspectPrismMirror')?.checked),
        optical_treatment: document.getElementById('inspectOpticalTreatment')?.value || 'none',
      }),
    });
    Studio.timeline = res.timeline;
    Studio.activeSlotIndex = -1;
    renderTimelineView();
    const modal = document.getElementById('modalClipInspector');
    if (modal) modal.classList.remove('open');
  };
}

const btnDelClip = document.getElementById('btnDeleteClip');
if (btnDelClip) {
  btnDelClip.onclick = async () => {
    if (!Studio.inspectedClipId) return;
    const res = await api(`/api/clips/${Studio.inspectedClipId}`, { method: 'DELETE' });
    Studio.clips = res.clips;
    renderClipLibrary();
    const modal = document.getElementById('modalClipInspector');
    if (modal) modal.classList.remove('open');
  };
}

// Native Tauri Desktop Environment & FFmpeg Sidecar Helpers
function isTauriEnvironment() {
  return typeof window !== 'undefined' && Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);
}

async function checkTauriFfmpegSidecar() {
  if (!isTauriEnvironment()) return null;
  const shell = window.__TAURI__?.shell || window.__TAURI_PLUGIN_SHELL__;
  if (!shell?.Command?.sidecar) return null;
  try {
    const cmd = shell.Command.sidecar('binaries/ffmpeg', ['-version']);
    const output = await cmd.execute();
    return output.stdout ? output.stdout.split('\n')[0] : 'FFmpeg sidecar active';
  } catch (err) {
    console.warn('Tauri FFmpeg sidecar handshake check:', err);
    return null;
  }
}

// Export Quality Profiles State & Modal Controller
const exportModalState = {
  profile: 'master', // 'draft' or 'master'
  format: 'mp4',     // 'mp4' or 'webm'
  outputDestination: '',
};

function updateExportFlagsDisplay() {
  const codeEl = document.getElementById('exportFlagsCode');
  if (!codeEl) return;
  if (exportModalState.profile === 'draft') {
    if (exportModalState.format === 'webm') {
      codeEl.textContent = '-c:v libvpx-vp9 -b:v 1M -speed 5 -pix_fmt yuv420p -c:a libopus -b:a 96k';
    } else {
      codeEl.textContent = '-c:v libx264 -preset ultrafast -crf 30 -pix_fmt yuv420p -c:a aac -b:a 128k';
    }
  } else {
    codeEl.textContent = '-c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -c:a aac -b:a 320k';
  }
}

function updateExportFilenameAndPaths() {
  const songStem = (Studio.projectName && Studio.projectName !== 'Untitled Project')
    ? Studio.projectName.replace(/[^a-zA-Z0-9_\-]/g, '_')
    : ((Studio.audio && Studio.audio.filename)
        ? Studio.audio.filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_')
        : 'strangelet_splicer');
  const ext = (exportModalState.profile === 'draft' && exportModalState.format === 'webm') ? '.webm' : '.mp4';
  const profileTag = exportModalState.profile === 'draft' ? 'lightning_draft' : 'master_archive';
  const defaultName = `${songStem}_${profileTag}${ext}`;

  const nameInput = document.getElementById('exportFilenameInput');
  if (nameInput) {
    if (!nameInput.value || nameInput.value.endsWith('.mp4') || nameInput.value.endsWith('.webm')) {
      nameInput.value = defaultName;
    }
  }
  const pathText = document.getElementById('exportResolvedPathText');
  if (pathText) {
    if (exportModalState.outputDestination) {
      pathText.textContent = exportModalState.outputDestination;
    } else {
      pathText.textContent = `D:\\mv-auto-e\\workspace\\exports\\${nameInput ? nameInput.value : defaultName}`;
    }
  }
}

function setExportProfile(profile) {
  exportModalState.profile = profile;
  const cardDraft = document.getElementById('profileCardDraft');
  const cardMaster = document.getElementById('profileCardMaster');
  const formatSelect = document.getElementById('exportContainerFormat');
  const optWebm = document.getElementById('optContainerWebm');

  if (profile === 'draft') {
    if (cardDraft) cardDraft.classList.add('active');
    if (cardMaster) cardMaster.classList.remove('active');
    if (optWebm) optWebm.disabled = false;
  } else {
    if (cardMaster) cardMaster.classList.add('active');
    if (cardDraft) cardDraft.classList.remove('active');
    if (optWebm) optWebm.disabled = true;
    exportModalState.format = 'mp4';
    if (formatSelect) formatSelect.value = 'mp4';
  }

  updateExportFlagsDisplay();
  updateExportFilenameAndPaths();
}

function openExportOptionsModal(requestedProfile = null) {
  if (!Studio.timeline || !Studio.timeline.events || !Studio.timeline.events.length) {
    alert('Build or assemble cuts on the timeline before rendering.');
    return;
  }
  const modal = document.getElementById('modalExportOptions');
  if (!modal) return;

  if (requestedProfile === 'draft' || requestedProfile === 'lightning_draft') {
    exportModalState.profile = 'draft';
  } else if (requestedProfile === 'master' || requestedProfile === 'master_archive') {
    exportModalState.profile = 'master';
  }

  const chkBurn = document.getElementById('exportBurnLyrics');
  if (chkBurn) {
    chkBurn.checked = isLyricsRenderEnabled();
  }

  const progWrap = document.getElementById('modalRenderProgressWrap');
  if (progWrap) progWrap.style.display = 'none';
  const dlBtn = document.getElementById('modalDownloadBtn');
  if (dlBtn) dlBtn.style.display = 'none';
  const startBtn = document.getElementById('btnStartExport');
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = '🎬 START RENDER';
  }

  const platBadge = document.getElementById('exportPlatformBadge');
  if (platBadge) {
    platBadge.textContent = isTauriEnvironment() ? '⚡ Tauri Desktop (Native FFmpeg Sidecar)' : '🌐 Web Browser (Local Server)';
  }

  const mainRes = document.getElementById('export-resolution');
  const modalRes = document.getElementById('exportResolution');
  if (mainRes && modalRes) {
    const val = mainRes.value;
    if (val === '1080p') modalRes.value = '1920x1080';
    else if (val === '4k') modalRes.value = '3840x2160';
    else if (val === 'vertical') modalRes.value = '1080x1920';
    else if (val === 'square') modalRes.value = '1080x1080';
  }

  setExportProfile(exportModalState.profile || 'master');
  modal.classList.add('open');
}

function closeExportOptionsModal() {
  const modal = document.getElementById('modalExportOptions');
  if (modal) modal.classList.remove('open');
}

async function handleBrowseSaveLocation() {
  const ext = (exportModalState.profile === 'draft' && exportModalState.format === 'webm') ? 'webm' : 'mp4';
  const nameInput = document.getElementById('exportFilenameInput');
  const currentFilename = nameInput ? nameInput.value : `strangelet_${exportModalState.profile}.${ext}`;

  // 1. Try native Tauri Dialog plugin
  if (isTauriEnvironment()) {
    const dialog = window.__TAURI__?.dialog || window.__TAURI_PLUGIN_DIALOG__;
    if (dialog && typeof dialog.save === 'function') {
      try {
        const picked = await dialog.save({
          defaultPath: currentFilename,
          filters: [
            { name: `${ext.toUpperCase()} Video`, extensions: [ext] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });
        if (picked) {
          exportModalState.outputDestination = picked;
          const fileName = picked.split(/[\\/]/).pop();
          if (nameInput) nameInput.value = fileName;
          const pathText = document.getElementById('exportResolvedPathText');
          if (pathText) pathText.textContent = picked;
          return;
        }
      } catch (err) {
        console.warn('Tauri dialog save error:', err);
      }
    }
  }

  // 2. Native Windows SaveFileDialog via Backend
  try {
    const res = await api('/api/dialog/pick-save-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        default_filename: currentFilename,
        filter_ext: ext,
        title: 'Choose Export Destination',
      }),
    });
    if (res && res.selected_path) {
      exportModalState.outputDestination = res.selected_path;
      const fileName = res.selected_path.split(/[\\/]/).pop();
      if (nameInput) nameInput.value = fileName;
      const pathText = document.getElementById('exportResolvedPathText');
      if (pathText) pathText.textContent = res.selected_path;
    }
  } catch (err) {
    console.warn('Backend dialog error:', err);
  }
}

async function executeExportRender() {
  const startBtn = document.getElementById('btnStartExport');
  const progWrap = document.getElementById('modalRenderProgressWrap');
  const progBar = document.getElementById('modalRenderProgressBar');
  const statText = document.getElementById('modalRenderStatusText');
  const etaText = document.getElementById('modalRenderEtaText');
  const dlBtn = document.getElementById('modalDownloadBtn');

  const bottomWrap = document.getElementById('renderStatusWrap');
  const bottomTxt = document.getElementById('renderStatusText');
  const bottomBar = document.getElementById('renderProgressBar');
  const bottomDlBtn = document.getElementById('downloadRenderBtn');

  if (startBtn) startBtn.disabled = true;
  if (progWrap) progWrap.style.display = 'flex';
  if (bottomWrap) bottomWrap.style.display = 'flex';
  if (dlBtn) dlBtn.style.display = 'none';
  if (bottomDlBtn) bottomDlBtn.style.display = 'none';

  if (progBar) progBar.style.width = '2%';
  if (bottomBar) bottomBar.style.width = '2%';

  const resSelect = document.getElementById('exportResolution') || document.getElementById('export-resolution');
  let targetWidth = 1920;
  let targetHeight = 1080;
  if (resSelect) {
    const val = resSelect.value;
    if (val === '4k' || val === '3840x2160') {
      targetWidth = 3840; targetHeight = 2160;
    } else if (val === 'vertical' || val === '1080x1920') {
      targetWidth = 1080; targetHeight = 1920;
    } else if (val === 'square' || val === '1080x1080') {
      targetWidth = 1080; targetHeight = 1080;
    } else if (val === '1080p' || val === '1920x1080') {
      targetWidth = 1920; targetHeight = 1080;
    } else if (val.includes('x')) {
      const [wStr, hStr] = val.split('x');
      targetWidth = parseInt(wStr, 10) || 1920;
      targetHeight = parseInt(hStr, 10) || 1080;
    }
  }

  const fpsSelect = document.getElementById('exportFramerate');
  const targetFps = parseInt(fpsSelect ? fpsSelect.value : '30', 10) || 30;

  const chkBurn = document.getElementById('exportBurnLyrics');
  const burnLyrics = chkBurn ? chkBurn.checked : isLyricsRenderEnabled();

  const nameInput = document.getElementById('exportFilenameInput');
  const customName = nameInput ? nameInput.value.trim() : '';

  const inTauri = isTauriEnvironment();
  const initMsg = inTauri
    ? `⚡ [Tauri FFmpeg] Initializing ${exportModalState.profile === 'draft' ? 'Lightning Draft' : 'Master Archive'} render...`
    : `Starting ${exportModalState.profile === 'draft' ? 'Lightning Draft' : 'Master Archive'} render...`;

  if (statText) statText.textContent = initMsg;
  if (bottomTxt) bottomTxt.textContent = initMsg;
  if (etaText) etaText.textContent = 'ETA: Calculating...';

  try {
    const payload = {
      width: targetWidth,
      height: targetHeight,
      fps: targetFps,
      include_lyrics: burnLyrics,
      profile: exportModalState.profile,
      format: exportModalState.format,
      custom_filename: customName || null,
      output_destination: exportModalState.outputDestination || null,
      is_tauri: inTauri,
    };

    const res = await api('/api/render/mp4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const jobId = res.job_id;
    const poll = setInterval(async () => {
      try {
        const st = await api(`/api/render/status/${jobId}`);
        const pct = Math.min(100, Math.max(0, st.progress || 0));

        if (progBar) progBar.style.width = `${pct}%`;
        if (bottomBar) bottomBar.style.width = `${pct}%`;

        const etaFormatted = st.eta_formatted ? `ETA: ${st.eta_formatted}` : '';
        const fpsFormatted = st.fps_speed ? `(${st.fps_speed} fps)` : '';

        if (etaText) {
          etaText.textContent = st.status === 'completed' ? 'Done' : `${etaFormatted} ${fpsFormatted}`.trim();
        }
        if (statText) {
          statText.textContent = st.message || `Rendering (${pct}%)...`;
        }
        if (bottomTxt) {
          bottomTxt.textContent = `${st.message || 'Rendering...'} ${etaFormatted}`;
        }

        if (st.status === 'completed') {
          clearInterval(poll);
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '✅ RENDER FINISHED';
          }
          if (dlBtn) {
            dlBtn.href = st.output_url;
            dlBtn.download = st.filename || 'strangelet_splicer.mp4';
            dlBtn.style.display = 'inline-flex';
          }
          if (bottomDlBtn) {
            bottomDlBtn.href = st.output_url;
            bottomDlBtn.download = st.filename || 'strangelet_splicer.mp4';
            bottomDlBtn.style.display = 'inline-flex';
          }
          if (etaText) etaText.textContent = `Completed in ${st.elapsed_seconds || 0}s`;
        } else if (st.status === 'failed') {
          clearInterval(poll);
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '🎬 RETRY RENDER';
          }
          alert(`Render failed: ${st.message}`);
        }
      } catch (pollErr) {
        clearInterval(poll);
        if (startBtn) startBtn.disabled = false;
      }
    }, 700);
  } catch (err) {
    if (startBtn) startBtn.disabled = false;
    alert(`Render start failed: ${err.message}`);
  }
}

// Wire up Export Options Modal controls
const btnRenderMp4El = document.getElementById('btnRenderMp4');
if (btnRenderMp4El) btnRenderMp4El.onclick = openExportOptionsModal;
const btnCloseExport = document.getElementById('btnCloseExportOptions');
if (btnCloseExport) btnCloseExport.onclick = closeExportOptionsModal;
const btnCancelExport = document.getElementById('btnCancelExport');
if (btnCancelExport) btnCancelExport.onclick = closeExportOptionsModal;

const cardDraftEl = document.getElementById('profileCardDraft');
if (cardDraftEl) cardDraftEl.onclick = () => setExportProfile('draft');
const cardMasterEl = document.getElementById('profileCardMaster');
if (cardMasterEl) cardMasterEl.onclick = () => setExportProfile('master');

const formatSelectEl = document.getElementById('exportContainerFormat');
if (formatSelectEl) {
  formatSelectEl.onchange = (e) => {
    exportModalState.format = e.target.value;
    updateExportFlagsDisplay();
    updateExportFilenameAndPaths();
  };
}

const btnBrowsePathEl = document.getElementById('btnBrowseExportPath');
if (btnBrowsePathEl) btnBrowsePathEl.onclick = handleBrowseSaveLocation;

const btnStartExportEl = document.getElementById('btnStartExport');
if (btnStartExportEl) btnStartExportEl.onclick = executeExportRender;

// Export Premiere / DaVinci Resolve XML & EDL
const btnExportNleEl = document.getElementById('btnExportNle');
if (btnExportNleEl) {
  btnExportNleEl.onclick = async () => {
    if (!Studio.timeline) {
      alert('Build a timeline first.');
      return;
    }
    try {
      const res = await api('/api/export/nle', { method: 'POST' });
      window.open(res.xml_url, '_blank');
      alert(`Exported Premiere/Resolve XML & EDL to D:\\mv-auto-e\\workspace\\exports:\n• ${res.xml_filename}\n• ${res.edl_filename}`);
    } catch (err) {
      alert(`NLE Export failed: ${err.message}`);
    }
  };
}

// Built-in Field Manual & Operator's Guide Controller
function openManualModal() {
  const modal = document.getElementById('manualModal');
  if (!modal) return;
  modal.classList.add('open');

  const searchInput = document.getElementById('manualSearchInput');
  if (searchInput) {
    searchInput.value = '';
    filterManualTopics('');
    setTimeout(() => searchInput.focus(), 80);
  }

  // Ensure first tab is highlighted
  const navItems = document.querySelectorAll('.manual-nav-item');
  navItems.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === 0);
  });
  const firstSec = document.getElementById('sec-modes') || document.getElementById('sec-quickstart');
  if (firstSec) {
    firstSec.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
}

function closeManualModal() {
  const modal = document.getElementById('manualModal');
  if (modal) modal.classList.remove('open');
}

function filterManualTopics(query) {
  const q = (query || '').toLowerCase().trim();
  const sections = document.querySelectorAll('.manual-section');
  const navItems = document.querySelectorAll('.manual-nav-item');

  sections.forEach((sec) => {
    if (!q) {
      sec.style.display = 'flex';
    } else {
      const text = sec.textContent.toLowerCase();
      const match = text.includes(q);
      sec.style.display = match ? 'flex' : 'none';
    }
  });

  navItems.forEach((btn) => {
    const targetId = btn.getAttribute('data-target');
    const sec = document.getElementById(targetId);
    if (!q) {
      btn.style.display = 'flex';
      btn.style.opacity = '1';
    } else {
      const match = sec && sec.style.display !== 'none';
      btn.style.display = match ? 'flex' : 'none';
    }
  });
}

// Wire up Field Manual navigation
document.querySelectorAll('.manual-nav-item').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.manual-nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
});

// Search input listener
const manualSearchInput = document.getElementById('manualSearchInput');
if (manualSearchInput) {
  manualSearchInput.addEventListener('input', (e) => {
    filterManualTopics(e.target.value);
  });
}

// Open/Close buttons
const btnOpenManual = document.getElementById('btnOpenManual') || document.getElementById('field-manual-btn');
if (btnOpenManual) btnOpenManual.onclick = openManualModal;
const fieldManualBtn = document.getElementById('field-manual-btn');
if (fieldManualBtn) fieldManualBtn.onclick = openManualModal;

const btnCloseManual = document.getElementById('btnCloseManual');
if (btnCloseManual) btnCloseManual.onclick = closeManualModal;

const btnCloseManualBottom = document.getElementById('btnCloseManualBottom');
if (btnCloseManualBottom) btnCloseManualBottom.onclick = closeManualModal;

/* =========================================================================
   FULLSCREEN VIEWPORT MODE (F11 / F / Double-Click / Transport Button)
   ========================================================================= */
const canvasViewport = document.getElementById('canvasViewport');
const btnFullscreen = document.getElementById('btnFullscreen');
let cursorHideTimer = null;

function isCanvasFullscreen() {
  return document.fullscreenElement === canvasViewport ||
         document.webkitFullscreenElement === canvasViewport;
}

async function toggleCanvasFullscreen() {
  if (!canvasViewport) return;
  try {
    if (!isCanvasFullscreen()) {
      if (canvasViewport.requestFullscreen) {
        await canvasViewport.requestFullscreen();
      } else if (canvasViewport.webkitRequestFullscreen) {
        await canvasViewport.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    }
  } catch (err) {
    console.warn('Fullscreen toggle failed:', err);
  }
}

function handleFullscreenChange() {
  const inFs = isCanvasFullscreen();
  if (btnFullscreen) {
    btnFullscreen.textContent = inFs ? '🗗' : '⛶';
    btnFullscreen.title = inFs ? 'Exit Fullscreen (Esc / F11 / F)' : 'Toggle Fullscreen Viewport (F11 / F / Double-Click)';
  }
  if (!inFs) {
    if (cursorHideTimer) {
      clearTimeout(cursorHideTimer);
      cursorHideTimer = null;
    }
    if (canvasViewport) {
      canvasViewport.classList.remove('hide-cursor');
    }
  }
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

if (btnFullscreen) {
  btnFullscreen.onclick = toggleCanvasFullscreen;
}

if (canvasViewport) {
  canvasViewport.addEventListener('dblclick', (e) => {
    if (e.target === canvasViewport || e.target === els.previewCanvas) {
      e.preventDefault();
      toggleCanvasFullscreen();
    }
  });

  canvasViewport.addEventListener('mousemove', () => {
    if (!isCanvasFullscreen()) return;
    canvasViewport.classList.remove('hide-cursor');
    if (cursorHideTimer) clearTimeout(cursorHideTimer);
    cursorHideTimer = setTimeout(() => {
      if (isCanvasFullscreen()) {
        canvasViewport.classList.add('hide-cursor');
      }
    }, 2000);
  });
}

/* =========================================================================
   ABOUT STRANGELET SPLICER MODAL
   ========================================================================= */
const modalAbout = document.getElementById('modalAbout');
const btnCloseAbout = document.getElementById('btnCloseAbout');
const btnOkAbout = document.getElementById('btnOkAbout');

function openAboutModal() {
  closeAllDesktopMenus();
  if (modalAbout) modalAbout.style.display = 'flex';
}

function closeAboutModal() {
  if (modalAbout) modalAbout.style.display = 'none';
}

if (btnCloseAbout) btnCloseAbout.onclick = closeAboutModal;
if (btnOkAbout) btnOkAbout.onclick = closeAboutModal;
if (modalAbout) {
  modalAbout.onclick = (e) => {
    if (e.target === modalAbout) closeAboutModal();
  };
}

/* =========================================================================
   WEB AUDIO ENGINE & 16-BIT PCM WAV ENCODER (NON-DESTRUCTIVE SLICE EDITS)
   ========================================================================= */
function writeWavHeaderString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteCount = numSamples * blockAlign;
  const totalByteLength = 44 + dataByteCount;

  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  // Write RIFF header
  writeWavHeaderString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount, true);
  writeWavHeaderString(view, 8, 'WAVE');
  writeWavHeaderString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeWavHeaderString(view, 36, 'data');
  view.setUint32(40, dataByteCount, true);

  // Write interleaved 16-bit PCM samples
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

const AudioEngine = {
  ctx: null,
  rawBuffer: null,
  processedBuffer: null,
  activeBlobUrl: null,

  async getContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },

  async loadAudioFromUrl(url) {
    if (!url) return null;
    try {
      const actx = await this.getContext();
      const res = await fetch(toAssetUrl(url));
      const arrayBuf = await res.arrayBuffer();
      this.rawBuffer = await actx.decodeAudioData(arrayBuf);
      Studio.rawAudioBuffer = this.rawBuffer;
      return this.rawBuffer;
    } catch (err) {
      console.warn('AudioEngine decode error:', err);
      return null;
    }
  },

  rebuildProcessedBuffer() {
    if (!this.rawBuffer) return null;
    const actx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
    const numChannels = this.rawBuffer.numberOfChannels;
    const sampleRate = this.rawBuffer.sampleRate;
    const length = this.rawBuffer.length;

    const outBuffer = actx.createBuffer(numChannels, length, sampleRate);
    const sliceEdits = (Studio.audio && Studio.audio.sliceEdits) || [];

    for (let ch = 0; ch < numChannels; ch++) {
      const orig = this.rawBuffer.getChannelData(ch);
      const out = outBuffer.getChannelData(ch);
      out.set(orig);

      for (const edit of sliceEdits) {
        const sSample = Math.max(0, Math.floor(edit.start * sampleRate));
        const eSample = Math.min(length, Math.floor(edit.end * sampleRate));
        const len = eSample - sSample;
        if (len <= 0) continue;

        if (edit.action === 'reverse') {
          // Clone Float32Array channel buffer for that slice and reverse
          const slice = orig.slice(sSample, eSample);
          slice.reverse();
          out.set(slice, sSample);
        } else if (edit.action === 'chop') {
          // Subdivide the beat slice into 4 rhythmic repeats
          const subLen = Math.floor(len / 4);
          if (subLen > 0) {
            const sub = orig.slice(sSample, sSample + subLen);
            for (let rep = 0; rep < 4; rep++) {
              out.set(sub, sSample + rep * subLen);
            }
          }
        } else if (edit.action === 'halftime') {
          // Half-speed tape stop / 0.5x stretch: sample at half rate
          for (let i = 0; i < len; i++) {
            const srcIdx = sSample + Math.floor(i * 0.5);
            out[sSample + i] = orig[srcIdx];
          }
        } else if (edit.action === 'mute') {
          // Drop gain to 0.0
          for (let i = sSample; i < eSample; i++) {
            out[i] = 0;
          }
        }
      }
    }

    this.processedBuffer = outBuffer;
    Studio.processedAudioBuffer = outBuffer;
    return outBuffer;
  },

  async applyToMainAudio() {
    if (!this.rawBuffer && Studio.audio && Studio.audio.audio_url) {
      await this.loadAudioFromUrl(Studio.audio.audio_url);
    }
    const buf = this.rebuildProcessedBuffer();
    if (!buf) return;
    const wavBlob = audioBufferToWavBlob(buf);
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
    }
    this.activeBlobUrl = URL.createObjectURL(wavBlob);
    const currTime = els.mainAudio ? els.mainAudio.currentTime || 0 : 0;
    const wasPlaying = Studio.isPlaying;

    if (els.mainAudio) {
      els.mainAudio.src = this.activeBlobUrl;
      els.mainAudio.currentTime = currTime;
      if (wasPlaying) {
        els.mainAudio.play().catch(() => {});
      }
    }
  },

  reset() {
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
      this.activeBlobUrl = null;
    }
    this.rawBuffer = null;
    this.processedBuffer = null;
    if (this.ctx && this.ctx.state !== 'closed') {
      try { this.ctx.close(); } catch (_) {}
      this.ctx = null;
    }
  }
};

function getAudioSliceAtTime(clickSec) {
  if (!Studio.audio) return { start: 0, end: 1, isExisting: false };

  // Check if click falls within an existing slice edit
  const existing = (Studio.audio.sliceEdits || []).find(e => clickSec >= e.start && clickSec <= e.end);
  if (existing) {
    return { ...existing, isExisting: true };
  }

  // Calculate rhythmic slice aligned to beats or downbeats
  const beats = Studio.audio.beats || [];
  if (beats.length > 1) {
    let bIdx = beats.findIndex(b => b > clickSec);
    if (bIdx <= 0) bIdx = 1;
    const start = beats[bIdx - 1];
    const end = beats[bIdx] || (start + 0.5);
    return { start: Number(start.toFixed(3)), end: Number(end.toFixed(3)), isExisting: false };
  }

  // Fallback to 1-second interval
  const s = Math.max(0, Math.floor(clickSec * 2) / 2);
  const dur = (Studio.audio && Studio.audio.duration) || 10.0;
  return { start: s, end: Math.min(dur, s + 1.0), isExisting: false };
}

/* =========================================================================
   TIMELINE CLIPBOARD ENGINE & ACTIONS (Copy, Cut, Paste)
   ========================================================================= */
let timelineClipboard = null; // { type: 'video' | 'audio', blockData: { ... } }

function updateClipboardUIState() {
  const hasData = Boolean(timelineClipboard && timelineClipboard.blockData);
  const pasteItems = document.querySelectorAll('#ctx-paste-btn, #ctx-canvas-paste-btn, [data-action="paste"]');
  pasteItems.forEach((btn) => {
    if (hasData) {
      btn.classList.remove('disabled');
      btn.removeAttribute('aria-disabled');
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      btn.title = `Paste "${timelineClipboard.blockData.clip_filename || 'Block'}" at cursor (Ctrl+V)`;
    } else {
      btn.classList.add('disabled');
      btn.setAttribute('aria-disabled', 'true');
      btn.style.opacity = '0.38';
      btn.style.pointerEvents = 'none';
      btn.title = 'Clipboard is empty (Copy a block first with Ctrl+C)';
    }
  });

  const editPasteEntry = document.getElementById('menuActionPasteBlock');
  if (editPasteEntry) {
    if (hasData) {
      editPasteEntry.classList.remove('disabled');
      editPasteEntry.style.opacity = '1';
      editPasteEntry.style.pointerEvents = 'auto';
    } else {
      editPasteEntry.classList.add('disabled');
      editPasteEntry.style.opacity = '0.38';
      editPasteEntry.style.pointerEvents = 'none';
    }
  }
}

function copyTimelineBlock(blockIdOrIdx) {
  if (!Studio.timeline || !Studio.timeline.events || !Studio.timeline.events.length) {
    return null;
  }
  let targetIdx = -1;
  if (typeof blockIdOrIdx === 'number' && blockIdOrIdx >= 0 && blockIdOrIdx < Studio.timeline.events.length) {
    targetIdx = blockIdOrIdx;
  } else if (typeof blockIdOrIdx === 'string') {
    targetIdx = Studio.timeline.events.findIndex((e) => e.clip_id === blockIdOrIdx || e.id === blockIdOrIdx);
  }
  if (targetIdx === -1 && Studio.selectedCutIndex !== null && Studio.selectedCutIndex >= 0 && Studio.selectedCutIndex < Studio.timeline.events.length) {
    targetIdx = Studio.selectedCutIndex;
  }
  if (targetIdx === -1) {
    const currT = els.mainAudio ? els.mainAudio.currentTime || 0 : 0;
    targetIdx = Studio.timeline.events.findIndex((e) => e.start <= currT && currT < e.end);
  }
  if (targetIdx === -1) {
    targetIdx = 0;
  }

  const ev = Studio.timeline.events[targetIdx];
  if (!ev) return null;

  timelineClipboard = {
    type: ev.media_type === 'image' ? 'image' : 'video',
    blockData: {
      clip_id: ev.clip_id,
      clip_filename: ev.clip_filename,
      media_type: ev.media_type || 'video',
      clip_thumbnail: ev.clip_thumbnail,
      clip_url: ev.clip_url,
      clip_duration: ev.clip_duration,
      duration: ev.duration,
      in_point: ev.in_point !== undefined ? ev.in_point : 0,
      out_point: ev.out_point !== undefined ? ev.out_point : ev.duration,
      startOffset: ev.in_point !== undefined ? ev.in_point : 0,
      playbackRate: ev.speed !== undefined ? ev.speed : 1.0,
      speed: ev.speed !== undefined ? ev.speed : 1.0,
      reversed: Boolean(ev.reverse),
      reverse: Boolean(ev.reverse),
      ping_pong: Boolean(ev.ping_pong),
      appliedFX: {
        style_fx: ev.style_fx || 'clean',
        vhs_glitch: Boolean(ev.vhs_glitch),
        strobe: Boolean(ev.strobe),
        optical_treatment: ev.optical_treatment || 'none',
        prism_mirror: Boolean(ev.prism_mirror),
        fx: ev.fx ? JSON.parse(JSON.stringify(ev.fx)) : {},
      },
      style_fx: ev.style_fx || 'clean',
      vhs_glitch: Boolean(ev.vhs_glitch),
      strobe: Boolean(ev.strobe),
      optical_treatment: ev.optical_treatment || 'none',
      prism_mirror: Boolean(ev.prism_mirror),
      kenBurnsParams: ev.ken_burns || (ev.media_type === 'image' ? 'zoom_in_pan_right' : null),
      ken_burns: ev.ken_burns || (ev.media_type === 'image' ? 'zoom_in_pan_right' : null),
      pinned: Boolean(ev.pinned),
      transition: ev.transition || 'hard_cut',
      role: ev.role || 'manual_block',
      target_energy: ev.target_energy,
      clip_energy: ev.clip_energy,
      vibe_tags: ev.vibe_tags ? [...ev.vibe_tags] : [],
      typo_phrase: ev.typo_phrase,
    },
  };

  Studio.selectedCutIndex = targetIdx;
  renderTimelineView();
  updateClipboardUIState();
  return timelineClipboard;
}

async function cutTimelineBlock(blockIdOrIdx) {
  const copied = copyTimelineBlock(blockIdOrIdx);
  if (!copied) return null;
  const idx = Studio.selectedCutIndex;
  if (idx === null || idx < 0 || !Studio.timeline || !Studio.timeline.events || idx >= Studio.timeline.events.length) {
    return null;
  }
  try {
    const res = await api('/api/timeline/delete-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_index: idx }),
    });
    Studio.timeline = res.timeline;
    Studio.selectedCutIndex = null;
    Studio.activeSlotIndex = -1;
    renderTimelineView();
    syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime || 0 : 0, true);
    triggerWorkspaceAutoSave();
    updateClipboardUIState();
    return copied;
  } catch (err) {
    alert(`Cut block failed: ${err.message}`);
    return null;
  }
}

async function pasteTimelineBlock(targetTime) {
  if (!timelineClipboard || !timelineClipboard.blockData) {
    console.warn('Paste: timelineClipboard is empty');
    return null;
  }
  const time = (targetTime !== undefined && targetTime !== null && !isNaN(targetTime))
    ? Number(targetTime)
    : (els.mainAudio ? Number(els.mainAudio.currentTime || 0) : 0);

  try {
    const res = await api('/api/timeline/paste-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        block_data: timelineClipboard.blockData,
        target_time: time,
      }),
    });
    Studio.timeline = res.timeline;
    Studio.selectedCutIndex = res.pasted_index !== undefined ? res.pasted_index : null;
    renderTimelineView();
    syncVideoDecodersToTime(time, true);
    triggerWorkspaceAutoSave();
    return Studio.timeline.events[Studio.selectedCutIndex];
  } catch (err) {
    alert(`Paste failed: ${err.message}`);
    return null;
  }
}

/* =========================================================================
   RIGHT-CLICK CONTEXT MENU CONTROLLER (Timeline Blocks & Audio Waveform)
   ========================================================================= */
const ctxMenuState = {
  activeType: null, // 'video' | 'audio' | 'canvas'
  cutIndex: -1,
  clickTimeSec: 0,
  audioSlice: null, // { start, end, isExisting }
};

function openContextMenu(type, x, y, data = {}) {
  const menu = document.getElementById('timeline-context-menu');
  const videoSec = document.getElementById('ctx-video-section');
  const canvasSec = document.getElementById('ctx-canvas-section');
  const audioSec = document.getElementById('ctx-audio-section');
  if (!menu || !videoSec || !audioSec) return;

  ctxMenuState.activeType = type;
  ctxMenuState.cutIndex = data.cutIndex !== undefined ? data.cutIndex : -1;
  ctxMenuState.clickTimeSec = data.clickTimeSec !== undefined ? data.clickTimeSec : (els.mainAudio ? els.mainAudio.currentTime || 0 : 0);
  ctxMenuState.audioSlice = data.audioSlice || null;

  if (type === 'video') {
    videoSec.style.display = 'block';
    if (canvasSec) canvasSec.style.display = 'none';
    audioSec.style.display = 'none';
  } else if (type === 'canvas') {
    videoSec.style.display = 'none';
    if (canvasSec) canvasSec.style.display = 'block';
    audioSec.style.display = 'none';
  } else if (type === 'audio') {
    videoSec.style.display = 'none';
    if (canvasSec) canvasSec.style.display = 'none';
    audioSec.style.display = 'block';
    const header = document.getElementById('ctx-audio-header');
    if (header && ctxMenuState.audioSlice) {
      header.textContent = `🔊 Audio Slice (${ctxMenuState.audioSlice.start.toFixed(2)}s – ${ctxMenuState.audioSlice.end.toFixed(2)}s)`;
    }
  }

  updateClipboardUIState();

  menu.style.display = 'block';

  // Edge bounds checking
  const menuW = menu.offsetWidth || 210;
  const menuH = menu.offsetHeight || 260;
  let posX = x;
  let posY = y;

  if (posX + menuW > window.innerWidth - 10) {
    posX = Math.max(10, window.innerWidth - menuW - 10);
  }
  if (posY + menuH > window.innerHeight - 10) {
    posY = Math.max(10, window.innerHeight - menuH - 10);
  }

  menu.style.left = `${posX}px`;
  menu.style.top = `${posY}px`;

  // Check submenus for right-edge screen overflow
  const submenus = menu.querySelectorAll('.submenu');
  submenus.forEach((sub) => {
    if (posX + menuW + 185 > window.innerWidth - 10) {
      sub.classList.add('submenu-left');
    } else {
      sub.classList.remove('submenu-left');
    }
  });
}

function closeContextMenu() {
  const menu = document.getElementById('timeline-context-menu');
  if (menu) menu.style.display = 'none';
  ctxMenuState.activeType = null;
}

async function executeContextAction(action) {
  const { activeType, cutIndex, clickTimeSec, audioSlice } = ctxMenuState;
  closeContextMenu();

  // Universal Clipboard Actions
  if (action === 'copy') {
    copyTimelineBlock(cutIndex >= 0 ? cutIndex : Studio.selectedCutIndex);
    return;
  }
  if (action === 'cut') {
    await cutTimelineBlock(cutIndex >= 0 ? cutIndex : Studio.selectedCutIndex);
    return;
  }
  if (action === 'paste') {
    const pasteT = (clickTimeSec !== undefined && clickTimeSec !== null && !isNaN(clickTimeSec))
      ? clickTimeSec
      : (els.mainAudio ? els.mainAudio.currentTime || 0 : 0);
    await pasteTimelineBlock(pasteT);
    return;
  }
  if (action === 'split-playhead') {
    splitCutAtPlayhead();
    return;
  }
  if (action === 'clear-all') {
    executeMenuAction('menuActionClearCuts');
    return;
  }

  if (activeType === 'video') {
    if (!Studio.timeline || !Studio.timeline.events || cutIndex < 0 || cutIndex >= Studio.timeline.events.length) {
      return;
    }
    const ev = Studio.timeline.events[cutIndex];

    switch (action) {
      case 'split': {
        const splitSec = (clickTimeSec && clickTimeSec > ev.start + 0.08 && clickTimeSec < ev.end - 0.08)
          ? clickTimeSec
          : (Number(els.mainAudio.currentTime || 0) > ev.start + 0.08 && Number(els.mainAudio.currentTime || 0) < ev.end - 0.08)
            ? Number(els.mainAudio.currentTime)
            : Number((0.5 * (ev.start + ev.end)).toFixed(3));
        try {
          const res = await api('/api/timeline/split-at-playhead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time: splitSec, event_index: cutIndex }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(splitSec, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Split block failed: ${err.message}`);
        }
        break;
      }

      case 'reverse': {
        const newRev = !ev.reverse;
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, reverse: newRev }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Toggle reverse failed: ${err.message}`);
        }
        break;
      }

      case 'speed-half':
      case 'speed-normal':
      case 'speed-double': {
        const speedVal = action === 'speed-half' ? 0.5 : (action === 'speed-double' ? 2.0 : 1.0);
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, speed: speedVal }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Speed change failed: ${err.message}`);
        }
        break;
      }

      case 'fx-glitch': {
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, style_fx: 'burroughs_cutup', vhs_glitch: true }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Apply FX failed: ${err.message}`);
        }
        break;
      }

      case 'fx-monochrome': {
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, style_fx: 'lynch_monochrome' }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Apply FX failed: ${err.message}`);
        }
        break;
      }

      case 'fx-strobe': {
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, strobe: true }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Apply FX failed: ${err.message}`);
        }
        break;
      }

      case 'fx-burns': {
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, ken_burns: 'zoom_in' }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Apply FX failed: ${err.message}`);
        }
        break;
      }

      case 'fx-crt-phosphor':
      case 'fx-bleach-bypass':
      case 'fx-thermal-solar':
      case 'fx-tape-degrade':
      case 'fx-sepia-rotogravure':
      case 'fx-rgb-split-strobe': {
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, style_fx: action }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime || 0 : 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Apply FX failed: ${err.message}`);
        }
        break;
      }

      case 'fx-clear': {
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_index: cutIndex,
              style_fx: 'clean',
              vhs_glitch: false,
              strobe: false,
              ken_burns: null,
              optical_treatment: null,
              prism_mirror: false,
            }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Clear FX failed: ${err.message}`);
        }
        break;
      }

      case 'toggle-typo-flash': {
        const newMuted = !Boolean(ev.typo_muted);
        try {
          const res = await api('/api/timeline/update-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex, typo_muted: newMuted }),
          });
          Studio.timeline = res.timeline;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio ? els.mainAudio.currentTime || 0 : 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Toggle typographic flashes failed: ${err.message}`);
        }
        break;
      }

      case 'delete': {
        try {
          const res = await api('/api/timeline/delete-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_index: cutIndex }),
          });
          Studio.timeline = res.timeline;
          Studio.activeSlotIndex = -1;
          renderTimelineView();
          syncVideoDecodersToTime(els.mainAudio.currentTime || 0, true);
          triggerWorkspaceAutoSave();
        } catch (err) {
          alert(`Delete block failed: ${err.message}`);
        }
        break;
      }
    }
  } else if (activeType === 'audio') {
    if (!Studio.audio || !audioSlice) return;
    Studio.audio.sliceEdits = Studio.audio.sliceEdits || [];

    if (action === 'audio-reset') {
      // Remove any slice edits overlapping this slice
      Studio.audio.sliceEdits = Studio.audio.sliceEdits.filter(
        (e) => !(e.start < audioSlice.end && e.end > audioSlice.start)
      );
      await AudioEngine.applyToMainAudio();
      renderTimelineView();
      triggerWorkspaceAutoSave();
    } else {
      const editAction = action.replace('audio-', ''); // 'reverse', 'chop', 'halftime', 'mute'
      Studio.audio.sliceEdits = Studio.audio.sliceEdits.filter(
        (e) => !(e.start < audioSlice.end && e.end > audioSlice.start)
      );
      Studio.audio.sliceEdits.push({
        start: audioSlice.start,
        end: audioSlice.end,
        action: editAction,
      });
      await AudioEngine.applyToMainAudio();
      renderTimelineView();
      triggerWorkspaceAutoSave();
    }
  }
}

// Attach Context Menu Event Listeners (Blocks, Waveform, & Empty Track Canvas)
if (els.cutsTrack) {
  els.cutsTrack.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = els.cutsTrack.getBoundingClientRect();
    const clickSec = Math.max(0, (e.clientX - rect.left) / Studio.pxPerSec);
    const cutBlock = e.target.closest('.cut-block');

    if (cutBlock) {
      const cutIdx = Number(cutBlock.getAttribute('data-cut-idx'));
      Studio.selectedCutIndex = cutIdx;
      renderTimelineView();
      openContextMenu('video', e.clientX, e.clientY, {
        cutIndex: cutIdx,
        clickTimeSec: clickSec,
      });
    } else {
      openContextMenu('canvas', e.clientX, e.clientY, {
        clickTimeSec: clickSec,
      });
    }
  });
}

if (els.waveformCanvas) {
  els.waveformCanvas.addEventListener('contextmenu', (e) => {
    if (!Studio.audio) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = els.waveformCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickSec = Math.max(0, clickX / Studio.pxPerSec);
    const slice = getAudioSliceAtTime(clickSec);

    openContextMenu('audio', e.clientX, e.clientY, {
      clickTimeSec: clickSec,
      audioSlice: slice,
    });
  });
}

if (els.timelineTracks) {
  els.timelineTracks.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#waveformCanvas') || e.target.closest('#cutsTrack') || e.target.closest('.cut-block')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const rect = els.cutsTrack ? els.cutsTrack.getBoundingClientRect() : els.timelineTracks.getBoundingClientRect();
    const clickSec = Math.max(0, (e.clientX - rect.left) / Studio.pxPerSec);
    openContextMenu('canvas', e.clientX, e.clientY, {
      clickTimeSec: clickSec,
    });
  });
}

const ctxMenuEl = document.getElementById('timeline-context-menu');
if (ctxMenuEl) {
  ctxMenuEl.addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (!item) return;
    const action = item.getAttribute('data-action');
    if (action) {
      executeContextAction(action);
    }
  });
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('timeline-context-menu');
  if (menu && menu.style.display !== 'none') {
    if (!e.target.closest('#timeline-context-menu')) {
      closeContextMenu();
    }
  }
});

/* =========================================================================
   NEW SESSION / CLEAN SLATE PROJECT TEARDOWN
   ========================================================================= */
async function resetSessionToCleanSlate() {
  AudioEngine.reset();
  closeContextMenu();

  // 1. AUDIO ENGINE PURGE
  // Stop active playback immediately (cancel requestAnimationFrame, pause HTML audio element / stop Web Audio buffer source)
  Studio.isPlaying = false;
  if (els.btnPlayPause) els.btnPlayPause.textContent = '▶ Play';

  // Pause HTML audio element, clear src, remove buffer references
  if (els.mainAudio) {
    try { els.mainAudio.pause(); } catch (e) {}
    els.mainAudio.removeAttribute('src');
    els.mainAudio.src = '';
    els.mainAudio.removeAttribute('data-src');
    try { els.mainAudio.load(); } catch (e) {}
    els.mainAudio.currentTime = 0;
  }

  // Also pause & clear video decoder elements
  [els.vidA, els.vidB, els.vidL, els.vidR].forEach((v) => {
    if (v) {
      try { v.pause(); } catch (e) {}
      v.removeAttribute('src');
      v.src = '';
      try { v.load(); } catch (e) {}
      fastSeekVideo(v, 0);
    }
  });

  VideoPool.hasCachedFrame = false;
  VideoPool.preloadedCutIdx = -1;
  VideoPool.activeTag = 'A';
  Studio.activeDecoder = 'A';

  // Stop Web Audio buffer source
  if (window.audioBufferSource) {
    try { window.audioBufferSource.stop(); } catch (e) {}
    try { window.audioBufferSource.disconnect(); } catch (e) {}
    window.audioBufferSource = null;
  }

  // Disconnect and destroy any active Web Audio nodes (AudioContext, AnalyserNode, GainNode)
  if (window.audioContext || Studio.audioContext) {
    const actx = window.audioContext || Studio.audioContext;
    try { actx.close(); } catch (e) {}
    window.audioContext = null;
    Studio.audioContext = null;
  }
  if (window.analyserNode) {
    try { window.analyserNode.disconnect(); } catch (e) {}
    window.analyserNode = null;
  }
  if (window.gainNode) {
    try { window.gainNode.disconnect(); } catch (e) {}
    window.gainNode = null;
  }

  // Set audioBuffer = null, audioElement.src = '', currentAudioUrl = null, audioDuration = 0
  window.audioBuffer = null;
  window.audioDuration = 0;
  window.currentAudioUrl = null;
  if (window.audioElement) {
    try { window.audioElement.pause(); window.audioElement.src = ''; } catch (e) {}
  }
  Studio.audio = null;
  Studio.audioBuffer = null;
  Studio.currentAudioUrl = null;
  Studio.audioDuration = 0;

  // Reset audio filename label to "Drop Music Track (.mp3, .wav, .flac)" and clear BPM / key readouts back to "--"
  if (els.audioTrackLabel) {
    els.audioTrackLabel.textContent = '🎵 Drop Music Track (.mp3, .wav, .flac)';
  }
  if (els.audioStatsLabel) {
    els.audioStatsLabel.textContent = 'Extracts BPM, Downbeats, Kick/Snare Stems & Energy-Arc Sections';
  }
  if (els.statBpm) els.statBpm.textContent = 'BPM: --';
  const keyEls = [document.getElementById('statKey'), document.getElementById('keyReadout')];
  keyEls.forEach(k => { if (k) k.textContent = 'Key: --'; });
  if (els.sectionsSlotList) els.sectionsSlotList.innerHTML = '';
  renderAudioState();
  setSplicerMode('preset', false);

  // 2. WAVEFORM & TIMELINE FLUSH
  // Clear the timeline canvas / waveform peaks data array (peaks = [], waveformDrawer.clear())
  window.peaks = [];
  if (window.waveformDrawer && typeof window.waveformDrawer.clear === 'function') {
    try { window.waveformDrawer.clear(); } catch (e) {}
  }

  // Redraw the empty timeline baseline grid
  if (els.waveformCanvas) {
    const wfCanvas = els.waveformCanvas;
    const totalW = 800;
    wfCanvas.width = totalW;
    wfCanvas.height = 76;
    const wctx = wfCanvas.getContext('2d');
    const bgDarkest = getCssColor('--bg-darkest', '#090a0c');
    const colorSecondary = getCssColor('--color-secondary', '#2563eb');

    wctx.fillStyle = bgDarkest;
    wctx.fillRect(0, 0, totalW, 76);
    wctx.strokeStyle = hexToRgba(colorSecondary, 0.12) || 'rgba(37, 99, 235, 0.12)';
    wctx.lineWidth = 1;
    wctx.beginPath();
    wctx.moveTo(0, 38);
    wctx.lineTo(totalW, 38);
    wctx.stroke();
    for (let x = 0; x < totalW; x += 50) {
      wctx.beginPath();
      wctx.moveTo(x, 0);
      wctx.lineTo(x, 76);
      wctx.stroke();
    }
  }

  // Reset the playhead position and scrub timers to 00:00.00 / 00:00.00
  if (els.timecodeDisplay) els.timecodeDisplay.textContent = '00:00.00 / 00:00.00';
  if (els.playheadLine) els.playheadLine.style.left = '0px';
  if (els.timelineScroll) els.timelineScroll.scrollLeft = 0;
  if (els.timelineTracks) els.timelineTracks.style.width = '800px';

  // Wipe all cut points, transient markers, pinned manual blocks, and slice arrays (cuts = [], timelineBlocks = [])
  Studio.timeline = { duration: 0, events: [] };
  Studio.selectedCutIndex = null;
  Studio.activeSlotIndex = -1;
  Studio.preloadedNextIndex = -1;
  window.cuts = [];
  window.timelineBlocks = [];

  if (els.statCuts) els.statCuts.textContent = 'Cuts: 0';
  if (els.statSpineBadge) els.statSpineBadge.textContent = 'Story Spine: Dynamic AI';

  // Clear the Manual Workbench track DOM back to its initial placeholder message: "Manual Workbench (Empty Slate)..."
  if (els.cutsTrack) {
    els.cutsTrack.innerHTML = `
      <div style="position:sticky;left:24px;display:inline-flex;align-items:center;gap:8px;height:100%;color:var(--text-muted);font-size:12px;padding:0 18px;pointer-events:none;">
        🛠️ <b>Manual Workbench (Empty Slate):</b> Drag any clip/image from the Library onto this track or click <b>"+ Add Block"</b> to assemble cuts manually.
      </div>
    `;
  }
  if (els.sectionsTrack) {
    els.sectionsTrack.innerHTML = '';
  }

  // Reset stem meter readouts
  if (els.meterBass) els.meterBass.style.width = '0%';
  if (els.meterSnare) els.meterSnare.style.width = '0%';
  if (els.meterHigh) els.meterHigh.style.width = '0%';
  if (els.valBass) els.valBass.textContent = '0%';
  if (els.valSnare) els.valSnare.textContent = '0%';
  if (els.valHigh) els.valHigh.textContent = '0%';

  // 3. LYRICS PURGE
  // Clear all parsed lyric arrays (lyrics = [], activeLyricIndex = -1)
  Studio.lyrics = null;
  Studio.lastActiveLyricIndex = -1;
  window.lyrics = [];
  window.activeLyricIndex = -1;

  // Clear the visual lyric track on the timeline and remove all lyric subtitle DOM nodes
  if (els.lyricsTrack) {
    els.lyricsTrack.innerHTML = `
      <div class="lyrics-lane-header">
        <span>📝 LYRICS (None)</span>
        <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;color:#a7f3d0;" title="Master toggle: Include Lyrics in Final Render">
          <input type="checkbox" id="chkIncludeLyricsLane" />
          <span>Include Lyrics in Final Render</span>
        </label>
        <button class="btn btn-sm btn-accent" id="btnImportLyricsLane" style="padding:0px 6px;font-size:9.5px;">+ .lrc/.srt</button>
      </div>
    `;
    const laneBtn = els.lyricsTrack.querySelector('#btnImportLyricsLane');
    if (laneBtn) {
      laneBtn.onclick = () => document.getElementById('lyricFileInput')?.click();
    }
  }

  // Reset the lyric offset slider and numerical display back to 0.00s
  if (els.lyricOffsetSlider) els.lyricOffsetSlider.value = 0.0;
  if (els.lyricOffsetInput) els.lyricOffsetInput.value = '0.00';
  if (els.lyricOffsetVal) els.lyricOffsetVal.textContent = '+0.00s';

  // Uncheck the "Include Lyrics in Final Render" toggle (or set back to default)
  if (els.chkIncludeLyricsExport) els.chkIncludeLyricsExport.checked = false;
  const laneChk = document.getElementById('chkIncludeLyricsLane');
  if (laneChk) laneChk.checked = false;
  const exportBurn = document.getElementById('exportBurnLyrics');
  if (exportBurn) exportBurn.checked = false;

  // 4. MEDIA LIBRARIES & CANVAS RESET
  // Clear both the Video Clips array and Still Images array
  Studio.clips = [];
  Studio.imageCache = {};
  window.videoClips = [];
  window.stillImages = [];
  window.clips = [];

  // Empty the DOM containers for both media bays (reset counters to "0")
  if (els.clipCountBadge) els.clipCountBadge.textContent = '0';
  if (els.videoCountBadge) els.videoCountBadge.textContent = '0';
  if (els.stillCountBadge) els.stillCountBadge.textContent = '0';
  if (els.videoLibraryList) {
    els.videoLibraryList.innerHTML = '<div class="empty-bay-hint">No video clips (.mp4, .mov, .webm) loaded yet.</div>';
  }
  if (els.stillLibraryList) {
    els.stillLibraryList.innerHTML = '<div class="empty-bay-hint">No still images (.png, .jpg, .webp) loaded yet.</div>';
  }
  if (els.clipLibraryList) {
    els.clipLibraryList.innerHTML = '';
  }

  // Reset the center video canvas / preview back to solid black
  if (els.previewCanvas && ctxPreview) {
    ctxPreview.fillStyle = '#000000';
    ctxPreview.fillRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
  }
  const ctxEcho = echoFeedbackCanvas.getContext('2d');
  if (ctxEcho) ctxEcho.clearRect(0, 0, echoFeedbackCanvas.width, echoFeedbackCanvas.height);
  echoBufferReady = false;

  // Reset HUD strip
  if (els.hudClipName) els.hudClipName.textContent = 'None';
  if (els.hudSection) els.hudSection.textContent = 'None';
  if (els.hudMatchReason) els.hudMatchReason.textContent = 'None';

  // Reset Auto-Vary FX Engine
  if (Studio.autoVary) {
    Studio.autoVary.enabled = false;
    Studio.autoVary.frequency = 'section';
    Studio.autoVary.lastTriggerKey = null;
    Studio.autoVary.lastTriggerTime = 0;
    Studio.autoVary.recentPresets = [];
    Studio.autoVary.activeAutoFx = null;
    Studio.autoVary.hardwareFlashActive = false;
  }
  if (els.toggleAutoFx) els.toggleAutoFx.checked = false;
  if (els.autoFxFrequency) els.autoFxFrequency.value = 'section';
  if (els.previewCanvas) {
    els.previewCanvas.classList.remove(
      'fx-crt-phosphor', 'fx-bleach-bypass', 'fx-thermal-solar',
      'fx-tape-degrade', 'fx-sepia-rotogravure', 'fx-rgb-split-strobe'
    );
  }

  // Reset the project name / title input back to "Untitled Project"
  Studio.projectName = 'Untitled Project';
  const titleInputs = [
    els.projectTitleInput,
    document.getElementById('projectTitleInput'),
    document.getElementById('projectNameInput'),
    document.getElementById('projectTitle'),
    document.getElementById('projectName'),
  ];
  titleInputs.forEach((el) => {
    if (el) el.value = 'Untitled Project';
  });
  document.title = 'Strangelet Splicer — Untitled Project';

  // Clear persistent local session storage & sync backend state
  localStorage.removeItem('strangelet_splicer_active_session');
  try {
    await api('/api/session/new', { method: 'POST' });
  } catch (err) {
    try {
      await api('/api/state/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: null, clips: [], timeline: null, lyrics: null }),
      });
    } catch (e) {}
  }

  Studio.hasUnsavedChanges = false;
  if (els.saveLed) {
    els.saveLed.classList.remove('pulsing');
    els.saveLed.classList.add('saved');
  }
  if (els.saveLedText) {
    els.saveLedText.textContent = 'CLEAN SLATE';
  }
}

/* =========================================================================
   WINDOWS DESKTOP MENU BAR (File, Edit, View, Help)
   ========================================================================= */
function closeAllDesktopMenus() {
  document.querySelectorAll('.menu-dropdown, .menu-item-dropdown').forEach(m => m.classList.remove('open'));
}

async function executeMenuAction(actionId, entryEl) {
  closeAllDesktopMenus();
  switch (actionId) {
    case 'menuActionNewSession':
      if (confirm('Start a new session? This will perform a 100% complete project teardown and reset to a clean blank slate.')) {
        await resetSessionToCleanSlate();
      }
      break;
    case 'menuActionOpenProject':
      if (els.openProjectInput) els.openProjectInput.click();
      else document.getElementById('openProjectInput')?.click();
      break;
    case 'menuActionSaveProject':
      if (els.btnSaveProject) els.btnSaveProject.click();
      else document.getElementById('btnSaveProject')?.click();
      break;
    case 'menuActionExportBundle':
      exportProjectBundle();
      break;
    case 'menuActionLoadDemo': {
      const btn = document.getElementById('btnLoadDemo');
      if (btn) btn.click();
      break;
    }
    case 'menuActionImportLyrics': {
      const inp = document.getElementById('lyricFileInput');
      if (inp) inp.click();
      break;
    }
    case 'menuActionExportMp4':
      openExportOptionsModal('master_archive');
      break;
    case 'menuActionExportDraft':
    case 'menuActionExportQuickDraft':
      openExportOptionsModal('lightning_draft');
      break;
    case 'menuActionExportNle': {
      const btn = document.getElementById('btnExportNle');
      if (btn) btn.click();
      break;
    }
    case 'menuActionExit':
      if (Studio.hasUnsavedChanges && !confirm('You have unsaved changes. Exit Strangelet Stitch anyway?')) {
        return;
      }
      if (isTauriEnvironment() && window.__TAURI__?.window) {
        try {
          window.__TAURI__.window.getCurrentWindow().close();
        } catch (e) {
          window.close();
        }
      } else {
        window.close();
      }
      break;
    case 'menuActionUndo':
      alert('Undo history: Timeline is at the current state.');
      break;
    case 'menuActionRedo':
      alert('Redo history: No forward actions to restore.');
      break;
    case 'menuActionCutBlock':
      await cutTimelineBlock();
      break;
    case 'menuActionCopyBlock':
      copyTimelineBlock();
      break;
    case 'menuActionPasteBlock':
      await pasteTimelineBlock(els.mainAudio ? els.mainAudio.currentTime || 0 : 0);
      break;
    case 'menuActionSplit':
      splitCutAtPlayhead();
      break;
    case 'menuActionClearCuts':
      if (confirm('Clear all cuts from the timeline?')) {
        Studio.timeline = { duration: Studio.audio ? Studio.audio.duration : 0, events: [] };
        Studio.activeSlotIndex = -1;
        renderTimelineView();
        syncVideoDecodersToTime(0, true);
        triggerWorkspaceAutoSave();
      }
      break;
    case 'menuActionAiBridge': {
      const modalBridge = document.getElementById('modalWebBridge');
      if (modalBridge) modalBridge.classList.add('open');
      break;
    }
    case 'menuActionAiSettings': {
      const modalAi = document.getElementById('modalAiSettings');
      if (modalAi) modalAi.classList.add('open');
      break;
    }
    case 'menuActionToggleFullscreen':
      toggleCanvasFullscreen();
      break;
    case 'menuActionToggleHud':
      if (els.chkShowHud) {
        els.chkShowHud.checked = !els.chkShowHud.checked;
        if (typeof els.chkShowHud.onchange === 'function') els.chkShowHud.onchange();
      } else {
        const chk = document.getElementById('chkShowHud');
        if (chk) {
          chk.checked = !chk.checked;
          if (typeof chk.onchange === 'function') chk.onchange();
        }
      }
      break;
    case 'menuActionToggleLiveFx':
      if (els.chkLiveFx) {
        els.chkLiveFx.checked = !els.chkLiveFx.checked;
        if (els.chkLiveFx.onchange) els.chkLiveFx.onchange();
      } else {
        const chk = document.getElementById('chkLiveFx');
        if (chk) {
          chk.checked = !chk.checked;
          if (chk.onchange) chk.onchange();
        }
      }
      break;
    case 'menuActionZoomIn':
      zoomTimeline(15);
      break;
    case 'menuActionZoomOut':
      zoomTimeline(-15);
      break;
    case 'menuActionFieldManual':
      openManualModal();
      break;
    case 'menuActionAbout':
      openAboutModal();
      break;
    case 'menuActionCheckUpdates':
      alert('Strangelet Stitch v1.1.0\n\nYou are running the latest standalone offline build.\nZero cloud dependencies or mandatory telemetry.');
      break;
  }
}

// Global Click Delegation for Menu Bar: Handles dropdown toggling, menu actions, and outside click dismissal
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.menu-btn');
  if (btn) {
    e.stopPropagation();
    const parent = btn.closest('.menu-dropdown') || btn.closest('.menu-item-dropdown');
    if (!parent) return;
    const wasOpen = parent.classList.contains('open');
    document.querySelectorAll('.menu-dropdown, .menu-item-dropdown').forEach(m => m.classList.remove('open'));
    if (!wasOpen) {
      parent.classList.add('open');
    }
    return;
  }

  const entry = e.target.closest('.menu-entry');
  if (entry) {
    e.stopPropagation();
    executeMenuAction(entry.id, entry);
    return;
  }

  // Clicked outside, close all
  closeAllDesktopMenus();
});

/* =========================================================================
   UNIFIED KEYBOARD SHORTCUTS DISPATCHER
   ========================================================================= */
window.addEventListener('keydown', (e) => {
  const activeTag = (document.activeElement && document.activeElement.tagName) || '';
  const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || document.activeElement?.isContentEditable;

  // Shortcuts with Ctrl / Cmd modifiers
  if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
    e.preventDefault();
    if (confirm('Start a new session? This will perform a 100% complete project teardown and reset to a clean blank slate.')) {
      resetSessionToCleanSlate();
    }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    if (els.btnSaveProject) els.btnSaveProject.click();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
    if (isInputActive) return;
    e.preventDefault();
    copyTimelineBlock();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
    if (isInputActive) return;
    e.preventDefault();
    cutTimelineBlock();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
    if (isInputActive) return;
    e.preventDefault();
    pasteTimelineBlock(els.mainAudio ? els.mainAudio.currentTime || 0 : 0);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    zoomTimeline(15);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
    e.preventDefault();
    zoomTimeline(-15);
    return;
  }

  // Escape key for modals, menus, and overlays, or stopPlayback() if none open
  if (e.key === 'Escape') {
    const hasOpenModal = document.querySelector('.modal.open, .modal-backdrop.open, .context-menu[style*="display: block"], .menu-dropdown.open, .menu-item-dropdown.open');
    closeContextMenu();
    closeAboutModal();
    closeManualModal();
    closeExportOptionsModal();
    closeAllDesktopMenus();
    const modalAi = document.getElementById('modalAiSettings');
    if (modalAi) modalAi.classList.remove('open');
    const modalBridge = document.getElementById('modalWebBridge');
    if (modalBridge) modalBridge.classList.remove('open');
    const modalInspect = document.getElementById('modalClipInspector');
    if (modalInspect) modalInspect.classList.remove('open');
    if (!hasOpenModal) {
      stopPlayback();
    }
    return;
  }

  // F1 Field Manual
  if (e.key === 'F1') {
    e.preventDefault();
    openManualModal();
    return;
  }

  // F11 Fullscreen Viewport
  if (e.key === 'F11') {
    e.preventDefault();
    toggleCanvasFullscreen();
    return;
  }

  // Non-modifier shortcuts (only when not editing text inputs)
  if (isInputActive) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // DAW Studio Transport Controls
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    togglePlayPause();
    return;
  }
  if (e.key === 'Home' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    gotoStart();
    return;
  }
  if (e.key === 'End') {
    e.preventDefault();
    gotoEnd();
    return;
  }
  if (e.code === 'Numpad0' || (e.key === '0' && e.location === 3)) {
    e.preventDefault();
    stopPlayback();
    return;
  }
  if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    toggleLoop();
    return;
  }

  if (e.key === 's' || e.key === 'S' || e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    splitCutAtPlayhead();
    return;
  }
  if (e.key === 'Delete' || e.key === 'Del') {
    if (Studio.selectedCutIndex !== null && Studio.selectedCutIndex >= 0) {
      e.preventDefault();
      executeContextAction('delete');
      return;
    }
  }
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    toggleCanvasFullscreen();
    return;
  }
  if (e.key === 'h' || e.key === 'H') {
    e.preventDefault();
    if (els.chkShowHud) {
      els.chkShowHud.checked = !els.chkShowHud.checked;
      if (typeof els.chkShowHud.onchange === 'function') els.chkShowHud.onchange();
    }
    return;
  }
});

initStudio();
