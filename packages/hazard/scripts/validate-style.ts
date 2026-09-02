/**
 * Validates the hand-authored map style against the real MapLibre style spec.
 *
 * A style with a spec error does not throw loudly in the browser — it renders
 * a blank canvas and logs at most a warning, which is exactly the failure mode
 * that is hardest to debug. This makes that failure a build-time error instead.
 *
 * Run:  pnpm --filter @davflood/hazard validate:style
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

import {
	barangayLayers,
	boundaryLayers,
	hazardLayers,
	SOURCE_BARANGAYS,
	SOURCE_BOUNDARY,
	SOURCE_HAZARD,
} from "../src/layers";
import { buildBaseStyle } from "../src/style";
import type { HazardCollection } from "../src/schema";

// read rather than import, so this stays free of JSON import-attribute quirks
const hazard25 = JSON.parse(
	readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "davao-25.json"),
		"utf8",
	),
) as HazardCollection;

const barangayOutlines = JSON.parse(
	readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			"..",
			"src",
			"data",
			"davao-barangays.json",
		),
		"utf8",
	),
);

const boundary = JSON.parse(
	readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			"..",
			"src",
			"data",
			"davao-boundary.json",
		),
		"utf8",
	),
);

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

// every combination that ships has to be valid
check("dark, terrain + hillshade", buildBaseStyle());
check("dark, terrain off", buildBaseStyle({ terrain: false }));
check("dark, hillshade off", buildBaseStyle({ hillshade: false }));
check("light", buildBaseStyle({ basemap: "light" }));
check("light, terrain off", buildBaseStyle({ basemap: "light", terrain: false }));
check("satellite", buildBaseStyle({ basemap: "satellite" }));
check(
	"satellite, terrain off",
	buildBaseStyle({ basemap: "satellite", terrain: false }),
);

// the style as it actually exists at runtime, with the hazard source and
// layers added on top — this is what the app really renders
for (const basemap of ["dark", "light", "satellite"] as const) {
	const withHazard = buildBaseStyle({ basemap });
	withHazard.sources[SOURCE_HAZARD] = {
		type: "geojson",
		data: hazard25 as unknown as HazardCollection,
	};
	withHazard.sources[SOURCE_BOUNDARY] = {
		type: "geojson",
		data: boundary as never,
	};
	withHazard.sources[SOURCE_BARANGAYS] = {
		type: "geojson",
		data: barangayOutlines as never,
	};
	const theme = basemap === "light" ? "light" : "dark";
	withHazard.layers.push(
		...hazardLayers({ fillOpacity: basemap === "satellite" ? 0.55 : 0.45 }),
		...barangayLayers(theme),
		...boundaryLayers(theme),
	);
	check(`${basemap} + hazard, barangay and boundary layers`, withHazard);

	const extruded = buildBaseStyle({ basemap });
	extruded.sources[SOURCE_HAZARD] = {
		type: "geojson",
		data: hazard25 as unknown as HazardCollection,
	};
	extruded.layers.push(...hazardLayers({ extrude: true }));
	check(`${basemap} + extruded hazard layers`, extruded);
}

if (failed) {
	console.error("\nstyle validation FAILED");
	process.exit(1);
}
console.log("\nall styles valid");
