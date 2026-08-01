/**
 * Validates the hand-authored map style against the real MapLibre style spec.
 *
 * A style with a spec error does not throw loudly in the browser — it renders
 * a blank canvas and logs at most a warning, which is exactly the failure mode
 * that is hardest to debug. This makes that failure a build-time error instead.
 *
 * Run:  pnpm --filter @naboflood/hazard validate:style
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

import { hazardLayers, SOURCE_HAZARD } from "../src/layers";
import { buildBaseStyle } from "../src/style";
import type { HazardCollection } from "../src/schema";

// read rather than import, so this stays free of JSON import-attribute quirks
const hazard25 = JSON.parse(
	readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "panabo-25.json"),
		"utf8",
	),
) as HazardCollection;

let failed = false;

function check(label: string, style: unknown) {
	const errors = validateStyleMin(style as never);
	if (errors.length === 0) {
		console.log(`  OK    ${label}`);
		return;
	}
	failed = true;
	console.log(`  FAIL  ${label}  (${errors.length} error(s))`);
	for (const e of errors) {
		console.log(`        ${e.message}`);
	}
}

console.log("validating map styles");

// terrain on/off both ship, so both have to be valid
check("base style, terrain + hillshade", buildBaseStyle());
check("base style, terrain off", buildBaseStyle({ terrain: false }));
check("base style, hillshade off", buildBaseStyle({ hillshade: false }));

// the style as it actually exists at runtime, with the hazard source and
// layers added on top — this is what the app really renders
const withHazard = buildBaseStyle();
withHazard.sources[SOURCE_HAZARD] = {
	type: "geojson",
	data: hazard25 as unknown as HazardCollection,
};
withHazard.layers.push(...hazardLayers());
check("base style + hazard source and layers", withHazard);

if (failed) {
	console.error("\nstyle validation FAILED");
	process.exit(1);
}
console.log("\nall styles valid");
