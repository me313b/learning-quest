"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chime, primeVoices, speakSmart, stopAllSpeech } from "@/lib/speech";
import FrenchAudioLab from "../FrenchAudioLab";
import FrenchReadingLab from "../FrenchReadingLab";
import SpeakPro from "../french/SpeakPro";
import Conversation from "../french/Conversation";
import PictureNaming from "../french/PictureNaming";
import SentenceBuilder from "../french/SentenceBuilder";
import SpellingLab from "../SpellingLab";
import ExternalLibrary from "../explore/ExternalLibrary";
import FunFactsLab from "../FunFactsLab";
import GeneratedLab from "../GeneratedLab";
import PhysicsLab from "../PhysicsLab";
import PhetLibrary from "../phet/PhetLibrary";
import { LAB_SUBJECTS, type LabSubject } from "@/lib/labs";

// Hand-built, reliable, interactive labs — no AI generation, nothing that can
// half-load. Each one is a small Minecraft-themed mini-game that animates,
// talks to the child, and works every time. They run entirely in the browser.

const C = {
  grass: "#7BC043",
  emerald: "#2FA84F",
  gold: "#F2B233",
  diamond: "#4FD6D6",
  redstone: "#E0533D",
  dirt: "#8B5A2B",
  stone: "#9A9A9A",
  lapis: "#3A6FD8",
  gold2: "#FFD970",
};

// --------------------------------------------------------------------------- //
// Shared bits
// --------------------------------------------------------------------------- //
function Block({ color, size = 34, label, glow }: { color: string; size?: number; label?: string; glow?: boolean }) {
  return (
    <div
      className="relative grid place-items-center rounded-[6px] font-pixel text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color} 0%, ${color} 60%, rgba(0,0,0,0.25) 100%)`,
        boxShadow: glow
          ? `0 0 0 2px rgba(0,0,0,0.45), 0 0 14px ${color}`
          : "inset 0 3px 0 rgba(255,255,255,0.28), inset 0 -4px 0 rgba(0,0,0,0.32), 0 0 0 2px rgba(0,0,0,0.45)",
        fontSize: size * 0.34,
      }}
    >
      {label}
    </div>
  );
}

function SpeakRow({ value }: { value: number | string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => speakSmart(String(value), "en-GB")}
        className="rounded-lg border-2 border-diamond/50 bg-diamond/10 px-3 py-1.5 text-xs text-paper"
      >
        🔊 English
      </button>
      <button
        onClick={() => speakSmart(String(value), "fr-FR")}
        className="rounded-lg border-2 border-gold/50 bg-gold/10 px-3 py-1.5 text-xs text-paper"
      >
        🔊 Français
      </button>
    </div>
  );
}

function LabFrame({
  title,
  emoji,
  intro,
  onBack,
  children,
}: {
  title: string;
  emoji: string;
  intro: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    primeVoices();
    const t = setTimeout(() => speakSmart(intro, "en-GB"), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← Labs
        </button>
        <button
          onClick={() => speakSmart(intro, "en-GB")}
          aria-label="Hear instructions"
          className="rounded-lg border-2 border-black/40 bg-black/25 px-2.5 py-1 text-sm"
        >
          🔊
        </button>
      </div>

      <div
        className="rounded-2xl border-4 border-black/50 p-5 shadow-pixel"
        style={{ background: "linear-gradient(180deg, rgba(46,38,58,0.97) 0%, rgba(20,16,28,0.97) 100%)" }}
      >
        <h2 className="mb-4 flex items-center gap-2 font-pixel text-sm text-grasstop">
          <span className="text-2xl">{emoji}</span>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function Win({ show, text }: { show: boolean; text: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          className="rounded-xl border-4 border-emerald/70 bg-emerald/20 px-4 py-3 text-center font-pixel text-xs text-grasstop"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --------------------------------------------------------------------------- //
// 1) Place Value — "Diamond Vault"
// --------------------------------------------------------------------------- //
function PlaceValueLab({ onBack }: { onBack: () => void }) {
  const [h, setH] = useState(0);
  const [t, setT] = useState(0);
  const [o, setO] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const total = h * 100 + t * 10 + o;
  const won = target !== null && total === target;

  useEffect(() => {
    if (won) {
      chime("done");
      speakSmart(`Yes! You built ${target}. Brilliant!`, "en-GB");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  function newChallenge() {
    setH(0);
    setT(0);
    setO(0);
    const tt = Math.floor(Math.random() * 899) + 100;
    setTarget(tt);
    setTimeout(() => speakSmart(`Can you build the number ${tt}?`, "en-GB"), 250);
  }

  const cols: { name: string; val: number; set: (n: number) => void; color: string; place: string }[] = [
    { name: "Hundreds", val: h, set: setH, color: C.emerald, place: "100" },
    { name: "Tens", val: t, set: setT, color: C.gold, place: "10" },
    { name: "Ones", val: o, set: setO, color: C.diamond, place: "1" },
  ];

  return (
    <LabFrame title="Diamond Vault" emoji="💎" intro="Tap plus to add blocks. Hundreds, tens and ones. Build the number!" onBack={onBack}>
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-black/40 bg-black/30 py-3 text-center">
          <div className="font-pixel text-3xl text-gold2">{total}</div>
          {target !== null && (
            <div className="mt-1 text-xs text-paper/70">
              Target: <span className="font-bold text-diamond">{target}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {cols.map((c) => (
            <div key={c.name} className="rounded-xl border-2 border-black/40 bg-black/20 p-2 text-center">
              <div className="font-pixel text-[9px] text-paper/70">{c.name}</div>
              <div className="text-[10px] text-paper/40">×{c.place}</div>
              <div className="my-2 flex min-h-[112px] flex-col-reverse items-center gap-1">
                <AnimatePresence>
                  {Array.from({ length: c.val }).map((_, i) => (
                    <motion.div key={i} initial={{ y: -20, opacity: 0, scale: 0.5 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }}>
                      <Block color={c.color} size={26} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="font-pixel text-base text-paper">{c.val}</div>
              <div className="mt-1 flex justify-center gap-1">
                <button onClick={() => c.set(Math.max(0, c.val - 1))} className="h-8 w-8 rounded-lg border-2 border-black/40 bg-black/40 font-pixel text-paper">−</button>
                <button onClick={() => { if (c.val < 9) { c.set(c.val + 1); chime("hint"); } }} className="h-8 w-8 rounded-lg border-2 border-black/40 font-pixel text-white" style={{ background: c.color }}>＋</button>
              </div>
            </div>
          ))}
        </div>

        <SpeakRow value={total} />
        <Win show={won} text={`🎉 You built ${target}!`} />

        <div className="flex gap-2">
          <button onClick={newChallenge} className="flex-1 rounded-xl border-4 border-black/40 bg-grass px-4 py-2.5 font-pixel text-[11px] text-white">
            🎯 {target === null ? "Give me a number!" : "New number"}
          </button>
          <button onClick={() => { setH(0); setT(0); setO(0); }} className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2.5 font-pixel text-[10px] text-paper/70">
            Clear
          </button>
        </div>
      </div>
    </LabFrame>
  );
}

// --------------------------------------------------------------------------- //
// 2) Multiplication arrays — "Mob Farm"
// --------------------------------------------------------------------------- //
const MOBS = ["🐷", "🐮", "🐔", "🐑", "🐰"];
function ArrayLab({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [mob, setMob] = useState("🐷");
  const total = rows * cols;

  const step = (set: (n: number) => void, val: number, d: number) => {
    const n = Math.min(8, Math.max(1, val + d));
    set(n);
    chime("hint");
  };

  return (
    <LabFrame title="Mob Farm" emoji="🐷" intro="Make rows and columns of animals. How many in total? That is multiplication!" onBack={onBack}>
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Stepper label="Rows" val={rows} onMinus={() => step(setRows, rows, -1)} onPlus={() => step(setRows, rows, 1)} />
          <span className="font-pixel text-lg text-paper">×</span>
          <Stepper label="Columns" val={cols} onMinus={() => step(setCols, cols, -1)} onPlus={() => step(setCols, cols, 1)} />
        </div>

        <div className="rounded-xl border-2 border-black/40 bg-black/25 p-3">
          <div className="mx-auto flex w-fit flex-col gap-1">
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} className="flex gap-1">
                {Array.from({ length: cols }).map((_, c) => (
                  <motion.span
                    key={c}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (r * cols + c) * 0.02 }}
                    className="grid h-8 w-8 place-items-center rounded-md text-lg"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    {mob}
                  </motion.span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border-2 border-gold/40 bg-gold/10 py-2 text-center font-pixel text-sm text-gold2">
          {rows} × {cols} = {total}
        </div>
        <SpeakRow value={`${rows} times ${cols} is ${total}`} />

        <div className="flex justify-center gap-1.5">
          {MOBS.map((m) => (
            <button key={m} onClick={() => setMob(m)} className={`grid h-9 w-9 place-items-center rounded-lg border-2 text-lg ${mob === m ? "border-grasstop bg-grass/25" : "border-black/40 bg-black/25"}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </LabFrame>
  );
}

function Stepper({ label, val, onMinus, onPlus }: { label: string; val: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="text-center">
      <div className="font-pixel text-[9px] text-paper/60">{label}</div>
      <div className="mt-1 flex items-center gap-1">
        <button onClick={onMinus} className="h-9 w-9 rounded-lg border-2 border-black/40 bg-black/40 font-pixel text-paper">−</button>
        <div className="w-9 font-pixel text-lg text-paper">{val}</div>
        <button onClick={onPlus} className="h-9 w-9 rounded-lg border-2 border-black/40 bg-grass font-pixel text-white">＋</button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- //
// 3) Number line — "Redstone Hops"
// --------------------------------------------------------------------------- //
function NumberLineLab({ onBack }: { onBack: () => void }) {
  const MAX = 20;
  const [a, setA] = useState(4);
  const [b, setB] = useState(5);
  const [pos, setPos] = useState(4);
  const target = a + b;
  const won = pos === target;

  const reset = useCallback(() => {
    setPos(a);
  }, [a]);

  function newProblem() {
    const na = Math.floor(Math.random() * 8) + 1;
    const nb = Math.floor(Math.random() * 9) + 1;
    setA(na);
    setB(nb);
    setPos(na);
    setTimeout(() => speakSmart(`Start at ${na}. Hop ${nb} steps forward!`, "en-GB"), 250);
  }

  useEffect(() => {
    if (won) {
      chime("done");
      speakSmart(`You landed on ${target}! ${a} plus ${b} is ${target}.`, "en-GB");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  return (
    <LabFrame title="Redstone Hops" emoji="🟥" intro="Help Steve hop along the line to solve the sum. Press hop to jump forward!" onBack={onBack}>
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-redstone/40 bg-redstone/10 py-2 text-center font-pixel text-base text-paper">
          {a} + {b} = ?
        </div>

        <div className="relative rounded-xl border-2 border-black/40 bg-black/25 px-2 pb-6 pt-9">
          <motion.div
            className="absolute top-1 text-2xl"
            animate={{ left: `calc(${(pos / MAX) * 100}% - 12px)` }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            🧍
          </motion.div>
          <div className="flex justify-between">
            {Array.from({ length: MAX + 1 }).map((n, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: `${100 / (MAX + 1)}%` }}>
                <div className={`h-3 w-0.5 ${i === target ? "bg-emerald" : "bg-paper/30"}`} />
                {i % 5 === 0 && <span className="mt-0.5 text-[8px] text-paper/50">{i}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPos((p) => Math.max(0, p - 1))} className="rounded-xl border-2 border-black/40 bg-black/40 px-4 py-2 font-pixel text-xs text-paper">
            ◀ −1
          </button>
          <div className="w-16 text-center font-pixel text-lg text-gold2">{pos}</div>
          <button onClick={() => { setPos((p) => Math.min(MAX, p + 1)); chime("hint"); }} className="rounded-xl border-2 border-black/40 bg-grass px-4 py-2 font-pixel text-xs text-white">
            +1 ▶
          </button>
        </div>

        <Win show={won} text={`🎉 ${a} + ${b} = ${target}!`} />

        <div className="flex gap-2">
          <button onClick={newProblem} className="flex-1 rounded-xl border-4 border-black/40 bg-grass px-4 py-2.5 font-pixel text-[11px] text-white">
            🎲 New sum
          </button>
          <button onClick={() => reset()} className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2.5 font-pixel text-[10px] text-paper/70">
            Back to start
          </button>
        </div>
      </div>
    </LabFrame>
  );
}

// --------------------------------------------------------------------------- //
// 4) Area & perimeter — "Build a Plot"
// --------------------------------------------------------------------------- //
function AreaLab({ onBack }: { onBack: () => void }) {
  const N = 6;
  const [cells, setCells] = useState<boolean[]>(() => Array(N * N).fill(false));
  const [target, setTarget] = useState(8);
  const area = cells.filter(Boolean).length;
  const won = area === target;

  function toggle(i: number) {
    setCells((cs) => {
      const next = [...cs];
      next[i] = !next[i];
      return next;
    });
    chime("hint");
  }

  useEffect(() => {
    if (won) {
      chime("done");
      speakSmart(`Perfect! Your plot has an area of ${target} blocks.`, "en-GB");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  function newTarget() {
    setCells(Array(N * N).fill(false));
    const tt = Math.floor(Math.random() * 10) + 4;
    setTarget(tt);
    setTimeout(() => speakSmart(`Build a plot with an area of ${tt} blocks.`, "en-GB"), 250);
  }

  return (
    <LabFrame title="Build a Plot" emoji="🟩" intro="Tap squares to lay grass blocks. The area is how many blocks you place!" onBack={onBack}>
      <div className="space-y-4">
        <div className="flex justify-around rounded-xl border-2 border-black/40 bg-black/25 py-2 text-center">
          <div>
            <div className="font-pixel text-[9px] text-paper/60">AREA</div>
            <div className="font-pixel text-lg text-grasstop">{area}</div>
          </div>
          <div>
            <div className="font-pixel text-[9px] text-paper/60">TARGET</div>
            <div className="font-pixel text-lg text-diamond">{target}</div>
          </div>
        </div>

        <div className="mx-auto grid w-fit gap-1" style={{ gridTemplateColumns: `repeat(${N}, 2.2rem)` }}>
          {cells.map((on, i) => (
            <button key={i} onClick={() => toggle(i)} className="h-9 w-9 rounded-md border-2 border-black/40" style={{ background: on ? `linear-gradient(135deg, ${C.grass}, ${C.emerald})` : "rgba(255,255,255,0.05)" }}>
              {on ? "" : ""}
            </button>
          ))}
        </div>

        <Win show={won} text={`🎉 Area = ${target}!`} />

        <button onClick={newTarget} className="w-full rounded-xl border-4 border-black/40 bg-grass px-4 py-2.5 font-pixel text-[11px] text-white">
          🎯 New challenge
        </button>
      </div>
    </LabFrame>
  );
}

// --------------------------------------------------------------------------- //
// 5) Gravity sandbox — "Block Drop" (real canvas physics)
// --------------------------------------------------------------------------- //
interface Body {
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
  resting: boolean;
}
function GravityLab({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bodiesRef = useRef<Body[]>([]);
  const gravityRef = useRef(0.5);
  const [moon, setMoon] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const palette = [C.emerald, C.gold, C.diamond, C.redstone, C.lapis];

  useEffect(() => {
    gravityRef.current = moon ? 0.09 : 0.5;
  }, [moon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = 280);
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // ground
      ctx.fillStyle = "rgba(123,192,67,0.25)";
      ctx.fillRect(0, H - 14, W, 14);
      for (const b of bodiesRef.current) {
        if (!b.resting) {
          b.vy += gravityRef.current;
          b.y += b.vy;
          const floor = H - 14 - b.size;
          if (b.y >= floor) {
            b.y = floor;
            b.vy *= -0.45;
            if (Math.abs(b.vy) < 1.1) {
              b.vy = 0;
              b.resting = true;
            }
          }
        }
        // block with bevel
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.size, b.size);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(b.x, b.y, b.size, 5);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(b.x, b.y + b.size - 5, b.size, 5);
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.strokeRect(b.x, b.y, b.size, b.size);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  function drop(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
    const x = Math.min(rect.width - 34, Math.max(0, (clientX ?? rect.width / 2) - rect.left - 17));
    bodiesRef.current.push({ x, y: -34, vy: 0, size: 30, color: palette[colorIdx], resting: false });
    if (bodiesRef.current.length > 40) bodiesRef.current.shift();
    chime("hint");
  }

  return (
    <LabFrame title="Block Drop" emoji="🧱" intro="Tap the sky to drop blocks! Watch them fall and bounce. Try Moon gravity!" onBack={onBack}>
      <div className="space-y-3">
        <canvas
          ref={canvasRef}
          onClick={drop}
          onTouchStart={drop}
          className="w-full cursor-pointer rounded-xl border-2 border-black/40"
          style={{ background: "linear-gradient(180deg, #2b3a67 0%, #1a2342 100%)", touchAction: "none" }}
        />
        <p className="text-center text-xs text-paper/60">👆 Tap the sky to drop a block</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => setMoon((m) => !m)} className={`rounded-xl border-2 px-3 py-1.5 font-pixel text-[10px] ${moon ? "border-diamond bg-diamond/20 text-paper" : "border-black/40 bg-black/30 text-paper/70"}`}>
            {moon ? "🌙 Moon gravity" : "🌍 Earth gravity"}
          </button>
          <button onClick={() => { bodiesRef.current = []; }} className="rounded-xl border-2 border-black/40 bg-black/30 px-3 py-1.5 font-pixel text-[10px] text-paper/70">
            🧹 Clear
          </button>
          <div className="flex gap-1">
            {palette.map((p, i) => (
              <button key={p} onClick={() => setColorIdx(i)} className="h-7 w-7 rounded-md border-2" style={{ background: p, borderColor: colorIdx === i ? "#fff" : "rgba(0,0,0,0.4)" }} />
            ))}
          </div>
        </div>
      </div>
    </LabFrame>
  );
}

// --------------------------------------------------------------------------- //
// 6) Note blocks — "Music Maker"
// --------------------------------------------------------------------------- //
const NOTES = [
  { n: "C", f: 261.6, c: C.redstone },
  { n: "D", f: 293.7, c: C.gold },
  { n: "E", f: 329.6, c: C.grass },
  { n: "F", f: 349.2, c: C.emerald },
  { n: "G", f: 392.0, c: C.diamond },
  { n: "A", f: 440.0, c: C.lapis },
  { n: "B", f: 493.9, c: "#9B59B6" },
  { n: "C²", f: 523.3, c: C.redstone },
];
function NoteBlockLab({ onBack }: { onBack: () => void }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const [active, setActive] = useState<number | null>(null);

  function ac(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) ctxRef.current = new AC();
    return ctxRef.current;
  }

  function play(i: number) {
    const ctx = ac();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = NOTES[i].f;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.55);
    setActive(i);
    setTimeout(() => setActive((a) => (a === i ? null : a)), 220);
  }

  async function playSong() {
    // "Mary had a little lamb" style: E D C D E E E
    const seq = [2, 1, 0, 1, 2, 2, 2];
    for (const i of seq) {
      play(i);
      await new Promise((r) => setTimeout(r, 320));
    }
  }

  return (
    <LabFrame title="Music Maker" emoji="🎵" intro="Tap the note blocks to play music! Each block is a different note." onBack={onBack}>
      <div className="space-y-4">
        <div className="flex flex-wrap justify-center gap-2">
          {NOTES.map((note, i) => (
            <motion.button
              key={note.n}
              onClick={() => play(i)}
              animate={active === i ? { y: -8, scale: 1.08 } : { y: 0, scale: 1 }}
              className="grid h-16 w-12 place-items-center rounded-lg border-2 border-black/50 font-pixel text-white"
              style={{
                background: `linear-gradient(135deg, ${note.c}, rgba(0,0,0,0.3))`,
                boxShadow: active === i ? `0 0 16px ${note.c}` : "inset 0 3px 0 rgba(255,255,255,0.25), inset 0 -4px 0 rgba(0,0,0,0.3)",
              }}
            >
              {note.n}
            </motion.button>
          ))}
        </div>

        <button onClick={playSong} className="w-full rounded-xl border-4 border-black/40 bg-grass px-4 py-2.5 font-pixel text-[11px] text-white">
          ▶ Play a tune
        </button>
        <p className="text-center text-xs text-paper/50">Tip: try tapping them in order to play a scale!</p>
      </div>
    </LabFrame>
  );
}

// --------------------------------------------------------------------------- //
// Hub
// --------------------------------------------------------------------------- //
type LabId = "place" | "array" | "line" | "area" | "gravity" | "music";

const LAB_CARDS: { id: LabId; title: string; emoji: string; blurb: string; tint: string }[] = [
  { id: "place", title: "Diamond Vault", emoji: "💎", blurb: "Build big numbers with blocks", tint: C.diamond },
  { id: "array", title: "Mob Farm", emoji: "🐷", blurb: "Rows & columns = times tables", tint: C.grass },
  { id: "line", title: "Redstone Hops", emoji: "🟥", blurb: "Hop the number line to add", tint: C.redstone },
  { id: "area", title: "Build a Plot", emoji: "🟩", blurb: "Lay blocks and find the area", tint: C.emerald },
  { id: "gravity", title: "Block Drop", emoji: "🧱", blurb: "Drop blocks & play with gravity", tint: C.lapis },
  { id: "music", title: "Music Maker", emoji: "🎵", blurb: "Tap note blocks to make tunes", tint: C.gold },
];

type View = LabId | "fr-audio" | "fr-reading" | "fr-speak" | "fr-talk" | "fr-name" | "fr-build" | "spelling" | "explore" | "facts" | "surprise" | "physics" | "science" | null;

export default function InteractiveLabs({ onExit, profileId }: { onExit: () => void; profileId: string }) {
  const [view, setView] = useState<View>(null);

  // Stop any spoken audio the moment the child opens or leaves a lab.
  useEffect(() => {
    stopAllSpeech();
  }, [view]);
  const [surprise, setSurprise] = useState<LabSubject | null>(null);

  if (view === "place") return <PlaceValueLab onBack={() => setView(null)} />;
  if (view === "array") return <ArrayLab onBack={() => setView(null)} />;
  if (view === "line") return <NumberLineLab onBack={() => setView(null)} />;
  if (view === "area") return <AreaLab onBack={() => setView(null)} />;
  if (view === "gravity") return <GravityLab onBack={() => setView(null)} />;
  if (view === "music") return <NoteBlockLab onBack={() => setView(null)} />;
  if (view === "physics") return <PhysicsLab onBack={() => setView(null)} />;
  if (view === "science") return <PhetLibrary onBack={() => setView(null)} profileId={profileId} />;
  if (view === "fr-audio") return <FrenchAudioLab onBack={() => setView(null)} />;
  if (view === "fr-reading") return <FrenchReadingLab onBack={() => setView(null)} />;
  if (view === "fr-speak") return <SpeakPro onBack={() => setView(null)} />;
  if (view === "fr-talk") return <Conversation onBack={() => setView(null)} />;
  if (view === "fr-name") return <PictureNaming onBack={() => setView(null)} />;
  if (view === "fr-build") return <SentenceBuilder onBack={() => setView(null)} />;
  if (view === "spelling") return <SpellingLab onBack={() => setView(null)} profileId={profileId} />;
  if (view === "explore") return <ExternalLibrary onBack={() => setView(null)} />;
  if (view === "facts") return <FunFactsLab onBack={() => setView(null)} />;
  if (view === "surprise" && surprise) return <GeneratedLab subject={surprise} onBack={() => setView(null)} />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-4 border-black/50 p-4 shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(46,38,58,0.96), rgba(20,16,28,0.96))" }}>
        <h2 className="flex items-center gap-2 font-pixel text-sm text-grasstop">
          <span className="text-2xl">🧪</span> Labs
        </h2>
        <p className="mt-1.5 text-xs text-paper/65">Tap a block to play. Everything here is hands-on!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LAB_CARDS.map((c) => (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView(c.id)}
            className="flex flex-col items-start gap-1 rounded-2xl border-4 border-black/50 p-4 text-left shadow-pixel"
            style={{ background: "linear-gradient(160deg, rgba(46,38,58,0.96), rgba(20,16,28,0.96))" }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ background: `${c.tint}22`, boxShadow: `inset 0 0 0 2px ${c.tint}55` }}>
              {c.emoji}
            </span>
            <span className="mt-1 font-pixel text-[11px] text-paper">{c.title}</span>
            <span className="text-[11px] leading-snug text-paper/60">{c.blurb}</span>
          </motion.button>
        ))}
      </div>

      {/* Science & physics — real interactive experiments */}
      <div className="space-y-2">
        <p className="font-pixel text-[10px] text-paper/50">🔬 Science &amp; physics</p>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("physics")}
            className="flex flex-col items-start gap-1 rounded-2xl border-4 border-black/50 p-4 text-left shadow-pixel"
            style={{ background: "linear-gradient(160deg, rgba(224,83,61,0.20), rgba(20,16,28,0.96))" }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ background: "rgba(224,83,61,0.18)", boxShadow: "inset 0 0 0 2px rgba(224,83,61,0.4)" }}>
              🧲
            </span>
            <span className="mt-1 font-pixel text-[11px] text-paper">Physics Lab</span>
            <span className="text-[11px] leading-snug text-paper/60">Ramps, falling, floating, shadows</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("science")}
            className="flex flex-col items-start gap-1 rounded-2xl border-4 border-black/50 p-4 text-left shadow-pixel"
            style={{ background: "linear-gradient(160deg, rgba(79,214,214,0.18), rgba(20,16,28,0.96))" }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ background: "rgba(79,214,214,0.16)", boxShadow: "inset 0 0 0 2px rgba(79,214,214,0.4)" }}>
              🔬
            </span>
            <span className="mt-1 font-pixel text-[11px] text-paper">PhET Lab</span>
            <span className="text-[11px] leading-snug text-paper/60">100+ real science sims to explore</span>
          </motion.button>
        </div>
      </div>

      {/* French — speak, talk, read, build */}
      <div className="space-y-2">
        <p className="font-pixel text-[10px] text-paper/50">🇫🇷 French</p>
        <button onClick={() => setView("fr-speak")} className="flex w-full items-center gap-3 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(58,111,216,0.24), rgba(20,16,28,0.96))" }}>
          <span className="text-2xl">🗣️</span>
          <div>
            <div className="font-pixel text-[11px] text-diamond">Speak French</div>
            <div className="text-[11px] text-paper/60">Hands-free coach. Say it back, get better as you go</div>
          </div>
        </button>
        <button onClick={() => setView("fr-talk")} className="flex w-full items-center gap-3 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(23,221,98,0.16), rgba(20,16,28,0.96))" }}>
          <span className="text-2xl">💬</span>
          <div>
            <div className="font-pixel text-[11px] text-grasstop">Talk with a friend</div>
            <div className="text-[11px] text-paper/60">Real chat in a café, shop or school — just talk</div>
          </div>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setView("fr-name")} className="flex flex-col items-start gap-1 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(156,92,224,0.2), rgba(20,16,28,0.96))" }}>
            <span className="text-2xl">🖼️</span>
            <span className="font-pixel text-[11px] text-paper">Name it!</span>
            <span className="text-[11px] leading-snug text-paper/60">Say or type what you see</span>
          </button>
          <button onClick={() => setView("fr-build")} className="flex flex-col items-start gap-1 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(242,178,51,0.18), rgba(20,16,28,0.96))" }}>
            <span className="text-2xl">🧩</span>
            <span className="font-pixel text-[11px] text-paper">Build a sentence</span>
            <span className="text-[11px] leading-snug text-paper/60">Make French sentences from tiles</span>
          </button>
        </div>
        <button onClick={() => setView("fr-reading")} className="flex w-full items-center gap-3 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(242,178,51,0.18), rgba(20,16,28,0.96))" }}>
          <span className="text-2xl">📖</span>
          <div>
            <div className="font-pixel text-[11px] text-gold2">Reading &amp; Speaking</div>
            <div className="text-[11px] text-paper/60">Story, tap-a-word help, questions &amp; speaking</div>
          </div>
        </button>
        <button onClick={() => setView("fr-audio")} className="flex w-full items-center gap-3 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(79,214,214,0.14), rgba(20,16,28,0.96))" }}>
          <span className="text-2xl">🎧</span>
          <div>
            <div className="font-pixel text-[11px] text-diamond">Word games</div>
            <div className="text-[11px] text-paper/60">Hear words, listen-and-choose, learn new ones</div>
          </div>
        </button>
      </div>

      {/* Weekly spelling dictation */}
      <button
        onClick={() => setView("spelling")}
        className="flex w-full items-center gap-3 rounded-2xl border-4 border-black/50 p-3 text-left shadow-pixel"
        style={{ background: "linear-gradient(160deg, rgba(74,237,217,0.16), rgba(20,16,28,0.96))" }}
      >
        <span className="text-2xl">✍️</span>
        <div>
          <div className="font-pixel text-[11px] text-diamond">Spelling Lab</div>
          <div className="text-[11px] text-paper/60">Listen and write this week&apos;s words, then get them checked</div>
        </div>
      </button>

      {/* Explore more + fun facts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => setView("explore")}
          className="flex items-center gap-3 rounded-2xl border-4 border-diamond/50 p-3 text-left shadow-pixel"
          style={{ background: "linear-gradient(160deg, rgba(124,92,224,0.24), rgba(20,16,28,0.96))" }}
        >
          <span className="text-3xl">🌍</span>
          <div>
            <div className="font-pixel text-[11px] text-diamond">Explore more labs</div>
            <div className="text-[11px] text-paper/60">Music, maths, science, coding &amp; reading</div>
          </div>
        </button>
        <button
          onClick={() => setView("facts")}
          className="flex items-center gap-3 rounded-2xl border-4 border-gold/50 p-3 text-left shadow-pixel"
          style={{ background: "linear-gradient(160deg, rgba(242,178,51,0.2), rgba(20,16,28,0.96))" }}
        >
          <span className="text-3xl">💡</span>
          <div>
            <div className="font-pixel text-[11px] text-gold2">Fun Facts</div>
            <div className="text-[11px] text-paper/60">Amazing facts, read aloud</div>
          </div>
        </button>
      </div>

      {/* Optional AI surprise */}
      <button
        onClick={() => {
          const s = LAB_SUBJECTS[Math.floor(Math.random() * LAB_SUBJECTS.length)];
          setSurprise(s);
          setView("surprise");
        }}
        className="w-full rounded-xl border-2 border-dashed border-paper/25 bg-black/20 px-4 py-2.5 text-xs text-paper/60"
      >
        🎲 Surprise experiment (made by AI — needs a key)
      </button>

      <button onClick={onExit} className="w-full rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[10px] text-paper/70">
        ⌂ Back home
      </button>
    </div>
  );
}
