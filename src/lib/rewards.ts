// Reward economy: turn answers into banked video minutes.
//
// The rule is deliberately simple and predictable for a child:
//   correct answer            -> +1 minute
//   partial / 2nd-try-correct -> +30 seconds   (a hint was used)
//   wrong on an EASY question -> -30 seconds    (it should have been gettable)
//   wrong on a harder one     ->  0
// The running total can't go below zero, and the whole day is capped at
// MAX_REWARD_MINUTES. Art is marked "correct" on completion, so a finished
// drawing simply earns its minute like any other correct answer.

import {
  EASY_MISS_MAX_DIFFICULTY,
  EASY_MISS_PENALTY_SECONDS,
  MAX_REWARD_MINUTES,
  SECONDS_PER_CORRECT,
  SECONDS_PER_PARTIAL,
} from "./config";
import type { Attempt } from "./types";

export interface RewardConfig {
  perCorrectMin?: number; // minutes earned per correct answer
  capMin?: number; // daily cap in minutes
}

export function earnedSecondsFromAttempts(
  attemptsToday: Attempt[],
  cfg: RewardConfig = {},
): number {
  const perCorrect = (cfg.perCorrectMin ?? SECONDS_PER_CORRECT / 60) * 60;
  const capMin = cfg.capMin ?? MAX_REWARD_MINUTES;
  let total = 0;
  for (const a of attemptsToday) {
    if (a.verdict === "correct") {
      total += perCorrect;
    } else if (a.verdict === "partial") {
      total += Math.min(SECONDS_PER_PARTIAL, perCorrect / 2 || SECONDS_PER_PARTIAL);
    } else {
      // incorrect or timeout
      if ((a.difficulty || 0) <= EASY_MISS_MAX_DIFFICULTY) {
        total -= EASY_MISS_PENALTY_SECONDS;
      }
    }
  }
  const capped = Math.min(total, capMin * 60);
  return Math.max(0, capped);
}

export function earnedMinutesFromAttempts(attemptsToday: Attempt[], cfg: RewardConfig = {}): number {
  return Math.round((earnedSecondsFromAttempts(attemptsToday, cfg) / 60) * 10) / 10;
}

/** Video time the child can actually watch RIGHT NOW: what they've earned today
 *  (already capped at the daily max) minus what they've already watched today,
 *  plus any bonus minutes a parent has granted for the day. Carry-over within a
 *  day is preserved while the earned total can never exceed the cap (bonus sits
 *  on top of the cap, since it's a deliberate parent override). */
export function availableSecondsToday(
  earnedSeconds: number,
  watchedSeconds: number,
  opts: { capMin?: number; bonusSeconds?: number } = {},
): number {
  const cap = (opts.capMin ?? MAX_REWARD_MINUTES) * 60;
  const earnable = Math.min(Math.max(0, earnedSeconds), cap);
  const bonus = Math.max(0, opts.bonusSeconds ?? 0);
  return Math.max(0, earnable + bonus - Math.max(0, watchedSeconds));
}

/** 0-3 stars for a subject based on accuracy, for the kid-facing summary. */
export function starsForSubject(rows: Attempt[]): number {
  if (!rows.length) return 0;
  const correct = rows.filter((r) => r.verdict === "correct").length;
  const ratio = correct / rows.length;
  if (ratio >= 0.99) return 3;
  if (ratio >= 0.6) return 2;
  if (ratio > 0) return 1;
  return 0;
}

/** Video time the child can watch RIGHT NOW, kept as a running balance ACROSS
 *  days so earnings are never lost at midnight. For every day we add what was
 *  earned that day (each day still capped at the daily max) plus any parent
 *  bonus, and subtract what was watched. Today's earnings come in live from
 *  today's attempts; past days come from their saved totals. The balance can
 *  never go below zero. */
export function lifetimeAvailableSeconds(
  sessions: { day: string; earned_minutes?: number; minutes_used?: number; bonus_minutes?: number }[],
  todayDay: string,
  todayEarnedSeconds: number,
  opts: { capMin?: number } = {},
): number {
  const cap = (opts.capMin ?? MAX_REWARD_MINUTES) * 60;
  let earnable = 0;
  let watched = 0;
  let sawToday = false;
  for (const s of sessions) {
    const isToday = s.day === todayDay;
    if (isToday) sawToday = true;
    const earnedSec = isToday ? Math.max(0, todayEarnedSeconds) : Math.max(0, (s.earned_minutes || 0) * 60);
    earnable += Math.min(earnedSec, cap) + Math.max(0, s.bonus_minutes || 0) * 60;
    watched += Math.max(0, s.minutes_used || 0) * 60;
  }
  if (!sawToday) earnable += Math.min(Math.max(0, todayEarnedSeconds), cap);
  return Math.max(0, earnable - watched);
}
