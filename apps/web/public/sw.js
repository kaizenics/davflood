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

/**
 * Bumped to v2 to evict what v1 stored, which is the only way those entries
 * ever go away.
 *
 * `activate` deletes every cache not starting with VERSION, and VERSION had
 * never moved — so an install that had already pressed Save was holding 274
 * OPAQUE tiles that the fixed code cannot use and would never have replaced:
 * `cacheFirst` finds them, returns them, and the browser rejects them, on
 * every tile, forever. The same sweep clears the hashed chunks that had been
 * accumulating in the shell since the first deploy, for the same reason.
 *
 * The cost is one cold start: readers re-download the basemap they are
 * looking at, and anyone who saved the pack has to save it again — the panel
 * asks the pack cache, so it will correctly say "Use without a signal" rather
 * than claiming a pack that is gone. That is the right trade against leaving
 * a saved offline map that does not work offline.
 */
const VERSION = "davflood-v2";
const SHELL = `${VERSION}-shell`;
const TILES = `${VERSION}-tiles`;
/**
 * The deliberately-saved pack, kept apart from the browsing caches.
 *
 * Same-origin pack files used to go into SHELL alongside everything the app
 * had happened to load, which made two things impossible: "Remove" could not
 * tell the pack's files from ordinary browsing and so left them behind, and
 * the app could not tell whether Save had ever been pressed. Nothing writes
 * here except cacheUrls, so its contents ARE the answer to both questions.
 */
const PACK = `${VERSION}-pack`;

/** Cap the tile cache so a long session cannot fill the device. */
const TILE_LIMIT = 3000;

/**
 * Cap the hashed assets a long-lived install accumulates.
 *
 * Every deploy ships a new set of content-hashed chunks, and cache-first
 * never revisits the old ones — so without this the shell grows by a build's
 * worth of JavaScript every release, forever, on a device whose storage this
 * app has no business filling. Only /assets/ is counted and evicted: the
 * document itself is not disposable.
 */
const ASSET_LIMIT = 300;

/** Hosts whose tiles are worth keeping. */
const TILE_HOSTS = [
  "tiles.openfreemap.org",
  "s3.amazonaws.com",
  "server.arcgisonline.com",
];

/** Conditions. Absent beats stale — see the rule above. */
const LIVE_HOSTS = ["api.open-meteo.com", "flood-api.open-meteo.com"];

self.addEventListener("install", (event) => {
  /**
   * Only the document is precached; everything else arrives as it is used.
   *
   * One at a time rather than `addAll`, which is all-or-nothing: a single
   * request failing during a deploy blip rejected the whole install, so
   * `skipWaiting` never ran and the worker never activated — leaving the app
   * with no offline story at all until the next visit happened to catch a
   * good moment. A partial precache is worth more than a failed install.
   */
  event.waitUntil(
    caches
      .open(SHELL)
      .then(async (c) => {
        for (const url of ["/", "/index.html"]) {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res.ok) await c.put(url, res);
          } catch {
            // the next navigation will fill it in — see the fetch handler
          }
        }
      })
      .then(() => self.skipWaiting()),
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
    /* Both halves of the pack. Deleting only the tiles left ~6 MB of hazard
       scenarios and the news file on the device while the panel said the
       pack was gone — "Remove" has to remove what "Save" saved. */
    event.waitUntil(
      Promise.all([caches.delete(TILES), caches.delete(PACK)]).then(() =>
        event.source?.postMessage({ type: "OFFLINE_CLEARED" }),
      ),
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
          /**
           * ONLY a good response becomes the offline shell.
           *
           * Unchecked, one bad deploy or a host error page was enough to
           * install a 500 as the document this app falls back to with no
           * signal — permanently, because cache-first never revisits it.
           * The stale shell that is already there is always the better
           * answer than a fresh error.
           */
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(SHELL).then((c) => c.put("/index.html", copy)));
          }
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
      /* Read from the pack as well as the shell: the hazard scenarios a
         reader deliberately saved live under /assets/ too, and looking only
         in the shell would re-download 5.9 MB they already paid for. Writes
         still go to the shell — this path is ordinary browsing. */
      event.respondWith(cacheFirst(req, SHELL, ASSET_LIMIT, [PACK]));
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

/**
 * `alsoRead` are caches consulted on a miss but never written to — the saved
 * pack, whose contents the browsing paths should use but must not add to.
 */
async function cacheFirst(req, cacheName, limit, alsoRead = []) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;

  for (const name of alsoRead) {
    const spare = await caches.open(name);
    const stored = await spare.match(req);
    if (stored) return stored;
  }

  const res = await fetch(req);
  /**
   * Opaque responses are kept only where they can actually be served back.
   *
   * A cross-origin `no-cors` response can only fulfil a `no-cors` request;
   * handing one to MapLibre, which asks for tiles in cors mode, is a network
   * error rather than a cached tile. This path fetches with the request's own
   * mode, so an opaque response here means the caller asked for one.
   */
  if (res.ok || (res.type === "opaque" && req.mode === "no-cors")) {
    await cache.put(req, res.clone());
    if (limit) void trim(cache, limit, cacheName === SHELL);
  }
  return res;
}

/**
 * Oldest-first eviction. Rough, and cheap enough to run on a miss.
 *
 * `assetsOnly` keeps the document out of it: the shell cache mixes disposable
 * hashed chunks with "/" and "/index.html", and evicting those to make room
 * for a chunk would throw away the one entry that makes the app open at all.
 */
async function trim(cache, limit, assetsOnly = false) {
  let keys = await cache.keys();
  if (assetsOnly) keys = keys.filter((k) => new URL(k.url).pathname.startsWith("/assets/"));
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
 *
 * FETCHED IN CORS MODE, and that is not a detail. These were fetched
 * `no-cors`, which stores an OPAQUE response — and an opaque response cannot
 * fulfil a request that was not itself `no-cors`. MapLibre asks for tiles in
 * cors mode, so every one of the 274 tiles this saved came back to it as a
 * network error: the pack downloaded, reported success, and then did nothing
 * on the day the signal went. tiles.openfreemap.org sends
 * `access-control-allow-origin: *`, so there was never anything to work
 * around. A host that genuinely lacked CORS now counts as a failure, which is
 * the honest outcome — an entry that cannot be served is not a saved tile.
 */
async function cacheUrls(urls, client) {
  const tiles = await caches.open(TILES);
  const pack = await caches.open(PACK);
  let done = 0;
  let failed = 0;

  const queue = [...urls];
  const workers = Array.from({ length: 6 }, async () => {
    for (;;) {
      const url = queue.shift();
      if (url === undefined) return;
      try {
        const target = new URL(url, self.location.origin);
        const cache = target.origin === self.location.origin ? pack : tiles;
        if (!(await cache.match(url))) {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res.clone());
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
