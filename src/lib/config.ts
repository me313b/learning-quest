// Central configuration. Everything that defines *what the app is* lives here:
// the subjects, how difficulty maps to school expectations, the reward rules
// and the Minecraft palette. Adding a subject is a one-line change below.

import type { Grading, Strength } from "./types";

export const APP_NAME = "Learning Quest";
export const APP_TAGLINE = "Mine knowledge. Build a brilliant brain.";

export interface SubjectMeta {
  label: string;
  emoji: string;
  block: string;
  grading: Grading;
  core: boolean;
  blurb: string;
}

export const SUBJECTS: Record<string, SubjectMeta> = {
  maths: {
    label: "Maths",
    emoji: "⚒️",
    block: "diamond",
    grading: "objective",
    core: true,
    blurb: "Number crunching, times tables, word problems and clever tricks.",
  },
  reading: {
    label: "Reading & Writing",
    emoji: "📖",
    block: "book",
    grading: "subjective",
    core: true,
    blurb: "Understanding stories and building proper sentences.",
  },
  french: {
    label: "French",
    emoji: "🇫🇷",
    block: "emerald",
    grading: "subjective",
    core: true,
    blurb: "Words, meanings, pronunciation and little sentences.",
  },
  art: {
    label: "Art",
    emoji: "🎨",
    block: "wool",
    grading: "creative",
    core: true,
    blurb: "Draw something, snap a photo, and get cheered on.",
  },
  science: {
    label: "Science",
    emoji: "🔬",
    block: "redstone",
    grading: "objective",
    core: false,
    blurb: "How the world works, from animals to space.",
  },
  geometry: {
    label: "Geometry",
    emoji: "📐",
    block: "lapis",
    grading: "objective",
    core: false,
    blurb: "Shapes, angles, symmetry and space.",
  },
  physics: {
    label: "Physics Lab",
    emoji: "⚛️",
    block: "iron",
    grading: "objective",
    core: false,
    blurb: "Speed, forces and Newton's laws you can play with.",
  },
};

export const CORE_SUBJECTS = Object.entries(SUBJECTS)
  .filter(([, v]) => v.core)
  .map(([k]) => k);

// Extra *quiz* subjects a parent can switch on (physics has its own Lab).
export const EXTRA_QUIZ_SUBJECTS = Object.entries(SUBJECTS)
  .filter(([k, v]) => !v.core && k !== "physics")
  .map(([k]) => k);

// Difficulty is an integer 1..10. These bands are passed verbatim to the AI so
// generated questions hit the right ceiling.
export const DIFFICULTY_BANDS: Record<number, string> = {
  1: "Reception / very start of Year 1. Gentle warm-up.",
  2: "Year 1 expected level.",
  3: "End of Year 1 / start of Year 2.",
  4: "Year 2 expected level.",
  5: "End of Year 2 / start of Year 3.",
  6: "Year 3 expected level. Multi-step thinking.",
  7: "End of Year 3 / start of Year 4. A genuine challenge for a gifted infant.",
  8: "Year 4 level. Requires reasoning, not recall.",
  9: "Year 5 level. Stretch problem with a twist.",
  10: "Year 6 level. Very hard; meant to make them think hard.",
  11: "Year 7 / early secondary. Genuine multi-step problems and reasoning.",
  12: "Junior maths-olympiad flavour. A clever twist or insight is needed.",
  13: "Genius / competition level. Should stretch even a gifted older child.",
};

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 13;
export const QUESTIONS_PER_SUBJECT = 4;
export const SECONDS_PER_QUESTION = 60;

// Parent-declared strength maps to a sensible *starting* difficulty floor. We
// deliberately start high (a real stretch) and let the adaptive engine ease the
// difficulty down only if the child gets one wrong, rather than starting easy.
export const STRENGTH_START: Record<Strength, number> = {
  needs_practice: 4,
  on_track: 6,
  strong: 7,
  very_strong: 8,
};
export const DEFAULT_START_DIFFICULTY = 6;

export const STRENGTH_LABELS: Record<Strength, string> = {
  needs_practice: "Needs practice",
  on_track: "On track",
  strong: "Strong",
  very_strong: "Very strong (ahead of year)",
};

// Reward economy. Simple and predictable: one minute of video per correct
// answer, half a minute for a partial (or a question answered right on the
// second try after a hint). A wrong answer on an easy question costs a little
// time. The daily total is capped at MAX_REWARD_MINUTES.
export const SECONDS_PER_CORRECT = 60; // a correct answer = 1 minute of video
export const SECONDS_PER_PARTIAL = 30; // partial / second-try-correct = 30s
export const EASY_MISS_MAX_DIFFICULTY = 2; // <= this counts as "should be easy"
export const EASY_MISS_PENALTY_SECONDS = 30; // wrong on an easy one costs 30s
export const MAX_REWARD_MINUTES = 30; // hard daily cap

export const PALETTE: Record<string, string> = {
  grass: "#5D9C3C",
  grassTop: "#7FB238",
  dirt: "#79553D",
  stone: "#828282",
  sky: "#7EC0EE",
  diamond: "#4AEDD9",
  emerald: "#17DD62",
  redstone: "#E03C28",
  gold: "#F8B617",
  lapis: "#2C4E9C",
  iron: "#D8D8D8",
  obsidian: "#1A1525",
  xp: "#80FF20",
  heart: "#FF3B3B",
  paper: "#F4ECD8",
  ink: "#2A2118",
};

export const AVATARS: Record<string, string> = {
  steve: "🧑",
  alex: "👩",
  creeper: "🟩",
  enderman: "🌑",
  zombie: "🧟",
};

export function difficultyColour(level: number): string {
  if (level <= 3) return PALETTE.emerald;
  if (level <= 6) return PALETTE.gold;
  if (level <= 10) return PALETTE.redstone;
  return PALETTE.stone;
}

const DIFF_NAMES: Record<number, string> = {
  1: "Warm-up",
  2: "Easy",
  3: "Steady",
  4: "Tricky",
  5: "Hard",
  6: "Brainy",
  7: "Tough",
  8: "Expert",
  9: "Genius",
  10: "Boss Level",
  11: "Genius+",
  12: "Mastermind",
  13: "Legendary",
};

export function difficultyLabel(level: number): string {
  return DIFF_NAMES[level] ?? "Quest";
}

/** How long to give for a question, scaled by difficulty: an easy question gets
 *  about 30 seconds, a super-hard one up to 3 minutes. */
export function secondsForDifficulty(difficulty: number): number {
  const d = Math.max(1, Math.min(MAX_DIFFICULTY, Math.round(difficulty || 1)));
  return Math.max(30, Math.min(180, 15 + d * 15));
}

// The specific areas each subject should rotate through, so a child sees a
// proper spread (e.g. maths isn't all addition). Used to steer both the AI and
// the offline fallback bank, and shown to parents as "areas to work on".
export const SKILL_AREAS: Record<string, string[]> = {
  maths: [
    "addition",
    "subtraction",
    "multiplication / times tables",
    "division and sharing",
    "place value (tens and units)",
    "fractions of an amount",
    "measurement (length, weight)",
    "telling the time",
    "money and change",
    "shape, area and perimeter",
    "number patterns and sequences",
    "number series and what comes next",
    "logic and reasoning puzzles",
    "trick questions that test real understanding",
    "word problems (multi-step)",
  ],
  reading: [
    "reading comprehension",
    "building a full sentence",
    "using describing words (adjectives)",
    "punctuation (capital letters and full stops)",
    "joining ideas with because / and / but",
    "spelling common tricky words",
    "what a word means (vocabulary)",
    "putting a short story in order",
  ],
  french: [
    "greetings and politeness",
    "numbers 1 to 20",
    "colours",
    "animals",
    "family words",
    "food and drink",
    "classroom and everyday objects",
    "simple sentences (I am, I have, I like)",
    "days, months and weather",
  ],
  art: [
    "drawing from imagination",
    "colour and shading",
    "pattern and symmetry",
    "drawing an animal",
    "drawing a landscape or scene",
    "designing something brand new",
  ],
  science: [
    "living things and habitats",
    "the human body and senses",
    "materials and their properties",
    "weather and the seasons",
    "space and the planets",
    "forces and movement",
    "plants and how they grow",
    "day and night",
  ],
  geometry: [
    "2D shapes and their sides",
    "3D shapes and their faces",
    "symmetry",
    "angles and turns",
    "position and direction",
    "measuring length",
    "patterns made from shapes",
  ],
  physics: [
    "forces and motion",
    "gravity and falling",
    "light and shadow",
    "sound",
    "floating and sinking",
    "simple machines (levers, wheels)",
  ],
};
