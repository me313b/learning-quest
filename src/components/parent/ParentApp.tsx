"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SafeSettings } from "@/lib/types";
import { PixelButton } from "@/components/ui/primitives";
import Dashboard from "./Dashboard";
import Settings from "./Settings";

type Tab = "dashboard" | "settings";

export default function ParentApp() {
  const router = useRouter();
  const [settings, setSettings] = useState<SafeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.status === 401) {
      router.push("/login");
      return null;
    }
    const data = (await res.json()) as SafeSettings;
    setSettings(data);
    return data;
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadSettings();
        // No PIN yet → let the parent in so they can set one.
        if (data && !data.pinSet) setUnlocked(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSettings]);

  async function submitPin() {
    setChecking(true);
    setPinError("");
    try {
      const res = await fetch("/api/parent-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) setUnlocked(true);
      else setPinError("That PIN isn't right. Try again.");
    } catch {
      setPinError("Something went wrong. Try again.");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-paper/70">
        Opening the parent area…
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full space-y-5">
          <div className="text-center">
            <div className="text-4xl">🔒</div>
            <h1 className="mt-2 font-pixel text-sm text-grasstop">Parent area</h1>
            <p className="mt-2 text-sm text-paper/70">Enter your PIN to continue.</p>
          </div>
          <div className="mc-card-dark space-y-3">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              placeholder="••••"
              className="mc-input text-center tracking-[0.5em]"
            />
            {pinError && <p className="text-center text-xs text-redstone">{pinError}</p>}
            <PixelButton onClick={submitPin} disabled={checking || !pin} className="w-full">
              {checking ? "Checking…" : "🔓 Unlock"}
            </PixelButton>
          </div>
          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="font-pixel text-[10px] text-paper/60 underline"
            >
              ← Back to players
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="font-pixel text-sm text-grasstop">👨‍💻 Parent area</h1>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg border-2 border-black/40 bg-black/30 px-3 py-1 font-pixel text-[10px] text-paper/80"
        >
          ← Players
        </button>
      </header>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("dashboard")}
          className={`flex-1 rounded-xl border-4 px-3 py-2 font-pixel text-[10px] transition ${
            tab === "dashboard"
              ? "border-grasstop bg-grass/25 text-paper"
              : "border-black/40 bg-black/20 text-paper/60"
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`flex-1 rounded-xl border-4 px-3 py-2 font-pixel text-[10px] transition ${
            tab === "settings"
              ? "border-grasstop bg-grass/25 text-paper"
              : "border-black/40 bg-black/20 text-paper/60"
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {tab === "dashboard" && <Dashboard />}
      {tab === "settings" && (
        <Settings settings={settings} onSaved={loadSettings} />
      )}
    </main>
  );
}
