// POST: a short written progress note for the parent, generated from the stats
// summary. The charts work without a key; this paragraph needs one.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { progressReport } from "@/lib/ai";
import type { ChildProfile } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  profile: ChildProfile;
  statsText: string;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;

  if (!ctx.apiKey) {
    return NextResponse.json({
      text: "Add an AI API key in Settings to generate a written summary. The charts and tables work without one.",
    });
  }

  const text = await progressReport(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    body.profile,
    body.statsText,
  );
  return NextResponse.json({ text });
}
