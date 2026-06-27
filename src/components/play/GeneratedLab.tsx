"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LabSubject } from "@/lib/labs";

// Renders a fully AI-generated interactive experiment inside a hardened iframe.
// The iframe is sandboxed with ONLY allow-scripts (no same-origin), so the
// generated code runs in an opaque origin and cannot touch the parent page,
// cookies or storage. A strict Content-Security-Policy is injected so it also
// cannot make any network request or load external resources — it can only run
// its own inline JS/CSS and play Web Audio. Each "generate" makes a brand-new one.

function buildDoc(body: string): string {
  const csp =
    "default-src 'none'; img-src data:; media-src data:; style-src 'unsafe-inline'; " +
    "script-src 'unsafe-inline'; font-src data:;";
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#161d2b;color:#F4ECD8;padding:12px;overflow:auto;-webkit-user-select:none;user-select:none}
  button{cursor:pointer;font-family:inherit}
  canvas{max-width:100%}
</style>
</head><body>${body}</body></html>`;
}

export default function GeneratedLab({
  subject,
  onBack,
}: {
  subject: LabSubject;
  onBack: () => void;
}) {
  const [concept, setConcept] = useState<string>(subject.concepts[0]);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<"ok" | "needsKey" | "failed">("ok");
  const [showConcepts, setShowConcepts] = useState(false);
  const reqRef = useRef(0);

  const generate = useCallback(async (c: string) => {
    const myReq = ++reqRef.current;
    setConcept(c);
    setLoading(true);
    setState("ok");
    setHtml("");
    try {
      const res = await fetch("/api/lab-generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject: subject.key, concept: c }),
      });
      const data = await res.json();
      if (myReq !== reqRef.current) return; // a newer request superseded this one
      if (data.needsKey) {
        setState("needsKey");
      } else if (data.html) {
        setHtml(String(data.html));
      } else {
        setState("failed");
      }
    } catch {
      if (myReq === reqRef.current) setState("failed");
    } finally {
      if (myReq === reqRef.current) setLoading(false);
    }
  }, [subject.key]);

  useEffect(() => {
    const start = subject.concepts[Math.floor(Math.random() * subject.concepts.length)];
    generate(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.key]);

  function surprise() {
    const pool = subject.concepts.filter((c) => c !== concept);
    const next = pool[Math.floor(Math.random() * pool.length)] || subject.concepts[0];
    setShowConcepts(false);
    generate(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xs text-grasstop">
          {subject.emoji} {subject.label} Lab
        </h2>
        <button onClick={onBack} className="text-[11px] text-paper/50 underline">
          ← Labs
        </button>
      </div>

      <p className="text-sm text-paper/80">
        Now exploring: <span className="font-semibold text-gold">{concept}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={surprise}
          className="rounded-xl border-4 border-black/40 bg-grass px-4 py-2 font-pixel text-[11px] text-white shadow-pixelsm active:translate-y-0.5"
        >
          🎲 Surprise me
        </button>
        <button
          onClick={() => generate(concept)}
          disabled={loading}
          className="rounded-xl border-4 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[11px] text-paper/80 disabled:opacity-50"
        >
          ↻ New version
        </button>
        <button
          onClick={() => setShowConcepts((v) => !v)}
          className="rounded-xl border-2 border-black/40 bg-black/20 px-3 py-2 font-pixel text-[10px] text-paper/70"
        >
          {showConcepts ? "Hide list" : "Pick a topic"}
        </button>
      </div>

      {showConcepts && (
        <div className="mc-card-dark flex flex-wrap gap-2">
          {subject.concepts.map((c) => (
            <button
              key={c}
              onClick={() => {
                setShowConcepts(false);
                generate(c);
              }}
              className={`rounded-lg border-2 px-2.5 py-1 text-xs transition ${
                c === concept
                  ? "border-grasstop bg-grass/20 text-paper"
                  : "border-black/40 bg-black/20 text-paper/70"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mc-card-dark animate-pulse py-16 text-center text-paper/60">
          ⚗️ Building a brand-new experiment…
        </div>
      )}

      {!loading && state === "needsKey" && (
        <div className="mc-card text-center text-sm text-paper/80">
          These experiments are created by AI, so a grown-up needs to add an AI key in{" "}
          <span className="font-semibold text-grasstop">Parent area → Settings</span> first.
        </div>
      )}

      {!loading && state === "failed" && (
        <div className="mc-card-dark text-center">
          <p className="text-sm text-paper/80">That one didn&apos;t come out right. Let&apos;s try another!</p>
          <button
            onClick={() => generate(concept)}
            className="mt-3 rounded-xl border-4 border-black/40 bg-grass px-4 py-2 font-pixel text-[11px] text-white"
          >
            ↻ Try again
          </button>
        </div>
      )}

      {!loading && state === "ok" && html && (
        <iframe
          title="experiment"
          sandbox="allow-scripts"
          srcDoc={buildDoc(html)}
          className="h-[460px] w-full rounded-xl border-4 border-black/50 bg-[#161d2b]"
        />
      )}

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-black/40 bg-black/30 px-4 py-2 font-pixel text-[10px] text-paper/80"
        >
          ← Back to labs
        </button>
      </div>
    </div>
  );
}
