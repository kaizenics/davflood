/**
 * Converts the real UP NOAH flood hazard shapefiles into the app's GeoJSON.
 *
 * Source: bettergovph/project-noah-hazard-maps on Hugging Face — the Project
 * NOAH hazard maps republished as per-province ESRI shapefiles, ODC-ODbL.
 * We take Davao del Norte and clip it to Panabo City.
 *
 *   Flood/{5yr,25yr,100yr}/DavaoDelNorte.zip
 *
 * The shapefiles are already GCS_WGS_1984, so no reprojection is needed. Each
 * file holds exactly three records — the province dissolved into one polygon
 * per hazard class — with a single `Var` attribute: 1 = low, 2 = medium,
 * 3 = high. Those are the UP NOAH classes our depth bands already describe.
 *
 * A minimal shapefile reader is implemented here on purpose: GDAL is not
 * installed, and this avoids putting a toolchain on anyone's machine to
 * rebuild a data file. The format is stable and documented, and this only has
 * to handle polygons.
 *
 * Run:  pnpm --filter @naboflood/hazard build:noah -- <dir-with-extracted-shapefiles>
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { barangays } from "../src/barangays";
import { PANABO_BBOX } from "../src/geo";
import type { HazardCollection, HazardFeature } from "../src/schema";
import type { ScenarioYears } from "../src/scenarios";
import { hazardTiers } from "../src/tiers";
import type { HazardId } from "../src/tiers";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

/** A little slack so polygons are not sheared exactly at the camera bound. */
const PAD = 0.02;
const [W, S, E, N] = [
	PANABO_BBOX[0] - PAD,
	PANABO_BBOX[1] - PAD,
	PANABO_BBOX[2] + PAD,
	PANABO_BBOX[3] + PAD,
];

type Ring = [number, number][];

/* ---------------- shapefile (.shp) ---------------- */

function readShapefile(path: string): { rings: Ring[]; recordOf: number[] } {
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

		// 5 = Polygon. Anything else in a flood layer is not something we can use.
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

				// keep only rings that touch Panabo — the province file covers a
				// far larger area than the app ever shows
				if (maxX >= W && minX <= E && maxY >= S && minY <= N && ring.length >= 4) {
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

function readVarColumn(path: string): number[] {
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
function signedArea(r: Ring): number {
	let a = 0;
	for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
		a += r[j]![0] * r[i]![1] - r[i]![0] * r[j]![1];
	}
	return a / 2;
}

/** Douglas–Peucker. NOAH polygons carry far more detail than a city map shows. */
function simplify(ring: Ring, tol: number): Ring {
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

function centroidOf(ring: Ring): [number, number] {
	let x = 0;
	let y = 0;
	for (const [px, py] of ring) {
		x += px;
		y += py;
	}
	return [x / ring.length, y / ring.length];
}

function nearestBarangay([cx, cy]: [number, number]): string {
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

const round = (r: Ring): Ring =>
	r.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);

/* ---------------- build ---------------- */

const SRC = process.argv[2];
if (!SRC) {
	console.error("usage: build:noah -- <dir containing 5yr/ 25yr/ 100yr/>");
	process.exit(1);
}

/**
 * NOAH hazard polygons are derived from a raster model, so the raw export is
 * full of single-cell slivers — the first pass produced 40,000 polygons and
 * 32 MB, which is not something to hand a phone on a bad connection.
 *
 * Two filters bring it back to a sane size without losing anything a reader
 * could act on:
 *   - simplify to ~22 m, comfortably finer than the model itself resolves
 *   - drop fragments below a quarter of a hectare (2500 m²), which are noise
 *     at city scale, not places anyone lives
 */
const TOLERANCE = 0.0002; // ~22 m
const MIN_AREA_M2 = 2500;

/** Metres per degree at Panabo's latitude — good enough for an area filter. */
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * Math.cos((7.3 * Math.PI) / 180);

function areaM2(ring: Ring): number {
	return Math.abs(signedArea(ring)) * M_PER_DEG_LAT * M_PER_DEG_LON;
}
const bands: Record<HazardId, [number, number]> = {
	low: [hazardTiers[0]!.depthMin, hazardTiers[0]!.depthMax ?? 0.5],
	medium: [hazardTiers[1]!.depthMin, hazardTiers[1]!.depthMax ?? 1.5],
	// NOAH's high class is open-ended (">1.5 m"). depth_max 0 makes
	// formatDepth render "over 1.5 m" rather than inventing a ceiling.
	high: [hazardTiers[2]!.depthMin, 0],
};
const classOf: Record<number, HazardId> = { 1: "low", 2: "medium", 3: "high" };

mkdirSync(OUT_DIR, { recursive: true });

for (const years of [5, 25, 100] as const satisfies readonly ScenarioYears[]) {
	const dir = join(SRC, `${years}yr`);
	const shp = readdirSync(dir).find((f) => f.toLowerCase().endsWith(".shp"));
	if (!shp) {
		console.error(`no .shp in ${dir}`);
		process.exit(1);
	}
	const base = join(dir, shp.replace(/\.shp$/i, ""));

	const { rings, recordOf } = readShapefile(`${base}.shp`);
	const vars = readVarColumn(`${base}.dbf`);

	const features: HazardFeature[] = [];
	let current: { hazard: HazardId; rings: Ring[] } | null = null;
	let index = 0;

	const flush = () => {
		if (!current || current.rings.length === 0) return;
		const [dmin, dmax] = bands[current.hazard];
		features.push({
			type: "Feature",
			properties: {
				zone_id: `noah-${years}-${current.hazard}-${index++}`,
				hazard: current.hazard,
				depth_min: dmin,
				depth_max: dmax,
				barangay: nearestBarangay(centroidOf(current.rings[0]!)),
				scenario: years,
			},
			geometry: { type: "Polygon", coordinates: current.rings },
		});
		current = null;
	};

	for (let i = 0; i < rings.length; i++) {
		const hazard = classOf[vars[recordOf[i]!] ?? 0];
		if (!hazard) continue;

		const simplified = round(simplify(rings[i]!, TOLERANCE));
		if (simplified.length < 4) continue;
		// close the ring if simplification opened it
		const first = simplified[0]!;
		const last = simplified[simplified.length - 1]!;
		if (first[0] !== last[0] || first[1] !== last[1]) simplified.push([...first]);

		// shapefile outer rings are clockwise -> negative area; holes follow them
		const area = signedArea(simplified);
		if (area < 0) {
			flush();
			// drop sliver polygons outright rather than shipping 20k of them
			if (areaM2(simplified) < MIN_AREA_M2) continue;
			current = { hazard, rings: [simplified] };
		} else if (current && current.hazard === hazard) {
			// keep only holes big enough to matter; tiny ones just add points
			if (areaM2(simplified) >= MIN_AREA_M2) current.rings.push(simplified);
		}
	}
	flush();

	const fc: HazardCollection = { type: "FeatureCollection", features };
	const path = join(OUT_DIR, `panabo-${years}.json`);
	const json = JSON.stringify(fc);
	writeFileSync(path, `${json}\n`, "utf8");

	const byClass = features.reduce<Record<string, number>>((a, f) => {
		a[f.properties.hazard] = (a[f.properties.hazard] ?? 0) + 1;
		return a;
	}, {});
	console.log(
		`panabo-${years}.json  ${features.length} features ` +
			`(low ${byClass["low"] ?? 0} / med ${byClass["medium"] ?? 0} / high ${byClass["high"] ?? 0})  ` +
			`${(json.length / 1024).toFixed(0)} KB`,
	);
}
