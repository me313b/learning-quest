// POST: invent a fresh French conversation location with the family's OpenAI key.
// Returns { fallback: true } without an OpenAI key so the client uses its bank.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateFrenchScenario } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  recent?: string[];
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  const scenario = await generateFrenchScenario(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    Array.isArray(body.recent) ? body.recent.slice(0, 12) : [],
  );
  if (!scenario) return NextResponse.json({ fallback: true });
  return NextResponse.json({ scenario });
}
