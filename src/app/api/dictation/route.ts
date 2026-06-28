// POST: generate a dictation passage, or mark a photo of the child's writing.
// task = "generate" | "mark". Returns { fallback: true } without an OpenAI key.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateDictation, markDictation } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  task: "generate" | "mark";
  words?: string[];
  lengthLevel?: "short" | "medium" | "long";
  difficulty?: "easy" | "medium" | "hard";
  passage?: string;
  imageB64?: string;
  mediaType?: string;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  if (body.task === "mark") {
    const img = body.imageB64 || "";
    if (!img) return NextResponse.json({ error: "no_image" }, { status: 400 });
    if (img.length > 9_400_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
    const result = await markDictation(
      ctx.provider,
      ctx.apiKey,
      ctx.model,
      body.passage || "",
      Array.isArray(body.words) ? body.words : [],
      img,
      body.mediaType || "image/jpeg",
    );
    if (!result) return NextResponse.json({ fallback: true });
    return NextResponse.json({ result });
  }

  const passage = await generateDictation(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    Array.isArray(body.words) ? body.words.slice(0, 30) : [],
    body.lengthLevel || "short",
    body.difficulty || "easy",
  );
  if (!passage) return NextResponse.json({ fallback: true });
  return NextResponse.json({ passage });
}
