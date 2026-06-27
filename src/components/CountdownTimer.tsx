"use client";

import { useEffect, useRef, useState } from "react";

// A gentle per-question timer. It records nothing itself: when it reaches zero
// it calls onExpire once, and the quiz treats that as a blank "timeout" answer.
// Reset between questions by giving the element a new `key` in the parent.

export default function CountdownTimer({
  seconds,
  onExpire,
  paused = false,
}: {
  seconds: number;
  onExpire: () => void;
  paused?: boolean;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!firedRef.current) {
            firedRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const danger = remaining <= 10;

  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-paper/70">Time left</span>
        <span className={danger ? "font-bold text-redstone" : "text-paper/70"}>{remaining}s</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-black/40 bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            backgroundColor: danger ? "#E03C28" : "#4AEDD9",
          }}
        />
      </div>
    </div>
  );
}
