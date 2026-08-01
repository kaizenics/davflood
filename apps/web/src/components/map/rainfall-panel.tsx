import { describeWeather, rainBand } from "@naboflood/hazard/rainfall";
import { colors } from "@naboflood/hazard/tokens";
import { ChevronDown, CloudRain } from "lucide-react";
import { useState } from "react";

import { useRainfall } from "@/hooks/use-rainfall";

/**
 * Current conditions + 3-day rainfall.
 *
 * Rendered in the BRAND colour, never the hazard ramp: millimetres of rain
 * are not a flood hazard class, and colouring them the same way would undo
 * the distinction the whole app rests on.
 *
 * Fails silently — if Open-Meteo is unreachable the panel says so and the map
 * carries on.
 */
export function RainfallPanel() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useRainfall();

  const today = data?.days[0];
  const band = today ? rainBand(today.precipitation) : "none";

  return (
    <div className="border-hairline bg-abyss/90 rounded-card overflow-hidden border backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <CloudRain className="text-tide size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-xs font-bold">
            {isLoading
              ? "Checking rain…"
              : isError || !data
                ? "Rain unavailable"
                : describeWeather(data.current.weatherCode)}
          </span>
          <span className="text-ink-dim block truncate text-[10px]">
            {isError || !data
              ? "No connection — the map still works"
              : `${today?.precipitation.toFixed(0) ?? 0} mm expected today`}
          </span>
        </span>
        {!isError && data && band !== "none" && (
          <span
            className="rounded-pill px-2 py-0.5 text-[10px] font-bold"
            style={{ color: colors.tide, backgroundColor: `${colors.tide}22` }}
          >
            {band.toUpperCase()}
          </span>
        )}
        <ChevronDown
          className={`text-ink-dim size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && data && !isError && (
        <div className="border-hairline border-t px-3 py-3">
          <div className="flex justify-between gap-2">
            {data.days.slice(0, 4).map((day, i) => {
              // capped so one huge day doesn't flatten the rest
              const h = Math.max(4, Math.min(44, day.precipitation * 1.6));
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-11 items-end">
                    <div
                      className="w-7 rounded border"
                      style={{
                        height: h,
                        backgroundColor: `${colors.tide}55`,
                        borderColor: colors.tide,
                      }}
                    />
                  </div>
                  <span className="text-ink text-[10px] font-bold" data-numeric>
                    {day.precipitation.toFixed(0)}
                  </span>
                  <span className="text-ink-dim text-[9px]">
                    {i === 0 ? "Today" : weekday(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-ink-dim mt-3 text-[9px] leading-relaxed">
            Forecast from Open-Meteo. Rain is context, not a flood warning —
            follow PAGASA for advisories.
          </p>
        </div>
      )}
    </div>
  );
}

function weekday(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-PH", { weekday: "short" });
}
