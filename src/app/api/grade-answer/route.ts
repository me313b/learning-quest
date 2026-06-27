// POST: grade a single open answer. Objective answers are marked locally (free,
// instant); only genuinely open writing (sentences, French) reaches the AI.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { gradeAnswer } from "@/lib/ai";
import { checkObjective } from "@/lib/adaptive";
import type { ChildProfile, GradeResult, Question } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  subject: string;
  question: Question;
  userAnswer: string;
  profile: ChildProfile;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;

  // Defensive: if this turns out to be locally checkable, mark it here.
  const local = checkObjective(body.question, body.userAnswer);
  if (local) {
    const result: GradeResult = {
      verdict: local,
      feedback: local === "correct" ? "Spot on! 🎉" : "Not quite — let's look at why.",
      correction: local === "correct" ? "" : body.question.answer,
      tip: "",
    };
    return NextResponse.json({ result });
  }

  if (ctx.apiKey) {
    const result = await gradeAnswer(
      ctx.provider,
      ctx.apiKey,
      ctx.model,
      body.subject,
      body.question,
      body.userAnswer,
      body.profile,
    );
    return NextResponse.json({ result });
  }

  // No key and not auto-checkable: reward the effort kindly.
  const result: GradeResult = {
    verdict: "partial",
    feedback: "Good effort! Add an AI key in the parent area for detailed feedback.",
    correction: "",
    tip: "",
  };
  return NextResponse.json({ result });
}
