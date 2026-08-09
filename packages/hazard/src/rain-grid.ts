import type { Feature, FeatureCollection, Polygon } from "geojson";

import { DAVAO_DATA_BBOX } from "./geo";
import type { LngLat } from "./geo";

/**
 * Rain falling across the city, as a coarse grid.
 *
 * This is WEATHER, not hazard. It answers "is it raining over there right
 * now", which is the question people actually ask during a storm, and it
 * answers it without pretending to know whether anywhere is flooded. The two
 * must never be blended into a single "risk" figure: the hazard map is a
 * model of where water goes, this is a model of where rain is falling, and
 * combining them into one number would invent a claim neither one supports.
 *
 * Deliberately square, deliberately coarse. Open-Meteo snaps every request to
 * its model grid — ask for 7.06 and it answers for 7.065 — so the honest
 * rendering is one cell per model cell. A smooth heatmap over the same data
 * would imply street-level precision that does not exist.
 */

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

/**
 * Model grid spacing, in degrees.
 *
 * Measured from the API rather than assumed: consecutive returned latitudes
 * come back ~0.07 apart, about 8 km. Sampling finer than this returns
 * duplicate cells and spends request budget for no extra information.
 */
export const RAIN_CELL_DEG = 0.07;

/**
 * PAGASA's rainfall intensity bands, in mm per hour.
 *
 * The local standard, and the same words Filipino forecasters use on air, so
 * the legend agrees with the advisory someone is hearing on the radio.
 *
 * NOT `rainBand()` from ./rainfall — that one classifies a DAILY total, where
 * 15 mm is a light day. Fifteen millimetres in one hour is a downpour. Same
 * unit, different question, so the two scales stay apart.
 */
export type RainBandId =
  | "none"
  | "light"
  | "moderate"
  | "heavy"
  | "intense"
  | "torrential";

export type RainBand = {
  id: RainBandId;
  label: string;
  /** lower bound, mm per hour */
  min: number;
  /** what it looks like out of a window */
  human: string;
};

export const RAIN_BANDS: RainBand[] = [
  { id: "light", label: "Light", min: 0.1, human: "Umbrella weather" },
  { id: "moderate", label: "Moderate", min: 2.5, human: "Steady rain" },
  { id: "heavy", label: "Heavy", min: 7.5, human: "Roads wet fast" },
  { id: "intense", label: "Intense", min: 15, human: "Hard to see" },
  { id: "torrential", label: "Torrential", min: 30, human: "Roaring" },
];

/**
 * A blue-to-violet ramp, chosen so it cannot be confused with anything else
 * on the map: the hazard ramp owns yellow through red, and `tide` owns the
 * cyan the interface is built from. Rain gets the third family, which is also
 * what every radar picture in the world already uses.
 */
const RAIN_COLORS: Record<"dark" | "light", Record<RainBandId, string>> = {
  dark: {
    none: "#00000000",
    light: "#6ea8ff",
    moderate: "#4d7cf3",
    heavy: "#6a5bf0",
    intense: "#9b4df0",
    torrential: "#e05ce0",
  },
  light: {
    none: "#00000000",
    light: "#3a6fd8",
    moderate: "#2c53c4",
    heavy: "#4a3bc4",
    intense: "#7a2fbf",
    torrential: "#a3199f",
  },
};

export function rainColorsFor(theme: "dark" | "light") {
  return RAIN_COLORS[theme];
}

/** Which band a rate in mm/h falls in. */
export function rainRateBand(mmPerHour: number): RainBandId {
  let band: RainBandId = "none";
  for (const b of RAIN_BANDS) {
    if (mmPerHour >= b.min) band = b.id;
  }
  return band;
}

export type RainCell = {
  /** mm in the current hour */
  mm: number;
  band: RainBandId;
};

export type RainGrid = {
  cells: FeatureCollection<Polygon, RainCell>;
  /** the model hour these figures describe, as the API reported it */
  time: string | null;
  /** highest rate anywhere on the grid, mm/h */
  peakMm: number;
};

export const EMPTY_RAIN_GRID: RainGrid = {
  cells: { type: "FeatureCollection", features: [] },
  time: null,
  peakMm: 0,
};

/**
 * Sample points covering the city.
 *
 * Not clipped to the city outline on purpose. Rain over Davao Gulf is the
 * rain that is about to be over Davao, and a weather layer that stops dead at
 * an administrative boundary hides the storm on its way in.
 */
export function rainGridPoints(): LngLat[] {
  const [w, s, e, n] = DAVAO_DATA_BBOX;
  const points: LngLat[] = [];
  for (let lat = s; lat <= n + 1e-9; lat += RAIN_CELL_DEG) {
    for (let lng = w; lng <= e + 1e-9; lng += RAIN_CELL_DEG) {
      points.push([Number(lng.toFixed(4)), Number(lat.toFixed(4))]);
    }
  }
  return points;
}

export function rainGridUrl(points: LngLat[]): string {
  const params = new URLSearchParams({
    latitude: points.map((p) => p[1].toFixed(4)).join(","),
    longitude: points.map((p) => p[0].toFixed(4)).join(","),
    current: "precipitation",
    timezone: "Asia/Manila",
  });
  return `${ENDPOINT}?${params.toString()}`;
}

type RawPoint = {
  latitude?: number;
  longitude?: number;
  current?: { time?: string; precipitation?: number };
};

/**
 * One cell per MODEL cell, not per requested point.
 *
 * Several requested points snap to the same model cell; keying on the
 * coordinates the API answers with collapses those duplicates, and means the
 * squares drawn are the model's own, not ours.
 */
export function parseRainGrid(raw: unknown): RainGrid {
  const list: RawPoint[] = Array.isArray(raw) ? raw : [raw as RawPoint];
  const half = RAIN_CELL_DEG / 2;
  const seen = new Map<string, Feature<Polygon, RainCell>>();
  let time: string | null = null;
  let peakMm = 0;

  for (const p of list) {
    const lat = p?.latitude;
    const lng = p?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    const mm = p.current?.precipitation ?? 0;
    time ??= p.current?.time ?? null;
    if (mm > peakMm) peakMm = mm;

    // nothing to draw for a dry cell, and an empty source is cheaper to tile
    if (mm < 0.1) continue;

    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (seen.has(key)) continue;

    seen.set(key, {
      type: "Feature",
      properties: { mm, band: rainRateBand(mm) },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lng - half, lat - half],
            [lng + half, lat - half],
            [lng + half, lat + half],
            [lng - half, lat + half],
            [lng - half, lat - half],
          ],
        ],
      },
    });
  }

  return {
    cells: { type: "FeatureCollection", features: [...seen.values()] },
    time,
    peakMm,
  };
}

export async function fetchRainGrid(signal?: AbortSignal): Promise<RainGrid> {
  const res = await fetch(rainGridUrl(rainGridPoints()), { signal });
  if (!res.ok) throw new Error(`Rain grid unavailable (${res.status})`);
  return parseRainGrid(await res.json());
}
