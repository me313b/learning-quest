"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chime, primeVoices, speakLine, stopAllSpeech } from "@/lib/speech";
import { STORIES, type Story } from "@/lib/stories";

const FRENCH_EXPERIMENT_URL = "https://www.thefrenchexperiment.com/stories";

function minutesFor(s: Story): string {
  // Rough watch time: a few seconds per short line.
  const secs = s.lines.length * 7;
  const m = Math.max(1, Math.round(secs / 60));
  return `≈ ${m} min`;
}

export default function StoryCinema({ onBack }: { onBack: () => void }) {
  const [story, setStory] = useState<Story | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showEn, setShowEn] = useState(true);
  const [finished, setFinished] = useState(false);

  // A token used to cancel an in-flight play loop. Bumping it makes the running
  // loop notice it is no longer the active one and stop cleanly.
  const tokenRef = useRef(0);
  const idxRef = useRef(0);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    primeVoices();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      tokenRef.current++;
      stopAllSpeech();
    };
  }, []);

  function setCurrent(i: number) {
    setIdx(i);
    idxRef.current = i;
  }

  function scrollToLine(i: number) {
    const el = lineRefs.current[i];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function openStory(s: Story) {
    tokenRef.current++;
    stopAllSpeech();
    setStory(s);
    setCurrent(0);
    setFinished(false);
    setPlaying(false);
    lineRefs.current = [];
  }

  function leaveStory() {
    tokenRef.current++;
    stopAllSpeech();
    setPlaying(false);
    setFinished(false);
    setStory(null);
  }

  // Speak each line and wait for it to finish before moving on, so the
  // highlight stays in time with the voice. Cancels if the token changes.
  async function runFrom(start: number, s: Story) {
    const myToken = ++tokenRef.current;
    setPlaying(true);
    setFinished(false);
    for (let i = start; i < s.lines.length; i++) {
      if (tokenRef.current !== myToken) return;
      setCurrent(i);
      scrollToLine(i);
      await speakLine(s.lines[i].fr, "fr-FR");
      if (tokenRef.current !== myToken) return;
    }
    if (tokenRef.current === myToken) {
      setPlaying(false);
      setFinished(true);
      chime("done");
    }
  }

  function play() {
    if (!story) return;
    const start = finished ? 0 : idxRef.current;
    setFinished(false);
    runFrom(start, story);
  }

  function pause() {
    tokenRef.current++;
    stopAllSpeech();
    setPlaying(false);
  }

  function sayOne(i: number) {
    if (!story) return;
    tokenRef.current++;
    stopAllSpeech();
    setPlaying(false);
    setFinished(false);
    setCurrent(i);
    scrollToLine(i);
    speakLine(story.lines[i].fr, "fr-FR");
  }

  function step(delta: number) {
    if (!story) return;
    const next = Math.min(story.lines.length - 1, Math.max(0, idxRef.current + delta));
    sayOne(next);
  }

  // ----------------------------------------------------------------------- //
  // Player view
  // ----------------------------------------------------------------------- //
  if (story) {
    const line = story.lines[idx];
    const progress = ((idx + 1) / story.lines.length) * 100;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={leaveStory} className="text-[11px] text-paper/60 underline">
            ← All films
          </button>
          <span className="font-pixel text-[10px] text-gold2">🎬 {story.titleEn}</span>
          <button
            onClick={() => setShowEn((v) => !v)}
            className={`rounded-lg border-2 px-2.5 py-1 text-[10px] ${
              showEn ? "border-diamond/60 bg-diamond/15 text-paper" : "border-black/40 bg-black/25 text-paper/60"
            }`}
          >
            {showEn ? "EN subtitles: on" : "EN subtitles: off"}
          </button>
        </div>

        {/* The "screen" */}
        <div
          className="relative overflow-hidden rounded-2xl border-4 border-black/60 p-5 shadow-pixel"
          style={{ background: `radial-gradient(120% 120% at 50% 0%, ${story.tint}22 0%, rgba(12,10,18,0.98) 60%)` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-pixel text-[10px] text-paper/55">{story.title}</div>
            <div className="font-pixel text-[10px] text-paper/45">
              {idx + 1} / {story.lines.length}
            </div>
          </div>

          <div className="grid min-h-[150px] place-items-center text-center">
            <div>
              <div className="mb-3 text-5xl">{story.emoji}</div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-1 text-2xl font-semibold leading-snug text-paper"
                >
                  {line.fr}
                </motion.p>
              </AnimatePresence>
              {showEn && (
                <p className="mt-2 px-1 text-sm italic text-paper/55">{line.en}</p>
              )}
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/40">
            <motion.div
              className="h-full rounded-full"
              style={{ background: story.tint }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => step(-1)}
            disabled={idx === 0}
            className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2.5 font-pixel text-xs text-paper disabled:opacity-30"
          >
            ⏮
          </button>
          <button
            onClick={() => sayOne(idx)}
            className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2.5 font-pixel text-xs text-paper"
          >
            🔁 Line
          </button>
          {playing ? (
            <button onClick={pause} className="rounded-xl border-4 border-black/50 bg-gold px-7 py-2.5 font-pixel text-xs text-black shadow-pixel">
              ⏸ Pause
            </button>
          ) : (
            <button onClick={play} className="rounded-xl border-4 border-black/50 bg-grass px-7 py-2.5 font-pixel text-xs text-white shadow-pixel">
              ▶ {finished ? "Replay" : idx === 0 ? "Play" : "Resume"}
            </button>
          )}
          <button
            onClick={() => step(1)}
            disabled={idx >= story.lines.length - 1}
            className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2.5 font-pixel text-xs text-paper disabled:opacity-30"
          >
            ⏭
          </button>
        </div>

        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="rounded-xl border-4 border-emerald/70 bg-emerald/20 px-4 py-3 text-center font-pixel text-[11px] text-grasstop"
            >
              🎉 The End — Bravo ! You watched the whole film.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full script — tap any line to hear it */}
        <div className="rounded-2xl border-4 border-black/50 p-3 shadow-pixel" style={{ background: "linear-gradient(180deg, rgba(46,38,58,0.97), rgba(20,16,28,0.97))" }}>
          <p className="mb-2 font-pixel text-[10px] text-paper/55">📜 Script — tap a line to hear it</p>
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {story.lines.map((l, i) => (
              <button
                key={i}
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                onClick={() => sayOne(i)}
                className={`block w-full rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                  i === idx ? "border-gold/70 bg-gold/15" : "border-transparent bg-black/20 hover:bg-black/30"
                }`}
              >
                <span className={`text-sm ${i === idx ? "text-gold2" : "text-paper/85"}`}>{l.fr}</span>
                {showEn && <span className="mt-0.5 block text-[11px] italic text-paper/45">{l.en}</span>}
              </button>
            ))}
          </div>
        </div>

        <a
          href={FRENCH_EXPERIMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border-2 border-dashed border-paper/25 bg-black/20 px-4 py-2.5 text-center text-[11px] text-paper/60"
        >
          🔊 Want native French voices? Hear these tales read by French speakers at The French Experiment ↗
        </a>
      </div>
    );
  }

  // ----------------------------------------------------------------------- //
  // Film selection
  // ----------------------------------------------------------------------- //
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← Fun
        </button>
        <span className="w-10" />
      </div>

      <div
        className="rounded-2xl border-4 border-black/50 p-4 shadow-pixel"
        style={{ background: "linear-gradient(160deg, rgba(124,92,224,0.22), rgba(20,16,28,0.96))" }}
      >
        <h2 className="flex items-center gap-2 font-pixel text-sm text-gold2">
          <span className="text-2xl">🎬</span> French Story Cinema
        </h2>
        <p className="mt-1.5 text-xs text-paper/65">
          Watch a story film in French. The words light up as they are read, with English subtitles you can switch off.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STORIES.map((s) => (
          <motion.button
            key={s.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => openStory(s)}
            className="flex items-center gap-3 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel"
            style={{ background: `linear-gradient(160deg, ${s.tint}22, rgba(20,16,28,0.96))` }}
          >
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-3xl"
              style={{ background: `${s.tint}22`, boxShadow: `inset 0 0 0 2px ${s.tint}55` }}
            >
              {s.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-pixel text-[11px] leading-tight text-paper">{s.title}</span>
              <span className="block text-[11px] text-paper/55">{s.titleEn}</span>
              <span className="mt-1 block text-[10px] text-paper/40">
                {s.level} · {minutesFor(s)}
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      <a
        href={FRENCH_EXPERIMENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border-4 border-diamond/40 p-3 text-left shadow-pixel"
        style={{ background: "linear-gradient(160deg, rgba(79,214,214,0.16), rgba(20,16,28,0.96))" }}
      >
        <span className="text-3xl">🔊</span>
        <span>
          <span className="block font-pixel text-[11px] text-diamond">More stories with native voices ↗</span>
          <span className="block text-[11px] text-paper/55">Classic tales read by French speakers at The French Experiment</span>
        </span>
      </a>
    </div>
  );
}
