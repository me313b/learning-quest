// The child-facing level system. XP is earned from answering: a correct answer
// is worth more, harder questions a little more again, and even a miss earns a
// point for effort (we never go backwards, so mistakes are safe). Levels carry
// friendly Minecraft-flavoured titles and there are a handful of badges to
// chase. Everything is derived from the attempt history, so nothing extra is
// stored.

import type { Attempt } from "./types";

const TITLES = [
  "Dirt Digger",
  "Wood Gatherer",
  "Stone Apprentice",
  "Iron Explorer",
  "Redstone Scientist",
  "Gold Adventurer",
  "Lapis Scholar",
  "Diamond Master",
  "Emerald Champion",
  "Netherite Legend",
  "Ender Sage",
];

export function xpFromAttempts(attempts: Attempt[]): number {
  let xp = 0;
  for (const a of attempts) {
    if (a.verdict === "correct") xp += 10 + Math.max(0, Math.min(10, a.difficulty || 0));
    else if (a.verdict === "partial") xp += 6;
    else xp += 1; // effort still counts
  }
  return xp;
}

/** Cumulative XP required to BEGIN a given level (level 1 begins at 0). The gap
 *  between levels grows slowly so progress always feels reachable. */
function xpForLevelStart(level: number): number {
  let total = 0;
  for (let l = 2; l <= level; l++) total += 60 + 30 * (l - 2);
  return total;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  intoLevel: number; // xp earned within the current level
  span: number; // xp needed to clear the current level
  progressPct: number; // 0..100
  answersToNext: number; // friendly "about N good answers to go"
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpForLevelStart(level + 1)) level++;
  const start = xpForLevelStart(level);
  const next = xpForLevelStart(level + 1);
  const span = Math.max(1, next - start);
  const intoLevel = Math.max(0, xp - start);
  const progressPct = Math.min(100, Math.round((intoLevel / span) * 100));
  const remaining = Math.max(0, next - xp);
  const answersToNext = Math.max(1, Math.ceil(remaining / 12));
  return {
    level,
    title: TITLES[Math.min(level, TITLES.length) - 1],
    xp,
    intoLevel,
    span,
    progressPct,
    answersToNext,
  };
}

export function levelFromAttempts(attempts: Attempt[]): LevelInfo {
  return levelFromXp(xpFromAttempts(attempts));
}

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  earned: boolean;
}

/** A small, encouraging badge set. All achievable, none shaming. */
export function badges(attempts: Attempt[], level: number): Badge[] {
  const correct = attempts.filter((a) => a.verdict === "correct").length;
  const secondTry = attempts.some((a) => a.verdict === "partial");
  const subjects = new Set(attempts.map((a) => a.subject)).size;

  // Longest run of consecutive correct answers (in recorded order).
  let run = 0;
  let bestRun = 0;
  for (const a of attempts) {
    if (a.verdict === "correct") {
      run += 1;
      bestRun = Math.max(bestRun, run);
    } else {
      run = 0;
    }
  }

  return [
    { id: "first", emoji: "🟫", label: "First Block", earned: correct >= 1 },
    { id: "roll", emoji: "🔥", label: "On a Roll (3 in a row)", earned: bestRun >= 3 },
    { id: "ten", emoji: "⛏️", label: "Getting the Hang (10)", earned: correct >= 10 },
    { id: "comeback", emoji: "💪", label: "Comeback Kid", earned: secondTry },
    { id: "explorer", emoji: "🗺️", label: "Explorer (4 subjects)", earned: subjects >= 4 },
    { id: "fifty", emoji: "💎", label: "Fifty Club (50)", earned: correct >= 50 },
    { id: "scientist", emoji: "🔬", label: "Redstone Scientist (Lvl 5)", earned: level >= 5 },
    { id: "century", emoji: "🏆", label: "Century (100)", earned: correct >= 100 },
  ];
}

/** A short, warm line nudging the child onward. */
export function encouragement(info: LevelInfo): string {
  if (info.progressPct >= 80) return `So close to Level ${info.level + 1} — just a little more!`;
  if (info.progressPct >= 40) return `Over halfway to Level ${info.level + 1}. Keep going!`;
  return `About ${info.answersToNext} good answers to reach Level ${info.level + 1}.`;
}
