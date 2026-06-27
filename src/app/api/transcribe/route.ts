// POST: transcribe a short recording (base64 audio) using OpenAI Whisper.
// Returns { fallback: true } without an OpenAI key, so the client can simply
// play the recording back instead. The key never leaves the server.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { transcribeAudio } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  audioB64: string;
  mime?: string;
  language?: string;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const audioB64 = body.audioB64 || "";
  if (!audioB64) return NextResponse.json({ error: "no_audio" }, { status: 400 });

  // Guard against very large uploads (~ a few MB of base64).
  if (audioB64.length > 6_000_000) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  if (ctx.provider !== "openai" || !ctx.apiKey) {
    return NextResponse.json({ fallback: true });
  }

  const text = await transcribeAudio(
    ctx.provider,
    ctx.apiKey,
    audioB64,
    body.mime || "audio/webm",
    body.language || "",
  );
  if (text === null) return NextResponse.json({ fallback: true });
  return NextResponse.json({ text });
}
