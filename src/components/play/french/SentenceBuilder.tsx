"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { normFr, praiseFr } from "@/lib/french/compare";
import { fallbackBuilder } from "@/lib/french/scenarios";
import { chime, speakNaturalOnly } from "@/lib/speech";
import type { FrenchBuilder } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";

interface Tile {
  id: number;
  word: string;
}
const TOPICS = ["animals", "food", "family", "school", "playing", "colours"];
const LEVEL_KEY = "lq_fr_build_level";

export default function SentenceBuilder({ onBack }: { onBack: () => void }) {
  const [topic, setTopic] = useState<string>("");
  const [ex, setEx] = useState<FrenchBuilder | null>(null);
  const [bank, setBank] = useState<Tile[]>([]);
  const [build, setBuild] = useState<Tile[]>([]);
  const [status, setStatus] = useState<"" | "correct" | "wrong">("");
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const levelRef = useRef(2);

  useEffect(() => {
    levelRef.current = Math.max(1, Math.min(5, Number(localStorage.getItem(LEVEL_KEY) || "2")));
  }, []);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setStatus("");
    setShowHint(false);
    setBuild([]);
    let data: FrenchBuilder | null = null;
    try {
      const res = await fetch("/api/french/builder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: t, level: levelRef.current }),
      });
      const j = await res.json();
      if (j.exercise && j.exercise.target_fr) {
        data = j.exercise as FrenchBuilder;
        setNoKey(false);
      } else if (j.fallback) {
        setNoKey(true);
      }
    } catch {
      /* fall through */
    }
    if (!data) data = fallbackBuilder() as FrenchBuilder;
    setEx(data);
    const words = [...data.tiles, ...(data.distractors || [])];
    // shuffle
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    setBank(words.map((w, i) => ({ id: i, word: w })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  function pick(t: Tile) {
    if (status === "correct") return;
    setBank((b) => b.filter((x) => x.id !== t.id));
    setBuild((b) => [...b, t]);
    setStatus("");
  }
  function unpick(t: Tile) {
    if (status === "correct") return;
    setBuild((b) => b.filter((x) => x.id !== t.id));
    setBank((b) => [...b, t]);
    setStatus("");
  }

  async function check() {
    if (!ex) return;
    const made = normFr(build.map((t) => t.word).join(" "));
    if (made === normFr(ex.target_fr)) {
      setStatus("correct");
      chime("correct");
      if (levelRef.current < 5) {
        levelRef.current += 1;
        localStorage.setItem(LEVEL_KEY, String(levelRef.current));
      }
      const p = praiseFr();
      await speakNaturalOnly(`${p.fr} ${ex.target_fr}`, "fr-FR");
    } else {
      setStatus("wrong");
    }
  }

  async function showAnswer() {
    if (!ex) return;
    // Lay the correct sentence out for them and read it.
    const correct: Tile[] = ex.target_fr.split(/\s+/).map((w, i) => ({ id: 1000 + i, word: w }));
    setBuild(correct);
    setBank([]);
    setStatus("correct");
    await speakNaturalOnly(ex.target_fr, "fr-FR");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← French lab
        </button>
        <span className="font-pixel text-[11px] text-diamond">🧩 Build a Sentence</span>
      </div>

      {/* Topics */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setTopic("");
            load("");
          }}
          className={`rounded-lg border-2 px-3 py-1 text-xs ${topic === "" ? "border-diamond bg-diamond/15 text-paper" : "border-black/40 bg-black/20 text-paper/65"}`}
        >
          🎲 Surprise
        </button>
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTopic(t);
              load(t);
            }}
            className={`rounded-lg border-2 px-3 py-1 text-xs capitalize ${topic === t ? "border-diamond bg-diamond/15 text-paper" : "border-black/40 bg-black/20 text-paper/65"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mc-card-dark space-y-4">
        <p className="text-center text-xs uppercase tracking-wide text-paper/50">
          Tap the words in order to make a sentence
        </p>

        {/* Build area */}
        <div className="flex min-h-[60px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-paper/25 bg-black/20 p-3">
          {build.length === 0 && <span className="text-sm text-paper/40">Your sentence appears here…</span>}
          {build.map((t) => (
            <motion.button
              key={t.id}
              layout
              onClick={() => unpick(t)}
              className="rounded-lg border-2 border-grasstop/50 bg-grass/15 px-3 py-2 text-base text-paper"
            >
              {t.word}
            </motion.button>
          ))}
        </div>

        {/* Bank */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {loading ? (
            <p className="animate-pulse text-sm text-paper/60">Getting words…</p>
          ) : (
            bank.map((t) => (
              <motion.button
                key={t.id}
                layout
                onClick={() => pick(t)}
                className="rounded-lg border-2 border-black/40 bg-paneldark px-3 py-2 text-base text-paper/90"
              >
                {t.word}
              </motion.button>
            ))
          )}
        </div>

        {/* Feedback */}
        <div className="min-h-[40px] text-center">
          {status === "correct" && ex && (
            <p className="text-base font-semibold text-grasstop">
              ✅ {ex.target_fr} <span className="text-sm text-paper/60">({ex.target_en})</span>
            </p>
          )}
          {status === "wrong" && <p className="text-sm text-redstone">Not quite — try a different order!</p>}
          {showHint && ex && status !== "correct" && (
            <p className="text-[12px] text-gold2">💡 {ex.hint_en || ex.target_en}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setShowHint((h) => !h)}
            className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/85"
          >
            💡 Hint
          </button>
          {status === "correct" ? (
            <PixelButton onClick={() => load(topic)} className="px-4 py-2 text-xs">
              New sentence →
            </PixelButton>
          ) : (
            <>
              <button
                onClick={check}
                disabled={build.length === 0}
                className="rounded-xl border-2 border-grasstop/50 bg-grass/15 px-4 py-2 font-pixel text-[11px] text-paper disabled:opacity-40"
              >
                Check
              </button>
              <button onClick={showAnswer} className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/70">
                Show answer
              </button>
            </>
          )}
        </div>
      </div>
      {noKey && (
        <p className="text-center text-[11px] text-gold2">
          Add an OpenAI key in Parent → Settings for fresh AI sentences on any topic.
        </p>
      )}
    </div>
  );
}
