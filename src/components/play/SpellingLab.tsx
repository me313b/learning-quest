"use client";

import { useEffect, useRef, useState } from "react";
import { getDictationConfig, recordDictation, type DictationConfig } from "@/lib/data";
import { chime, speakSmart, stopAllSpeech } from "@/lib/speech";
import type { DictationMark, DictationPassage } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";

type Phase = "loading" | "nokey" | "intro" | "reading" | "confirm" | "pausing" | "write" | "marking" | "result";

function fileToB64(file: File): Promise<{ b64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = String(r.result || "");
      const comma = s.indexOf(",");
      resolve({ b64: comma >= 0 ? s.slice(comma + 1) : s, mime: file.type || "image/jpeg" });
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function SpellingLab({ onBack, profileId }: { onBack: () => void; profileId: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [config, setConfig] = useState<DictationConfig | null>(null);
  const [passage, setPassage] = useState<DictationPassage | null>(null);
  const [idx, setIdx] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [mark, setMark] = useState<DictationMark | null>(null);
  const [error, setError] = useState("");

  const runningRef = useRef(false);
  const confirmResolveRef = useRef<null | (() => void)>(null);
  const passageRef = useRef<DictationPassage | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getDictationConfig();
      setConfig(c);
      try {
        const res = await fetch("/api/dictation", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            task: "generate",
            words: c.words,
            lengthLevel: c.length,
            difficulty: c.difficulty,
          }),
        });
        const data = await res.json();
        if (data.passage && Array.isArray(data.passage.sentences) && data.passage.sentences.length) {
          setPassage(data.passage);
          passageRef.current = data.passage;
          setPhase("intro");
        } else {
          setPhase("nokey");
        }
      } catch {
        setPhase("nokey");
      }
    })();
    return () => {
      runningRef.current = false;
      stopAllSpeech();
    };
  }, []);

  async function runDictation() {
    const p = passageRef.current;
    const c = config;
    if (!p || !c) return;
    runningRef.current = true;
    await speakSmart("Listen carefully and write each sentence. Ready?", "en-GB");
    for (let i = 0; i < p.sentences.length; i++) {
      if (!runningRef.current) return;
      setIdx(i);
      setPhase("reading");
      await speakSmart(`Sentence ${i + 1}.`, "en-GB");
      if (!runningRef.current) return;
      await speakSmart(p.sentences[i], "en-GB");
      if (!runningRef.current) return;
      // Read it a second time, gently, so there's time to write.
      await speakSmart(p.sentences[i], "en-GB");
      if (!runningRef.current) return;
      if (c.confirm) {
        await new Promise<void>((res) => {
          confirmResolveRef.current = res;
          setPhase("confirm");
        });
      } else {
        setPhase("pausing");
        await delay(Math.max(1, c.pause) * 1000);
      }
    }
    if (!runningRef.current) return;
    await speakSmart("All done! Now show me what you wrote. Take a photo to upload.", "en-GB");
    setPhase("write");
  }

  function confirmNext() {
    const r = confirmResolveRef.current;
    confirmResolveRef.current = null;
    setPhase("reading");
    r?.();
  }

  function repeatSentence() {
    const p = passageRef.current;
    if (p) speakSmart(p.sentences[idx], "en-GB");
  }

  function stopReading() {
    runningRef.current = false;
    stopAllSpeech();
    setPhase("write");
  }

  async function submitPhoto() {
    if (!file || !passage) return;
    setPhase("marking");
    setError("");
    try {
      const { b64, mime } = await fileToB64(file);
      const res = await fetch("/api/dictation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task: "mark",
          passage: passage.sentences.join(" "),
          words: config?.words || [],
          imageB64: b64,
          mediaType: mime,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setMark(data.result);
        setPhase("result");
        const m = data.result as DictationMark;
        recordDictation({ profileId, score: m.score, total: m.total, words: config?.words || [] });
        chime(m.total > 0 && m.score / m.total >= 0.6 ? "correct" : "hint");
        speakSmart(m.feedback || "Good effort!", "en-GB");
      } else {
        setError("I couldn't read that photo. Try a clearer one in good light.");
        setPhase("write");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("write");
    }
  }

  const total = passage?.sentences.length || 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-paper/70">
          ← Back
        </button>
        <h2 className="font-pixel text-sm text-grasstop">✍️ Spelling Lab</h2>
        <span className="w-10" />
      </div>

      {phase === "loading" && <p className="mc-card-dark text-center text-paper/80">Getting your words ready…</p>}

      {phase === "nokey" && (
        <div className="mc-card-dark space-y-2 text-center">
          <p className="text-paper/85">Spelling Lab needs the OpenAI key switched on, and some words added in Parent → Settings.</p>
          <PixelButton onClick={onBack}>Back</PixelButton>
        </div>
      )}

      {phase === "intro" && passage && (
        <div className="mc-card-dark space-y-3 text-center">
          <p className="text-4xl">🎧✏️</p>
          <h3 className="font-pixel text-sm text-paper">{passage.title}</h3>
          <p className="text-paper/80">
            I&apos;ll read {total} sentence{total === 1 ? "" : "s"} slowly. Write each one as you hear it. You can tap repeat any time.
          </p>
          <PixelButton onClick={runDictation} className="w-full py-4">
            ▶️ Start listening
          </PixelButton>
        </div>
      )}

      {(phase === "reading" || phase === "confirm" || phase === "pausing") && (
        <div className="mc-card-dark space-y-4 text-center">
          <p className="text-sm text-paper/60">
            Sentence {idx + 1} of {total}
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/40">
            <div
              className="h-full rounded-full bg-grasstop transition-all duration-500"
              style={{ width: `${((idx + (phase === "confirm" || phase === "pausing" ? 1 : 0)) / Math.max(1, total)) * 100}%` }}
            />
          </div>
          <p className="text-5xl">{phase === "reading" ? "🗣️" : "✍️"}</p>
          <p className="text-paper/80">
            {phase === "reading" ? "Listen…" : "Write it down, then carry on."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={repeatSentence} className="rounded-xl border-2 border-black/40 bg-black/20 px-4 py-2 text-sm text-paper">
              🔊 Repeat
            </button>
            {phase === "confirm" && (
              <PixelButton onClick={confirmNext}>Done, next ✏️</PixelButton>
            )}
            <button onClick={stopReading} className="rounded-xl border-2 border-black/40 bg-black/20 px-4 py-2 text-sm text-paper/80">
              I&apos;m finished
            </button>
          </div>
        </div>
      )}

      {phase === "write" && (
        <div className="mc-card-dark space-y-3 text-center">
          <p className="text-4xl">📸</p>
          <p className="text-paper/85">Great writing! Take a clear photo of your page and upload it to get it checked.</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-paper/80 file:mr-3 file:rounded-lg file:border-0 file:bg-grass file:px-4 file:py-2 file:font-pixel file:text-[10px] file:text-white"
          />
          {file && <p className="text-xs text-emerald">Photo ready: {file.name}</p>}
          {error && <p className="text-xs text-redstone">{error}</p>}
          <PixelButton onClick={submitPhoto} disabled={!file} className="w-full py-4">
            ✅ Check my spelling
          </PixelButton>
        </div>
      )}

      {phase === "marking" && <p className="mc-card-dark text-center text-paper/80">Marking your writing…</p>}

      {phase === "result" && mark && (
        <div className="mc-card-dark space-y-3">
          <div className="text-center">
            <p className="text-4xl">{mark.total > 0 && mark.score / mark.total >= 0.6 ? "🌟" : "💪"}</p>
            <p className="font-pixel text-sm text-paper">
              {mark.score} / {mark.total} right
            </p>
          </div>
          <p className="rounded-lg border-2 border-grasstop/40 bg-grass/10 p-3 text-sm text-paper/90">{mark.feedback}</p>
          {mark.mistakes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-paper/60">Words to practise:</p>
              {mark.mistakes.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5 text-sm">
                  <span className="text-redstone line-through">{m.wrong || "—"}</span>
                  <span className="text-paper/50">→</span>
                  <button onClick={() => speakSmart(m.correct, "en-GB")} className="font-semibold text-emerald">
                    {m.correct} 🔊
                  </button>
                </div>
              ))}
            </div>
          )}
          {passage && (
            <details className="text-sm text-paper/70">
              <summary className="cursor-pointer">See the correct passage</summary>
              <p className="mt-2 rounded-lg bg-black/20 p-3">{passage.sentences.join(" ")}</p>
            </details>
          )}
          <PixelButton onClick={onBack} className="w-full">
            Done
          </PixelButton>
        </div>
      )}
    </div>
  );
}
