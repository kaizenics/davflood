import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Position } from "geojson";
import { barangays, normalizeName } from "../src/barangays";
import { footprintOf } from "../src/footprint";
import { ringsContain } from "../src/safe-ground";
import type { HazardCollection } from "../src/schema";
import { scenarios } from "../src/scenarios";
import type { HazardId } from "../src/tiers";

/**
 * What the model says about each barangay, precomputed.
 *
 * At build time because it is the same answer for everybody and it never
 * changes between deploys. Doing it in the browser would mean shipping 5.9 MB
 * of geometry to render one paragraph.
 *
 * BARANGAYS WITH NO FLOODING ARE KEPT, with zeroes. "The model does not flood
 * this barangay at all" is a real and useful answer, and a lookup that
 * returns undefined for it would have every caller inventing its own way to
 * say so.
 *
 * TWO METHODS, AND THE FILE SAYS WHICH ONE EACH BARANGAY GOT.
 *
 * 117 of the 183 barangays now have a real outline in davao-barangays.json.
 * For those, the figures are measured by sampling a 50 m grid over the
 * barangay itself: how many sample points fall inside it, and how many of
 * those also fall inside a hazard polygon. That gives an area and a flooded
 * share from ONE method, which is the only way the two can be divided.
 *
 * The other 66 exist in OSM as a bare point, so there is no area to sample.
 * They keep the original method — group the hazard polygons by the barangay
 * name each one was tagged with, and measure the group — which yields km²
 * flooded and no share, because there is still no denominator.
 *
 * WHY NOT DIVIDE THE OLD NUMERATOR BY THE NEW DENOMINATOR: the hazard
 * polygons are tagged with their NEAREST barangay centroid, which is not the
 * barangay that contains them. Near a boundary the tag is frequently wrong,
 * and the error does not cancel — a barangay whose neighbour is large and
 * whose own centroid sits close to the border collects polygons that are not
 * inside it. Dividing that by the true area produces shares over 100%, which
 * is how you can tell the two numbers were never measuring the same thing.
 *
 * Run: pnpm -F @davflood/hazard build:profiles
 */

const OUT = fileURLToPath(
  new URL("../src/barangay-profiles.ts", import.meta.url),
);

/** Three decimals is ~1000 m² — finer than the source data deserves. */
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

type Stat = {
  low: number;
  medium: number;
  high: number;
  total: number;
  zones: number;
  /** flooded fraction of the barangay, 0–1; null where there is no boundary */
  share: number | null;
};

const empty = (): Stat => ({
  low: 0,
  medium: 0,
  high: 0,
  total: 0,
  zones: 0,
  share: null,
});

/* ---------------- barangay outlines ---------------- */

type OutlineFeature = {
  properties: { name: string };
  geometry: { coordinates: Position[][] };
};

const outlines: OutlineFeature[] = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../src/data/davao-barangays.json", import.meta.url)),
    "utf8",
  ),
).features;

const outlineOf = new Map<string, Position[][]>(
  outlines.map((f) => [normalizeName(f.properties.name), f.geometry.coordinates]),
);

/** WGS84 mean at Davao's latitude — the same constants footprint.ts uses. */
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 111_320 * Math.cos((7.1 * Math.PI) / 180);

/**
 * Sample spacing, in metres.
 *
 * 50 m puts ~40 samples across the smallest downtown barangay and ~10,000
 * across an upland one, which is finer than either figure is quoted to. It is
 * also well under the ~22 m at which the hazard polygons were simplified, so
 * the grid is not the limiting resolution anywhere — the source data is.
 */
const SAMPLE_M = 50;
const STEP_LAT = SAMPLE_M / M_PER_DEG_LAT;
const STEP_LNG = SAMPLE_M / M_PER_DEG_LNG;

function bboxOf(rings: Position[][]): [number, number, number, number] {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const point of rings[0] ?? []) {
    const x = point[0] ?? 0;
    const y = point[1] ?? 0;
    if (x < w) w = x;
    if (x > e) e = x;
    if (y < s) s = y;
    if (y > n) n = y;
  }
  return [w, s, e, n];
}

/**
 * A coarse bucket index over the hazard polygons.
 *
 * Without it every sample point would be tested against all ~10,000 polygons
 * of the 100-year set — 600 million ring tests for one scenario. Bucketing by
 * a ~1 km cell means a sample only ever sees the handful of polygons whose
 * bounding box reaches its own cell.
 */
const BUCKET = 0.01;

type Indexed = {
  hazard: HazardId;
  rings: Position[][];
  bbox: [number, number, number, number];
};

function buildIndex(fc: HazardCollection): Map<string, Indexed[]> {
  const index = new Map<string, Indexed[]>();

  for (const feature of fc.features) {
    if (feature.geometry?.type !== "Polygon") continue;
    const rings = feature.geometry.coordinates as Position[][];
    const bbox = bboxOf(rings);
    const entry: Indexed = {
      hazard: feature.properties.hazard as HazardId,
      rings,
      bbox,
    };

    const [w, s, e, n] = bbox;
    for (let gx = Math.floor(w / BUCKET); gx <= Math.floor(e / BUCKET); gx++) {
      for (let gy = Math.floor(s / BUCKET); gy <= Math.floor(n / BUCKET); gy++) {
        const key = `${gx}:${gy}`;
        const bucket = index.get(key);
        if (bucket) bucket.push(entry);
        else index.set(key, [entry]);
      }
    }
  }

  return index;
}

/** Severity order, so a point inside two classes is reported as the worse. */
const RANK: Record<HazardId, number> = { low: 1, medium: 2, high: 3 };

function classAt(
  index: Map<string, Indexed[]>,
  x: number,
  y: number,
): HazardId | null {
  const bucket = index.get(`${Math.floor(x / BUCKET)}:${Math.floor(y / BUCKET)}`);
  if (!bucket) return null;

  let worst: HazardId | null = null;
  for (const entry of bucket) {
    const [w, s, e, n] = entry.bbox;
    if (x < w || x > e || y < s || y > n) continue;
    if (worst && RANK[entry.hazard] <= RANK[worst]) continue;
    if (ringsContain(entry.rings, x, y)) worst = entry.hazard;
  }
  return worst;
}

/**
 * Sample points inside one barangay.
 *
 * Returned rather than counted in place so the area and the flood classes come
 * from the identical point set — the whole reason this function exists.
 */
function samplesIn(rings: Position[][]): [number, number][] {
  const [w, s, e, n] = bboxOf(rings);
  const out: [number, number][] = [];
  // half-step inset so samples sit at cell centres rather than on the edge
  for (let y = s + STEP_LAT / 2; y <= n; y += STEP_LAT) {
    for (let x = w + STEP_LNG / 2; x <= e; x += STEP_LNG) {
      if (ringsContain(rings, x, y)) out.push([x, y]);
    }
  }
  return out;
}

/** Ground area one sample stands for, in km². */
const CELL_KM2 = (SAMPLE_M * SAMPLE_M) / 1_000_000;

/* ---------------- build ---------------- */

const profiles = new Map<string, Record<number, Stat>>();
const areaKm2 = new Map<string, number | null>();

for (const b of barangays) {
  profiles.set(b.name, {});
  const rings = outlineOf.get(normalizeName(b.name));
  areaKm2.set(b.name, null);
  if (rings) {
    // filled in on the first scenario pass, where the samples are taken
    areaKm2.set(b.name, 0);
  }
}

const sampled = new Map<string, [number, number][]>();
for (const b of barangays) {
  const rings = outlineOf.get(normalizeName(b.name));
  if (!rings) continue;
  const points = samplesIn(rings);
  sampled.set(b.name, points);
  areaKm2.set(b.name, round(points.length * CELL_KM2));
}

console.log(
  `sampled ${[...sampled.values()].reduce((n, p) => n + p.length, 0)} points ` +
    `across ${sampled.size} barangay outlines`,
);

for (const scenario of scenarios) {
  const path = fileURLToPath(
    new URL(`../src/data/davao-${scenario.years}.json`, import.meta.url),
  );
  const fc: HazardCollection = JSON.parse(readFileSync(path, "utf8"));
  const index = buildIndex(fc);

  /* Method A — barangays with an outline. Measured, not attributed: every
     figure here comes from points known to be inside this barangay. */
  for (const [name, points] of sampled) {
    const counts: Record<HazardId, number> = { low: 0, medium: 0, high: 0 };
    for (const [x, y] of points) {
      const hazard = classAt(index, x, y);
      if (hazard) counts[hazard]++;
    }
    const flooded = counts.low + counts.medium + counts.high;
    const entry = profiles.get(name)!;
    entry[scenario.years] = {
      low: round(counts.low * CELL_KM2),
      medium: round(counts.medium * CELL_KM2),
      high: round(counts.high * CELL_KM2),
      total: round(flooded * CELL_KM2),
      /* zones is not meaningful for a sampled measurement — a share of a
         barangay is not made of a countable number of polygons — and
         reporting the old count beside a differently-measured area would
         invite the two to be read together. */
      zones: 0,
      share: points.length ? Math.round((flooded / points.length) * 1000) / 1000 : null,
    };
  }

  /* Method B — the 66 with no outline. Unchanged from the original build:
     group by the barangay each polygon was tagged with, and measure the
     group with the same footprintOf() the city reading uses. */
  const byBarangay = new Map<string, HazardCollection["features"]>();
  for (const feature of fc.features) {
    const name = feature.properties?.barangay;
    if (!name || sampled.has(name)) continue;
    const bucket = byBarangay.get(name);
    if (bucket) bucket.push(feature);
    else byBarangay.set(name, [feature]);
  }

  for (const [name, features] of byBarangay) {
    const entry = profiles.get(name);
    if (!entry) {
      console.warn(`  ! hazard tagged "${name}", which is not in barangays.ts`);
      continue;
    }
    const fp = footprintOf({ type: "FeatureCollection", features });
    entry[scenario.years] = {
      low: round(fp.km2.low),
      medium: round(fp.km2.medium),
      high: round(fp.km2.high),
      total: round(fp.totalKm2),
      zones: fp.zones,
      share: null,
    };
  }

  const measured = [...sampled.keys()].filter(
    (n) => (profiles.get(n)?.[scenario.years]?.total ?? 0) > 0,
  ).length;
  console.log(
    `  ${scenario.label}: ${fc.features.length} zones · ` +
      `${measured} barangays flooded by measurement, ${byBarangay.size} by attribution`,
  );
}

const rows = [...profiles.entries()]
  .map(([name, byScenario]) => {
    const cells = scenarios
      .map((s) => {
        const stat = byScenario[s.years] ?? empty();
        return (
          `${s.years}: { low: ${stat.low}, medium: ${stat.medium}, ` +
          `high: ${stat.high}, total: ${stat.total}, zones: ${stat.zones}, ` +
          `share: ${stat.share === null ? "null" : stat.share} }`
        );
      })
      .join(", ");
    const area = areaKm2.get(name);
    return `\t${JSON.stringify(name)}: { areaKm2: ${area === null ? "null" : area}, ${cells} },`;
  })
  .join("\n");

const withOutline = sampled.size;

const file = `import type { ScenarioYears } from "./scenarios";

/**
 * How much of each barangay the model floods, by scenario.
 *
 * GENERATED by scripts/build-barangay-profiles.ts — do not edit by hand.
 * Regenerate with: pnpm --filter @davflood/hazard build:profiles
 *
 * TWO METHODS, AND \`areaKm2\` TELLS YOU WHICH ONE AN ENTRY GOT.
 *
 * ${withOutline} barangays have a real boundary in OpenStreetMap. For those, both the
 * area and the flooded area are measured by sampling a 50 m grid over the
 * barangay itself, so \`share\` is a true fraction of that barangay and the
 * km² figures are of ground inside it.
 *
 * The remaining ${barangays.length - withOutline} exist in OSM only as a point. They have no area, so
 * \`areaKm2\` and \`share\` are null and the km² figures are the older
 * attribution: hazard polygons grouped by the nearest barangay centroid,
 * which is an estimate of what is near them rather than a measurement of what
 * is inside them.
 *
 * The two are NOT interchangeable and must not be summed together or ranked
 * against each other. A UI showing both has to say which it is showing —
 * \`share === null\` is the test.
 *
 * All zeroes means the model does not flood that barangay in that scenario.
 * That is an answer, not missing data.
 */

export type BarangayStat = {
\t/** km² in each depth band */
\tlow: number;
\tmedium: number;
\thigh: number;
\t/** km² flooded in total */
\ttotal: number;
\t/** how many polygons make it up; 0 for grid-measured barangays */
\tzones: number;
\t/** flooded fraction of the barangay, 0–1. Null where OSM has no boundary. */
\tshare: number | null;
};

/**
 * Deliberately NOT called BarangayProfile: ./barangay.ts already exports that
 * name for the page-shaped view of a barangay, and two different shapes under
 * one name in the same package is a trap for whoever imports the wrong one.
 * This is the raw generated record; that one is what a route renders.
 */
export type BarangayRecord = {
\t/** the barangay's own area, km². Null where OSM has no boundary. */
\tareaKm2: number | null;
} & Record<ScenarioYears, BarangayStat>;

/** How many barangays have a mapped boundary, and so a measured share. */
export const BARANGAYS_WITH_BOUNDARY = ${withOutline};

export const BARANGAY_PROFILES: Record<string, BarangayRecord> = {
${rows}
};
`;

writeFileSync(OUT, file);
console.log(
  `barangay-profiles.ts — ${profiles.size} barangays, ${withOutline} measured`,
);
