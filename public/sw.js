const VERSION = "quiettorino-v1";
const STATIC_CACHE = `${VERSION}-static`;
const IMMUTABLE_CACHE = `${VERSION}-immutable`;
const TILE_CACHE = `${VERSION}-tiles`;
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon-180x180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  const activeCaches = new Set([STATIC_CACHE, IMMUTABLE_CACHE, TILE_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.filter((name) => name.startsWith("quiettorino-") && !activeCaches.has(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then(async (response) => {
    if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
    return response;
  }).catch(() => undefined);
  if (cached) {
    void network;
    return cached;
  }
  const response = await network;
  if (response) return response;
  throw new Error("Risorsa non disponibile offline");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isMapTile = url.hostname.endsWith("tile.openstreetmap.org");
  const isFont = request.destination === "font" || /\.(?:woff2?|ttf|otf)$/i.test(url.pathname);
  const isIcon = request.destination === "image" && (url.pathname.startsWith("/icons/") || /(?:icon|favicon)/i.test(url.pathname));
  const isStaticAsset = url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || ["style", "script", "worker"].includes(request.destination));

  if (isFont || isIcon) {
    event.respondWith(cacheFirst(request, IMMUTABLE_CACHE));
    return;
  }
  if (isMapTile) {
    event.respondWith(staleWhileRevalidate(request, TILE_CACHE));
    return;
  }
  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(STATIC_CACHE)).put("/", response.clone());
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match("/")) || Response.error()));
  }
});