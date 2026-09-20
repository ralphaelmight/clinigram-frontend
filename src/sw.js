// Service worker — injectManifest mode.
// vite-plugin-pwa replaces self.__WB_MANIFEST with the actual precache list.

const CACHE = "fm-v5";
const PRECACHE_URLS = (self.__WB_MANIFEST || []).map((e) => e.url);

// Install: precache shell + skipWaiting so new SW always activates immediately.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: delete every old cache version, then claim all open tabs.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Message handler kept for compatibility.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Fetch strategy ──────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests.
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API calls — never cache.
  if (url.pathname.startsWith("/api/")) return;

  // version.json (with or without ?_ timestamp) — always bypass SW and HTTP cache.
  if (url.pathname === "/version.json" || url.searchParams.has("_")) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // Navigations — always bypass HTTP cache so latest index.html is served.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        caches.match("/index.html").then((r) => r || Response.error())
      )
    );
    return;
  }

  // Hashed static assets (/assets/*) — cache-first with background revalidate.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => null);
        return cached ?? fresh;
      })
    );
    return;
  }

  // Everything else (icons, fonts, manifest) — network-first, cache fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
