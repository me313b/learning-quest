"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { attemptsForProfile, deleteProfile, dictationForProfile, grantBonusMinutes, listProfiles, phetActivityForProfile, recentSessions, type DictationRecord } from "@/lib/data";
import {
  dailyAccuracy,
  difficultyTrend,
  focusNext,
  overallStats,
  skillBreakdown,
  skillStrengths,
  statsTextForAi,
  subjectBreakdown,
} from "@/lib/analytics";
import { levelFromAttempts } from "@/lib/levels";
import { earnedMinutesFromAttempts } from "@/lib/rewards";
import { toChildProfile } from "@/lib/profile";
import { EASY_MISS_MAX_DIFFICULTY, MAX_REWARD_MINUTES, PALETTE, SKILL_AREAS, SUBJECTS } from "@/lib/config";
import type { Attempt, Profile, Session } from "@/lib/types";
import type { PhetActivity } from "@/lib/data";
import { getSim, recommendedSims, SUBJECT_LABELS } from "@/lib/phet/catalog";
import { PixelButton } from "@/components/ui/primitives";

const LINE_COLOURS = [
  PALETTE.diamond,
  PALETTE.gold,
  PALETTE.emerald,
  PALETTE.redstone,
  PALETTE.lapis,
  PALETTE.iron,
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-black/40 bg-black/25 px-3 py-3 text-center">
      <div className="font-pixel text-sm text-paper">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-paper/60">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [bonusMsg, setBonusMsg] = useState("");
  const [grantingBonus, setGrantingBonus] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [phet, setPhet] = useState<PhetActivity[]>([]);
  const [dictation, setDictation] = useState<DictationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await listProfiles();
        setProfiles(list);
        if (list.length) setSelectedId(list[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadAttempts = useCallback(async (id: string) => {
    setAttempts(await attemptsForProfile(id));
    try {
      setSessions(await recentSessions(id, 14));
    } catch {
      setSessions([]);
    }
    try {
      setPhet(await phetActivityForProfile(id));
    } catch {
      setPhet([]);
    }
    try {
      setDictation(await dictationForProfile(id, 30));
    } catch {
      setDictation([]);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      setNote("");
      loadAttempts(selectedId);
    }
  }, [selectedId, loadAttempts]);

  const selected = profiles.find((p) => p.id === selectedId) || null;

  async function removeSelected() {
    if (!selected) return;
    setRemoving(true);
    try {
      await deleteProfile(selected.id);
      const remaining = profiles.filter((p) => p.id !== selected.id);
      setProfiles(remaining);
      setSelectedId(remaining[0]?.id || "");
      setConfirmDelete(false);
    } catch {
      /* leave the confirm open so they can retry */
    } finally {
      setRemoving(false);
    }
  }

  async function giveBonus(mins: number) {
    if (!selected) return;
    setGrantingBonus(true);
    setBonusMsg("");
    const res = await grantBonusMinutes(selected.id, mins);
    if (res === null) {
      setBonusMsg("Couldn't update — run RUN-THIS-IN-SUPABASE.sql in Supabase once to switch this on.");
    } else if (mins <= -9999) {
      setBonusMsg("Today's bonus has been reset to zero.");
    } else if (mins < 0) {
      setBonusMsg(`Deducted ${-mins} min — today's adjustment is now ${res} min.`);
    } else {
      setBonusMsg(`Added ${mins} min — today's adjustment is now ${res} min.`);
    }
    setGrantingBonus(false);
  }

  const [customMin, setCustomMin] = useState("15");

  const stats = useMemo(() => overallStats(attempts), [attempts]);
  const trend = useMemo(() => difficultyTrend(attempts), [attempts]);
  const accuracy = useMemo(() => dailyAccuracy(attempts), [attempts]);
  const rows = useMemo(() => subjectBreakdown(attempts), [attempts]);
  const { strengths, weaknesses } = useMemo(() => skillStrengths(attempts), [attempts]);
  const focus = useMemo(() => focusNext(attempts), [attempts]);
  const skillCells = useMemo(() => skillBreakdown(attempts, 1), [attempts]);
  const level = useMemo(() => levelFromAttempts(attempts), [attempts]);

  const phetInsights = useMemo(() => {
    const isToday = (iso: string) => {
      const d = new Date(iso);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };
    const exploredToday = new Set(phet.filter((p) => isToday(p.created_at)).map((p) => p.sim_slug));
    const allSlugs = new Set(phet.map((p) => p.sim_slug));
    // Most-explored sims (by row count).
    const counts: Record<string, number> = {};
    for (const p of phet) counts[p.sim_slug] = (counts[p.sim_slug] || 0) + 1;
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug]) => getSim(slug))
      .filter(Boolean);
    // Topics covered.
    const topics = Array.from(new Set(phet.flatMap((p) => p.topics || []))).sort();
    // A completed reflection we can surface as an example insight.
    const lastReflection = phet.find((p) => p.completed && p.reflection_answer && p.reflection_answer.trim().length > 1);
    const reflectionSim = lastReflection ? getSim(lastReflection.sim_slug) : undefined;
    // Suggested next: recommended sims not yet explored.
    const suggested = recommendedSims()
      .filter((s) => !allSlugs.has(s.slug))
      .slice(0, 4);
    return {
      total: phet.length,
      exploredTodayCount: exploredToday.size,
      totalExploredCount: allSlugs.size,
      top,
      topics,
      lastReflection,
      reflectionSim,
      suggested,
    };
  }, [phet]);

  const counts = useMemo(() => {
    let correct = 0;
    let secondTry = 0;
    let incorrect = 0;
    let timeout = 0;
    let negatives = 0;
    for (const a of attempts) {
      if (a.verdict === "correct") correct += 1;
      else if (a.verdict === "partial") secondTry += 1;
      else if (a.verdict === "timeout") timeout += 1;
      else incorrect += 1;
      if (
        (a.verdict === "incorrect" || a.verdict === "timeout") &&
        (a.difficulty || 0) <= EASY_MISS_MAX_DIFFICULTY
      )
        negatives += 1;
    }
    return { correct, secondTry, incorrect, timeout, negatives };
  }, [attempts]);

  const coverage = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
    const weekStart = d.getTime();
    const bySub = new Map<string, Set<string>>();
    for (const a of attempts) {
      const t = a.created_at ? new Date(a.created_at).getTime() : 0;
      if (t < weekStart || !a.subject || !a.skill) continue;
      const set = bySub.get(a.subject) ?? new Set<string>();
      set.add(a.skill);
      bySub.set(a.subject, set);
    }
    return Object.keys(SKILL_AREAS)
      .filter((s) => bySub.has(s))
      .map((s) => {
        const all = SKILL_AREAS[s];
        const done = bySub.get(s)!;
        return {
          subject: s,
          covered: all.filter((area) => done.has(area)),
          notYet: all.filter((area) => !done.has(area)),
        };
      });
  }, [attempts]);

  const videoRows = useMemo(() => {
    const cap = MAX_REWARD_MINUTES;
    const byDayAtt = new Map<string, Attempt[]>();
    for (const a of attempts) {
      const day = (a.created_at || "").slice(0, 10);
      if (!day) continue;
      const arr = byDayAtt.get(day) ?? [];
      arr.push(a);
      byDayAtt.set(day, arr);
    }
    const byDaySess = new Map<string, Session>();
    for (const s of sessions) byDaySess.set(s.day, s);
    const days = new Set<string>([...byDayAtt.keys(), ...byDaySess.keys()]);
    return [...days]
      .sort()
      .reverse()
      .slice(0, 14)
      .map((day) => {
        const earned = Math.min(earnedMinutesFromAttempts(byDayAtt.get(day) ?? []), cap);
        const watched = Number(byDaySess.get(day)?.minutes_used || 0);
        const subs =
          byDaySess.get(day)?.subjects?.length
            ? byDaySess.get(day)!.subjects
            : [...new Set((byDayAtt.get(day) ?? []).map((a) => a.subject))];
        return {
          day,
          earned: Math.round(earned * 10) / 10,
          watched: Math.round(watched * 10) / 10,
          remaining: Math.round(Math.max(0, earned - watched) * 10) / 10,
          source: subs.map((x) => SUBJECTS[x]?.label || x).join(", "),
        };
      });
  }, [attempts, sessions]);

  async function generateNote() {
    if (!selected) return;
    setNoteLoading(true);
    try {
      const res = await fetch("/api/progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: toChildProfile(selected),
          statsText: statsTextForAi(attempts),
        }),
      });
      const data = (await res.json()) as { text: string };
      setNote(data.text || "");
    } catch {
      setNote("Couldn't generate a note just now. Please try again.");
    } finally {
      setNoteLoading(false);
    }
  }

  if (loading) {
    return <div className="mc-card-dark text-center text-paper/70">Loading dashboard…</div>;
  }

  if (!profiles.length) {
    return (
      <div className="mc-card-dark text-center text-paper/80">
        No players yet. Add a child first, then their progress will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="mc-card-dark">
        <label className="mb-2 block text-xs text-paper/70">Whose progress?</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mc-input"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id} className="bg-paneldark">
              {p.name} (Year {p.year})
            </option>
          ))}
        </select>

        {selected && (
          <div className="mt-3 border-t border-white/10 pt-3">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-redstone/90 underline"
              >
                Remove {selected.name}
              </button>
            ) : (
              <div className="rounded-xl border-2 border-redstone/50 bg-redstone/10 p-3">
                <p className="text-sm text-paper/90">
                  Delete <span className="font-semibold">{selected.name}</span> and all their
                  progress? This cannot be undone.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={removeSelected}
                    disabled={removing}
                    className="rounded-lg border-2 border-redstone bg-redstone/30 px-3 py-1.5 text-sm text-paper disabled:opacity-50"
                  >
                    {removing ? "Removing…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-1.5 text-sm text-paper/80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="mc-card-dark space-y-2">
          <h3 className="font-pixel text-xs text-grasstop">🎁 Bonus video minutes (today)</h3>
          <p className="text-xs text-paper/60">
            Give {selected.name} extra minutes for today only, on top of what they earn — or deduct minutes.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => giveBonus(5)}
              disabled={grantingBonus}
              className="rounded-lg border-2 border-grasstop/60 bg-grass/15 px-3 py-1.5 text-sm text-paper disabled:opacity-50"
            >
              +5 min
            </button>
            <button
              onClick={() => giveBonus(10)}
              disabled={grantingBonus}
              className="rounded-lg border-2 border-grasstop/60 bg-grass/15 px-3 py-1.5 text-sm text-paper disabled:opacity-50"
            >
              +10 min
            </button>
            <button
              onClick={() => giveBonus(-9999)}
              disabled={grantingBonus}
              className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-1.5 text-sm text-paper/80 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="number"
              min={1}
              max={600}
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="mc-input w-20 text-center"
              aria-label="Custom minutes"
            />
            <span className="text-xs text-paper/55">minutes</span>
            <button
              onClick={() => giveBonus(Math.max(1, Math.min(600, parseInt(customMin, 10) || 0)))}
              disabled={grantingBonus}
              className="rounded-lg border-2 border-grasstop/60 bg-grass/15 px-3 py-1.5 text-sm text-paper disabled:opacity-50"
            >
              ➕ Add
            </button>
            <button
              onClick={() => giveBonus(-Math.max(1, Math.min(600, parseInt(customMin, 10) || 0)))}
              disabled={grantingBonus}
              className="rounded-lg border-2 border-redstone/50 bg-redstone/15 px-3 py-1.5 text-sm text-paper disabled:opacity-50"
            >
              ➖ Deduct
            </button>
          </div>
          {bonusMsg && <p className="text-xs text-emerald">{bonusMsg}</p>}
        </div>
      )}

      {dictation.length > 0 && (
        <div className="mc-card-dark space-y-2">
          <h3 className="font-pixel text-xs text-grasstop">✍️ Spelling progress</h3>
          <p className="text-xs text-paper/60">
            {dictation.length} dictation{dictation.length === 1 ? "" : "s"} ·{" "}
            {(() => {
              const withTotal = dictation.filter((d) => d.total > 0);
              if (!withTotal.length) return "no scores yet";
              const pct = Math.round(
                (withTotal.reduce((s, d) => s + d.score / d.total, 0) / withTotal.length) * 100,
              );
              return `${pct}% average correct`;
            })()}
          </p>
          <div className="space-y-1">
            {dictation.slice(0, 6).map((d) => {
              const pct = d.total > 0 ? Math.round((d.score / d.total) * 100) : 0;
              return (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5 text-sm">
                  <span className="text-paper/60">{new Date(d.created_at).toLocaleDateString()}</span>
                  <span className="text-paper/85">
                    {d.score}/{d.total}
                  </span>
                  <span className={pct >= 60 ? "text-emerald" : "text-gold2"}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="mc-card-dark text-center text-paper/80">
          No practice yet. Once {selected?.name} completes a quest, their progress shows here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Questions" value={String(stats.total)} />
            <StatCard label="Accuracy" value={`${stats.accuracy}%`} />
            <StatCard label="Avg time" value={`${stats.avgTime}s`} />
            <StatCard label="Day streak" value={String(stats.streak)} />
          </div>

          {focus && (
            <div
              className="rounded-2xl border-4 border-gold/50 p-5 shadow-pixel"
              style={{ background: "linear-gradient(160deg, rgba(242,178,51,0.16), rgba(22,17,30,0.96))" }}
            >
              <h3 className="font-pixel text-xs text-gold">🎯 What to focus on next</h3>
              <p className="mt-2 text-base text-paper">
                <span className="font-semibold text-gold">{focus.skill}</span>{" "}
                <span className="text-paper/70">({focus.label})</span> — currently {focus.accuracy}% over{" "}
                {focus.n} {focus.n === 1 ? "question" : "questions"}.
              </p>
              <p className="mt-1.5 text-sm text-paper/80">{focus.tip}</p>
            </div>
          )}

          <div className="mc-card-dark flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-4 border-gold/60 bg-gold/15 font-pixel text-base text-gold">
              {level.level}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-pixel text-[11px] text-grasstop">
                  Level {level.level} · {level.title}
                </span>
                <span className="text-[10px] text-paper/50">{level.xp} XP</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-grass to-emerald"
                  style={{ width: `${level.progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mc-card-dark overflow-x-auto">
            <h3 className="mb-3 font-pixel text-xs text-grasstop">🎬 Video time per day</h3>
            <table className="w-full text-left text-sm text-paper/85">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-paper/50">
                  <th className="pb-2 pr-3">Day</th>
                  <th className="pb-2 pr-3">Earned</th>
                  <th className="pb-2 pr-3">Watched</th>
                  <th className="pb-2 pr-3">Left</th>
                  <th className="pb-2">From</th>
                </tr>
              </thead>
              <tbody>
                {videoRows.map((r) => (
                  <tr key={r.day} className="border-t border-white/10">
                    <td className="py-2 pr-3 whitespace-nowrap">{r.day}</td>
                    <td className="py-2 pr-3">{r.earned}m</td>
                    <td className="py-2 pr-3">{r.watched}m</td>
                    <td className="py-2 pr-3">{r.remaining}m</td>
                    <td className="py-2 text-xs text-paper/70">{r.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-paper/40">
              Earned is capped at {MAX_REWARD_MINUTES} minutes per day. Left = earned − watched.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Correct" value={String(counts.correct)} />
            <StatCard label="2nd-try" value={String(counts.secondTry)} />
            <StatCard label="Incorrect" value={String(counts.incorrect)} />
            <StatCard label="Timed out" value={String(counts.timeout)} />
            <StatCard label="Time lost" value={String(counts.negatives)} />
          </div>

          {coverage.length > 0 && (
            <div className="mc-card-dark">
              <h3 className="mb-3 font-pixel text-xs text-grasstop">🗓️ Topic coverage this week</h3>
              <div className="space-y-3">
                {coverage.map((c) => (
                  <div key={c.subject}>
                    <p className="mb-1 text-sm font-semibold text-paper/90">
                      {SUBJECTS[c.subject]?.emoji} {SUBJECTS[c.subject]?.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.covered.map((a) => (
                        <span
                          key={a}
                          className="rounded-md border border-emerald/40 bg-emerald/10 px-2 py-0.5 text-[11px] text-paper/85"
                        >
                          ✓ {a}
                        </span>
                      ))}
                      {c.notYet.map((a) => (
                        <span
                          key={a}
                          className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-paper/45"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-paper/40">
                Green = practised this week. Grey = not yet covered. Coverage aims to spread across
                the week.
              </p>
            </div>
          )}

          {trend.data.length > 0 && (
            <div className="mc-card-dark">
              <h3 className="mb-3 font-pixel text-xs text-grasstop">Difficulty reached over time</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" tick={{ fill: "#F4ECD8", fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#F4ECD8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#241C2E",
                        border: "2px solid rgba(0,0,0,0.4)",
                        borderRadius: 8,
                        color: "#F4ECD8",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {trend.subjects.map((s, i) => (
                      <Line
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stroke={LINE_COLOURS[i % LINE_COLOURS.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {accuracy.length > 0 && (
            <div className="mc-card-dark">
              <h3 className="mb-3 font-pixel text-xs text-grasstop">Daily accuracy</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accuracy} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" tick={{ fill: "#F4ECD8", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#F4ECD8", fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#241C2E",
                        border: "2px solid rgba(0,0,0,0.4)",
                        borderRadius: 8,
                        color: "#F4ECD8",
                      }}
                    />
                    <Bar dataKey="accuracy" fill={PALETTE.emerald} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="mc-card-dark">
              <h3 className="mb-2 font-pixel text-xs text-grasstop">💪 Strengths</h3>
              {strengths.length ? (
                <ul className="space-y-1 text-sm text-paper/85">
                  {strengths.map((s) => (
                    <li key={s.skill}>
                      <span className="font-semibold">{s.skill}</span> — {s.accuracy}% ({s.n} qs)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-paper/50">Needs a few more questions to tell.</p>
              )}
            </div>
            <div className="mc-card-dark">
              <h3 className="mb-2 font-pixel text-xs text-gold">🎯 To work on</h3>
              {weaknesses.length ? (
                <ul className="space-y-1 text-sm text-paper/85">
                  {weaknesses.map((w) => (
                    <li key={w.skill}>
                      <span className="font-semibold">{w.skill}</span> — {w.accuracy}% ({w.n} qs)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-paper/50">Nothing flagged yet. Great going!</p>
              )}
            </div>
          </div>

          {skillCells.length > 0 && (
            <div className="mc-card-dark">
              <h3 className="mb-1 font-pixel text-xs text-grasstop">🔥 Skill heatmap</h3>
              <p className="mb-3 text-xs text-paper/50">
                Every skill practised, coloured by how it&apos;s going. Hover for the score.
              </p>
              <div className="flex flex-wrap gap-2">
                {skillCells.map((c) => {
                  const hue = Math.round((c.accuracy / 100) * 120); // 0=red → 120=green
                  return (
                    <div
                      key={`${c.subject}-${c.skill}`}
                      title={`${c.label} · ${c.skill}: ${c.accuracy}% over ${c.n} ${c.n === 1 ? "question" : "questions"}`}
                      className="flex flex-col gap-0.5 rounded-lg border-2 px-2.5 py-1.5"
                      style={{
                        borderColor: `hsl(${hue} 60% 35%)`,
                        background: `hsl(${hue} 55% 22%)`,
                      }}
                    >
                      <span className="text-xs text-paper/90">{c.skill}</span>
                      <span className="text-[10px] text-paper/55">
                        {c.label} · {c.accuracy}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mc-card-dark overflow-x-auto">
            <h3 className="mb-3 font-pixel text-xs text-grasstop">By subject</h3>
            <table className="w-full text-left text-sm text-paper/85">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-paper/50">
                  <th className="pb-2 pr-3">Subject</th>
                  <th className="pb-2 pr-3">Qs</th>
                  <th className="pb-2 pr-3">Acc%</th>
                  <th className="pb-2 pr-3">Avg lvl</th>
                  <th className="pb-2 pr-3">Peak</th>
                  <th className="pb-2">Avg s</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.subject} className="border-t border-white/10">
                    <td className="py-2 pr-3">
                      {SUBJECTS[r.subject]?.emoji} {r.label}
                    </td>
                    <td className="py-2 pr-3">{r.attempts}</td>
                    <td className="py-2 pr-3">{r.accuracy}</td>
                    <td className="py-2 pr-3">{r.avgDifficulty}</td>
                    <td className="py-2 pr-3">{r.peakDifficulty}</td>
                    <td className="py-2">{r.avgTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {phetInsights.total > 0 && (
            <div className="mc-card-dark space-y-3">
              <h3 className="font-pixel text-xs text-grasstop">🔬 PhET simulations</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Explored today" value={String(phetInsights.exploredTodayCount)} />
                <StatCard label="Different sims" value={String(phetInsights.totalExploredCount)} />
                <StatCard label="Topics touched" value={String(phetInsights.topics.length)} />
              </div>

              {phetInsights.reflectionSim && phetInsights.lastReflection?.reflection_answer && (
                <div className="rounded-xl border-l-8 border-grasstop bg-black/30 px-4 py-3 text-sm text-paper/85">
                  <span className="font-semibold text-grasstop">{selected?.name} </span>
                  explored <span className="font-semibold">{phetInsights.reflectionSim.title}</span> and noticed:
                  <span className="italic text-paper/75"> “{phetInsights.lastReflection.reflection_answer}”</span>
                </div>
              )}

              {phetInsights.top.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-paper/50">Most explored</p>
                  <div className="flex flex-wrap gap-2">
                    {phetInsights.top.map((s) =>
                      s ? (
                        <span key={s.slug} className="rounded-lg border-2 border-black/30 bg-black/25 px-2.5 py-1 text-xs text-paper/85">
                          {s.title} <span className="text-paper/45">· {SUBJECT_LABELS[s.subject]}</span>
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>
              )}

              {phetInsights.topics.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-paper/50">Topics covered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {phetInsights.topics.map((t) => (
                      <span key={t} className="rounded-md bg-diamond/10 px-2 py-0.5 text-[11px] text-diamond">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {phetInsights.suggested.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-paper/50">Suggested next</p>
                  <div className="flex flex-wrap gap-2">
                    {phetInsights.suggested.map((s) => (
                      <span key={s.slug} className="rounded-lg border-2 border-grasstop/30 bg-grass/10 px-2.5 py-1 text-xs text-paper/85">
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mc-card-dark">
            <h3 className="mb-3 font-pixel text-xs text-grasstop">📝 AI progress note</h3>
            {note ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper/90">{note}</p>
            ) : (
              <p className="mb-3 text-xs text-paper/60">
                Generate a short written summary of how {selected?.name} is doing. Needs an AI key
                (charts and tables work without one).
              </p>
            )}
            <div className="mt-3">
              <PixelButton onClick={generateNote} disabled={noteLoading}>
                {noteLoading ? "Writing…" : note ? "Regenerate" : "Generate progress note"}
              </PixelButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
