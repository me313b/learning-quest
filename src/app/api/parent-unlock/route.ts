// POST: check the parent PIN server-side (the PIN never reaches the browser).
// If no PIN has been set yet, access is granted so the parent can set one.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { verifyPin } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { pin?: string };
  const stored = (ctx.settings?.parent_pin as string) || "";
  if (!stored) return NextResponse.json({ ok: true });

  const ok = verifyPin(String(body.pin || ""), stored);
  return NextResponse.json({ ok });
}
