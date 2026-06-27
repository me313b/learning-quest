// GET  -> non-secret settings for the parent UI (never returns the API key).
// POST -> save settings; the API key is encrypted before it touches the DB.

import { NextResponse } from "next/server";
import { getUserAndKey } from "@/lib/server-settings";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret, hashPin } from "@/lib/crypto";
import { DEFAULT_MODELS } from "@/lib/ai";
import type { Provider, SafeSettings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const s = ctx.settings;
  const provider = (ctx.provider || "anthropic") as Provider;
  const safe: SafeSettings = {
    provider,
    model: (s?.api_model as string) || DEFAULT_MODELS[provider],
    hasKey: Boolean(s?.api_key_encrypted),
    videoUrls: (s?.video_urls as string[]) || [],
    playlistId: (s?.playlist_id as string) || "",
    pinSet: Boolean(s?.parent_pin),
    rewardDailyCap: Number(s?.reward_daily_cap_min ?? 30) || 30,
    rewardPerCorrect: Number(s?.reward_per_correct_min ?? 1) || 1,
  };
  return NextResponse.json(safe);
}

interface SavePayload {
  provider?: Provider;
  model?: string;
  key?: string;
  clearKey?: boolean;
  videoUrls?: string[];
  playlistId?: string;
  pin?: string;
  rewardDailyCap?: number;
  rewardPerCorrect?: number;
}

export async function POST(req: Request) {
  const ctx = await getUserAndKey();
  if (!ctx.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as SavePayload;
  const supabase = createClient();

  const update: Record<string, unknown> = {
    owner: ctx.user.id,
    updated_at: new Date().toISOString(),
  };

  if (body.provider) update.api_provider = body.provider;
  if (body.model !== undefined) update.api_model = body.model;
  if (body.videoUrls !== undefined) update.video_urls = body.videoUrls;
  if (body.playlistId !== undefined) update.playlist_id = body.playlistId;
  if (body.pin !== undefined) update.parent_pin = body.pin ? hashPin(body.pin) : "";

  if (body.clearKey) {
    update.api_key_encrypted = "";
  } else if (body.key) {
    try {
      update.api_key_encrypted = encryptSecret(body.key);
    } catch (e) {
      return NextResponse.json(
        { error: `Server encryption key not configured: ${(e as Error).message}` },
        { status: 500 },
      );
    }
  }

  const { error } = await supabase
    .from("account_settings")
    .upsert(update, { onConflict: "owner" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Reward tuning is optional (columns may not exist yet) — save separately so a
  // missing column never blocks the other settings from saving.
  if (body.rewardDailyCap !== undefined || body.rewardPerCorrect !== undefined) {
    const rewardUpdate: Record<string, unknown> = {};
    if (body.rewardDailyCap !== undefined)
      rewardUpdate.reward_daily_cap_min = Math.max(0, Math.min(600, body.rewardDailyCap));
    if (body.rewardPerCorrect !== undefined)
      rewardUpdate.reward_per_correct_min = Math.max(0, Math.min(60, body.rewardPerCorrect));
    try {
      await supabase.from("account_settings").update(rewardUpdate).eq("owner", ctx.user.id);
    } catch {
      /* columns not present — ignore */
    }
  }

  return NextResponse.json({ ok: true });
}
