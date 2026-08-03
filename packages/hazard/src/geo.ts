import type { Polygon } from "geojson";

/** Geography constants for Davao City, Davao Region. */

export type LngLat = [lng: number, lat: number];
/** [west, south, east, north] — GeoJSON bbox order. */
export type BBox = [number, number, number, number];

/** Davao City, roughly the city centre. From OSM relation 3936841. */
export const DAVAO_CENTER: LngLat = [125.6081, 7.0648];

/**
 * Bounding box the camera is clamped to — the whole of Davao City plus a
 * little context at the edges. From the OSM city boundary: at roughly 53 km
 * across and 72 km tall this is the largest city in the Philippines by land
 * area, which is why the default zoom is further out than a normal city map.
 */
export const DAVAO_BBOX: BBox = [125.16, 6.9, 125.75, 7.66];

/** The city boundary itself, used for clipping the hazard export. */
export const DAVAO_DATA_BBOX: BBox = [125.2176, 6.9562, 125.6972, 7.6058];

export const CAMERA = {
	center: DAVAO_CENTER,
	// the city is ~53 x 72 km, so the overview sits a level further out
	zoom: 10.2,
	minZoom: 8.5,
	maxZoom: 17,
	/** the whole point of a terrain map — start tilted */
	pitch: 52,
	bearing: -18,
	/**
	 * 85° is maplibre's ceiling and reads as standing on the ground. The
	 * horizon and sky config exist precisely so this view has something to
	 * meet at the top of the screen.
	 */
	maxPitch: 85,
} as const;

/** Named camera angles for the view control. Values are pitch in degrees. */
export const PITCH_PRESETS = [
	{ id: "top", label: "Top-down", pitch: 0 },
	{ id: "tilted", label: "Tilted", pitch: 52 },
	{ id: "street", label: "Street", pitch: 85 },
] as const;

/** Offline pack extent — z14 is OpenFreeMap's max. */
export const OFFLINE_PACK = {
	name: "davao-basemap",
	bounds: DAVAO_DATA_BBOX,
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
export function inBBox([lng, lat]: LngLat, b: BBox = DAVAO_BBOX): boolean {
	return lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3];
}
