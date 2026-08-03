import { CAMERA, DAVAO_BBOX } from "@davflood/hazard/geo";
import type { LngLat } from "@davflood/hazard/geo";
import {
  HAZARD_BEFORE_ID,
  HAZARD_FILL_LAYER_IDS,
  LAYER_IDS,
  SOURCE_HAZARD,
  hazardLayers,
} from "@davflood/hazard/layers";
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

export type FloodMapHandle = {
  flyTo: (center: LngLat, zoom?: number) => void;
  resetCamera: () => void;
  /** animate=false for slider drags, true for preset jumps */
  setPitch: (pitch: number, animate?: boolean) => void;
};

type Props = {
  scenario: ScenarioYears;
  selectedZoneId: string | null;
  onSelect: (zone: HazardProperties | null) => void;
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
  },
  ref,
) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    onSelectRef.current = onSelect;
    dataRef.current = data;
    selectedRef.current = selectedZoneId;
    terrainRef.current = terrain;
    basemapRef.current = basemap;
    showHazardRef.current = showHazard;
    extrudeRef.current = extrude;
    onPitchChangeRef.current = onPitchChange;
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
      attributionControl: false,
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
        m.addSource(SOURCE_HAZARD, { type: "geojson", data: dataRef.current });
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
      onSelectRef.current(top ? (asHazardProperties(top.properties) ?? null) : null);
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
  }, [data, scenario]);

  useEffect(() => {
    if (map.current) applySelection(map.current, selectedZoneId);
  }, [selectedZoneId]);

  useEffect(() => {
    if (map.current) applyTerrain(map.current, terrain);
  }, [terrain]);

  useEffect(() => {
    if (map.current) applyHazardVisibility(map.current, showHazard);
  }, [showHazard]);

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
          flooding here". Say what went wrong instead. */}
      {(failure || !loaded) && (
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
