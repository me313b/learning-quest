// Load an external <script> once and resolve when ready. Used for the GeoGebra
// and Desmos embed APIs so their tools render in-page reliably.
const cache = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  const existingPromise = cache.get(src);
  if (existingPromise) return existingPromise;

  const p = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("no document"));
      return;
    }
    const existing = document.querySelector(`script[data-src="${src}"]`) as HTMLScriptElement | null;
    if (existing && existing.dataset.loaded === "true") {
      resolve();
      return;
    }
    const s = existing || document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.src = src;
    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve();
    });
    s.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    if (!existing) document.head.appendChild(s);
  });

  cache.set(src, p);
  return p;
}
