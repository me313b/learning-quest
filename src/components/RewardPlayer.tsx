"use client";

import { useEffect, useRef, useState } from "react";

// Plays the parent-approved Minecraft videos and enforces the earned time.
// Designed as a child-safe "kiosk": native YouTube controls are hidden and a
// transparent shield sits over the video so taps can never reach YouTube's
// title, share or "Watch on YouTube" links, or the end-screen suggestions.
// We provide our own big Play/Pause and Restart buttons, and a thumbnail strip
// (the playlist's own videos, or the curated list) the child taps to switch.
// The countdown only runs while a video is actually PLAYING, and when the bank
// hits zero the player stops and locks until tomorrow.

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; CUED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  destroy: () => void;
  loadVideoById: (id: string) => void;
  playVideoAt: (index: number) => void;
  getPlayerState: () => number;
  getPlaylist: () => string[] | null;
  getPlaylistIndex: () => number;
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export default function RewardPlayer({
  videoIds,
  playlistId,
  seconds,
  onTimeUp,
  onWatch,
  baseWatchedSeconds = 0,
}: {
  videoIds: string[];
  playlistId?: string;
  seconds: number;
  onTimeUp?: () => void;
  onWatch?: (totalWatchedSeconds: number) => void;
  baseWatchedSeconds?: number;
}) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxRef = useRef(0);
  const watchedRef = useRef(0); // seconds watched in THIS visit
  const lastPersistRef = useRef(0);
  const onWatchRef = useRef(onWatch);
  onWatchRef.current = onWatch;
  const baseRef = useRef(baseWatchedSeconds);
  baseRef.current = baseWatchedSeconds;
  const [remaining, setRemaining] = useState(Math.max(0, Math.round(seconds)));
  const [locked, setLocked] = useState(seconds <= 0);
  const [playing, setPlaying] = useState(false);
  const [clips, setClips] = useState<string[]>(playlistId ? [] : videoIds);
  const [current, setCurrent] = useState(0);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !holderRef.current || !window.YT) return;

      const common = {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 0, // hide native controls; we provide our own
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3, // hide annotations
        },
        events: {
          onReady: () => {
            const p = playerRef.current;
            if (p && playlistId) {
              const list = p.getPlaylist?.() || [];
              if (list && list.length) setClips(list);
            }
          },
          onStateChange: (e: { data: number }) => {
            const YT = window.YT!;
            setPlaying(e.data === YT.PlayerState.PLAYING);

            // Keep the thumbnail highlight in sync.
            const p = playerRef.current;
            if (p) {
              if (playlistId) {
                const i = p.getPlaylistIndex?.();
                if (typeof i === "number" && i >= 0) setCurrent(i);
                const list = p.getPlaylist?.();
                if (list && list.length && list.length !== clipsLenRef.current) setClips(list);
              } else {
                setCurrent(idxRef.current);
              }
            }

            // Advance through a curated list when one finishes (list mode only).
            if (e.data === YT.PlayerState.ENDED && !playlistId) {
              idxRef.current += 1;
              if (idxRef.current < videoIds.length) {
                playerRef.current?.loadVideoById(videoIds[idxRef.current]);
              }
            }
          },
        },
      };

      const opts: Record<string, unknown> = playlistId
        ? { ...common, playerVars: { ...common.playerVars, listType: "playlist", list: playlistId } }
        : { ...common, videoId: videoIds[0] };

      playerRef.current = new window.YT.Player(holderRef.current, opts);

      tickRef.current = setInterval(() => {
        const p = playerRef.current;
        const YT = window.YT;
        if (!p || !YT) return;
        let state = -1;
        try {
          state = p.getPlayerState();
        } catch {
          return;
        }
        if (state !== YT.PlayerState.PLAYING) return; // only burn time while watching

        // Track time actually watched and persist it now and then.
        watchedRef.current += 1;
        if (watchedRef.current - lastPersistRef.current >= 5) {
          lastPersistRef.current = watchedRef.current;
          onWatchRef.current?.(baseRef.current + watchedRef.current);
        }

        const next = remainingRef.current - 1;
        setRemaining(next);
        if (next <= 0) {
          try {
            p.stopVideo();
          } catch {
            /* ignore */
          }
          setLocked(true);
          setPlaying(false);
          if (tickRef.current) clearInterval(tickRef.current);
          onWatchRef.current?.(baseRef.current + watchedRef.current);
          onTimeUp?.();
        }
      }, 1000);
    });

    return () => {
      cancelled = true;
      if (tickRef.current) clearInterval(tickRef.current);
      // Persist whatever was watched this visit before tearing down.
      if (watchedRef.current > lastPersistRef.current) {
        onWatchRef.current?.(baseRef.current + watchedRef.current);
      }
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the clips length without retriggering the player effect.
  const clipsLenRef = useRef(clips.length);
  clipsLenRef.current = clips.length;

  function togglePlay() {
    const p = playerRef.current;
    const YT = window.YT;
    if (!p || !YT || locked) return;
    try {
      if (p.getPlayerState() === YT.PlayerState.PLAYING) p.pauseVideo();
      else p.playVideo();
    } catch {
      /* ignore */
    }
  }

  function restart() {
    const p = playerRef.current;
    if (!p || locked) return;
    try {
      if (playlistId) p.playVideoAt(current);
      else p.loadVideoById(clips[current] || videoIds[0]);
    } catch {
      /* ignore */
    }
  }

  function pick(i: number) {
    const p = playerRef.current;
    if (!p || locked) return;
    try {
      if (playlistId) {
        p.playVideoAt(i);
      } else {
        idxRef.current = i;
        p.loadVideoById(clips[i]);
      }
      setCurrent(i);
    } catch {
      /* ignore */
    }
  }

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel text-[11px] text-paper/80">Video time left</span>
        <span className={`font-pixel text-sm ${remaining <= 30 ? "text-redstone" : "text-diamond"}`}>
          {mm}:{ss}
        </span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border-4 border-black/50 bg-black">
        <div ref={holderRef} className="pointer-events-none h-full w-full" />

        {/* Transparent shield: intercepts every tap so YouTube chrome and the
            end-screen suggestions are never reachable. Tapping toggles play. */}
        {!locked && (
          <button
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-transparent"
          >
            {!playing && (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-3xl text-white">
                ▶
              </span>
            )}
          </button>
        )}

        {locked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
            <div className="mb-2 text-4xl">⛏️</div>
            <p className="font-pixel text-xs leading-relaxed text-grasstop">Time&apos;s up for today!</p>
            <p className="mt-2 text-sm text-paper/70">Come back tomorrow to earn more video time.</p>
          </div>
        )}
      </div>

      {/* Our own kid-friendly controls */}
      {!locked && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={togglePlay}
            className="rounded-xl border-4 border-black/40 bg-grass px-5 py-2 font-pixel text-[11px] text-white shadow-pixelsm active:translate-y-0.5"
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={restart}
            className="rounded-xl border-4 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[11px] text-paper/80"
          >
            ↻ Restart
          </button>
        </div>
      )}

      {/* Thumbnail strip: the playlist's own videos (or the curated list). */}
      {clips.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 font-pixel text-[10px] text-paper/60">Pick a video</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {clips.map((id, i) => (
              <button
                key={`${id}-${i}`}
                onClick={() => pick(i)}
                className={`relative shrink-0 overflow-hidden rounded-lg border-4 ${
                  i === current ? "border-diamond" : "border-black/40 opacity-75"
                }`}
                style={{ width: 116 }}
                title={`Video ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                  alt={`Video ${i + 1}`}
                  className="aspect-video w-full object-cover"
                />
                {i === current && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] text-diamond">
                    now
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
