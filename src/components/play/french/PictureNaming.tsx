"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useHandsFree } from "@/lib/french/useHandsFree";
import { normFr, praiseFr } from "@/lib/french/compare";
import { shufflePictures, type PictureItem } from "@/lib/french/pictureBank";
import { chime, speakNaturalOnly } from "@/lib/speech";
import { PixelButton } from "@/components/ui/primitives";

type Status = "" | "correct" | "wrong" | "revealed";

function accepts(item: PictureItem, answer: string): boolean {
  const a = normFr(answer);
  if (!a) return false;
  const set = new Set<string>([normFr(item.fr), ...item.accept.map(normFr)]);
  // bare last word too (e.g. "chien" from "le chien")
  const bare = normFr(item.fr).split(" ").pop();
  if (bare) set.add(bare);
  if (set.has(a)) return true;
  // accept if they said the noun within a longer phrase
  return bare ? a.split(" ").includes(bare) : false;
}

export default function PictureNaming({ onBack }: { onBack: () => void }) {
  const { status: micStatus, level: mic, listen, stopEarly } = useHandsFree();
  const queue = useMemo(() => shufflePictures(), []);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<Status>("");
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const item = queue[idx % queue.length];

  useEffect(() => {
    // Read the prompt aloud when a new picture appears.
    speakNaturalOnly("Qu'est-ce que c'est ?", "fr-FR");
    setTyped("");
    setStatus("");
    setHeard("");
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  async function win() {
    setStatus("correct");
    setScore((s) => s + 1);
    setDone((d) => d + 1);
    chime("correct");
    const p = praiseFr();
    await speakNaturalOnly(`${p.fr} ${item.fr}`, "fr-FR");
  }

  function check(answer: string) {
    if (status === "correct") return;
    if (accepts(item, answer)) {
      win();
    } else {
      setStatus("wrong");
    }
  }

  async function sayIt() {
    setStatus("");
    const res = await listen(7000);
    const said = (res?.text || "").trim();
    setHeard(said);
    if (said) check(said);
    else setStatus("wrong");
  }

  async function reveal() {
    setStatus("revealed");
    setDone((d) => d + 1);
    await speakNaturalOnly(item.fr, "fr-FR");
  }

  function next() {
    setIdx((i) => i + 1);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← French lab
        </button>
        <span className="rounded-lg border-2 border-black/30 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-wide text-paper/55">
          Score {score} / {done}
        </span>
      </div>

      <div className="mc-card-dark space-y-4 text-center">
        <p className="text-xs uppercase tracking-wide text-paper/50">Qu&apos;est-ce que c&apos;est ? · What is it?</p>
        <motion.div
          key={item.emoji}
          className="text-8xl"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
        >
          {item.emoji}
        </motion.div>

        {/* Type your answer */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.trim()) check(typed);
            }}
            placeholder="Type in French…"
            className="mc-input flex-1 text-base"
            disabled={status === "correct" || status === "revealed"}
          />
          <button
            onClick={() => typed.trim() && check(typed)}
            className="rounded-xl border-2 border-grasstop/50 bg-grass/15 px-4 py-2 font-pixel text-[11px] text-paper"
          >
            Check
          </button>
        </div>

        {/* Or say it */}
        <div className="flex items-center justify-center gap-2">
          {micStatus === "listening" ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-paper/15">
                <div className="h-full rounded-full bg-grasstop" style={{ width: `${Math.round(mic * 100)}%` }} />
              </div>
              <button onClick={stopEarly} className="text-[11px] text-paper/45 underline">
                done
              </button>
            </div>
          ) : (
            <button
              onClick={sayIt}
              disabled={status === "correct" || micStatus === "thinking"}
              className="rounded-xl border-2 border-diamond/50 bg-diamond/10 px-4 py-2 text-sm text-diamond disabled:opacity-40"
            >
              🎤 Say it
            </button>
          )}
        </div>

        {/* Feedback */}
        <div className="min-h-[44px]">
          {status === "correct" && (
            <p className="text-lg font-semibold text-grasstop">
              ✅ {item.fr} <span className="text-sm text-paper/60">({item.en})</span>
            </p>
          )}
          {status === "wrong" && (
            <div className="space-y-1">
              <p className="text-sm text-redstone">Not quite{heard ? ` — I heard “${heard}”` : ""}. Try again, or peek!</p>
            </div>
          )}
          {status === "revealed" && (
            <p className="text-base text-gold">
              It&apos;s <span className="font-semibold">{item.fr}</span> <span className="text-sm text-paper/60">({item.en})</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => speakNaturalOnly(item.fr, "fr-FR")}
            className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/85"
          >
            🔊 Hear it
          </button>
          {status !== "correct" && status !== "revealed" && (
            <button onClick={reveal} className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/70">
              Show answer
            </button>
          )}
          <PixelButton onClick={next} className="px-4 py-2 text-xs">
            Next →
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
