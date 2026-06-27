import type { Attempt, Verdict } from "@/lib/types";

// Build a minimal Attempt for tests. Only the fields the logic actually reads
// need real values; the rest get harmless defaults.
export function attempt(partial: Partial<Attempt> & { verdict: Verdict }): Attempt {
  return {
    id: Math.random().toString(36).slice(2),
    profile_id: "p1",
    session_id: "s1",
    subject: "maths",
    topic: "",
    skill: "",
    difficulty: 3,
    qtype: "numeric",
    prompt: "",
    correct_answer: "",
    user_answer: "",
    time_taken: 10,
    resolved: true,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

export function correct(n: number, difficulty = 3): Attempt[] {
  return Array.from({ length: n }, () => attempt({ verdict: "correct", difficulty }));
}
