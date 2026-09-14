// Service worker — injectManifest mode.
// vite-plugin-pwa replaces self.__WB_MANIFEST with the actual precache list.

const CACHE = "fm-v2";
const PRECACHE_URLS = (self.__WB_MANIFEST || []).map((e) => e.url);

// Install: precache shell. Do NOT skipWaiting — the page controls activation.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// Activate: delete every old cache, then claim open tabs.
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

// Message: page sends SKIP_WAITING when it is safe to activate the new SW.
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

  // version.json — always network-only so the page sees the latest build stamp.
  if (url.pathname === "/version.json") {
    event.respondWith(fetch(request));
    return;
  }

  // Navigations — network-first so a fresh index.html is fetched on each load.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
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
        // Always revalidate in the background
        const fresh = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => null);
        return cached ?? fresh;
      })
    );
    return;
  }

  // Everything else (icons, fonts, manifest.json) — network-first, cache fallback.
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
