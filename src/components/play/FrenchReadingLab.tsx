"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chime, primeVoices, speakSmart } from "@/lib/speech";
import { takeReadingStory } from "@/lib/prefetch";
import type { ReadingStory } from "@/lib/ai";
import { PixelButton } from "@/components/ui/primitives";

// Read-and-understand French. The app makes a tiny French story, reads it aloud,
// then asks the child to say what it was about and answer a few questions — so
// they have to understand it first, not just decode words.

export default function FrenchReadingLab({ onBack }: { onBack: () => void }) {
  const [story, setStory] = useState<ReadingStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"ok" | "needsKey" | "failed">("ok");
  const [showEn, setShowEn] = useState(false);
  const [phase, setPhase] = useState<"read" | "questions">("read");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryDone, setSummaryDone] = useState(false);
  const [level, setLevel] = useState(2);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem("lq_reading_level"));
      if (v >= 1 && v <= 5) setLevel(v);
    } catch {
      /* default level */
    }
  }, []);

  const generate = useCallback(
    async (lv?: number) => {
      const useLevel = lv ?? level;
      setLoading(true);
      setStatus("ok");
      setStory(null);
      setShowEn(false);
      setPhase("read");
      setAnswers({});
      setSubmitted(false);
      setSummary("");
      setSummaryDone(false);
      try {
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ level: useLevel }),
        });
        const data = await res.json();
        if (data.needsKey) setStatus("needsKey");
        else if (data.story) setStory(data.story as ReadingStory);
        else setStatus("failed");
      } catch {
        setStatus("failed");
      } finally {
        setLoading(false);
      }
    },
    [level],
  );

  function changeLevel(delta: number) {
    const next = Math.max(1, Math.min(5, level + delta));
    if (next === level) return;
    setLevel(next);
    try {
      localStorage.setItem("lq_reading_level", String(next));
    } catch {
      /* ignore */
    }
    generate(next);
  }

  useEffect(() => {
    primeVoices();
    const pre = takeReadingStory();
    if (pre) {
      setStory(pre);
      setLoading(false);
    } else {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const correctCount =
    story && submitted
      ? story.questions.filter((q, i) => answers[i] === q.answer).length
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xs text-grasstop">📖 French Reading</h2>
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← Labs
        </button>
      </div>

      {loading && (
        <div className="mc-card-dark animate-pulse py-14 text-center text-paper/60">
          ✍️ Writing a little French story…
        </div>
      )}

      {!loading && status === "needsKey" && (
        <div className="mc-card text-center text-sm text-paper/80">
          Reading stories are written by AI, so a grown-up needs to add an AI key in{" "}
          <span className="font-semibold text-grasstop">Parent area → Settings</span> first.
        </div>
      )}

      {!loading && status === "failed" && (
        <div className="mc-card-dark text-center">
          <p className="text-sm text-paper/80">That story didn&apos;t come out right.</p>
          <button
            onClick={() => generate()}
            className="mt-3 rounded-xl border-4 border-black/40 bg-grass px-4 py-2 font-pixel text-[11px] text-white"
          >
            ↻ Try another
          </button>
        </div>
      )}

      {!loading && story && (
        <>
          <div className="mc-card-dark">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-bold text-gold">{story.title_fr}</h3>
              <button
                onClick={() => speakSmart(story.story_fr, "fr-FR")}
                className="shrink-0 rounded-lg border-2 border-diamond bg-diamond/15 px-3 py-1.5 text-sm text-paper"
              >
                🔊 Listen
              </button>
            </div>

            <p className="mt-1 text-[11px] text-paper/45">👆 Tap any word to hear it and see what it means.</p>
            <ClickableStory text={story.story_fr} gloss={story.gloss} />

            <button onClick={() => setShowEn((v) => !v)} className="mt-3 text-xs text-paper/60 underline">
              {showEn ? "Hide English" : "Show English"}
            </button>
            {showEn && (
              <p className="mt-2 rounded-lg border-l-4 border-grasstop/60 bg-black/20 p-2 text-sm text-paper/80">
                {story.story_en}
              </p>
            )}

            {/* Reading level — start easy, build up like a teacher */}
            <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-black/30 bg-black/20 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-paper/60">Level</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-2.5 w-2.5 rounded-full ${n <= level ? "bg-grasstop" : "bg-paper/20"}`}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => changeLevel(-1)}
                  disabled={level <= 1}
                  className="rounded-lg border-2 border-black/40 bg-black/30 px-2.5 py-1 text-xs text-paper/80 disabled:opacity-40"
                >
                  Easier
                </button>
                <button
                  onClick={() => changeLevel(1)}
                  disabled={level >= 5}
                  className="rounded-lg border-2 border-grasstop/60 bg-grass/15 px-2.5 py-1 text-xs text-paper disabled:opacity-40"
                >
                  Harder
                </button>
              </div>
            </div>
          </div>

          {phase === "read" ? (
            <div className="flex flex-col gap-3">
              {story.glossary && story.glossary.length > 0 && (
                <WordHelper glossary={story.glossary} />
              )}
              <PixelButton onClick={() => setPhase("questions")} className="w-full">
                I&apos;ve read it — let&apos;s answer! →
              </PixelButton>
              <button
                onClick={() => generate()}
                className="w-full rounded-xl border-2 border-black/40 bg-black/25 px-4 py-2 font-pixel text-[10px] text-paper/70"
              >
                🎲 Next story →
              </button>
            </div>
          ) : (
            <>
              {/* Summary in the child's own words */}
              <div className="mc-card-dark">
                <p className="font-pixel text-[11px] text-grasstop">{story.summary_prompt}</p>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  placeholder="Tell me what the story was about…"
                  className="mc-input mt-2"
                />
                {!summaryDone ? (
                  <PixelButton
                    onClick={() => {
                      setSummaryDone(true);
                      chime("correct");
                    }}
                    disabled={summary.trim().length < 3}
                    className="mt-2"
                  >
                    Done ✓
                  </PixelButton>
                ) : (
                  <p className="mt-2 text-sm text-grasstop">
                    Great thinking! Here it is in English: <span className="text-paper/80">{story.story_en}</span>
                  </p>
                )}
              </div>

              {/* Comprehension questions */}
              <div className="mc-card-dark space-y-4">
                <p className="font-pixel text-[11px] text-grasstop">Questions about the story</p>
                {story.questions.map((q, i) => (
                  <div key={i}>
                    <p className="mb-2 text-sm text-paper/90">
                      {i + 1}. {q.q}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt) => {
                        const chosen = answers[i] === opt;
                        const isAnswer = q.answer === opt;
                        const show = submitted && (isAnswer || chosen);
                        return (
                          <button
                            key={opt}
                            disabled={submitted}
                            onClick={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                            className={`rounded-xl border-4 px-3 py-2 text-left text-sm text-paper transition ${
                              show
                                ? isAnswer
                                  ? "border-emerald bg-emerald/20"
                                  : "border-redstone bg-redstone/20"
                                : chosen
                                  ? "border-diamond bg-diamond/15"
                                  : "border-black/40 bg-black/20"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!submitted ? (
                  <PixelButton
                    onClick={() => {
                      setSubmitted(true);
                      const allRight = story.questions.every((q, i) => answers[i] === q.answer);
                      chime(allRight ? "done" : "hint");
                    }}
                    disabled={Object.keys(answers).length < story.questions.length}
                    className="w-full"
                  >
                    Check my answers ✓
                  </PixelButton>
                ) : (
                  <div className="space-y-2 text-center">
                    <p className="font-pixel text-xs text-grasstop">
                      You got {correctCount} / {story.questions.length}! 🎉
                    </p>
                  </div>
                )}
              </div>

              {/* Speak your answer in French */}
              {story.speak && (
                <SpeakAnswer key={story.story_fr.slice(0, 24)} speak={story.speak} />
              )}

              <PixelButton onClick={() => generate()} className="w-full">
                🎲 Next story →
              </PixelButton>
            </>
          )}
        </>
      )}

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
// Speak-your-answer: the child answers a French question OUT LOUD, we transcribe
// it with Whisper (in French) and check it against the expected French answer,
// giving friendly feedback in French. Needs an OpenAI key for the checking; if
// there isn't one we just play their recording back.
// --------------------------------------------------------------------------- //
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

function SpeakAnswer({ speak }: { speak: NonNullable<ReadingStory["speak"]> }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"" | "good" | "tryagain" | "playback" | "error">("");
  const [showAns, setShowAns] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const urlRef = useRef<string | null>(null);

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
        const ok =
          norm(t).includes(norm(speak.answer_fr)) || norm(speak.answer_fr).includes(norm(t));
        setOutcome(ok ? "good" : "tryagain");
        if (ok) {
          chime("correct");
          speakSmart("Très bien !", "fr-FR");
        } else {
          speakSmart("Essaie encore.", "fr-FR");
        }
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
    <div className="mc-card-dark space-y-3">
      <p className="font-pixel text-[11px] text-grasstop">🎙️ Réponds en français</p>
      <div className="rounded-lg border-l-4 border-diamond/60 bg-black/20 p-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-semibold text-paper">{speak.question_fr}</p>
          <button
            onClick={() => speakSmart(speak.question_fr, "fr-FR")}
            aria-label="Hear the question"
            className="shrink-0 rounded-lg border-2 border-black/40 bg-black/25 px-2.5 py-1 text-sm"
          >
            🔊
          </button>
        </div>
        <p className="text-[11px] text-paper/60">{speak.question_en}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        {!recording ? (
          <PixelButton onClick={start} disabled={busy}>
            {busy ? "Listening…" : "🎙️ Say my answer"}
          </PixelButton>
        ) : (
          <button
            onClick={stop}
            className="rounded-xl border-4 border-redstone/70 bg-redstone/20 px-5 py-3 font-pixel text-xs text-paper"
          >
            ⏹ Stop
          </button>
        )}

        {heard && (
          <p className="text-xs text-paper/70">
            I heard: <span className="text-paper">“{heard}”</span>
          </p>
        )}
        {outcome === "good" && <p className="text-sm text-grasstop">✅ Très bien ! That&apos;s right.</p>}
        {outcome === "tryagain" && (
          <p className="text-sm text-gold">
            Presque ! Try again —{" "}
            <button onClick={() => speakSmart(speak.answer_fr, "fr-FR")} className="underline">
              hear it
            </button>
          </p>
        )}
        {outcome === "playback" && (
          <p className="text-center text-xs text-paper/60">
            Here&apos;s your recording. French checking needs an OpenAI key in Settings.
          </p>
        )}
        {outcome === "error" && (
          <p className="text-xs text-redstone">I couldn&apos;t use the microphone — check permissions.</p>
        )}
      </div>

      <div className="flex justify-center gap-4 text-xs">
        <button onClick={() => speakSmart(speak.answer_fr, "fr-FR")} className="text-paper/60 underline">
          🔊 Hear the answer
        </button>
        <button onClick={() => setShowAns((v) => !v)} className="text-paper/60 underline">
          {showAns ? "Hide answer" : "Show answer"}
        </button>
      </div>
      {showAns && (
        <p className="text-center text-sm">
          <span className="font-semibold text-gold">{speak.answer_fr}</span>{" "}
          <span className="text-paper/60">— {speak.answer_en}</span>
        </p>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Word helper: pick a tricky French word, hear it, read a hint, then GUESS what
// it means from a few choices. Turns vocabulary into a little game so the child
// works it out rather than just being told.
// --------------------------------------------------------------------------- //
function WordHelper({ glossary }: { glossary: NonNullable<ReadingStory["glossary"]> }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [learned, setLearned] = useState<number[]>([]);
  const word = glossary[idx];

  const options = useMemo(() => {
    const others = glossary
      .filter((_, i) => i !== idx)
      .map((g) => g.en)
      .filter((en) => en !== word.en);
    const distractors = [...others].sort(() => Math.random() - 0.5).slice(0, 2);
    return [word.en, ...distractors].sort(() => Math.random() - 0.5);
  }, [idx, glossary, word.en]);

  const solved = picked === word.en;

  function choose(opt: string) {
    setPicked(opt);
    if (opt === word.en) {
      chime("correct");
      speakSmart("Oui !", "fr-FR");
      setLearned((l) => (l.includes(idx) ? l : [...l, idx]));
    }
  }

  function next() {
    setIdx((i) => (i + 1) % glossary.length);
    setPicked(null);
  }

  return (
    <div className="rounded-xl border-2 border-diamond/40 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-pixel text-[11px] text-diamond">🔑 Word helper</p>
        <p className="text-[10px] text-paper/50">
          Learned {learned.length}/{glossary.length}
        </p>
      </div>

      <div className="rounded-lg bg-black/20 p-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl font-bold text-gold">{word.fr}</span>
          <button
            onClick={() => speakSmart(word.fr, "fr-FR")}
            aria-label="Hear the word"
            className="rounded-lg border-2 border-black/40 bg-black/30 px-2 py-0.5 text-sm"
          >
            🔊
          </button>
        </div>
        {word.hint && <p className="mt-1 text-xs text-paper/70">💡 {word.hint}</p>}
      </div>

      {options.length >= 2 ? (
        <>
          <p className="mt-2 text-center text-[11px] text-paper/60">Can you guess what it means?</p>
          <div className="mt-1 grid grid-cols-1 gap-1.5">
            {options.map((opt) => {
              const isAns = opt === word.en;
              const show = picked && (isAns || opt === picked);
              return (
                <button
                  key={opt}
                  disabled={solved}
                  onClick={() => choose(opt)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm text-paper ${
                    show
                      ? isAns
                        ? "border-emerald bg-emerald/20"
                        : "border-redstone bg-redstone/20"
                      : "border-black/40 bg-black/20"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-2 text-center text-sm text-paper/80">
          It means <span className="font-semibold text-grasstop">{word.en}</span>.
        </p>
      )}

      {picked && !solved && (
        <p className="mt-2 text-center text-xs text-gold">Not quite — try another!</p>
      )}
      {solved && <p className="mt-2 text-center text-xs text-grasstop">✅ Oui ! It means “{word.en}”.</p>}

      {glossary.length > 1 && (
        <button
          onClick={next}
          className="mt-2 w-full rounded-lg border-2 border-black/40 bg-black/30 px-3 py-1.5 font-pixel text-[10px] text-paper/70"
        >
          Next word →
        </button>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Clickable story: every word is tappable. Tapping speaks the word in French
// and shows its English meaning (from the story's word gloss) — like having a
// teacher next to you to ask "what does this mean?".
// --------------------------------------------------------------------------- //
function normWord(w: string): string {
  return w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z' ]/gi, "")
    .trim();
}

function ClickableStory({ text, gloss }: { text: string; gloss?: { fr: string; en: string }[] }) {
  const [sel, setSel] = useState<{ word: string; meaning: string | null } | null>(null);

  const map = useMemo(() => {
    const m = new Map<string, string>();
    (gloss || []).forEach((g) => m.set(normWord(g.fr), g.en));
    return m;
  }, [gloss]);

  const tokens = text.split(/(\s+)/);

  function tap(rawToken: string) {
    const clean = rawToken.replace(/[.,!?;:«»"“”()]/g, "").trim();
    const key = normWord(clean);
    if (!key) return;
    setSel({ word: clean, meaning: map.get(key) || null });
    speakSmart(key, "fr-FR");
  }

  return (
    <>
      <p className="mt-2 text-xl leading-relaxed text-paper">
        {tokens.map((t, i) => {
          if (!t.trim()) return <span key={i}>{t}</span>;
          const isWord = /[a-zà-ÿ]/i.test(t);
          if (!isWord) return <span key={i}>{t}</span>;
          return (
            <span
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => tap(t)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") tap(t);
              }}
              className="cursor-pointer rounded underline decoration-dotted decoration-paper/25 underline-offset-4 transition-colors hover:bg-diamond/15 active:bg-diamond/30"
            >
              {t}
            </span>
          );
        })}
      </p>

      {sel && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border-2 border-diamond/50 bg-diamond/10 px-3 py-2">
          <div className="min-w-0">
            <span className="text-lg font-bold text-gold">{sel.word}</span>
            {sel.meaning ? (
              <span className="ml-2 text-sm text-paper/85">= {sel.meaning}</span>
            ) : (
              <span className="ml-2 text-xs text-paper/50">tap 🔊 to hear it again</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => speakSmart(normWord(sel.word), "fr-FR")}
              aria-label="Hear the word"
              className="rounded-lg border-2 border-black/40 bg-black/25 px-2.5 py-1 text-sm"
            >
              🔊
            </button>
            <button onClick={() => setSel(null)} aria-label="Close" className="px-1 text-paper/50">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
