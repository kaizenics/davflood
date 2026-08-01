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
// maplibre-gl v6 ships named exports only — there is no default export
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { loadScenario } from "@/lib/hazard-source";

/**
 * WEB implementation of <FloodMap>.
 *
 * `@maplibre/maplibre-react-native` has no web build — importing it under
 * react-native-web throws immediately, because `codegenNativeComponent` does
 * not exist there. A Platform.OS check cannot help: the failure happens at
 * module load, before any component renders. Metro only resolves this file
 * when platform=web, so the native bundle never sees maplibre-gl and the web
 * bundle never sees the native module.
 *
 * Same props, same imperative handle, same shared style and layer specs as
 * the native version — so `expo start --web` is a genuine preview of the app
 * rather than a stub.
 */

export type FloodMapHandle = {
  flyTo: (center: LngLat, zoom?: number) => void;
  resetCamera: () => void;
};

/**
 * Both helpers no-op until the layer/source they touch actually exists.
 * maplibre-gl throws when asked about a missing layer, and the hazard layers
 * only appear once the style has loaded — so every caller has to tolerate
 * being early rather than assume it is late.
 */
function applySelection(m: maplibregl.Map, zoneId: string | null) {
  if (!m.getLayer(LAYER_IDS.selected)) return;
  m.setFilter(LAYER_IDS.selected, ["==", ["get", "zone_id"], zoneId ?? ""]);
}

function applyTerrain(m: maplibregl.Map, enabled: boolean) {
  if (!m.getSource(SOURCE_TERRAIN)) return;
  m.setTerrain(enabled ? { source: SOURCE_TERRAIN, exaggeration: 1.4 } : null);
}

type Props = {
  scenario: ScenarioYears;
  selectedZoneId: string | null;
  onSelect: (zone: HazardProperties | null) => void;
  terrain?: boolean;
  showUserLocation?: boolean;
};

export const FloodMap = forwardRef<FloodMapHandle, Props>(function FloodMap(
  { scenario, selectedZoneId, onSelect, terrain = true },
  ref,
) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // The map is created once, but props can change before `load` fires. These
  // refs let the load handler read CURRENT values instead of the ones its
  // closure captured on first render — otherwise a scenario picked during
  // loading would be silently discarded.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const selectedRef = useRef(selectedZoneId);
  selectedRef.current = selectedZoneId;
  const terrainRef = useRef(terrain);
  terrainRef.current = terrain;

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
      // the shared package pins style-spec to the version
      // maplibre-react-native uses; maplibre-gl tracks a newer one
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

    m.on("load", () => {
      m.addSource(SOURCE_HAZARD, {
        type: "geojson",
        data: loadScenario(scenarioRef.current),
      });
      for (const layer of hazardLayers()) {
        m.addLayer(layer as maplibregl.LayerSpecification, HAZARD_BEFORE_ID);
      }
      // re-apply anything that changed while the style was still loading
      applySelection(m, selectedRef.current);
      applyTerrain(m, terrainRef.current);
    });

    // Registered once, outside `load`, so a style reload cannot double-bind
    // it. That means it can fire before the hazard layers exist, and
    // querying a missing layer is an error in maplibre-gl — so ask only for
    // the layers actually present.
    m.on("click", (e) => {
      const layers = HAZARD_FILL_LAYER_IDS.filter((id) => m.getLayer(id));
      if (layers.length === 0) return;
      const hits = m.queryRenderedFeatures(e.point, { layers });
      // fills draw low -> high, so the last hit is the most severe zone
      const top = hits[hits.length - 1];
      onSelectRef.current(top ? (asHazardProperties(top.properties) ?? null) : null);
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
      (src as maplibregl.GeoJSONSource).setData(loadScenario(scenario));
    }
  }, [scenario]);

  useEffect(() => {
    if (map.current) applySelection(map.current, selectedZoneId);
  }, [selectedZoneId]);

  useEffect(() => {
    if (map.current) applyTerrain(map.current, terrain);
  }, [terrain]);

  return (
    <div
      ref={container}
      style={{ position: "absolute", inset: 0, backgroundColor: "#060a0e" }}
    />
  );
});
