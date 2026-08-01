import { CAMERA, PANABO_BBOX } from "@naboflood/hazard/geo";
import type { LngLat } from "@naboflood/hazard/geo";
import {
  HAZARD_BEFORE_ID,
  HAZARD_FILL_LAYER_IDS,
  LAYER_IDS,
  SOURCE_HAZARD,
  hazardLayers,
} from "@naboflood/hazard/layers";
import { asHazardProperties } from "@naboflood/hazard/schema";
import type { HazardProperties } from "@naboflood/hazard/schema";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";
import { SOURCE_TERRAIN, buildBaseStyle } from "@naboflood/hazard/style";
import { colors } from "@naboflood/hazard/tokens";
// maplibre-gl v6 ships named exports only — there is no default export
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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
};

type Props = {
  scenario: ScenarioYears;
  selectedZoneId: string | null;
  onSelect: (zone: HazardProperties | null) => void;
  data: GeoJSON.FeatureCollection;
  /** terrain is the heaviest part of the render — cheap to switch off */
  terrain?: boolean;
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
  m.setTerrain(enabled ? { source: SOURCE_TERRAIN, exaggeration: 1.4 } : null);
}

export const FloodMap = forwardRef<FloodMapHandle, Props>(function FloodMap(
  { scenario, selectedZoneId, onSelect, data, terrain = true },
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

  useEffect(() => {
    onSelectRef.current = onSelect;
    dataRef.current = data;
    selectedRef.current = selectedZoneId;
    terrainRef.current = terrain;
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
  }));

  useEffect(() => {
    if (!container.current || map.current) return;

    const m = new maplibregl.Map({
      container: container.current,
      // the shared package pins style-spec to the version the native SDK used;
      // maplibre-gl tracks a newer one. Both validate the style identically.
      style: buildBaseStyle({ terrain: true }) as maplibregl.StyleSpecification,
      center: [...CAMERA.center],
      zoom: CAMERA.zoom,
      pitch: CAMERA.pitch,
      bearing: CAMERA.bearing,
      maxPitch: CAMERA.maxPitch,
      minZoom: CAMERA.minZoom,
      maxZoom: CAMERA.maxZoom,
      maxBounds: [
        [PANABO_BBOX[0], PANABO_BBOX[1]],
        [PANABO_BBOX[2], PANABO_BBOX[3]],
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

    m.on("load", () => {
      try {
        m.addSource(SOURCE_HAZARD, { type: "geojson", data: dataRef.current });
        for (const layer of hazardLayers()) {
          m.addLayer(layer as maplibregl.LayerSpecification, HAZARD_BEFORE_ID);
        }
        // re-apply anything that changed while the style was still loading
        applySelection(m, selectedRef.current);
        applyTerrain(m, terrainRef.current);
        m.resize();
        setLoaded(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[FloodMap] failed to add hazard layers:", err);
        setFailure((prev) => prev ?? message);
      }
    });

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

    m.on("mousemove", (e) => {
      const layers = HAZARD_FILL_LAYER_IDS.filter((id) => m.getLayer(id));
      if (layers.length === 0) return;
      const hit = m.queryRenderedFeatures(e.point, { layers }).length > 0;
      m.getCanvas().style.cursor = hit ? "pointer" : "";
    });

    map.current = m;
    return () => {
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
