/**
 * Converts the real UP NOAH flood hazard shapefiles into the app's GeoJSON.
 *
 * Source: bettergovph/project-noah-hazard-maps on Hugging Face — the Project
 * NOAH hazard maps republished as per-province ESRI shapefiles, ODC-ODbL.
 *
 *   Flood/{5yr,25yr,100yr}/{DavaoDelSur,DavaoDelNorte}.zip
 *
 * Both provinces are needed and then clipped to the city outline. Davao City
 * is administratively in Davao del Sur, but its northern districts run into
 * Davao del Norte's sheet, so one province alone truncates the city.
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
 * Run:  pnpm --filter @davflood/hazard build:noah -- <dir-with-extracted-shapefiles>
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* The shapefile reader, the city clip and the geometry helpers live in
   ./noah-shapefile.ts — the landslide converter reads the identical format
   and must clip to the identical outline, and two copies of a hand-rolled
   shapefile parser is exactly one copy too many. */
import {
	areaM2,
	centroidOf,
	nearestBarangay,
	readShapefile,
	readVarColumn,
	round,
	shapefilesUnder,
	signedArea,
	simplify,
} from "./noah-shapefile";
import type { Ring } from "./noah-shapefile";
import type { HazardCollection, HazardFeature } from "../src/schema";
import type { ScenarioYears } from "../src/scenarios";
import { hazardTiers } from "../src/tiers";
import type { HazardId } from "../src/tiers";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

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

	const shapefiles = shapefilesUnder(dir);
	if (shapefiles.length === 0) {
		console.error(`no .shp under ${dir}`);
		process.exit(1);
	}

	const rings: Ring[] = [];
	const recordOf: number[] = [];
	const vars: number[] = [];
	for (const shpPath of shapefiles) {
		const base = shpPath.replace(/\.shp$/i, "");
		const part = readShapefile(shpPath);
		const partVars = readVarColumn(`${base}.dbf`);
		// offset record indices so the merged files do not collide
		const offset = vars.length;
		for (let i = 0; i < part.rings.length; i++) {
			rings.push(part.rings[i]!);
			recordOf.push(part.recordOf[i]! + offset);
		}
		vars.push(...partVars);
	}

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
	const path = join(OUT_DIR, `davao-${years}.json`);
	const json = JSON.stringify(fc);
	writeFileSync(path, `${json}\n`, "utf8");

	const byClass = features.reduce<Record<string, number>>((a, f) => {
		a[f.properties.hazard] = (a[f.properties.hazard] ?? 0) + 1;
		return a;
	}, {});
	console.log(
		`davao-${years}.json  ${shapefiles.length} src  ${features.length} features ` +
			`(low ${byClass["low"] ?? 0} / med ${byClass["medium"] ?? 0} / high ${byClass["high"] ?? 0})  ` +
			`${(json.length / 1024).toFixed(0)} KB`,
	);
}
