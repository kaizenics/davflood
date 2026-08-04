/**
 * Design tokens shared by every renderer.
 *
 * These are the exact sRGB conversions of the oklch values in
 * `apps/web/src/styles/app.css`. They exist as hex because a MapLibre
 * `paint` property needs a raw colour string, and because interpolated
 * Tailwind class names (`text-${token}`) do not survive a Tailwind scan —
 * the app hand-maintains a literal class map for exactly this reason.
 *
 * ONE RULE ABOVE ALL: the hazard colours are SEMANTIC. They mean flood
 * severity and nothing else — never a button, never a hover state, never
 * decoration. `tide` is the brand accent precisely so a call-to-action can
 * never be misread as a hazard warning.
 */

export const colors = {
	/* surfaces */
	abyss: "#060a0e",
	surface: "#0f141a",
	raised: "#1a2027",
	hairline: "#2e343a",

	/* text — inkDim is 6.8:1 on abyss, verified */
	ink: "#f3f5f8",
	inkDim: "#979fa8",

	/* brand */
	tide: "#3bcddc",
	tideDeep: "#008295",

	/* hazard — reserved, semantic */
	hazLow: "#f3c443",
	hazMed: "#fa8927",
	hazHigh: "#f1453f",

	/* basemap-only shades, same hue ramp */
	water: "#0a2c3e",
	waterDeep: "#052231",
	land: "#0b1015",
	road: "#292e34",
	roadMajor: "#3e4349",
	/** drawn under roads so the network reads as a network */
	roadCasing: "#04070a",
	building: "#161b21",
	green: "#17291b",
} as const;

/**
 * The light theme.
 *
 * Not an inversion of the dark palette — a separately derived one. Amber at
 * `#f3c443` scores 11.9:1 on the dark canvas and 1.65:1 on white, so a naive
 * flip would have made the *lowest* hazard level the hardest to read.
 *
 * Every value here was computed in oklch and verified before being written
 * down: ≥4.5:1 against both the canvas and pure white, pairwise perceptual
 * separation >0.10 in oklab so the three tiers stay tellable apart, and the
 * ramp still descending in lightness low → high so it reads in the same
 * direction as the dark one.
 */
export const lightColors = {
	/* surfaces */
	abyss: "#f9fafb",
	surface: "#ffffff",
	raised: "#f0f3f6",
	hairline: "#d5dade",

	/* text */
	ink: "#192028",
	inkDim: "#5c646d",

	/* brand */
	tide: "#007188",
	tideDeep: "#005469",

	/* hazard — reserved, semantic */
	hazLow: "#805e00",
	hazMed: "#a22b00",
	hazHigh: "#a00025",

	/* basemap-only shades.
	   `land` is deliberately a clear step darker than `abyss` and well clear of
	   white: roads are drawn in white, so land has to be grey enough for the
	   road network to read against it. The first pass had land #f1f4f6 against
	   white roads — 1.07:1, which meant no visible roads at all. */
	water: "#9cc3de",
	waterDeep: "#7fadcd",
	land: "#dfe5ea",
	road: "#ffffff",
	roadMajor: "#ffffff",
	/** must be clearly darker than `land`, or the casing does nothing */
	roadCasing: "#a5b3bf",
	building: "#ccd3da",
	green: "#d3e5cf",
} as const;

export type Theme = "dark" | "light";
export type ColorToken = keyof typeof colors;

/** Same keys in both themes; the values are plain strings, not literals. */
export type Palette = { readonly [K in ColorToken]: string };

export function colorsFor(theme: Theme): Palette {
	return theme === "light" ? lightColors : colors;
}
