import type { SavedPlace } from "@davflood/hazard/place";
import { useCallback, useSyncExternalStore } from "react";

/**
 * The one place a person actually cares about.
 *
 * Kept in localStorage and nowhere else. A saved home address is the most
 * sensitive thing this app will ever hold, and the app has no accounts, no
 * server and no analytics — so the honest place for it is the device, where
 * it can be deleted by clearing the site data and cannot be subpoenaed,
 * leaked or sold.
 *
 * Same store shape as lib/locale.ts, and for the same reason: read in a few
 * places, written about once, and not worth a provider.
 */

const KEY = "davflood:place";

let current: SavedPlace | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): SavedPlace | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const place = parsed as Partial<SavedPlace>;
    const center = place.center;
    /* Validated rather than trusted: this is user-writable storage, and a
       malformed centre would be passed straight to the map as a camera
       target. */
    if (
      !Array.isArray(center) ||
      center.length !== 2 ||
      typeof center[0] !== "number" ||
      typeof center[1] !== "number" ||
      typeof place.label !== "string"
    ) {
      return null;
    }
    return {
      label: place.label,
      center: [center[0], center[1]],
      barangay: typeof place.barangay === "string" ? place.barangay : null,
      savedOn: typeof place.savedOn === "string" ? place.savedOn : "",
    };
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  /* Prerender and the first client render both see null, so the HTML and the
     hydrated DOM agree. The stored place arrives one render later — see
     lib/locale.ts for the same trade. */
  if (!hydrated) {
    hydrated = true;
    const stored = read();
    if (stored) {
      current = stored;
      queueMicrotask(emit);
    }
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function savePlace(place: SavedPlace) {
  current = place;
  try {
    localStorage.setItem(KEY, JSON.stringify(place));
  } catch {
    // still applies to this session; it just will not survive it
  }
  emit();
}

export function forgetPlace() {
  current = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to do — the in-memory copy is already gone
  }
  emit();
}

export function useSavedPlace(): {
  place: SavedPlace | null;
  save: (place: SavedPlace) => void;
  forget: () => void;
} {
  const place = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );

  return {
    place,
    save: useCallback((next: SavedPlace) => savePlace(next), []),
    forget: useCallback(() => forgetPlace(), []),
  };
}
