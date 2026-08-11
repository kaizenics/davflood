import { CAMERA, DAVAO_BBOX } from "@davflood/hazard/geo";
import type { LngLat } from "@davflood/hazard/geo";
import {
  HAZARD_BEFORE_ID,
  HAZARD_FILL_LAYER_IDS,
  LAYER_IDS,
  RAIN_LAYER_ID,
  SOURCE_HAZARD,
  SOURCE_RAIN,
  hazardLayers,
  rainLayers,
} from "@davflood/hazard/layers";
import { representativePoint, ringsContain } from "@davflood/hazard/safe-ground";
import { asHazardProperties } from "@davflood/hazard/schema";
import type { HazardProperties } from "@davflood/hazard/schema";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import {
  SOURCE_TERRAIN,
  TERRAIN_EXAGGERATION,
  buildBaseStyle,
} from "@davflood/hazard/style";
import type { BasemapKind } from "@davflood/hazard/style";
import { colors } from "@davflood/hazard/tokens";
// maplibre-gl v6 ships named exports only — there is no default export
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// must come before the first `new maplibregl.Map()` — see the file for why
import "@/lib/maplibre-worker";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { createFocusPin } from "@/components/map/focus-pin";
import { createHomePin } from "@/components/map/home-pin";
import { createNewsPin } from "@/components/map/news-pin";
import type { NewsPin } from "@/components/map/news-pin";

/** A place the user asked to be taken to, from the barangay list. */
export type FocusTarget = {
  center: LngLat;
  /** shown on the pin's label; omitted for a bare coordinate */
  name?: string;
};

/**
 * Close enough to read the hazard zones around a barangay, far enough that a
 * centroid being a few hundred metres off does not put the pin outside the
 * view. Barangay areas here range from a few blocks downtown to tens of square
 * kilometres upland, and a centroid is all we have — no bounds to fit to.
 */
const FOCUS_ZOOM = 14;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export type FloodMapHandle = {
  flyTo: (center: LngLat, zoom?: number) => void;
  resetCamera: () => void;
  /** animate=false for slider drags, true for preset jumps */
  setPitch: (pitch: number, animate?: boolean) => void;
  /**
   * Frame two points at once — the tap and the place being offered, so both
   * are on screen when the pin drops.
   *
   * `padLeft` is how much of the map's left edge is covered by something the
   * map cannot see: from lg up the reading floats there, and framing into the
   * full viewport put the destination pin underneath it.
   */
  fitTo: (a: LngLat, b: LngLat, padLeft?: number) => void;
};

/** Somewhere you could go, pinned on the map. */
export type Guide = {
  to: LngLat;
  /** labels the pin at the far end */
  label: string;
};

type Props = {
  scenario: ScenarioYears;
  selectedZoneId: string | null;
  /** `at` is where the tap landed — the search for a way out starts there */
  onSelect: (zone: HazardProperties | null, at: LngLat | null) => void;
  data: GeoJSON.FeatureCollection;
  /** terrain is the heaviest part of the render — cheap to switch off */
  terrain?: boolean;
  basemap?: BasemapKind;
  /** hide the hazard overlay to read what is underneath it */
  showHazard?: boolean;
  /** draw zones as depth-extruded volumes instead of flat fills */
  extrude?: boolean;
  /** fires on every camera pitch change, including drag gestures */
  onPitchChange?: (pitch: number) => void;
  /** rain cells to draw under the hazard polygons */
  rain?: GeoJSON.FeatureCollection;
  showRain?: boolean;
  /** places named in recent flood reporting */
  newsPins?: NewsPin[];
  showNews?: boolean;
  onOpenNews?: (pin: NewsPin) => void;
  /** fly here and drop a pin; null clears the pin and leaves the camera */
  focus?: FocusTarget | null;
  /** the pin's dismiss button — usually clears the URL that set `focus` */
  onFocusClear?: () => void;
  /** a pin on somewhere to go; null removes it */
  guide?: Guide | null;
  /** the saved place, pinned for as long as it is saved */
  savedPlace?: { center: LngLat; label: string } | null;
};

/**
 * Both helpers no-op until the layer/source they touch exists. maplibre-gl
 * throws when asked about a missing layer, and the hazard layers only appear
 * once the style has loaded — so every caller tolerates being early rather
 * than assuming it is late.
 */
function applySelection(m: maplibregl.Map, zoneId: string | null) {
  if (!m.getLayer(LAYER_IDS.selected)) return;
  m.setFilter(LAYER_IDS.selected, ["==", ["get", "zone_id"], zoneId ?? ""]);
}

function applyTerrain(m: maplibregl.Map, enabled: boolean) {
  if (!m.getSource(SOURCE_TERRAIN)) return;
  m.setTerrain(
    enabled
      ? { source: SOURCE_TERRAIN, exaggeration: TERRAIN_EXAGGERATION }
      : null,
  );
}

/** All hazard layers, including the outline and selection rings. */
const ALL_HAZARD_LAYERS = Object.values(LAYER_IDS);

/**
 * Where to measure the way out from.
 *
 * Normally the point under the cursor. But a tap on an extruded zone lands on
 * the side of a volume, and the ground beneath the cursor can be outside the
 * footprint entirely — so when it is, fall back to a point known to be inside
 * the zone the tap actually selected.
 */
function originOf(feature: maplibregl.MapGeoJSONFeature, at: LngLat): LngLat {
  const geometry = feature.geometry;
  if (geometry?.type !== "Polygon") return at;
  const rings = geometry.coordinates;
  if (ringsContain(rings, at[0], at[1])) return at;
  return representativePoint(rings) ?? at;
}

function applyRainVisibility(m: maplibregl.Map, visible: boolean) {
  if (!m.getLayer(RAIN_LAYER_ID)) return;
  m.setLayoutProperty(RAIN_LAYER_ID, "visibility", visible ? "visible" : "none");
}

function applyHazardVisibility(m: maplibregl.Map, visible: boolean) {
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
function rebuildHazardLayers(
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
 * Aerial imagery is bright and busy, so a 45% fill that reads well over dark
 * cartography disappears over it. Push the fills harder when the basemap is
 * satellite.
 */
function fillOpacityFor(basemap: BasemapKind): number {
  // imagery is bright and busy; light cartography is bright but flat
  if (basemap === "satellite") return 0.55;
  if (basemap === "light") return 0.5;
  return 0.45;
}

export const FloodMap = forwardRef<FloodMapHandle, Props>(function FloodMap(
  {
    scenario,
    selectedZoneId,
    onSelect,
    data,
    terrain = true,
    basemap = "dark",
    showHazard = true,
    extrude = false,
    onPitchChange,
    focus = null,
    onFocusClear,
    guide = null,
    savedPlace = null,
    rain,
    showRain = false,
    newsPins,
    showNews = false,
    onOpenNews,
  },
  ref,
) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pin = useRef<maplibregl.Marker | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  /**
   * Bumped every time the hazard layers are (re)built — on first style load
   * and again after every basemap swap, which tears the whole style down.
   *
   * It exists to make the data effect below re-run at those moments. Without
   * it, delivering the polygons depends on winning a race against style
   * loading, and losing that race is silent: the layers are present, visible
   * and correctly configured over an empty source, so the map renders a
   * perfect basemap with no flood data on it and reports no error.
   */
  const [layerEpoch, setLayerEpoch] = useState(0);

  // The map is created once, but props can change before `load` fires. These
  // refs let the load handler read CURRENT values rather than the ones its
  // closure captured on first render — otherwise a scenario picked during
  // loading would be silently discarded.
  const onSelectRef = useRef(onSelect);
  const dataRef = useRef(data);
  const selectedRef = useRef(selectedZoneId);
  const terrainRef = useRef(terrain);
  const basemapRef = useRef(basemap);
  const showHazardRef = useRef(showHazard);
  const extrudeRef = useRef(extrude);
  const onPitchChangeRef = useRef(onPitchChange);
  const onFocusClearRef = useRef(onFocusClear);
  const rainRef = useRef(rain);
  const showRainRef = useRef(showRain);
  const onOpenNewsRef = useRef(onOpenNews);

  useEffect(() => {
    onSelectRef.current = onSelect;
    dataRef.current = data;
    selectedRef.current = selectedZoneId;
    terrainRef.current = terrain;
    basemapRef.current = basemap;
    showHazardRef.current = showHazard;
    extrudeRef.current = extrude;
    onPitchChangeRef.current = onPitchChange;
    onFocusClearRef.current = onFocusClear;
    rainRef.current = rain;
    showRainRef.current = showRain;
    onOpenNewsRef.current = onOpenNews;
  });

  useImperativeHandle(ref, () => ({
    flyTo(center, zoom = 14) {
      map.current?.flyTo({ center: [...center], zoom, duration: 1200 });
    },
    resetCamera() {
      map.current?.flyTo({
        center: [...CAMERA.center],
        zoom: CAMERA.zoom,
        pitch: CAMERA.pitch,
        bearing: CAMERA.bearing,
        duration: 900,
      });
    },
    setPitch(pitch, animate = false) {
      const m = map.current;
      if (!m) return;
      // jumpTo while the slider is being dragged — easing would lag the thumb
      if (animate) m.easeTo({ pitch, duration: 500 });
      else m.jumpTo({ pitch });
    },
    fitTo(a, b, padLeft = 70) {
      const m = map.current;
      if (!m) return;
      /* Flattened first. At a 52° pitch the far point is foreshortened — it
         sits small and high in frame, and how far away it is is not what it
         looks like. Straight down is the view in which the gap between two
         points means what it appears to mean. */
      m.fitBounds(
        [
          [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
          [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
        ],
        {
          padding: { top: 90, bottom: 90, left: padLeft, right: 70 },
          pitch: 0,
          bearing: 0,
          maxZoom: 16.5,
          duration: prefersReducedMotion() ? 0 : 900,
        },
      );
    },
  }));

  useEffect(() => {
    if (!container.current || map.current) return;

    const m = new maplibregl.Map({
      container: container.current,
      // Built WITHOUT terrain, then terrain is applied once the style parses.
      // Baking `terrain` into the initial style makes the first render depend
      // on DEM tiles arriving, so a slow or stalled elevation request blocks
      // the entire map. The DEM source is still declared — only the `terrain`
      // key is deferred.
      //
      // The shared package pins style-spec to the version the native SDK used;
      // maplibre-gl tracks a newer one. Both validate the style identically.
      style: buildBaseStyle({
        basemap,
        terrain: false,
      }) as maplibregl.StyleSpecification,
      center: [...CAMERA.center],
      zoom: CAMERA.zoom,
      pitch: CAMERA.pitch,
      bearing: CAMERA.bearing,
      maxPitch: CAMERA.maxPitch,
      minZoom: CAMERA.minZoom,
      maxZoom: CAMERA.maxZoom,
      maxBounds: [
        [DAVAO_BBOX[0], DAVAO_BBOX[1]],
        [DAVAO_BBOX[2], DAVAO_BBOX[3]],
      ],
      // Compact: a single ⓘ that expands on tap. The credits are a licence
      // condition of the basemap, the imagery and the hazard data, so they
      // have to be reachable from the map itself — but they are housekeeping,
      // not content, and they used to cost the panel two permanent lines.
      attributionControl: { compact: true },
    });

    // Without this the map fails silently: a WebGL failure, a rejected style
    // or a dead tile endpoint all report here and nowhere else, and every one
    // of them otherwise renders as an unexplained black rectangle.
    m.on("error", (e) => {
      const message = e.error?.message ?? String(e.error ?? "unknown error");
      console.error("[FloodMap]", message, e.error);
      setFailure((prev) => prev ?? message);
    });

    /**
     * `style.load`, NOT `load`.
     *
     * `load` waits for the style AND the first complete render, which includes
     * terrain and DEM tiles. If those are slow — or stall without erroring —
     * `load` never fires and the map hangs with no diagnostic. `style.load`
     * fires as soon as the style is parsed, which is the only precondition
     * addSource/addLayer actually have.
     */
    const initLayers = () => {
      if (m.getSource(SOURCE_HAZARD)) return; // style reloads re-fire this
      try {
        /* Rain first, so the hazard layers added below — which use the same
           `before` anchor — land on top of it. Every later rebuild of the
           hazard layers re-inserts them above the rain for the same reason,
           so the ordering holds without anyone maintaining it. */
        m.addSource(SOURCE_RAIN, {
          type: "geojson",
          data: rainRef.current ?? { type: "FeatureCollection", features: [] },
        });
        for (const layer of rainLayers(
          basemapRef.current === "light" ? "light" : "dark",
        )) {
          m.addLayer(
            layer as maplibregl.LayerSpecification,
            m.getLayer(HAZARD_BEFORE_ID) ? HAZARD_BEFORE_ID : undefined,
          );
        }
        applyRainVisibility(m, showRainRef.current);

        m.addSource(SOURCE_HAZARD, {
          type: "geojson",
          data: dataRef.current,
          // ODC-ODbL, same obligation as the basemap
          attribution:
            'Hazard data © <a href="https://noah.up.edu.ph/" target="_blank" rel="noopener">UP NOAH</a>',
        });
        rebuildHazardLayers(m, {
          basemap: basemapRef.current,
          extrude: extrudeRef.current,
        });
        // re-apply everything that changed while the style was still loading —
        // this also runs after a basemap swap, which resets the whole style
        applySelection(m, selectedRef.current);
        applyTerrain(m, terrainRef.current);
        applyHazardVisibility(m, showHazardRef.current);
        m.resize();
        setLoaded(true);
        setLayerEpoch((n) => n + 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[FloodMap] failed to add hazard layers:", err);
        setFailure((prev) => prev ?? message);
      }
    };

    m.on("style.load", initLayers);
    // if the style was already parsed before this handler attached, catch up
    if (m.isStyleLoaded()) initLayers();

    // Registered once, outside `load`, so a style reload cannot double-bind
    // it — which means it can fire before the hazard layers exist. Querying a
    // missing layer is an error, so ask only for the layers actually present.
    m.on("click", (e) => {
      const layers = HAZARD_FILL_LAYER_IDS.filter((id) => m.getLayer(id));
      if (layers.length === 0) return;
      const hits = m.queryRenderedFeatures(e.point, { layers });
      // fills draw low -> high, so the last hit is the most severe zone
      const top = hits[hits.length - 1];
      onSelectRef.current(
        top ? (asHazardProperties(top.properties) ?? null) : null,
        top ? originOf(top, [e.lngLat.lng, e.lngLat.lat]) : null,
      );
    });

    m.on("pitch", () => {
      onPitchChangeRef.current?.(m.getPitch());
    });

    m.on("mousemove", (e) => {
      const layers = HAZARD_FILL_LAYER_IDS.filter((id) => m.getLayer(id));
      if (layers.length === 0) return;
      const hit = m.queryRenderedFeatures(e.point, { layers }).length > 0;
      m.getCanvas().style.cursor = hit ? "pointer" : "";
    });

    // Never hang silently. If the style has not parsed in 15s and nothing has
    // errored, say so rather than showing "Loading the map…" forever.
    const watchdog = setTimeout(() => {
      if (m.getSource(SOURCE_HAZARD)) return;
      const detail = m.isStyleLoaded()
        ? "the style parsed but the hazard layers never attached"
        : "the basemap style did not finish loading — check the network tab for tiles.openfreemap.org";
      console.error("[FloodMap] timed out:", detail);
      setFailure((prev) => prev ?? `Timed out — ${detail}`);
    }, 15000);

    map.current = m;
    return () => {
      clearTimeout(watchdog);
      pin.current?.remove();
      pin.current = null;
      m.remove();
      map.current = null;
    };
    // built once; prop changes are applied by the effects below and re-applied
    // on load, so nothing set during style loading is lost
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* scenario swap: data only, never a style reload */
  useEffect(() => {
    const src = map.current?.getSource(SOURCE_HAZARD);
    if (src && "setData" in src) {
      (src as maplibregl.GeoJSONSource).setData(data);
    }
    // layerEpoch, not just data: re-push whatever is current every time the
    // layers are rebuilt, so the source can never be left holding the empty
    // collection it was created with
  }, [data, scenario, layerEpoch]);

  useEffect(() => {
    if (map.current) applySelection(map.current, selectedZoneId);
  }, [selectedZoneId]);

  useEffect(() => {
    if (map.current) applyTerrain(map.current, terrain);
  }, [terrain]);

  useEffect(() => {
    if (map.current) applyHazardVisibility(map.current, showHazard);
  }, [showHazard]);

  /* Same layerEpoch trick as the hazard data: re-push on every style rebuild
     so the rain source cannot be left holding the empty collection. */
  useEffect(() => {
    const src = map.current?.getSource(SOURCE_RAIN);
    if (src && "setData" in src) {
      (src as maplibregl.GeoJSONSource).setData(
        rain ?? { type: "FeatureCollection", features: [] },
      );
    }
  }, [rain, layerEpoch]);

  useEffect(() => {
    if (map.current) applyRainVisibility(map.current, showRain);
  }, [showRain, layerEpoch]);

  /* flat <-> extruded: different layer types, so remove and re-add. A basemap
     swap does not come through here — setStyle refires style.load, and
     initLayers rebuilds with the current refs. */
  useEffect(() => {
    const m = map.current;
    if (!m || !m.getSource(SOURCE_HAZARD)) return;
    rebuildHazardLayers(m, { basemap, extrude });
    applySelection(m, selectedZoneId);
    applyHazardVisibility(m, showHazard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extrude]);

  /**
   * Fly to the requested place and pin it.
   *
   * Gated on `loaded`, not just on the map existing. A camera command issued
   * before the style has parsed is silently discarded by maplibre, and the
   * map is created on the same render that a barangay link arrives on — so
   * the naive version dropped exactly the flight the user asked for. When
   * `loaded` flips this effect re-runs and the flight happens then.
   *
   * Markers survive a style reload (they are DOM, not style), so a basemap
   * swap leaves the pin where it is.
   */
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;

    pin.current?.remove();
    pin.current = null;
    if (!focus) return;

    const center: [number, number] = [...focus.center];
    pin.current = new maplibregl.Marker({
      element: createFocusPin({
        name: focus.name,
        onClear: () => onFocusClearRef.current?.(),
      }),
      anchor: "bottom",
    })
      .setLngLat(center)
      .addTo(m);

    // Pitch and bearing are deliberately left alone: the user may have set
    // them, and this is a "go here", not a "reset the view".
    if (prefersReducedMotion()) {
      m.jumpTo({ center, zoom: FOCUS_ZOOM });
    } else {
      m.flyTo({ center, zoom: FOCUS_ZOOM, duration: 2200, curve: 1.5 });
    }
  }, [focus, loaded]);

  /**
   * The pin on somewhere to go.
   *
   * A pin and nothing else. There used to be a dashed line from the tap to
   * here, and a straight line between two points on a map reads as a route no
   * matter how it is dashed — this app has no road network behind it, so the
   * honest drawing is the destination alone and a hand-off to a maps app for
   * the walking.
   */
  const guidePin = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;

    guidePin.current?.remove();
    guidePin.current = null;
    if (guide) {
      guidePin.current = new maplibregl.Marker({
        element: createFocusPin({ name: guide.label }),
        anchor: "bottom",
      })
        .setLngLat([...guide.to])
        .addTo(m);
    }

    return () => {
      guidePin.current?.remove();
      guidePin.current = null;
    };
  }, [guide, loaded, layerEpoch]);

  /**
   * The saved place.
   *
   * Independent of `focus` and of the camera: it is on the map because it is
   * saved, not because anything was pressed. "Show on map" flies the camera
   * to it and nothing more — the pin was already there.
   *
   * `layerEpoch` is in the deps for the same reason the guide pin has it: a
   * basemap swap rebuilds the whole style, and a marker attached to the old
   * one goes with it.
   */
  const homePin = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;

    homePin.current?.remove();
    homePin.current = null;

    if (savedPlace) {
      homePin.current = new maplibregl.Marker({
        element: createHomePin({ name: savedPlace.label }),
        anchor: "bottom",
      })
        .setLngLat([...savedPlace.center])
        .addTo(m);
    }

    return () => {
      homePin.current?.remove();
      homePin.current = null;
    };
  }, [savedPlace, loaded, layerEpoch]);

  /**
   * News markers.
   *
   * DOM markers rather than a layer: there are a handful of them, they need
   * to be clickable and legible at any zoom, and they must not be queryable
   * by the hazard tap handler — a news mention is not a zone.
   */
  const newsMarkers = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;

    for (const marker of newsMarkers.current) marker.remove();
    newsMarkers.current = [];
    if (!showNews || !newsPins?.length) return;

    for (const pin of newsPins) {
      newsMarkers.current.push(
        new maplibregl.Marker({
          element: createNewsPin(pin, (p) => onOpenNewsRef.current?.(p)),
          anchor: "bottom",
        })
          .setLngLat(pin.center)
          .addTo(m),
      );
    }

    return () => {
      for (const marker of newsMarkers.current) marker.remove();
      newsMarkers.current = [];
    };
  }, [newsPins, showNews, loaded]);

  /**
   * Swapping the basemap replaces the whole style, which drops the hazard
   * source and layers with it. `style.load` fires again afterwards and
   * `initLayers` puts them back — including selection, terrain and visibility.
   * Skipped on first render because the constructor already built this style.
   */
  const firstBasemap = useRef(true);
  useEffect(() => {
    if (firstBasemap.current) {
      firstBasemap.current = false;
      return;
    }
    map.current?.setStyle(
      buildBaseStyle({ basemap, terrain: false }) as maplibregl.StyleSpecification,
    );
  }, [basemap]);

  return (
    <div className="absolute inset-0" style={{ backgroundColor: colors.abyss }}>
      <div ref={container} className="absolute inset-0 h-full w-full" />

      {/* A blank map is the worst possible failure mode: it reads as "no
          flooding here". Say what went wrong instead.

          Only while nothing has rendered, though. `error` also fires for a
          single tile that failed to fetch, and a dropped tile on an otherwise
          working map was putting "The map could not load" across a map that
          plainly had — which is worse than saying nothing, because it invites
          the reader to distrust hazard data that is right there and correct. */}
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          {failure ? (
            <>
              <span className="text-haz-high text-sm font-semibold">
                The map could not load.
              </span>
              <span className="text-ink-dim max-w-xs font-mono text-[11px] break-words">
                {failure}
              </span>
            </>
          ) : (
            <span className="text-ink-dim text-sm font-semibold">
              Loading the map…
            </span>
          )}
        </div>
      )}

    </div>
  );
});
