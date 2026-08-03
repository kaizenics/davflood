import { describeWeather, rainBand } from "@naboflood/hazard/rainfall";
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
 * Fails silently — if Open-Meteo is unreachable the row says so and the map
 * carries on.
 */
export function RainfallPanel() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useRainfall();

  const today = data?.days[0];
  const band = today ? rainBand(today.precipitation) : "none";
  const unavailable = isError || !data;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        disabled={unavailable}
        className="group flex w-full items-center gap-2.5 text-left disabled:cursor-default"
      >
        <CloudRain
          className={`size-4 shrink-0 ${unavailable ? "text-ink-dim" : "text-tide"}`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-[13px] font-semibold">
            {isLoading
              ? "Checking…"
              : unavailable
                ? "Forecast unavailable"
                : describeWeather(data.current.weatherCode)}
          </span>
          <span className="text-ink-dim block truncate text-[11px]">
            {unavailable
              ? "No connection — the map still works"
              : `${today?.precipitation.toFixed(0) ?? 0} mm expected today`}
          </span>
        </span>
        {!unavailable && band !== "none" && (
          <span
            className="text-tide bg-tide/15 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
          >
            {band.toUpperCase()}
          </span>
        )}
        {!unavailable && (
          <ChevronDown
            className={`text-ink-dim size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>

      {open && data && !unavailable && (
        <>
          <div className="mt-3.5 flex items-end justify-between gap-2">
            {data.days.slice(0, 4).map((day, i) => {
              // capped so one huge day doesn't flatten the rest
              const h = Math.max(3, Math.min(38, day.precipitation * 1.5));
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-ink text-[10px] font-semibold" data-numeric>
                    {day.precipitation.toFixed(0)}
                  </span>
                  <div
                    className={`w-full rounded-[2px] ${i === 0 ? "bg-tide" : "bg-tide/40"}`}
                    style={{ height: h }}
                  />
                  <span className="text-ink-dim text-[10px]">
                    {i === 0 ? "Today" : weekday(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-ink-dim mt-2.5 text-[10px] leading-relaxed">
            Rain is context, not a flood warning — follow PAGASA for advisories.
          </p>
        </>
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
