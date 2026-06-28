// All reads/writes the browser does, in one place. Every call goes through the
// anon Supabase client and is constrained by Row-Level Security, so a family
// only ever sees its own rows. Inserts deliberately omit `owner`: the database
// trigger stamps it from auth.uid(). Nothing here can touch the encrypted API
// key (that column is only read server-side).

import { createClient } from "./supabase/client";
import type { Attempt, Profile, Session, Strength, Verdict } from "./types";

// --------------------------------------------------------------------------- //
// Date helpers (local-day granularity is fine for streaks and daily sessions)
// --------------------------------------------------------------------------- //
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// --------------------------------------------------------------------------- //
// Profiles
// --------------------------------------------------------------------------- //
export async function listProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Profile[]) || [];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) || null;
}

export interface NewProfile {
  name: string;
  age: number;
  year: string;
  interests: string[];
  avatar: string;
  strengths: Record<string, Strength>;
  enabled_subjects: string[];
}

export async function createProfile(input: NewProfile): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      name: input.name,
      age: input.age,
      year: input.year,
      interests: input.interests,
      avatar: input.avatar,
      strengths: input.strengths,
      ability: {},
      enabled_subjects: input.enabled_subjects,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  id: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...patch, last_active: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Persist one subject's smoothed ability without clobbering the others. */
export async function persistAbility(
  profile: Profile,
  subject: string,
  value: number,
): Promise<void> {
  const supabase = createClient();
  const ability = { ...(profile.ability || {}), [subject]: value };
  const { error } = await supabase
    .from("profiles")
    .update({ ability, last_active: new Date().toISOString() })
    .eq("id", profile.id);
  if (error) throw error;
}

// --------------------------------------------------------------------------- //
// Sessions (one per child per day)
// --------------------------------------------------------------------------- //
export async function getOrCreateTodaySession(
  profileId: string,
  subjects: string[],
): Promise<Session> {
  const supabase = createClient();
  const day = todayStr();

  const existing = await supabase
    .from("sessions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("day", day)
    .maybeSingle();
  if (existing.data) return existing.data as Session;

  const inserted = await supabase
    .from("sessions")
    .insert({ profile_id: profileId, day, subjects })
    .select("*")
    .single();

  if (inserted.error) {
    // Lost a race on the unique(profile_id, day) constraint: read it back.
    const retry = await supabase
      .from("sessions")
      .select("*")
      .eq("profile_id", profileId)
      .eq("day", day)
      .single();
    if (retry.error) throw retry.error;
    return retry.data as Session;
  }
  return inserted.data as Session;
}

export async function updateSession(
  id: string,
  patch: Partial<Session>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("sessions").update(patch).eq("id", id);
  if (error) throw error;
}

// --------------------------------------------------------------------------- //
// Attempts
// --------------------------------------------------------------------------- //
export interface NewAttempt {
  profile_id: string;
  session_id: string | null;
  subject: string;
  topic: string;
  skill: string;
  difficulty: number;
  qtype: string;
  prompt: string;
  correct_answer: string;
  user_answer: string;
  verdict: Verdict;
  time_taken: number;
}

export async function recordAttempt(a: NewAttempt): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("attempts").insert({ ...a, resolved: false });
  if (error) throw error;

  // A correct answer clears any earlier miss on the same skill, so tomorrow's
  // warm-up doesn't keep re-seeding something already mastered.
  if (a.verdict === "correct" && a.skill) {
    await supabase
      .from("attempts")
      .update({ resolved: true })
      .eq("profile_id", a.profile_id)
      .eq("skill", a.skill)
      .eq("resolved", false)
      .neq("verdict", "correct");
  }
}

export async function attemptsForProfile(profileId: string): Promise<Attempt[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Attempt[]) || [];
}

export async function todayAttempts(profileId: string): Promise<Attempt[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("profile_id", profileId)
    .gte("created_at", startOfTodayISO())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Attempt[]) || [];
}

/** Skills the child has missed and not yet cleared, most-missed first. Used to
 *  seed the first question or two of a subject so today fixes yesterday. */
export async function unresolvedSkills(
  profileId: string,
  subject: string,
  limit = 2,
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select("skill, verdict, resolved, created_at")
    .eq("profile_id", profileId)
    .eq("subject", subject)
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of (data as Attempt[]) || []) {
    if (!row.skill) continue;
    if (!["incorrect", "partial", "timeout"].includes(row.verdict)) continue;
    counts.set(row.skill, (counts.get(row.skill) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill]) => skill);
}

/** Recent topics in a subject, so the AI can avoid repeating itself. */
export async function recentTopics(
  profileId: string,
  subject: string,
  limit = 6,
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select("topic, created_at")
    .eq("profile_id", profileId)
    .eq("subject", subject)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;

  const seen: string[] = [];
  for (const row of (data as Attempt[]) || []) {
    if (row.topic && !seen.includes(row.topic)) seen.push(row.topic);
    if (seen.length >= limit) break;
  }
  return seen;
}

// --------------------------------------------------------------------------- //
// Media settings (non-secret subset of account_settings; RLS-scoped to owner)
// --------------------------------------------------------------------------- //
export async function getMediaSettings(): Promise<{
  videoUrls: string[];
  playlistId: string;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("account_settings")
    .select("video_urls, playlist_id")
    .maybeSingle();
  if (error) throw error;
  return {
    videoUrls: (data?.video_urls as string[]) || [],
    playlistId: (data?.playlist_id as string) || "",
  };
}

// --------------------------------------------------------------------------- //
// Watched-time + weekly coverage helpers (added for rewards v2)
// --------------------------------------------------------------------------- //
function startOfWeekISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const sinceMonday = (dow + 6) % 7;
  d.setDate(d.getDate() - sinceMonday);
  return d.toISOString();
}

/** Today's session if it exists, without creating one (used on the home screen
 *  to read how much video time has already been watched today). */
export async function getTodaySession(profileId: string): Promise<Session | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("day", todayStr())
    .maybeSingle();
  if (error) throw error;
  return (data as Session) || null;
}

/** Most recent daily sessions (for the parent per-day video-time record). */
export async function recentSessions(profileId: string, limit = 14): Promise<Session[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("profile_id", profileId)
    .order("day", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Session[]) || [];
}

/** Distinct skill areas already practised in a subject SO FAR THIS WEEK, so the
 *  question generator can prefer areas not yet covered. */
export async function coveredSkillsThisWeek(
  profileId: string,
  subject: string,
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select("skill, created_at")
    .eq("profile_id", profileId)
    .eq("subject", subject)
    .gte("created_at", startOfWeekISO())
    .limit(200);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of (data as Attempt[]) || []) {
    if (r.skill) set.add(r.skill);
  }
  return [...set];
}

/** Permanently delete a child profile and everything attached to it (sessions
 *  and attempts cascade via foreign keys). Used from the parent area. */
export async function deleteProfile(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

// --------------------------------------------------------------------------- //
// Reward tuning (parent-configurable). Best-effort: if the optional columns
// aren't present yet, callers fall back to the built-in defaults.
// --------------------------------------------------------------------------- //
export async function getRewardSettings(): Promise<{ dailyCap: number; perCorrect: number }> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("account_settings")
      .select("reward_daily_cap_min, reward_per_correct_min")
      .maybeSingle();
    return {
      dailyCap: Number(data?.reward_daily_cap_min ?? 30) || 30,
      perCorrect: Number(data?.reward_per_correct_min ?? 1) || 1,
    };
  } catch {
    return { dailyCap: 30, perCorrect: 1 };
  }
}

/** Add (or, with a negative number, remove) bonus video minutes for a child's
 *  day. Returns the new bonus total, or null if it couldn't be saved. */
export async function grantBonusMinutes(
  profileId: string,
  deltaMinutes: number,
): Promise<number | null> {
  try {
    const session = await getOrCreateTodaySession(profileId, []);
    const current = Number(session.bonus_minutes || 0);
    const next = Math.max(-600, current + deltaMinutes);
    await updateSession(session.id, { bonus_minutes: next });
    return next;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------- //
// PhET simulation activity (optional table phet_activity_log). Best-effort:
// if the table doesn't exist yet the calls quietly no-op so the labs still work.
// --------------------------------------------------------------------------- //
export interface PhetActivity {
  id: string;
  profile_id: string;
  sim_slug: string;
  subject: string;
  topics: string[];
  prediction_answer: string | null;
  reflection_answer: string | null;
  completed: boolean;
  created_at: string;
}

export async function recordPhetActivity(a: {
  profileId: string;
  simSlug: string;
  subject: string;
  topics: string[];
  predictionAnswer?: string;
  reflectionAnswer?: string;
  completed: boolean;
}): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("phet_activity_log").insert({
      profile_id: a.profileId,
      sim_slug: a.simSlug,
      subject: a.subject,
      topics: a.topics,
      prediction_answer: a.predictionAnswer || null,
      reflection_answer: a.reflectionAnswer || null,
      completed: a.completed,
    });
  } catch {
    /* table not present yet — ignore */
  }
}

export async function phetActivityForProfile(
  profileId: string,
  limit = 200,
): Promise<PhetActivity[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("phet_activity_log")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []) as PhetActivity[];
  } catch {
    return [];
  }
}

// Kid-facing controls the parent set (timer length, voice, fun reactions).
// Best-effort with safe defaults so the quiz always works.
export async function getKidSettings(): Promise<{
  questionSeconds: number;
  allowOvertime: boolean;
  voice: string;
  funMode: boolean;
}> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("account_settings")
      .select("question_seconds, allow_overtime, tts_voice, fun_mode")
      .maybeSingle();
    return {
      questionSeconds: Number(data?.question_seconds ?? 60),
      allowOvertime: data?.allow_overtime ?? true,
      voice: (data?.tts_voice as string) || "coral",
      funMode: data?.fun_mode ?? true,
    };
  } catch {
    return { questionSeconds: 60, allowOvertime: true, voice: "coral", funMode: true };
  }
}

// Weekly dictation config (set by the parent) + result tracking. Best-effort.
export interface DictationConfig {
  words: string[];
  pause: number;
  confirm: boolean;
  length: "short" | "medium" | "long";
  difficulty: "easy" | "medium" | "hard";
}

export async function getDictationConfig(): Promise<DictationConfig> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("account_settings")
      .select("spelling_words, dictation_pause, dictation_confirm, dictation_length, dictation_difficulty")
      .maybeSingle();
    const len = String(data?.dictation_length || "short");
    const diff = String(data?.dictation_difficulty || "easy");
    return {
      words: (data?.spelling_words as string[]) || [],
      pause: Number(data?.dictation_pause ?? 4) || 4,
      confirm: data?.dictation_confirm ?? false,
      length: (len === "medium" || len === "long" ? len : "short") as "short" | "medium" | "long",
      difficulty: (diff === "medium" || diff === "hard" ? diff : "easy") as "easy" | "medium" | "hard",
    };
  } catch {
    return { words: [], pause: 4, confirm: false, length: "short", difficulty: "easy" };
  }
}

export interface DictationRecord {
  id: string;
  profile_id: string;
  score: number;
  total: number;
  words: string[];
  created_at: string;
}

export async function recordDictation(a: {
  profileId: string;
  score: number;
  total: number;
  words: string[];
}): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("dictation_log").insert({
      profile_id: a.profileId,
      score: a.score,
      total: a.total,
      words: a.words,
    });
  } catch {
    /* table missing — ignore */
  }
}

export async function dictationForProfile(profileId: string, limit = 50): Promise<DictationRecord[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dictation_log")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []) as DictationRecord[];
  } catch {
    return [];
  }
}

// Recent wrong answers grouped for the daily coach. Pulls from the child's
// attempts; returns the most recent misses (incorrect/timeout) across days.
export async function recentWrongAttempts(
  profileId: string,
  max = 8,
): Promise<{ subject: string; skill: string; prompt: string; correct: string }[]> {
  try {
    const all = await attemptsForProfile(profileId);
    const wrong = all
      .filter((a) => a.verdict === "incorrect" || a.verdict === "timeout")
      .slice(0, 40);
    // De-duplicate by prompt, keep a spread of subjects.
    const seen = new Set<string>();
    const out: { subject: string; skill: string; prompt: string; correct: string }[] = [];
    for (const a of wrong) {
      const key = (a.prompt || "").slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        subject: a.subject || "",
        skill: a.skill || "",
        prompt: a.prompt || "",
        correct: a.correct_answer || "",
      });
      if (out.length >= max) break;
    }
    return out;
  } catch {
    return [];
  }
}

// Set today's bonus minutes to an exact value (used by the parent "Reset" so it
// lands on zero rather than deducting). grantBonusMinutes adds a delta; this one
// sets an absolute value.
export async function setBonusMinutes(profileId: string, value: number): Promise<number | null> {
  try {
    const session = await getOrCreateTodaySession(profileId, []);
    const next = Math.max(-600, Math.min(600, value));
    await updateSession(session.id, { bonus_minutes: next });
    return next;
  } catch {
    return null;
  }
}
