"use client";

import { useEffect, useState } from "react";
import { getDictationConfig, listProfiles, updateProfile } from "@/lib/data";
import { SUBJECTS } from "@/lib/config";
import { MUSIC_TRACKS, getMusicTrack, setMusicTrack, type MusicTrack } from "@/lib/music";
import type { Profile, Provider, SafeSettings } from "@/lib/types";

const VOICE_OPTIONS = [
  { id: "coral", label: "Coral — friendly (default)" },
  { id: "sage", label: "Sage — calm" },
  { id: "nova", label: "Nova — bright" },
  { id: "shimmer", label: "Shimmer — gentle" },
  { id: "fable", label: "Fable — playful" },
  { id: "alloy", label: "Alloy — neutral" },
  { id: "onyx", label: "Onyx — deep voice" },
  { id: "echo", label: "Echo — warm voice" },
  { id: "ash", label: "Ash — soft voice" },
];
import { PixelButton } from "@/components/ui/primitives";

const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (ChatGPT)",
};
const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
};

// Non-core subjects a parent can switch on per child. Physics shows up as the
// interactive Lab rather than in the daily quiz.
const EXTRA_SUBJECTS = Object.entries(SUBJECTS)
  .filter(([, v]) => !v.core)
  .map(([k]) => k);

function extractPlaylistId(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const list = u.searchParams.get("list");
    if (list) return list;
  } catch {
    /* not a URL — treat as a bare id */
  }
  return s;
}

function Note({ kind, children }: { kind: "ok" | "err"; children: React.ReactNode }) {
  return (
    <p className={`text-xs ${kind === "ok" ? "text-emerald" : "text-redstone"}`}>{children}</p>
  );
}

export default function Settings({
  settings,
  onSaved,
}: {
  settings: SafeSettings | null;
  onSaved: () => Promise<SafeSettings | null>;
}) {
  const [provider, setProvider] = useState<Provider>(settings?.provider || "anthropic");
  const [model, setModel] = useState(settings?.model || "");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(Boolean(settings?.hasKey));
  const [aiMsg, setAiMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [savingAi, setSavingAi] = useState(false);

  const [videosText, setVideosText] = useState((settings?.videoUrls || []).join("\n"));
  const [playlist, setPlaylist] = useState(settings?.playlistId || "");
  const [videoMsg, setVideoMsg] = useState("");
  const [savingVideos, setSavingVideos] = useState(false);

  const [dailyCap, setDailyCap] = useState(String(settings?.rewardDailyCap ?? 30));
  const [perCorrect, setPerCorrect] = useState(String(settings?.rewardPerCorrect ?? 1));
  const [rewardMsg, setRewardMsg] = useState("");
  const [savingReward, setSavingReward] = useState(false);

  const [qSeconds, setQSeconds] = useState(String(settings?.questionSeconds ?? 60));
  const [noTimer, setNoTimer] = useState((settings?.questionSeconds ?? 60) === 0);
  const [overtime, setOvertime] = useState(settings?.allowOvertime ?? true);
  const [voice, setVoice] = useState(settings?.voice || "coral");
  const [funMode, setFunMode] = useState(settings?.funMode ?? true);
  const [controlsMsg, setControlsMsg] = useState("");
  const [savingControls, setSavingControls] = useState(false);

  const [spellWords, setSpellWords] = useState("");
  const [dictLength, setDictLength] = useState<"short" | "medium" | "long">("short");
  const [dictDiff, setDictDiff] = useState<"easy" | "medium" | "hard">("easy");
  const [dictPause, setDictPause] = useState("4");
  const [dictConfirm, setDictConfirm] = useState(false);
  const [dictMsg, setDictMsg] = useState("");
  const [savingDict, setSavingDict] = useState(false);

  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinMsg, setPinMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [savingPin, setSavingPin] = useState(false);
  const pinSet = Boolean(settings?.pinSet);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subjChildId, setSubjChildId] = useState("");
  const [enabled, setEnabled] = useState<string[]>([]);
  const [subjMsg, setSubjMsg] = useState("");
  const [savingSubj, setSavingSubj] = useState(false);

  const [track, setTrack] = useState<MusicTrack>("calm");

  useEffect(() => {
    setTrack(getMusicTrack());
  }, []);

  useEffect(() => {
    (async () => {
      const list = await listProfiles();
      setProfiles(list);
      if (list.length) {
        setSubjChildId(list[0].id);
        setEnabled(list[0].enabled_subjects || []);
      }
    })();
  }, []);

  function onPickChild(id: string) {
    setSubjChildId(id);
    const p = profiles.find((x) => x.id === id);
    setEnabled(p?.enabled_subjects || []);
    setSubjMsg("");
  }

  function toggleSubject(s: string) {
    setEnabled((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function saveAi() {
    setSavingAi(true);
    setAiMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model: model.trim(),
          key: apiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiMsg({ kind: "err", text: data.error || "Couldn't save." });
      } else {
        if (apiKey.trim()) setHasKey(true);
        setApiKey("");
        setAiMsg({ kind: "ok", text: "Saved." });
        await onSaved();
      }
    } catch {
      setAiMsg({ kind: "err", text: "Couldn't save. Try again." });
    } finally {
      setSavingAi(false);
    }
  }

  async function testKey() {
    setTesting(true);
    setAiMsg(null);
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model: model.trim() || undefined,
          key: apiKey.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setAiMsg({ kind: data.ok ? "ok" : "err", text: data.message });
    } catch {
      setAiMsg({ kind: "err", text: "Couldn't reach the server." });
    } finally {
      setTesting(false);
    }
  }

  async function clearKey() {
    setSavingAi(true);
    setAiMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearKey: true }),
      });
      if (res.ok) {
        setHasKey(false);
        setApiKey("");
        setAiMsg({ kind: "ok", text: "Key removed." });
        await onSaved();
      }
    } finally {
      setSavingAi(false);
    }
  }

  async function saveVideos() {
    setSavingVideos(true);
    setVideoMsg("");
    try {
      const lines = videosText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const pid = extractPlaylistId(playlist);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrls: lines, playlistId: pid }),
      });
      if (res.ok) {
        setVideoMsg(`Saved ${lines.length} video link(s)${pid ? " and a playlist" : ""}.`);
        await onSaved();
      } else {
        setVideoMsg("Couldn't save videos.");
      }
    } finally {
      setSavingVideos(false);
    }
  }

  async function saveRewards() {
    setSavingReward(true);
    setRewardMsg("");
    try {
      const cap = Math.max(0, Math.min(600, Number(dailyCap) || 0));
      const per = Math.max(0, Math.min(60, Number(perCorrect) || 0));
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardDailyCap: cap, rewardPerCorrect: per }),
      });
      if (res.ok) {
        setRewardMsg("Saved.");
        await onSaved();
      } else {
        setRewardMsg("Couldn't save.");
      }
    } catch {
      setRewardMsg("Couldn't save.");
    } finally {
      setSavingReward(false);
    }
  }

  async function saveControls() {
    setSavingControls(true);
    setControlsMsg("");
    try {
      const secs = noTimer ? 0 : Math.max(5, Math.min(600, parseInt(qSeconds, 10) || 60));
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionSeconds: secs, allowOvertime: overtime, voice, funMode }),
      });
      if (res.ok) {
        setControlsMsg("Saved.");
        await onSaved();
      } else {
        setControlsMsg("Couldn't save.");
      }
    } catch {
      setControlsMsg("Couldn't save.");
    } finally {
      setSavingControls(false);
    }
  }

  // Load the saved weekly dictation settings when the panel opens.
  useEffect(() => {
    getDictationConfig()
      .then((c) => {
        setSpellWords((c.words || []).join(", "));
        setDictLength(c.length);
        setDictDiff(c.difficulty);
        setDictPause(String(c.pause));
        setDictConfirm(c.confirm);
      })
      .catch(() => {});
  }, []);

  async function saveDictation() {
    setSavingDict(true);
    setDictMsg("");
    try {
      const words = spellWords
        .split(/[,\n]/)
        .map((w) => w.trim())
        .filter(Boolean);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          spellingWords: words,
          dictationLength: dictLength,
          dictationDifficulty: dictDiff,
          dictationPause: Math.max(1, Math.min(30, parseInt(dictPause, 10) || 4)),
          dictationConfirm: dictConfirm,
        }),
      });
      if (res.ok) {
        setDictMsg(`Saved ${words.length} word(s).`);
        await onSaved();
      } else {
        setDictMsg("Couldn't save.");
      }
    } catch {
      setDictMsg("Couldn't save.");
    } finally {
      setSavingDict(false);
    }
  }

  async function savePin() {
    setPinMsg(null);
    if (pin !== pin2) {
      setPinMsg({ kind: "err", text: "The two PINs don't match." });
      return;
    }
    if (pin && !(/^\d+$/.test(pin) && pin.length >= 3 && pin.length <= 8)) {
      setPinMsg({ kind: "err", text: "Use 3 to 8 digits." });
      return;
    }
    setSavingPin(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setPin("");
        setPin2("");
        setPinMsg({ kind: "ok", text: pin ? "PIN updated." : "PIN cleared." });
        await onSaved();
      } else {
        setPinMsg({ kind: "err", text: "Couldn't save the PIN." });
      }
    } finally {
      setSavingPin(false);
    }
  }

  async function saveSubjects() {
    if (!subjChildId) return;
    setSavingSubj(true);
    setSubjMsg("");
    try {
      await updateProfile(subjChildId, { enabled_subjects: enabled });
      setProfiles((prev) =>
        prev.map((p) => (p.id === subjChildId ? { ...p, enabled_subjects: enabled } : p)),
      );
      setSubjMsg("Saved.");
    } catch {
      setSubjMsg("Couldn't save.");
    } finally {
      setSavingSubj(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* AI provider + key ---------------------------------------------------*/}
      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">🤖 AI brain</h3>
        <p className="text-xs text-paper/60">
          Powers the questions, the marking and the progress notes. Your key is encrypted and only
          ever used on the server — it is never sent back to this screen or shared between families.
        </p>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProvider(p);
                if (!model.trim()) setModel("");
              }}
              className={`rounded-xl border-4 px-3 py-2 text-sm transition ${
                provider === p
                  ? "border-grasstop bg-grass/25 text-paper"
                  : "border-black/40 bg-black/20 text-paper/60"
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>

        {hasKey && (
          <Note kind="ok">A key is connected. Leave the box blank to keep it.</Note>
        )}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasKey ? "Paste a new key to replace it" : "Paste your API key"}
          className="mc-input"
        />
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={`Model (optional) — default ${DEFAULT_MODEL[provider]}`}
          className="mc-input"
        />

        {aiMsg && <Note kind={aiMsg.kind}>{aiMsg.text}</Note>}

        <div className="flex flex-wrap gap-2">
          <PixelButton onClick={saveAi} disabled={savingAi}>
            {savingAi ? "Saving…" : "💾 Save AI settings"}
          </PixelButton>
          <button
            onClick={testKey}
            disabled={testing}
            className="rounded-xl border-4 border-black/40 bg-black/30 px-4 py-3 font-pixel text-xs text-paper/80 disabled:opacity-50"
          >
            {testing ? "Checking…" : "🔌 Test connection"}
          </button>
          {hasKey && (
            <button
              onClick={clearKey}
              disabled={savingAi}
              className="rounded-xl border-4 border-black/40 bg-black/30 px-4 py-3 font-pixel text-xs text-redstone disabled:opacity-50"
            >
              Remove key
            </button>
          )}
        </div>
      </div>

      {/* Videos --------------------------------------------------------------*/}
      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">🎬 Minecraft videos</h3>
        <p className="text-xs text-paper/60">
          The videos your child may watch as rewards. Paste one YouTube link per line, and/or a
          single playlist link. Channels can&apos;t be pulled in automatically.
        </p>
        <textarea
          value={videosText}
          onChange={(e) => setVideosText(e.target.value)}
          rows={5}
          placeholder="https://www.youtube.com/watch?v=…"
          className="mc-input font-mono text-xs"
        />
        <input
          type="text"
          value={playlist}
          onChange={(e) => setPlaylist(e.target.value)}
          placeholder="Playlist link or ID (optional)"
          className="mc-input"
        />
        {videoMsg && <Note kind="ok">{videoMsg}</Note>}
        <PixelButton onClick={saveVideos} disabled={savingVideos}>
          {savingVideos ? "Saving…" : "💾 Save videos"}
        </PixelButton>
      </div>

      {/* Video time economy --------------------------------------------------*/}
      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">⏱️ Video time</h3>
        <p className="text-xs text-paper/60">
          Set how much video time your child can earn. The daily limit is the most they can watch in
          one day; minutes-per-correct is how much each right answer is worth.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-paper/70">
            Daily limit (minutes)
            <input
              type="number"
              min={0}
              max={600}
              value={dailyCap}
              onChange={(e) => setDailyCap(e.target.value)}
              className="mc-input mt-1"
            />
          </label>
          <label className="text-xs text-paper/70">
            Minutes per correct
            <input
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={perCorrect}
              onChange={(e) => setPerCorrect(e.target.value)}
              className="mc-input mt-1"
            />
          </label>
        </div>
        {rewardMsg && <Note kind="ok">{rewardMsg}</Note>}
        <PixelButton onClick={saveRewards} disabled={savingReward}>
          {savingReward ? "Saving…" : "💾 Save video time"}
        </PixelButton>
        <p className="text-[11px] text-paper/40">
          To grant extra minutes for a single day, use the dashboard. If saving here doesn&apos;t
          stick, run the reward block in supabase/schema.sql once.
        </p>
      </div>

      {/* Background music -----------------------------------------------------*/}
      {/* Quiz & voice -------------------------------------------------------*/}
      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">🎯 Quiz &amp; voice</h3>
        <label className="flex items-center justify-between gap-3 text-sm text-paper/85">
          Seconds per question
          <input
            type="number"
            min={5}
            max={600}
            value={qSeconds}
            disabled={noTimer}
            onChange={(e) => setQSeconds(e.target.value)}
            className="mc-input w-24 text-center disabled:opacity-50"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-paper/85">
          <input type="checkbox" checked={noTimer} onChange={(e) => setNoTimer(e.target.checked)} />
          No timer — let them take their time on every question
        </label>
        <label className="flex items-start gap-2 text-sm text-paper/85">
          <input type="checkbox" checked={overtime} onChange={(e) => setOvertime(e.target.checked)} className="mt-1" />
          If the time runs out, give a little extra (half the time) so they can still answer
        </label>
        <label className="block text-sm text-paper/85">
          Voice
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="mc-input mt-1 w-full">
            {VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-paper/85">
          <input type="checkbox" checked={funMode} onChange={(e) => setFunMode(e.target.checked)} />
          Funny reactions (playful praise when right, gentle jokes when wrong)
        </label>
        {controlsMsg && <Note kind="ok">{controlsMsg}</Note>}
        <PixelButton onClick={saveControls} disabled={savingControls}>
          {savingControls ? "Saving…" : "💾 Save quiz & voice"}
        </PixelButton>
        <p className="text-[11px] text-paper/45">
          Sentence-writing questions never use a timer. Longer questions and all French questions are read aloud
          automatically. A new voice applies the next time something is spoken. To save these, run the latest block in
          RUN-THIS-IN-SUPABASE.sql once.
        </p>
      </div>

      {/* Weekly spelling / dictation ---------------------------------------*/}
      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">✍️ Weekly spelling words</h3>
        <p className="text-xs text-paper/60">
          Add this week&apos;s words. The Spelling Lab turns them into a short passage and reads it aloud slowly for{" "}
          your child to write, then marks a photo of their writing.
        </p>
        <textarea
          className="mc-input w-full text-sm"
          rows={3}
          value={spellWords}
          onChange={(e) => setSpellWords(e.target.value)}
          placeholder="cat, dog, school, friend, because..."
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-paper/85">
            Length
            <select
              value={dictLength}
              onChange={(e) => setDictLength(e.target.value as "short" | "medium" | "long")}
              className="mc-input mt-1 w-full"
            >
              <option value="short">Short (2-3 sentences)</option>
              <option value="medium">Medium (3-5 sentences)</option>
              <option value="long">Long (5-7 sentences)</option>
            </select>
          </label>
          <label className="block text-sm text-paper/85">
            Difficulty
            <select
              value={dictDiff}
              onChange={(e) => setDictDiff(e.target.value as "easy" | "medium" | "hard")}
              className="mc-input mt-1 w-full"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm text-paper/85">
          Pause between sentences (seconds)
          <input
            type="number"
            min={1}
            max={30}
            value={dictPause}
            disabled={dictConfirm}
            onChange={(e) => setDictPause(e.target.value)}
            className="mc-input w-20 text-center disabled:opacity-50"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-paper/85">
          <input type="checkbox" checked={dictConfirm} onChange={(e) => setDictConfirm(e.target.checked)} className="mt-1" />
          Wait for my child to tap &quot;Done, next&quot; after each sentence instead of using a fixed pause
        </label>
        {dictMsg && <Note kind="ok">{dictMsg}</Note>}
        <PixelButton onClick={saveDictation} disabled={savingDict}>
          {savingDict ? "Saving…" : "💾 Save spelling words"}
        </PixelButton>
        <p className="text-[11px] text-paper/45">
          The app suggests a difficulty from your words and checks spelling on the uploaded photo. Needs the OpenAI key
          active. Run the latest RUN-THIS-IN-SUPABASE.sql once to switch this on.
        </p>
      </div>

      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">🎵 Background music</h3>
        <p className="text-xs text-paper/60">
          Soft music on the home screen. Tap one to hear it and set it. It stops automatically inside
          activities. (Saved on this device.)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MUSIC_TRACKS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setTrack(m.id);
                setMusicTrack(m.id);
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border-4 px-2 py-3 text-xs transition ${
                track === m.id
                  ? "border-grasstop bg-grass/20 text-paper"
                  : "border-black/40 bg-black/20 text-paper/60"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Extra subjects ------------------------------------------------------*/}
      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">🧪 Extra subjects</h3>
        <p className="text-xs text-paper/60">
          Switch on more subjects per child. Physics appears as its own interactive Lab on the home
          screen, not in the daily quiz.
        </p>

        {profiles.length === 0 ? (
          <p className="text-xs text-paper/50">Add a child first.</p>
        ) : (
          <>
            <select
              value={subjChildId}
              onChange={(e) => onPickChild(e.target.value)}
              className="mc-input"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-paneldark">
                  {p.name} (Year {p.year})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              {EXTRA_SUBJECTS.map((s) => {
                const on = enabled.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={`flex items-center justify-between rounded-xl border-4 px-3 py-2 text-left text-sm transition ${
                      on ? "border-grasstop bg-grass/20 text-paper" : "border-black/40 bg-black/20 text-paper/60"
                    }`}
                  >
                    <span>
                      {SUBJECTS[s].emoji} {SUBJECTS[s].label}
                    </span>
                    <span>{on ? "✅" : "➕"}</span>
                  </button>
                );
              })}
            </div>
            {subjMsg && <Note kind="ok">{subjMsg}</Note>}
            <PixelButton onClick={saveSubjects} disabled={savingSubj}>
              {savingSubj ? "Saving…" : "💾 Save subjects"}
            </PixelButton>
          </>
        )}
      </div>

      {/* Parent PIN ----------------------------------------------------------*/}
      <div className="mc-card-dark space-y-3">
        <h3 className="font-pixel text-xs text-grasstop">🔒 Parent PIN</h3>
        <p className="text-xs text-paper/60">
          {pinSet
            ? "A PIN is set. It's asked for before opening this area."
            : "No PIN yet. Set one to keep this area grown-ups-only."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="New PIN (3–8 digits)"
            className="mc-input"
          />
          <input
            type="password"
            inputMode="numeric"
            value={pin2}
            onChange={(e) => setPin2(e.target.value)}
            placeholder="Confirm PIN"
            className="mc-input"
          />
        </div>
        {pinMsg && <Note kind={pinMsg.kind}>{pinMsg.text}</Note>}
        <PixelButton onClick={savePin} disabled={savingPin}>
          {savingPin ? "Saving…" : "💾 Save PIN"}
        </PixelButton>
        <p className="text-[11px] text-paper/40">
          Leave both boxes blank and save to clear the PIN.
        </p>
      </div>
    </div>
  );
}
