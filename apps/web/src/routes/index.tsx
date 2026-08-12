import { seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";

/** `b` is the barangay name, carried only so the pin can be labelled. */
type Search = { lng?: number; lat?: number; b?: string };

/**
 * The map screen.
 *
 * It renders nothing of its own: the map and its panel are the shell every
 * route sits in (see components/map/map-shell.tsx), because a MapLibre
 * instance that unmounts on navigation re-downloads the terrain, the basemap
 * and the hazard geometry the moment you come back. This route exists to own
 * `/` and to declare the shape of the search params the shell reads —
 * validated here so a hand-typed `?lng=nope` becomes nothing rather than NaN.
 */
export const Route = createFileRoute("/")({
  head: () => seo({
    title: "Flood hazard map for Davao City",
    description:
      "Tap any spot in Davao City to see how deep flooding is expected to get in a 5, 25 or 100-year storm. Free, works offline, UP NOAH data.",
    path: "/",
  }),
  component: () => null,
  validateSearch: (search: Record<string, unknown>): Search => ({
    lng: typeof search.lng === "number" ? search.lng : undefined,
    lat: typeof search.lat === "number" ? search.lat : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
});
