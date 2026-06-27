// POST: produce one fresh "lab" instance for a subject. The AI only ever picks
// from the vetted templates for that subject and supplies new framing; we
// validate the template server-side. With no key (or on any hiccup) we fall
// back to a hand-written instance so the lab always loads.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateLab } from "@/lib/ai";
import { LAB_TEMPLATES, fallbackLab } from "@/lib/labs";

export const runtime = "nodejs";

interface Body {
  subject: string;
  recent?: string[];
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const subject = body.subject || "physics";
  const templates = LAB_TEMPLATES[subject];
  const recent = body.recent || [];

  if (!templates) {
    return NextResponse.json({ lab: fallbackLab("physics", recent) });
  }

  if (ctx.apiKey) {
    const lab = await generateLab(ctx.provider, ctx.apiKey, ctx.model, subject, templates, recent);
    if (lab) return NextResponse.json({ lab });
  }

  return NextResponse.json({ lab: fallbackLab(subject, recent) });
}
