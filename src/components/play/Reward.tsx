"use client";

import { useEffect, useMemo, useState } from "react";
import { getMediaSettings, updateSession } from "@/lib/data";
import { Banner, Fact, PixelButton } from "@/components/ui/primitives";
import { randomTip } from "@/lib/content";
import RewardPlayer from "@/components/RewardPlayer";

// Pull a YouTube video id out of the many URL shapes a parent might paste:
// watch?v=, youtu.be/, /embed/, /shorts/, or a bare 11-char id.
function youTubeId(raw: string): string | null {
  const url = (raw || "").trim();
  if (!url) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1, 12);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {
    /* not a parseable URL */
  }
  const m = url.match(/[A-Za-z0-9_-]{11}/);
  return m ? m[0] : null;
}

interface VideoItem {
  id: string;
  url: string;
}

export default function Reward({
  bankedSeconds,
  sessionId,
  baseWatchedSeconds = 0,
  onBack,
}: {
  bankedSeconds: number;
  sessionId?: string | null;
  baseWatchedSeconds?: number;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playlistId, setPlaylistId] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [watching, setWatching] = useState(false);
  const [tip] = useState(() => randomTip());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await getMediaSettings();
        if (!alive) return;
        const items: VideoItem[] = [];
        const seen = new Set<string>();
        for (const u of m.videoUrls) {
          const id = youTubeId(u);
          if (id && !seen.has(id)) {
            seen.add(id);
            items.push({ id, url: u });
          }
        }
        setVideos(items);
        setPlaylistId(m.playlistId || "");
        setChosen(new Set(items.map((i) => i.id))); // default: all selected
      } catch {
        /* leave empty; the no-media notice will show */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const minutes = Math.floor(bankedSeconds / 60);
  const secs = String(bankedSeconds % 60).padStart(2, "0");

  const chosenIds = useMemo(
    () => videos.filter((v) => chosen.has(v.id)).map((v) => v.id),
    [videos, chosen],
  );

  const canWatch = bankedSeconds > 0 && (chosenIds.length > 0 || Boolean(playlistId));

  function toggle(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return <div className="mc-card-dark text-center text-paper/70">Loading the cinema…</div>;
  }

  // Actively watching: hand over to the player, which enforces the timer.
  if (watching) {
    return (
      <div className="space-y-4">
        <RewardPlayer
          videoIds={chosenIds}
          playlistId={chosenIds.length === 0 ? playlistId : undefined}
          seconds={bankedSeconds}
          baseWatchedSeconds={baseWatchedSeconds}
          onWatch={(total) => {
            if (sessionId) {
              updateSession(sessionId, {
                minutes_used: Math.round((total / 60) * 100) / 100,
              }).catch(() => {});
            }
          }}
        />
        <div className="flex justify-center">
          <button
            onClick={() => setWatching(false)}
            className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[10px] text-paper/80"
          >
            ⌂ Stop & go back
          </button>
        </div>
        <Fact>
          <span className="font-semibold text-gold">Tip:</span> {tip}
        </Fact>
      </div>
    );
  }

  const noMedia = videos.length === 0 && !playlistId;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div
        className="rounded-3xl border-4 border-black/50 p-8 text-center shadow-pixel"
        style={{ background: "linear-gradient(160deg, rgba(79,214,214,0.18), rgba(22,17,30,0.96))" }}
      >
        <div className="text-6xl">🎬</div>
        <h2 className="mt-2 font-pixel text-base text-diamond">Minecraft cinema</h2>
        <p className="mt-3 text-lg text-paper/85">
          You&apos;ve earned{" "}
          <span className="font-pixel text-2xl text-gold">
            {minutes}:{secs}
          </span>{" "}
          of video time today.
        </p>
      </div>

      {bankedSeconds <= 0 && (
        <Banner variant="dirt">
          No video time yet — answer some quest questions to earn minutes!
        </Banner>
      )}

      {noMedia ? (
        <div className="mc-card text-center">
          <p className="text-base text-paper/80">
            No videos have been added yet. A grown-up can add safe Minecraft videos in the
            <span className="font-semibold text-grasstop"> Parent area → Settings</span>.
          </p>
        </div>
      ) : (
        <div className="mc-card-dark">
          {videos.length > 0 ? (
            <>
              <h3 className="mb-3 font-pixel text-sm text-grasstop">Choose what to watch</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {videos.map((v) => {
                  const on = chosen.has(v.id);
                  return (
                    <button
                      key={v.id}
                      onClick={() => toggle(v.id)}
                      className={`overflow-hidden rounded-2xl border-4 text-left transition ${
                        on ? "border-grasstop" : "border-black/40 opacity-60"
                      }`}
                    >
                      <div className="relative aspect-video w-full bg-black">
                        {/* plain img: YouTube thumbnails, no next/image domain config */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                          alt="Video thumbnail"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute right-1 top-1 text-lg">
                          {on ? "✅" : "⬜"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-paper/80">
              A playlist is set up. Press play to start watching.
            </p>
          )}

          <div className="mt-5">
            <PixelButton
              onClick={() => setWatching(true)}
              disabled={!canWatch}
              className="w-full py-4 text-sm"
            >
              ▶ Start watching
            </PixelButton>
            {videos.length > 0 && chosenIds.length === 0 && playlistId && (
              <p className="mt-2 text-center text-[11px] text-paper/60">
                Nothing ticked — your playlist will play instead.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[10px] text-paper/80"
        >
          ⌂ Back home
        </button>
      </div>
    </div>
  );
}
