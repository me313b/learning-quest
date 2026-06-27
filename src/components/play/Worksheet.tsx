"use client";

import { useMemo, useState } from "react";
import {
  getOrCreateTodaySession,
  recordAttempt,
  todayAttempts,
  updateSession,
} from "@/lib/data";
import { startDifficulty } from "@/lib/adaptive";
import { earnedMinutesFromAttempts } from "@/lib/rewards";
import { CORE_SUBJECTS, SUBJECTS } from "@/lib/config";
import { toChildProfile } from "@/lib/profile";
import type { Profile, Question, Verdict } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";

type Phase = "setup" | "loading" | "ready" | "marking" | "done";

interface SheetItem {
  subject: string;
  question: Question;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Shrink a phone photo to a sensible size before upload: large enough for the
// AI to read handwriting, small enough to stay well under the server cap and
// upload quickly. Falls back to the raw file if anything goes wrong.
async function fileToB64(file: File): Promise<{ b64: string; mediaType: string }> {
  const readRaw = () =>
    new Promise<{ b64: string; mediaType: string }>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const dataUrl = String(r.result);
        const comma = dataUrl.indexOf(",");
        const meta = dataUrl.slice(0, comma);
        const b64 = dataUrl.slice(comma + 1);
        const mediaType = meta.match(/data:(.*?);/)?.[1] || file.type || "image/jpeg";
        resolve({ b64, mediaType });
      };
      r.onerror = () => reject(new Error("Could not read the photo."));
      r.readAsDataURL(file);
    });

  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const cctx = canvas.getContext("2d");
    if (!cctx) return await readRaw();
    cctx.drawImage(bitmap, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    return { b64, mediaType: "image/jpeg" };
  } catch {
    return await readRaw();
  }
}

export default function Worksheet({
  profile,
  onBack,
  onDone,
}: {
  profile: Profile;
  onBack: () => void;
  onDone: () => void;
}) {
  // Worksheet-eligible subjects: core (minus art) plus enabled extras, no physics/art.
  const eligible = useMemo(() => {
    const extras = (profile.enabled_subjects || []).filter(
      (s) => s !== "physics" && !CORE_SUBJECTS.includes(s) && SUBJECTS[s]?.grading !== "creative",
    );
    return [...CORE_SUBJECTS.filter((s) => SUBJECTS[s]?.grading !== "creative"), ...extras];
  }, [profile.enabled_subjects]);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selected, setSelected] = useState<string[]>(eligible);
  const [perSubject, setPerSubject] = useState(4);
  const [items, setItems] = useState<SheetItem[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [marks, setMarks] = useState<Record<number, Verdict>>({});
  const [marking, setMarking] = useState(false);
  const [markNote, setMarkNote] = useState("");
  const [finalEarned, setFinalEarned] = useState(0);
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function toggle(s: string) {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function generate() {
    setPhase("loading");
    const difficulties: Record<string, number> = {};
    for (const s of selected) {
      difficulties[s] = startDifficulty(s, profile.strengths || {}, profile.ability || {});
    }
    try {
      const res = await fetch("/api/worksheet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjects: selected,
          profile: toChildProfile(profile),
          perSubject,
          difficulties,
        }),
      });
      const data = await res.json();
      setItems((data.items as SheetItem[]) || []);
      setMarks({});
      setPhase("ready");
    } catch {
      setItems([]);
      setPhase("ready");
    }
  }

  async function markByPhoto(file: File) {
    setMarking(true);
    setMarkNote("");
    try {
      const { b64, mediaType } = await fileToB64(file);
      const payload = items.map((it, i) => ({
        n: i + 1,
        prompt: it.question.prompt,
        expected: it.question.answer || "",
        type: it.question.type,
        options: it.question.options,
      }));
      const res = await fetch("/api/grade-worksheet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: payload, imageB64: b64, mediaType }),
      });
      const data = await res.json();
      const results = (data.results as { n: number; verdict: Verdict }[]) || [];
      if (!results.length) {
        setMarkNote(
          "I couldn't read the photo automatically (this needs an AI key, and a clear, well-lit photo). You can mark it by hand below instead.",
        );
      } else {
        const next: Record<number, Verdict> = {};
        for (const r of results) next[r.n] = r.verdict;
        setMarks(next);
        setMarkNote("I've marked it from the photo — check it over and adjust any you need to.");
      }
    } catch {
      setMarkNote("Something went wrong reading the photo. You can mark it by hand below.");
    } finally {
      setMarking(false);
    }
  }

  function setMark(n: number, v: Verdict) {
    setMarks((prev) => ({ ...prev, [n]: v }));
  }

  async function saveResults() {
    setSaving(true);
    try {
      const subjectsUsed = Array.from(new Set(items.map((i) => i.subject)));
      let sid: string | null = null;
      try {
        const session = await getOrCreateTodaySession(profile.id, subjectsUsed);
        sid = session.id;
      } catch {
        sid = null;
      }

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const verdict: Verdict = marks[i + 1] || "incorrect";
        try {
          await recordAttempt({
            profile_id: profile.id,
            session_id: sid,
            subject: it.subject,
            topic: it.question.topic,
            skill: it.question.skill,
            difficulty: it.question.difficulty,
            qtype: it.question.type,
            prompt: it.question.prompt,
            correct_answer: it.question.answer || "",
            user_answer: "(paper worksheet)",
            verdict,
            time_taken: 0,
          });
        } catch {
          /* keep going */
        }
      }

      let earned = 0;
      try {
        const todays = await todayAttempts(profile.id);
        earned = earnedMinutesFromAttempts(todays);
        if (sid) await updateSession(sid, { earned_minutes: earned, completed: true });
      } catch {
        /* ignore */
      }
      setFinalEarned(earned);
      setPhase("done");
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------------------------- //
  // Setup
  // ----------------------------------------------------------------------- //
  if (phase === "setup") {
    return (
      <div className="space-y-5">
        <div className="mc-card-dark space-y-4">
          <div>
            <h2 className="font-pixel text-xs text-grasstop">📄 Paper worksheet</h2>
            <p className="mt-2 text-sm text-paper/80">
              Make a worksheet to print (or save as PDF). {profile.name} does it on paper, then you
              snap a photo or tick the answers here and the video time is added.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-paper/70">Subjects</p>
            <div className="grid grid-cols-2 gap-2">
              {eligible.map((s) => {
                const on = selected.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className={`flex items-center justify-between rounded-xl border-4 px-3 py-2 text-left text-sm transition ${
                      on ? "border-grasstop bg-grass/20 text-paper" : "border-black/40 bg-black/20 text-paper/60"
                    }`}
                  >
                    <span>
                      {SUBJECTS[s].emoji} {SUBJECTS[s].label}
                    </span>
                    <span>{on ? "✅" : "➕"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-paper/70">Questions per subject</p>
            <div className="flex gap-2">
              {[3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setPerSubject(n)}
                  className={`flex-1 rounded-xl border-4 px-3 py-2 font-pixel text-[11px] transition ${
                    perSubject === n
                      ? "border-grasstop bg-grass/25 text-paper"
                      : "border-black/40 bg-black/20 text-paper/60"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <PixelButton onClick={generate} disabled={selected.length === 0} className="w-full">
            Make worksheet 📄
          </PixelButton>
        </div>

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

  if (phase === "loading") {
    return (
      <div className="mc-card-dark animate-pulse py-10 text-center text-paper/60">
        Building the worksheet…
      </div>
    );
  }

  // ----------------------------------------------------------------------- //
  // Done
  // ----------------------------------------------------------------------- //
  if (phase === "done") {
    return (
      <div className="mc-card-dark space-y-4 text-center">
        <div className="text-5xl">🏆</div>
        <p className="font-pixel text-sm text-grasstop">Worksheet marked!</p>
        <p className="text-paper/80">
          {profile.name} earned <span className="font-bold text-diamond">{finalEarned} minutes</span>{" "}
          of video time.
        </p>
        <PixelButton onClick={onDone} className="w-full">
          Back to home
        </PixelButton>
      </div>
    );
  }

  // ----------------------------------------------------------------------- //
  // Marking
  // ----------------------------------------------------------------------- //
  if (phase === "marking") {
    const markedCount = Object.keys(marks).length;
    return (
      <div className="space-y-5">
        <div className="mc-card-dark space-y-3">
          <h2 className="font-pixel text-xs text-grasstop">✅ Mark the answers</h2>
          <p className="text-sm text-paper/80">
            Quickest way: take a clear photo of the finished sheet and I&apos;ll mark it (needs an AI
            key). Or tick each one by hand below.
          </p>

          <label className="block">
            <span className="mb-1 block text-xs text-paper/70">📷 Photo of the completed sheet</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) markByPhoto(f);
              }}
              className="block w-full text-sm text-paper/80 file:mr-3 file:rounded-lg file:border-0 file:bg-grass file:px-4 file:py-2 file:font-pixel file:text-[10px] file:text-white"
            />
          </label>
          {marking && <p className="text-xs text-diamond">Reading the photo…</p>}
          {markNote && <p className="text-xs text-paper/70">{markNote}</p>}
        </div>

        <div className="mc-card-dark space-y-3">
          <p className="font-pixel text-[11px] text-paper/70">
            Tick each question ({markedCount}/{items.length} marked)
          </p>
          <div className="space-y-2">
            {items.map((it, i) => {
              const n = i + 1;
              const v = marks[n];
              return (
                <div
                  key={n}
                  className="rounded-xl border-2 border-black/30 bg-black/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-paper/90">
                      <span className="font-pixel text-[10px] text-paper/50">Q{n}.</span>{" "}
                      {it.question.prompt}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gold">Answer: {it.question.answer || "open answer"}</p>
                  <div className="mt-2 flex gap-2">
                    {(["correct", "partial", "incorrect"] as Verdict[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setMark(n, opt)}
                        className={`rounded-lg border-2 px-3 py-1 text-xs transition ${
                          v === opt
                            ? opt === "correct"
                              ? "border-emerald bg-emerald/20 text-paper"
                              : opt === "partial"
                                ? "border-gold bg-gold/20 text-paper"
                                : "border-redstone bg-redstone/20 text-paper"
                            : "border-black/40 bg-black/20 text-paper/60"
                        }`}
                      >
                        {opt === "correct" ? "✓ Right" : opt === "partial" ? "~ Half" : "✗ Wrong"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <PixelButton onClick={saveResults} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save & add video time 🎬"}
          </PixelButton>
          <p className="text-[11px] text-paper/40">
            Anything left unticked counts as not-yet-correct, so it can come back another day.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setPhase("ready")}
            className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[10px] text-paper/80"
          >
            ← Back to the sheet
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------- //
  // Ready: the printable sheet
  // ----------------------------------------------------------------------- //
  let lastSubject = "";
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <PixelButton onClick={() => window.print()}>🖨️ Print / Save as PDF</PixelButton>
        <button
          onClick={() => setShowKey((v) => !v)}
          className="rounded-xl border-4 border-black/40 bg-black/30 px-4 py-3 font-pixel text-[11px] text-paper/80"
        >
          {showKey ? "Hide answer key" : "Show answer key"}
        </button>
        <PixelButton onClick={() => setPhase("marking")}>✅ Mark answers</PixelButton>
      </div>

      <div className="print-area">
        <div className="sheet rounded-2xl border-4 border-black/20 p-7 shadow-pixel">
          <div className="flex items-end justify-between border-b-2 border-black/20 pb-3">
            <div>
              <h1 className="text-2xl font-extrabold">Learning Quest</h1>
              <p className="text-sm text-black/60">Daily practice worksheet</p>
            </div>
            <div className="text-right text-sm">
              <div>
                <span className="text-black/50">Name:</span>{" "}
                <span className="font-semibold">{profile.name}</span>
              </div>
              <div>
                <span className="text-black/50">Date:</span> {today}
              </div>
              <div>
                <span className="text-black/50">Score:</span> ____ / {items.length}
              </div>
            </div>
          </div>

          <ol className="mt-4 space-y-5">
            {items.map((it, i) => {
              const showHeading = it.subject !== lastSubject;
              lastSubject = it.subject;
              const q = it.question;
              return (
                <li key={i} className="break-inside-avoid">
                  {showHeading && (
                    <h2 className="mb-3 mt-2 text-base font-bold text-black/80">
                      {SUBJECTS[it.subject].emoji} {SUBJECTS[it.subject].label}
                    </h2>
                  )}
                  <div className="flex gap-2">
                    <span className="font-bold">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium">{q.prompt}</p>

                      {q.type === "multiple_choice" && q.options.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="text-sm">
                              <span className="font-semibold">{LETTERS[oi]})</span> {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === "numeric" && (
                        <div className="answer-box mt-2 w-28" aria-hidden />
                      )}

                      {(q.type === "short_text" || q.type === "open") && (
                        <div className="mt-3 space-y-3">
                          <div className="answer-line" aria-hidden />
                          <div className="answer-line" aria-hidden />
                        </div>
                      )}

                      {q.type === "multiple_choice" && (
                        <div className="mt-2 text-sm">
                          My answer:{" "}
                          <span className="inline-block w-16 border-b-2 border-dotted border-black/40" />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-6 border-t-2 border-black/10 pt-3 text-center text-xs text-black/50">
            Great effort! Bring this back to {profile.name ? "the app" : "the app"} to add your video time. ⭐
          </p>
        </div>
      </div>

      {showKey && (
        <div className="no-print mc-card-dark">
          <h3 className="mb-2 font-pixel text-xs text-gold">Answer key (for grown-ups)</h3>
          <ol className="space-y-1 text-sm text-paper/85">
            {items.map((it, i) => (
              <li key={i}>
                <span className="font-pixel text-[10px] text-paper/50">{i + 1}.</span>{" "}
                {it.question.answer ? (
                  <span className="text-paper">{it.question.answer}</span>
                ) : (
                  <span className="text-paper/60">open / written answer</span>
                )}
                {it.question.solution ? (
                  <span className="text-paper/50"> — {it.question.solution}</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="no-print flex justify-center">
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
