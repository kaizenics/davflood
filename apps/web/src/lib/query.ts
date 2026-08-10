/**
 * Query settings that differ between the browser and the build.
 *
 * React Query schedules a garbage-collection timer the moment a Query is
 * CONSTRUCTED — `new Query` calls `scheduleGc`, before anything is fetched and
 * regardless of `enabled`. In a browser that is invisible. During prerender it
 * is fatal: the timer is `gcTime` long, Node will not exit while it is
 * pending, and this app's gcTimes are an hour and a day. `vite build` finished
 * all of its work and then sat there — forever locally, and until Netlify
 * killed the deploy at eighteen minutes.
 *
 * So on the server every cache lives for zero milliseconds. Nothing is lost:
 * the prerender renders one page and throws the cache away, and none of these
 * queries are allowed to run there in the first place.
 */
import { useEffect, useState } from "react";

export const IS_BROWSER = typeof window !== "undefined";

/** `ms` in the browser, nothing during prerender. */
export function gcTime(ms: number): number {
  return IS_BROWSER ? ms : 0;
}

/**
 * False until after hydration.
 *
 * Any panel whose text depends on query state needs this. The prerendered HTML
 * is rendered with the query switched off — no data, nothing in flight — so it
 * says "unavailable"; the browser starts fetching immediately and its first
 * render says "checking". Different text in the same node is a hydration
 * mismatch, and React discards the server markup over it.
 *
 * Gating on mount makes both sides render the same thing, and the real state
 * arrives on the render after.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
