// POST: build a daily coaching review from recent mistakes, or answer a child's
// spoken question (Atlas). task = "review" | "ask".

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { coachAnswer, generateCoaching } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  task: "review" | "ask";
  mistakes?: { subject: string; skill: string; prompt: string; correct: string }[];
  includeFrench?: boolean;
  question?: string;
  context?: string;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  if (body.task === "ask") {
    const answer = await coachAnswer(ctx.provider, ctx.apiKey, ctx.model, body.question || "", body.context || "");
    if (!answer) return NextResponse.json({ fallback: true });
    return NextResponse.json({ answer });
  }

  const review = await generateCoaching(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    Array.isArray(body.mistakes) ? body.mistakes.slice(0, 12) : [],
    Boolean(body.includeFrench),
  );
  if (!review) return NextResponse.json({ fallback: true });
  return NextResponse.json({ review });
}
