"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// A short, cheerful burst of confetti. Mount it (e.g. on a correct answer or a
// completed session) and it animates once. Pure motion, no images.

const COLOURS = ["#4AEDD9", "#17DD62", "#F8B617", "#E03C28", "#7FB238", "#7EC0EE"];

export default function Confetti({ count = 26 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: 120 + Math.random() * 220,
        rot: Math.random() * 540 - 270,
        delay: Math.random() * 0.15,
        colour: COLOURS[i % COLOURS.length],
        size: 6 + Math.random() * 8,
        round: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center overflow-visible">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: b.x, y: b.y, rotate: b.rot }}
          transition={{ duration: 1.1, delay: b.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: b.size,
            height: b.size,
            backgroundColor: b.colour,
            borderRadius: b.round ? "9999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}
