import { EVACUATION_SITES } from "./evacuation-data";
import type { LngLat } from "./geo";
import type { ScenarioYears } from "./scenarios";

/**
 * Somewhere to go.
 *
 * The map can say how deep the water gets and which way is out of it. Neither
 * is an answer to "where do I take my family", and this is the closest an app
 * can honestly get: the large public buildings — schools, covered courts,
 * halls — that the model does not flood in the scenario being looked at.
 *
 * NOT designated evacuation centres. That is the barangay's decision and the
 * DRRM office's list; OpenStreetMap only knows where the buildings are. The
 * wording in the UI never promises more than "public building, on ground this
 * scenario does not flood", because promising more would be inventing policy
 * on a safety map.
 */

export type EvacuationSite = {
  name: string;
  /** "School", "Covered court", "Hall" … */
  kind: string;
  center: LngLat;
  /** return periods whose footprint covers it — dry ones are what we offer */
  floodedIn: ScenarioYears[];
};

const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 111_320;

const COMPASS = [
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
];

export type NearestSite = {
  site: EvacuationSite;
  /** straight-line metres */
  meters: number;
  direction: string;
};

/** Flat-earth distance, which is exact enough across one city. */
function metersBetween(a: LngLat, b: LngLat): number {
  const cosLat = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dx = (b[0] - a[0]) * M_PER_DEG_LNG * cosLat;
  const dy = (b[1] - a[1]) * M_PER_DEG_LAT;
  return Math.sqrt(dx * dx + dy * dy);
}

function directionFrom(a: LngLat, b: LngLat): string {
  const cosLat = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dx = (b[0] - a[0]) * M_PER_DEG_LNG * cosLat;
  const dy = (b[1] - a[1]) * M_PER_DEG_LAT;
  const degrees = (Math.atan2(dx, dy) * 180) / Math.PI;
  return COMPASS[Math.round(((degrees + 360) % 360) / 45) % 8] ?? "nearby";
}

/**
 * The closest building the given scenario does not flood.
 *
 * Linear over a few hundred sites, which is faster than any index would be at
 * this size and cannot go stale.
 */
export function nearestEvacuation(
  from: LngLat,
  scenario: ScenarioYears,
  maxMeters = 8000,
): NearestSite | null {
  let best: NearestSite | null = null;

  for (const site of EVACUATION_SITES) {
    if (site.floodedIn.includes(scenario)) continue;
    const meters = metersBetween(from, site.center);
    if (meters > maxMeters) continue;
    if (!best || meters < best.meters) {
      best = { site, meters, direction: directionFrom(from, site.center) };
    }
  }

  return best;
}

/**
 * A walking route in whatever maps app the phone has.
 *
 * Deliberately a hand-off. Turn-by-turn needs a road network and a live view
 * of what is passable, and this app has neither — what it must not do is draw
 * a confident line through a flooded street. Google Maps will route badly
 * during a flood too, but it is not the one claiming to know about floods, and
 * the button says as much.
 */
export function directionsUrl(to: LngLat): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to[1]},${to[0]}&travelmode=walking`;
}

export { EVACUATION_SITES };
