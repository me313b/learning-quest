// POST: turn text into natural speech (MP3) using the family's OpenAI key.
// Younger learners get slightly slower, clearer French. Generated audio is
// cached in Supabase STORAGE (the "audio" bucket), namespaced per family, so the
// same phrase is never regenerated. Everything is best-effort: if the bucket
// isn't set up yet we simply generate each time, so audio keeps working either
// way. Nothing is written to local/server disk (Vercel-safe). The key never
// leaves the server.

import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { textToSpeech } from "@/lib/ai";

export const runtime = "nodejs";

const BUCKET = "audio";

interface Body {
  text: string;
  voice?: string;
  lang?: string;
  speed?: number;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "no_text" }, { status: 400 });

  const voice = body.voice || "coral";
  const isFrench = (body.lang || "").toLowerCase().startsWith("fr");
  // Default to a gentle, slightly slow pace; slower again for French learners.
  const speed = body.speed ?? (isFrench ? 0.8 : 0.95);

  // Steer the voice to sound bright and cheerful, like a kind teacher.
  const instructions = isFrench
    ? "Speak in clear, warm, cheerful French with a gentle, natural French accent. Sound friendly and " +
      "encouraging, like a kind teacher helping a young child learn. Speak a little slowly and clearly, " +
      "with a happy, lively feel."
    : "Speak in a warm, cheerful, friendly and upbeat tone, like a kind and encouraging teacher talking " +
      "to a happy young child. Sound bright, lively, clear and a little playful.";

  if (ctx.provider !== "openai" || !ctx.apiKey) {
    return NextResponse.json({ fallback: true });
  }

  const hash = createHash("sha256")
    .update(`${text}|${voice}|${speed}|gpt-4o-mini-tts|${instructions}|openai`)
    .digest("hex");
  // Namespace by owner so Storage RLS keeps each family's clips private.
  const path = `${ctx.user.id}/${hash}.mp3`;

  // 1) Try the Storage cache (best-effort — ignore if the bucket isn't there).
  try {
    const { data, error } = await ctx.supabase.storage.from(BUCKET).download(path);
    if (!error && data) {
      const buf = Buffer.from(await data.arrayBuffer());
      if (buf.length > 0) {
        return NextResponse.json({
          audioB64: buf.toString("base64"),
          mime: "audio/mpeg",
          source: "cache",
        });
      }
    }
  } catch {
    /* bucket missing or download failed — carry on and generate */
  }

  // 2) Generate.
  const audioB64 = await textToSpeech(ctx.provider, ctx.apiKey, text, voice, speed, instructions);
  if (!audioB64) return NextResponse.json({ fallback: true });

  // 3) Upload to Storage for next time (best-effort).
  try {
    const buf = Buffer.from(audioB64, "base64");
    await ctx.supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: "audio/mpeg",
      upsert: true,
    });
  } catch {
    /* upload failed (bucket missing or race) — not fatal */
  }

  return NextResponse.json({ audioB64, mime: "audio/mpeg", source: "generated" });
}
