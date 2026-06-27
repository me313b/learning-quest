"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If email confirmation is off, a session exists immediately.
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          router.replace("/");
          router.refresh();
        } else {
          setMsg("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
        router.refresh();
      }
    } catch (e) {
      setMsg((e as Error).message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <div className="mb-2 text-5xl">⛏️</div>
        <h1 className="font-pixel text-lg text-grasstop">Learning Quest</h1>
        <p className="mt-2 text-sm text-paper/70">
          Mine knowledge. Build a brilliant brain.
        </p>
      </div>

      <div className="mc-card-dark space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-lg border-2 border-black/40 px-3 py-2 font-pixel text-[10px] ${
              mode === "signin" ? "bg-grass text-white" : "bg-black/20 text-paper/60"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg border-2 border-black/40 px-3 py-2 font-pixel text-[10px] ${
              mode === "signup" ? "bg-grass text-white" : "bg-black/20 text-paper/60"
            }`}
          >
            Create account
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs text-paper/70">Parent email</label>
          <input
            type="email"
            className="mc-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-paper/70">Password</label>
          <input
            type="password"
            className="mc-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>

        <button onClick={submit} disabled={busy || !email || !password} className="mc-btn w-full">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        {msg && <p className="text-center text-xs text-gold">{msg}</p>}
      </div>

      <p className="mt-4 text-center text-[11px] text-paper/50">
        The parent account holds the family settings. Children pick their own
        avatar on the next screen.
      </p>
    </main>
  );
}
