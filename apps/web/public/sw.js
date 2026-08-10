/**
 * DavFlood's service worker.
 *
 * The network is the first thing to go in a storm, which is exactly when
 * someone opens a flood map. This makes the app survive that.
 *
 * Hand-written rather than generated. A build-time precache manifest buys
 * nothing here: every asset this app ships is content-hashed, so cache-first
 * is already safe and correct for them, and the two things that genuinely
 * must not be cached — the weather and the river — are the two a manifest
 * would have no opinion about.
 *
 * THE RULE THAT MATTERS: never serve stale conditions as if they were current.
 * Hazard polygons are a model of where water goes and do not change between
 * storms, so they are cached hard. Rainfall, river discharge and news describe
 * right now; if the network is gone, they are absent rather than wrong.
 */

const VERSION = "davflood-v1";
const SHELL = `${VERSION}-shell`;
const TILES = `${VERSION}-tiles`;

/** Cap the tile cache so a long session cannot fill the device. */
const TILE_LIMIT = 3000;

/** Hosts whose tiles are worth keeping. */
const TILE_HOSTS = [
  "tiles.openfreemap.org",
  "s3.amazonaws.com",
  "server.arcgisonline.com",
];

/** Conditions. Absent beats stale — see the rule above. */
const LIVE_HOSTS = ["api.open-meteo.com", "flood-api.open-meteo.com"];

self.addEventListener("install", (event) => {
  // Only the document is precached; everything else arrives as it is used.
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(["/", "/index.html"])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_URLS") {
    event.waitUntil(cacheUrls(event.data.urls ?? [], event.source));
  }
  if (event.data?.type === "CLEAR_OFFLINE") {
    event.waitUntil(
      caches.delete(TILES).then(() => event.source?.postMessage({ type: "OFFLINE_CLEARED" })),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Conditions: network only. A cached forecast is a lie with a timestamp.
  if (LIVE_HOSTS.includes(url.hostname)) return;

  // Navigations: fresh when possible, the shell when not. This is what makes
  // the app open at all with no signal.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(SHELL).then((c) => c.put("/index.html", res.clone()));
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r ?? Response.error())),
    );
    return;
  }

  // Our own hashed assets — including the hazard polygons, which are the
  // whole point of the app working offline.
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/assets/")) {
      event.respondWith(cacheFirst(req, SHELL));
      return;
    }
    // Everything else of ours (news file, manifest, icons): fresh if we can,
    // cached if we cannot.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(SHELL).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r ?? Response.error())),
    );
    return;
  }

  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(req, TILES, TILE_LIMIT));
  }
});

async function cacheFirst(req, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  // opaque responses (no CORS) are still worth keeping — a tile renders fine
  if (res.ok || res.type === "opaque") {
    await cache.put(req, res.clone());
    if (limit) void trim(cache, limit);
  }
  return res;
}

/** Oldest-first eviction. Rough, and cheap enough to run on a tile miss. */
async function trim(cache, limit) {
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  for (const key of keys.slice(0, keys.length - limit)) await cache.delete(key);
}

/**
 * Warm the cache on request, so the map can be saved BEFORE the storm rather
 * than only remembering what happened to be looked at.
 *
 * Failures are counted, not thrown: a pack that is 98% complete is worth far
 * more than no pack, and the missing tiles simply fall back to the network if
 * it is there.
 */
async function cacheUrls(urls, client) {
  const tiles = await caches.open(TILES);
  const shell = await caches.open(SHELL);
  let done = 0;
  let failed = 0;

  const queue = [...urls];
  const workers = Array.from({ length: 6 }, async () => {
    for (;;) {
      const url = queue.shift();
      if (!url) return;
      try {
        const target = new URL(url, self.location.origin);
        const cache = target.origin === self.location.origin ? shell : tiles;
        if (!(await cache.match(url))) {
          const res = await fetch(url, { mode: "no-cors" });
          if (res.ok || res.type === "opaque") await cache.put(url, res.clone());
          else failed++;
        }
      } catch {
        failed++;
      }
      done++;
      if (done % 15 === 0 || done === urls.length) {
        client?.postMessage({ type: "CACHE_PROGRESS", done, total: urls.length, failed });
      }
    }
  });

  await Promise.all(workers);
  client?.postMessage({ type: "CACHE_DONE", done, total: urls.length, failed });
}
