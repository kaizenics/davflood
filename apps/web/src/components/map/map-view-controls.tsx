import { MapLayers } from "@/components/map/map-layers";
import { PitchControl } from "@/components/map/pitch-control";

export type MapViewProps = {
  basemap: "map" | "satellite";
  onBasemapChange: (b: "map" | "satellite") => void;
  showHazard: boolean;
  onShowHazardChange: (v: boolean) => void;
  extrude: boolean;
  onExtrudeChange: (v: boolean) => void;
  showRain: boolean;
  onShowRainChange: (v: boolean) => void;
  showLandslide: boolean;
  onShowLandslideChange: (v: boolean) => void;
  landslideLoading?: boolean;
  showNews: boolean;
  onShowNewsChange: (v: boolean) => void;
  newsCount: number;
  pitch: number;
  onPitchChange: (pitch: number, animate: boolean) => void;
};

/**
 * Everything that changes how the map is drawn.
 *
 * The body only — two surfaces present it: a sheet from the bottom on a phone
 * and a popover from the button on the map at desktop widths. Written once so
 * the two can never drift into offering different controls.
 */
export function MapViewControls({
  basemap,
  onBasemapChange,
  showHazard,
  onShowHazardChange,
  extrude,
  onExtrudeChange,
  showRain,
  onShowRainChange,
  showLandslide,
  onShowLandslideChange,
  landslideLoading,
  showNews,
  onShowNewsChange,
  newsCount,
  pitch,
  onPitchChange,
}: MapViewProps) {
  return (
    <div className="space-y-4">
      <MapLayers
        basemap={basemap}
        onBasemapChange={onBasemapChange}
        showHazard={showHazard}
        onShowHazardChange={onShowHazardChange}
        extrude={extrude}
        onExtrudeChange={onExtrudeChange}
        showRain={showRain}
        onShowRainChange={onShowRainChange}
        showLandslide={showLandslide}
        onShowLandslideChange={onShowLandslideChange}
        landslideLoading={landslideLoading}
        showNews={showNews}
        onShowNewsChange={onShowNewsChange}
        newsCount={newsCount}
      />

      <div>
        <p className="text-ink-dim mb-2 text-[11px] font-medium">
          View angle — tilt to read depth in 3D
        </p>
        <PitchControl pitch={pitch} onPitchChange={onPitchChange} />
      </div>
    </div>
  );
}

/** "Satellite · 3D depth · Rain on · 52°" — the state, without opening it. */
export function mapViewSummary({
  basemap,
  showHazard,
  extrude,
  showRain,
  showLandslide,
  showNews,
  pitch,
}: Pick<
  MapViewProps,
  | "basemap"
  | "showHazard"
  | "extrude"
  | "showRain"
  | "showLandslide"
  | "showNews"
  | "pitch"
>): string {
  return [
    basemap === "satellite" ? "Satellite" : "Map",
    showHazard ? (extrude ? "3D depth" : "Flat overlay") : "Overlay off",
    ...(showRain ? ["Rain"] : []),
    ...(showLandslide ? ["Landslide"] : []),
    ...(showNews ? ["Reports"] : []),
    `${Math.round(pitch)}°`,
  ].join(" · ");
}
