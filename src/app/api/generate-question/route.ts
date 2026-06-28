// POST: make one question for a subject at a difficulty. Uses the family's AI
// key when present; otherwise returns a deterministic, Minecraft-themed
// fallback so the app is fully playable with no key configured.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateQuestion } from "@/lib/ai";
import { fallbackQuestion } from "@/lib/content";
import { MAX_DIFFICULTY } from "@/lib/config";
import type { ChildProfile } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  subject: string;
  profile: ChildProfile;
  difficulty: number;
  recentTopics?: string[];
  targetSkills?: string[];
  coveredThisWeek?: string[];
  language?: "en" | "fr";
  reasoning?: boolean;
  avoid?: string[];
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const difficulty = Math.max(1, Math.min(MAX_DIFFICULTY, Math.round(body.difficulty || 3)));

  if (ctx.apiKey) {
    const q = await generateQuestion(
      ctx.provider,
      ctx.apiKey,
      ctx.model,
      body.subject,
      body.profile,
      difficulty,
      body.recentTopics || [],
      body.targetSkills || [],
      body.coveredThisWeek || [],
      body.language === "fr" ? "fr" : "en",
      Boolean(body.reasoning),
      Array.isArray(body.avoid) ? body.avoid : [],
    );
    if (q) return NextResponse.json({ question: q });
  }

  // No key, or the model hiccuped: always return a usable question.
  const q = fallbackQuestion(body.subject, difficulty, body.profile);
  return NextResponse.json({ question: q });
}
