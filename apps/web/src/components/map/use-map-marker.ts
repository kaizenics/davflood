import type { LngLat } from "@davflood/hazard/geo";
/* A value import, unlike the type-only one beside it. Safe here because
   constructing a Marker does not construct a Map — the worker setup that must
   precede the first `new maplibregl.Map()` still lives in flood-map.tsx. */
import { Marker } from "maplibre-gl";
import type * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { DependencyList, RefObject } from "react";

/**
 * One DOM marker on the map, kept in step with a value.
 *
 * There were four of these written out longhand — the focus pin, the guide
 * pin, the tap pin and the saved place — and all four were the same eighteen
 * lines: hold a ref, remove whatever is in it, build a new marker if there is
 * something to show, and remove it again on cleanup. The differences between
 * them were the value, the element and the deps. Four copies of a lifecycle
 * is four places to forget the cleanup, and a leaked marker on a map does not
 * throw: it just sits there, pinned to a place nobody asked about any more.
 *
 * `spec` is null when there should be no marker, which is the common state
 * for every one of them.
 *
 * WHY MARKERS RATHER THAN A LAYER: these need to be clickable, legible at any
 * zoom, and invisible to the hazard tap handler — a pin is not a zone, and
 * `queryRenderedFeatures` must never return one. They are also DOM rather
 * than style, which is why they survive a basemap swap when layers do not.
 * That last part is also the trap: a marker survives the swap but is attached
 * to a map whose style has been torn down and rebuilt, so callers pass the
 * layer epoch in `deps` to rebuild them alongside it.
 */
export function useMapMarker(
  map: RefObject<maplibregl.Map | null>,
  ready: boolean,
  spec: { at: LngLat; element: () => HTMLElement } | null,
  deps: DependencyList,
): void {
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;

    marker.current?.remove();
    marker.current = null;

    if (spec) {
      marker.current = new Marker({
        element: spec.element(),
        anchor: "bottom",
      })
        .setLngLat([...spec.at])
        .addTo(m);
    }

    return () => {
      marker.current?.remove();
      marker.current = null;
    };
    /* The caller owns the dependency list. What a marker should react to
       differs per marker — the tap pin rebuilds when its label changes, the
       saved place does not — and inferring it here would mean either
       rebuilding all of them on every render or missing the one that
       mattered. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * The many-markers version, for the news pins.
 *
 * Kept separate rather than generalised into the one above: an array needs a
 * different teardown (every marker, not one), and a hook that took "either a
 * value or a list" would be a branch in both directions on every call.
 */
export function useMapMarkers(
  map: RefObject<maplibregl.Map | null>,
  ready: boolean,
  specs: { at: LngLat; element: () => HTMLElement }[] | null,
  deps: DependencyList,
): void {
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;

    for (const marker of markers.current) marker.remove();
    markers.current = [];
    if (!specs?.length) return;

    for (const spec of specs) {
      markers.current.push(
        new Marker({ element: spec.element(), anchor: "bottom" })
          .setLngLat([...spec.at])
          .addTo(m),
      );
    }

    return () => {
      for (const marker of markers.current) marker.remove();
      markers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
