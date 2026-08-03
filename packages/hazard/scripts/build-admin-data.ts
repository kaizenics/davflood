/**
 * Builds the two OpenStreetMap-derived artifacts the app needs for Davao City:
 *
 *   src/barangays.ts            the barangay directory (name + centroid)
 *   src/data/davao-boundary.json  the city outline, used to clip hazard data
 *
 * Why both come from one script: they are two views of the same Overpass
 * answer, and they must agree. If the boundary said one thing and the barangay
 * list another, hazard polygons would be labelled with barangays that sit
 * outside the clip.
 *
 * Two OSM record types are merged for barangays, on purpose:
 *
 *   - admin_level=10 relations — real surveyed boundaries. Only about two
 *     thirds of Davao City's barangays have one, but where it exists it gives
 *     the most trustworthy centroid.
 *   - admin_level=10 nodes — a single mapped point, no boundary. Coarser, but
 *     it is the only record OSM has for the rest, and a coarse point beats
 *     omitting a barangay entirely. The northern coastal barangays (Panacan,
 *     Ilang, Tibungco, Bunawan, Lasang) exist only this way, and leaving them
 *     out made the app look like those places never flood.
 *
 * Note it is admin_level, never place=, that identifies a barangay: Davao's
 * districts and sitios are mapped as place=suburb|village with no admin_level,
 * so filtering on place= admits Bajada, Lanang, Matina and Obrero — none of
 * which is a barangay — while still missing real ones.
 *
 * `surveyed` records which of the two a barangay came from, so the UI can be
 * honest about precision instead of implying every centroid is equal.
 *
 * Run:  pnpm --filter @davflood/hazard build:admin -- <dir-with-overpass-json>
 *
 * The directory must hold brgy.json and city.json, fetched with:
 *
 *   # brgy.json
 *   [out:json][timeout:240];area(3603936841)->.d;
 *   (relation["admin_level"="10"](area.d);node["admin_level"="10"](area.d););
 *   out center tags;
 *
 *   # city.json
 *   [out:json][timeout:300];relation(3936841);out geom;
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "src");

/** Davao City's official barangay count, per the PSA barangay register. */
const OFFICIAL = 182;

type LngLat = [number, number];

/* ---------------- barangays ---------------- */

type OverpassEl = {
	type: "node" | "way" | "relation";
	lat?: number;
	lon?: number;
	center?: { lat: number; lon: number };
	tags?: Record<string, string>;
};

/**
 * Names Overpass returns inside the city area that are not barangays — the
 * city itself and its 11 administrative districts, which are groupings of
 * barangays rather than barangays. Districts that are *also* a barangay carry
 * a distinguishing suffix in OSM ("Bunawan Proper", "Baguio Proper"), so an
 * exact-name match is safe here.
 */
const NOT_A_BARANGAY = new Set([
	"davao city",
	"poblacion district",
	"talomo district",
	"agdao district",
	"buhangin district",
	"bunawan district",
	"paquibato district",
	"baguio district",
	"calinan district",
	"marilog district",
	"toril district",
	"tugbok district",
]);

function normalize(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

/**
 * A barangay's poblacion (town centre) is often mapped twice: once as the
 * boundary relation "Bunawan Proper" and once as a bare place node "Bunawan".
 * Folding those suffixes away collapses the pair into one barangay, keeping
 * whichever record has the better centroid.
 */
function dedupeKey(name: string): string {
	return normalize(name)
		.replace(/\b(proper|pob|poblacion)\b/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/** The numbered downtown barangays: "1-A Bolton Riverside", "Barangay 10-A". */
function isPoblacion(name: string): boolean {
	return /^\d+-[A-D]\b/.test(name) || /^Barangay \d+-[A-D]$/.test(name);
}

type Entry = { name: string; center: LngLat; surveyed: boolean };

function buildBarangays(elements: OverpassEl[]): Entry[] {
	const byName = new Map<string, Entry>();

	for (const el of elements) {
		const tags = el.tags ?? {};
		const name = (tags["name:en"] ?? tags.name ?? "").trim();
		if (!name) continue;

		const key = dedupeKey(name);
		if (!key || NOT_A_BARANGAY.has(normalize(name))) continue;

		// admin_level=10 is the whole test, and it is what separates a barangay
		// from everything else OSM maps at a similar size. Davao's districts and
		// sitios — Bajada, Lanang, Matina, Obrero, Kinse-Kinse — are place nodes
		// with no admin_level; its barangays carry admin_level=10 whether they
		// are mapped as a boundary relation or only as a point. Filtering on
		// place= instead would both admit those districts and, because several
		// barangays have no relation at all, still miss real ones.
		//
		// Ways are excluded even when tagged admin_level=10: a way is one
		// fragment of a boundary, so its centre lies *on* the border between two
		// barangays rather than inside either. Only a relation encloses an area.
		if (tags.admin_level !== "10") continue;
		if (el.type !== "relation" && el.type !== "node") continue;

		// a relation has a computed centre; a node is its own position
		const lat = el.center?.lat ?? el.lat;
		const lon = el.center?.lon ?? el.lon;
		if (lat === undefined || lon === undefined) continue;

		// admin_level=10 means a surveyed boundary, which we always prefer
		// a relation carries real boundary geometry; a node is a single point
		const surveyed = el.type === "relation";
		const existing = byName.get(key);
		if (existing && (existing.surveyed || !surveyed)) continue;

		byName.set(key, {
			name,
			center: [Number(lon.toFixed(5)), Number(lat.toFixed(5))],
			surveyed,
		});
	}

	return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function emitBarangays(entries: Entry[]): string {
	const surveyed = entries.filter((e) => e.surveyed).length;
	const rows = entries
		.map((e) => {
			const pob = isPoblacion(e.name) ? " poblacion: true," : "";
			return `\t{ name: ${JSON.stringify(e.name)},${pob} center: [${e.center[0]}, ${e.center[1]}], surveyed: ${e.surveyed} },`;
		})
		.join("\n");

	return `/**
 * Davao City's barangays.
 *
 * GENERATED by scripts/build-admin-data.ts from OpenStreetMap — do not edit by
 * hand. Regenerate with: pnpm --filter @davflood/hazard build:admin
 *
 * ${entries.length} barangays, against the city's ${OFFICIAL} official ones. Every entry is
 * tagged admin_level=10 in OSM, which is what distinguishes a barangay from the
 * districts and sitios mapped at a similar size (Bajada, Lanang, Matina and
 * Obrero are Davao districts, not barangays, and are deliberately absent).
 *
 * \`surveyed\` says how good the centroid is: ${surveyed} come from a boundary
 * relation and are derived from surveyed geometry, while ${entries.length - surveyed} exist in OSM only
 * as a single mapped point and are approximate. Both are real barangays — the
 * northern coastal ones (Panacan, Ilang, Tibungco, Bunawan, Lasang) are all
 * point-only, and excluding them made the map look like those places never
 * flood.
 *
 * The count runs ${entries.length - OFFICIAL > 0 ? `${entries.length - OFFICIAL} over` : `${OFFICIAL - entries.length} under`} the official ${OFFICIAL}. Reconciling exactly would need the
 * PSA barangay register, which is not available offline; the difference is
 * small enough to leave visible rather than paper over.
 *
 * Hazard geometry is clipped to the city outline rather than assembled per
 * barangay, so the map covers the whole city regardless of this list.
 */

export type Barangay = {
	name: string;
	/** the numbered downtown barangays of the Poblacion district */
	poblacion?: boolean;
	center: [number, number];
	/** true when the centroid comes from a surveyed boundary, not a point */
	surveyed: boolean;
};

/** How many barangays this list actually carries. */
export const BARANGAYS_MAPPED = ${entries.length};
/** How many the city officially has, per the PSA barangay register. */
export const BARANGAYS_OFFICIAL = ${OFFICIAL};
/** How many have a surveyed boundary behind their centroid. */
export const BARANGAYS_SURVEYED = ${surveyed};

export const barangays: Barangay[] = [
${rows}
];

export function normalizeName(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\\u0300-\\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

export function searchBarangays(query: string, limit = 200): Barangay[] {
	const q = normalizeName(query);
	if (!q) return barangays.slice(0, limit);

	const scored = barangays
		.map((b) => {
			const n = normalizeName(b.name);
			// prefix match beats substring match beats nothing
			const score = n.startsWith(q) ? 2 : n.includes(q) ? 1 : 0;
			return { b, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, z) => z.score - a.score || a.b.name.localeCompare(z.b.name));

	return scored.slice(0, limit).map((x) => x.b);
}
`;
}

/* ---------------- city outline ---------------- */

type Way = { type: string; role?: string; geometry?: { lat: number; lon: number }[] };

/**
 * An OSM boundary relation is an unordered bag of way fragments. Stitch them
 * into closed rings by repeatedly attaching whichever fragment continues the
 * current ring at either end.
 */
function stitch(ways: Way[]): LngLat[][] {
	const open = ways
		.filter((w) => w.geometry && w.geometry.length > 1)
		.map((w) => w.geometry!.map((p) => [p.lon, p.lat] as LngLat));

	const rings: LngLat[][] = [];
	const same = (a: LngLat, b: LngLat) =>
		Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;

	while (open.length) {
		let ring = open.pop()!;

		let joined = true;
		while (joined) {
			joined = false;
			for (let i = 0; i < open.length; i++) {
				const seg = open[i]!;
				const head = ring[0]!;
				const tail = ring[ring.length - 1]!;

				if (same(tail, seg[0]!)) ring = ring.concat(seg.slice(1));
				else if (same(tail, seg[seg.length - 1]!))
					ring = ring.concat(seg.slice(0, -1).reverse());
				else if (same(head, seg[seg.length - 1]!))
					ring = seg.slice(0, -1).concat(ring);
				else if (same(head, seg[0]!))
					ring = seg.slice(1).reverse().concat(ring);
				else continue;

				open.splice(i, 1);
				joined = true;
				break;
			}
		}

		// only keep rings that actually closed; a stray fragment is not an outline
		if (ring.length > 3 && same(ring[0]!, ring[ring.length - 1]!)) rings.push(ring);
	}

	return rings.sort((a, b) => b.length - a.length);
}

/* ---------------- main ---------------- */

const dir = process.argv[2];
if (!dir) {
	console.error("usage: build:admin -- <dir-with-brgy.json-and-city.json>");
	process.exit(1);
}

const brgyRaw = JSON.parse(readFileSync(join(dir, "brgy.json"), "utf8"));
const entries = buildBarangays(brgyRaw.elements ?? []);
writeFileSync(join(SRC, "barangays.ts"), emitBarangays(entries));

const cityRaw = JSON.parse(readFileSync(join(dir, "city.json"), "utf8"));
const relation = cityRaw.elements?.[0];
if (!relation) throw new Error("city.json holds no relation");

const rings = stitch((relation.members ?? []).filter((m: Way) => m.role !== "inner"));
if (!rings.length) throw new Error("could not stitch the city outline into a ring");

const boundary = {
	type: "Feature" as const,
	properties: { name: "Davao City", osm: "relation/3936841" },
	geometry: { type: "Polygon" as const, coordinates: rings.slice(0, 1) },
};

mkdirSync(join(SRC, "data"), { recursive: true });
writeFileSync(join(SRC, "data", "davao-boundary.json"), JSON.stringify(boundary));

const surveyed = entries.filter((e) => e.surveyed).length;
const ring = rings[0]!;
const lons = ring.map((p) => p[0]);
const lats = ring.map((p) => p[1]);
console.log(
	`barangays  ${entries.length}/${OFFICIAL}  (${surveyed} surveyed, ${entries.length - surveyed} point-only)`,
);
console.log(
	`boundary   ${ring.length} points  bbox [${Math.min(...lons).toFixed(3)}, ${Math.min(...lats).toFixed(3)}, ${Math.max(...lons).toFixed(3)}, ${Math.max(...lats).toFixed(3)}]`,
);
if (rings.length > 1) console.log(`           (dropped ${rings.length - 1} smaller ring(s) — islands)`);
