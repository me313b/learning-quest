"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { difficultyColour, difficultyLabel, MAX_DIFFICULTY } from "@/lib/config";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mc-card ${className}`}>{children}</div>;
}

export function DarkCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mc-card-dark ${className}`}>{children}</div>;
}

export function Banner({
  children,
  variant = "grass",
}: {
  children: ReactNode;
  variant?: "grass" | "dirt";
}) {
  return <div className={variant === "dirt" ? "mc-banner-dirt" : "mc-banner"}>{children}</div>;
}

export function Fact({ children }: { children: ReactNode }) {
  return <div className="mc-fact">{children}</div>;
}

/** A chunky XP-style progress bar. value/max are minutes or counts. */
export function XpBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-[11px] text-paper/70">
          <span>{label}</span>
          <span>
            {Math.round(value * 10) / 10} / {max}
          </span>
        </div>
      )}
      <div className="h-4 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "#80FF20" }}
        />
      </div>
    </div>
  );
}

export function DifficultyPips({ level }: { level: number }) {
  const lvl = Math.max(1, Math.min(MAX_DIFFICULTY, Math.round(level)));
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: MAX_DIFFICULTY }).map((_, i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-[3px] border border-black/40"
            style={{ backgroundColor: i < lvl ? difficultyColour(lvl) : "rgba(255,255,255,0.12)" }}
          />
        ))}
      </div>
      <span className="font-pixel text-[10px]" style={{ color: difficultyColour(lvl) }}>
        {difficultyLabel(lvl)}
      </span>
    </div>
  );
}

export function Hearts({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex gap-1 text-lg">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i}>{i < filled ? "❤️" : "🖤"}</span>
      ))}
    </div>
  );
}

export function PixelButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className={`mc-btn ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Metric({ label, value, emoji }: { label: string; value: ReactNode; emoji: string }) {
  return (
    <div className="rounded-2xl border-2 border-black/40 bg-black/25 px-3 py-5 text-center">
      <div className="text-3xl sm:text-4xl">{emoji}</div>
      <div className="mt-2 font-pixel text-base text-paper">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-paper/60">{label}</div>
    </div>
  );
}
