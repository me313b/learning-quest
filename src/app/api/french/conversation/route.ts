import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { frenchConversationReply } from "@/lib/ai";

export const runtime = "nodejs";

interface Body {
  scenario: string;
  setting: string;
  history?: { who: "ai" | "child"; fr: string }[];
  kidSaid?: string;
  struggled?: boolean;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (ctx.provider !== "openai" || !ctx.apiKey) return NextResponse.json({ fallback: true });

  const reply = await frenchConversationReply(
    ctx.provider,
    ctx.apiKey,
    ctx.model,
    body.scenario || "",
    body.setting || "",
    Array.isArray(body.history) ? body.history : [],
    body.kidSaid || "",
    Boolean(body.struggled),
  );
  if (!reply) return NextResponse.json({ fallback: true });
  return NextResponse.json({ reply });
}
