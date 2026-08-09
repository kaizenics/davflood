import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

import { CAMERA } from "./geo";
import { colorsFor } from "./tokens";

/**
 * The basemap, hand-authored rather than fetched from a remote style URL.
 *
 * Two reasons this is worth the ~200 lines:
 *  1. The style itself works offline. Fetching a style URL means a cold start
 *     with no network shows nothing at all — unacceptable for a storm app.
 *  2. Full control of the dark treatment, so the map matches the brand instead
 *     of fighting it.
 *
 * Source schema is OpenMapTiles (verified against the live TileJSON):
 * aerodrome_label, aeroway, boundary, building, housenumber, landcover,
 * landuse, mountain_peak, park, place, poi, transportation,
 * transportation_name, water, water_name, waterway
 */

export const OPENFREEMAP_TILEJSON = "https://tiles.openfreemap.org/planet";

/**
 * AWS Open Data terrain tiles, terrarium encoding. Free, no key, global.
 * Stands in for the Phil-LiDAR DEM, which needs LiPAD approval — and terrain
 * resolution matters far less than the hazard polygons do.
 */
export const TERRARIUM_TILES =
	"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/**
 * Esri World Imagery. Free to use with attribution and no key, and it carries
 * sub-metre detail over Davao — which matters, because being able to pick out
 * your own roof is what makes an aerial view worth having.
 *
 * Attribution is mandatory: "Esri, Maxar, Earthstar Geographics, and the GIS
 * User Community". See `attributionFor()`.
 *
 * Deliberately not EOX s2cloudless: it works and covers Davao, but it is
 * CC BY-NC-SA (non-commercial, share-alike) and only 10 m — enough to see land
 * cover, not enough to see a house.
 */
export const ESRI_IMAGERY =
	"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

/**
 * Vertical exaggeration for 3D terrain.
 *
 * Tuned to the measured landscape, not picked by feel. Decoding the terrarium
 * tiles over Davao City gives:
 *
 *   city centre     -42 m .. 623 m   (665 m of relief)
 *   NW uplands       62 m .. 1298 m  (1236 m — the Marilog/Baguio highlands)
 *   far west       -155 m .. 876 m   (toward the Mt Apo foothills)
 *   gulf coast       -8 m .. 338 m   (terrarium includes bathymetry)
 *
 * Davao is an order of magnitude more mountainous than a coastal town: this
 * is real 6-12% grade, dramatic at 1:1. The exaggeration is therefore a light
 * 1.3x — just enough to read relief on the coastal plain where people actually
 * live, without turning 1300 m highlands into spikes. A previous 2.6x was
 * tuned for a landscape with 133 m of relief and is far too much here.
 */
export const TERRAIN_EXAGGERATION = 1.3;

/** Hillshade is the relief cue that survives even when the map is flat on. */
export const HILLSHADE_EXAGGERATION = 0.55;

export const SOURCE_BASEMAP = "openfreemap";
export const SOURCE_TERRAIN = "terrain-dem";
export const SOURCE_SATELLITE = "satellite";
/** Hazard layers are inserted before this id so labels stay on top. */
export const FIRST_LABEL_LAYER = "place-town";

export type BasemapKind = "dark" | "light" | "satellite";

export type BuildStyleOptions = {
	/** dark vector cartography, or aerial imagery */
	basemap?: BasemapKind;
	/** 3D terrain is the heaviest part of the render — easy to disable */
	terrain?: boolean;
	terrainExaggeration?: number;
	/** hillshade reads well even when terrain meshing is off */
	hillshade?: boolean;
};

export function buildBaseStyle(options: BuildStyleOptions = {}): StyleSpecification {
	const {
		basemap = "dark",
		terrain = true,
		terrainExaggeration = TERRAIN_EXAGGERATION,
		// hillshade over aerial imagery just muddies it — the imagery already
		// carries its own shading
		hillshade = basemap !== "satellite",
	} = options;

	const satellite = basemap === "satellite";
	const light = basemap === "light";
	// satellite keeps the dark chrome for labels/background behind the imagery
	const colors = colorsFor(basemap === "light" ? "light" : "dark");

	const style: StyleSpecification = {
		version: 8,
		name: `DavFlood ${basemap}`,
		glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
		sources: {
			[SOURCE_BASEMAP]: {
				type: "vector",
				url: OPENFREEMAP_TILEJSON,
				// ODbL requires this wherever the map is drawn, not merely
				// somewhere on the site. Declared on the source so MapLibre's
				// attribution control credits exactly the sources in use — swap
				// to satellite and Esri's credit appears, OSM's stays for the
				// labels, and nobody has to remember to update a footer.
				attribution:
					'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · <a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a>',
			},
			[SOURCE_TERRAIN]: {
				type: "raster-dem",
				tiles: [TERRARIUM_TILES],
				encoding: "terrarium",
				tileSize: 256,
				minzoom: 0,
				maxzoom: 14,
				attribution: "Terrain: AWS Open Data",
			},
			[SOURCE_SATELLITE]: {
				type: "raster",
				tiles: [ESRI_IMAGERY],
				tileSize: 256,
				minzoom: 0,
				maxzoom: 19,
				attribution: "Esri, Maxar, Earthstar Geographics",
			},
		},
		layers: [
			{
				id: "background",
				type: "background",
				paint: { "background-color": colors.abyss },
			},

			/* ---- land ---- */
			{
				id: "landcover",
				type: "fill",
				source: SOURCE_BASEMAP,
				"source-layer": "landcover",
				paint: { "fill-color": colors.green, "fill-opacity": 0.35 },
			},
			{
				id: "landuse-residential",
				type: "fill",
				source: SOURCE_BASEMAP,
				"source-layer": "landuse",
				filter: ["==", ["get", "class"], "residential"],
				paint: { "fill-color": colors.land, "fill-opacity": 0.7 },
			},
			{
				id: "park",
				type: "fill",
				source: SOURCE_BASEMAP,
				"source-layer": "park",
				paint: { "fill-color": colors.green, "fill-opacity": 0.4 },
			},

			/* ---- water ---- */
			{
				id: "water",
				type: "fill",
				source: SOURCE_BASEMAP,
				"source-layer": "water",
				paint: { "fill-color": colors.water },
			},
			{
				id: "waterway",
				type: "line",
				source: SOURCE_BASEMAP,
				"source-layer": "waterway",
				paint: {
					"line-color": colors.water,
					"line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.6, 16, 5],
				},
			},

			/* ---- roads ----
			   A casing first: a wider, darker line underneath every road so the
			   network reads as a network. Fill contrast alone cannot do this —
			   white roads on light land are only ~1.2:1, and pushing the land
			   dark enough to fix that would stop it being a light basemap. Every
			   real light style (Positron, Google) solves it with a casing. */
			{
				id: "road-casing",
				type: "line",
				source: SOURCE_BASEMAP,
				"source-layer": "transportation",
				filter: [
					"in",
					["get", "class"],
					["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]],
				],
				paint: {
					"line-color": colors.roadCasing,
					"line-width": ["interpolate", ["linear"], ["zoom"], 8, 2.2, 18, 18],
					"line-opacity": light ? 1 : 0.7,
				},
			},
			{
				id: "road-minor",
				type: "line",
				source: SOURCE_BASEMAP,
				"source-layer": "transportation",
				filter: ["in", ["get", "class"], ["literal", ["minor", "service", "track"]]],
				minzoom: 12,
				paint: {
					"line-color": colors.road,
					"line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.4, 18, 6],
				},
			},
			{
				id: "road-secondary",
				type: "line",
				source: SOURCE_BASEMAP,
				"source-layer": "transportation",
				filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
				paint: {
					"line-color": colors.road,
					"line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.7, 18, 10],
				},
			},
			{
				id: "road-primary",
				type: "line",
				source: SOURCE_BASEMAP,
				"source-layer": "transportation",
				filter: [
					"in",
					["get", "class"],
					["literal", ["motorway", "trunk", "primary"]],
				],
				paint: {
					"line-color": colors.roadMajor,
					"line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 18, 14],
				},
			},

			/* ---- buildings, extruded so the 3D tilt has something to bite on ---- */
			{
				id: "building",
				type: "fill-extrusion",
				source: SOURCE_BASEMAP,
				"source-layer": "building",
				// OpenMapTiles serves buildings from z13 (generalised); starting
				// here instead of 14 means the city already reads as a city when
				// the camera drops toward street level
				minzoom: 13,
				paint: {
					/**
					 * Height-tinted: taller buildings shade lighter, as if catching
					 * light the low roofs don't. This is what stops a town of
					 * mostly-unmapped-height buildings looking like a tray of
					 * identical boxes — the few real towers become landmarks you
					 * can navigate by. The ramp shades are cartography, inline
					 * like the sky colours, not UI tokens.
					 */
					"fill-extrusion-color": [
						"interpolate",
						["linear"],
						["coalesce", ["get", "render_height"], 4],
						4,
						colors.building,
						20,
						light ? "#dde3e9" : "#232b35",
						60,
						light ? "#eef2f5" : "#3a4552",
					],
					"fill-extrusion-height": ["coalesce", ["get", "render_height"], 4],
					"fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
					// fade in across a zoom level rather than popping into
					// existence at the threshold
					"fill-extrusion-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						13,
						0,
						14.2,
						0.85,
					],
					// walls darken toward the ground — the same cue that sells
					// the hazard volumes
					"fill-extrusion-vertical-gradient": true,
				},
			},

			/* ---- labels last so hazard fills sit underneath them ---- */
			{
				id: FIRST_LABEL_LAYER,
				type: "symbol",
				source: SOURCE_BASEMAP,
				"source-layer": "place",
				filter: [
					"in",
					["get", "class"],
					["literal", ["city", "town", "village", "suburb", "neighbourhood"]],
				],
				layout: {
					"text-field": ["get", "name"],
					"text-font": ["Noto Sans Regular"],
					"text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 16, 15],
					"text-max-width": 8,
					"text-transform": "uppercase",
					"text-letter-spacing": 0.08,
				},
				paint: {
					"text-color": colors.inkDim,
					"text-halo-color": colors.abyss,
					"text-halo-width": 1.4,
				},
			},
			{
				id: "water-label",
				type: "symbol",
				source: SOURCE_BASEMAP,
				"source-layer": "water_name",
				layout: {
					"text-field": ["get", "name"],
					"text-font": ["Noto Sans Italic"],
					"text-size": 11,
					"text-max-width": 8,
				},
				paint: {
					"text-color": colors.tideDeep,
					"text-halo-color": colors.abyss,
					"text-halo-width": 1.2,
				},
			},
		],
		sky: {
			"sky-color": basemap === "light" ? "#cfe3f2" : "#0a1622",
			"horizon-color": colors.tideDeep,
			"fog-color": colors.abyss,
			"sky-horizon-blend": 0.6,
			"horizon-fog-blend": 0.7,
			"fog-ground-blend": 0.2,
		},
		center: [...CAMERA.center],
		zoom: CAMERA.zoom,
		pitch: CAMERA.pitch,
		bearing: CAMERA.bearing,
	};

	/**
	 * Satellite mode replaces the vector cartography with imagery, but keeps
	 * the place and water labels — without names, aerial imagery of an
	 * unfamiliar area is very hard to orient in.
	 */
	if (satellite) {
		// dim grey labels vanish over bright imagery — go full white with a
		// heavier dark halo so names stay readable over anything underneath
		const labels = style.layers
			.filter((l) => l.type === "symbol")
			.map((l) => ({
				...l,
				paint: {
					...("paint" in l ? l.paint : {}),
					"text-color": colors.ink,
					"text-halo-color": "#000000",
					"text-halo-width": 1.8,
				},
			})) as typeof style.layers;

		style.layers = [
			style.layers[0]!, // background, so there is never a white flash
			{
				id: "satellite",
				type: "raster",
				source: SOURCE_SATELLITE,
				paint: { "raster-opacity": 1 },
			},
			...labels,
		];
	}

	if (hillshade) {
		// directly above `background`, so relief sits under every feature and
		// label rather than washing them out
		style.layers.splice(1, 0, {
			id: "hillshade",
			type: "hillshade",
			source: SOURCE_TERRAIN,
			/**
			 * Hillshade has to be inverted per theme.
			 *
			 * On dark cartography, relief reads as a lit highlight against a
			 * black shadow. Reusing that on a light basemap paints black
			 * shadows and a dark-teal "highlight" over near-white land, which
			 * comes out as a grey-blue murk — the map ends up looking like a
			 * snowfield rather than a tropical coastal plain.
			 *
			 * Light gets a white highlight, a soft blue-grey shadow, and about
			 * half the strength, because a pale basemap shows shading far more
			 * readily than a dark one.
			 */
			paint: light
				? {
						"hillshade-shadow-color": "#7c8b99",
						"hillshade-highlight-color": "#ffffff",
						"hillshade-accent-color": "#9aabb8",
						"hillshade-exaggeration": HILLSHADE_EXAGGERATION * 0.5,
					}
				: {
						"hillshade-shadow-color": "#000000",
						"hillshade-highlight-color": colors.tideDeep,
						"hillshade-exaggeration": HILLSHADE_EXAGGERATION,
					},
		});
	}

	if (terrain) {
		style.terrain = { source: SOURCE_TERRAIN, exaggeration: terrainExaggeration };
	}

	return style;
}
