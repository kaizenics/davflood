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
    // "saved" is not a flag we set — it is a question we ask the cache, so it
    // stays true only while the data is actually there
    caches
      .open("davflood-v1-tiles")
      .then((c) => c.keys())
      .then((keys) => {
        if (live && keys.length > 200) setState("saved");
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
    const reg = await navigator.serviceWorker.ready;
    const urls = packUrls();
    setState("saving");
    setProgress({ done: 0, total: urls.length, failed: 0 });
    reg.active?.postMessage({ type: "CACHE_URLS", urls });
  }, []);

  const clear = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "CLEAR_OFFLINE" });
  }, []);

  return { state, progress, save, clear };
}
