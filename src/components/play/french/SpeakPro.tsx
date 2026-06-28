"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHandsFree } from "@/lib/french/useHandsFree";
import { diffFrench, encourageFr, praiseFr, type DiffResult } from "@/lib/french/compare";
import { fallbackSentence } from "@/lib/french/scenarios";
import { chime, speakNaturalOnly, stopAllSpeech } from "@/lib/speech";
import type { FrenchSentence } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";

type Phase = "idle" | "loading" | "speak" | "listen" | "feedback";
const LEVEL_KEY = "lq_fr_speak_level";
const MAX_TRIES = 3;

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function SpeakPro({ onBack }: { onBack: () => void }) {
  const { status, level: mic, listen, stopEarly } = useHandsFree();
  const [phase, setPhase] = useState<Phase>("idle");
  const [sentence, setSentence] = useState<FrenchSentence | null>(null);
  const [levelNum, setLevelNum] = useState(1);
  const [tries, setTries] = useState(0);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [praise, setPraise] = useState<{ fr: string; en: string } | null>(null);
  const [noKey, setNoKey] = useState(false);
  const [streak, setStreak] = useState(0);

  const runningRef = useRef(false);
  const levelRef = useRef(1);
  const triesRef = useRef(0);
  const recentRef = useRef<string[]>([]);
  const sentenceRef = useRef<FrenchSentence | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem(LEVEL_KEY) || "1");
    const lv = Math.max(1, Math.min(8, saved || 1));
    levelRef.current = lv;
    setLevelNum(lv);
    return () => {
      runningRef.current = false;
      stopAllSpeech();
    };
  }, []);

  const fetchSentence = useCallback(async (): Promise<FrenchSentence> => {
    try {
      const res = await fetch("/api/french/sentence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ level: levelRef.current, recent: recentRef.current }),
      });
      const data = await res.json();
      if (data.sentence && data.sentence.fr) {
        setNoKey(false);
        return data.sentence as FrenchSentence;
      }
      if (data.fallback) setNoKey(true);
    } catch {
      /* fall through */
    }
    const fb = fallbackSentence(levelRef.current);
    return { fr: fb.fr, en: fb.en, words: [] };
  }, []);

  // Speak the target, then listen hands-free, then judge.
  const speakAndListen = useCallback(async () => {
    const s = sentenceRef.current;
    if (!s || !runningRef.current) return;
    setPhase("speak");
    await speakNaturalOnly(s.fr, "fr-FR");
    if (!runningRef.current) return;
    await wait(250);
    if (!runningRef.current) return;
    setPhase("listen");
    const res = await listen(9000, { prompt: sentenceRef.current?.fr });
    if (!runningRef.current) return;
    await judge(res?.text || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen]);

  const nextRound = useCallback(async () => {
    if (!runningRef.current) return;
    triesRef.current = 0;
    setTries(0);
    setHeard("");
    setResult(null);
    setPraise(null);
    setPhase("loading");
    const s = await fetchSentence();
    if (!runningRef.current) return;
    sentenceRef.current = s;
    setSentence(s);
    recentRef.current = [...recentRef.current, s.fr].slice(-12);
    await speakAndListen();
  }, [fetchSentence, speakAndListen]);

  const judge = useCallback(
    async (said: string) => {
      const s = sentenceRef.current;
      if (!s) return;
      setHeard(said);
      const diff = diffFrench(s.fr, said);
      setResult(diff);
      setPhase("feedback");

      const good = diff.perfect || diff.score >= 0.8;
      if (good) {
        chime("correct");
        const p1 = praiseFr();
        setPraise(p1);
        setStreak((n) => n + 1);
        // Lots of warm French praise, then the correct pronunciation again.
        await speakNaturalOnly(`${p1.fr} ${praiseFr().fr} ${s.fr}`, "fr-FR");
        // Level up a little on a good run.
        if (levelRef.current < 8) {
          levelRef.current += 1;
          setLevelNum(levelRef.current);
          localStorage.setItem(LEVEL_KEY, String(levelRef.current));
        }
        if (!runningRef.current) return;
        await wait(900);
        if (runningRef.current) nextRound();
        return;
      }

      // Not quite — teach, then let them try again (up to MAX_TRIES).
      setStreak(0);
      triesRef.current += 1;
      setTries(triesRef.current);
      const enc = encourageFr();
      setPraise(null);
      // Say encouragement, then model the sentence slowly, then the missed words.
      const missedSpoken = diff.missed.slice(0, 4).join(", ");
      const teach = said.trim()
        ? `${enc.fr} Écoute bien. ${s.fr}.`
        : `Je n'ai pas bien entendu. Écoute. ${s.fr}.`;
      await speakNaturalOnly(teach, "fr-FR");
      if (missedSpoken && runningRef.current) {
        await wait(200);
        await speakNaturalOnly(missedSpoken, "fr-FR");
      }
      if (!runningRef.current) return;

      if (triesRef.current < MAX_TRIES) {
        await wait(700);
        if (!runningRef.current) return;
        setPhase("speak");
        await speakNaturalOnly(s.fr, "fr-FR");
        if (!runningRef.current) return;
        await wait(200);
        setPhase("listen");
        const res = await listen(9000, { prompt: sentenceRef.current?.fr });
        if (!runningRef.current) return;
        await judge(res?.text || "");
      } else {
        // Move on kindly; ease the level down one notch.
        if (levelRef.current > 1) {
          levelRef.current -= 1;
          setLevelNum(levelRef.current);
          localStorage.setItem(LEVEL_KEY, String(levelRef.current));
        }
        await wait(400);
      }
    },
    [listen, nextRound],
  );

  function start() {
    runningRef.current = true;
    nextRound();
  }

  function stop() {
    runningRef.current = false;
    stopEarly();
    setPhase("idle");
  }

  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  const s = sentence;
  const lastTry = triesRef.current >= MAX_TRIES && result && !(result.perfect || result.score >= 0.8);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← French lab
        </button>
        <span className="rounded-lg border-2 border-black/30 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-wide text-paper/55">
          Level {levelNum} · Streak {streak} 🔥
        </span>
      </div>

      {phase === "idle" ? (
        <div className="mc-card-dark space-y-4 text-center">
          <div className="text-5xl">🗣️</div>
          <h3 className="font-pixel text-sm text-diamond">Speak French</h3>
          <p className="text-sm text-paper/75">
            I&apos;ll say a phrase. After the beep just say it back — no buttons. I&apos;ll help you and
            we&apos;ll get harder as you go!
          </p>
          <PixelButton onClick={start} className="w-full py-4 text-sm">
            Start speaking ▶
          </PixelButton>
          {noKey && (
            <p className="text-[11px] text-gold2">
              Tip: add an OpenAI key in Parent → Settings for the natural voice and to hear how you did.
            </p>
          )}
        </div>
      ) : (
        <div className="mc-card-dark space-y-4 text-center">
          <p className="text-xs uppercase tracking-wide text-paper/50">Say this in French</p>
          <div className="text-2xl font-semibold text-gold">{s?.fr}</div>
          <div className="text-sm text-paper/70">{s?.en}</div>

          {/* Status / mic meter */}
          <div className="flex min-h-[64px] flex-col items-center justify-center gap-2">
            {phase === "loading" && <p className="animate-pulse text-sm text-paper/60">Getting a phrase…</p>}
            {phase === "speak" && <p className="text-sm text-diamond">🔊 Listen…</p>}
            {phase === "listen" && (
              <>
                <p className="text-sm text-grasstop">🎙️ Your turn — say it!</p>
                <div className="h-2 w-40 overflow-hidden rounded-full bg-paper/15">
                  <div className="h-full rounded-full bg-grasstop transition-all" style={{ width: `${Math.round(mic * 100)}%` }} />
                </div>
                <button onClick={stopEarly} className="text-[11px] text-paper/45 underline">
                  done
                </button>
              </>
            )}
            {phase === "feedback" && status === "thinking" && (
              <p className="animate-pulse text-sm text-paper/60">Checking…</p>
            )}
            {phase === "feedback" && result && (
              <div className="w-full space-y-1">
                {praise ? (
                  <p className="text-lg font-semibold text-grasstop">
                    {praise.fr} <span className="text-paper/60 text-sm">{praise.en}</span>
                  </p>
                ) : (
                  <p className="text-base font-semibold text-gold2">{encourageHint(result)}</p>
                )}
                {heard && <p className="text-xs text-paper/55">I heard: “{heard}”</p>}
                {!praise && result.missed.length > 0 && (
                  <p className="text-sm text-paper/80">
                    Practise: {result.missed.map((w, i) => (
                      <button
                        key={i}
                        onClick={() => speakNaturalOnly(w, "fr-FR")}
                        className="mx-0.5 rounded bg-redstone/20 px-1.5 py-0.5 text-redstone underline"
                      >
                        {w}
                      </button>
                    ))}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Manual controls (everything also happens automatically) */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => s && speakNaturalOnly(s.fr, "fr-FR")}
              className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/85"
            >
              🔊 Hear again
            </button>
            {lastTry && (
              <PixelButton onClick={() => runningRef.current && nextRound()} className="px-4 py-2 text-xs">
                Next phrase →
              </PixelButton>
            )}
            <button onClick={stop} className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/70">
              ✕ Stop
            </button>
          </div>
          {tries > 0 && !praise && <p className="text-[11px] text-paper/45">Try {tries} of {MAX_TRIES}</p>}
        </div>
      )}
    </div>
  );
}

function encourageHint(r: DiffResult): string {
  if (r.score >= 0.5) return "So close! Let's try once more 💪";
  if (r.score > 0) return "Good try! Listen and say it with me 🎧";
  return "Let's try that again together 🎧";
}
