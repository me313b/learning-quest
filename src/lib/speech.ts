"use client";

// Audio helpers built on the browser's own speech + Web Audio (no API key, no
// network). The tricky part with speech synthesis is that the list of voices
// loads asynchronously, so a naive first call often does nothing. We handle that
// by waiting for voices when needed, and we explicitly pick a voice that matches
// the requested language (so French actually sounds French).

let voiceWarm = false;

/** Nudge the browser into loading its voice list early (call once on mount). */
export function primeVoices(): void {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      voiceWarm = true;
    };
  } catch {
    /* speech not available */
  }
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const want = lang.toLowerCase();
  const base = want.slice(0, 2);
  const matches = voices.filter(
    (v) =>
      v.lang.toLowerCase() === want ||
      v.lang.toLowerCase().replace("_", "-").startsWith(base),
  );
  if (matches.length === 0) return undefined;
  // Prefer the better-sounding voices when several exist.
  const nicer = /(enhanced|premium|natural|neural|siri|google|amelie|amélie|thomas|samantha|daniel)/i;
  return matches.find((v) => nicer.test(v.name)) || matches[0];
}

/** Speak some text aloud in the given language (default British English). */
export function speak(text: string, lang = "en-GB"): void {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    let done = false;
    const utter = () => {
      if (done) return;
      done = true;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const v = pickVoice(lang);
      if (v) u.voice = v;
      u.rate = 0.9;
      u.pitch = 1.0;
      synth.speak(u);
    };

    if (synth.getVoices().length === 0) {
      // Voices not ready yet: speak as soon as they arrive, with a fallback timer.
      const prev = synth.onvoiceschanged;
      synth.onvoiceschanged = () => {
        voiceWarm = true;
        if (typeof prev === "function") {
          try {
            (prev as () => void)();
          } catch {
            /* ignore */
          }
        }
        utter();
      };
      setTimeout(utter, 300);
    } else {
      utter();
    }
  } catch {
    /* ignore */
  }
}

/** Does the browser have any voice for this language (e.g. French)? */
export function hasVoiceFor(lang: string): boolean {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;
    void voiceWarm;
    const base = lang.toLowerCase().slice(0, 2);
    return window.speechSynthesis
      .getVoices()
      .some((v) => v.lang.toLowerCase().replace("_", "-").startsWith(base));
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------- //
// High-quality speech: try the server voice (OpenAI) first, fall back to the
// browser voice. Results are cached in memory per text so repeats are instant.
// --------------------------------------------------------------------------- //
const ttsCache = new Map<string, string>(); // "lang|text" -> base64 mp3 OR "FALLBACK"
let sharedAudio: HTMLAudioElement | null = null;
let currentAudio: HTMLAudioElement | null = null;

function stopAll(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* ignore */
    }
  }
}

// Reuse ONE <audio> element and just reset it each time. Creating a fresh
// element per tap is unreliable on iPad/Safari (it often refuses to replay the
// same clip); resetting currentTime and calling play() on a single element
// replays dependably every press.
function playB64(b64: string): void {
  try {
    if (!sharedAudio) sharedAudio = new Audio();
    const src = `data:audio/mpeg;base64,${b64}`;
    if (sharedAudio.src !== src) sharedAudio.src = src;
    sharedAudio.currentTime = 0;
    currentAudio = sharedAudio;
    const p = sharedAudio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Speak text with the best voice available. Use this everywhere in the UI. */
export async function speakSmart(text: string, lang = "en-GB"): Promise<void> {
  const clean = (text || "").trim();
  if (!clean) return;
  stopAll();

  const key = `${lang}|${clean}`;
  const cached = ttsCache.get(key);
  if (cached === "FALLBACK") {
    speak(clean, lang);
    return;
  }
  if (cached) {
    playB64(cached);
    return;
  }

  try {
    const voice = lang.toLowerCase().startsWith("fr") ? "shimmer" : "coral";
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: clean, voice, lang }),
    });
    const data = await res.json();
    if (data.audioB64) {
      ttsCache.set(key, data.audioB64 as string);
      playB64(data.audioB64 as string);
    } else {
      ttsCache.set(key, "FALLBACK");
      speak(clean, lang);
    }
  } catch {
    ttsCache.set(key, "FALLBACK");
    speak(clean, lang);
  }
}

/** Speak using the NATURAL server voice only. Never falls back to the robotic
 *  browser voice, and reports whether it actually started playing. Used for the
 *  auto-played welcome greeting, where the robotic voice (or a blocked autoplay)
 *  feels worse than waiting for the child's first tap to play the nice voice. */
export async function speakNaturalOnly(text: string, lang = "en-GB"): Promise<boolean> {
  const clean = (text || "").trim();
  if (!clean) return false;
  const key = `${lang}|${clean}`;
  let b64 = ttsCache.get(key);
  if (b64 === "FALLBACK") return false;
  if (!b64) {
    try {
      const voice = lang.toLowerCase().startsWith("fr") ? "shimmer" : "coral";
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: clean, voice, lang }),
      });
      const data = await res.json();
      if (data.audioB64) {
        b64 = data.audioB64 as string;
        ttsCache.set(key, b64);
      } else {
        ttsCache.set(key, "FALLBACK");
        return false;
      }
    } catch {
      return false;
    }
  }
  // Play, and resolve true only if playback actually starts (it throws when the
  // browser blocks autoplay without a user gesture).
  try {
    stopAll();
    if (!sharedAudio) sharedAudio = new Audio();
    const src = `data:audio/mpeg;base64,${b64}`;
    if (sharedAudio.src !== src) sharedAudio.src = src;
    sharedAudio.currentTime = 0;
    currentAudio = sharedAudio;
    await sharedAudio.play();
    return true;
  } catch {
    return false;
  }
}

/** Warm the cache for a phrase WITHOUT playing it (used to preload audio in the
 *  background after login so the first tap is instant). */
export async function prefetchSpeech(text: string, lang = "en-GB"): Promise<void> {
  const clean = (text || "").trim();
  if (!clean) return;
  const key = `${lang}|${clean}`;
  if (ttsCache.has(key)) return;
  try {
    const voice = lang.toLowerCase().startsWith("fr") ? "shimmer" : "coral";
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: clean, voice, lang }),
    });
    const data = await res.json();
    ttsCache.set(key, data.audioB64 ? (data.audioB64 as string) : "FALLBACK");
  } catch {
    /* ignore — it will simply generate on first use */
  }
}

// Whether the high-quality server voice (OpenAI) is actually available. Lets the
// UI tell the parent to add an OpenAI key when only the basic browser voice is on.
let serverVoiceState: "native" | "fallback" | null = null;
export async function probeServerVoice(): Promise<"native" | "fallback"> {
  if (serverVoiceState) return serverVoiceState;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "bonjour", voice: "shimmer", lang: "fr-FR" }),
    });
    const data = await res.json();
    if (data.audioB64) {
      serverVoiceState = "native";
      ttsCache.set("fr-FR|bonjour", data.audioB64 as string); // warm it while we're here
    } else {
      serverVoiceState = "fallback";
    }
  } catch {
    serverVoiceState = "fallback";
  }
  return serverVoiceState;
}

/** A short, cheerful sound effect via Web Audio (no files needed). */
export function chime(kind: "correct" | "hint" | "done" = "correct"): void {
  try {
    if (typeof window === "undefined") return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes =
      kind === "done"
        ? [523, 659, 784, 1047]
        : kind === "correct"
          ? [523, 659, 784]
          : [392, 440];
    let t = ctx.currentTime;
    for (const f of notes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.2);
      t += 0.15;
    }
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1400);
  } catch {
    /* ignore */
  }
}
