import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { MapLayers } from "@/components/map/map-layers";
import { PitchControl } from "@/components/map/pitch-control";

type Props = {
  basemap: "map" | "satellite";
  onBasemapChange: (b: "map" | "satellite") => void;
  showHazard: boolean;
  onShowHazardChange: (v: boolean) => void;
  extrude: boolean;
  onExtrudeChange: (v: boolean) => void;
  showRain: boolean;
  onShowRainChange: (v: boolean) => void;
  pitch: number;
  onPitchChange: (pitch: number, animate: boolean) => void;
};

/**
 * Everything that changes how the map is DRAWN, behind one disclosure.
 *
 * These were two full-weight sections ("View angle", "Layers") sitting above
 * the fold, which put camera chrome in front of the hazard reading — the
 * panel led with lens settings and buried the answer. They are worth keeping
 * (the tilt gesture is undiscoverable, and hiding the overlay is how you
 * sanity-check the model against what you know is there) but they are not
 * worth the first screen.
 *
 * Closed by default, and the summary line reports the state so nothing is
 * hidden that the user needs to see: you can tell the overlay is off without
 * opening it.
 */
export function MapViewDrawer({
  basemap,
  onBasemapChange,
  showHazard,
  onShowHazardChange,
  extrude,
  onExtrudeChange,
  showRain,
  onShowRainChange,
  pitch,
  onPitchChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const summary = [
    basemap === "satellite" ? "Satellite" : "Map",
    showHazard ? (extrude ? "3D depth" : "Flat overlay") : "Overlay off",
    ...(showRain ? ["Rain on"] : []),
    `${Math.round(pitch)}°`,
  ].join(" · ");

  return (
    <div className="px-5 py-3.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center gap-2.5 text-left"
      >
        <SlidersHorizontal
          className="text-ink-dim size-4 shrink-0"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="text-ink block text-[12.5px] font-semibold">
            Map view
          </span>
          <span
            className="text-ink-dim block truncate text-[11px]"
            data-numeric
          >
            {summary}
          </span>
        </span>
        <ChevronDown
          className={`text-ink-dim size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <MapLayers
            basemap={basemap}
            onBasemapChange={onBasemapChange}
            showHazard={showHazard}
            onShowHazardChange={onShowHazardChange}
            extrude={extrude}
            onExtrudeChange={onExtrudeChange}
            showRain={showRain}
            onShowRainChange={onShowRainChange}
          />
          <div>
            <p className="text-ink-dim mb-2 text-[11px] font-medium">
              View angle — tilt to read depth in 3D
            </p>
            <PitchControl pitch={pitch} onPitchChange={onPitchChange} />
          </div>
        </div>
      )}
    </div>
  );
}
