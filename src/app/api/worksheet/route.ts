// POST: build a set of questions for a printable paper worksheet. Generates
// `perSubject` questions for each requested subject, at a small spread of
// difficulties starting from the child's level. Uses the family's AI key when
// present; otherwise falls back to the offline bank so paper mode always works.
// Art (creative) subjects are skipped here — drawing doesn't suit a Q/A sheet.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateQuestion } from "@/lib/ai";
import { fallbackQuestion } from "@/lib/content";
import { SUBJECTS } from "@/lib/config";
import type { ChildProfile, Question } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  subjects: string[];
  profile: ChildProfile;
  perSubject?: number;
  difficulties?: Record<string, number>;
}

function clamp(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)));
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const perSubject = Math.max(1, Math.min(8, Math.round(body.perSubject || 4)));
  const subjects = (body.subjects || []).filter(
    (s) => SUBJECTS[s] && SUBJECTS[s].grading !== "creative",
  );

  const items: { subject: string; question: Question }[] = [];

  for (const subject of subjects) {
    const base = clamp(body.difficulties?.[subject] ?? 3);
    for (let k = 0; k < perSubject; k++) {
      const difficulty = clamp(base + k);
      let q: Question | null = null;
      if (ctx.apiKey) {
        q = await generateQuestion(
          ctx.provider,
          ctx.apiKey,
          ctx.model,
          subject,
          body.profile,
          difficulty,
          [],
          [],
        );
      }
      if (!q) q = fallbackQuestion(subject, difficulty, body.profile);
      items.push({ subject, question: q });
    }
  }

  return NextResponse.json({ items });
}
