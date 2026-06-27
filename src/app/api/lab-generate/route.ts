// POST: generate one complete interactive experiment (HTML/CSS/JS) for a
// subject + concept. The HTML is rendered by the client inside a locked-down
// sandboxed iframe. Generation needs an AI key (that's the whole point), so
// without one we say so rather than returning a canned toy.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { generateLabHtml } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  subject: string;
  concept: string;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const subject = (body.subject || "physics").slice(0, 40);
  const concept = (body.concept || "").slice(0, 120);

  if (!ctx.apiKey) {
    return NextResponse.json({ needsKey: true });
  }

  const html = await generateLabHtml(ctx.provider, ctx.apiKey, ctx.model, subject, concept);
  if (!html) return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  return NextResponse.json({ html });
}
