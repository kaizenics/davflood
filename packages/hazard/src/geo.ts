import type { Polygon } from "geojson";

/** Geography constants for Panabo City, Davao del Norte. */

export type LngLat = [lng: number, lat: number];
/** [west, south, east, north] — GeoJSON bbox order. */
export type BBox = [number, number, number, number];

/** Panabo City hall, roughly. */
export const PANABO_CENTER: LngLat = [125.6839, 7.3081];

/**
 * Bounding box the camera is clamped to. Generous enough to show context at
 * the edges without letting the user wander to a part of the world we have
 * no hazard data for.
 */
export const PANABO_BBOX: BBox = [125.58, 7.21, 125.8, 7.44];

/** Tighter box used for offline pack download and data generation. */
export const PANABO_DATA_BBOX: BBox = [125.6, 7.23, 125.78, 7.42];

export const CAMERA = {
	center: PANABO_CENTER,
	zoom: 11.4,
	minZoom: 9.5,
	maxZoom: 16,
	/** the whole point of a terrain map — start tilted */
	pitch: 52,
	bearing: -18,
	maxPitch: 70,
} as const;

/** Offline pack extent — z14 is OpenFreeMap's max. */
export const OFFLINE_PACK = {
	name: "panabo-basemap",
	bounds: PANABO_DATA_BBOX,
	minZoom: 10,
	maxZoom: 14,
} as const;

export function bboxToPolygon(b: BBox): Polygon {
	const [w, s, e, n] = b;
	return {
		type: "Polygon",
		coordinates: [
			[
				[w, s],
				[e, s],
				[e, n],
				[w, n],
				[w, s],
			],
		],
	};
}

/** Cheap point-in-bbox, good enough for camera clamping. */
export function inBBox([lng, lat]: LngLat, b: BBox = PANABO_BBOX): boolean {
	return lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3];
}
