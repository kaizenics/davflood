import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { barangays } from "../src/barangays";
import boundary from "../src/data/davao-boundary.json" with { type: "json" };

/**
 * Reading NOAH's ESRI shapefiles, and clipping them to Davao City.
 *
 * Extracted from build-noah-data.ts when the landslide converter needed the
 * same reader. Both hazards ship as province-wide shapefiles with one dissolved
 * polygon per class and a single numeric attribute — flood calls it `Var`,
 * landslide calls it `LH`, and they carry the identical 1/2/3 low/medium/high
 * coding. Two converters, one format.
 *
 * A minimal shapefile reader is implemented here on purpose: GDAL is not
 * installed, and this avoids putting a toolchain on anyone's machine to
 * rebuild a data file. The format is stable and documented, and this only has
 * to handle polygons.
 */

export type Ring = [number, number][];

/**
 * Davao City's real outline, from OpenStreetMap via build-admin-data.ts.
 *
 * Clipping to a bounding box is not good enough here. Davao City's bbox also
 * contains Panabo City to the north-east, so a rectangular clip shipped
 * Panabo's flood polygons inside a map captioned "Davao City" — hazard data
 * attributed to the wrong local government. The outline is the only honest
 * boundary.
 */
const CITY: Ring = (boundary.geometry.coordinates[0] as [number, number][]) ?? [];

/** A little slack so polygons are not sheared exactly at the camera bound. */
const PAD = 0.02;
const [W, S, E, N] = [
	Math.min(...CITY.map((p) => p[0])) - PAD,
	Math.min(...CITY.map((p) => p[1])) - PAD,
	Math.max(...CITY.map((p) => p[0])) + PAD,
	Math.max(...CITY.map((p) => p[1])) + PAD,
];

/** Ray-casting point-in-polygon. */
function inCity([x, y]: [number, number]): boolean {
	let inside = false;
	for (let i = 0, j = CITY.length - 1; i < CITY.length; j = i++) {
		const [xi, yi] = CITY[i]!;
		const [xj, yj] = CITY[j]!;
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

/**
 * Whether a hazard ring belongs to Davao City.
 *
 * NOAH's rings are fine-grained — hundreds of thousands per province — so each
 * one is small relative to the city and sampling a dozen vertices settles it.
 *
 * The test is deliberately "mostly inside", not "touches". Rings are kept or
 * dropped whole, never cut, so accepting anything that merely grazes the
 * border pulled entire Panabo-side polygons back in and pushed the 100-year
 * layer 12 km past the city's northern tip. Requiring the majority of the ring
 * to be in Davao attributes each polygon to the city that actually contains
 * it. The centroid alone would be cheaper but misreads rings lying in a
 * concavity of the outline, so it only breaks ties.
 */
export function ringInCity(ring: Ring): boolean {
	const step = Math.max(1, Math.floor(ring.length / 12));
	let sampled = 0;
	let inside = 0;
	for (let i = 0; i < ring.length; i += step) {
		sampled++;
		if (inCity(ring[i]!)) inside++;
	}
	if (sampled > 0 && inside * 2 >= sampled) return true;

	let sx = 0;
	let sy = 0;
	for (const [x, y] of ring) {
		sx += x;
		sy += y;
	}
	return inCity([sx / ring.length, sy / ring.length]);
}

/* ---------------- shapefile (.shp) ---------------- */

export function readShapefile(path: string): {
	rings: Ring[];
	recordOf: number[];
} {
	const buf = readFileSync(path);
	const rings: Ring[] = [];
	const recordOf: number[] = []; // which record each ring came from
	let off = 100; // skip the file header
	let record = 0;

	while (off < buf.length) {
		// record header is big-endian; content length is in 16-bit words
		const contentWords = buf.readInt32BE(off + 4);
		let p = off + 8;
		const shapeType = buf.readInt32LE(p);

		// 5 = Polygon. Anything else in a hazard layer is not something we can use.
		if (shapeType === 5) {
			p += 4 + 32; // shape type + bbox
			const numParts = buf.readInt32LE(p);
			p += 4;
			const numPoints = buf.readInt32LE(p);
			p += 4;

			const parts: number[] = [];
			for (let i = 0; i < numParts; i++) parts.push(buf.readInt32LE(p + i * 4));
			p += numParts * 4;

			for (let i = 0; i < numParts; i++) {
				const start = parts[i]!;
				const end = i + 1 < numParts ? parts[i + 1]! : numPoints;
				const ring: Ring = [];
				let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

				for (let j = start; j < end; j++) {
					const x = buf.readDoubleLE(p + j * 16);
					const y = buf.readDoubleLE(p + j * 16 + 8);
					ring.push([x, y]);
					if (x < minX) minX = x;
					if (x > maxX) maxX = x;
					if (y < minY) minY = y;
					if (y > maxY) maxY = y;
				}

				// Keep only rings inside Davao City. The province files cover a far
				// larger area, and the city's bbox overlaps Panabo City, so the
				// bbox is only a cheap reject before the real outline test.
				const near = maxX >= W && minX <= E && maxY >= S && minY <= N;
				if (near && ring.length >= 4 && ringInCity(ring)) {
					rings.push(ring);
					recordOf.push(record);
				}
			}
		}

		off += 8 + contentWords * 2;
		record++;
	}

	return { rings, recordOf };
}

/* ---------------- attributes (.dbf) ---------------- */

/**
 * The one numeric column.
 *
 * Both NOAH layers carry exactly one field — flood `Var`, landslide `LH` —
 * so the whole record after the deletion flag is that value, and it does not
 * matter what the field is called. Landslide stores it in scientific notation
 * ("1.00000000000e+000"); Number() reads both spellings.
 */
export function readVarColumn(path: string): number[] {
	const b = readFileSync(path);
	const count = b.readInt32LE(4);
	const headerLen = b.readInt16LE(8);
	const recLen = b.readInt16LE(10);
	const out: number[] = [];
	for (let i = 0; i < count; i++) {
		const start = headerLen + i * recLen + 1; // +1 skips the deletion flag
		out.push(Number(b.toString("ascii", start, start + recLen - 1).trim()));
	}
	return out;
}

/* ---------------- geometry helpers ---------------- */

/** Shapefile winding: outer rings are clockwise (negative shoelace area). */
export function signedArea(r: Ring): number {
	let a = 0;
	for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
		a += r[j]![0] * r[i]![1] - r[i]![0] * r[j]![1];
	}
	return a / 2;
}

/** Douglas–Peucker. NOAH polygons carry far more detail than a city map shows. */
export function simplify(ring: Ring, tol: number): Ring {
	if (ring.length <= 4) return ring;
	const keep = new Uint8Array(ring.length);
	keep[0] = 1;
	keep[ring.length - 1] = 1;
	const stack: [number, number][] = [[0, ring.length - 1]];

	while (stack.length) {
		const [first, last] = stack.pop()!;
		let maxD = -1;
		let idx = -1;
		const [x1, y1] = ring[first]!;
		const [x2, y2] = ring[last]!;
		const dx = x2 - x1;
		const dy = y2 - y1;
		const denom = dx * dx + dy * dy;

		for (let i = first + 1; i < last; i++) {
			const [px, py] = ring[i]!;
			let d: number;
			if (denom === 0) {
				d = (px - x1) ** 2 + (py - y1) ** 2;
			} else {
				let t = ((px - x1) * dx + (py - y1) * dy) / denom;
				t = Math.max(0, Math.min(1, t));
				d = (px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2;
			}
			if (d > maxD) {
				maxD = d;
				idx = i;
			}
		}

		if (maxD > tol * tol && idx > 0) {
			keep[idx] = 1;
			stack.push([first, idx], [idx, last]);
		}
	}

	const out: Ring = [];
	for (let i = 0; i < ring.length; i++) if (keep[i]) out.push(ring[i]!);
	return out;
}

export function centroidOf(ring: Ring): [number, number] {
	let x = 0;
	let y = 0;
	for (const [px, py] of ring) {
		x += px;
		y += py;
	}
	return [x / ring.length, y / ring.length];
}

/**
 * The barangay whose centroid is closest.
 *
 * An attribution, not a spatial join: two thirds of Davao's barangays have no
 * boundary in OSM, so "which barangay contains this polygon" is a question
 * that cannot be answered for most of the city. What this gives is the
 * nearest named place, which is what a zone panel needs in order to say
 * "Brgy. Matina Crossing" rather than a bare coordinate.
 *
 * Where it is NOT good enough is measuring how much of a barangay floods —
 * see the note in build-barangay-profiles.ts, which grid-samples the real
 * outlines instead precisely because this tag drifts near boundaries.
 */
export function nearestBarangay([cx, cy]: [number, number]): string {
	let best = barangays[0]!;
	let bestD = Infinity;
	for (const b of barangays) {
		const d = (b.center[0] - cx) ** 2 + (b.center[1] - cy) ** 2;
		if (d < bestD) {
			bestD = d;
			best = b;
		}
	}
	return best.name;
}

export const round = (r: Ring): Ring =>
	r.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);

/** Metres per degree at Davao's latitude — good enough for an area filter. */
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * Math.cos((7.3 * Math.PI) / 180);

export function areaM2(ring: Ring): number {
	return Math.abs(signedArea(ring)) * M_PER_DEG_LAT * M_PER_DEG_LON;
}

/**
 * Every .shp under a directory of per-province folders.
 *
 * Davao City straddles what NOAH still files under two provinces — the city is
 * administratively in Davao del Sur, but its northern districts (Paquibato,
 * Marilog) run up against Davao del Norte. Merging both and clipping to the
 * city outline is the only way to get the WHOLE city; taking one province
 * alone silently truncates the north.
 */
export function shapefilesUnder(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const sub = join(dir, entry);
		if (!statSync(sub).isDirectory()) continue;
		for (const f of readdirSync(sub)) {
			if (f.toLowerCase().endsWith(".shp")) out.push(join(sub, f));
		}
	}
	return out;
}
