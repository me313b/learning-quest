"use client";

import { useEffect, useRef, useState } from "react";
import {
  coveredSkillsThisWeek,
  getOrCreateTodaySession,
  persistAbility,
  recentTopics,
  recordAttempt,
  todayAttempts,
  unresolvedSkills,
  updateSession,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { checkObjective, nextDifficulty, startDifficulty, updateAbility } from "@/lib/adaptive";
import { earnedMinutesFromAttempts } from "@/lib/rewards";
import { fallbackQuestion, randomEncourage, randomFact, randomPraise } from "@/lib/content";
import {
  EASY_MISS_MAX_DIFFICULTY,
  QUESTIONS_PER_SUBJECT,
  SECONDS_PER_QUESTION,
  SKILL_AREAS,
  SUBJECTS,
} from "@/lib/config";
import { toChildProfile } from "@/lib/profile";
import type { ArtResult, GradeResult, Profile, Question, Verdict } from "@/lib/types";
import CountdownTimer from "@/components/CountdownTimer";
import { DifficultyPips, PixelButton } from "@/components/ui/primitives";
import FunIllustration, { randomFunIndex } from "@/components/ui/FunIllustration";
import Confetti from "@/components/ui/Confetti";
import { motion } from "framer-motion";
import { chime, primeVoices, speakSmart } from "@/lib/speech";

// Each non-creative question runs as: answer (60s) -> if wrong, a specific hint
// and ONE more try -> if the retry is right, half the reward (recorded as
// "partial"); if it's wrong, reveal the answer. Only the FINAL outcome is
// recorded, so the reward maths (1 min correct / 30s second-try / -30s on an
// easy miss) all flows from that single attempt.

type Phase = "loading" | "question" | "hint" | "feedback" | "between" | "done";

interface ResultView {
  verdict: Verdict;
  secondTry: boolean;
  deltaSeconds: number;
  correctAnswer: string;
  solution: string;
  feedback: string;
  correction: string;
  tip: string;
  art?: ArtResult;
}

// What grading a single submission produced, before we decide what to record.
interface RawGrade {
  verdict: Verdict; // correct | partial | incorrect | timeout
  correctAnswer: string;
  solution: string;
  correction: string;
  tip: string;
  art?: ArtResult;
  userAnswerText: string;
  elapsed: number;
}

function threshold(subject: string): number {
  return subject === "art" ? 1 : QUESTIONS_PER_SUBJECT;
}

function rewardDelta(verdict: Verdict, difficulty: number): number {
  if (verdict === "correct") return 60;
  if (verdict === "partial") return 30;
  if (difficulty <= EASY_MISS_MAX_DIFFICULTY) return -30;
  return 0;
}

function deltaMessage(delta: number): string {
  if (delta >= 60) return "+1 minute earned! ⏱️";
  if (delta > 0) return "+½ minute earned (you used a hint).";
  if (delta < 0) return "Let’s practise this one again so we can win the time back. 💪";
  return "";
}

function fileToB64(file: File): Promise<{ b64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = String(r.result);
      const comma = dataUrl.indexOf(",");
      const meta = dataUrl.slice(0, comma);
      const b64 = dataUrl.slice(comma + 1);
      const mediaType = meta.match(/data:(.*?);/)?.[1] || file.type || "image/png";
      resolve({ b64, mediaType });
    };
    r.onerror = () => reject(new Error("Could not read the photo."));
    r.readAsDataURL(file);
  });
}

export default function Quiz({
  profile,
  subjects,
  language = "en",
  onDone,
  onExit,
}: {
  profile: Profile;
  subjects: string[];
  language?: "en" | "fr";
  onDone: () => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [subjIdx, setSubjIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [difficulty, setDifficulty] = useState(3);
  const [answer, setAnswer] = useState("");
  const [choice, setChoice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<ResultView | null>(null);
  const [subjVerdicts, setSubjVerdicts] = useState<Record<string, Verdict[]>>({});
  const [finalEarned, setFinalEarned] = useState(0);
  const [fact, setFact] = useState("");
  const [funIdx, setFunIdx] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [hintText, setHintText] = useState("");
  const [hintLead, setHintLead] = useState("");

  // Refs mirror the state that async callbacks (timer, grading) need to read.
  const phaseRef = useRef<Phase>("loading");
  const questionRef = useRef<Question | null>(null);
  const subjIdxRef = useRef(0);
  const countRef = useRef(0);
  const difficultyRef = useRef(3);
  const seedsRef = useRef<string[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const abilityRef = useRef<Record<string, number>>({ ...(profile.ability || {}) });
  const answerRef = useRef("");
  const choiceRef = useRef("");
  const fileRef = useRef<File | null>(null);
  const submittingRef = useRef(false);
  const startedAtRef = useRef(0);
  const attemptRef = useRef(1);

  const setPhaseR = (v: Phase) => {
    phaseRef.current = v;
    setPhase(v);
  };

  const currentSubject = subjects[subjIdx] || subjects[0] || "maths";

  useEffect(() => {
    if (!subjects.length) {
      onExit();
      return;
    }
    primeVoices();
    (async () => {
      let sid: string | null = null;
      try {
        const session = await getOrCreateTodaySession(profile.id, subjects);
        sid = session.id;
      } catch {
        sid = null;
      }
      sessionIdRef.current = sid;
      await beginSubject(0, sid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen-first French questions: play the French as soon as the question shows.
  useEffect(() => {
    if (phase === "question" && question?.listening && question.audioText) {
      speakSmart(question.audioText, question.audioLanguage || "fr-FR");
    }
  }, [question, phase]);

  async function beginSubject(idx: number, sid: string | null) {
    const s = subjects[idx];
    subjIdxRef.current = idx;
    setSubjIdx(idx);
    const startDiff = startDifficulty(s, profile.strengths || {}, abilityRef.current);
    difficultyRef.current = startDiff;
    setDifficulty(startDiff);
    let sk: string[] = [];
    try {
      sk = await unresolvedSkills(profile.id, s, 2);
    } catch {
      sk = [];
    }
    // Weekly skill scheduler: lead with the weak/unresolved skills, then rotate
    // in curriculum skills not yet covered this week, so practice spreads across
    // the whole subject rather than repeating the same few areas.
    let coveredWk: string[] = [];
    try {
      coveredWk = await coveredSkillsThisWeek(profile.id, s);
    } catch {
      coveredWk = [];
    }
    const curriculum = SKILL_AREAS[s] || [];
    const coveredSet = new Set(coveredWk.map((c) => c.toLowerCase()));
    const uncovered = curriculum.filter((c) => !coveredSet.has(c.toLowerCase()));
    const seeds: string[] = [];
    for (const x of [...sk, ...uncovered, ...curriculum]) {
      if (x && !seeds.includes(x)) seeds.push(x);
    }
    seedsRef.current = seeds;
    countRef.current = 0;
    setCount(0);
    await loadQuestion(s, startDiff, 0, sk, sid);
  }

  function resetInputs() {
    setAnswer("");
    setChoice("");
    setFile(null);
    answerRef.current = "";
    choiceRef.current = "";
    fileRef.current = null;
    startedAtRef.current = Date.now();
  }

  async function loadQuestion(
    s: string,
    diff: number,
    idx: number,
    seeds: string[],
    sid: string | null,
  ) {
    setPhaseR("loading");
    attemptRef.current = 1;
    setAttempt(1);
    setHintText("");
    const targetSkills = idx < seeds.length ? [seeds[idx]] : [];
    let recent: string[] = [];
    try {
      recent = await recentTopics(profile.id, s, 6);
    } catch {
      recent = [];
    }
    let covered: string[] = [];
    try {
      covered = await coveredSkillsThisWeek(profile.id, s);
    } catch {
      covered = [];
    }

    let q: Question | null = null;
    try {
      const isLast = idx === threshold(s) - 1 && SUBJECTS[s]?.grading !== "creative";
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: s,
          profile: toChildProfile(profile),
          difficulty: diff,
          recentTopics: recent,
          targetSkills,
          coveredThisWeek: covered,
          language,
          reasoning: isLast,
        }),
      });
      const data = await res.json();
      q = (data.question as Question) || null;
    } catch {
      q = null;
    }
    if (!q) q = fallbackQuestion(s, diff, toChildProfile(profile));

    questionRef.current = q;
    setQuestion(q);
    resetInputs();
    sessionIdRef.current = sid;
    setPhaseR("question");
  }

  // Grade the current submission WITHOUT recording it. Returns a raw verdict.
  async function gradeCurrent(q: Question, s: string): Promise<RawGrade> {
    const elapsed = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

    if (q.type === "creative") {
      let art: ArtResult;
      try {
        const { b64, mediaType } = await fileToB64(fileRef.current!);
        uploadArt(profile.id, fileRef.current!).catch(() => {});
        const res = await fetch("/api/grade-art", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ imageB64: b64, mediaType, profile: toChildProfile(profile) }),
        });
        const data = await res.json();
        art = data.result as ArtResult;
      } catch {
        art = {
          praise: "Wow, what a brilliant drawing! 🎨",
          noticed: "I can see real effort here.",
          idea: "Try adding a background next time!",
        };
      }
      return {
        verdict: "correct",
        correctAnswer: "",
        solution: art.noticed,
        correction: "",
        tip: art.idea,
        art,
        userAnswerText: "[drawing uploaded]",
        elapsed,
      };
    }

    const raw = q.type === "multiple_choice" ? choiceRef.current : answerRef.current;
    const userAnswerText = (raw || "").trim();
    const correctAnswer = q.answer || "";

    if (!userAnswerText) {
      return {
        verdict: "timeout",
        correctAnswer,
        solution: q.solution || "",
        correction: correctAnswer,
        tip: "",
        userAnswerText: "",
        elapsed,
      };
    }

    const local = checkObjective(q, userAnswerText);
    if (local === "correct" || local === "incorrect") {
      return {
        verdict: local,
        correctAnswer,
        solution: q.solution || "",
        correction: local === "incorrect" ? correctAnswer : "",
        tip: "",
        userAnswerText,
        elapsed,
      };
    }

    // Open answer -> AI grade.
    try {
      const res = await fetch("/api/grade-answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: s,
          question: q,
          userAnswer: userAnswerText,
          profile: toChildProfile(profile),
        }),
      });
      const data = await res.json();
      const gr = data.result as GradeResult;
      return {
        verdict: gr.verdict,
        correctAnswer,
        solution: q.solution || "",
        correction: gr.correction || "",
        tip: gr.tip || "",
        userAnswerText,
        elapsed,
      };
    } catch {
      return {
        verdict: "partial",
        correctAnswer,
        solution: q.solution || "",
        correction: "",
        tip: "",
        userAnswerText,
        elapsed,
      };
    }
  }

  // Record the FINAL outcome for a question, update difficulty/ability, show it.
  async function commit(
    q: Question,
    s: string,
    finalVerdict: Verdict,
    g: RawGrade,
    opts: { secondTry: boolean; feedback: string; reveal: boolean },
  ) {
    try {
      await recordAttempt({
        profile_id: profile.id,
        session_id: sessionIdRef.current,
        subject: s,
        topic: q.topic,
        skill: q.skill,
        difficulty: q.difficulty || difficultyRef.current,
        qtype: q.type,
        prompt: q.prompt,
        correct_answer: g.correctAnswer,
        user_answer: g.userAnswerText,
        verdict: finalVerdict,
        time_taken: g.elapsed,
      });
    } catch {
      /* keep playing even if the write fails */
    }

    const newAbility = updateAbility(abilityRef.current[s], difficultyRef.current, finalVerdict);
    abilityRef.current = { ...abilityRef.current, [s]: newAbility };
    persistAbility(profile, s, newAbility).catch(() => {});
    difficultyRef.current = nextDifficulty(difficultyRef.current, finalVerdict);
    setDifficulty(difficultyRef.current);

    setSubjVerdicts((prev) => ({ ...prev, [s]: [...(prev[s] || []), finalVerdict] }));
    countRef.current += 1;
    setCount(countRef.current);

    const delta = rewardDelta(finalVerdict, q.difficulty || difficultyRef.current);
    setResult({
      verdict: finalVerdict,
      secondTry: opts.secondTry,
      deltaSeconds: delta,
      correctAnswer: g.correctAnswer,
      solution: g.solution,
      feedback: opts.feedback,
      correction: opts.reveal ? g.correctAnswer : "",
      tip: g.tip,
      art: g.art,
    });
    setFunIdx(randomFunIndex());
    if (finalVerdict === "correct") {
      chime("correct");
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1300);
      const cheers = ["Well done!", "Brilliant!", "Awesome!", "You got it!", "Nice one!", "Super work!", "Fantastic!"];
      speakSmart(cheers[Math.floor(Math.random() * cheers.length)], "en-GB");
    } else if (finalVerdict === "partial" && opts.secondTry) {
      chime("hint");
      speakSmart("Well done for getting there!", "en-GB");
    } else if (opts.reveal) {
      speakSmart("Good try! Let's look at this one together.", "en-GB");
    }
    setGrading(false);
    submittingRef.current = false;
    setPhaseR("feedback");
  }

  async function submit() {
    if (phaseRef.current !== "question" || submittingRef.current) return;
    const q = questionRef.current;
    if (!q) return;
    const s = subjects[subjIdxRef.current];
    if (q.type === "creative" && !fileRef.current) return;

    submittingRef.current = true;
    setGrading(true);

    const g = await gradeCurrent(q, s);

    // Creative work has no second chance: it's always a celebrated success.
    if (q.type === "creative") {
      await commit(q, s, "correct", g, { secondTry: false, feedback: g.art?.praise || "Lovely work!", reveal: false });
      return;
    }

    const success = g.verdict === "correct";

    if (attemptRef.current === 1) {
      if (success) {
        await commit(q, s, "correct", g, { secondTry: false, feedback: randomPraise(), reveal: false });
      } else {
        // First miss: show a specific hint and give one more go. Nothing recorded yet.
        setHintText(q.hint || "Think about what the question is really asking, step by step.");
        setHintLead(
          g.verdict === "timeout"
            ? "Time ran out, but no worries! Here’s a hint, then try again. ⏳"
            : "Not quite yet! Here’s a hint to help you. You’ve got this. 💡",
        );
        attemptRef.current = 2;
        setAttempt(2);
        setGrading(false);
        submittingRef.current = false;
        setPhaseR("hint");
      }
    } else {
      // Second attempt is the decider.
      if (success || g.verdict === "partial") {
        await commit(q, s, "partial", g, {
          secondTry: true,
          feedback: "You got there with a hint — brilliant! 🎉",
          reveal: false,
        });
      } else {
        await commit(q, s, g.verdict, g, {
          secondTry: true,
          feedback: "Good effort. Let’s look at how it works together.",
          reveal: true,
        });
      }
    }
  }

  function tryAgain() {
    // Back to the same question for the second attempt, fresh timer.
    resetInputs();
    setPhaseR("question");
  }

  function next() {
    const s = subjects[subjIdxRef.current];
    if (countRef.current >= threshold(s)) {
      setFact(randomFact());
      setFunIdx(randomFunIndex());
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1600);
      setPhaseR("between");
    } else {
      loadQuestion(s, difficultyRef.current, countRef.current, seedsRef.current, sessionIdRef.current);
    }
  }

  async function cont() {
    const nextIdx = subjIdxRef.current + 1;
    if (nextIdx >= subjects.length) {
      await finalize();
    } else {
      await beginSubject(nextIdx, sessionIdRef.current);
    }
  }

  // The child is enjoying it and wants to keep going: one more question in the
  // same subject. (Extra questions still earn time and XP like any other.)
  function more() {
    loadQuestion(
      subjects[subjIdxRef.current],
      difficultyRef.current,
      countRef.current,
      seedsRef.current,
      sessionIdRef.current,
    );
  }

  // Start the whole quest over from the first subject.
  async function playAgain() {
    await beginSubject(0, sessionIdRef.current);
  }

  async function finalize() {
    setPhaseR("loading");
    try {
      const today = await todayAttempts(profile.id);
      const earned = earnedMinutesFromAttempts(today);
      setFinalEarned(earned);
      if (sessionIdRef.current) {
        await updateSession(sessionIdRef.current, { earned_minutes: earned, completed: true });
      }
    } catch {
      /* ignore */
    }
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2200);
    setPhaseR("done");
  }

  async function uploadArt(profileId: string, f: File) {
    const supabase = createClient();
    const ext = (f.name.split(".").pop() || "png").toLowerCase();
    const path = `${profileId}/${Date.now()}.${ext}`;
    await supabase.storage.from("art").upload(path, f, { upsert: false });
  }

  // ----------------------------------------------------------------------- //
  // Render
  // ----------------------------------------------------------------------- //
  const meta = SUBJECTS[currentSubject];
  const total = threshold(currentSubject);
  const qNum = Math.min(count + (phase === "feedback" ? 0 : 1), total);

  const canCheck =
    !grading &&
    question != null &&
    (question.type === "creative"
      ? file != null
      : question.type === "multiple_choice"
        ? choice.trim().length > 0
        : answer.trim().length > 0);

  return (
    <div className="relative mx-auto max-w-3xl space-y-5">
      {celebrate && <Confetti />}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-pixel text-sm text-paper">
          <span className="text-2xl">{meta?.emoji}</span>
          <span>{meta?.label}</span>
        </div>
        <span className="text-sm text-paper/60">
          {phase === "between" || phase === "done" ? "" : `Q ${qNum} / ${total}`}
        </span>
      </div>

      {phase !== "between" && phase !== "done" && (
        <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-grass to-emerald"
            initial={false}
            animate={{ width: `${total ? (qNum / total) * 100 : 0}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>
      )}

      {phase !== "between" && phase !== "done" && (
        <div className="flex items-center justify-between">
          <DifficultyPips level={difficulty} />
          <button onClick={onExit} className="text-[11px] text-paper/50 underline">
            Exit
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="mc-card-dark animate-pulse py-10 text-center text-paper/60">
          Mining a fresh question…
        </div>
      )}

      {phase === "question" && question && (
        <div className="mc-card-dark space-y-5">
          <div className="flex items-center gap-2">
            {question.topic && (
              <span className="inline-block rounded-md bg-black/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-grasstop">
                {question.topic}
              </span>
            )}
            {attempt === 2 && (
              <span className="inline-block rounded-md bg-gold/20 px-2.5 py-1 text-[11px] font-semibold text-gold">
                2nd try · half time
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="text-2xl font-semibold leading-snug text-paper sm:text-3xl">
              {question.displayText || question.prompt}
            </p>
            <button
              onClick={() => {
                const at = question.audioText?.trim();
                if (at) speakSmart(at, question.audioLanguage || "fr-FR");
                else
                  speakSmart(
                    question.displayText || question.prompt,
                    language === "fr" ? "fr-FR" : "en-GB",
                  );
              }}
              title="Hear it"
              aria-label="Hear it"
              className="shrink-0 rounded-xl border-2 border-black/40 bg-black/20 px-3.5 py-2.5 text-xl active:translate-y-0.5"
            >
              🔊
            </button>
          </div>

          {question.listening && question.audioText && (
            <p className="text-center text-xs text-paper/50">🎧 Listen and choose — tap 🔊 to hear it again</p>
          )}

          {attempt === 2 && hintText && (
            <p className="rounded-lg border-2 border-gold/40 bg-gold/10 p-2 text-sm text-paper/85">
              💡 {hintText}
            </p>
          )}

          {question.type === "multiple_choice" && (
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((opt) => {
                const on = choice === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      setChoice(opt);
                      choiceRef.current = opt;
                    }}
                    className={`flex items-center justify-between gap-2 rounded-2xl border-4 px-5 py-4 text-left text-lg text-paper transition ${
                      on ? "border-diamond bg-diamond/15" : "border-black/40 bg-black/20"
                    }`}
                  >
                    <span>{opt}</span>
                    {currentSubject === "french" && (
                      <span
                        role="button"
                        aria-label={`Hear ${opt}`}
                        title="Hear it"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakSmart(opt, "fr-FR");
                        }}
                        className="shrink-0 rounded-md bg-black/30 px-2 py-1 text-sm"
                      >
                        🔊
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {question.type === "numeric" && (
            <input
              inputMode="decimal"
              className="mc-input text-lg"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                answerRef.current = e.target.value;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCheck) submit();
              }}
              placeholder="Type your answer"
              autoFocus
            />
          )}

          {(question.type === "short_text" || question.type === "open") && (
            <textarea
              className="mc-input text-base"
              rows={2}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                answerRef.current = e.target.value;
              }}
              placeholder="Write your answer"
              autoFocus
            />
          )}

          {question.type === "creative" && (
            <div className="space-y-2">
              <p className="text-sm text-paper/70">Draw it on paper, then snap a photo to upload.</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  fileRef.current = f;
                }}
                className="block w-full text-sm text-paper/80 file:mr-3 file:rounded-lg file:border-0 file:bg-grass file:px-4 file:py-2 file:font-pixel file:text-[10px] file:text-white"
              />
              {file && <p className="text-xs text-emerald">Photo ready: {file.name}</p>}
            </div>
          )}

          {question.type !== "creative" && (
            <CountdownTimer
              key={`${subjIdx}-${count}-${attempt}`}
              seconds={SECONDS_PER_QUESTION}
              onExpire={() => submit()}
            />
          )}

          <PixelButton onClick={() => submit()} disabled={!canCheck} className="w-full py-4 text-sm">
            {grading ? "Checking…" : attempt === 2 ? "Try again" : "Check answer"}
          </PixelButton>
        </div>
      )}

      {phase === "hint" && question && (
        <div className="mc-card-dark space-y-4">
          <p className="font-pixel text-xs text-gold">Hint time!</p>
          <p className="text-sm text-paper/80">{hintLead}</p>
          <p className="text-lg font-semibold leading-snug text-paper/90">{question.prompt}</p>
          <p className="rounded-lg border-2 border-gold/40 bg-gold/10 p-3 text-sm text-paper/90">
            💡 {hintText}
          </p>
          <PixelButton onClick={tryAgain} className="w-full">
            Give it another go →
          </PixelButton>
        </div>
      )}

      {phase === "feedback" && result && (
        <div
          className={`mc-card-dark space-y-3 ${
            result.verdict === "correct" || (result.verdict === "partial" && result.secondTry)
              ? "animate-pop border-emerald"
              : ""
          }`}
        >
          <div className="text-center">
            {result.verdict === "correct" || (result.verdict === "partial" && result.secondTry) ? (
              <FunIllustration index={funIdx} />
            ) : (
              <div className="text-5xl">💪</div>
            )}
            <p className="mt-2 font-pixel text-sm text-grasstop">
              {result.verdict === "correct"
                ? "Correct!"
                : result.verdict === "partial"
                  ? "Got it!"
                  : result.verdict === "timeout"
                    ? "Out of time"
                    : "Not quite"}
            </p>
          </div>

          <p className="text-lg text-paper/90">{result.feedback}</p>

          {currentSubject === "french" && result.correctAnswer && (
            <button
              onClick={() => speakSmart(result.correctAnswer, "fr-FR")}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-black/40 bg-black/25 px-3 py-1.5 text-sm text-paper/85"
            >
              🔊 Hear &ldquo;{result.correctAnswer}&rdquo; in French
            </button>
          )}

          {deltaMessage(result.deltaSeconds) && (
            <p
              className={`text-sm font-semibold ${
                result.deltaSeconds > 0 ? "text-emerald" : result.deltaSeconds < 0 ? "text-gold" : "text-paper/70"
              }`}
            >
              {deltaMessage(result.deltaSeconds)}
            </p>
          )}

          {result.correction && (
            <p className="text-sm text-paper/80">
              <span className="text-gold">Answer:</span> {result.correction}
            </p>
          )}
          {result.solution && <p className="mc-fact text-sm">{result.solution}</p>}
          {result.tip && (
            <p className="text-sm text-paper/70">
              <span className="text-diamond">Tip:</span> {result.tip}
            </p>
          )}

          <PixelButton onClick={next} className="w-full py-4 text-sm">
            {countRef.current >= total ? "Finish subject →" : "Next question →"}
          </PixelButton>
        </div>
      )}

      {phase === "between" && (
        <div className="mc-card-dark space-y-4 text-center">
          <p className="font-pixel text-xs text-grasstop">{meta?.label} complete!</p>
          <FunIllustration index={funIdx} />
          <div className="text-3xl">
            {(() => {
              const v = subjVerdicts[currentSubject] || [];
              const correct = v.filter((x) => x === "correct").length;
              const ratio = v.length ? correct / v.length : 0;
              const stars = ratio >= 0.99 ? 3 : ratio >= 0.6 ? 2 : correct > 0 ? 1 : 0;
              return "⭐".repeat(stars) + "☆".repeat(3 - stars);
            })()}
          </div>
          <p className="mc-fact text-left text-sm">
            <span className="font-semibold text-gold">Fun fact:</span> {fact}
          </p>
          <PixelButton onClick={cont} className="w-full py-4 text-sm">
            {subjIdxRef.current + 1 >= subjects.length ? "See my rewards →" : "Next subject →"}
          </PixelButton>
          <button
            onClick={more}
            className="w-full rounded-xl border-2 border-grasstop/60 bg-grass/10 px-4 py-2 font-pixel text-[10px] text-grasstop"
          >
            🎲 A few more {meta?.label} questions
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="mc-card-dark space-y-4 text-center">
          <div className="text-5xl">🏆</div>
          <p className="font-pixel text-sm text-grasstop">Quest complete!</p>
          <p className="text-paper/80">
            You earned <span className="font-bold text-diamond">{finalEarned} minutes</span> of video
            time.
          </p>
          <PixelButton onClick={playAgain} className="w-full">
            🎲 Keep playing!
          </PixelButton>
          <button
            onClick={onDone}
            className="w-full rounded-xl border-2 border-black/40 bg-black/25 px-4 py-2 font-pixel text-[10px] text-paper/80"
          >
            ⌂ Back to home
          </button>
        </div>
      )}
    </div>
  );
}
