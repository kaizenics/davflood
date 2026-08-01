import { colors } from "./tokens";

/**
 * The UP NOAH flood hazard classification.
 *
 * These depth bands are not ours to invent — they come from the national
 * hazard model. `id` and `token` are deliberately asymmetric (`medium` vs
 * `haz-med`) because the marketing site's Tailwind classes already use the
 * short form; changing either breaks a consumer.
 */
export type HazardId = "low" | "medium" | "high";

export type HazardTier = {
	id: HazardId;
	label: string;
	name: string;
	/** long form, en-dash with spaces — used in prose */
	depth: string;
	/** compact form — used in legends and chips */
	depthShort: string;
	/** metres; `null` upper bound means "no ceiling" */
	depthMin: number;
	depthMax: number | null;
	summary: string;
	/** what it actually looks like at your front door */
	human: string;
	/** what a resident should do */
	action: string;
	/** raw colour — for map paint, RN styles, SVG */
	color: string;
	/** tailwind class suffix — web only: text-haz-low, bg-haz-low, … */
	token: "haz-low" | "haz-med" | "haz-high";
};

export const hazardTiers: HazardTier[] = [
	{
		id: "low",
		label: "Low",
		name: "Shallow flooding",
		depth: "0.1 – 0.5 metres",
		depthShort: "0.1–0.5 m",
		depthMin: 0.1,
		depthMax: 0.5,
		summary: "Ankle to knee deep.",
		human: "Water reaches your ankles or knees. Streets become impassable to motorcycles and small cars. Anything stored on the floor gets wet.",
		action: "Move belongings off the floor. Avoid driving through it — half a metre of moving water can float a small car.",
		color: colors.hazLow,
		token: "haz-low",
	},
	{
		id: "medium",
		label: "Medium",
		name: "Moderate flooding",
		depth: "0.5 – 1.5 metres",
		depthShort: "0.5–1.5 m",
		depthMin: 0.5,
		depthMax: 1.5,
		summary: "Waist to chest deep.",
		human: "Water reaches your waist or chest. A single-storey house takes water throughout. Electrical outlets are submerged. Wading becomes dangerous once it moves.",
		action: "Evacuate early, before the water reaches this depth. Cut power at the breaker if it is safe to do so.",
		color: colors.hazMed,
		token: "haz-med",
	},
	{
		id: "high",
		label: "High",
		name: "Deep flooding",
		depth: "Over 1.5 metres",
		depthShort: "> 1.5 m",
		depthMin: 1.5,
		depthMax: null,
		summary: "Above head height.",
		human: "Water goes over an adult's head. Single-storey homes are fully submerged. This depth is life-threatening regardless of how well you swim, because of current and debris.",
		action: "Do not wait. Evacuate as soon as a storm is forecast — not when the water arrives.",
		color: colors.hazHigh,
		token: "haz-high",
	},
];

/** Lookup that survives `noUncheckedIndexedAccess`. */
export const hazardById: Record<HazardId, HazardTier> = {
	low: hazardTiers[0]!,
	medium: hazardTiers[1]!,
	high: hazardTiers[2]!,
};

export const hazardColor: Record<HazardId, string> = {
	low: colors.hazLow,
	medium: colors.hazMed,
	high: colors.hazHigh,
};

/** Ascending severity — useful for sorting and for layer draw order. */
export const hazardOrder: HazardId[] = ["low", "medium", "high"];

export function isHazardId(value: unknown): value is HazardId {
	return value === "low" || value === "medium" || value === "high";
}
