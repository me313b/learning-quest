"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chime, speakSmart, stopAllSpeech } from "@/lib/speech";

// A set of hand-built, plug-and-play chemistry experiments. No videos — the
// child reads a few steps and then plays with the experiment themselves, and a
// short "what's happening" line explains the science. Everything runs in the
// browser and needs no API key.

const C = {
  grass: "#7BC043",
  emerald: "#2FA84F",
  gold: "#F2B233",
  diamond: "#4FD6D6",
  redstone: "#E0533D",
  lapis: "#3A6FD8",
  purple: "#9C5CE0",
};

// --------------------------------------------------------------------------- //
// Shared frame: steps the child can follow + a manual "hear the steps" button.
// Deliberately does NOT auto-speak, to keep the app quiet unless asked.
// --------------------------------------------------------------------------- //
function Frame({
  title,
  emoji,
  steps,
  onBack,
  children,
}: {
  title: string;
  emoji: string;
  steps: string[];
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← Chemistry
        </button>
        <button
          onClick={() => speakSmart(`How to play. ${steps.join(". ")}.`, "en-GB")}
          aria-label="Hear the steps"
          className="rounded-lg border-2 border-black/40 bg-black/25 px-2.5 py-1 text-sm"
        >
          🔊 Steps
        </button>
      </div>

      <div
        className="rounded-2xl border-4 border-black/50 p-5 shadow-pixel"
        style={{ background: "linear-gradient(180deg, rgba(46,38,58,0.97), rgba(20,16,28,0.97))" }}
      >
        <h2 className="mb-3 flex items-center gap-2 font-pixel text-sm text-grasstop">
          <span className="text-2xl">{emoji}</span>
          {title}
        </h2>

        <ol className="mb-4 space-y-1.5 rounded-xl border-2 border-black/30 bg-black/20 p-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-paper/75">
              <span className="font-pixel text-[10px] text-gold2">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        {children}
      </div>
    </div>
  );
}

function Explain({ children, tint = C.gold }: { children: React.ReactNode; tint?: string }) {
  return (
    <p className="rounded-xl border-2 p-3 text-sm text-paper/90" style={{ borderColor: `${tint}55`, background: `${tint}1A` }}>
      {children}
    </p>
  );
}

// --------------------------------------------------------------------------- //
// 1) Acids & Bases — "Potion Tester"
// --------------------------------------------------------------------------- //
const LIQUIDS = [
  { name: "Lemon juice", emoji: "🍋", ph: 2, note: "Lemon juice is a strong acid. Acids often taste sour!" },
  { name: "Vinegar", emoji: "🧴", ph: 3, note: "Vinegar is an acid too. That's why it smells so sharp." },
  { name: "Apple juice", emoji: "🧃", ph: 4, note: "Apple juice is a mild acid." },
  { name: "Milk", emoji: "🥛", ph: 6, note: "Milk is only very slightly acidic — nearly neutral." },
  { name: "Water", emoji: "💧", ph: 7, note: "Pure water is neutral: not an acid and not a base." },
  { name: "Baking soda", emoji: "🧂", ph: 9, note: "Baking soda in water is a base (an alkali)." },
  { name: "Toothpaste", emoji: "🦷", ph: 9, note: "Toothpaste is a mild base — it fights the acids on your teeth." },
  { name: "Soap", emoji: "🧼", ph: 10, note: "Soap is a base. Bases often feel slippery." },
];

function phColour(ph: number): string {
  if (ph <= 2) return "#E0314B";
  if (ph <= 3) return "#EE5A3A";
  if (ph <= 4) return "#F0892E";
  if (ph <= 5) return "#F0C53A";
  if (ph <= 6) return "#C3D63A";
  if (ph <= 7) return "#5FBF4F";
  if (ph <= 8) return "#3FB6A6";
  if (ph <= 9) return "#3A8FD6";
  if (ph <= 11) return "#4A5AD6";
  return "#7A3AD6";
}
function phLabel(ph: number): string {
  if (ph < 7) return "ACID";
  if (ph > 7) return "BASE";
  return "NEUTRAL";
}

function AcidsLab({ onBack }: { onBack: () => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const liquid = sel !== null ? LIQUIDS[sel] : null;
  const colour = liquid ? phColour(liquid.ph) : "#8a8a94";

  return (
    <Frame
      title="Potion Tester"
      emoji="⚗️"
      steps={[
        "Tap a liquid to pour it into the tube.",
        "Watch the magic strip change colour.",
        "Red or orange means acid, green means neutral, blue or purple means base.",
        "Read what kind of potion it is!",
      ]}
      onBack={onBack}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-6">
          {/* test tube */}
          <div className="relative h-44 w-16 overflow-hidden rounded-b-[2rem] border-4 border-black/50 bg-black/30">
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              animate={{ height: liquid ? "72%" : "0%", background: colour }}
              transition={{ duration: 0.5 }}
            />
            {/* indicator strip */}
            <motion.div
              className="absolute left-1/2 top-2 h-24 w-3 -translate-x-1/2 rounded-sm border border-black/40"
              animate={{ background: liquid ? colour : "#efe9d8" }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* pH scale */}
          <div className="w-44">
            <div
              className="h-4 w-full rounded-full"
              style={{ background: "linear-gradient(90deg,#E0314B,#F0892E,#F0C53A,#5FBF4F,#3FB6A6,#3A8FD6,#7A3AD6)" }}
            />
            <div className="relative h-3">
              {liquid && (
                <motion.div
                  className="absolute top-0 h-3 w-1.5 rounded-full bg-white shadow"
                  animate={{ left: `${(liquid.ph / 14) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[9px] text-paper/50">
              <span>0 acid</span>
              <span>7</span>
              <span>14 base</span>
            </div>
            {liquid && (
              <div className="mt-2 text-center font-pixel text-sm" style={{ color: colour }}>
                {phLabel(liquid.ph)} · pH {liquid.ph}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {LIQUIDS.map((l, i) => (
            <button
              key={l.name}
              onClick={() => {
                setSel(i);
                chime("hint");
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 ${
                sel === i ? "border-grasstop bg-grass/20" : "border-black/40 bg-black/25"
              }`}
            >
              <span className="text-2xl">{l.emoji}</span>
              <span className="text-center text-[9px] leading-tight text-paper/70">{l.name}</span>
            </button>
          ))}
        </div>

        {liquid ? <Explain tint={colour}>{liquid.note}</Explain> : <p className="text-center text-xs text-paper/50">Tap a liquid above to test it.</p>}
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------------------- //
// 2) States of matter — "Heat It Up" (real particle animation)
// --------------------------------------------------------------------------- //
function StatesLab({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [temp, setTemp] = useState(20);
  const tempRef = useRef(20);
  useEffect(() => {
    tempRef.current = temp;
  }, [temp]);

  const state = temp < 0 ? "Solid (ice)" : temp <= 100 ? "Liquid (water)" : "Gas (steam)";
  const emoji = temp < 0 ? "🧊" : temp <= 100 ? "💧" : "💨";
  const note =
    temp < 0
      ? "It's freezing! The water is solid ice. The particles are locked together and only wobble in place."
      : temp <= 100
        ? "The ice has melted into liquid water. The particles slide and tumble past each other."
        : "The water is boiling into steam, a gas. The particles break free and zoom around to fill all the space.";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = 240);
    const cols = 8;
    const N = 48;
    type P = { x: number; y: number; vx: number; vy: number; hx: number; hy: number };
    const ps: P[] = [];
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const hx = 32 + c * ((W - 64) / (cols - 1));
      const hy = H - 28 - r * 22;
      ps.push({ x: hx, y: hy, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, hx, hy });
    }
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.strokeRect(8, 8, W - 16, H - 16);
      const t = tempRef.current;
      const now = Date.now();
      for (const p of ps) {
        if (t < 0) {
          p.x = p.hx + Math.sin(now / 220 + p.hy) * 1.6;
          p.y = p.hy + Math.cos(now / 220 + p.hx) * 1.6;
        } else if (t <= 100) {
          const speed = 0.3 + (t / 100) * 0.9;
          p.x += p.vx * speed;
          p.y += p.vy * speed + 0.35;
          if (p.x < 16 || p.x > W - 16) p.vx *= -1;
          const floor = H - 18;
          if (p.y > floor) {
            p.y = floor;
            p.vy = -Math.abs(p.vy) * 0.5;
          }
          if (p.y < H * 0.42) p.vy += 0.25;
          p.vx += (Math.random() - 0.5) * 0.25;
          p.vy += (Math.random() - 0.5) * 0.25;
          p.vx = Math.max(-2.2, Math.min(2.2, p.vx));
          p.vy = Math.max(-2.2, Math.min(2.2, p.vy));
        } else {
          const speed = 2.4;
          p.x += p.vx * speed;
          p.y += p.vy * speed;
          if (p.x < 16 || p.x > W - 16) p.vx *= -1;
          if (p.y < 16 || p.y > H - 16) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.fillStyle = t < 0 ? "#8FD4FF" : t <= 100 ? "#4FA8E0" : "#D4ECFF";
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Frame
      title="Heat It Up"
      emoji="🔥"
      steps={[
        "Slide to make it hotter or colder, or tap the buttons.",
        "Watch how the tiny particles move.",
        "Cold = solid ice. Warm = liquid water. Very hot = steam gas.",
      ]}
      onBack={onBack}
    >
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-black/40 bg-black/25 p-2 text-center">
          <span className="font-pixel text-sm" style={{ color: temp < 0 ? C.diamond : temp <= 100 ? C.lapis : "#CFE8FF" }}>
            {emoji} {state}
          </span>
          <span className="ml-2 text-sm text-paper/60">{temp}°C</span>
        </div>

        <canvas ref={canvasRef} className="w-full rounded-xl border-2 border-black/40" style={{ background: "linear-gradient(180deg,#1a2342,#10162b)" }} />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTemp((t) => Math.max(-20, t - 20))}
            className="rounded-xl border-2 border-diamond/50 bg-diamond/10 px-3 py-2 font-pixel text-[11px] text-paper"
          >
            🧊 Cooler
          </button>
          <input
            type="range"
            min={-20}
            max={140}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            className="flex-1 accent-redstone"
          />
          <button
            onClick={() => setTemp((t) => Math.min(140, t + 20))}
            className="rounded-xl border-2 border-redstone/50 bg-redstone/10 px-3 py-2 font-pixel text-[11px] text-paper"
          >
            🔥 Hotter
          </button>
        </div>

        <Explain tint={temp < 0 ? C.diamond : temp <= 100 ? C.lapis : C.redstone}>{note}</Explain>
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------------------- //
// 3) Build an atom — "Atom Builder"
// --------------------------------------------------------------------------- //
const ELEMENTS = ["", "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon"];
const SYMBOLS = ["", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne"];

function AtomLab({ onBack }: { onBack: () => void }) {
  const [p, setP] = useState(1);
  const [n, setN] = useState(0);
  const [e, setE] = useState(1);

  const known = p >= 1 && p <= 10;
  const name = known ? ELEMENTS[p] : "a mystery atom";
  const sym = known ? SYMBOLS[p] : "?";
  const charge = p - e;
  const mass = p + n;

  // Electron shells fill 2, then 8, then 8.
  const shells: number[] = [];
  let rem = e;
  for (const cap of [2, 8, 8]) {
    if (rem <= 0) break;
    const cnt = Math.min(rem, cap);
    shells.push(cnt);
    rem -= cnt;
  }

  // Nucleus particles arranged in a little spiral.
  const nucleus: { x: number; y: number; colour: string }[] = [];
  const totalNuc = p + n;
  for (let i = 0; i < totalNuc; i++) {
    const ang = i * 2.39996;
    const rad = 3.2 * Math.sqrt(i);
    nucleus.push({
      x: 130 + rad * Math.cos(ang),
      y: 130 + rad * Math.sin(ang),
      colour: i < p ? C.redstone : "#9AA0A6",
    });
  }

  const shellRadii = [54, 86, 116];

  const chargeText =
    charge === 0 ? "Neutral atom 🙂 (same protons and electrons)" : charge > 0 ? `Positive ion +${charge} (more protons)` : `Negative ion ${charge} (more electrons)`;

  function Ctrl({ label, val, set, min, max, colour }: { label: string; val: number; set: (n: number) => void; min: number; max: number; colour: string }) {
    return (
      <div className="rounded-xl border-2 border-black/40 bg-black/20 p-2 text-center">
        <div className="font-pixel text-[9px]" style={{ color: colour }}>
          {label}
        </div>
        <div className="my-1 font-pixel text-lg text-paper">{val}</div>
        <div className="flex justify-center gap-1">
          <button onClick={() => { set(Math.max(min, val - 1)); chime("hint"); }} className="h-8 w-8 rounded-lg border-2 border-black/40 bg-black/40 font-pixel text-paper">
            −
          </button>
          <button onClick={() => { set(Math.min(max, val + 1)); chime("hint"); }} className="h-8 w-8 rounded-lg border-2 border-black/40 font-pixel text-white" style={{ background: colour }}>
            ＋
          </button>
        </div>
      </div>
    );
  }

  return (
    <Frame
      title="Atom Builder"
      emoji="⚛️"
      steps={[
        "Add or take away protons (red) in the middle.",
        "The number of protons decides which element you make!",
        "Add electrons (blue) that spin around the outside.",
        "Try to build Carbon: 6 protons.",
      ]}
      onBack={onBack}
    >
      <div className="space-y-3">
        <div className="grid place-items-center rounded-xl border-2 border-black/40 bg-black/25 py-2">
          <svg viewBox="0 0 260 260" className="h-60 w-60">
            <style>{`@keyframes cspin{to{transform:rotate(360deg)}}@keyframes cspin2{to{transform:rotate(-360deg)}}`}</style>
            {shells.map((cnt, si) => (
              <g key={si}>
                <circle cx={130} cy={130} r={shellRadii[si]} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />
                <g style={{ transformOrigin: "130px 130px", animation: `${si % 2 === 0 ? "cspin" : "cspin2"} ${10 + si * 4}s linear infinite` }}>
                  {Array.from({ length: cnt }).map((_, ei) => {
                    const a = (ei / cnt) * Math.PI * 2;
                    return <circle key={ei} cx={130 + shellRadii[si] * Math.cos(a)} cy={130 + shellRadii[si] * Math.sin(a)} r={6} fill={C.lapis} stroke="rgba(0,0,0,0.3)" />;
                  })}
                </g>
              </g>
            ))}
            {nucleus.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={6} fill={d.colour} stroke="rgba(0,0,0,0.35)" />
            ))}
          </svg>
        </div>

        <div className="rounded-xl border-2 border-gold/40 bg-gold/10 py-2 text-center">
          <span className="font-pixel text-lg text-gold2">
            {sym} · {name}
          </span>
          <div className="mt-0.5 text-xs text-paper/70">
            Mass number: {mass} &nbsp;·&nbsp; {chargeText}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Ctrl label="PROTONS" val={p} set={setP} min={1} max={10} colour={C.redstone} />
          <Ctrl label="NEUTRONS" val={n} set={setN} min={0} max={14} colour="#9AA0A6" />
          <Ctrl label="ELECTRONS" val={e} set={setE} min={0} max={12} colour={C.lapis} />
        </div>

        <Explain tint={C.redstone}>
          {known ? `${p} proton${p > 1 ? "s" : ""} makes ${name}! Every atom with ${p} proton${p > 1 ? "s" : ""} is ${name}, no matter what.` : "Add up to 10 protons to build one of the first ten elements."}
        </Explain>
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------------------- //
// 4) Colour chemistry — "Mixing Lab"
// --------------------------------------------------------------------------- //
function colourResult(r: number, y: number, b: number): { css: string; name: string } {
  const R = r > 0;
  const Y = y > 0;
  const B = b > 0;
  if (R && Y && B) return { css: "#7A5230", name: "BROWN" };
  if (R && Y) return { css: "#E8822E", name: "ORANGE" };
  if (Y && B) return { css: "#3FA84F", name: "GREEN" };
  if (R && B) return { css: "#8A3AD6", name: "PURPLE" };
  if (R) return { css: "#D23A3A", name: "RED" };
  if (Y) return { css: "#EFCB3A", name: "YELLOW" };
  if (B) return { css: "#3A6FD6", name: "BLUE" };
  return { css: "transparent", name: "" };
}

function ColourLab({ onBack }: { onBack: () => void }) {
  const [r, setR] = useState(0);
  const [y, setY] = useState(0);
  const [b, setB] = useState(0);
  const total = r + y + b;
  const res = colourResult(r, y, b);

  const drop = (set: (fn: (n: number) => number) => void) => {
    set((v) => Math.min(6, v + 1));
    chime("hint");
  };

  return (
    <Frame
      title="Mixing Lab"
      emoji="🎨"
      steps={[
        "Tap a dropper to add a drop of colour to the beaker.",
        "Mix two primary colours and see what you make.",
        "Red + yellow, yellow + blue, red + blue — try them all!",
      ]}
      onBack={onBack}
    >
      <div className="space-y-4">
        <div className="flex items-end justify-center gap-8">
          {/* beaker */}
          <div className="relative h-40 w-28 overflow-hidden rounded-b-xl border-4 border-black/50 bg-black/25">
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              animate={{ height: total > 0 ? `${Math.min(85, 18 + total * 11)}%` : "0%", background: res.css }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* result */}
          <div className="text-center">
            {res.name ? (
              <>
                <div className="mx-auto h-12 w-12 rounded-full border-4 border-black/40" style={{ background: res.css }} />
                <div className="mt-2 font-pixel text-sm" style={{ color: res.css }}>
                  {res.name}
                </div>
              </>
            ) : (
              <div className="text-xs text-paper/50">Add some drops!</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Red", c: "#D23A3A", set: setR, val: r },
            { label: "Yellow", c: "#EFCB3A", set: setY, val: y },
            { label: "Blue", c: "#3A6FD6", set: setB, val: b },
          ].map((d) => (
            <button
              key={d.label}
              onClick={() => drop(d.set)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-black/40 bg-black/25 p-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-black/40 text-lg" style={{ background: d.c }}>
                💧
              </span>
              <span className="font-pixel text-[9px] text-paper/75">{d.label}</span>
              <span className="text-[10px] text-paper/45">{d.val} drops</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {res.name ? <Explain tint={res.css}>You made {res.name}! Mixing colours is like mixing paints.</Explain> : <span />}
          <button onClick={() => { setR(0); setY(0); setB(0); }} className="ml-2 shrink-0 rounded-xl border-2 border-black/40 bg-black/30 px-3 py-2 font-pixel text-[10px] text-paper/70">
            🧹 Empty
          </button>
        </div>
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------------------- //
// 5) Reaction — "Fizz Lab" (baking soda + vinegar)
// --------------------------------------------------------------------------- //
function FizzLab({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soda, setSoda] = useState(2);
  const [vinegar, setVinegar] = useState(2);
  const [reacting, setReacting] = useState(false);
  const intensityRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = 220);
    type B = { x: number; y: number; r: number; vy: number; life: number };
    const bubbles: B[] = [];
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // beaker liquid
      ctx.fillStyle = "rgba(120,180,120,0.18)";
      ctx.fillRect(W / 2 - 55, H - 70, 110, 60);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.strokeRect(W / 2 - 55, 30, 110, H - 40);

      const inten = intensityRef.current;
      if (inten > 0) {
        const spawn = Math.round(inten);
        for (let i = 0; i < spawn; i++) {
          bubbles.push({
            x: W / 2 + (Math.random() - 0.5) * 90,
            y: H - 70,
            r: 3 + Math.random() * 5,
            vy: 1 + Math.random() * 2 + inten * 0.2,
            life: 1,
          });
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.vy;
        b.x += Math.sin(b.y / 18) * 0.8;
        b.life -= 0.01;
        if (b.y < 10 || b.life <= 0) {
          bubbles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(220,255,220,${0.4 * b.life + 0.2})`;
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  function fizzSound(strength: number) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioRef.current) audioRef.current = new AC();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const dur = 1.2 + strength * 0.2;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const fade = 1 - i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * fade * 0.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1000;
      const gain = ctx.createGain();
      gain.gain.value = 0.25;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch {
      /* ignore */
    }
  }

  function react() {
    const strength = Math.min(soda, vinegar);
    intensityRef.current = strength;
    setReacting(true);
    chime("done");
    fizzSound(strength);
    window.setTimeout(() => {
      intensityRef.current = 0;
      setReacting(false);
    }, 2600);
  }

  const leftover =
    soda === vinegar
      ? "They matched perfectly, so it all reacted."
      : soda > vinegar
        ? "There was extra baking soda left over after the fizzing stopped."
        : "There was extra vinegar left over after the fizzing stopped.";

  function Step({ label, val, set, emoji }: { label: string; val: number; set: (n: number) => void; emoji: string }) {
    return (
      <div className="rounded-xl border-2 border-black/40 bg-black/20 p-2 text-center">
        <div className="text-2xl">{emoji}</div>
        <div className="font-pixel text-[9px] text-paper/70">{label}</div>
        <div className="my-1 font-pixel text-base text-paper">{val}</div>
        <div className="flex justify-center gap-1">
          <button onClick={() => set(Math.max(1, val - 1))} className="h-7 w-7 rounded-lg border-2 border-black/40 bg-black/40 font-pixel text-paper">
            −
          </button>
          <button onClick={() => set(Math.min(5, val + 1))} className="h-7 w-7 rounded-lg border-2 border-black/40 bg-grass font-pixel text-white">
            ＋
          </button>
        </div>
      </div>
    );
  }

  return (
    <Frame
      title="Fizz Lab"
      emoji="🧪"
      steps={[
        "Choose how many scoops of baking soda to add.",
        "Choose how many splashes of vinegar to add.",
        "Press Mix and watch the bubbles erupt!",
        "More of both makes a bigger fizz.",
      ]}
      onBack={onBack}
    >
      <div className="space-y-3">
        <canvas ref={canvasRef} className="w-full rounded-xl border-2 border-black/40" style={{ background: "linear-gradient(180deg,#15201a,#0f1510)" }} />

        <div className="grid grid-cols-2 gap-2">
          <Step label="Baking soda" val={soda} set={setSoda} emoji="🧂" />
          <Step label="Vinegar" val={vinegar} set={setVinegar} emoji="🧴" />
        </div>

        <button
          onClick={react}
          disabled={reacting}
          className={`w-full rounded-xl border-4 border-black/40 bg-grass px-4 py-3 font-pixel text-[12px] text-white ${reacting ? "opacity-60" : ""}`}
        >
          {reacting ? "✨ Fizzing!" : "🫧 Mix them!"}
        </button>

        <AnimatePresence>
          {reacting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Explain tint={C.emerald}>
                Baking soda and vinegar react and make a gas called carbon dioxide — those are the bubbles! {leftover}
              </Explain>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------------------- //
// Hub
// --------------------------------------------------------------------------- //
type ChemId = "acids" | "states" | "atom" | "colour" | "fizz";

const CARDS: { id: ChemId; title: string; emoji: string; blurb: string; tint: string }[] = [
  { id: "acids", title: "Potion Tester", emoji: "⚗️", blurb: "Test liquids: acid or base?", tint: C.redstone },
  { id: "fizz", title: "Fizz Lab", emoji: "🧪", blurb: "Soda + vinegar = eruption!", tint: C.emerald },
  { id: "colour", title: "Mixing Lab", emoji: "🎨", blurb: "Mix colours to make new ones", tint: C.gold },
  { id: "states", title: "Heat It Up", emoji: "🔥", blurb: "Ice, water and steam particles", tint: C.lapis },
  { id: "atom", title: "Atom Builder", emoji: "⚛️", blurb: "Build elements from scratch", tint: C.purple },
];

export default function ChemistryLab({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<ChemId | null>(null);

  useEffect(() => {
    stopAllSpeech();
  }, [view]);

  if (view === "acids") return <AcidsLab onBack={() => setView(null)} />;
  if (view === "states") return <StatesLab onBack={() => setView(null)} />;
  if (view === "atom") return <AtomLab onBack={() => setView(null)} />;
  if (view === "colour") return <ColourLab onBack={() => setView(null)} />;
  if (view === "fizz") return <FizzLab onBack={() => setView(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← Labs
        </button>
        <span className="w-10" />
      </div>

      <div className="rounded-2xl border-4 border-black/50 p-4 shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(224,83,61,0.20), rgba(20,16,28,0.96))" }}>
        <h2 className="flex items-center gap-2 font-pixel text-sm text-grasstop">
          <span className="text-2xl">🧪</span> Chemistry Lab
        </h2>
        <p className="mt-1.5 text-xs text-paper/65">Real experiments you can do yourself. Follow the steps, then play and watch what happens.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((c) => (
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
    </div>
  );
}
