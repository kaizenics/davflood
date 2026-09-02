import type { LngLat } from "@davflood/hazard/geo";
import { inBBox } from "@davflood/hazard/geo";
import {
  Eye,
  EyeOff,
  Loader2,
  LocateFixed,
  Mountain,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

type Props = {
  onLocate: (center: LngLat) => void;
  onReset: () => void;
  terrain: boolean;
  onToggleTerrain: () => void;
  /** opens the map-view sheet; only rendered on small screens, where those
      controls are not otherwise reachable without opening the panel */
  onOpenMapView?: () => void;
  mapViewOpen?: boolean;
  /** map-only mode: every panel hidden, nothing but cartography */
  immersive?: boolean;
  onToggleImmersive?: () => void;
};

/**
 * Locate / reset / terrain.
 *
 * Geolocation is requested only when the user asks for it, never on load.
 */
export function MapControls({
  onLocate,
  onReset,
  terrain,
  onToggleTerrain,
  onOpenMapView,
  mapViewOpen,
  immersive = false,
  onToggleImmersive,
}: Props) {
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function locate() {
    if (!("geolocation" in navigator)) {
      setNotice("This browser can't share a location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const point: LngLat = [pos.coords.longitude, pos.coords.latitude];
        if (!inBBox(point)) {
          setNotice("You appear to be outside Davao City.");
          return;
        }
        setNotice(null);
        onLocate(point);
      },
      () => {
        setLocating(false);
        // denial is a normal outcome, not an error — the map works without it
        setNotice("Location is off. The map still works without it.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  /**
   * In map-only mode this stack collapses to the one button that gets you
   * back out.
   *
   * Leaving the rest visible would defeat the mode; removing all of them
   * would strand the user in it. A single control, in the corner it was
   * already in, is the smallest thing that is still an exit — and Escape
   * works too, for anyone who never finds it.
   *
   * The toggle sits FIRST rather than being appended, so that it is the one
   * button that never moves. The rest fold up underneath it (see
   * .nf-chrome-stack in app.css); if it were at the bottom it would slide up
   * the screen as they collapsed, and the control you just pressed jumping
   * out from under your finger is how a mode toggle earns a double press.
   */
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {onToggleImmersive && (
        <ControlButton
          label={
            immersive ? "Show the panels again" : "Hide the panels — map only"
          }
          onClick={onToggleImmersive}
          active={immersive}
        >
          {immersive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </ControlButton>
      )}

      <div
        data-hidden={immersive || undefined}
        inert={immersive || undefined}
        className="nf-chrome-stack flex flex-col items-end gap-2"
      >
        <ControlButton label="Show my location" onClick={locate} disabled={locating}>
          {locating ? (
            <Loader2 className="text-tide size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
        </ControlButton>

        <ControlButton label="Reset the view" onClick={onReset}>
          <RotateCcw className="size-4" />
        </ControlButton>

        <ControlButton
          label={terrain ? "Turn off 3D terrain" : "Turn on 3D terrain"}
          onClick={onToggleTerrain}
          active={terrain}
        >
          <Mountain className="size-4" />
        </ControlButton>

        {onOpenMapView && (
          <div className="lg:hidden">
            <ControlButton
              label="Map view — basemap, overlay and angle"
              onClick={onOpenMapView}
              active={mapViewOpen}
            >
              <SlidersHorizontal className="size-4" />
            </ControlButton>
          </div>
        )}
      </div>

      {notice && (
        <p className="border-hairline bg-abyss/90 text-ink-dim max-w-44 rounded-lg border px-2.5 py-1.5 text-right text-[10px] backdrop-blur">
          {notice}
        </p>
      )}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`border-hairline flex size-10 items-center justify-center rounded-full border shadow-lg backdrop-blur transition ${
        active ? "bg-tide text-abyss" : "bg-abyss/90 text-ink hover:border-tide"
      }`}
    >
      {children}
    </button>
  );
}
