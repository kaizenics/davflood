import type { LayerSpecification } from "@maplibre/maplibre-gl-style-spec";

import { FIRST_LABEL_LAYER } from "./style";
import { hazardColor, hazardOrder } from "./tiers";
import { colors } from "./tokens";

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
};

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
	} = options;

	const fills: LayerSpecification[] = hazardOrder.map((id) => ({
		id: `hazard-fill-${id}`,
		type: "fill",
		source: sourceId,
		filter: ["==", ["get", "hazard"], id],
		paint: {
			"fill-color": hazardColor[id],
			// fade in slightly as you zoom so the overview isn't a wall of colour
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
	}));

	return [
		...fills,
		{
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
				"line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 16, 1.6],
				"line-opacity": 0.85,
			},
		},
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
}

/** Hazard sits under labels but over everything else. */
export const HAZARD_BEFORE_ID = FIRST_LABEL_LAYER;
