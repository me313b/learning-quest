import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateFrenchSentence } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  level?: number;
  recent?: string[];
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  const sentence = await generateFrenchSentence(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    body.level ?? 1,
    Array.isArray(body.recent) ? body.recent : [],
  );
  if (!sentence) return NextResponse.json({ fallback: true });
  return NextResponse.json({ sentence });
}
