"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProfile, listProfiles } from "@/lib/data";
import {
  AVATARS,
  CORE_SUBJECTS,
  EXTRA_QUIZ_SUBJECTS,
  STRENGTH_LABELS,
  SUBJECTS,
} from "@/lib/config";
import type { Profile, Strength } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";

const STRENGTHS: Strength[] = ["needs_practice", "on_track", "strong", "very_strong"];

export default function ChildPicker() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // New-child form state.
  const [name, setName] = useState("");
  const [age, setAge] = useState(6);
  const [year, setYear] = useState("Year 1");
  const [interests, setInterests] = useState("Minecraft");
  const [avatar, setAvatar] = useState("steve");
  const [strengths, setStrengths] = useState<Record<string, Strength>>(
    Object.fromEntries(CORE_SUBJECTS.map((s) => [s, "on_track" as Strength])),
  );
  const [extras, setExtras] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function reload() {
    setLoading(true);
    try {
      setProfiles(await listProfiles());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function saveChild() {
    if (!name.trim()) return;
    setSaving(true);
    setErr("");
    try {
      const p = await createProfile({
        name: name.trim(),
        age: Number(age) || 6,
        year: year.trim(),
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        avatar,
        strengths,
        enabled_subjects: extras,
      });
      setAdding(false);
      setName("");
      await reload();
      router.push(`/play?p=${p.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 text-center">
        <div className="text-5xl">⛏️</div>
        <h1 className="mt-2 font-pixel text-lg text-grasstop">Who&apos;s questing today?</h1>
      </header>

      {loading ? (
        <p className="text-center text-paper/60">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/play?p=${p.id}`)}
              className="mc-card flex flex-col items-center gap-2 transition hover:-translate-y-1"
            >
              <span className="text-5xl">{AVATARS[p.avatar] || "🧑"}</span>
              <span className="font-pixel text-xs text-paper">{p.name}</span>
              <span className="text-[10px] text-paper/60">{p.year}</span>
            </button>
          ))}

          <button
            onClick={() => setAdding((v) => !v)}
            className="mc-card flex flex-col items-center justify-center gap-2 border-dashed text-paper/70 transition hover:-translate-y-1"
          >
            <span className="text-4xl">➕</span>
            <span className="font-pixel text-[10px]">Add a child</span>
          </button>
        </div>
      )}

      {adding && (
        <div className="mc-card-dark mt-6 space-y-4">
          <h2 className="font-pixel text-xs text-diamond">New explorer</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-paper/70">Name</label>
              <input className="mc-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-paper/70">Age</label>
              <input
                type="number"
                className="mc-input"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-paper/70">Year group</label>
              <input className="mc-input" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-paper/70">
                Interests (comma separated)
              </label>
              <input
                className="mc-input"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-paper/70">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(AVATARS).map(([key, emoji]) => (
                <button
                  key={key}
                  onClick={() => setAvatar(key)}
                  className={`rounded-xl border-4 px-3 py-2 text-2xl ${
                    avatar === key ? "border-diamond bg-black/40" : "border-black/40 bg-black/20"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-paper/70">
              How are they doing in each subject? (sets the starting difficulty)
            </label>
            <div className="space-y-2">
              {CORE_SUBJECTS.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-32 text-sm text-paper/80">
                    {SUBJECTS[s].emoji} {SUBJECTS[s].label}
                  </span>
                  <select
                    className="mc-input flex-1 py-2"
                    value={strengths[s]}
                    onChange={(e) =>
                      setStrengths((prev) => ({ ...prev, [s]: e.target.value as Strength }))
                    }
                  >
                    {STRENGTHS.map((opt) => (
                      <option key={opt} value={opt}>
                        {STRENGTH_LABELS[opt]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-paper/70">
              Extra subjects to switch on (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {EXTRA_QUIZ_SUBJECTS.map((s) => {
                const on = extras.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() =>
                      setExtras((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))
                    }
                    className={`rounded-lg border-2 px-3 py-2 text-xs ${
                      on ? "border-emerald bg-emerald/20 text-white" : "border-black/40 bg-black/20 text-paper/70"
                    }`}
                  >
                    {SUBJECTS[s].emoji} {SUBJECTS[s].label}
                  </button>
                );
              })}
            </div>
          </div>

          {err && <p className="text-xs text-redstone">{err}</p>}

          <div className="flex gap-2">
            <PixelButton onClick={saveChild} disabled={saving || !name.trim()}>
              {saving ? "Saving…" : "Start questing"}
            </PixelButton>
            <button
              onClick={() => setAdding(false)}
              className="rounded-xl border-4 border-black/40 bg-black/20 px-4 py-3 font-pixel text-xs text-paper/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <footer className="mt-10 flex items-center justify-between text-xs">
        <button onClick={() => router.push("/parent")} className="text-diamond underline">
          Parent area →
        </button>
        <button onClick={signOut} className="text-paper/50 underline">
          Sign out
        </button>
      </footer>
    </main>
  );
}
