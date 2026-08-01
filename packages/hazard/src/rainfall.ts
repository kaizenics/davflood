import { PANABO_CENTER } from "./geo";

/**
 * Open-Meteo rainfall. Free, no API key, no attribution beyond CC BY.
 *
 * Rainfall is a *bonus* on top of the hazard map, never a dependency of it —
 * every consumer must degrade silently when this fails. During a storm the
 * network is the first thing to go, and the hazard layer is what matters.
 */

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export type RainfallDay = {
	/** ISO date, e.g. "2026-08-02" */
	date: string;
	/** total precipitation, mm */
	precipitation: number;
	/** max chance of precipitation, 0–100 */
	probability: number;
	weatherCode: number;
};

export type Rainfall = {
	current: {
		precipitation: number;
		weatherCode: number;
		isDay: boolean;
	};
	days: RainfallDay[];
};

export function rainfallUrl(
	[lng, lat]: readonly [number, number] = PANABO_CENTER,
): string {
	const params = new URLSearchParams({
		latitude: lat.toFixed(4),
		longitude: lng.toFixed(4),
		current: "precipitation,weather_code,is_day",
		daily: "precipitation_sum,precipitation_probability_max,weather_code",
		timezone: "Asia/Manila",
		forecast_days: "4",
	});
	return `${ENDPOINT}?${params.toString()}`;
}

type RawResponse = {
	current?: {
		precipitation?: number;
		weather_code?: number;
		is_day?: number;
	};
	daily?: {
		time?: string[];
		precipitation_sum?: (number | null)[];
		precipitation_probability_max?: (number | null)[];
		weather_code?: (number | null)[];
	};
};

export function parseRainfall(raw: unknown): Rainfall {
	const r = (raw ?? {}) as RawResponse;
	const d = r.daily ?? {};
	const times = d.time ?? [];

	return {
		current: {
			precipitation: r.current?.precipitation ?? 0,
			weatherCode: r.current?.weather_code ?? 0,
			isDay: (r.current?.is_day ?? 1) === 1,
		},
		days: times.map((date, i) => ({
			date,
			precipitation: d.precipitation_sum?.[i] ?? 0,
			probability: d.precipitation_probability_max?.[i] ?? 0,
			weatherCode: d.weather_code?.[i] ?? 0,
		})),
	};
}

export async function fetchRainfall(
	center?: readonly [number, number],
	signal?: AbortSignal,
): Promise<Rainfall> {
	const res = await fetch(rainfallUrl(center), { signal });
	if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
	return parseRainfall(await res.json());
}

/** WMO weather interpretation codes, trimmed to what matters here. */
export function describeWeather(code: number): string {
	if (code === 0) return "Clear";
	if (code <= 3) return "Partly cloudy";
	if (code <= 48) return "Fog";
	if (code <= 57) return "Drizzle";
	if (code <= 67) return "Rain";
	if (code <= 77) return "Showers";
	if (code <= 82) return "Heavy showers";
	if (code <= 86) return "Squalls";
	return "Thunderstorm";
}

/**
 * Editorial banding for the rainfall panel. Deliberately NOT the hazard
 * colours — rain volume is not flood hazard, and conflating them would be
 * exactly the confusion the disclaimer exists to prevent.
 */
export function rainBand(mm: number): "none" | "light" | "moderate" | "heavy" {
	if (mm < 1) return "none";
	if (mm < 15) return "light";
	if (mm < 50) return "moderate";
	return "heavy";
}
