"use client";

import { useEffect, useRef } from "react";
import { loadScript } from "@/lib/loadScript";

interface GGBAppletInstance {
  inject: (id: string) => void;
}
interface GGBAppletCtor {
  new (params: Record<string, unknown>, html5: boolean): GGBAppletInstance;
}
declare global {
  interface Window {
    GGBApplet?: GGBAppletCtor;
  }
}

// Renders a GeoGebra app (graphing, geometry, 3d, scientific, suite, classic,
// cas, notes) directly in the page using GeoGebra's official deployggb API.
export default function GeoGebraEmbed({ app }: { app: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const idRef = useRef("ggb-" + Math.random().toString(36).slice(2, 9));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript("https://www.geogebra.org/apps/deployggb.js");
      } catch {
        return;
      }
      if (cancelled || !wrapRef.current || !window.GGBApplet) return;
      const w = Math.max(320, Math.floor(wrapRef.current.clientWidth));
      const h = Math.max(360, Math.floor(wrapRef.current.clientHeight));
      const applet = new window.GGBApplet(
        {
          appName: app,
          width: w,
          height: h,
          showToolBar: true,
          showAlgebraInput: true,
          showMenuBar: false,
          showResetIcon: true,
          borderColor: "transparent",
          allowUpscale: true,
          autoHeight: false,
          language: "en",
        },
        true,
      );
      applet.inject(idRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [app]);

  return (
    <div ref={wrapRef} className="h-full w-full bg-white">
      <div id={idRef.current} className="h-full w-full" />
    </div>
  );
}
