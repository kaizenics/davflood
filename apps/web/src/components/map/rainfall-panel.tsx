import { describeWeather, rainBand } from "@davflood/hazard/rainfall";
import type { RainfallDay } from "@davflood/hazard/rainfall";
import {
  ChevronDown,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";

import { useRainfall } from "@/hooks/use-rainfall";

/**
 * recharts is ~400 KB and only ever renders inside this dialog. Lazy so the
 * map — the thing people actually came for — is not held up by a chart
 * library nobody has asked to see yet.
 */
const RainfallDayDialog = lazy(() =>
  import("@/components/map/rainfall-day-dialog").then((m) => ({
    default: m.RainfallDayDialog,
  })),
);

/**
 * Current conditions and the 4-day rainfall outlook.
 *
 * Rendered in the BRAND colour, never the hazard ramp: millimetres of rain
 * are not a flood hazard class, and colouring them the same way would undo
 * the distinction the whole app rests on.
 *
 * Fails quietly — if Open-Meteo is unreachable the row says so and the map
 * carries on without it.
 */
export function RainfallPanel() {
  const [open, setOpen] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const { data, isLoading, isError } = useRainfall();

  const unavailable = isError || !data;
  const days = data?.days.slice(0, 4) ?? [];
  const today = days[0];
  const band = today ? rainBand(today.precipitation) : "none";

  // scale bars against the wettest day in view, so heights actually compare
  const peakMm = days.reduce((m, d) => Math.max(m, d.precipitation), 0);
  const peak = days.find((d) => d.precipitation === peakMm && peakMm > 0);
  const totalMm = days.reduce((s, d) => s + d.precipitation, 0);
  const dry = peakMm < 0.5;

  const CurrentIcon = data ? weatherIcon(data.current.weatherCode) : CloudRain;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        disabled={unavailable}
        className="group flex w-full items-center gap-3 text-left disabled:cursor-default"
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            unavailable ? "bg-raised" : "bg-tide/12"
          }`}
        >
          <CurrentIcon
            className={`size-[18px] ${unavailable ? "text-ink-dim" : "text-tide"}`}
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-[13.5px] font-semibold">
            {isLoading
              ? "Checking…"
              : unavailable
                ? "Forecast unavailable"
                : describeWeather(data.current.weatherCode)}
          </span>
          <span className="text-ink-dim block truncate text-[11.5px]">
            {unavailable
              ? "No connection — the map still works"
              : today
                ? `${fmt(today.precipitation)} mm today · ${Math.round(today.probability)}% chance`
                : "—"}
          </span>
        </span>

        {!unavailable && band !== "none" && (
          <span className="text-tide bg-tide/12 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide">
            {band.toUpperCase()}
          </span>
        )}
        {!unavailable && (
          <ChevronDown
            className={`text-ink-dim size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>

      {open && !unavailable && (
        <div className="mt-4">
          {/* A flat row of empty bars communicates nothing. When there is no
              rain coming, say so in words. */}
          {dry ? (
            <p className="border-hairline/60 text-ink-dim rounded-lg border border-dashed px-3 py-2.5 text-[11.5px]">
              No meaningful rain expected over the next four days.
            </p>
          ) : (
            <>
              <div className="text-ink-dim mb-2 flex items-baseline justify-between text-[10px]">
                <span className="font-semibold tracking-[0.1em] uppercase">
                  Next 4 days
                </span>
                <span data-numeric>
                  {fmt(totalMm)} mm total
                  {peak ? ` · wettest ${dayLabel(peak, days)}` : ""}
                </span>
              </div>

              <ol className="flex items-end gap-1.5">
                {days.map((day, i) => {
                  const isPeak = peakMm > 0 && day.precipitation === peakMm;
                  const pct = peakMm > 0 ? day.precipitation / peakMm : 0;
                  const DayIcon = weatherIcon(day.weatherCode);
                  return (
                    <li key={day.date} className="flex-1">
                      <button
                        type="button"
                        onClick={() => setOpenDay(i)}
                        aria-label={`${i === 0 ? "Today" : weekday(day.date)}: ${fmt(day.precipitation)} mm, ${Math.round(day.probability)} percent chance. Open hourly detail.`}
                        className="hover:bg-raised/50 focus-visible:bg-raised/50 flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 transition"
                      >
                      <span
                        className={`text-[10.5px] font-semibold ${isPeak ? "text-tide" : "text-ink"}`}
                        data-numeric
                      >
                        {fmt(day.precipitation)}
                      </span>

                      {/* fixed-height track so bars share a baseline and a
                          scale; without it a 2 mm day and a 40 mm day look
                          identical */}
                      <span className="bg-raised/70 flex h-11 w-full items-end overflow-hidden rounded-[3px]">
                        <span
                          className={`w-full rounded-[3px] transition-[height] ${
                            isPeak ? "bg-tide" : "bg-tide/35"
                          }`}
                          style={{ height: `${Math.max(6, pct * 100)}%` }}
                        />
                      </span>

                      <DayIcon
                        className="text-ink-dim size-3.5"
                        aria-hidden="true"
                      />
                      <span className="text-ink-dim text-[10px] font-medium">
                        {i === 0 ? "Today" : weekday(day.date)}
                      </span>
                      <span
                        className="text-ink-dim flex items-center gap-0.5 text-[9.5px] opacity-80"
                        data-numeric
                      >
                        <Droplets className="size-2.5" aria-hidden="true" />
                        {Math.round(day.probability)}%
                      </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <p className="text-ink-dim mt-2 text-center text-[10px]">
                Select a day for its hour-by-hour forecast
              </p>
            </>
          )}

          <p className="text-ink-dim mt-3 text-[10px] leading-relaxed">
            Rain is context, not a flood warning — follow PAGASA for advisories.
          </p>
        </div>
      )}

      {openDay !== null && days[openDay] && (
        <Suspense fallback={null}>
          <RainfallDayDialog
            day={days[openDay]}
            isToday={openDay === 0}
            onOpenChange={(o) => {
              if (!o) setOpenDay(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

/**
 * One decimal below 10 mm, whole millimetres above.
 *
 * Davao's typical forecast sits in the 0–3 mm range, where rounding to whole
 * numbers collapses 2.1 and 2.2 into the same "2" while the bars beside them
 * clearly differ. Above 10 mm the decimal is noise.
 */
function fmt(mm: number): string {
  if (mm === 0) return "0";
  if (mm < 10) return mm.toFixed(1);
  return Math.round(mm).toString();
}

function weekday(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-PH", { weekday: "short" });
}

function dayLabel(day: RainfallDay, days: RainfallDay[]): string {
  return days.indexOf(day) === 0 ? "today" : weekday(day.date);
}

/** WMO weather interpretation codes — the same bands describeWeather uses. */
function weatherIcon(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67) return CloudRain;
  if (code <= 82) return CloudRain;
  if (code <= 86) return CloudRain;
  return CloudLightning;
}
