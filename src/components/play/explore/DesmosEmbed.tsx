"use client";

import { useEffect, useRef } from "react";
import { loadScript } from "@/lib/loadScript";

interface DesmosCalc {
  destroy: () => void;
}
interface DesmosNS {
  GraphingCalculator: (el: HTMLElement, opts?: Record<string, unknown>) => DesmosCalc;
  ScientificCalculator: (el: HTMLElement, opts?: Record<string, unknown>) => DesmosCalc;
  FourFunctionCalculator: (el: HTMLElement, opts?: Record<string, unknown>) => DesmosCalc;
}
declare global {
  interface Window {
    Desmos?: DesmosNS;
  }
}

// Desmos publishes this demo API key in their documentation for trying the API.
// It is fine for personal use; a free production key can be requested from Desmos.
const KEY = "dcb31709b452b1cf9dc26972add0fda6";

export default function DesmosEmbed({ kind }: { kind: "graphing" | "scientific" | "fourfunction" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let calc: DesmosCalc | undefined;
    let cancelled = false;
    (async () => {
      try {
        await loadScript(`https://www.desmos.com/api/v1.10/calculator.js?apiKey=${KEY}`);
      } catch {
        return;
      }
      if (cancelled || !ref.current || !window.Desmos) return;
      if (kind === "scientific") calc = window.Desmos.ScientificCalculator(ref.current);
      else if (kind === "fourfunction") calc = window.Desmos.FourFunctionCalculator(ref.current);
      else calc = window.Desmos.GraphingCalculator(ref.current);
    })();
    return () => {
      cancelled = true;
      try {
        calc?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [kind]);

  return <div ref={ref} className="h-full w-full bg-white" />;
}
