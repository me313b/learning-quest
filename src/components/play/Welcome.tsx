"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { attemptsForProfile } from "@/lib/data";
import { currentStreak, subjectBreakdown } from "@/lib/analytics";
import { levelFromAttempts } from "@/lib/levels";
import { AVATARS } from "@/lib/config";
import { prefetchSpeech, primeVoices, speakNaturalOnly, speakSmart } from "@/lib/speech";
import type { Attempt, Profile } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";

// The first thing the child sees. It greets them by name, reads a short, warm
// summary of how they've been doing, and gives one big "I'm ready" button so a
// 6-7 year old can get started entirely on their own. The summary is read aloud
// with the high-quality voice.

export default function Welcome({
  profile,
  onStart,
}: {
  profile: Profile;
  onStart: () => void;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [spoken, setSpoken] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    let cleanupGesture = () => {};
    primeVoices();
    (async () => {
      const name = profile.name || "explorer";
      let all: Attempt[] = [];
      try {
        all = await attemptsForProfile(profile.id);
      } catch {
        all = [];
      }
      if (!alive) return;

      let out: string[] = [];
      let say = "";

      if (all.length === 0) {
        out = ["Welcome to your learning world! 🌍", "Let's start your very first adventure."];
        say = `Bonjour ${name}! Welcome to your learning world. Let's start your very first adventure together. Are you ready?`;
      } else {
        const level = levelFromAttempts(all);
        const days = new Set(all.map((a) => (a.created_at || "").slice(0, 10)).filter(Boolean));
        const streak = currentStreak(days);
        const recent = all.slice(-10);
        const rc = recent.filter((a) => a.verdict === "correct").length;
        const acc = recent.length ? rc / recent.length : 1;

        // Look across every subject, not just one skill.
        const rows = subjectBreakdown(all).filter((r) => r.attempts >= 2);
        const sorted = [...rows].sort((a, b) => b.accuracy - a.accuracy);
        const strongSubs = sorted.slice(0, 2).map((r) => r.label);
        const weakSub = sorted.length > 1 ? sorted[sorted.length - 1].label : undefined;
        const join = (xs: string[]) =>
          xs.length <= 1 ? xs[0] || "" : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

        // Be honest. If last time was tricky, don't pretend it was fantastic —
        // acknowledge it kindly and set a positive goal for today.
        const struggled = recent.length >= 3 && acc < 0.5;

        out.push(`You're a ${level.title} — Level ${level.level}! 🏅`);
        if (streak > 1) out.push(`You've played ${streak} days in a row. 🔥`);

        if (struggled) {
          out.push(`Last time was a bit tricky — you got ${rc} out of ${recent.length}. That's okay! 💛`);
          out.push("Let's focus today and do even better. You've got this! 💪");
          if (weakSub) out.push(`We'll practise ${weakSub} together. ✨`);
        } else {
          out.push(`Last time you got ${rc} out of ${recent.length} right. 🎯`);
          if (strongSubs.length) out.push(`You're doing brilliantly in ${join(strongSubs)}. 💪`);
          if (weakSub && (!strongSubs.length || !strongSubs.includes(weakSub)))
            out.push(`Today let's give ${weakSub} a little extra practice. ✨`);
        }

        say = struggled
          ? `Bonjour ${name}! Last time was a bit tricky, and that's okay. ` +
            `Today let's focus and do even better. ` +
            (weakSub ? `We'll practise ${weakSub} together. ` : "") +
            `Are you ready?`
          : `Bonjour ${name}! You're a ${level.title}. ` +
            (streak > 1 ? `You've played ${streak} days in a row. ` : "") +
            `Last time you got ${rc} out of ${recent.length} right. ` +
            (strongSubs.length ? `You're doing really well in ${join(strongSubs)}. ` : "") +
            (weakSub && (!strongSubs.length || !strongSubs.includes(weakSub))
              ? `Today let's practise ${weakSub}. `
              : "") +
            `Are you ready to play?`;
      }

      setLines(out);
      setSpoken(say);
      setLoaded(true);

      // Read the greeting aloud with the NATURAL voice only. Warm the audio,
      // then try to play it. If the browser blocks autoplay (normal on iPad),
      // play it the moment the child first taps or presses a key, rather than
      // dropping to the robotic built-in voice.
      prefetchSpeech(say, "en-GB");
      const tryPlay = async () => {
        if (!alive) return;
        const ok = await speakNaturalOnly(say, "en-GB");
        if (ok || !alive) return;
        const once = () => {
          cleanupGesture();
          if (alive) speakNaturalOnly(say, "en-GB");
        };
        window.addEventListener("pointerdown", once);
        window.addEventListener("keydown", once);
        cleanupGesture = () => {
          window.removeEventListener("pointerdown", once);
          window.removeEventListener("keydown", once);
          cleanupGesture = () => {};
        };
      };
      setTimeout(tryPlay, 350);
    })();
    return () => {
      alive = false;
      cleanupGesture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
      <motion.div
        className="mc-card-dark text-center"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="text-6xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {AVATARS[profile.avatar] || "🧑"}
        </motion.div>
        <h1 className="mt-2 font-pixel text-base text-grasstop">Bonjour {profile.name}! 👋</h1>

        {!loaded ? (
          <p className="mt-4 animate-pulse text-paper/60">Getting your adventure ready…</p>
        ) : (
          <div className="mt-4 space-y-2 text-left">
            {lines.map((l, i) => (
              <motion.p
                key={i}
                className="text-lg leading-snug text-paper/90"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.12 }}
              >
                {l}
              </motion.p>
            ))}
          </div>
        )}

        <button
          onClick={() => speakSmart(spoken, "en-GB")}
          disabled={!loaded}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-black/40 bg-black/25 px-4 py-2 text-base text-paper/85 disabled:opacity-40"
        >
          🔊 Listen
        </button>
      </motion.div>

      <motion.div
        className="mt-6"
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelButton onClick={onStart} className="w-full py-5 text-base">
          I&apos;m ready! ▶
        </PixelButton>
      </motion.div>
    </main>
  );
}
