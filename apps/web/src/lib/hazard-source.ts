import type { HazardCollection } from "@naboflood/hazard/schema";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";

// `?url` makes Vite emit each file as a static asset and hand back its URL,
// instead of inlining ~9 MB of JSON into the JS bundle.
import url5 from "@naboflood/hazard/data/panabo-5.json?url";
import url25 from "@naboflood/hazard/data/panabo-25.json?url";
import url100 from "@naboflood/hazard/data/panabo-100.json?url";

/**
 * THE LOADING SEAM.
 *
 * The real UP NOAH polygons are much heavier than the placeholder they
 * replaced: ~5.9 MB of GeoJSON across the three return periods. Bundled, that
 * produced an 8.7 MB chunk (1.0 MB gzipped) loaded before the map could
 * render — and every scenario paid for the two nobody was looking at.
 *
 * So they are fetched per scenario and cached. First paint now needs one file
 * (~2 MB for the 25-year default), and switching scenarios pulls the next one
 * once. This is the change that seam was written for.
 *
 * Trade-off worth naming: the hazard layer now needs one network round-trip
 * on a cold cache, where the bundled version did not. On the web that was
 * never really an offline guarantee — there is no service worker — and the
 * browser caches these immutably-hashed files after the first visit. If true
 * offline matters later, a service worker precaching these three URLs is the
 * fix, and nothing outside this file changes.
 */
const URLS: Record<ScenarioYears, string> = {
  5: url5,
  25: url25,
  100: url100,
};

const cache = new Map<ScenarioYears, HazardCollection>();

/** Empty collection so the map can render its layers before data arrives. */
export const EMPTY: HazardCollection = {
  type: "FeatureCollection",
  features: [],
};

export async function loadScenario(
  years: ScenarioYears,
): Promise<HazardCollection> {
  const hit = cache.get(years);
  if (hit) return hit;

  const res = await fetch(URLS[years]);
  if (!res.ok) {
    throw new Error(`Could not load the ${years}-year hazard data (${res.status})`);
  }
  const fc = (await res.json()) as HazardCollection;
  cache.set(years, fc);
  return fc;
}

/**
 * This is the real UP NOAH flood hazard model for Davao del Norte, clipped to
 * Panabo City — not placeholder geometry.
 *
 * It is still a MODEL. "Not placeholder" means the polygons come from the
 * national hazard assessment, not that they describe water on the ground now.
 * The disclaimer stands.
 */
export const DATA_IS_PLACEHOLDER = false;
