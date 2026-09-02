import type {
	ExpressionSpecification,
	LayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";

import { landslideColorFor, landslideOrder } from "./landslide";
import { rainColorsFor } from "./rain-grid";
import { FIRST_LABEL_LAYER } from "./style";
import { hazardColorFor, hazardOrder } from "./tiers";
import { colorsFor } from "./tokens";
import type { Theme } from "./tokens";

export const SOURCE_HAZARD = "hazard";
export const SOURCE_RAIN = "rain";
export const RAIN_LAYER_ID = "rain-cells";

export const LAYER_IDS = {
	fillLow: "hazard-fill-low",
	fillMedium: "hazard-fill-medium",
	fillHigh: "hazard-fill-high",
	outline: "hazard-outline",
	selected: "hazard-selected",
} as const;

/** Every fill layer — used by tap handlers to know what is queryable. */
export const HAZARD_FILL_LAYER_IDS = [
	LAYER_IDS.fillLow,
	LAYER_IDS.fillMedium,
	LAYER_IDS.fillHigh,
];

export type HazardLayerOptions = {
	sourceId?: string;
	/** zone_id of the tapped polygon, or null */
	selectedZoneId?: string | null;
	/** overall opacity, so the basemap stays readable underneath */
	fillOpacity?: number;
	/** picks the hazard ramp — must match what the legend shows */
	theme?: Theme;
	/** render zones as extruded volumes, height driven by expected depth */
	extrude?: boolean;
};

/**
 * Extrusion height in metres, from the feature's own depth band.
 *
 * The height is data, not decoration: `depth_max` scaled up so the volumes
 * read at city zoom. NOAH's high class is open-ended (`depth_max` 0), so it
 * falls back to twice `depth_min` — 3 m, the same figure the converter uses
 * for its depth band. At ×22 that gives 11 m / 33 m / 66 m for the three
 * tiers: clearly ordered, tall enough to see at a 52° pitch, and nowhere near
 * mistakable for real geometry the way building extrusions are.
 */
const DEPTH_HEIGHT: ExpressionSpecification = [
	"*",
	22,
	[
		"max",
		["to-number", ["get", "depth_max"]],
		["*", ["to-number", ["get", "depth_min"]], 2],
	],
];

/**
 * Flattens the volumes as you zoom out, and this is a correctness fix rather
 * than a taste one.
 *
 * A 66 m volume is a few pixels tall at street zoom and a large fraction of a
 * polygon's own width at city zoom — so zoomed out, every zone drew its
 * footprint AND a roof displaced from it by the projection, joined by a wall.
 * Across the ~10k polygons of the 100-year set that read as the whole hazard
 * layer being doubled, and it got worse the further out you went, because the
 * height is in metres and the polygons shrink while it does not.
 *
 * Multiplying the height by zero below z12 collapses each volume onto its own
 * footprint, which is exactly a flat fill — the same picture the flat mode
 * draws, with no layer swap and no seam at the boundary. By z14, where a
 * polygon is comfortably larger than its own height, the volumes are back at
 * full height.
 *
 * The default camera sits at z10.2, so the map opens flat and grows into 3D
 * as you approach a street — which is also the order in which the two
 * readings are useful.
 */
const FADED_DEPTH_HEIGHT: ExpressionSpecification = [
	/* The interpolate has to be the OUTERMOST expression, and the height has
	   to be one of its stops. The style spec allows `zoom` only as the direct
	   input of a top-level step/interpolate, so multiplying a zoom ramp by the
	   depth expression — the obvious way to write this — is rejected outright
	   rather than merely discouraged. Interpolating from 0 up to the
	   data-driven height says the same thing in the shape the spec accepts. */
	"interpolate",
	["linear"],
	["zoom"],
	12,
	0,
	14,
	DEPTH_HEIGHT,
];

/**
 * The hazard layers, ordered low → medium → high so the most severe zone is
 * always the one drawn on top and therefore the one a tap resolves to.
 *
 * Returned as plain style specs: the native app renders them as `<Layer>`
 * children, the browser harness passes them to `map.addLayer`. Same objects,
 * two renderers.
 */
export function hazardLayers(
	options: HazardLayerOptions = {},
): LayerSpecification[] {
	const {
		sourceId = SOURCE_HAZARD,
		selectedZoneId = null,
		fillOpacity = 0.45,
		theme = "dark",
		extrude = false,
	} = options;

	const hazardColor = hazardColorFor(theme);
	const colors = colorsFor(theme);

	// Same ids in both modes, so hit-testing and visibility toggling never
	// care whether the zones are flat paint or standing volumes.
	const fills: LayerSpecification[] = hazardOrder.map((id) =>
		extrude
			? ({
					id: `hazard-fill-${id}`,
					type: "fill-extrusion",
					source: sourceId,
					filter: ["==", ["get", "hazard"], id],
					paint: {
						"fill-extrusion-color": hazardColor[id],
						"fill-extrusion-height": FADED_DEPTH_HEIGHT,
						"fill-extrusion-base": 0,
						// the vertical gradient is what sells the volume — the
						// walls shade darker toward the ground for free
						"fill-extrusion-vertical-gradient": true,
						"fill-extrusion-opacity": Math.min(0.85, fillOpacity + 0.3),
					},
				} as LayerSpecification)
			: ({
					id: `hazard-fill-${id}`,
					type: "fill",
					source: sourceId,
					filter: ["==", ["get", "hazard"], id],
					paint: {
						"fill-color": hazardColor[id],
						// fade in slightly as you zoom so the overview isn't a
						// wall of colour
						"fill-opacity": [
							"interpolate",
							["linear"],
							["zoom"],
							9,
							fillOpacity * 0.8,
							14,
							fillOpacity,
						],
					},
				} as LayerSpecification),
	);

	const chrome: LayerSpecification[] = [
		{
			id: LAYER_IDS.selected,
			type: "line",
			source: sourceId,
			// empty string never matches, so nothing highlights until a tap
			filter: ["==", ["get", "zone_id"], selectedZoneId ?? ""],
			paint: {
				"line-color": colors.ink,
				"line-width": 2.5,
				"line-opacity": 0.95,
			},
		},
	];

	/**
	 * Outlines only in flat mode, and only as you zoom in.
	 *
	 * The NOAH export is thousands of small polygons; at city-wide zoom an
	 * always-on outline around every one of them reads as noise, not data —
	 * the fills alone carry the picture there. The stroke earns its place at
	 * street zoom, where zone boundaries become something you act on. In
	 * extruded mode the volume's own shaded walls do this job.
	 */
	if (!extrude) {
		chrome.unshift({
			id: LAYER_IDS.outline,
			type: "line",
			source: sourceId,
			paint: {
				"line-color": [
					"match",
					["get", "hazard"],
					"low",
					hazardColor.low,
					"medium",
					hazardColor.medium,
					"high",
					hazardColor.high,
					colors.inkDim,
				],
				/* Visible from the opening view, not only at street zoom.
				   The stroke used to fade in from z11 because an outline
				   around every one of thousands of polygons read as noise —
				   true when the fills were opaque enough to carry the shape
				   on their own. Over satellite imagery they are not: a band
				   edge is where one wash of colour meets another against a
				   background of greens and browns, and the eye needs the
				   line to find it. Each outline is its own band's colour, so
				   it sharpens the boundary rather than drawing a grid over
				   the city. */
				"line-width": [
					"interpolate",
					["linear"],
					["zoom"],
					9,
					0.5,
					13,
					0.9,
					16,
					1.6,
				],
				"line-opacity": [
					"interpolate",
					["linear"],
					["zoom"],
					9,
					0.5,
					13,
					0.7,
					15,
					0.9,
				],
			},
		});
	}

	return [...fills, ...chrome];
}

/*
 * There is deliberately no layer here for a line from where you are to where
 * you could go. Any line between two points on a map reads as a route, dashed
 * or not, and this app has no road network behind it and no knowledge of
 * which streets are passable. The destination gets a pin; the walking is
 * handed off to a maps app that owns the roads (see evacuation.ts).
 */

/** Hazard sits under labels but over everything else. */
export const HAZARD_BEFORE_ID = FIRST_LABEL_LAYER;

/**
 * The rain grid: flat squares under the hazard polygons.
 *
 * Under, always. Rain is context and hazard is the safety information, so if
 * the two overlap the depth bands are the ones that must stay readable — and
 * the opacity here is low enough that they do.
 *
 * No outline. A stroke would make the squares read as boundaries of something
 * real, when they are only the resolution the weather model happens to have.
 */
export function rainLayers(theme: Theme = "dark"): LayerSpecification[] {
  const rain = rainColorsFor(theme === "light" ? "light" : "dark");
  return [
    {
      id: RAIN_LAYER_ID,
      type: "fill",
      source: SOURCE_RAIN,
      paint: {
        "fill-color": [
          "match",
          ["get", "band"],
          "light",
          rain.light,
          "moderate",
          rain.moderate,
          "heavy",
          rain.heavy,
          "intense",
          rain.intense,
          "torrential",
          rain.torrential,
          rain.light,
        ],
        // heavier rain reads more solid, so intensity survives even if the
        // legend is off screen
        "fill-opacity": [
          "match",
          ["get", "band"],
          "light",
          0.18,
          "moderate",
          0.26,
          "heavy",
          0.34,
          "intense",
          0.42,
          "torrential",
          0.5,
          0.2,
        ],
      },
    },
  ];
}

/* ---------------- landslide susceptibility ---------------- */

export const SOURCE_LANDSLIDE = "landslide";

export const LANDSLIDE_LAYER_IDS = [
	"landslide-fill-low",
	"landslide-fill-medium",
	"landslide-fill-high",
] as const;

/**
 * The landslide overlay.
 *
 * Flat fills only — never extruded, and this is not a styling preference.
 * The flood layer's extrusion height is its depth band, a real quantity the
 * volume is a picture of. Susceptibility has no depth and no thickness; a
 * standing volume would be inventing a dimension the data does not have, and
 * on the steep ground this layer covers it would also fight the terrain mesh
 * it is draped over.
 *
 * Drawn UNDER the flood layer when both are on. Where the two overlap — the
 * valley floors below a susceptible slope — flood depth is the more
 * immediately actionable of the two, and the purple showing through at
 * partial opacity is enough to say the slope above is also a hazard.
 *
 * Outlines are folded into the fill rather than given their own layer: at
 * ~5,400 polygons across mountainous terrain a separate stroke per polygon
 * read as a mesh laid over the uplands, which is the noise problem the hazard
 * outlines were tuned away from, worse.
 */
export function landslideLayers(theme: Theme = "dark"): LayerSpecification[] {
	const color = landslideColorFor(theme);

	return landslideOrder.map((id) => ({
		id: `landslide-fill-${id}`,
		type: "fill",
		source: SOURCE_LANDSLIDE,
		filter: ["==", ["get", "hazard"], id],
		paint: {
			"fill-color": color[id],
			/* Rising with severity, and further apart than the flood ramp's.
			   This layer covers most of the upland half of the city, so a low
			   class painted at flood-layer strength would put a flat wash over
			   a third of the map. Low stays faint enough to read as terrain
			   context; high is solid enough to find at a glance, which is the
			   one a "no dwelling zone" ruling deserves. */
			"fill-opacity": [
				"interpolate",
				["linear"],
				["zoom"],
				9,
				id === "high" ? 0.42 : id === "medium" ? 0.3 : 0.18,
				14,
				id === "high" ? 0.55 : id === "medium" ? 0.4 : 0.24,
			],
		},
	})) as LayerSpecification[];
}

/* ---------------- the barangay outlines ---------------- */

export const SOURCE_BARANGAYS = "barangays";

export const BARANGAY_LAYER_IDS = {
	outline: "barangay-outline",
	focusFill: "barangay-focus-fill",
	focusLine: "barangay-focus-line",
} as const;

/**
 * Barangay boundaries, for the 117 of 183 that OpenStreetMap actually has.
 *
 * Two jobs, and they need very different weights.
 *
 * The faint always-on outline is orientation: "which barangay am I looking
 * at" is the question every local asks of a city map, and the hazard polygons
 * cross those lines constantly. It fades in from z11 and never gets strong,
 * because 117 outlines drawn firmly over the whole city is the same noise
 * problem the hazard outlines were tuned away from — at the overview it would
 * compete with the thing people came to read.
 *
 * The focus pair is the answer to "show me Talomo": one barangay picked out
 * by name, with a wash and a firm edge. It carries no hazard meaning and so
 * uses the brand accent rather than anything on the hazard ramp — a barangay
 * being selected must never look like a barangay being warned about.
 */
export function barangayLayers(theme: Theme = "dark"): LayerSpecification[] {
	const colors = colorsFor(theme);

	return [
		{
			id: BARANGAY_LAYER_IDS.outline,
			type: "line",
			source: SOURCE_BARANGAYS,
			minzoom: 11,
			paint: {
				"line-color": colors.inkDim,
				"line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.4, 16, 1.1],
				// never above a third: this is context, and the hazard bands and
				// the city boundary both have to stay louder than it
				"line-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0, 13, 0.28, 16, 0.34],
			},
		},
		{
			id: BARANGAY_LAYER_IDS.focusFill,
			type: "fill",
			source: SOURCE_BARANGAYS,
			// empty string never matches, so nothing is picked out until asked
			filter: ["==", ["get", "name"], ""],
			paint: { "fill-color": colors.tide, "fill-opacity": 0.1 },
		},
		{
			id: BARANGAY_LAYER_IDS.focusLine,
			type: "line",
			source: SOURCE_BARANGAYS,
			filter: ["==", ["get", "name"], ""],
			layout: { "line-cap": "round", "line-join": "round" },
			paint: {
				"line-color": colors.tide,
				"line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.4, 16, 2.6],
				"line-opacity": 0.9,
			},
		},
	];
}

/* ---------------- the city outline ---------------- */

export const SOURCE_BOUNDARY = "city-boundary";

/** Casing first, line second — order matters, the casing draws underneath. */
export const BOUNDARY_LAYER_IDS = [
	"city-boundary-casing",
	"city-boundary-line",
] as const;

/**
 * Davao City's administrative outline.
 *
 * Worth drawing because the hazard data stops at the city limit and nothing
 * on the map said so. Zones simply ran out mid-landscape, which reads as "no
 * flooding beyond this point" rather than "not surveyed here" — the same
 * failure mode as a blank map, just smaller. With the line in place the edge
 * of the data is visibly the edge of the city.
 *
 * Dashed, and this is not decoration: a dashed line is the cartographic
 * convention for an administrative border, and it is what stops a 70 km line
 * running down a valley from being read as a river or a highway. The casing
 * underneath is what keeps it legible over satellite imagery, where a thin
 * light line disappears into cloud and a thin dark one into forest.
 *
 * Reference geometry, so it is never queryable and never toggled with the
 * hazard overlay — the boundary is true regardless of which scenario, or
 * whether any hazard is shown at all.
 */
export function boundaryLayers(theme: Theme = "dark"): LayerSpecification[] {
	const colors = colorsFor(theme);

	return [
		{
			id: BOUNDARY_LAYER_IDS[0],
			type: "line",
			source: SOURCE_BOUNDARY,
			layout: { "line-cap": "round", "line-join": "round" },
			paint: {
				// the opposite of the line it carries, so one of the two always
				// has contrast against whatever is underneath
				"line-color": theme === "light" ? "#ffffff" : "#000000",
				"line-width": ["interpolate", ["linear"], ["zoom"], 8, 3.2, 12, 4.4, 16, 6],
				"line-opacity": 0.5,
				"line-blur": 1.5,
			},
		},
		{
			id: BOUNDARY_LAYER_IDS[1],
			type: "line",
			source: SOURCE_BOUNDARY,
			// butt caps, not round: round caps on a dashed line swell every dash
			// into a lozenge and the border stops reading as a border
			layout: { "line-cap": "butt", "line-join": "round" },
			paint: {
				"line-color": colors.ink,
				"line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.1, 12, 1.7, 16, 2.4],
				"line-opacity": 0.8,
				"line-dasharray": [3, 2],
			},
		},
	];
}
