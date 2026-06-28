"use client";

import { useEffect, useRef, useState } from "react";
import {
  coveredSkillsThisWeek,
  getKidSettings,
  getOrCreateTodaySession,
  grantBonusMinutes,
  persistAbility,
  recentPrompts,
  recentTopics,
  recordAttempt,
  todayAttempts,
  unresolvedSkills,
  updateSession,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useHandsFree } from "@/lib/french/useHandsFree";
import { checkObjective, nextDifficulty, startDifficulty, updateAbility } from "@/lib/adaptive";
import { earnedMinutesFromAttempts } from "@/lib/rewards";
import { fallbackQuestion, randomEncourage, randomFact, randomPraise } from "@/lib/content";
import {
  EASY_MISS_MAX_DIFFICULTY,
  QUESTIONS_PER_SUBJECT,
  secondsForDifficulty,
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
import { chime, primeVoices, speakSmart, stopAllSpeech } from "@/lib/speech";

// Each non-creative question runs as: answer (60s) -> if wrong, a specific hint
// and ONE more try -> if the retry is right, half the reward (recorded as
// "partial"); if it's wrong, reveal the answer. Only the FINAL outcome is
// recorded, so the reward maths (1 min correct / 30s second-try / -30s on an
// easy miss) all flows from that single attempt.

type Phase = "loading" | "question" | "hint" | "feedback" | "between" | "done";

// An "open writing" question is one where the child writes a whole sentence and
// there's no single right answer to match (it's graded by the AI). These get NO
// timer and a "take your time" message.
function isOpenWriting(q: Question): boolean {
  if (q.type === "open" || q.type === "creative") return true;
  if (q.type === "short_text") {
    const hasFixed = (q.answer && q.answer.trim().length > 0) || (q.acceptable && q.acceptable.length > 0);
    return !hasFixed;
  }
  return false;
}

const FUNNY_CHEERS = [
  "Boom! Nailed it!",
  "Wowee, you're on fire!",
  "Ka-pow! That's correct!",
  "Yes yes yes! Super brain!",
  "High five! That's spot on!",
  "Woohoo! You cracked it!",
  "Ding ding ding! Correct!",
  "Brilliant! Your brain just levelled up!",
  "Amazing! That was a tricky one!",
  "Yesss! You're a superstar!",
];
const PLAIN_CHEERS = ["Well done!", "Brilliant!", "Correct!", "You got it!", "Nice one!", "Great work!"];
const FUNNY_OOPS = [
  "Oopsie daisy! Not quite — let's have another look together.",
  "Whoops! That one was sneaky. Let's figure it out!",
  "Close! Even great explorers take a wrong turn. Let's see!",
  "Almost! Let's solve this one as a team.",
];
const PLAIN_OOPS = ["Good try! Let's look at this one together."];

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
  // Five-word vocabulary: how many of the items were correct.
  multiScore?: { got: number; total: number };
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
  const [kid, setKid] = useState({ questionSeconds: 60, allowOvertime: true, funMode: true });
  const kidRef = useRef(kid);
  kidRef.current = kid;
  const { listen: listenAnswer, status: recStatus, level: recLevel } = useHandsFree();
  const [recording, setRecording] = useState(false);
  const [recordHint, setRecordHint] = useState("");
  const [geniusAward, setGeniusAward] = useState(false);
  const geniusAwardedRef = useRef(false);

  // Refs mirror the state that async callbacks (timer, grading) need to read.
  const phaseRef = useRef<Phase>("loading");
  const questionRef = useRef<Question | null>(null);
  const subjIdxRef = useRef(0);
  const countRef = useRef(0);
  const difficultyRef = useRef(3);
  const seedsRef = useRef<string[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const askedPromptsRef = useRef<string[]>([]);
  const abilityRef = useRef<Record<string, number>>({ ...(profile.ability || {}) });
  const answerRef = useRef("");
  const choiceRef = useRef("");
  const fileRef = useRef<File | null>(null);
  const submittingRef = useRef(false);
  const startedAtRef = useRef(0);
  const attemptRef = useRef(1);
  const mountedRef = useRef(true);

  // Stop any talking (questions, facts, reactions) if the child leaves the quiz.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAllSpeech();
    };
  }, []);

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
    getKidSettings()
      .then((k) =>
        setKid({ questionSeconds: k.questionSeconds, allowOvertime: k.allowOvertime, funMode: k.funMode }),
      )
      .catch(() => {});
    // A fun fact to kick things off (read aloud before the first question loads).
    const startFact = randomFact();
    setFact(startFact);
    setTimeout(() => {
      if (mountedRef.current) speakSmart(`Did you know? ${startFact}`, "en-GB");
    }, 300);
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

  // Read the question aloud automatically: French questions are always read in
  // French, and longer English questions (more than 10 words) are read too, so
  // the child never has to press the speaker. Open writing questions also get a
  // "no rush" message and a friendly fact every minute while they think.
  useEffect(() => {
    if (phase !== "question" || !question) return;
    const isFrench = language === "fr" || currentSubject === "french";
    const text = question.displayText || question.prompt;
    const open = isOpenWriting(question);
    let alive = true;

    (async () => {
      const frAudio = (question.audioText || "").trim();
      if (frAudio) {
        // Always speak the exact French (or listening) phrase, in French.
        await speakSmart(frAudio, question.audioLanguage || "fr-FR");
      } else if (isFrench) {
        // No proper French audio supplied: stay silent rather than read an
        // English instruction in a French accent, which would teach the wrong
        // sound.
      } else {
        // Read the question aloud so a young child can follow it, however short.
        await speakSmart(text, "en-GB");
      }
      if (alive && open && question.type !== "creative") {
        await speakSmart(
          "Don't worry about the time here. Take as long as you like to write your whole sentence.",
          "en-GB",
        );
      }
    })();

    // While the child works on an untimed writing question, share a fact each
    // minute so it feels like a teacher is with them.
    let factTimer: ReturnType<typeof setInterval> | null = null;
    if (open) {
      factTimer = setInterval(() => {
        if (!alive) return;
        speakSmart(`Here's a fun one. ${randomFact()}`, "en-GB");
      }, 60000);
    }

    return () => {
      alive = false;
      if (factTimer) clearInterval(factTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setRecordHint("");
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
    // Build the "do not repeat" list from this session plus recent history.
    let avoid: string[] = [...askedPromptsRef.current];
    try {
      const past = await recentPrompts(profile.id, s, 16);
      avoid = Array.from(new Set([...avoid, ...past]));
    } catch {
      /* session list still helps */
    }

    // The French subject is always taught in French, whatever the global setting.
    const lang: "en" | "fr" = s === "french" ? "fr" : language;

    // French rotates ONE task type per question across the set: vocabulary (five
    // words at once), an interview question, make-a-sentence, and translate.
    const FRENCH_TASKS = ["vocab", "interview", "sentence", "translate"];
    const frenchTask = s === "french" ? FRENCH_TASKS[idx] || "translate" : "";

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
          language: lang,
          reasoning: isLast && s !== "french",
          avoid: avoid.slice(0, 24),
          frenchTask,
        }),
      });
      const data = await res.json();
      q = (data.question as Question) || null;
    } catch {
      q = null;
    }
    if (!q) q = fallbackQuestion(s, diff, toChildProfile(profile), frenchTask);
    if (q.prompt) askedPromptsRef.current = [q.prompt, ...askedPromptsRef.current].slice(0, 30);

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

    // Five-word vocabulary: mark by how many of the meanings are right.
    if (q.expectMulti) {
      const normItem = (x: string) =>
        x
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9' ]/g, "")
          .trim();
      const match1 = (a: string, b: string) => {
        const x = normItem(a);
        const y = normItem(b);
        if (!x || !y) return false;
        return x === y || x.includes(y) || y.includes(x);
      };
      const expected = correctAnswer
        .split(/[,;/]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      let given = userAnswerText
        .split(/[,;/]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      // If they didn't use commas, fall back to splitting on spaces.
      if (given.length < expected.length && !/[,;/]/.test(userAnswerText)) {
        given = userAnswerText.split(/\s+/).map((x) => x.trim()).filter(Boolean);
      }
      const used = new Array(given.length).fill(false);
      let got = 0;
      for (const want of expected) {
        for (let i = 0; i < given.length; i++) {
          if (used[i]) continue;
          if (match1(given[i], want)) {
            used[i] = true;
            got++;
            break;
          }
        }
      }
      const total = expected.length || 5;
      const verdict: Verdict =
        got >= total ? "correct" : got >= Math.ceil(total * 0.4) ? "partial" : "incorrect";
      return {
        verdict,
        correctAnswer,
        solution: `The meanings were: ${correctAnswer}.`,
        correction: correctAnswer,
        tip: "",
        userAnswerText,
        elapsed,
        multiScore: { got, total },
      };
    }

    const local = checkObjective(q, userAnswerText);
    const frenchOpen = s === "french" && q.type === "short_text";
    // Accept a clear local match instantly. For French sentences, if the exact
    // check says "incorrect", let the AI decide — the child may have used a
    // perfectly valid alternative phrasing that an exact match would miss.
    if (local === "correct" || (local === "incorrect" && !frenchOpen)) {
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

    // Reaching the very top tier and getting it right earns a special, one-time
    // genius award (a bonus of video time) and a big celebration — then the quest
    // keeps serving the hardest questions.
    const answeredDiff = q.difficulty || difficultyRef.current;
    const won = finalVerdict === "correct" || (finalVerdict === "partial" && opts.secondTry);
    const earnedGenius = won && answeredDiff >= 13 && !geniusAwardedRef.current;
    if (earnedGenius) {
      geniusAwardedRef.current = true;
      grantBonusMinutes(profile.id, 3).catch(() => {});
    }
    setGeniusAward(earnedGenius);

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
      const cheers = kidRef.current.funMode ? FUNNY_CHEERS : PLAIN_CHEERS;
      speakSmart(cheers[Math.floor(Math.random() * cheers.length)], "en-GB");
    } else if (finalVerdict === "partial" && opts.secondTry) {
      chime("hint");
      speakSmart(kidRef.current.funMode ? "Yes! You got there in the end. Great sticking power!" : "Well done for getting there!", "en-GB");
    } else if (opts.reveal) {
      const oops = kidRef.current.funMode ? FUNNY_OOPS : PLAIN_OOPS;
      speakSmart(oops[Math.floor(Math.random() * oops.length)], "en-GB");
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

    // Five-word vocabulary is marked by how many are right — show the score
    // straight away (a single retry on five items doesn't make sense).
    if (q.expectMulti && g.multiScore) {
      const { got, total } = g.multiScore;
      const fb =
        got >= total
          ? `Perfect — all ${total} right! 🎉`
          : got === 0
            ? "Let's look at these together."
            : `You got ${got} out of ${total}! 👏`;
      await commit(q, s, g.verdict, g, { secondTry: false, feedback: fb, reveal: true });
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
    setTimeout(() => {
      if (mountedRef.current) speakSmart(`Great quest! Here's a fun fact before you go. ${randomFact()}`, "en-GB");
    }, 600);
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

  // Let the child SAY a longer answer instead of typing — only for science and
  // for questions that ask them to explain (where talking is easier than writing).
  async function recordAnswer() {
    if (recording || !question) return;
    stopAllSpeech(); // don't let the mic pick up the French audio that may be playing
    setRecordHint("");
    setRecording(true);
    const lang = currentSubject === "french" || language === "fr" ? "fr" : "en";
    const res = await listenAnswer(20000, { language: lang, silenceMs: 4000 });
    setRecording(false);
    const said = (res?.text || "").trim();
    if (said) {
      const next = answer ? `${answer} ${said}` : said;
      setAnswer(next);
      answerRef.current = next;
      setRecordHint("");
    } else if (res == null) {
      setRecordHint("I couldn't use the microphone. You can type your answer instead.");
    } else if (res.noService) {
      setRecordHint("Speaking practice needs the voice feature switched on in Parent settings. For now, please type your answer.");
    } else if (!res.heardSpeech) {
      setRecordHint("I didn't hear anything — tap again and speak a little louder, or type it.");
    } else {
      setRecordHint("I couldn't quite catch that — try again, or type your answer.");
    }
  }

  const canRecordAnswer =
    question != null &&
    (question.type === "short_text" || question.type === "open") &&
    (currentSubject === "science" ||
      currentSubject === "physics" ||
      currentSubject === "french" ||
      language === "fr" ||
      /\b(why|how|explain|describe|because)\b/i.test(question.prompt || ""));

  const isFrenchQ = language === "fr" || currentSubject === "french";
  const qDiff = question?.difficulty || difficulty;
  // Turn a hard question into an exciting "boss" moment rather than a scary one.
  const boss =
    qDiff >= 11
      ? { label: "BOSS LEVEL", emoji: "⚔️", cls: "border-redstone/60 bg-redstone/20 text-redstone", pulse: true }
      : qDiff >= 9
        ? { label: "EPIC CHALLENGE", emoji: "🔥", cls: "border-gold/60 bg-gold/20 text-gold", pulse: true }
        : qDiff >= 7
          ? { label: "TOUGH ONE", emoji: "💥", cls: "border-diamond/60 bg-diamond/15 text-diamond", pulse: false }
          : null;

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
          <div className="flex flex-wrap items-center gap-2">
            {boss && (
              <span
                className={`inline-flex items-center gap-1 rounded-md border-2 px-2.5 py-1 font-pixel text-[10px] ${boss.cls} ${
                  boss.pulse ? "animate-pulse" : ""
                }`}
              >
                {boss.emoji} {boss.label}
              </span>
            )}
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
          {boss && attempt === 1 && (
            <p className="text-sm font-semibold text-paper/75">
              {boss.label === "BOSS LEVEL"
                ? "⚔️ A boss-level question! Take your time and give it everything."
                : "You've reached a really hard one. Have a proper think — you can do this!"}
            </p>
          )}
          <div className="flex items-start justify-between gap-3">
            <p className="text-2xl font-semibold leading-snug text-paper sm:text-3xl">
              {question.displayText || question.prompt}
            </p>
            <button
              onClick={() => {
                const at = question.audioText?.trim();
                if (at) speakSmart(at, question.audioLanguage || "fr-FR");
                else if (language !== "fr" && currentSubject !== "french")
                  speakSmart(question.displayText || question.prompt, "en-GB");
                // French with no French audio: stay silent rather than mispronounce.
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

          {isFrenchQ && !question.listening && (question.audioText || "").trim() && (
            <button
              onClick={() =>
                speakSmart((question.audioText || "").trim(), question.audioLanguage || "fr-FR")
              }
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-emerald/50 bg-emerald/10 px-4 py-3 active:translate-y-0.5"
            >
              <span className="text-2xl">🔊</span>
              <span className="text-xl font-semibold text-paper sm:text-2xl">
                {(question.audioText || "").trim()}
              </span>
            </button>
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
            <div className="space-y-2">
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
              {canRecordAnswer && (
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={recordAnswer}
                    disabled={recording}
                    className="rounded-xl border-2 border-diamond/50 bg-diamond/10 px-4 py-2 text-sm text-diamond disabled:opacity-70"
                  >
                    {recording
                      ? isFrenchQ
                        ? "🎙️ Listening… say it in French"
                        : "🎙️ Listening… say your answer"
                      : isFrenchQ
                        ? "🎤 Or say it in French"
                        : "🎤 Or say your answer"}
                  </button>
                  {recording && (
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-paper/15">
                      <div className="h-full rounded-full bg-diamond" style={{ width: `${Math.round(recLevel * 100)}%` }} />
                    </div>
                  )}
                  {recStatus === "thinking" && <p className="text-[11px] text-paper/50">Writing down what you said…</p>}
                  {recordHint && <p className="text-center text-[11px] text-gold/90">{recordHint}</p>}
                </div>
              )}
            </div>
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

          {!isOpenWriting(question) && kid.questionSeconds > 0 && (
            <CountdownTimer
              key={`${subjIdx}-${count}-${attempt}`}
              seconds={
                attempt === 2
                  ? Math.max(10, Math.ceil(secondsForDifficulty(question.difficulty || difficulty) / 2))
                  : secondsForDifficulty(question.difficulty || difficulty)
              }
              overtimeSeconds={
                kid.allowOvertime
                  ? Math.ceil(
                      (attempt === 2
                        ? secondsForDifficulty(question.difficulty || difficulty) / 2
                        : secondsForDifficulty(question.difficulty || difficulty)) * 0.5,
                    )
                  : 0
              }
              onExpire={() => submit()}
            />
          )}
          {isOpenWriting(question) && question.type !== "creative" && (
            <p className="text-center text-xs text-emerald">
              ✍️ No timer here — take as long as you like to write your sentence.
            </p>
          )}

          <PixelButton onClick={() => submit()} disabled={!canCheck} className="w-full py-4 text-sm">
            {grading ? "Checking…" : attempt === 2 ? "Try again" : "Check answer"}
          </PixelButton>
        </div>
      )}

      {phase === "hint" && question && (
        <div className="mc-card-dark space-y-4">
          <p className="font-pixel text-xs text-gold">Tricky one — here&apos;s a clue 💡</p>
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
              {(() => {
                const won =
                  result.verdict === "correct" || (result.verdict === "partial" && result.secondTry);
                const d = question?.difficulty || 0;
                if (won && d >= 11) return "⚔️ BOSS DEFEATED!";
                if (won && d >= 9) return "🔥 EPIC WIN!";
                if (won && d >= 7) return "💥 Smashed it!";
                return result.verdict === "correct"
                  ? "Correct!"
                  : result.verdict === "partial"
                    ? "Got it!"
                    : result.verdict === "timeout"
                      ? "Out of time"
                      : "Not quite";
              })()}
            </p>
          </div>

          {geniusAward && (
            <div className="rounded-2xl border-4 border-gold/60 bg-gold/15 p-3 text-center">
              <p className="font-pixel text-sm text-gold">🏆 GENIUS AWARD!</p>
              <p className="mt-1 text-sm text-paper/85">
                You reached the top level — here are 3 bonus minutes of video time! 🎉
              </p>
            </div>
          )}

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
          <p className="font-pixel text-xs text-grasstop">{meta?.label} quest cleared! 🎉</p>
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
