"use client";

// Soft, looping background soundscapes generated live with the Web Audio API —
// no audio files, nothing to license. There are several gentle options plus an
// "off" setting, all deliberately quiet and low-passed so they sit far in the
// background. The chosen track is remembered between visits.

export type MusicTrack = "off" | "calm" | "twinkle" | "lofi" | "forest";

export const MUSIC_TRACKS: { id: MusicTrack; name: string; emoji: string }[] = [
  { id: "off", name: "No music", emoji: "🔇" },
  { id: "calm", name: "Calm", emoji: "🌙" },
  { id: "twinkle", name: "Twinkle", emoji: "✨" },
  { id: "lofi", name: "Cosy", emoji: "🎧" },
  { id: "forest", name: "Forest", emoji: "🌲" },
];

const TRACK_KEY = "lq_music_track";
const PREV_KEY = "lq_music_prev";

interface TrackCfg {
  chords: number[][]; // MIDI note triads
  interval: number; // ms between bars
  padGain: number;
  leadGain: number;
  cutoff: number;
  padType: OscillatorType;
  leadType: OscillatorType;
  lead: "arp" | "sparse" | "none";
  master: number;
}

const CFG: Record<Exclude<MusicTrack, "off">, TrackCfg> = {
  calm: {
    chords: [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]],
    interval: 3800,
    padGain: 0.06,
    leadGain: 0.045,
    cutoff: 950,
    padType: "sine",
    leadType: "sine",
    lead: "sparse",
    master: 0.7,
  },
  twinkle: {
    chords: [[60, 64, 67], [62, 65, 69], [60, 64, 67], [59, 62, 67]],
    interval: 2200,
    padGain: 0.035,
    leadGain: 0.055,
    cutoff: 2400,
    padType: "sine",
    leadType: "sine",
    lead: "sparse",
    master: 0.65,
  },
  lofi: {
    chords: [[48, 52, 55], [45, 48, 52], [50, 53, 57], [43, 47, 50]],
    interval: 3200,
    padGain: 0.07,
    leadGain: 0.04,
    cutoff: 700,
    padType: "triangle",
    leadType: "triangle",
    lead: "arp",
    master: 0.7,
  },
  forest: {
    chords: [[55, 59, 62], [57, 60, 64], [52, 55, 59], [50, 53, 57]],
    interval: 4200,
    padGain: 0.05,
    leadGain: 0.035,
    cutoff: 1200,
    padType: "sine",
    leadType: "sine",
    lead: "sparse",
    master: 0.6,
  },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let playing = false;

function getTrack(): MusicTrack {
  try {
    return (localStorage.getItem(TRACK_KEY) as MusicTrack) || "calm";
  } catch {
    return "calm";
  }
}

function midiToFreq(n: number): number {
  return 440 * Math.pow(2, (n - 69) / 12);
}

function ensure(): boolean {
  if (typeof window === "undefined") return false;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
  }
  return true;
}

function voice(freq: number, start: number, dur: number, gain: number, type: OscillatorType, cutoff: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = cutoff;
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(f);
  f.connect(master);
  o.start(start);
  o.stop(start + dur + 0.1);
}

function tick(cfg: TrackCfg) {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  const chord = cfg.chords[step % cfg.chords.length];
  // soft pad, an octave down
  chord.forEach((n) => voice(midiToFreq(n - 12), now, cfg.interval / 1000 + 0.4, cfg.padGain, cfg.padType, cfg.cutoff));
  // lead
  if (cfg.lead === "arp") {
    const note = chord[step % chord.length];
    voice(midiToFreq(note + 12), now + 0.05, 1.2, cfg.leadGain, cfg.leadType, cfg.cutoff + 600);
    voice(midiToFreq(chord[(step + 2) % chord.length] + 12), now + 1.3, 1.0, cfg.leadGain * 0.9, cfg.leadType, cfg.cutoff + 600);
  } else if (cfg.lead === "sparse") {
    if (step % 2 === 0) {
      const note = chord[(step / 2) % chord.length] + 12;
      voice(midiToFreq(note), now + 0.3, 1.6, cfg.leadGain, cfg.leadType, cfg.cutoff + 800);
    }
  }
  step += 1;
}

export function startMusic(): void {
  const track = getTrack();
  if (track === "off") return;
  if (playing) return;
  if (!ensure() || !ctx || !master) return;
  const cfg = CFG[track];
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  } catch {
    /* ignore */
  }
  playing = true;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(cfg.master, ctx.currentTime + 3);
  tick(cfg);
  timer = setInterval(() => tick(cfg), cfg.interval);
}

export function stopMusic(): void {
  playing = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (ctx && master) {
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    } catch {
      /* ignore */
    }
  }
}

export function isMusicOn(): boolean {
  return getTrack() !== "off";
}

export function isMusicPlaying(): boolean {
  return playing;
}

export function getMusicTrack(): MusicTrack {
  return getTrack();
}

/** Choose a track (or "off"). Restarts the music with the new sound. */
export function setMusicTrack(t: MusicTrack): void {
  try {
    if (t !== "off") localStorage.setItem(PREV_KEY, t);
    localStorage.setItem(TRACK_KEY, t);
  } catch {
    /* ignore */
  }
  stopMusic();
  if (t !== "off") {
    // small delay so the fade-out finishes first
    setTimeout(() => startMusic(), 120);
  }
}

/** Toggle music on/off, remembering the last chosen track. Returns new on state. */
export function toggleMusic(): boolean {
  const cur = getTrack();
  if (cur === "off") {
    let prev: MusicTrack = "calm";
    try {
      prev = (localStorage.getItem(PREV_KEY) as MusicTrack) || "calm";
    } catch {
      /* ignore */
    }
    if (prev === "off") prev = "calm";
    setMusicTrack(prev);
    return true;
  }
  setMusicTrack("off");
  return false;
}

// Browsers block audio until the user interacts. We unlock the AudioContext on
// the first tap/key so the background music can actually start (this is the
// usual reason "the music doesn't work" on iPad/Safari).
let unlockInstalled = false;
export function installAudioUnlock(): void {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const unlock = () => {
    try {
      ensure();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch {
      /* ignore */
    }
    if (getTrack() !== "off") startMusic();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("touchstart", unlock);
  window.addEventListener("keydown", unlock);
}
