/* Learning Quest service worker.
 * Strategy:
 *  - static assets (/_next/static, icons, fonts, css, js): cache-first (they are
 *    content-hashed, so this is safe and fast).
 *  - page navigations: network-first, falling back to cache, then to a cached
 *    shell, so the installed app still opens when offline.
 *  - /api/* and cross-origin (Supabase, etc.): never cached — always go to the
 *    network so auth and data stay correct and fresh.
 * The cache name is versioned; old caches are cleared on activate, so a new
 * deploy never gets stuck behind stale files.
 */
const VERSION = "lq-v3";
const CACHE = `lq-cache-${VERSION}`;
const PRECACHE = ["/", "/icon-192.png", "/icon-512.png", "/apple-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through
  if (url.pathname.startsWith("/api/")) return; // never cache API/auth

  // Static, content-hashed assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return hit || Response.error();
        }
      }),
    );
    return;
  }

  // Page navigations: network-first with cache fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          const cached = await cache.match(req);
          return cached || (await cache.match("/")) || Response.error();
        }
      })(),
    );
  }
});
