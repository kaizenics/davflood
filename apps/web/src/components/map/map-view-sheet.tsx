import { X } from "lucide-react";
import { useEffect } from "react";

import { MapLayers } from "@/components/map/map-layers";
import { PitchControl } from "@/components/map/pitch-control";

type Props = {
  open: boolean;
  onClose: () => void;
  basemap: "map" | "satellite";
  onBasemapChange: (b: "map" | "satellite") => void;
  showHazard: boolean;
  onShowHazardChange: (v: boolean) => void;
  extrude: boolean;
  onExtrudeChange: (v: boolean) => void;
  showRain: boolean;
  onShowRainChange: (v: boolean) => void;
  showNews: boolean;
  onShowNewsChange: (v: boolean) => void;
  newsCount: number;
  pitch: number;
  onPitchChange: (pitch: number, animate: boolean) => void;
};

/**
 * How the map is drawn, reachable from the map itself — phones only.
 *
 * These controls live in the panel, which on a phone is a collapsed sheet:
 * changing the basemap or the tilt meant opening the panel, scrolling to the
 * drawer, opening that, and adjusting a map you could no longer see. This puts
 * them one tap from the map and keeps the map visible while they change, which
 * is the only way to tell whether the change was the one you wanted.
 *
 * Deliberately short: it stops well above the bottom of the screen so the map
 * stays in view behind it.
 */
export function MapViewSheet({
  open,
  onClose,
  basemap,
  onBasemapChange,
  showHazard,
  onShowHazardChange,
  extrude,
  onExtrudeChange,
  showRain,
  onShowRainChange,
  showNews,
  onShowNewsChange,
  newsCount,
  pitch,
  onPitchChange,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="lg:hidden">
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close map view options"
          onClick={onClose}
          className="fixed inset-0 z-30 cursor-default bg-black/40"
        />
      )}

      <div
        role="dialog"
        aria-label="Map view"
        aria-hidden={!open}
        data-open={open}
        // rendered rather than mounted on open so it can animate both ways;
        // inert while closed so it cannot be tabbed into behind the map
        inert={!open}
        className="nf-viewsheet border-hairline bg-deep/95 fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-ink text-[13px] font-semibold">Map view</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map view options"
            className="text-ink-dim hover:text-ink -mr-1.5 rounded-lg p-1.5 transition"
          >
            <X className="size-4" />
          </button>
        </div>

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
      </div>
    </div>
  );
}
