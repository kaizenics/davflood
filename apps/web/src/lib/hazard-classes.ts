import type { LandslideId } from "@davflood/hazard/landslide";
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

/**
 * The same arrangement for the landslide ramp.
 *
 * Spelled out for the same two reasons, and kept in a separate map rather
 * than folded into the ones above because the ids collide: both hazards have
 * a "high", and they mean entirely different things. A single lookup keyed on
 * "high" would have been one careless import away from painting a landslide
 * ruling in flood red.
 */
export const landslideText: Record<LandslideId, string> = {
  low: "text-slide-low",
  medium: "text-slide-med",
  high: "text-slide-high",
};

export const landslideBg: Record<LandslideId, string> = {
  low: "bg-slide-low",
  medium: "bg-slide-med",
  high: "bg-slide-high",
};
