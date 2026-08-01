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

export const DEFAULT_SCENARIO: ScenarioYears = 25;

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
