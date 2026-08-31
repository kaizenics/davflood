/**
 * How hard the river is running, without a sensor in it.
 *
 * GloFAS — the Copernicus global flood model — forecasts river discharge from
 * rainfall over the whole catchment, so it sees water that has fallen upstream
 * and is on its way down. That is the failure mode local rainfall cannot
 * cover: it can be dry over Poblacion while rain in the highlands is already
 * heading for the riverside barangays.
 *
 * Served by Open-Meteo's flood API. Free, keyless, same provider as the
 * rainfall already in the app.
 *
 * WHAT IT IS NOT: a measurement, and not a statement about any street. It is a
 * daily forecast for a ~5 km cell of river channel. It says the river is
 * expected to run high; it does not say anywhere is flooded.
 */

const ENDPOINT = "https://flood-api.open-meteo.com/v1/flood";

/**
 * The gauge point.
 *
 * Chosen by probing GloFAS across the city's bounding box and taking the cell
 * with the largest discharge — the largest catchment, i.e. the main channel
 * rather than a tributary. 109 of 117 probed cells carry a river; this one is
 * the trunk, north of the city and upstream of it, which is the useful place
 * to watch from.
 */
export const RIVER_GAUGE = {
  name: "Davao River",
  where: "upstream of the city",
  lat: 7.275,
  lng: 125.625,
} as const;

/**
 * Five years of daily discharge (2021-01-01 to 2025-12-31, 1826 days) from
 * the same API, reduced to percentiles and baked in.
 *
 * Baked rather than fetched because "is this high?" needs a reference, and
 * pulling five years of history on every page load to answer it would cost
 * more than the forecast itself. Recompute with scripts/baseline-river.ts if
 * the gauge point ever moves.
 */
export const RIVER_NORMAL = {
  min: 5.67,
  p50: 30.33,
  p90: 57.08,
  p95: 68.82,
  p99: 97.4,
  max: 144.88,
  days: 1826,
  from: "2021",
  to: "2025",
} as const;

export type RiverLevelId = "low" | "normal" | "elevated" | "high" | "very-high";

export type RiverLevel = {
  id: RiverLevelId;
  label: string;
  /** what the number means, in the app's voice */
  blurb: string;
};

const LEVELS: Record<RiverLevelId, RiverLevel> = {
  low: {
    id: "low",
    label: "Low",
    blurb: "Running below its usual level for the year.",
  },
  normal: {
    id: "normal",
    label: "Normal",
    blurb: "Running about as it usually does.",
  },
  elevated: {
    id: "elevated",
    label: "Elevated",
    blurb: "Higher than nine days in ten. Worth watching if rain continues.",
  },
  high: {
    id: "high",
    label: "High",
    blurb: "In the top 5% of the last five years.",
  },
  "very-high": {
    id: "very-high",
    label: "Very high",
    blurb: "In the top 1% of the last five years.",
  },
};

export function riverLevel(m3s: number): RiverLevel {
  if (m3s >= RIVER_NORMAL.p99) return LEVELS["very-high"];
  if (m3s >= RIVER_NORMAL.p95) return LEVELS.high;
  if (m3s >= RIVER_NORMAL.p90) return LEVELS.elevated;
  if (m3s >= RIVER_NORMAL.p50) return LEVELS.normal;
  return LEVELS.low;
}

export type RiverDay = {
  /** ISO date */
  date: string;
  /** cubic metres per second */
  discharge: number;
};

export type River = {
  today: number;
  /** ISO date used for the current reading */
  todayDate: string;
  /** today's flow as a multiple of the five-year median */
  timesNormal: number;
  level: RiverLevel;
  days: RiverDay[];
  /** the wettest day in the forecast window, if it is not today */
  peak: RiverDay | null;
};

export function riverUrl(): string {
  const params = new URLSearchParams({
    latitude: String(RIVER_GAUGE.lat),
    longitude: String(RIVER_GAUGE.lng),
    daily: "river_discharge",
    past_days: "6",
    forecast_days: "7",
    timezone: "Asia/Manila",
  });
  return `${ENDPOINT}?${params.toString()}`;
}

export function parseRiver(raw: unknown): River {
  const d = (raw as { daily?: { time?: string[]; river_discharge?: (number | null)[] } })
    ?.daily;
  const times = d?.time ?? [];
  const flows = d?.river_discharge ?? [];

  const days: RiverDay[] = [];
  for (let i = 0; i < times.length; i++) {
    const date = times[i];
    const discharge = flows[i];
    if (!date || typeof discharge !== "number") continue;
    days.push({ date, discharge });
  }

  const todayIso = dateInManila();
  const todayIndex = days.findIndex((day) => day.date === todayIso);
  // Keep the parser useful for fixtures and graceful if the provider ever
  // omits today's date: the old response shape began with today.
  const currentIndex = todayIndex >= 0 ? todayIndex : 0;
  const current = days[currentIndex];
  const today = current?.discharge ?? 0;
  const rest = days.slice(currentIndex + 1);
  const peak = rest.reduce<RiverDay | null>(
    (best, day) => (!best || day.discharge > best.discharge ? day : best),
    null,
  );

  return {
    today,
    todayDate: current?.date ?? todayIso,
    timesNormal: today / RIVER_NORMAL.p50,
    level: riverLevel(today),
    days,
    // only interesting if it is meaningfully above today
    peak: peak && peak.discharge > today * 1.15 ? peak : null,
  };
}

function dateInManila(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export async function fetchRiver(signal?: AbortSignal): Promise<River> {
  const res = await fetch(riverUrl(), { signal });
  if (!res.ok) throw new Error(`River forecast unavailable (${res.status})`);
  return parseRiver(await res.json());
}
