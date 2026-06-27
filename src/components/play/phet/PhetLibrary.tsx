"use client";

import { useEffect, useMemo, useState } from "react";
import PhetCard from "./PhetCard";
import PhetGuided from "./PhetGuided";
import {
  CHILD_CATEGORIES,
  PHET_ATTRIBUTION,
  PHET_HOME,
  PHET_SIMS,
  difficultyOf,
  getSim,
  recommendedSims,
  recommendedToday,
  searchSims,
  simsByCategory,
  type ChildCategoryId,
  type PhetSimulation,
} from "@/lib/phet/catalog";

type Section = "recommended" | "all" | "favourites" | "recent" | ChildCategoryId;
type Level = "all" | "easy" | "medium" | "advanced";

const FAV_KEY = "lq_phet_favs";
const RECENT_KEY = "lq_phet_recent";

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function PhetLibrary({
  onBack,
  profileId,
}: {
  onBack: () => void;
  profileId: string;
}) {
  const [selected, setSelected] = useState<PhetSimulation | null>(null);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<Section>("recommended");
  const [level, setLevel] = useState<Level>("all");
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setFavs(readList(FAV_KEY));
    setRecent(readList(RECENT_KEY));
  }, []);

  function toggleFav(slug: string) {
    setFavs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function openSim(sim: PhetSimulation) {
    setRecent((prev) => {
      const next = [sim.slug, ...prev.filter((s) => s !== sim.slug)].slice(0, 12);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setSelected(sim);
  }

  const list = useMemo(() => {
    let base: PhetSimulation[];
    if (query.trim()) base = searchSims(query);
    else if (section === "recommended") base = recommendedSims();
    else if (section === "all") base = PHET_SIMS;
    else if (section === "favourites") base = favs.map(getSim).filter(Boolean) as PhetSimulation[];
    else if (section === "recent") base = recent.map(getSim).filter(Boolean) as PhetSimulation[];
    else base = simsByCategory(section);
    if (level !== "all") base = base.filter((s) => difficultyOf(s) === level);
    return base;
  }, [query, section, level, favs, recent]);

  const today = useMemo(() => recommendedToday(6), []);

  if (selected) {
    return <PhetGuided sim={selected} profileId={profileId} onBack={() => setSelected(null)} />;
  }

  const sectionPills: { id: Section; label: string }[] = [
    { id: "recommended", label: "⭐ Recommended" },
    { id: "favourites", label: "❤️ Favourites" },
    { id: "recent", label: "🕘 Recent" },
    { id: "all", label: "All sims" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="rounded-2xl border-4 border-black/50 p-5 shadow-pixel"
        style={{ background: "linear-gradient(160deg, rgba(79,214,214,0.16), rgba(20,16,28,0.97))" }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-pixel text-sm text-diamond">
            <span className="text-2xl">🔬</span> PhET Lab
          </h2>
          <button onClick={onBack} className="rounded-lg border-2 border-black/40 bg-black/30 px-3 py-1.5 text-[11px] text-paper/70">
            ⌂ Labs
          </button>
        </div>
        <p className="mt-1.5 text-sm text-paper/70">
          Real science &amp; maths simulations to explore. Pick one and have a go!
        </p>
      </div>

      {/* Search */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Search simulations… (e.g. gravity, fractions, circuits)"
        className="mc-input text-base"
      />

      {/* Section + level filters */}
      {!query.trim() && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {sectionPills.map((p) => (
              <button
                key={p.id}
                onClick={() => setSection(p.id)}
                className={`rounded-xl border-2 px-3 py-1.5 text-sm transition ${
                  section === p.id ? "border-diamond bg-diamond/15 text-paper" : "border-black/40 bg-black/20 text-paper/65"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {CHILD_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSection(c.id)}
                className="rounded-xl border-2 px-3 py-1.5 text-sm transition"
                style={
                  section === c.id
                    ? { borderColor: c.color, background: `${c.color}22`, color: "#F4ECD8" }
                    : { borderColor: "rgba(0,0,0,0.4)", background: "rgba(0,0,0,0.2)", color: "rgba(244,236,216,0.65)" }
                }
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-paper/50">Level:</span>
            {(["all", "easy", "medium", "advanced"] as Level[]).map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`rounded-lg border-2 px-3 py-1 text-xs capitalize transition ${
                  level === lv ? "border-grasstop bg-grass/15 text-paper" : "border-black/40 bg-black/20 text-paper/60"
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended-for-today strip on the landing view */}
      {!query.trim() && section === "recommended" && level === "all" && (
        <div className="space-y-2">
          <p className="font-pixel text-[10px] text-gold">🌟 Recommended for today</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {today.map((s) => (
              <PhetCard
                key={s.slug}
                sim={s}
                favourite={favs.includes(s.slug)}
                onToggleFav={() => toggleFav(s.slug)}
                onOpen={() => openSim(s)}
              />
            ))}
          </div>
          <p className="pt-1 font-pixel text-[10px] text-paper/45">All easy simulations</p>
        </div>
      )}

      {/* Results grid */}
      {list.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((s) => (
            <PhetCard
              key={s.slug}
              sim={s}
              favourite={favs.includes(s.slug)}
              onToggleFav={() => toggleFav(s.slug)}
              onOpen={() => openSim(s)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-paper/20 bg-black/15 p-6 text-center text-sm text-paper/55">
          {section === "favourites"
            ? "No favourites yet — tap the ☆ on a simulation to save it here."
            : section === "recent"
              ? "Nothing here yet — the simulations you open will show up here."
              : "No simulations match. Try another search or category."}
        </div>
      )}

      {/* Attribution */}
      <div className="rounded-xl border-2 border-black/30 bg-black/20 p-3 text-center">
        <p className="text-[11px] text-paper/50">{PHET_ATTRIBUTION}</p>
        <a
          href={PHET_HOME}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-diamond underline"
        >
          phet.colorado.edu ↗
        </a>
      </div>
    </div>
  );
}
