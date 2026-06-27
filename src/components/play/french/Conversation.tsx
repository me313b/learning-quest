"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useHandsFree } from "@/lib/french/useHandsFree";
import { SCENARIOS, CONVO_FALLBACK, type Scenario } from "@/lib/french/scenarios";
import { praiseFr } from "@/lib/french/compare";
import { chime, speakNaturalOnly } from "@/lib/speech";
import { PixelButton } from "@/components/ui/primitives";

interface Msg {
  who: "ai" | "child";
  fr: string;
  en?: string;
}
type Phase = "thinking" | "speaking" | "listening" | "idle";
const MAX_AI_TURNS = 12;

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function Conversation({ onBack }: { onBack: () => void }) {
  const { level: mic, listen, stopEarly } = useHandsFree();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hint, setHint] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [noKey, setNoKey] = useState(false);

  const runningRef = useRef(false);
  const messagesRef = useRef<Msg[]>([]);
  const aiTurnsRef = useRef(0);
  const emptyRef = useRef(0);
  const scenarioRef = useRef<Scenario | null>(null);

  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  function push(m: Msg) {
    messagesRef.current = [...messagesRef.current, m];
    setMessages(messagesRef.current);
  }

  async function childTurn() {
    if (!runningRef.current) return;
    setPhase("listening");
    const res = await listen(10000);
    if (!runningRef.current) return;
    const said = (res?.text || "").trim();
    if (said) {
      emptyRef.current = 0;
      push({ who: "child", fr: said });
    } else {
      emptyRef.current += 1;
    }
    await aiTurn(said);
  }

  async function aiTurn(kidSaid: string) {
    const sc = scenarioRef.current;
    if (!sc || !runningRef.current) return;
    if (aiTurnsRef.current >= MAX_AI_TURNS) {
      finish();
      return;
    }
    setPhase("thinking");
    setHint("");
    const struggled = emptyRef.current >= 1;
    let fr = "";
    let en = "";
    let hint_en = "";
    try {
      const res = await fetch("/api/french/conversation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenario: sc.label,
          setting: sc.setting,
          history: messagesRef.current.map((m) => ({ who: m.who, fr: m.fr })),
          kidSaid,
          struggled,
        }),
      });
      const data = await res.json();
      if (data.reply && data.reply.fr) {
        fr = data.reply.fr;
        en = data.reply.en || "";
        hint_en = data.reply.hint_en || "";
        setNoKey(false);
      } else if (data.fallback) {
        setNoKey(true);
      }
    } catch {
      /* fall through to fallback */
    }
    if (!fr) {
      if (aiTurnsRef.current === 0) {
        fr = sc.opener.fr;
        en = sc.opener.en;
        hint_en = sc.opener.hint_en;
      } else {
        const f = CONVO_FALLBACK[Math.floor(Math.random() * CONVO_FALLBACK.length)];
        fr = f.fr;
        en = f.en;
        hint_en = f.hint_en;
      }
    }
    if (!runningRef.current) return;
    aiTurnsRef.current += 1;
    push({ who: "ai", fr, en });
    setHint(hint_en);
    setPhase("speaking");
    await speakNaturalOnly(fr, "fr-FR");
    if (!runningRef.current) return;
    await wait(250);
    await childTurn();
  }

  async function finish() {
    runningRef.current = false;
    stopEarly();
    setPhase("idle");
    chime("done");
    const p = praiseFr();
    push({ who: "ai", fr: `${p.fr} Au revoir !`, en: `${p.en} Goodbye!` });
    await speakNaturalOnly(`${p.fr} Au revoir !`, "fr-FR");
  }

  function begin(sc: Scenario) {
    scenarioRef.current = sc;
    setScenario(sc);
    messagesRef.current = [];
    setMessages([]);
    aiTurnsRef.current = 0;
    emptyRef.current = 0;
    setHint("");
    runningRef.current = true;
    aiTurn("");
  }

  function leave() {
    runningRef.current = false;
    stopEarly();
    setScenario(null);
    setMessages([]);
    messagesRef.current = [];
    setPhase("idle");
  }

  // ---- Scenario picker ----
  if (!scenario) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-[11px] text-paper/50 underline">
            ← French lab
          </button>
          <span className="font-pixel text-[11px] text-diamond">💬 Talk in French</span>
        </div>
        <p className="text-sm text-paper/75">Pick a place. You&apos;ll chat with someone there — just talk, no buttons!</p>
        <div className="grid grid-cols-2 gap-3">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => begin(sc)}
              className="flex flex-col gap-1 rounded-2xl border-4 border-black/50 p-4 text-left shadow-pixel"
              style={{ background: sc.bg }}
            >
              <span className="text-3xl">{sc.emoji}</span>
              <span className="font-pixel text-[11px] text-paper">{sc.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const lastAi = [...messages].reverse().find((m) => m.who === "ai");

  // ---- Conversation ----
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={leave} className="text-[11px] text-paper/50 underline">
          ← Places
        </button>
        <span className="font-pixel text-[11px] text-diamond">
          {scenario.emoji} {scenario.label}
        </span>
      </div>

      {/* Animated scene */}
      <div
        className="relative h-28 overflow-hidden rounded-2xl border-4 border-black/50 shadow-pixel"
        style={{ background: scenario.bg }}
      >
        {scenario.scene.map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl"
            style={{ left: `${12 + i * 22}%`, top: "30%" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {e}
          </motion.span>
        ))}
        <motion.div
          className="absolute bottom-1 right-2 text-4xl"
          animate={{ rotate: phase === "speaking" ? [0, -6, 6, 0] : 0 }}
          transition={{ duration: 0.6, repeat: phase === "speaking" ? Infinity : 0 }}
        >
          🧑‍🍳
        </motion.div>
      </div>

      {/* Transcript */}
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border-2 border-black/30 bg-black/20 p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.who === "ai" ? "text-left" : "text-right"}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.who === "ai" ? "bg-paneldark text-paper" : "bg-diamond/20 text-paper"
              }`}
            >
              <span className="font-semibold">{m.fr}</span>
              {m.en && <span className="block text-[11px] text-paper/55">{m.en}</span>}
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-sm text-paper/50">Starting…</p>}
      </div>

      {/* Status + hint */}
      <div className="min-h-[52px] text-center">
        {phase === "thinking" && <p className="animate-pulse text-sm text-paper/60">…</p>}
        {phase === "speaking" && <p className="text-sm text-diamond">🔊 Listen…</p>}
        {phase === "listening" && (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm text-grasstop">🎙️ Your turn — answer!</p>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-paper/15">
              <div className="h-full rounded-full bg-grasstop" style={{ width: `${Math.round(mic * 100)}%` }} />
            </div>
            <button onClick={stopEarly} className="text-[11px] text-paper/45 underline">
              done
            </button>
          </div>
        )}
        {hint && phase !== "thinking" && (
          <p className="mt-1 text-[12px] text-gold2">💡 {hint}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => lastAi && speakNaturalOnly(lastAi.fr, "fr-FR")}
          className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/85"
        >
          🔊 Say again
        </button>
        {runningRef.current && phase !== "listening" && (
          <button onClick={childTurn} className="rounded-lg border-2 border-grasstop/40 bg-grass/10 px-3 py-2 text-xs text-paper/85">
            🎙️ My turn
          </button>
        )}
        <PixelButton onClick={finish} className="px-4 py-2 text-xs">
          Finish chat
        </PixelButton>
      </div>
      {noKey && (
        <p className="text-center text-[11px] text-gold2">
          Add an OpenAI key in Parent → Settings for live conversations and the natural voice.
        </p>
      )}
    </div>
  );
}
