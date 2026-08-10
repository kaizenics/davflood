import type { Position } from "geojson";

import type { LngLat } from "./geo";
import type { HazardCollection } from "./schema";

/**
 * The nearest ground the model does not flood.
 *
 * The map has always been able to say how deep the water gets where you are.
 * It has never been able to say the next thing anyone asks, which is which way
 * to walk. This answers that from the polygons already on screen — no new
 * data, no service, and it works with the network down.
 *
 * WHAT IT IS NOT: a route, and not a safe place. It is the closest point that
 * falls outside the modelled footprint for the scenario being viewed, in a
 * straight line, ignoring rivers, walls and everything else between here and
 * there. Higher and safer ground may be further away, and an evacuation centre
 * is a decision for the barangay, not for a straight line on a map. The UI has
 * to keep saying so.
 */

const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 111_320;

type Indexed = {
  /** [west, south, east, north] */
  bbox: [number, number, number, number];
  rings: Position[][];
};

/**
 * Bounding boxes for every polygon, built once per dataset.
 *
 * The search asks "is this point flooded" several hundred times, and each ask
 * would otherwise walk every ring of every polygon — thousands of them. The
 * box test rejects almost all of that for the cost of four comparisons.
 */
const indexCache = new WeakMap<HazardCollection, Indexed[]>();

function indexOf(fc: HazardCollection): Indexed[] {
  const hit = indexCache.get(fc);
  if (hit) return hit;

  const built: Indexed[] = [];
  for (const f of fc.features) {
    const rings = f.geometry?.coordinates;
    const outer = rings?.[0];
    if (!rings || !outer?.length) continue;

    let w = Infinity;
    let s = Infinity;
    let e = -Infinity;
    let n = -Infinity;
    for (const p of outer) {
      const x = p[0] ?? 0;
      const y = p[1] ?? 0;
      if (x < w) w = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    }
    built.push({ bbox: [w, s, e, n], rings });
  }

  indexCache.set(fc, built);
  return built;
}

/** Ray casting, on one ring. */
function inRing(ring: Position[], lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (!a || !b) continue;
    const ax = a[0] ?? 0;
    const ay = a[1] ?? 0;
    const bx = b[0] ?? 0;
    const by = b[1] ?? 0;
    if (ay > lat !== by > lat && lng < ((bx - ax) * (lat - ay)) / (by - ay) + ax) {
      inside = !inside;
    }
  }
  return inside;
}

/** Is this point inside any modelled flood zone? */
export function isFlooded(fc: HazardCollection, [lng, lat]: LngLat): boolean {
  for (const poly of indexOf(fc)) {
    const [w, s, e, n] = poly.bbox;
    if (lng < w || lng > e || lat < s || lat > n) continue;
    const outer = poly.rings[0];
    if (!outer || !inRing(outer, lng, lat)) continue;
    // a hole means the water goes round this bit, not over it
    let inHole = false;
    for (let i = 1; i < poly.rings.length; i++) {
      const hole = poly.rings[i];
      if (hole && inRing(hole, lng, lat)) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

export type SafeGround = {
  center: LngLat;
  /** straight-line distance, metres */
  meters: number;
  /** compass point, e.g. "north-east" */
  direction: string;
};

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

/**
 * Search outwards in rings until a sample lands outside the footprint.
 *
 * Sixteen bearings at a hundred-metre step: fine enough that the answer is
 * useful on foot, coarse enough to stay instant. Nearest ring first, so the
 * first hit is the nearest.
 */
export function nearestSafeGround(
  fc: HazardCollection,
  from: LngLat,
  maxMeters = 4000,
): SafeGround | null {
  if (fc.features.length === 0) return null;
  if (!isFlooded(fc, from)) return null; // already out of it

  const [lng, lat] = from;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const bearings = 16;

  for (let r = 100; r <= maxMeters; r += 100) {
    for (let b = 0; b < bearings; b++) {
      const theta = (b / bearings) * 2 * Math.PI;
      const dLat = (r * Math.cos(theta)) / M_PER_DEG_LAT;
      const dLng = (r * Math.sin(theta)) / (M_PER_DEG_LNG * cosLat);
      const point: LngLat = [lng + dLng, lat + dLat];
      if (isFlooded(fc, point)) continue;

      const degrees = (theta * 180) / Math.PI;
      const index = Math.round(degrees / 45) % 8;
      return {
        center: point,
        meters: r,
        direction: COMPASS[index] ?? "nearby",
      };
    }
  }

  return null;
}

/** "600 m" / "1.2 km" — walking distances, read at a glance. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
