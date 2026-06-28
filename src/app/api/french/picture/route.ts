// POST: generate a batch of French picture-naming items with the family's
// OpenAI key. Returns { fallback: true } without a key so the client uses its
// built-in picture bank instead.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateFrenchPictures } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  count?: number;
  recent?: string[];
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  const items = await generateFrenchPictures(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    Math.max(4, Math.min(12, body.count || 8)),
    Array.isArray(body.recent) ? body.recent.slice(0, 30) : [],
  );
  if (!items) return NextResponse.json({ fallback: true });
  return NextResponse.json({ items });
}
