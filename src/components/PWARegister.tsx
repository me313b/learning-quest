"use client";

import { useEffect } from "react";

// Service worker registration.
//
// On a deployed site (e.g. Vercel) the service worker makes the app installable
// and fast, and we auto-reload once when a new version takes over so updates
// always reach the user.
//
// On localhost during development a cached service worker causes the browser to
// keep showing the OLD build after you change the code. So on localhost we do
// the opposite: actively unregister any service worker and clear its caches, so
// `npm run dev` always serves the latest files.
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]";

    if (isLocal) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if (window.caches) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
      return;
    }

    // Production: register, and reload once when an updated worker takes control.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {
          /* best-effort; the app works without it */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
