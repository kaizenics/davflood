/**
 * Builds the list of buildings that could shelter people, from OpenStreetMap.
 *
 * These are CANDIDATES, not designated evacuation centres. Davao City's DRRM
 * office decides where people actually go; OSM only knows where the schools
 * and covered courts are. Everything downstream has to keep saying so — the
 * app calls them "large public buildings on ground this scenario does not
 * flood", which is exactly what they are and no more.
 *
 * Each one is tested against all three return periods at build time, so the
 * app can pick a shelter that is dry in the scenario being viewed without
 * doing point-in-polygon work on a phone during a storm.
 *
 * Usage: tsx scripts/build-evacuation-data.ts
 */
import { writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";

import { DAVAO_DATA_BBOX } from "../src/geo";
import { isFlooded } from "../src/safe-ground";
import type { HazardCollection } from "../src/schema";
import type { ScenarioYears } from "../src/scenarios";

/** overpass-api.de rate-limits hard; these mirrors answer. */
const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

/**
 * What actually shelters people here.
 *
 * Schools and covered courts do most of the work in a Philippine evacuation —
 * they are large, public, and every barangay has one. Halls and sports centres
 * are included for the same reason.
 */
const QUERY = `[out:json][timeout:180];
(
  nwr["amenity"="school"](${bboxArg()});
  nwr["amenity"="college"](${bboxArg()});
  nwr["amenity"="university"](${bboxArg()});
  nwr["amenity"="community_centre"](${bboxArg()});
  nwr["amenity"="townhall"](${bboxArg()});
  nwr["leisure"="sports_centre"](${bboxArg()});
  nwr["emergency"="assembly_point"](${bboxArg()});
);
out center tags;`;

function bboxArg(): string {
  const [w, s, e, n] = DAVAO_DATA_BBOX;
  return `${s},${w},${n},${e}`;
}

type Element = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/**
 * `leisure=sports_centre` covers the barangay covered court and the commercial
 * gym equally, and the first pass duly offered "10 Ball's Billiard Hall" as
 * somewhere to take your family. A shelter list is only worth having if every
 * entry on it is plausible, so these are kept only when the name says what
 * kind of place it is.
 */
const REAL_COURT = /court|gym|coliseum|covered|barangay|plaza|oval|stadium|sports complex/i;

/** Obvious commercial premises that carry a school or sports tag. */
const NOT_A_SHELTER =
  /billiard|bowling|fitness|spa|salon|driving|review cent|tutorial|dance|yoga|casino|resort|bar$/i;

/** OSM tags to something a person would recognise. */
function kindOf(tags: Record<string, string>): string | null {
  const name = tags["name"] ?? "";
  if (NOT_A_SHELTER.test(name)) return null;

  if (tags["emergency"] === "assembly_point") return "Assembly point";
  if (tags["amenity"] === "school") return "School";
  if (tags["amenity"] === "college") return "College";
  if (tags["amenity"] === "university") return "University";
  if (tags["amenity"] === "townhall") return "Hall";
  if (tags["amenity"] === "community_centre") return "Community centre";
  if (tags["leisure"] === "sports_centre") {
    return REAL_COURT.test(name) ? "Covered court" : null;
  }
  return null;
}

async function overpass(): Promise<Element[]> {
  let lastError = "";
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(`${url}?data=${encodeURIComponent(QUERY)}`, {
        headers: { "user-agent": "davflood/1.0 (flood hazard map for Davao City)" },
      });
      if (!res.ok) {
        lastError = `${new URL(url).host}: HTTP ${res.status}`;
        console.warn(`  ${lastError}`);
        continue;
      }
      const json = (await res.json()) as { elements?: Element[] };
      const elements = json.elements ?? [];
      console.log(`  ${new URL(url).host}: ${elements.length} elements`);
      if (elements.length > 0) return elements;
    } catch (err) {
      lastError = `${new URL(url).host}: ${err instanceof Error ? err.message : err}`;
      console.warn(`  ${lastError}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`every Overpass mirror failed (${lastError})`);
}

function scenario(years: ScenarioYears): HazardCollection {
  const url = new URL(`../src/data/davao-${years}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as HazardCollection;
}

async function main() {
  console.log("asking Overpass…");
  const elements = await overpass();

  type Row = {
    name: string;
    kind: string;
    center: [number, number];
    floodedIn: ScenarioYears[];
  };

  const rows: Row[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = (tags["name"] ?? "").trim();
    const kind = kindOf(tags);
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!name || !kind || lat === undefined || lon === undefined) continue;

    // the same campus is often a node AND a way; one entry per name+place
    const key = `${name.toLowerCase()}|${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      name,
      kind,
      center: [Number(lon.toFixed(5)), Number(lat.toFixed(5))],
      floodedIn: [],
    });
  }

  console.log(`${rows.length} named candidates; testing against each scenario…`);
  for (const years of [5, 25, 100] as ScenarioYears[]) {
    const fc = scenario(years);
    let hit = 0;
    for (const row of rows) {
      if (isFlooded(fc, row.center)) {
        row.floodedIn.push(years);
        hit++;
      }
    }
    console.log(`  ${years}-year: ${hit} of ${rows.length} sit inside the footprint`);
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const out = new URL("../src/evacuation-data.ts", import.meta.url);
  const body = rows
    .map(
      (r) =>
        `\t{ name: ${JSON.stringify(r.name)}, kind: ${JSON.stringify(r.kind)}, center: [${r.center[0]}, ${r.center[1]}], floodedIn: [${r.floodedIn.join(", ")}] },`,
    )
    .join("\n");

  writeFileSync(
    out,
    `import type { EvacuationSite } from "./evacuation";

/**
 * GENERATED by scripts/build-evacuation-data.ts from OpenStreetMap — do not
 * edit by hand. Regenerate with:
 *   pnpm --filter @davflood/hazard exec tsx scripts/build-evacuation-data.ts
 *
 * ${rows.length} large public buildings in Davao City. CANDIDATES, not
 * designated evacuation centres — see the script for why that distinction is
 * not cosmetic.
 *
 * \`floodedIn\` lists the return periods whose modelled footprint covers the
 * building, so the app can offer one that is dry in the scenario being viewed.
 */
export const EVACUATION_SITES: EvacuationSite[] = [
${body}
];
`,
  );
  console.log(`wrote ${rows.length} sites to ${out.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
