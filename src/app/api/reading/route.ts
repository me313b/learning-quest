// POST: generate a short French reading-comprehension story (story + English
// translation + comprehension questions + a summarise prompt). Needs an AI key.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateReading } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  theme?: string;
  level?: number;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;

  if (!ctx.apiKey) return NextResponse.json({ needsKey: true });

  const level = Math.max(1, Math.min(5, Number(body.level) || 2));
  const story = await generateReading(ctx.provider, ctx.apiKey, ctx.model, (body.theme || "").slice(0, 80), level);
  if (!story) return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  return NextResponse.json({ story });
}
