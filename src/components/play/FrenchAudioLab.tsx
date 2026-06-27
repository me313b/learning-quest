"use client";

import { useEffect, useRef, useState } from "react";
import { chime, primeVoices, probeServerVoice, speakSmart } from "@/lib/speech";
import { Banner, PixelButton } from "@/components/ui/primitives";

// A reliable French lab built as fixed templates (so audio always works). Four
// activities: hear words, listen-and-choose, build a sentence, and say-it
// (record your voice and the app checks it). Audio uses the high-quality server
// voice with a browser fallback; recording uses speech-to-text when available.

interface Word {
  fr: string;
  en: string;
  emoji: string;
}

const CATEGORIES: Record<string, { label: string; emoji: string; words: Word[] }> = {
  colours: {
    label: "Colours",
    emoji: "🎨",
    words: [
      { fr: "rouge", en: "red", emoji: "🔴" },
      { fr: "bleu", en: "blue", emoji: "🔵" },
      { fr: "vert", en: "green", emoji: "🟢" },
      { fr: "jaune", en: "yellow", emoji: "🟡" },
      { fr: "noir", en: "black", emoji: "⚫" },
      { fr: "blanc", en: "white", emoji: "⚪" },
      { fr: "orange", en: "orange", emoji: "🟠" },
      { fr: "violet", en: "purple", emoji: "🟣" },
    ],
  },
  animals: {
    label: "Animals",
    emoji: "🐾",
    words: [
      { fr: "chat", en: "cat", emoji: "🐱" },
      { fr: "chien", en: "dog", emoji: "🐶" },
      { fr: "oiseau", en: "bird", emoji: "🐦" },
      { fr: "poisson", en: "fish", emoji: "🐟" },
      { fr: "cheval", en: "horse", emoji: "🐴" },
      { fr: "lapin", en: "rabbit", emoji: "🐰" },
      { fr: "vache", en: "cow", emoji: "🐮" },
      { fr: "cochon", en: "pig", emoji: "🐷" },
    ],
  },
  food: {
    label: "Food",
    emoji: "🍎",
    words: [
      { fr: "pomme", en: "apple", emoji: "🍎" },
      { fr: "pain", en: "bread", emoji: "🍞" },
      { fr: "lait", en: "milk", emoji: "🥛" },
      { fr: "fromage", en: "cheese", emoji: "🧀" },
      { fr: "banane", en: "banana", emoji: "🍌" },
      { fr: "gâteau", en: "cake", emoji: "🍰" },
      { fr: "œuf", en: "egg", emoji: "🥚" },
      { fr: "eau", en: "water", emoji: "💧" },
    ],
  },
  numbers: {
    label: "Numbers",
    emoji: "🔢",
    words: [
      { fr: "un", en: "one", emoji: "1️⃣" },
      { fr: "deux", en: "two", emoji: "2️⃣" },
      { fr: "trois", en: "three", emoji: "3️⃣" },
      { fr: "quatre", en: "four", emoji: "4️⃣" },
      { fr: "cinq", en: "five", emoji: "5️⃣" },
      { fr: "six", en: "six", emoji: "6️⃣" },
      { fr: "sept", en: "seven", emoji: "7️⃣" },
      { fr: "huit", en: "eight", emoji: "8️⃣" },
    ],
  },
  greetings: {
    label: "Greetings",
    emoji: "👋",
    words: [
      { fr: "bonjour", en: "hello", emoji: "☀️" },
      { fr: "au revoir", en: "goodbye", emoji: "👋" },
      { fr: "merci", en: "thank you", emoji: "🙏" },
      { fr: "oui", en: "yes", emoji: "✅" },
      { fr: "non", en: "no", emoji: "❌" },
      { fr: "bravo", en: "well done", emoji: "🎉" },
    ],
  },
};

const SENTENCES: { en: string; words: string[] }[] = [
  { en: "I have a cat", words: ["J'ai", "un", "chat"] },
  { en: "I am tall", words: ["Je", "suis", "grand"] },
  { en: "I like bread", words: ["J'aime", "le", "pain"] },
  { en: "The cat is red", words: ["Le", "chat", "est", "rouge"] },
  { en: "I have a dog", words: ["J'ai", "un", "chien"] },
  { en: "I like cheese", words: ["J'aime", "le", "fromage"] },
  { en: "I am happy", words: ["Je", "suis", "content"] },
  { en: "The dog is black", words: ["Le", "chien", "est", "noir"] },
];

const SAY_PHRASES: Word[] = [
  { fr: "bonjour", en: "hello", emoji: "☀️" },
  { fr: "merci", en: "thank you", emoji: "🙏" },
  { fr: "j'ai un chat", en: "I have a cat", emoji: "🐱" },
  { fr: "j'ai un chien", en: "I have a dog", emoji: "🐶" },
  { fr: "le chat est noir", en: "the cat is black", emoji: "🐈‍⬛" },
  { fr: "j'aime le fromage", en: "I like cheese", emoji: "🧀" },
  { fr: "je suis content", en: "I am happy", emoji: "😊" },
  { fr: "la pomme est rouge", en: "the apple is red", emoji: "🍎" },
  { fr: "au revoir", en: "goodbye", emoji: "👋" },
  { fr: "j'ai trois chiens", en: "I have three dogs", emoji: "🐶" },
];

type Mode = "learn" | "listen" | "sentence" | "say";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function blobToB64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = String(r.result || "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function FrenchAudioLab({ onBack }: { onBack: () => void }) {
  const [catKey, setCatKey] = useState<string>("colours");
  const [mode, setMode] = useState<Mode>("learn");
  const [basicVoice, setBasicVoice] = useState(false);
  const cat = CATEGORIES[catKey];

  useEffect(() => {
    primeVoices();
    let alive = true;
    probeServerVoice().then((s) => {
      if (alive) setBasicVoice(s === "fallback");
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xs text-grasstop">🇫🇷 French · Listen &amp; Speak</h2>
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← Labs
        </button>
      </div>

      {basicVoice && (
        <Banner variant="dirt">
          You&apos;re hearing the basic browser voice. For a natural French accent, add an{" "}
          <b>OpenAI</b> key in Parent area → Settings.
        </Banner>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["learn", "🔊 Hear words"],
            ["listen", "🎧 Listen & choose"],
            ["sentence", "🧩 Build a sentence"],
            ["say", "🎙️ Say it"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-xl border-4 px-2 py-2 font-pixel text-[9px] transition ${
              mode === m
                ? "border-grasstop bg-grass/25 text-paper"
                : "border-black/40 bg-black/20 text-paper/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(mode === "learn" || mode === "listen") && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button
              key={key}
              onClick={() => setCatKey(key)}
              className={`rounded-lg border-2 px-2.5 py-1 text-xs transition ${
                key === catKey
                  ? "border-grasstop bg-grass/20 text-paper"
                  : "border-black/40 bg-black/20 text-paper/70"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {mode === "learn" && <LearnMode words={cat.words} />}
      {mode === "listen" && <ListenMode catKey={catKey} />}
      {mode === "sentence" && <SentenceMode />}
      {mode === "say" && <SayMode />}

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[10px] text-paper/80"
        >
          ← Back to labs
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- //
function LearnMode({ words }: { words: Word[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {words.map((w) => (
        <button
          key={w.fr}
          onClick={() => speakSmart(w.fr, "fr-FR")}
          className="mc-card-dark flex flex-col items-center gap-1 py-4 active:translate-y-0.5"
        >
          <span className="text-4xl">{w.emoji}</span>
          <span className="font-semibold text-paper">{w.fr}</span>
          <span className="text-[11px] text-paper/60">{w.en}</span>
          <span className="text-sm">🔊</span>
        </button>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------- //
function ListenMode({ catKey }: { catKey: string }) {
  const [target, setTarget] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [picked, setPicked] = useState<Word | null>(null);
  const [score, setScore] = useState(0);

  const newRound = (key: string) => {
    const words = CATEGORIES[key].words;
    const t = words[Math.floor(Math.random() * words.length)];
    const distractors = shuffle(words.filter((w) => w.fr !== t.fr)).slice(0, 3);
    setTarget(t);
    setOptions(shuffle([t, ...distractors]));
    setPicked(null);
    setTimeout(() => speakSmart(t.fr, "fr-FR"), 250);
  };

  useEffect(() => {
    newRound(catKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey]);

  function choose(w: Word) {
    if (picked || !target) return;
    setPicked(w);
    speakSmart(target.fr, "fr-FR");
    if (w.fr === target.fr) {
      chime("correct");
      setScore((s) => s + 1);
    }
  }

  if (!target) return null;

  return (
    <div className="space-y-4">
      <div className="mc-card-dark text-center">
        <p className="text-sm text-paper/80">Listen, then tap what you hear</p>
        <button
          onClick={() => speakSmart(target.fr, "fr-FR")}
          className="mt-3 rounded-2xl border-4 border-diamond bg-diamond/15 px-6 py-4 text-3xl active:translate-y-0.5"
          aria-label="Play the word again"
        >
          🔊 Play again
        </button>
        <p className="mt-2 font-pixel text-[10px] text-paper/50">Score: {score}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((w) => {
          const isTarget = picked && target.fr === w.fr;
          const isWrongPick = picked && picked.fr === w.fr && picked.fr !== target.fr;
          return (
            <button
              key={w.fr}
              onClick={() => choose(w)}
              className={`flex flex-col items-center gap-1 rounded-xl border-4 py-5 transition ${
                isTarget
                  ? "border-emerald bg-emerald/20"
                  : isWrongPick
                    ? "border-redstone bg-redstone/20"
                    : "border-black/40 bg-black/20"
              }`}
            >
              <span className="text-4xl">{w.emoji}</span>
              {picked && <span className="text-xs text-paper/70">{w.fr}</span>}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="space-y-2 text-center">
          <p className="font-pixel text-xs text-grasstop">
            {picked.fr === target.fr ? "Oui ! Bravo ! 🎉" : `That was "${target.fr}"`}
          </p>
          <PixelButton onClick={() => newRound(catKey)} className="w-full">
            Next word →
          </PixelButton>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
function SentenceMode() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * SENTENCES.length));
  const [tiles, setTiles] = useState<{ id: number; word: string }[]>([]);
  const [builtIds, setBuiltIds] = useState<number[]>([]);
  const [checked, setChecked] = useState<"" | "ok" | "no">("");

  const sentence = SENTENCES[idx];

  useEffect(() => {
    const t = SENTENCES[idx].words.map((word, id) => ({ id, word }));
    setTiles(shuffle(t));
    setBuiltIds([]);
    setChecked("");
  }, [idx]);

  const builtWords = builtIds.map((id) => tiles.find((t) => t.id === id)?.word || "");
  const remaining = tiles.filter((t) => !builtIds.includes(t.id));

  function check() {
    const ok = builtWords.join(" ") === sentence.words.join(" ");
    setChecked(ok ? "ok" : "no");
    if (ok) {
      chime("correct");
      speakSmart(sentence.words.join(" "), "fr-FR");
    }
  }

  return (
    <div className="space-y-4">
      <div className="mc-card-dark text-center">
        <p className="text-xs uppercase tracking-wide text-paper/50">Make this sentence</p>
        <p className="mt-1 text-lg font-semibold text-gold">{sentence.en}</p>
      </div>

      <div className="flex min-h-[56px] flex-wrap items-center gap-2 rounded-xl border-4 border-dashed border-black/40 bg-black/20 p-3">
        {builtWords.length === 0 && (
          <span className="text-sm text-paper/40">Tap the words below in order…</span>
        )}
        {builtIds.map((id) => {
          const word = tiles.find((t) => t.id === id)?.word || "";
          return (
            <button
              key={id}
              onClick={() => setBuiltIds((b) => b.filter((x) => x !== id))}
              className="rounded-lg border-2 border-diamond bg-diamond/15 px-3 py-1.5 text-sm text-paper"
            >
              {word}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {remaining.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setBuiltIds((b) => [...b, t.id]);
              setChecked("");
            }}
            className="rounded-lg border-2 border-black/40 bg-grass/20 px-3 py-1.5 text-sm text-paper"
          >
            {t.word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => speakSmart(builtWords.join(" ") || sentence.words.join(" "), "fr-FR")}
          className="rounded-xl border-2 border-black/40 bg-black/25 px-3 py-2 text-sm text-paper/85"
        >
          🔊 Hear it
        </button>
        <button
          onClick={check}
          disabled={remaining.length > 0}
          className="rounded-xl border-4 border-black/40 bg-grass px-4 py-2 font-pixel text-[11px] text-white disabled:opacity-40"
        >
          ✓ Check
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % SENTENCES.length)}
          className="rounded-xl border-2 border-black/40 bg-black/20 px-3 py-2 font-pixel text-[10px] text-paper/70"
        >
          Next →
        </button>
      </div>

      {checked === "ok" && (
        <p className="text-center font-pixel text-xs text-grasstop">Parfait ! 🎉</p>
      )}
      {checked === "no" && (
        <p className="text-center text-sm text-gold">
          Not quite — tap a word to take it back and try again.
        </p>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
function SayMode() {
  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"" | "good" | "tryagain" | "playback" | "error">("");
  const [showFr, setShowFr] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const urlRef = useRef<string | null>(null);

  const phrase = SAY_PHRASES[idx];

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function start() {
    setHeard(null);
    setOutcome("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
      const mime =
        candidates.find(
          (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
        ) || "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => finish(mr.mimeType || mime || "audio/webm");
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setOutcome("error");
    }
  }

  function stop() {
    try {
      mediaRef.current?.stop();
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  async function finish(mime: string) {
    setBusy(true);
    try {
      const blob = new Blob(chunksRef.current, { type: mime });
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      const audioB64 = await blobToB64(blob);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ audioB64, mime, language: "fr" }),
      });
      const data = await res.json();
      if (typeof data.text === "string" && data.text.trim()) {
        const t = data.text.trim();
        setHeard(t);
        const ok = norm(t).includes(norm(phrase.fr)) || norm(phrase.fr).includes(norm(t));
        setOutcome(ok ? "good" : "tryagain");
        if (ok) chime("correct");
      } else {
        setOutcome("playback");
        const a = new Audio(urlRef.current);
        a.play().catch(() => {});
      }
    } catch {
      setOutcome("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mc-card-dark text-center">
        <p className="text-xs uppercase tracking-wide text-paper/50">Say this in French 🎙️</p>
        <div className="mt-2 text-4xl">{phrase.emoji}</div>
        <p className="mt-1 text-2xl font-semibold text-paper">{phrase.en}</p>
        {showFr ? (
          <p className="mt-1 text-lg font-semibold text-gold">{phrase.fr}</p>
        ) : (
          <button
            onClick={() => setShowFr(true)}
            className="mt-1 text-xs text-paper/50 underline"
          >
            Show me the French
          </button>
        )}
        <div className="mt-3 flex justify-center gap-2">
          <button
            onClick={() => speakSmart(phrase.fr, "fr-FR")}
            className="rounded-xl border-2 border-black/40 bg-black/25 px-3 py-1.5 text-sm text-paper/85"
          >
            🔊 Hear how
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        {!recording ? (
          <button
            onClick={start}
            disabled={busy}
            className="rounded-2xl border-4 border-redstone bg-redstone/20 px-6 py-4 font-pixel text-[11px] text-paper disabled:opacity-50"
          >
            🎙️ {busy ? "Listening…" : "Tap to record"}
          </button>
        ) : (
          <button
            onClick={stop}
            className="animate-pulse rounded-2xl border-4 border-redstone bg-redstone/40 px-6 py-4 font-pixel text-[11px] text-paper"
          >
            ⏹ Stop &amp; check
          </button>
        )}
        <p className="text-[11px] text-paper/50">Your grown-up may need to allow the microphone.</p>
      </div>

      {heard && (
        <div className="mc-card-dark text-center">
          <p className="text-xs text-paper/60">I heard:</p>
          <p className="text-lg text-paper">&ldquo;{heard}&rdquo;</p>
        </div>
      )}

      {outcome === "good" && (
        <p className="text-center font-pixel text-xs text-grasstop">Super ! That sounded great! 🎉</p>
      )}
      {outcome === "tryagain" && (
        <div className="text-center">
          <p className="text-sm text-gold">Close! Have a listen and try once more.</p>
          <button
            onClick={() => speakSmart(phrase.fr, "fr-FR")}
            className="mt-2 rounded-lg border-2 border-black/40 bg-black/25 px-3 py-1.5 text-sm text-paper/85"
          >
            🔊 Hear it again
          </button>
        </div>
      )}
      {outcome === "playback" && (
        <p className="text-center text-sm text-paper/70">
          Played your recording back. For the app to check your French, add an OpenAI key in
          Settings.
        </p>
      )}
      {outcome === "error" && (
        <p className="text-center text-sm text-gold">Couldn&apos;t use the microphone this time.</p>
      )}

      <div className="flex justify-center">
        <PixelButton
          onClick={() => {
            setIdx((i) => (i + 1) % SAY_PHRASES.length);
            setShowFr(false);
            setHeard(null);
            setOutcome("");
          }}
        >
          Next phrase →
        </PixelButton>
      </div>
    </div>
  );
}
