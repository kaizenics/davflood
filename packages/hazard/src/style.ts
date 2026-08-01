import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

import { CAMERA } from "./geo";
import { colors } from "./tokens";

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

export const SOURCE_BASEMAP = "openfreemap";
export const SOURCE_TERRAIN = "terrain-dem";
/** Hazard layers are inserted before this id so labels stay on top. */
export const FIRST_LABEL_LAYER = "place-town";

export type BuildStyleOptions = {
	/** 3D terrain is the least mature part of MapLibre Native — easy to disable */
	terrain?: boolean;
	terrainExaggeration?: number;
	/** hillshade reads well even when terrain meshing is off */
	hillshade?: boolean;
};

export function buildBaseStyle(options: BuildStyleOptions = {}): StyleSpecification {
	const {
		terrain = true,
		terrainExaggeration = 1.4,
		hillshade = true,
	} = options;

	const style: StyleSpecification = {
		version: 8,
		name: "NaboFlood Dark",
		glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
		sources: {
			[SOURCE_BASEMAP]: {
				type: "vector",
				url: OPENFREEMAP_TILEJSON,
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

			/* ---- roads, thinnest class first ---- */
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
				minzoom: 14,
				paint: {
					"fill-extrusion-color": colors.building,
					"fill-extrusion-height": ["coalesce", ["get", "render_height"], 4],
					"fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
					"fill-extrusion-opacity": 0.85,
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
			"sky-color": "#0a1622",
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

	if (hillshade) {
		// directly above `background`, so relief sits under every feature and
		// label rather than washing them out
		style.layers.splice(1, 0, {
			id: "hillshade",
			type: "hillshade",
			source: SOURCE_TERRAIN,
			paint: {
				"hillshade-shadow-color": "#000000",
				"hillshade-highlight-color": colors.tideDeep,
				"hillshade-exaggeration": 0.35,
			},
		});
	}

	if (terrain) {
		style.terrain = { source: SOURCE_TERRAIN, exaggeration: terrainExaggeration };
	}

	return style;
}
