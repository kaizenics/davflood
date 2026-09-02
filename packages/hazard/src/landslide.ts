import { colors, colorsFor } from "./tokens";
import type { Theme } from "./tokens";

/**
 * The UP NOAH landslide susceptibility classification.
 *
 * WHY THIS EXISTS AT ALL: the flood model covers the coastal plain, which is
 * where most of Davao lives — and leaves the upland two thirds of the city
 * almost blank. Marilog, Paquibato, Baguio and upper Tugbok are mountains,
 * and a map that shows them clear is not telling them they are safe from
 * flooding; it is showing the wrong hazard for that terrain and letting the
 * blankness be read as an all-clear. Landslide is the hazard that kills
 * people there, and NOAH publishes it from the same programme, under the same
 * licence, in the same file format.
 *
 * NOT A FORECAST, AND NOT THE SAME KIND OF THING AS THE FLOOD LAYER.
 *
 * The flood layer answers "how deep, in a storm of this size" — a return
 * period and a depth. This answers "how prone is this slope to failing", full
 * stop. There is no return period, no depth, and no storm attached: a high
 * susceptibility slope is high susceptibility on a dry day. That is why it is
 * a separate overlay rather than a fourth scenario, and why nothing in the UI
 * may put a millimetre figure or a storm size beside it.
 *
 * THE CLASS DESCRIPTIONS ARE NOAH'S, NOT OURS. `guidance` is quoted from
 * metadata_landslide.txt as published with the dataset:
 *
 *   1: Low hazard (yellow) Build only with continuous monitoring
 *   2: Medium hazard (orange) Build only with slope protection and
 *      intervention; continuous monitoring
 *   3: High hazard (red) No dwelling zone
 *
 * They are land-use rulings, not evacuation advice, and the wording is strong
 * enough that paraphrasing it would soften a published national standard. The
 * colours in those descriptions are NOAH's own; this app draws the same three
 * ranks in purple so they cannot be confused with the flood ramp — see
 * `slideLow` in ./tokens.
 *
 * Source: bettergovph/project-noah-hazard-maps, Landslide/LandslideHazards,
 * ODC-ODbL. Modelled with Matterocking, Conefall, SINMAP and Flow-R over
 * 1 m LiDAR and 5 m IfSAR elevation data.
 */

export type LandslideId = "low" | "medium" | "high";

export type LandslideTier = {
	id: LandslideId;
	label: string;
	name: string;
	/** what the model is actually saying about this ground */
	summary: string;
	/** NOAH's own land-use ruling, quoted */
	guidance: string;
	/** what it means for someone who lives there */
	human: string;
	/** raw colour — for map paint and legend swatches */
	color: string;
	/** tailwind class suffix — web only: text-slide-low, bg-slide-low, … */
	token: "slide-low" | "slide-med" | "slide-high";
};

export const landslideTiers: LandslideTier[] = [
	{
		id: "low",
		label: "Low",
		name: "Low susceptibility",
		summary: "Slope failure is possible but not expected.",
		guidance: "Build only with continuous monitoring.",
		human: "Ground that the model does not expect to give way, but which sits in terrain where landslides happen. Cracks opening in the ground, tilting fences or trees, and doors that stop closing are the signs worth knowing.",
		color: colors.slideLow,
		token: "slide-low",
	},
	{
		id: "medium",
		label: "Medium",
		name: "Medium susceptibility",
		summary: "Slope failure is expected without intervention.",
		guidance:
			"Build only with slope protection and intervention; continuous monitoring.",
		human: "The model expects this slope to fail unless it is engineered not to. Heavy or prolonged rain is when that happens — which is why this layer is worth reading alongside the rainfall panel rather than instead of it.",
		color: colors.slideMed,
		token: "slide-med",
	},
	{
		id: "high",
		label: "High",
		name: "High susceptibility",
		summary: "No dwelling zone.",
		guidance: "No dwelling zone.",
		human: "The strongest ruling NOAH issues on land: the national assessment says houses should not be here at all. It includes the runout paths of debris flows, so ground that looks flat and safe can be in it because of what is above it.",
		color: colors.slideHigh,
		token: "slide-high",
	},
];

export const landslideById: Record<LandslideId, LandslideTier> = {
	low: landslideTiers[0]!,
	medium: landslideTiers[1]!,
	high: landslideTiers[2]!,
};

/**
 * ONE ramp per theme, for map fills AND the legend — the same rule the flood
 * ramp follows. A swatch that does not match the paint is worse than none.
 */
export function landslideColorFor(theme: Theme): Record<LandslideId, string> {
	const c = colorsFor(theme);
	return { low: c.slideLow, medium: c.slideMed, high: c.slideHigh };
}

/** Ascending severity — sorting, and layer draw order. */
export const landslideOrder: LandslideId[] = ["low", "medium", "high"];

export function isLandslideId(value: unknown): value is LandslideId {
	return value === "low" || value === "medium" || value === "high";
}

/**
 * The line that must appear wherever this layer does.
 *
 * Susceptibility is not a prediction, and the distance between "this slope is
 * prone to failing" and "this slope will fail" is the whole of the disclaimer
 * this app is built on.
 */
export const LANDSLIDE_CAVEAT =
	"Modelled slope susceptibility from UP NOAH — how prone ground is to landslides, not a forecast that one will happen. It carries no storm size and no timing.";
