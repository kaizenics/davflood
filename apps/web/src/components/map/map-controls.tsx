import type { LngLat } from "@davflood/hazard/geo";
import { inBBox } from "@davflood/hazard/geo";
import { Loader2, LocateFixed, Mountain, RotateCcw } from "lucide-react";
import { useState } from "react";

type Props = {
  onLocate: (center: LngLat) => void;
  onReset: () => void;
  terrain: boolean;
  onToggleTerrain: () => void;
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

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
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
