"use client";

import { useRef, useState } from "react";
import type { ExternalResource } from "@/lib/labs/externalCatalog";

export default function ExternalPlayer({
  resource,
  onBack,
}: {
  resource: ExternalResource;
  onBack: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLIFrameElement>(null);
  const allow = resource.needsMic
    ? "microphone; autoplay; fullscreen; clipboard-write"
    : "autoplay; fullscreen; clipboard-write";

  function goFullscreen() {
    ref.current?.requestFullscreen?.();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onBack} className="shrink-0 text-sm text-paper/70">
          ← Back
        </button>
        <h2 className="truncate font-pixel text-xs text-grasstop">
          {resource.emoji} {resource.title}
        </h2>
        <div className="flex shrink-0 gap-2">
          <button onClick={goFullscreen} className="rounded-lg border-2 border-black/40 bg-black/20 px-3 py-1.5 text-xs text-paper">
            ⛶ Bigger
          </button>
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border-2 border-diamond/40 bg-diamond/10 px-3 py-1.5 text-xs text-diamond"
          >
            Open ↗
          </a>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border-4 border-black/50 bg-black/40"
        style={{ aspectRatio: "16 / 10", minHeight: 360 }}
      >
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center text-paper/60">Loading {resource.title}…</div>
        )}
        <iframe
          ref={ref}
          src={resource.embedUrl}
          title={resource.title}
          allow={allow}
          onLoad={() => setLoaded(true)}
          className="h-full w-full"
          style={{ border: 0 }}
        />
      </div>

      <p className="text-center text-[11px] text-paper/45">{resource.credit}</p>
      <p className="text-center text-[11px] text-paper/40">
        If it doesn&apos;t appear here, tap &ldquo;Open ↗&rdquo; to use it in a new tab.
      </p>
    </div>
  );
}
