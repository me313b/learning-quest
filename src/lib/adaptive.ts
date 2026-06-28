// The adaptive brain. Difficulty is a per-subject integer 1..10. A child starts
// each subject near their stored *ability* (a smoothed float), the first
// questions can be seeded from skills they previously got wrong, and difficulty
// then steps up on a correct answer and down on a wrong one. Ability drifts
// toward the difficulty they actually succeed at, so it self-calibrates.
//
// This module also marks objective answers locally (free, instant) so an AI
// call is only spent on genuinely open answers (sentences, French writing).

import {
  DEFAULT_START_DIFFICULTY,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  STRENGTH_START,
} from "./config";
import type { Question, Strength, Verdict } from "./types";

function clamp(v: number): number {
  return Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, Math.round(v)));
}

/** Where to begin a subject today. Lean mostly on the ability the child has
 *  actually demonstrated (built from their answer history), with a light pull
 *  toward the parent-declared strength so a brand-new subject still starts
 *  sensibly. A strong performer is no longer dragged back to the default. */
export function startDifficulty(
  subject: string,
  strengths: Record<string, Strength>,
  ability: Record<string, number>,
): number {
  const floor = STRENGTH_START[strengths?.[subject]] ?? DEFAULT_START_DIFFICULTY;
  const demonstrated = ability?.[subject];
  // No history: open with a real stretch (one above the floor).
  if (demonstrated == null) return clamp(floor + 1);
  // Treat the parent's declared level as a FIRM floor (a strong child always
  // starts high); demonstrated ability can only push it higher. Add a stretch so
  // it always opens hard, then the in-quest engine fine-tunes from there.
  return clamp(Math.max(demonstrated, floor) + 1);
}

export function nextDifficulty(current: number, verdict: Verdict): number {
  if (verdict === "correct") return clamp(current + 1);
  if (verdict === "partial") return clamp(current); // hold, try again
  return clamp(current - 1); // incorrect / timeout
}

/** Smoothly pull ability toward the difficulty attempted. Light touch (0.35) so
 *  one bad day doesn't tank it. Returns the new ability value to persist. */
export function updateAbility(
  currentAbility: number | undefined,
  difficulty: number,
  verdict: Verdict,
): number {
  const ability = currentAbility ?? difficulty;
  let target: number;
  if (verdict === "correct") target = difficulty + 0.6;
  else if (verdict === "partial") target = difficulty;
  else target = difficulty - 0.8;
  const next = ability + 0.35 * (target - ability);
  return Math.round(Math.max(1, Math.min(MAX_DIFFICULTY, next)) * 100) / 100;
}

// --------------------------------------------------------------------------- //
// Local objective answer checking
// --------------------------------------------------------------------------- //

function norm(text: unknown): string {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s.,;:!?'"]+/g, " ")
    .trim();
}

function firstNumber(text: unknown): number | null {
  if (text == null) return null;
  const m = String(text).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Dice-coefficient-ish similarity via longest common subsequence ratio.
function ratio(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const m = a.length;
  const n = b.length;
  const dp: number[] = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  const lcs = dp[n];
  return (2 * lcs) / (m + n);
}

function fuzzyMatch(
  userAnswer: string,
  candidates: string[],
  threshold = 0.86,
): boolean {
  const ua = norm(userAnswer);
  if (!ua) return false;
  for (const cand of candidates) {
    const cn = norm(cand);
    if (!cn) continue;
    if (ua === cn) return true;
    if (ratio(ua, cn) >= threshold) return true;
  }
  return false;
}

/** Return "correct" / "incorrect" for a checkable question, or null if the
 *  answer is open and must be graded by the AI. (Blank handling for the soft
 *  timeout lives in the quiz UI, which records "timeout" before calling this.) */
export function checkObjective(
  question: Question,
  userAnswer: string,
): "correct" | "incorrect" | null {
  const qtype = question.type;
  const answer = String(question.answer ?? "").trim();
  const acceptable = (question.acceptable ?? []).map((a) => String(a).trim());

  if (qtype === "numeric") {
    const target = firstNumber(answer);
    const given = firstNumber(userAnswer);
    if (given == null || target == null) {
      const set = new Set([norm(answer), ...acceptable.map(norm)]);
      return set.has(norm(userAnswer)) ? "correct" : "incorrect";
    }
    let tol = 0;
    const t = Number(question.tolerance);
    if (!Number.isNaN(t)) tol = t;
    return Math.abs(given - target) <= tol ? "correct" : "incorrect";
  }

  if (qtype === "multiple_choice") {
    const set = new Set([norm(answer), ...acceptable.map(norm)]);
    return set.has(norm(userAnswer)) ? "correct" : "incorrect";
  }

  if (qtype === "short_text") {
    if (!answer && acceptable.length === 0) return null; // open writing -> AI
    return fuzzyMatch(userAnswer, [answer, ...acceptable])
      ? "correct"
      : "incorrect";
  }

  // open / creative -> defer
  return null;
}
