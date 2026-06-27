// POST: test that an API key works. If no key is posted, the saved (decrypted)
// key is tested instead, so the parent can re-check an existing key.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { validateKey } from "@/lib/ai";
import type { Provider } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  provider?: Provider;
  key?: string;
  model?: string;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const provider = body.provider || ctx.provider;
  const model = body.model || ctx.model;
  const key = body.key && body.key.trim() ? body.key.trim() : ctx.apiKey;

  if (!key) {
    return NextResponse.json({ ok: false, message: "No API key to test. Paste one first." });
  }

  const out = await validateKey(provider, key, model);
  return NextResponse.json(out);
}
