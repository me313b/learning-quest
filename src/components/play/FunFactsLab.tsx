"use client";

import { useEffect, useRef, useState } from "react";
import { FACT_CATEGORIES } from "@/lib/content";
import { chime, speakSmart, stopAllSpeech } from "@/lib/speech";

// Shuffle helper that keeps a per-category running order so facts don't repeat
// until the whole list has been seen.
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL = { id: "all", label: "Everything", emoji: "✨" };

export default function FunFactsLab({ onBack }: { onBack: () => void }) {
  const [catId, setCatId] = useState("all");
  const [fact, setFact] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const queueRef = useRef<string[]>([]);
  const posRef = useRef(0);

  function buildQueue(id: string): string[] {
    if (id === "all") {
      const merged = FACT_CATEGORIES.flatMap((c) => c.facts);
      return shuffled(merged);
    }
    const cat = FACT_CATEGORIES.find((c) => c.id === id);
    return shuffled(cat?.facts || []);
  }

  function emojiFor(id: string): string {
    if (id === "all") return ["🌟", "🐾", "🚀", "🧠", "🔬", "🌍", "🔢"][Math.floor(Math.random() * 7)];
    return FACT_CATEGORIES.find((c) => c.id === id)?.emoji || "✨";
  }

  function showNext(id = catId, speak = true) {
    if (queueRef.current.length === 0 || posRef.current >= queueRef.current.length) {
      queueRef.current = buildQueue(id);
      posRef.current = 0;
    }
    const next = queueRef.current[posRef.current] || "Did you know learning new things makes your brain grow?";
    posRef.current += 1;
    const e = emojiFor(id);
    setFact(next);
    setEmoji(e);
    if (speak) speakSmart(`Did you know? ${next}`, "en-GB");
  }

  function pickCategory(id: string) {
    setCatId(id);
    queueRef.current = buildQueue(id);
    posRef.current = 0;
    showNext(id, true);
  }

  useEffect(() => {
    queueRef.current = buildQueue("all");
    showNext("all", false);
    return () => stopAllSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopAllSpeech();
            onBack();
          }}
          className="text-sm text-paper/70"
        >
          ← Back
        </button>
        <h2 className="font-pixel text-sm text-grasstop">💡 Fun Facts</h2>
        <span className="w-10" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[ALL, ...FACT_CATEGORIES].map((c) => (
          <button
            key={c.id}
            onClick={() => pickCategory(c.id)}
            className={`rounded-full border-2 px-3 py-1.5 text-xs ${
              catId === c.id ? "border-grasstop bg-grass/20 text-paper" : "border-black/40 bg-black/20 text-paper/70"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="mc-card-dark min-h-[230px] space-y-4 text-center">
        <div className="text-6xl">{emoji}</div>
        <p className="px-2 text-xl leading-relaxed text-paper">{fact}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button
            onClick={() => speakSmart(`Did you know? ${fact}`, "en-GB")}
            className="rounded-xl border-2 border-black/40 bg-black/20 px-4 py-2 text-sm text-paper"
          >
            🔊 Read it
          </button>
          <button
            onClick={() => {
              chime("correct");
              showNext();
            }}
            className="rounded-xl border-4 border-diamond/50 bg-diamond/15 px-6 py-2 font-pixel text-[11px] text-paper shadow-pixel"
          >
            Another! →
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-paper/40">
        Over {FACT_CATEGORIES.reduce((n, c) => n + c.facts.length, 0)} facts to discover.
      </p>
    </div>
  );
}
