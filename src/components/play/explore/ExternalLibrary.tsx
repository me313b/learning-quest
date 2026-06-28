"use client";

import { useState, type ReactNode } from "react";
import {
  EXTERNAL_CATEGORIES,
  EXTERNAL_RESOURCES,
  searchExternal,
  type ExternalCategoryId,
  type ExternalResource,
} from "@/lib/labs/externalCatalog";
import ExternalPlayer from "./ExternalPlayer";

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border-2 px-3 py-1.5 text-xs ${
        on ? "border-grasstop bg-grass/20 text-paper" : "border-black/40 bg-black/20 text-paper/70"
      }`}
    >
      {children}
    </button>
  );
}

export default function ExternalLibrary({
  onBack,
  initialCategory,
}: {
  onBack: () => void;
  initialCategory?: ExternalCategoryId;
}) {
  const [cat, setCat] = useState<ExternalCategoryId | "all">(initialCategory || "all");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<ExternalResource | null>(null);

  if (active) return <ExternalPlayer resource={active} onBack={() => setActive(null)} />;

  let list = q ? searchExternal(q) : EXTERNAL_RESOURCES;
  if (cat !== "all") list = list.filter((r) => r.category === cat);

  function open(r: ExternalResource) {
    if (r.embedUrl) setActive(r);
    else window.open(r.url, "_blank", "noopener,noreferrer");
  }

  const providers = Array.from(new Set(list.map((r) => r.provider)));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-paper/70">
          ← Back
        </button>
        <h2 className="font-pixel text-sm text-grasstop">🌍 Explore</h2>
        <span className="w-10" />
      </div>

      <p className="text-sm text-paper/70">
        Loads of free labs from around the web — music, maths, science, coding and reading. Some open right here, a few
        open in a new tab.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search labs…"
        className="mc-input w-full"
      />

      <div className="flex flex-wrap gap-2">
        <Chip on={cat === "all"} onClick={() => setCat("all")}>
          All
        </Chip>
        {EXTERNAL_CATEGORIES.map((c) => (
          <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>

      {providers.map((p) => (
        <div key={p} className="space-y-2">
          <h3 className="font-pixel text-[11px] text-paper/70">{p}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {list
              .filter((r) => r.provider === p)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => open(r)}
                  className="flex flex-col gap-1 rounded-2xl border-4 border-black/50 bg-black/20 p-3 text-left shadow-pixel"
                >
                  <span className="text-3xl">{r.emoji}</span>
                  <span className="font-pixel text-[10px] leading-tight text-paper">{r.title}</span>
                  <span className="text-[11px] leading-snug text-paper/55">{r.description}</span>
                  {!r.embedUrl && <span className="mt-0.5 text-[10px] text-gold2">opens in new tab ↗</span>}
                </button>
              ))}
          </div>
        </div>
      ))}

      {list.length === 0 && <p className="text-center text-paper/60">No labs found — try another word.</p>}
    </div>
  );
}
