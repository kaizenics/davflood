import type {
	ExpressionSpecification,
	LayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";

import { FIRST_LABEL_LAYER } from "./style";
import { hazardColorFor, hazardOrder } from "./tiers";
import { colorsFor } from "./tokens";
import type { Theme } from "./tokens";

export const SOURCE_HAZARD = "hazard";

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

/** Hazard sits under labels but over everything else. */
export const HAZARD_BEFORE_ID = FIRST_LABEL_LAYER;
