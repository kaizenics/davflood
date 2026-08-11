import type { LngLat } from "./geo";
import { ringsContain } from "./safe-ground";
import { asHazardProperties } from "./schema";
import type { HazardProperties } from "./schema";

/**
 * A place someone cares about, and what the model says about it.
 *
 * The app has always been able to answer "how deep does it get *there*" for
 * a place you are currently pointing at. This is the same question asked
 * about a place you are not: your house, while you are at work on the other
 * side of the city and it is raining.
 */

export type SavedPlace = {
  /** what the person calls it — theirs to write, never ours to guess */
  label: string;
  center: LngLat;
  /** the barangay it landed in, recorded when it was saved */
  barangay: string | null;
  /** ISO date, so the UI can say how old the reading beside it is */
  savedOn: string;
};

/**
 * The zone containing this point, or null if the model leaves it dry.
 *
 * Linear over the collection, like nearestEvacuation and for the same reason:
 * it runs once when a place is saved and once per scenario change, not per
 * frame, and an index would be a cache to invalidate for no measurable gain.
 *
 * Null is a real and good answer — "this scenario does not flood your place"
 * is the sentence most people are hoping for — so callers must render it
 * rather than treating it as missing data.
 */
export function zoneAt(
  fc: GeoJSON.FeatureCollection,
  [lng, lat]: LngLat,
): HazardProperties | null {
  for (const feature of fc.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;

    const polygons: GeoJSON.Position[][][] =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];

    for (const rings of polygons) {
      if (!ringsContain(rings, lng, lat)) continue;
      const props = asHazardProperties(feature.properties);
      if (props) return props;
    }
  }
  return null;
}
