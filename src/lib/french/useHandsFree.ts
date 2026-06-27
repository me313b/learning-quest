"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A hands-free microphone hook. Call `listen()` and it:
//   1. opens the mic,
//   2. records while watching the audio level,
//   3. stops automatically a moment after the child finishes talking (or after
//      a maximum number of seconds if they stay quiet),
//   4. sends the clip to Whisper (via /api/transcribe) and returns the text.
// No button press is needed during a turn. `stopEarly()` can end a turn early.

export type ListenStatus = "idle" | "listening" | "thinking";

function blobToB64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = String(r.result || "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export interface ListenResult {
  text: string;
  audioUrl: string | null;
  heardSpeech: boolean;
}

export function useHandsFree() {
  const [status, setStatus] = useState<ListenStatus>("idle");
  const [level, setLevel] = useState(0); // 0..1 mic level, for a visual meter

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);
  const stopResolveRef = useRef<((mime: string) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      ctxRef.current?.close();
    } catch {
      /* ignore */
    }
    ctxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [cleanup]);

  const stopEarly = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const listen = useCallback(
    async (
      maxMs = 9000,
      opts?: { language?: string; prompt?: string },
    ): Promise<ListenResult | null> => {
      setStatus("listening");
      let heardSpeech = false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
        const mime =
          candidates.find(
            (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
          ) || "";
        const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        recRef.current = rec;
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };

        // Voice-activity detection via Web Audio.
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);

        const SPEAK = 0.04; // RMS above this counts as talking (a touch softer, for quiet kids)
        const QUIET = 0.025; // RMS below this counts as silence
        const SILENCE_MS = 1200; // stop this long after talking stops (snappier turns)
        const GRACE_MS = 700; // don't allow an instant stop at the very start
        const start = performance.now();
        let lastVoice = start;

        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const a = (buf[i] - 128) / 128;
            sum += a * a;
          }
          const rms = Math.sqrt(sum / buf.length);
          setLevel(Math.min(1, rms * 6));
          const now = performance.now();
          if (rms > SPEAK) {
            heardSpeech = true;
            lastVoice = now;
          }
          const elapsed = now - start;
          const quietFor = now - lastVoice;
          const shouldStop =
            elapsed > maxMs ||
            (heardSpeech && elapsed > GRACE_MS && rms < QUIET && quietFor > SILENCE_MS);
          if (shouldStop) {
            try {
              rec.stop();
            } catch {
              /* ignore */
            }
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };

        const stopped = new Promise<string>((resolve) => {
          stopResolveRef.current = resolve;
          rec.onstop = () => resolve(rec.mimeType || mime || "audio/webm");
        });

        rec.start();
        rafRef.current = requestAnimationFrame(tick);

        const usedMime = await stopped;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        try {
          await ctx.close();
        } catch {
          /* ignore */
        }
        ctxRef.current = null;
        setLevel(0);

        setStatus("thinking");
        const blob = new Blob(chunksRef.current, { type: usedMime });
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);

        if (!heardSpeech) {
          setStatus("idle");
          return { text: "", audioUrl: urlRef.current, heardSpeech: false };
        }

        const audioB64 = await blobToB64(blob);
        let text = "";
        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              audioB64,
              mime: usedMime,
              language: opts?.language || "fr",
              prompt: opts?.prompt || "",
            }),
          });
          const data = await res.json();
          if (typeof data.text === "string") text = data.text.trim();
        } catch {
          /* network error -> empty */
        }
        setStatus("idle");
        return { text, audioUrl: urlRef.current, heardSpeech: true };
      } catch {
        cleanup();
        setStatus("idle");
        return null;
      }
    },
    [cleanup],
  );

  return { status, level, listen, stopEarly };
}
