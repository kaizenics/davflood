import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  NativeUserLocation,
  type CameraRef,
  type MapRef,
} from "@maplibre/maplibre-react-native";
import { CAMERA, PANABO_BBOX } from "@naboflood/hazard/geo";
import type { LngLat } from "@naboflood/hazard/geo";
import {
  HAZARD_BEFORE_ID,
  HAZARD_FILL_LAYER_IDS,
  SOURCE_HAZARD,
  hazardLayers,
} from "@naboflood/hazard/layers";
import { asHazardProperties } from "@naboflood/hazard/schema";
import type { HazardProperties } from "@naboflood/hazard/schema";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";
import { buildBaseStyle } from "@naboflood/hazard/style";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";

import { loadScenario } from "@/lib/hazard-source";

export type FloodMapHandle = {
  flyTo: (center: LngLat, zoom?: number) => void;
  resetCamera: () => void;
};

type Props = {
  scenario: ScenarioYears;
  selectedZoneId: string | null;
  onSelect: (zone: HazardProperties | null) => void;
  /** terrain is the least mature part of MapLibre Native — trivially disabled */
  terrain?: boolean;
  showUserLocation?: boolean;
};

export const FloodMap = forwardRef<FloodMapHandle, Props>(function FloodMap(
  { scenario, selectedZoneId, onSelect, terrain = true, showUserLocation = false },
  ref,
) {
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  // Rebuilt only when terrain toggles. A scenario change swaps the source
  // `shape` below — never the style — so there is no reload, no flicker and no
  // refetch of basemap tiles.
  const style = useMemo(() => buildBaseStyle({ terrain }), [terrain]);
  const shape = useMemo(() => loadScenario(scenario), [scenario]);
  const layers = useMemo(() => hazardLayers({ selectedZoneId }), [selectedZoneId]);

  useImperativeHandle(ref, () => ({
    flyTo(center, zoom = 14) {
      cameraRef.current?.flyTo({ center: [...center], zoom, duration: 1200 });
    },
    resetCamera() {
      cameraRef.current?.flyTo({
        center: [...CAMERA.center],
        zoom: CAMERA.zoom,
        pitch: CAMERA.pitch,
        bearing: CAMERA.bearing,
        duration: 900,
      });
    },
  }));

  return (
    <Map
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapStyle={style}
      logo={false}
      attribution={false}
      compass
      compassPosition={{ top: 128, right: 12 }}
      touchRotate
      touchPitch
      onPress={(event) => {
        void handlePress(event.nativeEvent.point);
      }}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: [...CAMERA.center],
          zoom: CAMERA.zoom,
          pitch: CAMERA.pitch,
          bearing: CAMERA.bearing,
        }}
        minZoom={CAMERA.minZoom}
        maxZoom={CAMERA.maxZoom}
        // LngLatBounds is flat [w, s, e, n] — the same shape as our bbox
        maxBounds={[...PANABO_BBOX]}
      />

      <GeoJSONSource id={SOURCE_HAZARD} data={shape}>
        {layers.map((layer) => (
          <Layer key={layer.id} {...layer} beforeId={HAZARD_BEFORE_ID} />
        ))}
      </GeoJSONSource>

      {showUserLocation && <NativeUserLocation />}
    </Map>
  );

  async function handlePress(point: [number, number]) {
    try {
      const features = await mapRef.current?.queryRenderedFeatures(point, {
        layers: HAZARD_FILL_LAYER_IDS,
      });
      // fills draw low -> high, so the last hit is the most severe zone
      const top = features?.[features.length - 1];
      onSelect(top ? (asHazardProperties(top.properties) ?? null) : null);
    } catch {
      // a failed hit-test must never take the map down
      onSelect(null);
    }
  }
});
