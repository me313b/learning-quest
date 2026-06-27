import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateFrenchBuilder } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  topic?: string;
  level?: number;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  const exercise = await generateFrenchBuilder(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    body.topic || "",
    body.level ?? 2,
  );
  if (!exercise) return NextResponse.json({ fallback: true });
  return NextResponse.json({ exercise });
}
