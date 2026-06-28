"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useHandsFree } from "@/lib/french/useHandsFree";
import { SCENARIOS, CONVO_FALLBACK, type Scenario } from "@/lib/french/scenarios";
import { praiseFr } from "@/lib/french/compare";
import { chime, prefetchSpeech, speakNaturalOnly } from "@/lib/speech";
import { PixelButton } from "@/components/ui/primitives";

interface Msg {
  who: "ai" | "child";
  fr: string;
  en?: string;
}
type Phase = "thinking" | "speaking" | "listening" | "paused" | "idle";
const MAX_AI_TURNS = 16;

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
  const busyRef = useRef(false);
  const messagesRef = useRef<Msg[]>([]);
  const aiTurnsRef = useRef(0);
  const emptyRef = useRef(0);
  const scenarioRef = useRef<Scenario | null>(null);
  const recentPlacesRef = useRef<string[]>([]);
  const levelRef = useRef(2);
  const [suggestion, setSuggestion] = useState<{ fr: string; en: string } | null>(null);
  const [revealAtlas, setRevealAtlas] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  async function surprise() {
    if (genLoading) return;
    setGenLoading(true);
    let sc: Scenario | null = null;
    try {
      const res = await fetch("/api/french/scenario", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recent: recentPlacesRef.current.slice(-12) }),
      });
      const data = await res.json();
      if (data.scenario && data.scenario.opener?.fr) {
        const s = data.scenario;
        sc = {
          id: `ai-${Date.now()}`,
          label: s.label,
          emoji: s.emoji || "📍",
          setting: s.setting || "",
          scene: Array.isArray(s.scene) && s.scene.length ? s.scene : [s.emoji || "✨"],
          bg: "linear-gradient(160deg, rgba(124,92,224,0.24), rgba(20,16,28,0.96))",
          character: s.character || "🧑",
          opener: s.opener,
        };
        setNoKey(false);
      } else if (data.fallback) {
        setNoKey(true);
      }
    } catch {
      /* fall through */
    }
    if (!sc) sc = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    await prefetchSpeech(sc.opener.fr, "fr-FR");
    setGenLoading(false);
    begin(sc);
  }

  useEffect(() => {
    // Warm just the first few openers so the picker is snappy, without firing a
    // speech request for every place at once.
    SCENARIOS.slice(0, 6).forEach((sc) => prefetchSpeech(sc.opener.fr, "fr-FR"));
    return () => {
      runningRef.current = false;
    };
  }, []);

  function warm(sc: Scenario) {
    prefetchSpeech(sc.opener.fr, "fr-FR");
  }

  function askAtlas() {
    if (!suggestion) return;
    setRevealAtlas(true);
    speakNaturalOnly(suggestion.fr, "fr-FR");
  }

  function push(m: Msg) {
    messagesRef.current = [...messagesRef.current, m];
    setMessages(messagesRef.current);
  }

  async function childTurn() {
    if (!runningRef.current || busyRef.current) return;
    busyRef.current = true;
    setPhase("listening");
    setRevealAtlas(false);
    const lastAiLine = [...messagesRef.current].reverse().find((m) => m.who === "ai")?.fr || "";
    // Give the child plenty of thinking time: wait up to 5 seconds of quiet
    // before deciding they've finished, and allow a long total turn. They can
    // tap "I'm done" to send straight away.
    const res = await listen(25000, { prompt: lastAiLine, silenceMs: 5000 });
    busyRef.current = false;
    if (!runningRef.current) return;
    if (res === null) {
      // Microphone blocked or unavailable — pause rather than spamming the AI.
      setPhase("paused");
      return;
    }
    const said = (res.text || "").trim();
    if (said) {
      emptyRef.current = 0;
      const words = said.split(/\s+/).filter(Boolean).length;
      if (words >= 4 && levelRef.current < 5) levelRef.current += 1;
      push({ who: "child", fr: said });
    } else {
      emptyRef.current += 1;
      if (levelRef.current > 1) levelRef.current -= 1;
      if (emptyRef.current >= 3) {
        // Don't let the AI talk to itself — wait for the child to tap.
        setPhase("paused");
        return;
      }
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
    setSuggestion(null);
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
          level: levelRef.current,
        }),
      });
      const data = await res.json();
      if (data.reply && data.reply.fr) {
        fr = data.reply.fr;
        en = data.reply.en || "";
        hint_en = data.reply.hint_en || "";
        if (data.reply.suggestion_fr) {
          setSuggestion({ fr: data.reply.suggestion_fr, en: data.reply.suggestion_en || "" });
        }
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

  async function begin(sc: Scenario) {
    scenarioRef.current = sc;
    recentPlacesRef.current = [sc.label, ...recentPlacesRef.current.filter((l) => l !== sc.label)].slice(0, 12);
    setScenario(sc);
    messagesRef.current = [];
    setMessages([]);
    aiTurnsRef.current = 0;
    emptyRef.current = 0;
    levelRef.current = 2;
    setHint("");
    setSuggestion(null);
    setRevealAtlas(false);
    runningRef.current = true;
    // Start instantly with the scenario's own opener (audio is pre-warmed), then
    // hand over to the AI for every following turn.
    aiTurnsRef.current = 1;
    push({ who: "ai", fr: sc.opener.fr, en: sc.opener.en });
    setHint(sc.opener.hint_en);
    setPhase("speaking");
    await speakNaturalOnly(sc.opener.fr, "fr-FR");
    if (!runningRef.current) return;
    await wait(250);
    await childTurn();
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
        <p className="text-sm text-paper/75">
          Pick a place, or get a surprise one. You&apos;ll chat with someone there — just talk! Take your time, and tap
          🦉 Ask Atlas if you get stuck.
        </p>
        <button
          onClick={surprise}
          disabled={genLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-diamond/50 p-3 font-pixel text-[11px] text-paper shadow-pixel disabled:opacity-60"
          style={{ background: "linear-gradient(160deg, rgba(124,92,224,0.3), rgba(20,16,28,0.96))" }}
        >
          {genLoading ? "✨ Finding a new place…" : "🎲 Surprise place!"}
        </button>
        <div className="grid grid-cols-2 gap-3">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => begin(sc)}
              onMouseEnter={() => warm(sc)}
              onTouchStart={() => warm(sc)}
              disabled={genLoading}
              className="flex flex-col gap-1 rounded-2xl border-4 border-black/50 p-4 text-left shadow-pixel disabled:opacity-60"
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
          {scenario.character || "🧑‍🍳"}
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
        {phase === "paused" && <p className="text-sm text-gold2">Ready when you are — tap 🎙️ to talk</p>}
        {phase === "listening" && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-grasstop">🎙️ Your turn — take your time</p>
            <div className="h-2 w-44 overflow-hidden rounded-full bg-paper/15">
              <div className="h-full rounded-full bg-grasstop" style={{ width: `${Math.round(mic * 100)}%` }} />
            </div>
            <button
              onClick={stopEarly}
              className="rounded-xl border-2 border-grasstop/50 bg-grass/15 px-5 py-2 text-sm font-semibold text-paper"
            >
              ✓ I&apos;m done
            </button>
            <p className="text-[11px] text-paper/40">No rush — tap when you&apos;ve finished talking.</p>
          </div>
        )}
        {hint && phase !== "thinking" && <p className="mt-1 text-[12px] text-gold2">💡 {hint}</p>}
        {revealAtlas && suggestion && (
          <div className="mt-1">
            <p className="text-[12px] text-grasstop">
              💬 Try saying: <span className="font-semibold">{suggestion.fr}</span>
            </p>
            {suggestion.en && <p className="text-[11px] text-paper/55">({suggestion.en})</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => lastAi && speakNaturalOnly(lastAi.fr, "fr-FR")}
          className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/85"
        >
          🔊 Say again
        </button>
        {suggestion && (phase === "listening" || phase === "paused") && (
          <button
            onClick={askAtlas}
            className="rounded-lg border-2 border-gold/50 bg-gold/10 px-3 py-2 text-xs text-gold2"
          >
            🦉 Ask Atlas
          </button>
        )}
        {runningRef.current && phase === "paused" && (
          <button onClick={childTurn} className="rounded-lg border-2 border-grasstop/40 bg-grass/10 px-4 py-2 text-sm text-paper/85">
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
