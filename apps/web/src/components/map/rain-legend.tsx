import { RAIN_BANDS, rainColorsFor } from "@davflood/hazard/rain-grid";
import type { RainGrid } from "@davflood/hazard/rain-grid";

type Props = {
  grid: RainGrid | undefined;
  theme: "dark" | "light";
};

/**
 * The key for the rain layer, on the map rather than in the panel — it is
 * only useful while you are looking at the squares it explains.
 *
 * The disclaimer is the whole point of this component and is not negotiable:
 * a coloured overlay on a flood map will be read as flooding unless it says
 * otherwise, in those words, every time it is on screen.
 */
export function RainLegend({ grid, theme }: Props) {
  const colors = rainColorsFor(theme);
  const dry = !grid || grid.cells.features.length === 0;

  return (
    <div className="border-hairline bg-abyss/85 pointer-events-none w-full rounded-xl border p-3 shadow-lg backdrop-blur">
      <p className="text-ink text-[11px] font-semibold">
        Rain right now — not flooding
      </p>

      {dry ? (
        <p className="text-ink-dim mt-1.5 text-[10.5px] leading-relaxed">
          No rain in the model anywhere over the city.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {RAIN_BANDS.map((band) => (
            <li key={band.id} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: colors[band.id] }}
                aria-hidden="true"
              />
              <span className="text-ink text-[10.5px] font-medium">
                {band.label}
              </span>
              <span className="text-ink-dim text-[10px]" data-numeric>
                {band.min} mm/h
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-ink-dim mt-2 text-[9.5px] leading-relaxed">
        Forecast model, ~8 km squares
        {grid?.time ? ` · for ${grid.time.slice(11)}` : ""}. It shows where rain
        is falling, not where water is standing.
      </p>
    </div>
  );
}
