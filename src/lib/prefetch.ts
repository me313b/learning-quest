"use client";

import type { ReadingStory } from "@/lib/ai";
import { prefetchSpeech } from "@/lib/speech";

// After the child logs in we quietly warm up the slow things in the background
// (audio synthesis and a reading story) so that when they open those sections
// they appear instantly instead of spinning. Everything here is best-effort and
// fire-and-forget; if it fails the section just loads normally on demand.

let readingCache: ReadingStory | null = null;
let readingInFlight = false;
let started = false;

const COMMON_FR = [
  // greetings & basics
  "bonjour",
  "merci",
  "au revoir",
  "oui",
  "non",
  // animals / colours / numbers used in the quiz and labs
  "chat",
  "chien",
  "oiseau",
  "poisson",
  "rouge",
  "bleu",
  "vert",
  "jaune",
  "un",
  "deux",
  "trois",
  // the speaking-practice sentences
  "j'ai un chat",
  "j'ai un chien",
  "le chat est noir",
  "j'aime le fromage",
  "je suis content",
  "la pomme est rouge",
  // spoken feedback
  "Très bien !",
  "Essaie encore.",
];

/** Take the pre-generated reading story (used once), if one is ready. */
export function takeReadingStory(): ReadingStory | null {
  const s = readingCache;
  readingCache = null;
  return s;
}

async function prefetchReading(): Promise<void> {
  if (readingCache || readingInFlight) return;
  readingInFlight = true;
  try {
    const res = await fetch("/api/reading", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.story) readingCache = data.story as ReadingStory;
  } catch {
    /* ignore */
  } finally {
    readingInFlight = false;
  }
}

/** Kick off background warming. Safe to call repeatedly — it only runs once. */
export function prefetchSections(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  // Stagger the audio warm-ups so we don't fire 15 requests at once.
  COMMON_FR.forEach((w, i) => {
    setTimeout(() => prefetchSpeech(w, "fr-FR"), 250 * i);
  });
  // Pre-build a French reading story for an instant first open.
  setTimeout(prefetchReading, 600);
}
