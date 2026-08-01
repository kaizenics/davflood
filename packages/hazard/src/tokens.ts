/**
 * Design tokens shared by every renderer.
 *
 * These are the exact sRGB conversions of the oklch values in
 * `apps/marketing/src/styles/global.css`. They exist as hex because a
 * MapLibre `paint` property needs a raw colour string, and because
 * interpolated Tailwind class names (`text-${token}`) do not survive a
 * Tailwind scan in either Astro or uniwind — both consumers already
 * hand-maintain literal class maps for exactly this reason.
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
	building: "#161b21",
	green: "#17291b",
} as const;

export type ColorToken = keyof typeof colors;
