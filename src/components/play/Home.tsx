"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { attemptsForProfile, unresolvedSkills } from "@/lib/data";
import { currentStreak } from "@/lib/analytics";
import { badges as computeBadges, encouragement, levelFromAttempts } from "@/lib/levels";
import { CORE_SUBJECTS, QUESTIONS_PER_SUBJECT, SUBJECTS } from "@/lib/config";
import { randomFact } from "@/lib/content";
import type { Attempt, Profile } from "@/lib/types";
import { Banner, Fact, Metric, PixelButton } from "@/components/ui/primitives";

export default function Home({
  profile,
  attempts,
  bankedMinutes,
  language,
  onLanguageChange,
  onStart,
  onReward,
  onLabs,
  onWorksheet,
}: {
  profile: Profile;
  attempts: Attempt[];
  bankedMinutes: number;
  language: "en" | "fr";
  onLanguageChange: (l: "en" | "fr") => void;
  onStart: (subjects: string[]) => void;
  onReward: () => void;
  onLabs: () => void;
  onWorksheet: () => void;
}) {
  const quizSubjects = useMemo(
    () => [
      ...CORE_SUBJECTS,
      ...(profile.enabled_subjects || []).filter((s) => s !== "physics" && !CORE_SUBJECTS.includes(s)),
    ],
    [profile.enabled_subjects],
  );
  const [selected, setSelected] = useState<string[]>(quizSubjects);
  const [streak, setStreak] = useState(0);
  const [fixList, setFixList] = useState<string[]>([]);
  const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);
  const [fact] = useState(() => randomFact());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await attemptsForProfile(profile.id);
        if (!alive) return;
        setAllAttempts(all);
        const days = new Set(all.map((a) => (a.created_at || "").slice(0, 10)).filter(Boolean));
        setStreak(currentStreak(days));

        const fixes: string[] = [];
        for (const s of quizSubjects) {
          const sk = await unresolvedSkills(profile.id, s, 1);
          if (sk.length) fixes.push(`${SUBJECTS[s].label}: ${sk[0]}`);
        }
        if (alive) setFixList(fixes);
      } catch {
        /* non-fatal: home still works */
      }
    })();
    return () => {
      alive = false;
    };
  }, [profile.id, quizSubjects]);

  const doneToday = useMemo(() => {
    const done = new Set<string>();
    for (const s of quizSubjects) {
      const n = attempts.filter((a) => a.subject === s).length;
      const threshold = s === "art" ? 1 : QUESTIONS_PER_SUBJECT;
      if (n >= threshold) done.add(s);
    }
    return done;
  }, [attempts, quizSubjects]);

  const allDone = quizSubjects.length > 0 && quizSubjects.every((s) => doneToday.has(s));

  // How much of today's learning is done, as a percentage — so the child can
  // spread it across the day instead of doing everything at once.
  const dailyTarget = quizSubjects.reduce((sum, s) => sum + (s === "art" ? 1 : QUESTIONS_PER_SUBJECT), 0);
  const dailyDone = quizSubjects.reduce((sum, s) => {
    const n = attempts.filter((a) => a.subject === s).length;
    const threshold = s === "art" ? 1 : QUESTIONS_PER_SUBJECT;
    return sum + Math.min(n, threshold);
  }, 0);
  const dailyPct = dailyTarget > 0 ? Math.round((dailyDone / dailyTarget) * 100) : 0;
  const dailyMsg =
    dailyPct >= 100
      ? "🎉 All done for today — brilliant! Come back tomorrow."
      : dailyPct >= 60
        ? "Great going! A little more whenever you like."
        : dailyPct > 0
          ? "Nice start! You can do more later today."
          : "Let's begin — you don't have to do it all at once.";

  function toggle(s: string) {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  const level = levelFromAttempts(allAttempts);
  const earnedBadges = computeBadges(allAttempts, level.level).filter((b) => b.earned);

  return (
    <div className="space-y-6">
      {/* Hero: level + progress */}
      <motion.div
        className="overflow-hidden rounded-3xl border-4 border-black/50 shadow-pixel"
        style={{ background: "linear-gradient(160deg, rgba(52,42,68,0.97), rgba(22,17,30,0.97))" }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-4 p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-gold/60 bg-gold/15 font-pixel text-3xl text-gold">
            {level.level}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-pixel text-sm text-grasstop sm:text-base">{level.title}</span>
              <span className="text-sm text-paper/50">Level {level.level}</span>
            </div>
            <div className="mt-2 h-4 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/40">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-grass to-emerald"
                initial={{ width: 0 }}
                animate={{ width: `${level.progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1.5 text-sm text-paper/70">{encouragement(level)}</p>
          </div>
        </div>
        {earnedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t-2 border-white/5 px-6 py-4">
            {earnedBadges.map((b) => (
              <span
                key={b.id}
                title={b.label}
                className="rounded-xl border-2 border-black/40 bg-black/25 px-3 py-1.5 text-sm text-paper/85"
              >
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Daily progress */}
      <div className="rounded-3xl border-4 border-black/50 p-6 shadow-pixel" style={{ background: "linear-gradient(160deg, rgba(42,52,40,0.6), rgba(22,17,30,0.95))" }}>
        <div className="flex items-end justify-between">
          <h2 className="font-pixel text-sm text-grasstop">Today&apos;s progress</h2>
          <span className="font-pixel text-2xl text-grasstop">{dailyPct}%</span>
        </div>
        <div className="mt-3 h-6 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/40">
          <motion.div
            className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-grass via-emerald to-diamond pr-2"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(dailyPct, 3)}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            {dailyPct >= 12 && <span className="text-xs">⭐</span>}
          </motion.div>
        </div>
        <p className="mt-2.5 text-base text-paper/75">{dailyMsg}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Day streak" value={`${streak}🔥`} emoji="📅" />
        <Metric label="Done today" value={`${doneToday.size}/${quizSubjects.length}`} emoji="✅" />
        <Metric label="Video time" value={`${bankedMinutes}m`} emoji="🎬" />
      </div>

      {fixList.length > 0 && (
        <Banner variant="dirt">Today we&apos;ll fix: {fixList.slice(0, 3).join("  •  ")}</Banner>
      )}

      {/* Two columns on wide screens: quests on the left, things to do on the right */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="mc-card-dark lg:col-span-3">
          <h2 className="mb-4 font-pixel text-sm text-grasstop">Pick your quests</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quizSubjects.map((s) => {
              const on = selected.includes(s);
              const done = doneToday.has(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  className={`flex items-center justify-between rounded-2xl border-4 px-4 py-4 text-left transition ${
                    on ? "border-grasstop bg-grass/20" : "border-black/40 bg-black/20"
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-base text-paper">
                    <span className="text-2xl">{SUBJECTS[s].emoji}</span>
                    {SUBJECTS[s].label}
                  </span>
                  {done && <span title="Done today" className="text-lg">⭐</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-black/30 bg-black/20 px-4 py-3">
            <span className="text-base text-paper/80">Questions in</span>
            <div className="flex gap-2">
              <button
                onClick={() => onLanguageChange("en")}
                className={`rounded-xl border-2 px-4 py-2 text-base transition ${
                  language === "en" ? "border-diamond bg-diamond/15 text-paper" : "border-black/40 bg-black/20 text-paper/60"
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => onLanguageChange("fr")}
                className={`rounded-xl border-2 px-4 py-2 text-base transition ${
                  language === "fr" ? "border-diamond bg-diamond/15 text-paper" : "border-black/40 bg-black/20 text-paper/60"
                }`}
              >
                🇫🇷 Français
              </button>
            </div>
          </div>

          <div className="mt-5">
            <PixelButton
              onClick={() => onStart(selected)}
              disabled={selected.length === 0}
              className="w-full py-4 text-sm"
            >
              {allDone ? "Practise again ⚒️" : "Start quest ⚒️"}
            </PixelButton>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <button
            onClick={onReward}
            disabled={bankedMinutes <= 0}
            className="flex flex-1 items-center gap-4 rounded-3xl border-4 border-black/50 p-5 text-left shadow-pixel disabled:opacity-50"
            style={{ background: "linear-gradient(160deg, rgba(79,214,214,0.16), rgba(22,17,30,0.96))" }}
          >
            <span className="text-4xl">🎬</span>
            <div>
              <div className="font-pixel text-sm text-diamond">Watch Minecraft</div>
              <div className="mt-1 text-sm text-paper/70">
                {bankedMinutes > 0 ? `${bankedMinutes} min earned` : "Answer questions to earn time"}
              </div>
            </div>
          </button>

          <button
            onClick={onLabs}
            className="flex flex-1 items-center gap-4 rounded-3xl border-4 border-black/50 p-5 text-left shadow-pixel"
            style={{ background: "linear-gradient(160deg, rgba(242,178,51,0.16), rgba(22,17,30,0.96))" }}
          >
            <span className="text-4xl">🧪</span>
            <div>
              <div className="font-pixel text-sm text-gold">Labs</div>
              <div className="mt-1 text-sm text-paper/70">Hands-on games &amp; experiments</div>
            </div>
          </button>

          <button
            onClick={onWorksheet}
            className="flex flex-1 items-center gap-4 rounded-3xl border-4 border-black/50 p-5 text-left shadow-pixel"
            style={{ background: "linear-gradient(160deg, rgba(123,192,67,0.16), rgba(22,17,30,0.96))" }}
          >
            <span className="text-4xl">📄</span>
            <div>
              <div className="font-pixel text-sm text-grasstop">Paper worksheet</div>
              <div className="mt-1 text-sm text-paper/70">Print it, do it, scan it back</div>
            </div>
          </button>
        </div>
      </div>

      <Fact>
        <span className="font-semibold text-gold">Did you know?</span> {fact}
      </Fact>
    </div>
  );
}
