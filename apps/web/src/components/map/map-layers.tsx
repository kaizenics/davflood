import { Eye, EyeOff, Layers, Satellite } from "lucide-react";

type Props = {
  /** "map" follows the theme; "satellite" overrides it */
  basemap: "map" | "satellite";
  onBasemapChange: (b: "map" | "satellite") => void;
  showHazard: boolean;
  onShowHazardChange: (v: boolean) => void;
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
}: Props) {
  return (
    <>
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
      <button
        type="button"
        role="switch"
        aria-checked={showHazard}
        onClick={() => onShowHazardChange(!showHazard)}
        className="group mt-2.5 flex w-full items-center gap-2.5 text-left"
      >
        {showHazard ? (
          <Eye className="text-tide size-4 shrink-0" aria-hidden="true" />
        ) : (
          <EyeOff className="text-ink-dim size-4 shrink-0" aria-hidden="true" />
        )}
        <span className="text-ink flex-1 text-[12.5px] font-medium">
          Flood hazard overlay
        </span>
        <span
          className={`relative h-[18px] w-8 shrink-0 rounded-full transition ${
            showHazard ? "bg-tide" : "bg-hairline"
          }`}
        >
          <span
            className={`bg-abyss absolute top-[3px] size-3 rounded-full transition-all ${
              showHazard ? "left-[17px]" : "left-[3px]"
            }`}
          />
        </span>
      </button>
    </>
  );
}
