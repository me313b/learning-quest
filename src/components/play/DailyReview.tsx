"use client";

import { useEffect, useRef, useState } from "react";
import { recentWrongAttempts } from "@/lib/data";
import { chime, speakNaturalOnly, speakSmart, stopAllSpeech } from "@/lib/speech";
import { useHandsFree } from "@/lib/french/useHandsFree";
import type { CoachReview } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";

type Phase = "loading" | "nokey" | "empty" | "review";

const SUBJECT_EMOJI: Record<string, string> = {
  maths: "🔢",
  math: "🔢",
  english: "📖",
  reading: "📚",
  french: "🇫🇷",
  science: "🔬",
  physics: "🧪",
  art: "🎨",
};
const emojiFor = (s: string) => SUBJECT_EMOJI[(s || "").toLowerCase()] || "✨";

export default function DailyReview({
  profileId,
  subjects,
  childName,
  onBack,
}: {
  profileId: string;
  subjects: string[];
  childName: string;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [review, setReview] = useState<CoachReview | null>(null);
  const [idx, setIdx] = useState(0);
  const [understood, setUnderstood] = useState<Set<number>>(new Set());
  const [asking, setAsking] = useState(false);
  const [heard, setHeard] = useState("");
  const [answer, setAnswer] = useState("");
  const introReadRef = useRef(false);
  const liveRef = useRef(true);
  const { listen } = useHandsFree();

  useEffect(() => {
    (async () => {
      const mistakes = await recentWrongAttempts(profileId, 8);
      if (mistakes.length === 0) {
        setPhase("empty");
        speakSmart("Nothing to review today. You're doing brilliantly!", "en-GB");
        return;
      }
      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            task: "review",
            mistakes,
            includeFrench: subjects.includes("french"),
          }),
        });
        const data = await res.json();
        if (data.review && Array.isArray(data.review.items) && data.review.items.length) {
          setReview(data.review);
          setPhase("review");
        } else {
          setPhase("nokey");
        }
      } catch {
        setPhase("nokey");
      }
    })();
    return () => {
      liveRef.current = false;
      stopAllSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read the intro once, then read each item as it appears.
  useEffect(() => {
    if (phase !== "review" || !review) return;
    const item = review.items[idx];
    if (!item) return;
    (async () => {
      if (!introReadRef.current) {
        introReadRef.current = true;
        await speakSmart(review.intro, "en-GB");
      }
      if (!liveRef.current) return;
      await speakSmart(`${item.title}. ${item.explanation_en}`, "en-GB");
      if (!liveRef.current) return;
      if (item.example_en) await speakSmart(`Here's an example. ${item.example_en}`, "en-GB");
      if (!liveRef.current) return;
      if (item.french?.explanation) await speakSmart(item.french.explanation, "fr-FR");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase, review]);

  async function ask() {
    setAsking(true);
    setHeard("");
    setAnswer("");
    stopAllSpeech();
    const res = await listen(9000, { language: "en" });
    if (!res || !res.heardSpeech || !res.text.trim()) {
      setAsking(false);
      setAnswer("I didn't quite catch that — tap the mic and try again.");
      return;
    }
    setHeard(res.text);
    const item = review?.items[idx];
    const context = item ? `${item.title}: ${item.explanation_en}` : "";
    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task: "ask", question: res.text, context }),
      });
      const data = await r.json();
      if (data.answer) {
        setAnswer(data.answer);
        // If Atlas replied in French (the child asked in French), say it with a
        // French accent; otherwise English.
        const isFrench =
          /[àâäçéèêëîïôûùüœ]/i.test(data.answer) ||
          /\b(je|tu|le|la|les|un|une|bonjour|oui|non|merci|c'est|tres|très)\b/i.test(data.answer);
        if (liveRef.current) await speakNaturalOnly(data.answer, isFrench ? "fr-FR" : "en-GB");
      } else {
        setAnswer("I can't answer that one right now, but keep going — you're doing great!");
      }
    } catch {
      setAnswer("I can't answer that one right now, but keep going — you're doing great!");
    }
    setAsking(false);
  }

  function tick() {
    setUnderstood((prev) => new Set(prev).add(idx));
    chime("hint");
  }

  function next() {
    if (!review) return;
    if (idx < review.items.length - 1) {
      setAnswer("");
      setHeard("");
      setIdx(idx + 1);
    } else {
      stopAllSpeech();
      onBack();
    }
  }

  if (phase === "loading") {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="mc-card-dark text-center text-paper/80">🛰️ Atlas is looking at your last few days…</p>
      </div>
    );
  }

  if (phase === "empty" || phase === "nokey") {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="mc-card-dark space-y-3 text-center">
          <p className="text-5xl">{phase === "empty" ? "🎉" : "🛰️"}</p>
          <p className="text-paper/85">
            {phase === "empty"
              ? `Nothing to review today, ${childName}. Great job — straight to your quests!`
              : "Atlas needs the OpenAI key switched on to build your review."}
          </p>
          <PixelButton onClick={onBack} className="w-full">
            Let&apos;s go ⚒️
          </PixelButton>
        </div>
      </div>
    );
  }

  const item = review!.items[idx];
  const total = review!.items.length;
  const isUnderstood = understood.has(idx);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { stopAllSpeech(); onBack(); }} className="text-sm text-paper/70">
          ← Skip
        </button>
        <h2 className="font-pixel text-sm text-grasstop">🛰️ Atlas — Today&apos;s review</h2>
        <span className="text-xs text-paper/50">
          {idx + 1}/{total}
        </span>
      </div>

      <div className="mc-card-dark space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{emojiFor(item.subject)}</span>
          <div>
            <h3 className="font-pixel text-sm text-paper">{item.title}</h3>
            <button
              onClick={() => speakSmart(`${item.title}. ${item.explanation_en}`, "en-GB")}
              className="text-xs text-diamond"
            >
              🔊 Hear it again
            </button>
          </div>
        </div>

        <p className="text-base leading-relaxed text-paper/90">{item.explanation_en}</p>

        {item.example_en && (
          <div className="rounded-xl border-2 border-grasstop/40 bg-grass/10 p-3">
            <p className="mb-1 text-xs font-semibold text-grasstop">Worked example</p>
            <p className="whitespace-pre-line text-sm text-paper/90">{item.example_en}</p>
          </div>
        )}

        {item.tip_en && (
          <p className="rounded-xl border-2 border-gold/40 bg-gold/10 p-3 text-sm text-paper/90">💡 {item.tip_en}</p>
        )}

        {item.french && (item.french.explanation || item.french.example) && (
          <div className="rounded-xl border-2 border-diamond/30 bg-diamond/5 p-3 text-sm text-paper/85">
            <p className="mb-1 text-xs font-semibold text-diamond">En français 🇫🇷</p>
            {item.french.explanation && <p>{item.french.explanation}</p>}
            {item.french.example && <p className="mt-1 text-paper/70">{item.french.example}</p>}
            <button
              onClick={() => speakSmart(`${item.french!.explanation} ${item.french!.example}`, "fr-FR")}
              className="mt-1 text-xs text-diamond"
            >
              🔊 Écoute
            </button>
          </div>
        )}

        {/* Ask Atlas */}
        <div className="rounded-xl border-2 border-black/40 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-paper/80">Stuck? Ask Atlas out loud.</p>
            <button
              onClick={ask}
              disabled={asking}
              className="rounded-xl border-2 border-diamond/50 bg-diamond/15 px-4 py-2 text-sm text-paper disabled:opacity-60"
            >
              {asking ? "🎙️ Listening…" : "🎙️ Ask Atlas"}
            </button>
          </div>
          {heard && <p className="mt-2 text-xs text-paper/50">You asked: “{heard}”</p>}
          {answer && <p className="mt-2 rounded-lg bg-black/30 p-2 text-sm text-paper/90">🛰️ {answer}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-paper/90">
          <input type="checkbox" checked={isUnderstood} onChange={tick} className="h-5 w-5" />
          I understand this now ✓
        </label>

        <PixelButton onClick={next} disabled={!isUnderstood} className="w-full py-4">
          {idx < total - 1 ? "Next →" : "Finish & start quests ⚒️"}
        </PixelButton>
      </div>
    </div>
  );
}
