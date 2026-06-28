"use client";

import { useRef, useState } from "react";
import type { ExternalResource } from "@/lib/labs/externalCatalog";
import GeoGebraEmbed from "./GeoGebraEmbed";
import DesmosEmbed from "./DesmosEmbed";

export default function ExternalPlayer({
  resource,
  onBack,
}: {
  resource: ExternalResource;
  onBack: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const allow = resource.needsMic
    ? "microphone; autoplay; fullscreen; clipboard-write"
    : "autoplay; fullscreen; clipboard-write";

  function goFullscreen() {
    (boxRef.current || frameRef.current)?.requestFullscreen?.();
  }

  let body: React.ReactNode;
  if (resource.engine?.type === "geogebra") {
    body = <GeoGebraEmbed app={resource.engine.app} />;
  } else if (resource.engine?.type === "desmos") {
    body = <DesmosEmbed kind={resource.engine.app as "graphing" | "scientific" | "fourfunction"} />;
  } else if (resource.embedUrl) {
    body = (
      <>
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center text-paper/60">Loading {resource.title}…</div>
        )}
        <iframe
          ref={frameRef}
          src={resource.embedUrl}
          title={resource.title}
          allow={allow}
          onLoad={() => setLoaded(true)}
          className="h-full w-full"
          style={{ border: 0 }}
        />
      </>
    );
  }

  return (
    <div style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }} className="px-2 sm:px-4">
      <div className="mx-auto" style={{ maxWidth: 1800 }}>
        <div className="flex items-center justify-between gap-2 pb-2">
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
          ref={boxRef}
          className="relative overflow-hidden rounded-2xl border-4 border-black/50 bg-black/40"
          style={{ height: "calc(100dvh - 150px)", minHeight: 420 }}
        >
          {body}
        </div>

        <p className="pt-2 text-center text-[11px] text-paper/45">{resource.credit}</p>
      </div>
    </div>
  );
}
