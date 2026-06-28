"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getKidSettings, getProfile, getRewardSettings, getTodaySession, recentSessions, todayAttempts, todayStr } from "@/lib/data";
import {
  earnedSecondsFromAttempts,
  lifetimeAvailableSeconds,
} from "@/lib/rewards";
import { AVATARS, CORE_SUBJECTS } from "@/lib/config";
import { installAudioUnlock, isMusicOn, startMusic, stopMusic, toggleMusic } from "@/lib/music";
import { prefetchSections } from "@/lib/prefetch";
import { setVoicePref } from "@/lib/speech";
import type { Attempt, Profile, Session } from "@/lib/types";
import Home from "./Home";
import Quiz from "./Quiz";
import Reward from "./Reward";
import Labs from "./Labs";
import Welcome from "./Welcome";
import Worksheet from "./Worksheet";
import DailyReview from "./DailyReview";

type View = "welcome" | "home" | "quiz" | "reward" | "labs" | "worksheet" | "review";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center text-paper/70">
      <div>{children}</div>
    </main>
  );
}

export default function GameShell({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [view, setView] = useState<View>("welcome");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [musicOn, setMusicOn] = useState(true);
  const [rewardCfg, setRewardCfg] = useState({ dailyCap: 30, perCorrect: 1 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProfile(profileId);
      setProfile(p);
      setAttempts(await todayAttempts(profileId));
      try {
        setSession(await getTodaySession(profileId));
      } catch {
        setSession(null);
      }
      try {
        setSessions(await recentSessions(profileId, 120));
      } catch {
        setSessions([]);
      }
      try {
        setRewardCfg(await getRewardSettings());
      } catch {
        /* defaults */
      }
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    load();
    // Apply the parent's chosen voice to all spoken audio.
    getKidSettings()
      .then((k) => setVoicePref(k.voice))
      .catch(() => {});
  }, [load]);

  // Soft background music plays on the home screen and stops inside activities.
  useEffect(() => {
    installAudioUnlock();
    setMusicOn(isMusicOn());
    if (view === "home") {
      startMusic();
      prefetchSections(); // warm audio + a reading story in the background
    } else stopMusic();
  }, [view]);

  useEffect(() => {
    return () => stopMusic();
  }, []);

  if (loading) return <Centered>Loading your world…</Centered>;
  if (!profile) {
    return (
      <Centered>
        <p className="mb-3">Couldn&apos;t find that explorer.</p>
        <button onClick={() => router.push("/")} className="mc-btn">
          Back
        </button>
      </Centered>
    );
  }

  if (view === "welcome") {
    return <Welcome profile={profile} onStart={() => setView("home")} />;
  }

  const cfg = { perCorrectMin: rewardCfg.perCorrect, capMin: rewardCfg.dailyCap };
  const earnedSec = earnedSecondsFromAttempts(attempts, cfg);
  const watchedSec = Math.round((session?.minutes_used || 0) * 60);
  // Running balance across all days, so earned-but-unwatched minutes carry over
  // instead of resetting each morning. Make sure today's row is included.
  const allSessions = session ? [session, ...sessions.filter((s) => s.id !== session.id)] : sessions;
  const availableSec = Math.round(
    lifetimeAvailableSeconds(allSessions, todayStr(), earnedSec, { capMin: rewardCfg.dailyCap }),
  );
  const availableMin = Math.round((availableSec / 60) * 10) / 10;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 rounded-2xl border-2 border-black/30 bg-black/20 px-3 py-2"
          title="Switch player"
        >
          <span className="text-3xl sm:text-4xl">{AVATARS[profile.avatar] || "🧑"}</span>
          <span className="font-pixel text-sm text-paper">{profile.name}</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMusicOn(toggleMusic())}
            title={musicOn ? "Music on" : "Music off"}
            aria-label="Toggle music"
            className="rounded-xl border-2 border-black/40 bg-black/30 px-3 py-2 text-lg"
          >
            {musicOn ? "🎵" : "🔇"}
          </button>
          <span className="flex items-center gap-1.5 rounded-xl border-2 border-diamond/40 bg-diamond/10 px-3 py-2 font-pixel text-xs text-diamond">
            🎬 {availableMin}m
          </span>
          {view !== "home" && (
            <button
              onClick={() => setView("home")}
              className="rounded-xl border-2 border-black/40 bg-black/30 px-3 py-2 font-pixel text-[11px] text-paper/80"
            >
              ⌂ Home
            </button>
          )}
        </div>
      </header>

      {view === "home" && (
        <Home
          profile={profile}
          attempts={attempts}
          bankedMinutes={availableMin}
          language={language}
          onLanguageChange={setLanguage}
          onStart={(subs) => {
            setSubjects(subs);
            setView("quiz");
          }}
          onReward={() => setView("reward")}
          onLabs={() => setView("labs")}
          onWorksheet={() => setView("worksheet")}
          onReview={() => setView("review")}
        />
      )}

      {view === "quiz" && (
        <Quiz
          profile={profile}
          subjects={subjects}
          language={language}
          onDone={async () => {
            await load();
            setView("home");
          }}
          onExit={async () => {
            await load();
            setView("home");
          }}
        />
      )}

      {view === "reward" && (
        <Reward
          bankedSeconds={availableSec}
          sessionId={session?.id ?? null}
          baseWatchedSeconds={watchedSec}
          onBack={async () => {
            await load();
            setView("home");
          }}
        />
      )}

      {view === "labs" && <Labs onBack={() => setView("home")} profileId={profile.id} />}

      {view === "review" && (
        <DailyReview
          profileId={profile.id}
          subjects={[...CORE_SUBJECTS, ...(profile.enabled_subjects || [])]}
          childName={profile.name}
          onBack={() => setView("home")}
        />
      )}

      {view === "worksheet" && (
        <Worksheet
          profile={profile}
          onBack={() => setView("home")}
          onDone={async () => {
            await load();
            setView("home");
          }}
        />
      )}
    </main>
  );
}
