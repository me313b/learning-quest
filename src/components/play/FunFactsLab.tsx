"use client";

import { useEffect, useRef, useState } from "react";
import { FACT_CATEGORIES } from "@/lib/content";
import { chime, speakSmart, stopAllSpeech } from "@/lib/speech";

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
  const [loadingMore, setLoadingMore] = useState(false);

  const queueRef = useRef<string[]>([]);
  const posRef = useRef(0);
  const seenRef = useRef<Set<string>>(new Set());
  const catRef = useRef("all");
  const toppingRef = useRef(false);
  const liveRef = useRef(true);

  function bankFacts(id: string): string[] {
    if (id === "all") return shuffled(FACT_CATEGORIES.flatMap((c) => c.facts));
    return shuffled(FACT_CATEGORIES.find((c) => c.id === id)?.facts || []);
  }

  function emojiFor(id: string): string {
    if (id === "all") return ["🌟", "🐾", "🚀", "🧠", "🔬", "🌍", "🔢"][Math.floor(Math.random() * 7)];
    return FACT_CATEGORIES.find((c) => c.id === id)?.emoji || "✨";
  }

  function pushUnique(list: string[]) {
    for (const f of list) {
      const key = f.trim().toLowerCase();
      if (!key) continue;
      const already =
        seenRef.current.has(key) || queueRef.current.some((q) => q.trim().toLowerCase() === key);
      if (!already) queueRef.current.push(f);
    }
  }

  // Fetch a fresh batch of AI facts for the category. Falls back to the built-in
  // bank when there's no key, so it always keeps going.
  async function topUp(id: string) {
    if (toppingRef.current) return;
    toppingRef.current = true;
    setLoadingMore(true);
    try {
      const cat = FACT_CATEGORIES.find((c) => c.id === id);
      const res = await fetch("/api/facts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: id === "all" ? "all" : cat?.label || id,
          recent: Array.from(seenRef.current).slice(-40),
          count: 8,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.facts) && data.facts.length) pushUnique(data.facts);
      else pushUnique(bankFacts(id));
    } catch {
      pushUnique(bankFacts(id));
    } finally {
      toppingRef.current = false;
      if (liveRef.current) setLoadingMore(false);
    }
  }

  function showNext(speak = true) {
    if (posRef.current >= queueRef.current.length) {
      const before = queueRef.current.length;
      pushUnique(bankFacts(catRef.current)); // prefer facts not seen yet
      if (queueRef.current.length === before) {
        // Every fact has been seen — start a fresh, reshuffled cycle so the
        // stream keeps going with variety instead of repeating one line.
        seenRef.current.clear();
        queueRef.current.push(...bankFacts(catRef.current));
      }
    }
    const next = queueRef.current[posRef.current] || "Learning new things makes your brain grow!";
    posRef.current += 1;
    seenRef.current.add(next.trim().toLowerCase());
    setFact(next);
    setEmoji(emojiFor(catRef.current));
    if (speak) speakSmart(`Did you know? ${next}`, "en-GB");
    if (posRef.current >= queueRef.current.length - 3) topUp(catRef.current);
  }

  function pickCategory(id: string) {
    setCatId(id);
    catRef.current = id;
    queueRef.current = bankFacts(id).slice(0, 6); // instant buffer
    posRef.current = 0;
    showNext(true);
    topUp(id); // pull fresh AI facts in the background
  }

  useEffect(() => {
    liveRef.current = true;
    catRef.current = "all";
    queueRef.current = bankFacts("all").slice(0, 6);
    posRef.current = 0;
    showNext(false);
    topUp("all");
    return () => {
      liveRef.current = false;
      stopAllSpeech();
    };
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
        {loadingMore ? "Finding more amazing facts…" : "Fresh facts every time — never-ending!"}
      </p>
    </div>
  );
}
