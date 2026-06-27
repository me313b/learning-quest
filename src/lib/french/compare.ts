// Helpers for comparing what a child said (from speech-to-text) against a target
// French sentence, and for generating warm French praise and gentle teaching.

export function normFr(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[.,!?;:"'’«»()\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  const n = normFr(s);
  return n ? n.split(" ") : [];
}

export interface DiffResult {
  score: number; // 0..1 fraction of target words that were said
  correct: string[]; // target words (original) that were matched
  missed: string[]; // target words (original) that were not heard
  perfect: boolean;
}

// Compare a spoken attempt with the target. Word-level, accent- and
// punctuation-insensitive, which is the right level for a 6-7 year old.
export function diffFrench(target: string, said: string): DiffResult {
  const targetOrig = (target || "").trim().split(/\s+/).filter(Boolean);
  const saidSet = new Map<string, number>();
  for (const t of tokens(said)) saidSet.set(t, (saidSet.get(t) || 0) + 1);

  const correct: string[] = [];
  const missed: string[] = [];
  for (const w of targetOrig) {
    const key = normFr(w);
    if (!key) continue;
    const have = saidSet.get(key) || 0;
    if (have > 0) {
      saidSet.set(key, have - 1);
      correct.push(w);
    } else {
      missed.push(w);
    }
  }
  const total = correct.length + missed.length;
  const score = total ? correct.length / total : 0;
  return { score, correct, missed, perfect: missed.length === 0 && total > 0 };
}

const PRAISE: { fr: string; en: string }[] = [
  { fr: "Bravo !", en: "Well done!" },
  { fr: "Super !", en: "Great!" },
  { fr: "Excellent !", en: "Excellent!" },
  { fr: "Magnifique !", en: "Wonderful!" },
  { fr: "Très bien !", en: "Very good!" },
  { fr: "Génial !", en: "Awesome!" },
  { fr: "Bien joué !", en: "Nicely done!" },
  { fr: "Parfait !", en: "Perfect!" },
  { fr: "Formidable !", en: "Fantastic!" },
  { fr: "Tu es un champion !", en: "You're a champion!" },
];

export function praiseFr(): { fr: string; en: string } {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

const ENCOURAGE: { fr: string; en: string }[] = [
  { fr: "Presque ! On réessaie ensemble.", en: "Almost! Let's try again together." },
  { fr: "Bon essai ! Écoute bien.", en: "Good try! Listen carefully." },
  { fr: "Tu y es presque, continue !", en: "You're nearly there, keep going!" },
  { fr: "Pas grave ! Répète après moi.", en: "No worries! Repeat after me." },
];

export function encourageFr(): { fr: string; en: string } {
  return ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
}
