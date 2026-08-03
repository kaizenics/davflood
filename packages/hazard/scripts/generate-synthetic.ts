/**
 * Generates the PLACEHOLDER Panabo hazard dataset.
 *
 * This is not real hazard data and must never be presented as such. It exists
 * so the app is fully functional before the UP NOAH export clears LiPAD
 * approval. Every feature satisfies `HazardProperties` in src/schema.ts —
 * the same contract the real export will be transformed into.
 *
 * Method: synthesise a river spine running inland-to-coast plus a coastline,
 * then buffer three bands around them. High hazard hugs the water, medium
 * surrounds it, low is the outer floodplain — which is how a real floodplain
 * actually grades. Band widths scale with return period.
 *
 * Deterministic: fixed seed, so re-running produces identical files and the
 * diff stays empty unless the generator itself changed.
 *
 * Run:  pnpm --filter @naboflood/hazard generate:data
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { barangays } from "../src/barangays";
import { PANABO_DATA_BBOX } from "../src/geo";
import type { HazardCollection, HazardFeature } from "../src/schema";
import type { ScenarioYears } from "../src/scenarios";
import type { HazardId } from "../src/tiers";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

/* ---------- deterministic RNG ---------- */
let seed = 20260801;
function rnd(): number {
	seed = (seed * 1664525 + 1013904223) % 4294967296;
	return seed / 4294967296;
}
const jitter = (amount: number) => (rnd() - 0.5) * 2 * amount;

type Pt = [number, number];

const [WEST, SOUTH, EAST, NORTH] = PANABO_DATA_BBOX;

/**
 * River spine: enters from the north-west uplands, meanders south-east to the
 * Davao Gulf coast. Panabo's real drainage runs broadly this way.
 */
const RIVER: Pt[] = [
	[WEST + 0.005, NORTH - 0.01],
	[WEST + 0.035, NORTH - 0.045],
	[WEST + 0.055, NORTH - 0.08],
	[WEST + 0.09, NORTH - 0.105],
	[WEST + 0.12, NORTH - 0.13],
	[WEST + 0.148, NORTH - 0.155],
	[WEST + 0.168, NORTH - 0.18],
];

/** A second, smaller creek draining the southern barangays. */
const CREEK: Pt[] = [
	[WEST + 0.02, SOUTH + 0.09],
	[WEST + 0.05, SOUTH + 0.07],
	[WEST + 0.085, SOUTH + 0.05],
	[WEST + 0.115, SOUTH + 0.03],
	[WEST + 0.15, SOUTH + 0.015],
];

/** Coastline along the eastern edge — storm surge / tidal flooding. */
const COAST: Pt[] = [
	[EAST - 0.004, SOUTH + 0.02],
	[EAST - 0.008, SOUTH + 0.06],
	[EAST - 0.012, SOUTH + 0.1],
	[EAST - 0.01, SOUTH + 0.14],
	[EAST - 0.016, SOUTH + 0.175],
];

/** Band half-widths in degrees, per hazard class, per return period. */
const WIDTHS: Record<ScenarioYears, Record<HazardId, number>> = {
	5: { high: 0.0035, medium: 0.008, low: 0.016 },
	25: { high: 0.006, medium: 0.014, low: 0.027 },
	100: { high: 0.009, medium: 0.021, low: 0.04 },
};

const DEPTHS: Record<HazardId, [number, number]> = {
	low: [0.1, 0.5],
	medium: [0.5, 1.5],
	high: [1.5, 3.0],
};

/** Offset a polyline perpendicular to its direction, producing a ribbon. */
function ribbon(line: Pt[], halfWidth: number, wobble: number): Pt[] {
	const left: Pt[] = [];
	const right: Pt[] = [];

	for (let i = 0; i < line.length; i++) {
		const cur = line[i]!;
		const prev = line[Math.max(0, i - 1)]!;
		const next = line[Math.min(line.length - 1, i + 1)]!;

		const dx = next[0] - prev[0];
		const dy = next[1] - prev[1];
		const len = Math.hypot(dx, dy) || 1;
		// perpendicular unit vector
		const nx = -dy / len;
		const ny = dx / len;

		const w = halfWidth * (1 + jitter(wobble));
		left.push([cur[0] + nx * w, cur[1] + ny * w]);
		right.push([cur[0] - nx * w, cur[1] - ny * w]);
	}

	return [...left, ...right.reverse(), left[0]!];
}

function clampToBBox(ring: Pt[]): Pt[] {
	return ring.map(([x, y]) => [
		Math.min(Math.max(x, WEST), EAST),
		Math.min(Math.max(y, SOUTH), NORTH),
	]);
}

/** Nearest barangay to a ring's centroid — good enough for placeholder data. */
function nearestBarangay(ring: Pt[]): string {
	let cx = 0;
	let cy = 0;
	for (const [x, y] of ring) {
		cx += x;
		cy += y;
	}
	cx /= ring.length;
	cy /= ring.length;

	let best = barangays[0]!;
	let bestD = Number.POSITIVE_INFINITY;
	for (const b of barangays) {
		const d = Math.hypot(b.center[0] - cx, b.center[1] - cy);
		if (d < bestD) {
			bestD = d;
			best = b;
		}
	}
	return best.name;
}

function buildScenario(years: ScenarioYears): HazardCollection {
	// reset per scenario so each file is independently reproducible
	seed = 20260801 + years;

	const features: HazardFeature[] = [];
	const spines: Array<{ line: Pt[]; tag: string; wobble: number }> = [
		{ line: RIVER, tag: "riv", wobble: 0.18 },
		{ line: CREEK, tag: "crk", wobble: 0.22 },
		{ line: COAST, tag: "cst", wobble: 0.12 },
	];

	// low first so the draw order in the file mirrors the layer order
	const order: HazardId[] = ["low", "medium", "high"];

	for (const { line, tag, wobble } of spines) {
		for (const hazard of order) {
			const ring = clampToBBox(ribbon(line, WIDTHS[years][hazard], wobble));
			const [dmin, dmax] = DEPTHS[hazard];
			features.push({
				type: "Feature",
				properties: {
					zone_id: `${tag}-${hazard}-${years}`,
					hazard,
					depth_min: dmin,
					depth_max: dmax,
					barangay: nearestBarangay(ring),
					scenario: years,
				},
				geometry: { type: "Polygon", coordinates: [ring] },
			});
		}
	}

	// a few isolated low-lying inland pockets, which real hazard maps always have
	const pocketCount = years === 5 ? 3 : years === 25 ? 5 : 7;
	for (let i = 0; i < pocketCount; i++) {
		const b = barangays[Math.floor(rnd() * barangays.length)]!;
		const hazard: HazardId = rnd() > 0.65 ? "medium" : "low";
		const r = (hazard === "medium" ? 0.006 : 0.011) * (0.7 + rnd() * 0.6);

		const ring: Pt[] = [];
		const steps = 14;
		for (let s = 0; s <= steps; s++) {
			const a = (s / steps) * Math.PI * 2;
			const rr = r * (1 + jitter(0.25));
			ring.push([b.center[0] + Math.cos(a) * rr, b.center[1] + Math.sin(a) * rr * 0.8]);
		}
		ring[steps] = ring[0]!;

		const [dmin, dmax] = DEPTHS[hazard];
		features.push({
			type: "Feature",
			properties: {
				zone_id: `pkt-${i}-${years}`,
				hazard,
				depth_min: dmin,
				depth_max: dmax,
				barangay: b.name,
				scenario: years,
			},
			geometry: { type: "Polygon", coordinates: [clampToBBox(ring)] },
		});
	}

	return { type: "FeatureCollection", features };
}

/**
 * DANGER: src/data now holds the REAL UP NOAH export, produced by
 * build-noah-data.ts. Running this generator would silently replace real
 * hazard information with synthetic shapes — the exact failure this project
 * spends so much effort warning users about.
 *
 * Kept because it documents the schema and can rebuild a working dataset if
 * the NOAH source is ever unavailable, but it will not clobber real data
 * without being told to.
 */
if (!process.argv.includes("--force")) {
	console.error(
		[
			"refusing to run: src/data holds the REAL UP NOAH export.",
			"This generator produces SYNTHETIC placeholder shapes and would overwrite it.",
			"Re-run with --force only if you genuinely want placeholder data.",
		].join("\n"),
	);
	process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const years of [5, 25, 100] as const) {
	const fc = buildScenario(years);
	const path = join(OUT_DIR, `panabo-${years}.json`);
	// truncate coordinates — 6 dp is ~11 cm, far finer than a hazard model resolves
	const json = JSON.stringify(fc).replace(/(\d+\.\d{6})\d+/g, "$1");
	writeFileSync(path, `${json}\n`, "utf8");
	console.log(
		`panabo-${years}.json  ${fc.features.length} features  ${(json.length / 1024).toFixed(1)} KB`,
	);
}
