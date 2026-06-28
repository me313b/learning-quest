"use client";

import { useEffect, useRef, useState } from "react";

// A gentle per-question timer. When the main time runs out it can optionally
// grant a little "overtime" (e.g. half the original time) so the child can still
// answer, and only calls onExpire once that runs out too. Reset between
// questions by giving the element a new `key` in the parent.

export default function CountdownTimer({
  seconds,
  onExpire,
  paused = false,
  overtimeSeconds = 0,
}: {
  seconds: number;
  onExpire: () => void;
  paused?: boolean;
  overtimeSeconds?: number;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [overtime, setOvertime] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const overtimeRef = useRef(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        // Reached zero.
        if (overtimeSeconds > 0 && !overtimeRef.current) {
          // Grant overtime once, then keep counting.
          overtimeRef.current = true;
          setOvertime(true);
          return overtimeSeconds;
        }
        clearInterval(id);
        if (!firedRef.current) {
          firedRef.current = true;
          onExpireRef.current();
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, overtimeSeconds]);

  const base = overtime ? overtimeSeconds : seconds;
  const pct = base > 0 ? (remaining / base) * 100 : 0;
  const danger = remaining <= 10 || overtime;

  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-paper/70">{overtime ? "A little extra time ⏰" : "Time left"}</span>
        <span className={danger ? "font-bold text-redstone" : "text-paper/70"}>{remaining}s</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            backgroundColor: overtime ? "#F8B617" : danger ? "#E03C28" : "#4AEDD9",
          }}
        />
      </div>
    </div>
  );
}
