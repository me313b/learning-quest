"use client";

import { useEffect, useRef, useState } from "react";
import { Banner, Fact } from "@/components/ui/primitives";
import {
  LAB_TEMPLATES,
  type LabInstance,
  type PredictSpec,
  fallbackLab,
  labForTemplate,
  templateKeys,
} from "@/lib/labs";

// The Physics Lab. Each visit (and each "New experiment" tap) asks the AI for
// fresh framing — a new scenario, prediction and fact — wrapped around one of
// five vetted interactive templates. The interactive mechanic lives in trusted
// component code; the AI only supplies the words, so it stays safe and varied.

const SUBJECT = "physics";
const BOB = `@keyframes lq-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`;

// Replays a CSS transition from the start: flip to false, then true next frame.
function useReplay(durationMs: number): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (reset.current) clearTimeout(reset.current);
    },
    [],
  );
  const go = () => {
    setOn(false);
    if (reset.current) clearTimeout(reset.current);
    reset.current = setTimeout(() => setOn(true), 40);
    void durationMs;
  };
  return [on, go];
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-xs text-paper/80">
        <span>{label}</span>
        <span className="font-pixel text-[10px] text-diamond">
          {value}
          {suffix ? ` ${suffix}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-grasstop"
      />
    </label>
  );
}

function GoButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-4 border-black/40 bg-grass px-5 py-2 font-pixel text-[11px] text-white shadow-pixelsm active:translate-y-0.5"
    >
      {children}
    </button>
  );
}

function Predict({ spec }: { spec: PredictSpec }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="rounded-xl border-2 border-gold/40 bg-gold/10 p-3">
      <p className="text-sm text-paper/85">🤔 {spec.question}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {spec.options.map((o, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className={`rounded-lg border-2 px-3 py-1 text-xs transition ${
              picked === i
                ? i === spec.answer
                  ? "border-emerald bg-emerald/20 text-paper"
                  : "border-redstone bg-redstone/20 text-paper"
                : "border-black/40 bg-black/20 text-paper/70"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p className="mt-2 text-xs text-paper/80">
          {picked === spec.answer ? "✅ Spot on! " : "Not quite, "} {spec.reveal}
        </p>
      )}
    </div>
  );
}

// Header shared by every lab: the AI-supplied title and one-line intro.
function LabHead({ lab }: { lab: LabInstance }) {
  return (
    <div>
      <h3 className="font-pixel text-xs text-grasstop">{lab.title}</h3>
      {lab.intro && <p className="mt-1 text-sm text-paper/80">{lab.intro}</p>}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Templates: the interactive mechanic is fixed; copy comes from the instance.
// --------------------------------------------------------------------------- //
function RampLab({ lab }: { lab: LabInstance }) {
  const [steep, setSteep] = useState(30);
  const dur = Math.max(0.5, 3 - steep / 20);
  const [on, go] = useReplay(dur * 1000);
  const speed = (10 / dur).toFixed(1);
  return (
    <div className="mc-card-dark space-y-4">
      <LabHead lab={lab} />
      <Slider label="Ramp steepness" min={5} max={45} value={steep} onChange={setSteep} suffix="°" />
      <div className="relative h-40 overflow-hidden rounded-xl border-4 border-black/50 bg-sky">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-grass" />
        <div
          className="absolute left-4 bottom-4 origin-bottom-left bg-dirt"
          style={{ width: "82%", height: 8, transform: `rotate(-${steep}deg)` }}
        />
        <div
          className="absolute text-2xl"
          style={{
            left: on ? "82%" : "4%",
            bottom: on ? "8px" : `${4 + Math.sin((steep * Math.PI) / 180) * 150}px`,
            transition: on ? `left ${dur}s ease-in, bottom ${dur}s ease-in` : "none",
          }}
        >
          ⚽
        </div>
      </div>
      <div className="flex items-center justify-between">
        <GoButton onClick={go}>▶ Roll the ball</GoButton>
        <span className="text-sm text-paper/80">
          Speed: <span className="font-semibold text-gold">{speed}</span> blocks/s
        </span>
      </div>
      {lab.predict && <Predict spec={lab.predict} />}
      {lab.fact && <Fact>{lab.fact}</Fact>}
    </div>
  );
}

function PushLab({ lab }: { lab: LabInstance }) {
  const [force, setForce] = useState(10);
  const [mass, setMass] = useState(4);
  const accel = force / mass;
  const dur = Math.max(0.4, 4 / accel);
  const [on, go] = useReplay(dur * 1000);
  const block = mass <= 6 ? "📦" : mass <= 13 ? "🪨" : "⛰️";
  const travel = Math.min(82, accel * 18);
  return (
    <div className="mc-card-dark space-y-4">
      <LabHead lab={lab} />
      <div className="grid grid-cols-2 gap-4">
        <Slider label="Your push" min={1} max={20} value={force} onChange={setForce} />
        <Slider label="Block weight" min={1} max={20} value={mass} onChange={setMass} />
      </div>
      <div className="relative h-24 overflow-hidden rounded-xl border-4 border-black/50 bg-grass">
        <div className="absolute inset-x-0 bottom-0 h-3.5 bg-dirt" />
        <div
          className="absolute bottom-4 text-3xl"
          style={{ left: on ? `${travel}%` : "4%", transition: on ? `left ${dur}s ease-out` : "none" }}
        >
          {block}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <GoButton onClick={go}>▶ Push!</GoButton>
        <span className="text-sm text-paper/80">
          Speed-up: <span className="font-semibold text-gold">{accel.toFixed(1)}</span>
        </span>
      </div>
      {lab.predict && <Predict spec={lab.predict} />}
      {lab.fact && <Fact>{lab.fact}</Fact>}
    </div>
  );
}

function FallingLab({ lab }: { lab: LabInstance }) {
  const [air, setAir] = useState(true);
  const featherDur = air ? 2.6 : 1.0;
  const anvilDur = 1.0;
  const [on, go] = useReplay(Math.max(featherDur, anvilDur) * 1000);
  return (
    <div className="mc-card-dark space-y-4">
      <LabHead lab={lab} />
      <div className="flex items-center gap-3">
        <span className="text-xs text-paper/70">Air resistance</span>
        <button
          onClick={() => setAir((a) => !a)}
          className={`rounded-lg border-2 px-3 py-1 font-pixel text-[10px] ${
            air ? "border-diamond bg-diamond/20 text-paper" : "border-black/40 bg-black/20 text-paper/60"
          }`}
        >
          {air ? "ON (like Earth)" : "OFF (like the Moon)"}
        </button>
      </div>
      <div className="relative h-44 overflow-hidden rounded-xl border-4 border-black/50 bg-sky">
        <div className="absolute inset-x-0 bottom-0 h-5 bg-grass" />
        <div
          className="absolute left-[28%] text-2xl"
          style={{ top: on ? "150px" : "8px", transition: on ? `top ${featherDur}s ${air ? "ease-in-out" : "ease-in"}` : "none" }}
        >
          🪶
        </div>
        <div
          className="absolute left-[62%] text-2xl"
          style={{ top: on ? "150px" : "8px", transition: on ? `top ${anvilDur}s ease-in` : "none" }}
        >
          🪨
        </div>
      </div>
      <GoButton onClick={go}>▶ Drop both</GoButton>
      {lab.predict && <Predict spec={lab.predict} />}
      {lab.fact && <Fact>{lab.fact}</Fact>}
    </div>
  );
}

interface FloatObj {
  emoji: string;
  name: string;
  floats: boolean;
  why: string;
}
const OBJECTS: FloatObj[] = [
  { emoji: "🧊", name: "Ice", floats: true, why: "Ice is lighter than water, so it floats." },
  { emoji: "🍎", name: "Apple", floats: true, why: "An apple is full of air, so it bobs on top." },
  { emoji: "🪵", name: "Wood", floats: true, why: "Wood is less dense than water, so it floats." },
  { emoji: "⚓", name: "Anchor", floats: false, why: "Heavy metal is denser than water, so it sinks." },
  { emoji: "🪨", name: "Rock", floats: false, why: "A rock is denser than water, so down it goes." },
  { emoji: "🔑", name: "Key", floats: false, why: "Metal is heavier than water, so it sinks." },
];

function FloatLab({ lab }: { lab: LabInstance }) {
  const [obj, setObj] = useState<FloatObj | null>(null);
  const [on, go] = useReplay(1200);
  function pick(o: FloatObj) {
    setObj(o);
    go();
  }
  return (
    <div className="mc-card-dark space-y-4">
      <LabHead lab={lab} />
      <div className="grid grid-cols-3 gap-2">
        {OBJECTS.map((o) => (
          <button
            key={o.name}
            onClick={() => pick(o)}
            className={`rounded-xl border-4 px-2 py-3 text-center transition ${
              obj?.name === o.name ? "border-diamond bg-diamond/15" : "border-black/40 bg-black/20"
            }`}
          >
            <div className="text-2xl">{o.emoji}</div>
            <div className="text-[10px] text-paper/70">{o.name}</div>
          </button>
        ))}
      </div>
      <div className="relative h-40 overflow-hidden rounded-xl border-4 border-black/50 bg-sky">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[#2C6DD6]/70" />
        <div className="absolute inset-x-0 bottom-24 h-1 bg-white/40" />
        {obj && (
          <div
            className="absolute left-1/2 -translate-x-1/2 text-3xl"
            style={{
              top: on ? (obj.floats ? "70px" : "120px") : "6px",
              transition: on ? "top 1.1s ease-in" : "none",
              animation: on && obj.floats ? "lq-bob 1.6s ease-in-out infinite 1.1s" : "none",
            }}
          >
            {obj.emoji}
          </div>
        )}
      </div>
      {obj && (
        <Banner variant={obj.floats ? "grass" : "dirt"}>
          {obj.emoji} {obj.name} {obj.floats ? "floats! " : "sinks! "}
          {obj.why}
        </Banner>
      )}
      {lab.predict && <Predict spec={lab.predict} />}
      {lab.fact && <Fact>{lab.fact}</Fact>}
    </div>
  );
}

function ShadowLab({ lab }: { lab: LabInstance }) {
  const [sun, setSun] = useState(60);
  const shadow = Math.max(6, Math.round(140 / Math.tan((sun * Math.PI) / 180)));
  const sunLeft = 12 + (90 - sun) * 0.4;
  return (
    <div className="mc-card-dark space-y-4">
      <LabHead lab={lab} />
      <Slider label="Sun height" min={12} max={90} value={sun} onChange={setSun} suffix="°" />
      <div className="relative h-44 overflow-hidden rounded-xl border-4 border-black/50 bg-gradient-to-b from-sky to-[#FFD79A]">
        <div className="absolute inset-x-0 bottom-0 h-5 bg-grass" />
        <div className="absolute text-3xl" style={{ left: `${sunLeft}%`, top: `${90 - sun}%` }}>
          ☀️
        </div>
        <div className="absolute bottom-5 left-[42%] text-3xl">🌳</div>
        <div
          className="absolute bottom-[18px] left-[46%] h-2 rounded-full bg-black/45"
          style={{ width: shadow, transition: "width 0.15s linear" }}
        />
      </div>
      <Banner variant="dirt">
        {sun < 30 ? "🌅 Low sun, really long shadow!" : sun > 75 ? "🔆 Sun overhead, tiny shadow." : "🌤️ A medium shadow."}
      </Banner>
      {lab.predict && <Predict spec={lab.predict} />}
      {lab.fact && <Fact>{lab.fact}</Fact>}
    </div>
  );
}

const TEMPLATES: Record<string, (lab: LabInstance) => React.ReactElement> = {
  ramp: (lab) => <RampLab lab={lab} />,
  push: (lab) => <PushLab lab={lab} />,
  falling: (lab) => <FallingLab lab={lab} />,
  float: (lab) => <FloatLab lab={lab} />,
  shadow: (lab) => <ShadowLab lab={lab} />,
};

const CHIP_LABEL: Record<string, string> = {
  ramp: "🛝 Ramp",
  push: "📦 Push",
  falling: "🪶 Drop",
  float: "💧 Float",
  shadow: "🔦 Shadow",
};

export default function PhysicsLab({ onBack }: { onBack: () => void }) {
  const [lab, setLab] = useState<LabInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const recentRef = useRef<string[]>([]);

  async function loadNew() {
    setLoading(true);
    let next: LabInstance | null = null;
    try {
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject: SUBJECT, recent: recentRef.current.slice(-3) }),
      });
      const data = await res.json();
      next = (data.lab as LabInstance) || null;
    } catch {
      next = null;
    }
    if (!next) next = fallbackLab(SUBJECT, recentRef.current.slice(-3));
    recentRef.current = [...recentRef.current, next.template].slice(-4);
    setLab(next);
    setLoading(false);
  }

  function pickType(t: string) {
    const inst = labForTemplate(SUBJECT, t);
    recentRef.current = [...recentRef.current, t].slice(-4);
    setLab(inst);
  }

  useEffect(() => {
    loadNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keys = templateKeys(SUBJECT);
  void LAB_TEMPLATES;

  return (
    <div className="space-y-5">
      <style dangerouslySetInnerHTML={{ __html: BOB }} />

      <Banner variant="grass">⚛️ Science Lab — guess, press Go, and see what happens! 💎</Banner>

      <div className="flex flex-wrap items-center gap-2">
        <GoButton onClick={loadNew}>🎲 New experiment</GoButton>
        <span className="text-[11px] text-paper/50">or pick one:</span>
        {keys.map((t) => (
          <button
            key={t}
            onClick={() => pickType(t)}
            className={`rounded-lg border-2 px-2.5 py-1 font-pixel text-[9px] transition ${
              lab?.template === t
                ? "border-grasstop bg-grass/25 text-paper"
                : "border-black/40 bg-black/20 text-paper/60"
            }`}
          >
            {CHIP_LABEL[t] || t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mc-card-dark animate-pulse py-10 text-center text-paper/60">
          Dreaming up a new experiment…
        </div>
      )}

      {!loading && lab && TEMPLATES[lab.template] && TEMPLATES[lab.template](lab)}

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[10px] text-paper/80"
        >
          ⌂ Back home
        </button>
      </div>
    </div>
  );
}
