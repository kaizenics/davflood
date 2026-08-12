/** Flood return periods modelled by UP NOAH. */

export type ScenarioYears = 5 | 25 | 100;

export type Scenario = {
	years: ScenarioYears;
	label: string;
	short: string;
	/** annual probability, as a percentage string */
	annualChance: string;
	blurb: string;
};

export const scenarios: Scenario[] = [
	{
		years: 5,
		label: "5-year",
		short: "5yr",
		annualChance: "20%",
		blurb:
			"The flood you can expect roughly every few years. The most useful one for everyday planning.",
	},
	{
		years: 25,
		label: "25-year",
		short: "25yr",
		annualChance: "4%",
		blurb:
			"A serious storm. Bigger footprint, deeper water, more barangays affected.",
	},
	{
		years: 100,
		label: "100-year",
		short: "100yr",
		annualChance: "1%",
		blurb:
			"The worst case in the model. Use it to know where you would go, not where you'd stay.",
	},
];

/**
 * The map opens on the worst case.
 *
 * A hazard map's default is an editorial decision, not a technical one. It
 * was the 25-year, on the reasoning that the likely storm is the useful one
 * for everyday planning. But somebody who opens a flood map once — which is
 * most people, and almost everybody who opens it during a storm — should see
 * the full extent of what the model says can happen, not a middle case they
 * have to know to switch away from. Seeing your street dry at the 25-year and
 * never touching the toggle is the failure this avoids.
 *
 * It costs more to load: the 100-year footprint is 3.9 MB of GeoJSON against
 * 0.9 for the 25-year, because a bigger flood is a more detailed polygon set.
 * Gzipped over the wire that is 0.57 MB against 0.14 — real on mobile data,
 * but paid once and cached, and the offline pack already carries all three.
 */
export const DEFAULT_SCENARIO: ScenarioYears = 100;

export const scenarioByYears: Record<ScenarioYears, Scenario> = {
	5: scenarios[0]!,
	25: scenarios[1]!,
	100: scenarios[2]!,
};

export function isScenarioYears(value: unknown): value is ScenarioYears {
	return value === 5 || value === 25 || value === 100;
}

/**
 * Probability of seeing at least one such flood over `years` years, assuming
 * independent years. This is the number that corrects the "a 100-year flood
 * already happened, so we're safe" misconception.
 */
export function chanceOver(returnPeriod: ScenarioYears, years: number): number {
	return 1 - Math.pow(1 - 1 / returnPeriod, years);
}
