import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateFacts } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  category?: string;
  recent?: string[];
  count?: number;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  const facts = await generateFacts(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    body.category || "all",
    Array.isArray(body.recent) ? body.recent : [],
    Math.max(4, Math.min(12, body.count || 8)),
  );
  if (!facts.length) return NextResponse.json({ fallback: true });
  return NextResponse.json({ facts });
}
