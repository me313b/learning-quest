// Analytics for the parent dashboard. Pure functions over the attempts list.
// They return plain arrays/objects the dashboard renders with Recharts, plus a
// compact text summary handed to the AI for the written progress note.

import { SUBJECTS } from "./config";
import type { Attempt } from "./types";

function dayOf(ts: string): string {
  // created_at is an ISO timestamp; take the date portion (UTC-ish is fine for
  // streaks and grouping at this granularity).
  return (ts || "").slice(0, 10);
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export interface OverallStats {
  total: number;
  accuracy: number;
  avgTime: number;
  streak: number;
  activeDays: number;
}

export function overallStats(attempts: Attempt[]): OverallStats {
  if (!attempts.length) {
    return { total: 0, accuracy: 0, avgTime: 0, streak: 0, activeDays: 0 };
  }
  const total = attempts.length;
  const correct = attempts.filter((a) => a.verdict === "correct").length;
  const times = attempts.map((a) => a.time_taken).filter((t) => t > 0);
  const days = new Set(attempts.map((a) => dayOf(a.created_at)).filter(Boolean));
  return {
    total,
    accuracy: Math.round((1000 * correct) / total) / 10,
    avgTime: times.length
      ? Math.round((10 * times.reduce((s, t) => s + t, 0)) / times.length) / 10
      : 0,
    streak: currentStreak(days),
    activeDays: days.size,
  };
}

export function currentStreak(daySet: Set<string>): number {
  const days = [...daySet].filter(Boolean).sort();
  if (!days.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  if (!daySet.has(cursor)) {
    cursor = addDays(today, -1);
    if (!daySet.has(cursor)) return 0;
  }
  let streak = 0;
  while (daySet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface SubjectRow {
  subject: string;
  label: string;
  attempts: number;
  accuracy: number;
  avgTime: number;
  avgDifficulty: number;
  peakDifficulty: number;
}

export function subjectBreakdown(attempts: Attempt[]): SubjectRow[] {
  const by = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = by.get(a.subject) ?? [];
    list.push(a);
    by.set(a.subject, list);
  }
  const out: SubjectRow[] = [];
  for (const [subject, rows] of by) {
    const correct = rows.filter((r) => r.verdict === "correct").length;
    const times = rows.map((r) => r.time_taken).filter((t) => t > 0);
    const diffs = rows.map((r) => r.difficulty).filter((d) => d > 0);
    out.push({
      subject,
      label: SUBJECTS[subject]?.label ?? subject,
      attempts: rows.length,
      accuracy: rows.length ? Math.round((1000 * correct) / rows.length) / 10 : 0,
      avgTime: times.length
        ? Math.round((10 * times.reduce((s, t) => s + t, 0)) / times.length) / 10
        : 0,
      avgDifficulty: diffs.length
        ? Math.round((10 * diffs.reduce((s, d) => s + d, 0)) / diffs.length) / 10
        : 0,
      peakDifficulty: diffs.length ? Math.max(...diffs) : 0,
    });
  }
  return out.sort((a, b) => b.attempts - a.attempts);
}

export interface SkillScore {
  skill: string;
  accuracy: number;
  n: number;
}

export function skillStrengths(
  attempts: Attempt[],
  minAttempts = 2,
): { strengths: SkillScore[]; weaknesses: SkillScore[] } {
  const by = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!a.skill) continue;
    const list = by.get(a.skill) ?? [];
    list.push(a);
    by.set(a.skill, list);
  }
  const scored: SkillScore[] = [];
  for (const [skill, rows] of by) {
    if (rows.length < minAttempts) continue;
    const correct = rows.filter((r) => r.verdict === "correct").length;
    scored.push({ skill, accuracy: Math.round((100 * correct) / rows.length), n: rows.length });
  }
  const strengths = scored
    .filter((s) => s.accuracy >= 75)
    .sort((a, b) => b.accuracy - a.accuracy || b.n - a.n)
    .slice(0, 5);
  const weaknesses = scored
    .filter((s) => s.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || b.n - a.n)
    .slice(0, 5);
  return { strengths, weaknesses };
}

export interface SkillCell {
  skill: string;
  subject: string;
  label: string; // subject label
  accuracy: number; // 0-100
  n: number;
}

/** Every skill the child has practised, grouped with its subject, for a heatmap. */
export function skillBreakdown(attempts: Attempt[], minAttempts = 1): SkillCell[] {
  const by = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!a.skill) continue;
    const key = `${a.subject}||${a.skill}`;
    const list = by.get(key) ?? [];
    list.push(a);
    by.set(key, list);
  }
  const out: SkillCell[] = [];
  for (const [key, rows] of by) {
    if (rows.length < minAttempts) continue;
    const [subject, skill] = key.split("||");
    const correct = rows.filter((r) => r.verdict === "correct").length;
    out.push({
      skill,
      subject,
      label: SUBJECTS[subject]?.label ?? subject,
      accuracy: Math.round((100 * correct) / rows.length),
      n: rows.length,
    });
  }
  return out.sort((a, b) => a.subject.localeCompare(b.subject) || a.accuracy - b.accuracy);
}

export interface FocusSuggestion {
  skill: string;
  subject: string;
  label: string;
  accuracy: number;
  n: number;
  tip: string;
}

const FOCUS_TIPS: Record<string, string> = {
  maths: "Work through a couple together on paper first, then let them try one on their own.",
  english: "Read the question aloud together and underline the key word before answering.",
  french: "Practise saying the words out loud — the French reading and speaking labs help a lot here.",
  science: "Open the Labs to see this idea in action, then come back to the questions.",
  art: "Look at a few examples together and talk about what they notice before drawing.",
};

/** The single most useful thing to practise next: the weakest skill with enough
 *  attempts to be meaningful, plus a concrete, parent-friendly suggestion. */
export function focusNext(attempts: Attempt[], minAttempts = 3): FocusSuggestion | null {
  const cells = skillBreakdown(attempts, minAttempts).filter((c) => c.accuracy < 70);
  if (!cells.length) return null;
  const worst = [...cells].sort((a, b) => a.accuracy - b.accuracy || b.n - a.n)[0];
  const tip = FOCUS_TIPS[worst.subject] || "Spend a little extra time on this together.";
  return { ...worst, tip };
}

/** Rows like { day, Maths: 5.2, French: 3.0 } for a multi-line chart. */
export function difficultyTrend(attempts: Attempt[]): {  data: Record<string, number | string>[];
  subjects: string[];
} {
  const byDay = new Map<string, Map<string, number[]>>();
  const subjectsSeen = new Set<string>();
  for (const a of attempts) {
    if (!a.difficulty) continue;
    const day = dayOf(a.created_at);
    if (!day) continue;
    const label = SUBJECTS[a.subject]?.label ?? a.subject;
    subjectsSeen.add(label);
    if (!byDay.has(day)) byDay.set(day, new Map());
    const m = byDay.get(day)!;
    const arr = m.get(label) ?? [];
    arr.push(a.difficulty);
    m.set(label, arr);
  }
  const data = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, m]) => {
      const row: Record<string, number | string> = { day };
      for (const [label, arr] of m) {
        row[label] = Math.round((10 * arr.reduce((s, d) => s + d, 0)) / arr.length) / 10;
      }
      return row;
    });
  return { data, subjects: [...subjectsSeen] };
}

export function dailyAccuracy(attempts: Attempt[]): { day: string; accuracy: number }[] {
  const byDay = new Map<string, { c: number; n: number }>();
  for (const a of attempts) {
    const day = dayOf(a.created_at);
    if (!day) continue;
    const rec = byDay.get(day) ?? { c: 0, n: 0 };
    rec.n += 1;
    if (a.verdict === "correct") rec.c += 1;
    byDay.set(day, rec);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, r]) => ({ day, accuracy: Math.round((1000 * r.c) / r.n) / 10 }));
}

export function statsTextForAi(attempts: Attempt[]): string {
  const o = overallStats(attempts);
  const lines = [
    `Total questions attempted: ${o.total}`,
    `Overall accuracy: ${o.accuracy}%`,
    `Average time per question: ${o.avgTime}s`,
    `Active days: ${o.activeDays}, current streak: ${o.streak} days`,
    "",
    "By subject (accuracy / avg difficulty reached / avg time):",
  ];
  for (const s of subjectBreakdown(attempts)) {
    lines.push(
      `- ${s.label}: ${s.accuracy}% over ${s.attempts} qs, avg level ${s.avgDifficulty}/10 (peak ${s.peakDifficulty}), ${s.avgTime}s each`,
    );
  }
  const { strengths, weaknesses } = skillStrengths(attempts);
  if (strengths.length)
    lines.push("\nStrong skills: " + strengths.map((s) => `${s.skill} (${s.accuracy}%)`).join(", "));
  if (weaknesses.length)
    lines.push("Skills to work on: " + weaknesses.map((w) => `${w.skill} (${w.accuracy}%)`).join(", "));
  return lines.join("\n");
}
