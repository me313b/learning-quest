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
    questionSeconds: Number(s?.question_seconds ?? 60),
    allowOvertime: Boolean(s?.allow_overtime ?? true),
    voice: (s?.tts_voice as string) || "coral",
    funMode: Boolean(s?.fun_mode ?? true),
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
  questionSeconds?: number;
  allowOvertime?: boolean;
  voice?: string;
  funMode?: boolean;
  spellingWords?: string[];
  dictationPause?: number;
  dictationConfirm?: boolean;
  dictationLength?: string;
  dictationDifficulty?: string;
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

  // Reward tuning and the newer controls are optional (columns may not exist
  // yet) — save separately so a missing column never blocks the core settings.
  if (
    body.rewardDailyCap !== undefined ||
    body.rewardPerCorrect !== undefined ||
    body.questionSeconds !== undefined ||
    body.allowOvertime !== undefined ||
    body.voice !== undefined ||
    body.funMode !== undefined ||
    body.spellingWords !== undefined ||
    body.dictationPause !== undefined ||
    body.dictationConfirm !== undefined ||
    body.dictationLength !== undefined ||
    body.dictationDifficulty !== undefined
  ) {
    const extra: Record<string, unknown> = {};
    if (body.rewardDailyCap !== undefined)
      extra.reward_daily_cap_min = Math.max(0, Math.min(600, body.rewardDailyCap));
    if (body.rewardPerCorrect !== undefined)
      extra.reward_per_correct_min = Math.max(0, Math.min(60, body.rewardPerCorrect));
    if (body.questionSeconds !== undefined)
      extra.question_seconds = Math.max(0, Math.min(600, Math.round(body.questionSeconds)));
    if (body.allowOvertime !== undefined) extra.allow_overtime = Boolean(body.allowOvertime);
    if (body.voice !== undefined) extra.tts_voice = String(body.voice).slice(0, 32);
    if (body.funMode !== undefined) extra.fun_mode = Boolean(body.funMode);
    if (body.spellingWords !== undefined)
      extra.spelling_words = (body.spellingWords || []).map((w) => String(w).slice(0, 40)).slice(0, 40);
    if (body.dictationPause !== undefined)
      extra.dictation_pause = Math.max(1, Math.min(30, Math.round(body.dictationPause)));
    if (body.dictationConfirm !== undefined) extra.dictation_confirm = Boolean(body.dictationConfirm);
    if (body.dictationLength !== undefined) extra.dictation_length = String(body.dictationLength).slice(0, 12);
    if (body.dictationDifficulty !== undefined)
      extra.dictation_difficulty = String(body.dictationDifficulty).slice(0, 12);
    try {
      await supabase.from("account_settings").update(extra).eq("owner", ctx.user.id);
    } catch {
      /* columns not present — ignore */
    }
  }

  return NextResponse.json({ ok: true });
}
