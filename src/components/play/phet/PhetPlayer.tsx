"use client";

import { useEffect, useRef, useState } from "react";

// Embeds a PhET HTML5 simulation via its official simulation URL (the supported
// "Embed" method). Works on iPad and laptop. Shows a loading state, a fullscreen
// button, an "Open on PhET" fallback, and keeps PhET attribution visible.
export default function PhetPlayer({
  title,
  embedUrl,
  phetUrl,
}: {
  title: string;
  embedUrl: string;
  phetUrl: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    // If it hasn't loaded in a while, gently surface the "Open on PhET" option.
    const t = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(t);
  }, [embedUrl]);

  function goFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    const anyEl = el as HTMLDivElement & { webkitRequestFullscreen?: () => void };
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (anyEl.webkitRequestFullscreen) anyEl.webkitRequestFullscreen();
  }

  return (
    <div style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }} className="space-y-2 px-2 sm:px-4">
      <div className="mx-auto" style={{ maxWidth: 1800 }}>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-2xl border-4 border-black/50 bg-black shadow-pixel"
        style={{ height: "calc(100dvh - 165px)", minHeight: 380 }}
      >
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-paneldark/95 text-paper/70">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-diamond/30 border-t-diamond" />
            <p className="text-sm">Loading the simulation…</p>
            {slow && (
              <a
                href={phetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border-2 border-diamond/50 bg-diamond/10 px-3 py-1.5 text-xs text-diamond"
              >
                Taking a while — open on PhET ↗
              </a>
            )}
          </div>
        )}
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={title}
          onLoad={() => setLoaded(true)}
          className="h-full w-full"
          allow="fullscreen; autoplay"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-paper/45">
          Tip: tap <span className="text-diamond">Bigger</span> for a full-screen view.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={goFullscreen}
            className="rounded-lg border-2 border-diamond/50 bg-diamond/15 px-4 py-2 text-sm font-semibold text-diamond"
          >
            ⛶ Bigger (fullscreen)
          </button>
          <a
            href={phetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border-2 border-black/40 bg-black/25 px-3 py-2 text-xs text-paper/85"
          >
            Open on PhET ↗
          </a>
        </div>
      </div>
      <p className="text-center text-[10px] text-paper/40">
        {title} — a PhET simulation (University of Colorado Boulder).
      </p>
      </div>
    </div>
  );
}
