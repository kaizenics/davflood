import { DAVAO_CENTER } from "./geo";

/**
 * Open-Meteo rainfall. Free, no API key, no attribution beyond CC BY.
 *
 * Rainfall is a *bonus* on top of the hazard map, never a dependency of it —
 * every consumer must degrade silently when this fails. During a storm the
 * network is the first thing to go, and the hazard layer is what matters.
 */

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export type RainfallHour = {
	/** local ISO timestamp, e.g. "2026-08-03T14:00" */
	time: string;
	/** hour of day, 0–23 */
	hour: number;
	/** precipitation in that hour, mm */
	precipitation: number;
	/** chance of precipitation in that hour, 0–100 */
	probability: number;
	weatherCode: number;
};

export type RainfallDay = {
	/** ISO date, e.g. "2026-08-02" */
	date: string;
	/** total precipitation, mm */
	precipitation: number;
	/** max chance of precipitation, 0–100 */
	probability: number;
	weatherCode: number;
	/** the 24 hours making up this day, in order */
	hours: RainfallHour[];
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
	[lng, lat]: readonly [number, number] = DAVAO_CENTER,
): string {
	const params = new URLSearchParams({
		latitude: lat.toFixed(4),
		longitude: lng.toFixed(4),
		current: "precipitation,weather_code,is_day",
		daily: "precipitation_sum,precipitation_probability_max,weather_code",
		hourly: "precipitation,precipitation_probability,weather_code",
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
	hourly?: {
		time?: string[];
		precipitation?: (number | null)[];
		precipitation_probability?: (number | null)[];
		weather_code?: (number | null)[];
	};
};

export function parseRainfall(raw: unknown): Rainfall {
	const r = (raw ?? {}) as RawResponse;
	const d = r.daily ?? {};
	const times = d.time ?? [];

	// Open-Meteo returns a flat 96-hour series; bucket it by date so each day
	// carries its own 24 hours rather than making every consumer re-slice it.
	const h = r.hourly ?? {};
	const hourTimes = h.time ?? [];
	const byDate = new Map<string, RainfallHour[]>();

	for (let i = 0; i < hourTimes.length; i++) {
		const stamp = hourTimes[i];
		if (!stamp) continue;
		const [date, clock] = stamp.split("T");
		if (!date) continue;
		const bucket = byDate.get(date) ?? [];
		bucket.push({
			time: stamp,
			hour: Number(clock?.slice(0, 2) ?? 0),
			precipitation: h.precipitation?.[i] ?? 0,
			probability: h.precipitation_probability?.[i] ?? 0,
			weatherCode: h.weather_code?.[i] ?? 0,
		});
		byDate.set(date, bucket);
	}

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
			hours: byDate.get(date) ?? [],
		})),
	};
}

/** Summary figures for a day's hourly series, used by the detail dialog. */
export function summariseDay(day: RainfallDay) {
	const hours = day.hours;
	const total = hours.reduce((s, x) => s + x.precipitation, 0);
	const peak = hours.reduce<RainfallHour | null>(
		(best, x) => (!best || x.precipitation > best.precipitation ? x : best),
		null,
	);
	const maxChance = hours.reduce((m, x) => Math.max(m, x.probability), 0);
	const wetHours = hours.filter((x) => x.precipitation >= 0.1).length;

	// heaviest continuous 3-hour stretch — more useful than a single peak hour,
	// because that is the window that actually fills drains
	let windowStart: RainfallHour | null = null;
	let windowTotal = 0;
	for (let i = 0; i + 2 < hours.length; i++) {
		const sum =
			hours[i]!.precipitation +
			hours[i + 1]!.precipitation +
			hours[i + 2]!.precipitation;
		if (sum > windowTotal) {
			windowTotal = sum;
			windowStart = hours[i]!;
		}
	}

	return { total, peak, maxChance, wetHours, windowStart, windowTotal };
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
