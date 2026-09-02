import {
  Box,
  CloudRain,
  Eye,
  EyeOff,
  Layers,
  Mountain,
  Newspaper,
  Satellite,
} from "lucide-react";

type Props = {
  /** "map" follows the theme; "satellite" overrides it */
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
  /** true while the 3 MB overlay is being fetched for the first time */
  landslideLoading?: boolean;
  showNews: boolean;
  onShowNewsChange: (v: boolean) => void;
  /** how many places recent reporting actually named */
  newsCount: number;
};

/** "Map" resolves to the active theme, so the basemap follows light/dark. */
const BASEMAPS = [
  { id: "map", label: "Map", icon: Layers },
  { id: "satellite", label: "Satellite", icon: Satellite },
] as const;

export function MapLayers({
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
  landslideLoading = false,
  showNews,
  onShowNewsChange,
  newsCount,
}: Props) {
  return (
    // one owner for the rhythm — the rows used to carry their own top margins,
    // which doubled up as soon as they were nested in a spaced container
    <div className="space-y-2.5">
      <div
        role="radiogroup"
        aria-label="Basemap"
        className="bg-raised/70 flex w-full gap-0.5 rounded-lg p-0.5"
      >
        {BASEMAPS.map(({ id, label, icon: Icon }) => {
          const active = id === basemap;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onBasemapChange(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-[6px] py-1.5 text-[12.5px] font-semibold transition ${
                active
                  ? "bg-tide text-abyss shadow-sm"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Hiding the hazard overlay is how you check the map against what you
          actually know is there — which is the honest way to use a model. */}
      <SwitchRow
        checked={showHazard}
        onChange={onShowHazardChange}
        label="Flood hazard overlay"
        icon={
          showHazard ? (
            <Eye className="text-tide size-4 shrink-0" aria-hidden="true" />
          ) : (
            <EyeOff className="text-ink-dim size-4 shrink-0" aria-hidden="true" />
          )
        }
      />

      {/* The second hazard.
          Its own row rather than a mode of the flood overlay, because the two
          are different questions about different ground and are worth reading
          together: the valley floods and the slope above it fails, in the same
          storm. Off by default — it is 0.63 MB fetched on first use, and most
          of the city's population lives on the plain. */}
      <SwitchRow
        checked={showLandslide}
        onChange={onShowLandslideChange}
        label={
          landslideLoading
            ? "Loading landslide data…"
            : "Landslide susceptibility"
        }
        icon={
          <Mountain
            className={`size-4 shrink-0 ${showLandslide ? "text-slide-med" : "text-ink-dim"}`}
            aria-hidden="true"
          />
        }
      />

      {/* Extruded zones stand up by their expected depth — tilt the map to
          read them. Only meaningful while the overlay is showing. */}
      {/* Weather, not hazard — and labelled so nobody reads the blue squares
          as water on the ground. */}
      <SwitchRow
        checked={showRain}
        onChange={onShowRainChange}
        label="Rain falling now"
        icon={
          <CloudRain
            className={`size-4 shrink-0 ${showRain ? "text-tide" : "text-ink-dim"}`}
            aria-hidden="true"
          />
        }
      />

      {/* Reports, not readings — the label says "reported" so the pins can
          never be mistaken for something the app measured. */}
      <SwitchRow
        checked={showNews}
        onChange={onShowNewsChange}
        disabled={newsCount === 0}
        label={
          newsCount === 0
            ? "No reported flooding on record"
            : `Reported flooding (${newsCount})`
        }
        icon={
          <Newspaper
            className={`size-4 shrink-0 ${showNews && newsCount ? "text-tide" : "text-ink-dim"}`}
            aria-hidden="true"
          />
        }
      />

      <SwitchRow
        checked={extrude}
        onChange={onExtrudeChange}
        disabled={!showHazard}
        label="Show depth in 3D"
        icon={
          <Box
            className={`size-4 shrink-0 ${extrude && showHazard ? "text-tide" : "text-ink-dim"}`}
            aria-hidden="true"
          />
        }
      />
    </div>
  );
}

function SwitchRow({
  checked,
  onChange,
  label,
  icon,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center gap-2.5 text-left disabled:opacity-40"
    >
      {icon}
      <span className="text-ink flex-1 text-[12.5px] font-medium">{label}</span>
      <span
        className={`relative h-[18px] w-8 shrink-0 rounded-full transition ${
          checked ? "bg-tide" : "bg-hairline"
        }`}
      >
        <span
          className={`bg-abyss absolute top-[3px] size-3 rounded-full transition-all ${
            checked ? "left-[17px]" : "left-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
