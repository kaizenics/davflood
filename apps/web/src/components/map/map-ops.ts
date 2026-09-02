import {
  BARANGAY_LAYER_IDS,
  BOUNDARY_LAYER_IDS,
  HAZARD_BEFORE_ID,
  LANDSLIDE_LAYER_IDS,
  LAYER_IDS,
  RAIN_LAYER_ID,
  SOURCE_BOUNDARY,
  barangayLayers,
  boundaryLayers,
  hazardLayers,
} from "@davflood/hazard/layers";
import { SOURCE_TERRAIN, TERRAIN_EXAGGERATION } from "@davflood/hazard/style";
import type { BasemapKind } from "@davflood/hazard/style";
import type { LngLat } from "@davflood/hazard/geo";
import { ringsContain, representativePoint } from "@davflood/hazard/safe-ground";
import type * as maplibregl from "maplibre-gl";

import barangayOutlines from "@davflood/hazard/data/davao-barangays.json";

/**
 * Everything this app does TO a MapLibre map, with no React in it.
 *
 * These lived inside flood-map.tsx, which made that file a React component
 * and an imperative map driver at the same time — 635 lines where the two
 * were interleaved and neither could be read on its own. Nothing here touches
 * state, props or hooks: each function takes a map and applies one change to
 * it, which is also what makes them the easy half to reason about when a
 * layer does not appear.
 *
 * The one rule they all share: NO-OP WHEN THE TARGET IS MISSING. maplibre-gl
 * throws when asked about a layer that does not exist, and the hazard layers
 * only appear once the style has loaded — so every one of these tolerates
 * being called early rather than assuming it is late.
 */

export function applySelection(m: maplibregl.Map, zoneId: string | null) {
  if (!m.getLayer(LAYER_IDS.selected)) return;
  m.setFilter(LAYER_IDS.selected, ["==", ["get", "zone_id"], zoneId ?? ""]);
}

export function applyTerrain(m: maplibregl.Map, enabled: boolean) {
  if (!m.getSource(SOURCE_TERRAIN)) return;
  m.setTerrain(
    enabled
      ? { source: SOURCE_TERRAIN, exaggeration: TERRAIN_EXAGGERATION }
      : null,
  );
}

/** All hazard layers, including the outline and selection rings. */
export const ALL_HAZARD_LAYERS = Object.values(LAYER_IDS);

/**
 * Where to measure the way out from.
 *
 * Normally the point under the cursor. But a tap on an extruded zone lands on
 * the side of a volume, and the ground beneath the cursor can be outside the
 * footprint entirely — so when it is, fall back to a point known to be inside
 * the zone the tap actually selected.
 */
export function originOf(feature: maplibregl.MapGeoJSONFeature, at: LngLat): LngLat {
  const geometry = feature.geometry;
  if (geometry?.type !== "Polygon") return at;
  const rings = geometry.coordinates;
  if (ringsContain(rings, at[0], at[1])) return at;
  return representativePoint(rings) ?? at;
}

export function applyRainVisibility(m: maplibregl.Map, visible: boolean) {
  if (!m.getLayer(RAIN_LAYER_ID)) return;
  m.setLayoutProperty(RAIN_LAYER_ID, "visibility", visible ? "visible" : "none");
}

export function applyLandslideVisibility(m: maplibregl.Map, visible: boolean) {
  for (const id of LANDSLIDE_LAYER_IDS) {
    if (m.getLayer(id)) {
      m.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  }
}

export function applyHazardVisibility(m: maplibregl.Map, visible: boolean) {
  for (const id of ALL_HAZARD_LAYERS) {
    if (m.getLayer(id)) {
      m.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  }
}

/**
 * (Re)creates the hazard layers on top of the current style.
 *
 * Used both on style.load and when the flat/extruded mode flips — the two
 * modes are different layer TYPES (fill vs fill-extrusion), and maplibre
 * cannot morph a layer's type in place, so the honest operation is
 * remove-and-re-add. The source, and therefore the loaded data, is untouched.
 */
export function rebuildHazardLayers(
  m: maplibregl.Map,
  opts: { basemap: BasemapKind; extrude: boolean },
) {
  for (const id of ALL_HAZARD_LAYERS) {
    if (m.getLayer(id)) m.removeLayer(id);
  }
  const layers = hazardLayers({
    fillOpacity: fillOpacityFor(opts.basemap),
    // the ramp must match the legend; satellite keeps the dark ramp, which is
    // what reads over imagery
    theme: opts.basemap === "light" ? "light" : "dark",
    extrude: opts.extrude,
  });
  // labels stay on top when they exist; `place-town` may be absent in
  // satellite mode
  const before = m.getLayer(HAZARD_BEFORE_ID) ? HAZARD_BEFORE_ID : undefined;
  for (const layer of layers) {
    m.addLayer(layer as maplibregl.LayerSpecification, before);
  }
}

/**
 * (Re)creates the reference geometry — city outline and barangay boundaries —
 * on top of the current style.
 *
 * Separate from the hazard rebuild rather than folded into it, because the
 * two are re-added at the same anchor and the LAST one added wins the top
 * slot. The boundary has to be the last one: it is a 1-2 px dashed line and
 * an extruded hazard volume drawn over it swallows it whole. Every caller
 * that rebuilds the hazard layers therefore calls this straight afterwards.
 */
export function rebuildBoundaryLayers(
  m: maplibregl.Map,
  basemap: BasemapKind,
  focusedBarangay: string | null,
) {
  if (!m.getSource(SOURCE_BOUNDARY)) return;
  const theme = basemap === "light" ? "light" : "dark";
  const ids = [...Object.values(BARANGAY_LAYER_IDS), ...BOUNDARY_LAYER_IDS];
  for (const id of ids) {
    if (m.getLayer(id)) m.removeLayer(id);
  }

  const before = m.getLayer(HAZARD_BEFORE_ID) ? HAZARD_BEFORE_ID : undefined;
  // barangays first: the city edge is the stronger line and must win where
  // the two run together, which along the city's own border is everywhere
  for (const layer of [...barangayLayers(theme), ...boundaryLayers(theme)]) {
    m.addLayer(layer as maplibregl.LayerSpecification, before);
  }
  applyBarangayFocus(m, focusedBarangay);
}

/** Picks one barangay out by name; null clears it. */
export function applyBarangayFocus(m: maplibregl.Map, name: string | null) {
  for (const id of [BARANGAY_LAYER_IDS.focusFill, BARANGAY_LAYER_IDS.focusLine]) {
    if (m.getLayer(id)) m.setFilter(id, ["==", ["get", "name"], name ?? ""]);
  }
}

/**
 * The outline of a named barangay, or null when OSM has no boundary for it.
 *
 * Null is the common case for a third of the city and is not a failure: those
 * barangays exist in OSM as a single point. Callers fall back to the centroid
 * they already had.
 */
export function outlineBounds(name: string): [[number, number], [number, number]] | null {
  const feature = (
    barangayOutlines as GeoJSON.FeatureCollection
  ).features.find((f) => f.properties?.name === name);
  if (!feature || feature.geometry?.type !== "Polygon") return null;

  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const point of feature.geometry.coordinates[0] ?? []) {
    const x = point[0] ?? 0;
    const y = point[1] ?? 0;
    if (x < w) w = x;
    if (x > e) e = x;
    if (y < s) s = y;
    if (y > n) n = y;
  }
  return Number.isFinite(w) ? [[w, s], [e, n]] : null;
}

/**
 * Aerial imagery is bright and busy, so a 45% fill that reads well over dark
 * cartography disappears over it. Push the fills harder when the basemap is
 * satellite.
 */
export function fillOpacityFor(basemap: BasemapKind): number {
  /**
   * Tuned twice, and the second pass is the one that matters.
   *
   * These were briefly 0.38/0.34/0.3, chasing a "solid red" complaint. That
   * complaint was really about the EXTRUDED opacity — the volumes render at
   * fillOpacity + 0.3, so 0.55 became 0.85 and the city disappeared under it.
   * Once the map defaulted to flat, cutting the fill as well subtracted the
   * same problem twice and the bands went too faint to tell apart over
   * satellite imagery, which is busy, dark and full of greens and browns that
   * a washed-out yellow simply dissolves into.
   *
   * A hazard band that cannot be told from its neighbour is not a lighter
   * map, it is a broken legend. These sit above the original values: the
   * three colours read clearly against imagery, and the streets and coastline
   * still show through, because flat paint at 0.6 is a very different thing
   * from a leaning volume at 0.85.
   */
  if (basemap === "satellite") return 0.62;
  if (basemap === "light") return 0.58;
  return 0.55;
}

