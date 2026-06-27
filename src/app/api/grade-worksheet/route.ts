// POST: mark a photo of a completed paper worksheet. Needs a vision-capable AI
// key. Given the list of questions (with expected answers) and the image, the
// AI reads each handwritten answer and returns a verdict per question. Without
// a key (or image) it returns an empty list so the UI falls back to the parent
// marking by hand.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { gradeWorksheet } from "@/lib/ai";
import type { WorksheetMarkItem } from "@/lib/ai/prompts";

export const runtime = "nodejs";

interface Body {
  items: WorksheetMarkItem[];
  imageB64?: string;
  mediaType?: string;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;

  if (!ctx.apiKey || !body.imageB64) {
    return NextResponse.json({ results: [], needsManual: true });
  }

  // Cap the photo size. A base64 string is ~4/3 the raw bytes, so ~9.4MB of
  // base64 is ~7MB of image — comfortably above a phone snapshot but a guard
  // against runaway uploads.
  if (body.imageB64.length > 9_400_000) {
    return NextResponse.json(
      { results: [], needsManual: true, error: "Photo is too large — please use a smaller image." },
      { status: 413 },
    );
  }

  const results = await gradeWorksheet(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    body.items || [],
    body.imageB64,
    body.mediaType || "image/jpeg",
  );
  return NextResponse.json({ results });
}
