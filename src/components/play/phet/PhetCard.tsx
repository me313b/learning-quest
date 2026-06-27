"use client";

import { useState } from "react";
import { CHILD_CATEGORIES, difficultyOf, type PhetSimulation } from "@/lib/phet/catalog";

const DIFF_LABEL: Record<"easy" | "medium" | "advanced", { text: string; color: string }> = {
  easy: { text: "Easy", color: "#17DD62" },
  medium: { text: "Medium", color: "#F8B617" },
  advanced: { text: "Advanced", color: "#E03C28" },
};

export default function PhetCard({
  sim,
  favourite,
  onToggleFav,
  onOpen,
}: {
  sim: PhetSimulation;
  favourite: boolean;
  onToggleFav: () => void;
  onOpen: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const cat = CHILD_CATEGORIES.find((c) => c.id === sim.category);
  const diff = DIFF_LABEL[difficultyOf(sim)];
  const tint = cat?.color || "#4AEDD9";

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border-4 border-black/50 shadow-pixel"
      style={{ background: "linear-gradient(160deg, rgba(46,38,58,0.96), rgba(20,16,28,0.97))" }}
    >
      {/* Favourite toggle */}
      <button
        onClick={onToggleFav}
        aria-label={favourite ? "Remove favourite" : "Add favourite"}
        title={favourite ? "Remove favourite" : "Add favourite"}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg border-2 border-black/40 bg-black/40 text-base backdrop-blur"
      >
        {favourite ? "⭐" : "☆"}
      </button>

      <button onClick={onOpen} className="flex flex-1 flex-col text-left">
        {/* Thumbnail (or a coloured fallback tile) */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/40">
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sim.thumbnailUrl}
              alt={sim.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-5xl"
              style={{ background: `${tint}22` }}
            >
              {cat?.emoji || "🔬"}
            </div>
          )}
          <span
            className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: `${diff.color}cc` }}
          >
            {diff.text}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{cat?.emoji}</span>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: tint }}>
              {cat?.label}
            </span>
          </div>
          <h4 className="text-base font-bold leading-tight text-paper">{sim.title}</h4>
          <p className="line-clamp-2 text-xs leading-snug text-paper/60">{sim.description}</p>
        </div>
      </button>

      <button
        onClick={onOpen}
        className="m-3 mt-0 rounded-xl border-2 px-3 py-2 text-center font-pixel text-[11px] text-white"
        style={{ borderColor: `${tint}77`, background: `${tint}22` }}
      >
        ▶ Start
      </button>
    </div>
  );
}
