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
	/** today onward — the forecast, and the only thing `days` has ever held */
	days: RainfallDay[];
	/** the days BEFORE today, oldest first. Observed, not forecast. */
	past: RainfallDay[];
	/** what has already fallen, which is what saturates ground */
	recent: {
		/** total mm across `past` — excludes today, which is still happening */
		mm: number;
		/** how many days that total covers, so the UI never has to assume */
		days: number;
	};
};

/**
 * How far back to look.
 *
 * Three days, because that is the window in which rain stops being weather
 * and starts being ground condition. Beyond about that, in a tropical city
 * with this much relief, it has drained or run off; inside it, it is still in
 * the soil and the next storm lands on ground that cannot take it.
 *
 * The river has always pulled `past_days: 6` for the same reason — see
 * ./river.ts. Rainfall asked only for the forecast, which meant the app could
 * tell you 40 mm was coming and had no way to say it would be landing on
 * ground that took 160 mm since Sunday. Those are not the same warning.
 */
export const PAST_DAYS = 3;

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
		past_days: String(PAST_DAYS),
	});
	return `${ENDPOINT}?${params.toString()}`;
}

type RawResponse = {
	current?: {
		/** local ISO stamp, e.g. "2026-09-02T14:00" — how we know what "today" is */
		time?: string;
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

	const all: RainfallDay[] = times.map((date, i) => ({
		date,
		precipitation: d.precipitation_sum?.[i] ?? 0,
		probability: d.precipitation_probability_max?.[i] ?? 0,
		weatherCode: d.weather_code?.[i] ?? 0,
		hours: byDate.get(date) ?? [],
	}));

	/**
	 * Split the series at today.
	 *
	 * `days` must keep meaning "today onward". Every consumer written before
	 * this indexes it positionally — `days[0]` is today and `days[1]` is
	 * tomorrow in the panel, the chart and the outlook sentence — so letting
	 * three past days slide in at the front would not have thrown anything,
	 * it would have quietly relabelled last Saturday's rain as the forecast.
	 * That is the worst class of bug this app can have: wrong, confident, and
	 * about the weather.
	 *
	 * The cut is made on the date the API itself reports as current rather
	 * than on PAST_DAYS, so a short response — Open-Meteo trimming the window,
	 * or a cached body from before midnight — lands the boundary in the right
	 * place instead of three entries from the front regardless.
	 */
	const todayDate = r.current?.time?.slice(0, 10);
	const found = todayDate
		? all.findIndex((day) => day.date >= todayDate)
		: Math.min(PAST_DAYS, all.length);
	/* -1 means the body holds nothing at or after today — a stale cached
	   response. Everything in it is then past, and `days` is empty: consumers
	   already render a missing forecast as absent, which is the truth here,
	   where treating the newest past day as "today" would not be. */
	const cut = found === -1 ? all.length : found;
	const past = all.slice(0, cut);
	const days = all.slice(cut);

	return {
		current: {
			precipitation: r.current?.precipitation ?? 0,
			weatherCode: r.current?.weather_code ?? 0,
			isDay: (r.current?.is_day ?? 1) === 1,
		},
		days,
		past,
		recent: {
			mm: past.reduce((sum, day) => sum + day.precipitation, 0),
			days: past.length,
		},
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

export type SoakBand = "dry" | "damp" | "wet" | "saturated";

/**
 * How loaded the ground already is, from what fell over `PAST_DAYS`.
 *
 * A SEPARATE scale from rainBand, and it has to be: 50 mm in one day is heavy
 * rain, while 50 mm spread over three is an ordinary wet week. Running an
 * accumulation through the daily bands would have called half the rainy
 * season "heavy" and taught people to ignore the word.
 *
 * These thresholds are EDITORIAL — the same admission rainBand already makes.
 * They are not a published trigger, and nobody has calibrated a rainfall
 * threshold for Davao's catchments that is free to use; PAGASA's advisories
 * are hourly intensities, which is a different measurement answering a
 * different question. So the wording these drive stays descriptive ("the
 * ground is already wet") and never predictive ("flooding is likely"), because
 * the second one is a claim this scale cannot support.
 */
export function soakBand(mm: number): SoakBand {
	if (mm < 20) return "dry";
	if (mm < 60) return "damp";
	if (mm < 150) return "wet";
	return "saturated";
}
