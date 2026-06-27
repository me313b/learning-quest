// POST: look at an uploaded drawing (base64) and return warm, specific praise.
// Needs a vision-capable AI key; without one we still cheer the child on.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { gradeArt } from "@/lib/ai";
import type { ArtResult, ChildProfile } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  imageB64: string;
  mediaType?: string;
  profile: ChildProfile;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;

  if (ctx.apiKey && body.imageB64) {
    const result = await gradeArt(
      ctx.provider,
      ctx.apiKey,
      ctx.model,
      body.imageB64,
      body.mediaType || "image/png",
      body.profile,
    );
    return NextResponse.json({ result });
  }

  const result: ArtResult = {
    praise: "Wow, what a brilliant drawing! 🎨",
    noticed: "I can see you put real effort into this.",
    idea: "Add an AI key in the parent area and I'll give proper art feedback next time!",
  };
  return NextResponse.json({ result });
}
