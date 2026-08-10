import type {
	ExpressionSpecification,
	LayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";

import { rainColorsFor } from "./rain-grid";
import { FIRST_LABEL_LAYER } from "./style";
import { hazardColorFor, hazardOrder } from "./tiers";
import { colorsFor } from "./tokens";
import type { Theme } from "./tokens";

export const SOURCE_HAZARD = "hazard";
export const SOURCE_RAIN = "rain";
export const RAIN_LAYER_ID = "rain-cells";
export const SOURCE_GUIDE = "guide";
export const GUIDE_LAYER_IDS = {
  casing: "guide-casing",
  line: "guide-line",
} as const;

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
						"fill-extrusion-height": DEPTH_HEIGHT,
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
				"line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.4, 16, 1.6],
				"line-opacity": [
					"interpolate",
					["linear"],
					["zoom"],
					11,
					0,
					13,
					0.45,
					15,
					0.85,
				],
			},
		});
	}

	return [...fills, ...chrome];
}

/**
 * The line from where you are to where you could go.
 *
 * DASHED, and that is the whole design. A solid line between two points on a
 * map is the universal sign for a route, and this is not one — there is no
 * road network behind it and no knowledge of which streets are passable. A
 * dash is what cartography has always used for "direct line, work out the
 * walking yourself", and it is the only honest way to draw a bearing on a map
 * that is otherwise full of real geometry.
 *
 * A dark casing underneath keeps it legible over yellow fills and satellite
 * imagery alike.
 */
export function guideLayers(theme: Theme = "dark"): LayerSpecification[] {
  const colors = colorsFor(theme);
  return [
    {
      id: GUIDE_LAYER_IDS.casing,
      type: "line",
      source: SOURCE_GUIDE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.abyss,
        "line-width": 7,
        "line-opacity": 0.55,
      },
    },
    {
      id: GUIDE_LAYER_IDS.line,
      type: "line",
      source: SOURCE_GUIDE,
      layout: { "line-cap": "butt", "line-join": "round" },
      paint: {
        "line-color": colors.tide,
        "line-width": 3.5,
        "line-dasharray": [1.4, 1.2],
      },
    },
  ];
}

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
