/**
 * Converts the UP NOAH landslide susceptibility shapefiles into the app's
 * GeoJSON, clipped to Davao City.
 *
 * Source: bettergovph/project-noah-hazard-maps on Hugging Face, ODC-ODbL —
 * the same republication the flood layer comes from.
 *
 *   Landslide/LandslideHazards/{DavaoDelSur,DavaoDelNorte}.zip
 *
 * Both provinces, for the reason build-noah-data.ts spells out: the city is
 * filed under Davao del Sur but its northern districts run into Davao del
 * Norte's sheet, and one province alone truncates exactly the upland half
 * this layer exists to cover.
 *
 * The format is identical to the flood sheets — dissolved polygons, one
 * numeric attribute per record — so the reader, the city clip and the
 * geometry helpers are shared from ./noah-shapefile.ts. The differences are
 * only these:
 *
 *   - the attribute is `LH`, not `Var`, and is stored in scientific notation
 *     ("1.00000000000e+000"). Same 1/2/3 low/medium/high coding.
 *   - there is ONE output, not three. Susceptibility has no return period —
 *     see ../src/landslide.ts for why that makes it an overlay rather than a
 *     fourth scenario.
 *   - no depth band, because slope susceptibility has no depth. Nothing
 *     downstream may put metres beside it.
 *
 * Run:  pnpm --filter @davflood/hazard build:landslide -- <dir-with-shapefiles>
 *
 * The directory holds one folder per province, each containing the extracted
 * .shp/.dbf pair.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { LandslideId } from "../src/landslide";
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

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

/**
 * Simplification and the sliver floor, both looser than the flood layer's.
 *
 * The flood sheets are a raster model of standing water and come out as a few
 * thousand blobs. The landslide sheets are a slope model over 1 m LiDAR across
 * a mountainous province, and Davao City's share of them is an order of
 * magnitude more geometry — the raw clip is hundreds of thousands of rings,
 * most of them a single gully a few metres across.
 *
 * ~44 m and a one-hectare floor bring 442,000 clipped rings down to ~5,400
 * features and 0.63 MB gzipped — the same size class as the 100-year flood
 * layer, which is the budget a second overlay has to fit in. At the tighter
 * ~33 m / half-hectare setting the flood layer uses it came to 9,800 features
 * and 4.9 MB, which is not something to hand a phone on a bad connection.
 *
 * The looser setting is defensible here in a way it would not be for flood: a
 * flood polygon's edge is a water level and means something precise, while a
 * susceptibility class is a modelled property of a slope whose boundary is
 * inherently fuzzy. What is lost is individual gullies, below the resolution
 * anyone reads a city map at; what is kept is every slope large enough to sit
 * under a house.
 */
const TOLERANCE = 0.0004; // ~44 m
const MIN_AREA_M2 = 10000; // one hectare

const classOf: Record<number, LandslideId> = {
	1: "low",
	2: "medium",
	3: "high",
};

type LandslideFeature = {
	type: "Feature";
	properties: {
		zone_id: string;
		hazard: LandslideId;
		barangay: string;
	};
	geometry: { type: "Polygon"; coordinates: Ring[] };
};

const SRC = process.argv[2];
if (!SRC) {
	console.error("usage: build:landslide -- <dir with one folder per province>");
	process.exit(1);
}

const shapefiles = shapefilesUnder(SRC);
if (shapefiles.length === 0) {
	console.error(`no .shp under ${SRC}`);
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
	console.log(
		`  ${base.split(/[\\/]/).pop()}: ${part.rings.length} rings in the city`,
	);
}

const features: LandslideFeature[] = [];
let current: { hazard: LandslideId; rings: Ring[] } | null = null;
let index = 0;

const flush = () => {
	if (!current || current.rings.length === 0) return;
	features.push({
		type: "Feature",
		properties: {
			zone_id: `noah-slide-${current.hazard}-${index++}`,
			hazard: current.hazard,
			barangay: nearestBarangay(centroidOf(current.rings[0]!)),
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
		if (areaM2(simplified) < MIN_AREA_M2) continue;
		current = { hazard, rings: [simplified] };
	} else if (current && current.hazard === hazard) {
		if (areaM2(simplified) >= MIN_AREA_M2) current.rings.push(simplified);
	}
}
flush();

mkdirSync(OUT_DIR, { recursive: true });
const fc = { type: "FeatureCollection" as const, features };
const json = JSON.stringify(fc);
writeFileSync(join(OUT_DIR, "davao-landslide.json"), `${json}\n`, "utf8");

const byClass = features.reduce<Record<string, number>>((a, f) => {
	a[f.properties.hazard] = (a[f.properties.hazard] ?? 0) + 1;
	return a;
}, {});
console.log(
	`davao-landslide.json  ${shapefiles.length} src  ${features.length} features ` +
		`(low ${byClass["low"] ?? 0} / med ${byClass["medium"] ?? 0} / high ${byClass["high"] ?? 0})  ` +
		`${(json.length / 1024).toFixed(0)} KB`,
);
