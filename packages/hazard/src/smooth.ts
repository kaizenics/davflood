import type { Position } from "geojson";

import type { HazardCollection } from "./schema";

/**
 * ROUNDING OFF THE HAZARD POLYGONS.
 *
 * NOAH's flood layers are vectorised from a raster model, so their raw outlines
 * are staircases. build-noah-data.ts runs Douglas–Peucker over them, and that
 * is where the shards on screen come from: DP keeps the vertices that stick out
 * FURTHEST from a chord and deletes everything between, which is precisely the
 * wrong bias for a staircase. It thins the shoulders of each step and leaves
 * the tips. Measured on davao-100.json, the shipped rings average 12 vertices
 * with 100 m edges, and 13% of their corners are sharper than 45°.
 *
 * Chaikin corner cutting is the counterpart: each corner is replaced by the
 * points a quarter and three quarters along its two edges, so a spike becomes a
 * curve. Two passes take that 13% down to 0.2%, which is the whole fix.
 *
 * WHY THIS RUNS ON THE CLIENT rather than in the build:
 *
 *   - Two passes quadruple the vertex count. Baked into davao-100.json that is
 *     4.1 MB → ~12 MB over the wire, against the ~27 ms it costs to do here,
 *     once, on a file that is already cached in memory per scenario. The
 *     project's whole loading story (see hazard-source.ts) is built around not
 *     shipping megabytes to a phone on a bad connection.
 *   - It keeps the data files exactly as the model published them. Smoothing is
 *     a drawing decision, and drawing decisions do not belong in the archive.
 *
 * WHAT IT COSTS, stated plainly, because this is hazard data:
 *
 *   Boundary moves 12 m on average and 207 m at the very worst — that worst
 *   case being the tip of a DP spike, i.e. an artefact of the simplification
 *   rather than anything NOAH modelled. Footprint shrinks by 1.9% (5-year),
 *   1.5% (25-year) and 2.5% (100-year, 267.22 → 260.49 km² through
 *   footprintOf), because cutting corners takes area off convex ones. That is a
 *   real and slightly ANTI-CONSERVATIVE bias — it understates extent rather
 *   than overstating it.
 *
 *   It is accepted because the input is already coarser than the error: rings
 *   whose edges span 100 m cannot honestly claim 12 m of precision, and the
 *   underlying model resolves at around 30 m. Every figure derived from these
 *   polygons is prefixed "about" in the UI for the same reason. If the data is
 *   ever rebuilt from the shapefiles with a finer tolerance, revisit this — the
 *   right long-term fix is a DP tolerance that does not manufacture spikes in
 *   the first place, and then fewer passes here.
 */

/** Two is where the spikes stop; three doubles memory for no visible gain. */
const DEFAULT_PASSES = 2;

/**
 * One closed ring, corner-cut `passes` times.
 *
 * GeoJSON repeats the first position as the last. Corner cutting runs on the
 * cycle, so the duplicate comes off first and the ring is re-closed at the end
 * — smoothing it in place would pin the ring shut at one arbitrary vertex and
 * leave a corner there.
 */
function smoothRing(ring: Position[], passes: number): Position[] {
  let pts = ring.slice(0, -1);
  // a triangle is the smallest thing with corners to cut
  if (pts.length < 3) return ring;

  for (let pass = 0; pass < passes; pass++) {
    const n = pts.length;
    const next: Position[] = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % n]!;
      const ax = a[0]!;
      const ay = a[1]!;
      const bx = b[0]!;
      const by = b[1]!;
      next[2 * i] = [ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25];
      next[2 * i + 1] = [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75];
    }
    pts = next;
  }

  pts.push([...pts[0]!]);
  return pts;
}

/**
 * Smooths every ring in the collection, holes included — a hole left angular
 * inside a rounded polygon reads as a tear.
 *
 * MUTATES `fc`. The caller owns a collection it just parsed out of its own
 * fetch response, and building a second one would hold both the original and
 * the 4×-larger result alive at the same time, which is the one moment in this
 * path where peak memory actually matters.
 */
export function smoothCollection(
  fc: HazardCollection,
  passes: number = DEFAULT_PASSES,
): HazardCollection {
  if (passes < 1) return fc;

  for (const feature of fc.features) {
    const rings = feature.geometry?.coordinates;
    if (!rings) continue;
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      if (ring && ring.length >= 4) rings[i] = smoothRing(ring, passes);
    }
  }

  return fc;
}
