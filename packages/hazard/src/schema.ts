// imported explicitly rather than via the ambient `GeoJSON` global, which does
// not survive across package boundaries under pnpm's isolated linker
import type { Feature, FeatureCollection, Polygon } from "geojson";

import type { HazardId } from "./tiers";
import type { ScenarioYears } from "./scenarios";

/**
 * THE DATA CONTRACT.
 *
 * This is the shape the synthetic dataset emits today and the shape the real
 * UP NOAH export must be transformed into. Everything downstream — layer
 * filters, the zone info sheet, search — reads only these properties.
 *
 * Swapping placeholder data for real data means producing files that satisfy
 * this type. No component changes.
 */
export type HazardProperties = {
	/** stable per-feature id, used for selection highlighting */
	zone_id: string;
	/** UP NOAH hazard class */
	hazard: HazardId;
	/** metres */
	depth_min: number;
	depth_max: number;
	/** barangay name, matching `barangays.ts` */
	barangay: string;
	/** return period this feature belongs to */
	scenario: ScenarioYears;
};

export type HazardFeature = Feature<Polygon, HazardProperties>;
export type HazardCollection = FeatureCollection<Polygon, HazardProperties>;

/** Narrowing helper for tap handlers, which hand back loosely-typed features. */
export function asHazardProperties(
	value: unknown,
): HazardProperties | undefined {
	if (!value || typeof value !== "object") return undefined;
	const p = value as Record<string, unknown>;
	if (typeof p["zone_id"] !== "string") return undefined;
	if (
		p["hazard"] !== "low" &&
		p["hazard"] !== "medium" &&
		p["hazard"] !== "high"
	) {
		return undefined;
	}
	if (typeof p["barangay"] !== "string") return undefined;
	return {
		zone_id: p["zone_id"],
		hazard: p["hazard"],
		depth_min: Number(p["depth_min"] ?? 0),
		depth_max: Number(p["depth_max"] ?? 0),
		barangay: p["barangay"],
		scenario: (Number(p["scenario"]) || 25) as ScenarioYears,
	};
}

/** "0.5 – 1.5 m" / "over 1.5 m" — one formatter, every surface. */
export function formatDepth(p: Pick<HazardProperties, "depth_min" | "depth_max">): string {
	if (!p.depth_max || p.depth_max <= p.depth_min) {
		return `over ${p.depth_min.toFixed(1)} m`;
	}
	return `${p.depth_min.toFixed(1)} – ${p.depth_max.toFixed(1)} m`;
}
