import type { HazardId } from "@davflood/hazard/tiers";

/**
 * Literal Tailwind classes per hazard tier.
 *
 * Two reasons these are spelled out rather than interpolated:
 *  1. Tailwind scans source text, so `text-haz-${id}` produces nothing.
 *  2. They resolve through CSS custom properties, which means they flip with
 *     the theme automatically — no `theme` prop threaded through every
 *     component that happens to show a hazard colour.
 *
 * Raw hex from `@davflood/hazard/tokens` is still used for MapLibre paint,
 * which cannot read CSS variables.
 */
export const hazardText: Record<HazardId, string> = {
  low: "text-haz-low",
  medium: "text-haz-med",
  high: "text-haz-high",
};

export const hazardBg: Record<HazardId, string> = {
  low: "bg-haz-low",
  medium: "bg-haz-med",
  high: "bg-haz-high",
};

export const hazardBorder: Record<HazardId, string> = {
  low: "border-haz-low",
  medium: "border-haz-med",
  high: "border-haz-high",
};
