"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import PhetPlayer from "./PhetPlayer";
import { guidedFor } from "@/lib/phet/guided";
import type { PhetSimulation } from "@/lib/phet/catalog";
import { grantBonusMinutes, recordPhetActivity } from "@/lib/data";
import { chime, speakSmart } from "@/lib/speech";
import { PixelButton } from "@/components/ui/primitives";

type Step = "intro" | "explore" | "reflect" | "done";

export default function PhetGuided({
  sim,
  profileId,
  onBack,
}: {
  sim: PhetSimulation;
  profileId: string;
  onBack: () => void;
}) {
  const activity = guidedFor(sim);
  const [step, setStep] = useState<Step>("intro");
  const [prediction, setPrediction] = useState("");
  const [reflection, setReflection] = useState("");
  const rewarded = useRef(false);
  const openedLogged = useRef(false);

  // Log that the child opened this simulation (best-effort).
  useEffect(() => {
    if (step === "explore" && !openedLogged.current) {
      openedLogged.current = true;
      recordPhetActivity({
        profileId,
        simSlug: sim.slug,
        subject: sim.subject,
        topics: sim.topics,
        predictionAnswer: prediction,
        completed: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function finish() {
    if (!rewarded.current) {
      rewarded.current = true;
      chime("correct");
      recordPhetActivity({
        profileId,
        simSlug: sim.slug,
        subject: sim.subject,
        topics: sim.topics,
        predictionAnswer: prediction,
        reflectionAnswer: reflection,
        completed: true,
      });
      const mins = Math.max(1, Math.round(activity.rewardSeconds / 60));
      grantBonusMinutes(profileId, mins).catch(() => {});
    }
    setStep("done");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← All simulations
        </button>
        <span className="rounded-lg border-2 border-black/30 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-wide text-paper/55">
          {sim.title}
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {(["intro", "explore", "reflect", "done"] as Step[]).map((s, i) => {
          const order = ["intro", "explore", "reflect", "done"];
          const active = order.indexOf(step) >= i;
          return (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${active ? "bg-grasstop" : "bg-paper/15"}`}
            />
          );
        })}
      </div>

      {step === "intro" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-2xl mc-card-dark space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-bold text-gold">{sim.title}</h3>
            <button
              onClick={() => speakSmart(`${activity.intro} ${activity.predictionQuestion}`, "en-GB")}
              aria-label="Hear it"
              className="shrink-0 rounded-lg border-2 border-black/40 bg-black/20 px-2.5 py-1.5 text-base"
            >
              🔊
            </button>
          </div>
          <p className="text-base text-paper/85">{activity.intro}</p>
          <div className="rounded-xl border-2 border-diamond/40 bg-diamond/10 p-3">
            <p className="font-pixel text-[11px] text-diamond">🔮 Before you start</p>
            <p className="mt-2 text-base text-paper/90">{activity.predictionQuestion}</p>
            <textarea
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              rows={2}
              placeholder="Type what you think will happen… (optional)"
              className="mc-input mt-2 text-base"
            />
          </div>
          <PixelButton onClick={() => setStep("explore")} className="w-full py-4 text-sm">
            Start exploring →
          </PixelButton>
        </motion.div>
      )}

      {step === "explore" && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-gold/40 bg-gold/10 p-3">
            <p className="font-pixel text-[11px] text-gold">🛠️ Your challenge</p>
            <p className="mt-1.5 text-base text-paper/90">{activity.challenge}</p>
          </div>
          <PhetPlayer title={sim.title} embedUrl={sim.embedUrl} phetUrl={sim.phetUrl} />
          <PixelButton onClick={() => setStep("reflect")} className="w-full py-4 text-sm">
            I tried it! →
          </PixelButton>
        </div>
      )}

      {step === "reflect" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-2xl mc-card-dark space-y-4">
          <div className="rounded-xl border-2 border-grasstop/40 bg-grass/10 p-3">
            <p className="font-pixel text-[11px] text-grasstop">🤔 Think about it</p>
            <p className="mt-2 text-base text-paper/90">{activity.reflectionQuestion}</p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={2}
              placeholder="Type what you noticed… (optional)"
              className="mc-input mt-2 text-base"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("explore")}
              className="rounded-xl border-2 border-black/40 bg-black/25 px-4 py-3 text-sm text-paper/80"
            >
              ← Back to sim
            </button>
            <PixelButton onClick={finish} className="flex-1 py-4 text-sm">
              Show me why →
            </PixelButton>
          </div>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto w-full max-w-2xl mc-card-dark space-y-4">
          <div className="text-center">
            <div className="text-5xl">🎉</div>
            <p className="mt-2 font-pixel text-sm text-grasstop">Great exploring!</p>
          </div>
          <div className="flex items-start justify-between gap-2 rounded-xl border-l-8 border-gold bg-black/30 px-4 py-3">
            <p className="text-base text-paper/90">
              <span className="font-semibold text-gold">Why: </span>
              {activity.explanation}
            </p>
            <button
              onClick={() => speakSmart(activity.explanation, "en-GB")}
              aria-label="Hear it"
              className="shrink-0 rounded-lg border-2 border-black/40 bg-black/20 px-2.5 py-1.5 text-base"
            >
              🔊
            </button>
          </div>
          <p className="text-center text-sm text-emerald">+{Math.max(1, Math.round(activity.rewardSeconds / 60))} min video time earned 🎬</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPrediction("");
                setReflection("");
                rewarded.current = false;
                openedLogged.current = false;
                setStep("explore");
              }}
              className="rounded-xl border-2 border-black/40 bg-black/25 px-4 py-3 text-sm text-paper/80"
            >
              Play again
            </button>
            <PixelButton onClick={onBack} className="flex-1 py-4 text-sm">
              Explore another →
            </PixelButton>
          </div>
        </motion.div>
      )}

      <p className="text-center text-[10px] text-paper/35">
        {sim.attribution}
      </p>
    </div>
  );
}
