import { soakBand } from "@davflood/hazard/rainfall";
import { fill, type Strings } from "@davflood/hazard/strings";
import {
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
import { useLocale } from "@/lib/locale";

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
 * The 4-day rainfall outlook, and what already fell — the expanded half of
 * the rain tile in the conditions card.
 *
 * Rendered in the BRAND colour, never the hazard ramp: millimetres of rain
 * are not a flood hazard class, and colouring them the same way would undo
 * the distinction the whole app rests on.
 *
 * Only ever opened from a tile that has data — the tile owns the
 * unavailable state.
 */
export function RainDetail() {
  const [openDay, setOpenDay] = useState<number | null>(null);
  const { data } = useRainfall();
  const { strings, meta } = useLocale();
  const { ui } = strings;
  const weekday = (iso: string) => dayName(iso, meta.tag);
  const days = data?.days.slice(0, 4) ?? [];

  const peakMm = days.reduce((m, d) => Math.max(m, d.precipitation), 0);
  const peak = days.find((d) => d.precipitation === peakMm && peakMm > 0);
  const totalMm = days.reduce((s, d) => s + d.precipitation, 0);
  const dry = peakMm < 0.5;

  /* What already fell. Shown above the forecast because it happened first,
     and because it is the half of the picture this panel used to be missing
     entirely — see PAST_DAYS in @davflood/hazard/rainfall. */
  const past = data?.past ?? [];
  const recentMm = data?.recent.mm ?? 0;
  const soak = soakBand(recentMm);

  /**
   * Bars scale against the wettest day in view, but never against less than
   * 5 mm.
   *
   * Purely relative scaling made a 0.2 mm drizzle draw a full-height bar,
   * which is why the chart used to be hidden on dry days rather than lie. The
   * floor lets it stay on screen and still tell the truth: a trivial day now
   * renders as a sliver, and anything above 5 mm behaves as it always did.
   */
  const scaleMm = Math.max(
    peakMm,
    // one scale across past and forecast, so a 70 mm Monday visibly towers
    // over a 20 mm Thursday instead of both drawing a full-height bar in
    // their own separate charts
    past.reduce((m, d) => Math.max(m, d.precipitation), 0),
    5,
  );

  return (
    <div>
          <div>
            {/* The days are always shown, dry or not.
              They used to be replaced by a sentence when nothing much was
              coming, on the grounds that empty bars say nothing. But a
              forecast that disappears reads as a forecast that failed, and
              "0.2 mm on Tuesday" is a real answer to "is it going to rain" —
              it is only the BARS that were uninformative, and the scale floor
              above fixes those. The sentence stays, as a caption. */}
          <>
              {/* What has already fallen.
                  Deliberately NOT interactive and deliberately not in the
                  brand colour: the forecast bars below are tappable and
                  tide-coloured, and past rain must not be mistakable for
                  either the forecast or a hazard reading. It shares their
                  scale, though, which is the entire point — the comparison
                  between what the ground has taken and what is still coming
                  is the thing this panel could not show before. */}
              {past.length > 0 && (
                <div className="border-hairline/60 mb-3 border-b pb-3">
                  <div className="text-ink-dim mb-1.5 flex items-baseline justify-between text-[10px]">
                    <span className="font-semibold tracking-[0.1em] uppercase">
                      {fill(ui.lastDays, { n: past.length })}
                    </span>
                    <span data-numeric>
                      {fill(ui.alreadyFallen, { mm: fmt(recentMm) })}
                    </span>
                  </div>

                  <ol className="flex items-end gap-1.5">
                    {past.map((day) => (
                      <li key={day.date} className="flex-1">
                        <div className="flex w-full flex-col items-center gap-1">
                          <span
                            className="text-ink-dim text-[10px] font-semibold"
                            data-numeric
                          >
                            {fmt(day.precipitation)}
                          </span>
                          <span className="bg-raised/70 flex h-6 w-full items-end overflow-hidden rounded-[3px]">
                            <span
                              className="bg-ink-dim/40 w-full rounded-[3px]"
                              style={{
                                height: `${Math.max(6, (day.precipitation / scaleMm) * 100)}%`,
                              }}
                            />
                          </span>
                          <span className="text-ink-dim text-[10px] font-medium opacity-80">
                            {weekday(day.date)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* Only when it is worth a sentence. On a dry week the
                      numbers above already say everything, and a line that
                      appears every day is a line nobody reads on the day it
                      matters. */}
                  {(soak === "wet" || soak === "saturated") && (
                    <p className="text-ink-dim mt-2 text-[10px] leading-relaxed">
                      {ui.soakNote}
                    </p>
                  )}
                </div>
              )}

              <div className="text-ink-dim mb-2 flex items-baseline justify-between text-[10px]">
                <span className="font-semibold tracking-[0.1em] uppercase">
                  {ui.next4Days}
                </span>
                <span data-numeric>
                  {fill(ui.mmTotal, { mm: fmt(totalMm) })}
                  {peak && !dry
                    ? ` · ${fill(ui.wettest, { day: days.indexOf(peak) === 0 ? ui.todayLower : weekday(peak.date) })}`
                    : ""}
                </span>
              </div>

              <ol className="flex items-end gap-1.5">
                {days.map((day, i) => {
                  // nothing is "the wettest day" when the week is dry
                  const isPeak =
                    !dry && peakMm > 0 && day.precipitation === peakMm;
                  const pct = day.precipitation / scaleMm;
                  const DayIcon = weatherIcon(day.weatherCode);
                  return (
                    <li key={day.date} className="flex-1">
                      <button
                        type="button"
                        onClick={() => setOpenDay(i)}
                        aria-label={fill(ui.dayAria, {
                          day: i === 0 ? ui.today : weekday(day.date),
                          mm: fmt(day.precipitation),
                          p: Math.round(day.probability),
                        })}
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
                        {i === 0 ? ui.today : weekday(day.date)}
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
                {dry ? ui.dryHint : ui.selectDay}
              </p>
            </>

            <p className="text-ink-dim mt-3 text-[10px] leading-relaxed">
              {ui.rainContext}
            </p>
          </div>

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
export function fmt(mm: number): string {
  if (mm === 0) return "0";
  if (mm < 10) return mm.toFixed(1);
  return Math.round(mm).toString();
}

function dayName(iso: string, tag: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(tag, { weekday: "short" });
}


/** The same WMO bands as describeWeather, in the reader's language. */
export function weatherLabel(code: number, ui: Strings["ui"]): string {
  if (code === 0) return ui.weatherClear;
  if (code <= 3) return ui.weatherPartlyCloudy;
  if (code <= 48) return ui.weatherFog;
  if (code <= 57) return ui.weatherDrizzle;
  if (code <= 67) return ui.weatherRain;
  if (code <= 77) return ui.weatherShowers;
  if (code <= 82) return ui.weatherHeavyShowers;
  if (code <= 86) return ui.weatherSqualls;
  return ui.weatherThunderstorm;
}

/** WMO weather interpretation codes — the same bands describeWeather uses. */
export function weatherIcon(code: number): LucideIcon {
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
