import { estimateMb, offlineTileUrls } from "@davflood/hazard/offline";
import { useCallback, useEffect, useState } from "react";

import { SCENARIO_URLS } from "@/lib/hazard-source";

/**
 * Saving Davao City to the device.
 *
 * Runtime caching alone only remembers what someone happened to look at, and
 * what they happened to look at on a clear day is not what they will need in
 * the dark with no signal. This is the deliberate version: press it before the
 * storm, and the map opens during it.
 */

export type OfflineState = "unsupported" | "idle" | "saving" | "saved";

export type OfflineProgress = { done: number; total: number; failed: number };

/** Everything the app needs to be useful with no network. */
function packUrls(): string[] {
  return [...offlineTileUrls(13), ...SCENARIO_URLS, "/flood-news.json"];
}

/**
 * The cache the service worker keeps the deliberately-saved pack in.
 *
 * MUST MATCH `PACK` IN public/sw.js, VERSION INCLUDED — bumping the version
 * there to evict a bad cache has to be done here in the same commit, or this
 * looks in a cache nothing writes to and the panel offers to save a pack that
 * is already on the device. The worker is a static file with no access to the
 * bundle and this is a bundled module with no access to the worker, so a
 * shared constant is not available; the duplication is real and the only
 * defence is that both places say so.
 *
 * Nothing except `cacheUrls` writes here, which is what makes it a truthful
 * answer to "did this person press Save" — see below.
 */
const PACK_CACHE = "davflood-v2-pack";

export const PACK_MB = estimateMb(offlineTileUrls(13).length, 5_600_000);

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // dev is served from memory and has no hashed assets to cache; a worker
  // there only gets in the way of hot reloads
  if (!import.meta.env.PROD) return;

  const go = () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[offline] service worker did not register:", err);
    });
  };

  /**
   * `load` has usually already fired by the time React hydrates and calls
   * this, and a listener added after the event never runs — which is exactly
   * how the worker silently failed to register at all. Deferring it at all is
   * only politeness about first paint, so if the page is already there, go.
   */
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

export function useOfflinePack() {
  const [state, setState] = useState<OfflineState>("idle");
  const [progress, setProgress] = useState<OfflineProgress>({
    done: 0,
    total: 0,
    failed: 0,
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("caches" in window)) {
      setState("unsupported");
      return;
    }
    let live = true;
    /**
     * "saved" is not a flag we set — it is a question we ask the cache, so it
     * stays true only while the data is actually there.
     *
     * ASKED OF THE PACK, not of a tile count. This used to be
     * `tiles.keys().length > 200`, and the tile cache also fills from
     * ordinary browsing: panning the map across a few zoom levels passes 200
     * without anyone pressing anything, so the panel told readers the city
     * was saved for offline when it was not — while the hazard scenarios,
     * which are most of the pack and all of the point, had never been
     * fetched. On an app that will not show a stale forecast, telling someone
     * they can rely on a map they cannot is the worse version of the same
     * mistake.
     *
     * The scenarios are the thing worth checking: only `cacheUrls` writes
     * them here, so all three present means Save ran and completed.
     */
    caches
      .open(PACK_CACHE)
      .then(async (c) => {
        const found = await Promise.all(SCENARIO_URLS.map((url) => c.match(url)));
        return found.every(Boolean);
      })
      .then((saved) => {
        if (live && saved) setState("saved");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "CACHE_PROGRESS") setProgress(e.data);
      if (e.data?.type === "CACHE_DONE") {
        setProgress(e.data);
        setState("saved");
      }
      if (e.data?.type === "OFFLINE_CLEARED") {
        setState("idle");
        setProgress({ done: 0, total: 0, failed: 0 });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  const save = useCallback(async () => {
    const urls = packUrls();
    /**
     * The worker has to be there before the UI claims anything is happening.
     *
     * `setState("saving")` used to run unconditionally, and the progress
     * messages that clear it come from the worker — so if `ready` never
     * resolved, or the registration had no active worker to post to, the
     * panel sat at "Saving… 0%" for the rest of the session with nothing
     * behind it and no way back to the button.
     */
    let worker: ServiceWorker | null = null;
    try {
      worker = (await navigator.serviceWorker.ready).active;
    } catch {
      worker = null;
    }
    if (!worker) {
      setState("idle");
      return;
    }

    setState("saving");
    setProgress({ done: 0, total: urls.length, failed: 0 });
    worker.postMessage({ type: "CACHE_URLS", urls });
  }, []);

  const clear = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "CLEAR_OFFLINE" });
  }, []);

  return { state, progress, save, clear };
}
