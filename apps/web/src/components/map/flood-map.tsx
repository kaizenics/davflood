import { CAMERA, DAVAO_BBOX } from "@davflood/hazard/geo";
import type { LngLat } from "@davflood/hazard/geo";
import {
  HAZARD_BEFORE_ID,
  HAZARD_FILL_LAYER_IDS,
  SOURCE_BARANGAYS,
  SOURCE_BOUNDARY,
  SOURCE_HAZARD,
  SOURCE_LANDSLIDE,
  SOURCE_RAIN,
  landslideLayers,
  rainLayers,
} from "@davflood/hazard/layers";
import { asHazardProperties } from "@davflood/hazard/schema";
import type { HazardProperties } from "@davflood/hazard/schema";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { TERRAIN_EXAGGERATION, buildBaseStyle } from "@davflood/hazard/style";
import type { BasemapKind } from "@davflood/hazard/style";
import { colors } from "@davflood/hazard/tokens";
/* Imported, not fetched: ~48 KB of outline, which is small enough to sit in
   the bundle and cheap next to the round-trip it saves. The hazard files go
   through `?url` because they are megabytes; this one is not. */
import cityBoundary from "@davflood/hazard/data/davao-boundary.json";
/* 176 KB for 117 outlines. Same reasoning as the city boundary above: small
   enough to bundle, and bundling means the barangay you searched for is
   outlined even when the network has gone. */
import barangayOutlines from "@davflood/hazard/data/davao-barangays.json";
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

import {
  applyBarangayFocus,
  applyHazardVisibility,
  applyLandslideVisibility,
  applyRainVisibility,
  applySelection,
  applyTerrain,
  originOf,
  outlineBounds,
  rebuildBoundaryLayers,
  rebuildHazardLayers,
} from "@/components/map/map-ops";
import {
  useMapMarker,
  useMapMarkers,
} from "@/components/map/use-map-marker";
import { createFocusPin } from "@/components/map/focus-pin";
import { createHomePin } from "@/components/map/home-pin";
import { createNewsPin } from "@/components/map/news-pin";
import { createTapPin } from "@/components/map/tap-pin";
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
  /**
   * Ground height at a point, in true metres above sea level.
   *
   * Null when terrain is switched off (there is no DEM attached to query) or
   * when the tiles covering that point have not arrived yet. Both are real
   * "we do not know" answers and callers must render them as absence, not as
   * zero — zero is a legitimate elevation in a coastal city.
   */
  elevationAt: (point: LngLat) => number | null;
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
  /** landslide susceptibility polygons; undefined until first switched on */
  landslide?: GeoJSON.FeatureCollection;
  showLandslide?: boolean;
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
  /** the spot just tapped, offering to be kept; null hides the offer */
  tapPoint?: { center: LngLat; label: string } | null;
  onSaveTapPoint?: () => void;
};

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
    tapPoint = null,
    onSaveTapPoint,
    rain,
    showRain = false,
    landslide,
    showLandslide = false,
    newsPins,
    showNews = false,
    onOpenNews,
  },
  ref,
) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
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
  const landslideRef = useRef(landslide);
  const showLandslideRef = useRef(showLandslide);
  const onOpenNewsRef = useRef(onOpenNews);
  // read by initLayers, so a barangay highlighted before the style finished
  // parsing survives the style reload a basemap swap causes
  const focusRef = useRef(focus);

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
    landslideRef.current = landslide;
    showLandslideRef.current = showLandslide;
    onOpenNewsRef.current = onOpenNews;
    focusRef.current = focus;
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
    elevationAt(point) {
      const m = map.current;
      if (!m) return null;
      const raw = m.queryTerrainElevation([...point]);
      if (raw === null || !Number.isFinite(raw)) return null;
      /* queryTerrainElevation returns the height the RENDERER is using, which
         is the real one multiplied by the exaggeration that makes the 3D view
         readable. Reporting that number to a person would overstate their
         ground by 30%. */
      return raw / TERRAIN_EXAGGERATION;
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

        /* Landslide sits between the rain and the flood layers. It is added
           here rather than with the reference geometry because it is hazard
           data and belongs under the flood polygons — see landslideLayers. */
        m.addSource(SOURCE_LANDSLIDE, {
          type: "geojson",
          data: landslideRef.current ?? {
            type: "FeatureCollection",
            features: [],
          },
          attribution:
            'Landslide data © <a href="https://noah.up.edu.ph/" target="_blank" rel="noopener">UP NOAH</a>',
        });
        for (const layer of landslideLayers(
          basemapRef.current === "light" ? "light" : "dark",
        )) {
          m.addLayer(
            layer as maplibregl.LayerSpecification,
            m.getLayer(HAZARD_BEFORE_ID) ? HAZARD_BEFORE_ID : undefined,
          );
        }
        applyLandslideVisibility(m, showLandslideRef.current);

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

        /* The city outline, added last so it sits above both the rain grid
           and the hazard zones. It is reference geometry, not data: no tap
           handler queries it, and it stays put when the hazard overlay is
           switched off. */
        m.addSource(SOURCE_BOUNDARY, {
          type: "geojson",
          data: cityBoundary as GeoJSON.Feature,
        });
        m.addSource(SOURCE_BARANGAYS, {
          type: "geojson",
          data: barangayOutlines as GeoJSON.FeatureCollection,
        });
        rebuildBoundaryLayers(m, basemapRef.current, focusRef.current?.name ?? null);

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
      /* No marker teardown here any more: each useMapMarker owns its own and
         removes it on unmount. `m.remove()` would take them with it anyway,
         but a ref the component no longer creates is a ref that quietly
         stops being cleared. */
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

  /* Same layerEpoch trick again: the data arrives asynchronously the first
     time the layer is switched on, and a basemap swap in between would
     otherwise leave the source holding the empty collection it was born with. */
  useEffect(() => {
    const src = map.current?.getSource(SOURCE_LANDSLIDE);
    if (src && "setData" in src) {
      (src as maplibregl.GeoJSONSource).setData(
        landslide ?? { type: "FeatureCollection", features: [] },
      );
    }
  }, [landslide, layerEpoch]);

  useEffect(() => {
    if (map.current) applyLandslideVisibility(map.current, showLandslide);
  }, [showLandslide, layerEpoch]);

  /* flat <-> extruded: different layer types, so remove and re-add. A basemap
     swap does not come through here — setStyle refires style.load, and
     initLayers rebuilds with the current refs. */
  useEffect(() => {
    const m = map.current;
    if (!m || !m.getSource(SOURCE_HAZARD)) return;
    rebuildHazardLayers(m, { basemap, extrude });
    // the hazard layers just took the top slot back — see rebuildBoundaryLayers
    rebuildBoundaryLayers(m, basemap, focus?.name ?? null);
    applySelection(m, selectedZoneId);
    applyHazardVisibility(m, showHazard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extrude]);

  /**
   * Pin the requested place, and fly to it in the effect below.
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
  useMapMarker(
    map,
    loaded,
    focus
      ? {
          at: focus.center,
          element: () =>
            createFocusPin({
              name: focus.name,
              onClear: () => onFocusClearRef.current?.(),
            }),
        }
      : null,
    [focus, loaded],
  );

  /**
   * …and take the camera there, with the barangay picked out behind it.
   *
   * Separate from the pin above because they are two different jobs that
   * happen to share a trigger: one is a marker's lifecycle, the other is a
   * one-shot camera command and a filter. Fusing them is what made the
   * original effect long enough to hide the fact that it did both.
   *
   * Frame the whole barangay when we know its shape. FOCUS_ZOOM was a
   * compromise for having only a centroid: one zoom for every barangay, from
   * a few downtown blocks to the tens of square kilometres of Marilog, chosen
   * so a centroid a few hundred metres off still left the pin on screen.
   * Where an outline exists that guess is unnecessary — the camera frames the
   * actual area, and the reader sees where the barangay ends rather than
   * inferring it from how far the pin is from the middle. The 66 barangays
   * OSM has only as a point still take the old path, which is why it stays.
   *
   * Pitch and bearing are left alone in both: the user may have set them, and
   * this is "go here", not "reset the view".
   */
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;

    applyBarangayFocus(m, focus?.name ?? null);
    if (!focus) return;

    const center: [number, number] = [...focus.center];
    const bounds = focus.name ? outlineBounds(focus.name) : null;
    const instant = prefersReducedMotion();

    if (bounds) {
      m.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 70, right: 70 },
        // a small barangay must not be zoomed past the point where the hazard
        // polygons inside it stop being legible
        maxZoom: 15.5,
        duration: instant ? 0 : 1600,
      });
    } else if (instant) {
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
  useMapMarker(
    map,
    loaded,
    guide ? { at: guide.to, element: () => createFocusPin({ name: guide.label }) } : null,
    [guide, loaded, layerEpoch],
  );

  /**
   * The spot just tapped, and the offer to keep it.
   *
   * Rebuilt whenever the point or the label changes, because the node is
   * plain DOM with a closure over the handler — cheaper to recreate than to
   * reach in and patch, at one marker.
   *
   * The handler is read through a ref so that a new callback identity does
   * not tear down and rebuild the marker on every render of the shell.
   */
  const saveTapRef = useRef(onSaveTapPoint);
  saveTapRef.current = onSaveTapPoint;

  useMapMarker(
    map,
    loaded,
    tapPoint
      ? {
          at: tapPoint.center,
          element: () =>
            createTapPin({
              label: tapPoint.label,
              onSave: () => saveTapRef.current?.(),
            }),
        }
      : null,
    [tapPoint, loaded, layerEpoch],
  );

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
  useMapMarker(
    map,
    loaded,
    savedPlace
      ? {
          at: savedPlace.center,
          element: () => createHomePin({ name: savedPlace.label }),
        }
      : null,
    [savedPlace, loaded, layerEpoch],
  );

  /**
   * News markers.
   *
   * DOM markers rather than a layer: there are a handful of them, they need
   * to be clickable and legible at any zoom, and they must not be queryable
   * by the hazard tap handler — a news mention is not a zone.
   */
  useMapMarkers(
    map,
    loaded,
    showNews && newsPins?.length
      ? newsPins.map((pin) => ({
          at: pin.center,
          element: () => createNewsPin(pin, (p) => onOpenNewsRef.current?.(p)),
        }))
      : null,
    [newsPins, showNews, loaded],
  );

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
