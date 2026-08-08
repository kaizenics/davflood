import type { Position } from "geojson";

import type { HazardCollection } from "./schema";
import type { HazardId } from "./tiers";

/**
 * How much of the city each hazard tier actually covers.
 *
 * A return period on its own is an abstraction — "25-year storm" tells a
 * resident nothing about scale. The area it floods, and how that area splits
 * between ankle-deep and over-your-head, is the thing that makes switching
 * scenarios mean something.
 *
 * Measured from the same polygons the map draws, so the figure can never
 * disagree with what is on screen.
 */

export type Footprint = {
	/** square kilometres, per tier */
	km2: Record<HazardId, number>;
	/** the three tiers summed */
	totalKm2: number;
	/** each tier's share of the flooded footprint, 0–1 */
	share: Record<HazardId, number>;
	/** how many polygons went into it */
	zones: number;
};

/** WGS84 mean — good to ~0.1% across a city-sized extent. */
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 111_320;

/**
 * Shoelace area of one ring, in square metres.
 *
 * The ring is projected to a local equirectangular plane first: at Davao's
 * latitude a degree of longitude is ~0.99 of a degree of latitude, and
 * ignoring that would overstate every east-west span by a percent. Good
 * enough for a summary figure, and it needs no projection library.
 */
function ringArea(ring: Position[], cosLat: number): number {
	let sum = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const a = ring[i];
		const b = ring[j];
		if (!a || !b) continue;
		const ax = (a[0] ?? 0) * M_PER_DEG_LNG * cosLat;
		const ay = (a[1] ?? 0) * M_PER_DEG_LAT;
		const bx = (b[0] ?? 0) * M_PER_DEG_LNG * cosLat;
		const by = (b[1] ?? 0) * M_PER_DEG_LAT;
		sum += bx * ay - ax * by;
	}
	return Math.abs(sum) / 2;
}

const ZERO: Record<HazardId, number> = { low: 0, medium: 0, high: 0 };

/**
 * The tiers are a classification of the same raster, so they tile rather than
 * overlap and the areas are safe to add.
 *
 * Measured AFTER ./smooth has rounded the rings, which is deliberate: the
 * figure has to describe the polygons on screen, not a set the user cannot
 * see. Smoothing takes ~2.6% off the total, and the rings it works from carry
 * 100 m edges to begin with — between them, that is why every figure this
 * feeds is prefixed "about".
 */
export function footprintOf(fc: HazardCollection): Footprint {
	const km2: Record<HazardId, number> = { ...ZERO };
	let zones = 0;

	for (const f of fc.features) {
		const rings = f.geometry?.coordinates;
		const tier = f.properties?.hazard;
		if (!rings || !tier) continue;

		const outer = rings[0];
		const first = outer?.[0];
		if (!outer || !first) continue;

		const cosLat = Math.cos(((first[1] ?? 0) * Math.PI) / 180);
		// ring 0 is the exterior; the rest are holes and come back off it
		let m2 = ringArea(outer, cosLat);
		for (let i = 1; i < rings.length; i++) {
			const hole = rings[i];
			if (hole) m2 -= ringArea(hole, cosLat);
		}

		km2[tier] += Math.max(0, m2) / 1_000_000;
		zones++;
	}

	const totalKm2 = km2.low + km2.medium + km2.high;
	const share: Record<HazardId, number> =
		totalKm2 > 0
			? {
					low: km2.low / totalKm2,
					medium: km2.medium / totalKm2,
					high: km2.high / totalKm2,
				}
			: { ...ZERO };

	return { km2, totalKm2, share, zones };
}

/**
 * Whole km² once the number is big enough to carry it, one decimal below 10.
 * Every one of these is prefixed with "about" in the UI — a simplified
 * polygon set does not deserve four significant figures.
 */
export function formatArea(km2: number): string {
	if (km2 >= 100) return Math.round(km2).toLocaleString("en-PH");
	if (km2 >= 10) return km2.toFixed(0);
	return km2.toFixed(1);
}
