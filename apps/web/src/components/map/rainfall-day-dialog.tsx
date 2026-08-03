import { describeWeather, rainBand, summariseDay } from "@naboflood/hazard/rainfall";
import type { RainfallDay } from "@naboflood/hazard/rainfall";
import { colorsFor } from "@naboflood/hazard/tokens";
import type { Palette } from "@naboflood/hazard/tokens";
import { CloudRain, Droplets, Timer, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RainAreaChart, formatHour } from "@/components/ui/rain-area-chart";
import { useTheme } from "@/lib/theme";

type Props = {
  day: RainfallDay | null;
  isToday: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The full hourly picture for one day.
 *
 * Two charts, not one with two axes: millimetres and percent are different
 * scales, and letting them share a plot invites reading a correlation out of
 * whatever the scaling happens to make cross.
 */
export function RainfallDayDialog({ day, isToday, onOpenChange }: Props) {
  const { theme } = useTheme();
  const c = colorsFor(theme);

  return (
    <Dialog open={day !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {day && <DayDetail day={day} isToday={isToday} palette={c} />}
      </DialogContent>
    </Dialog>
  );
}

function DayDetail({
  day,
  isToday,
  palette,
}: {
  day: RainfallDay;
  isToday: boolean;
  palette: Palette;
}) {
  const { total, peak, maxChance, wetHours, windowStart, windowTotal } =
    summariseDay(day);
  const band = rainBand(total);
  const hasHours = day.hours.length > 0;

  const rainSeries = day.hours.map((h) => ({
    hour: h.hour,
    label: formatHour(h.hour),
    value: h.precipitation,
  }));
  const chanceSeries = day.hours.map((h) => ({
    hour: h.hour,
    label: formatHour(h.hour),
    value: h.probability,
  }));

  const dateLabel = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="p-5 sm:p-6">
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <span className="bg-tide/12 flex size-9 shrink-0 items-center justify-center rounded-full">
            <CloudRain className="text-tide size-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <DialogTitle>{isToday ? "Today" : dateLabel.split(",")[0]}</DialogTitle>
            <DialogDescription>
              {dateLabel} · {describeWeather(day.weatherCode)}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* the headline number — a stat, not a chart */}
      <div className="mt-5 flex items-end gap-3">
        {/* proportional figures: equal-width digits make a display number
            look loose at this size */}
        <span className="text-ink text-[2.75rem] leading-none font-semibold tracking-tight">
          {total < 10 ? total.toFixed(1) : Math.round(total)}
        </span>
        <span className="text-ink-dim pb-1 text-sm">mm expected</span>
        {band !== "none" && (
          <span className="text-tide bg-tide/12 mb-1.5 ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide">
            {band.toUpperCase()}
          </span>
        )}
      </div>

      <dl className="border-hairline/60 mt-5 grid grid-cols-3 gap-px overflow-hidden border-y">
        <Stat
          icon={<TrendingUp className="size-3.5" aria-hidden="true" />}
          label="Peak hour"
          value={peak && peak.precipitation > 0 ? formatHour(peak.hour) : "—"}
          sub={
            peak && peak.precipitation > 0
              ? `${peak.precipitation.toFixed(1)} mm`
              : "no rain"
          }
        />
        <Stat
          icon={<Droplets className="size-3.5" aria-hidden="true" />}
          label="Highest chance"
          value={`${Math.round(maxChance)}%`}
          sub="in any hour"
        />
        <Stat
          icon={<Timer className="size-3.5" aria-hidden="true" />}
          label="Wet hours"
          value={`${wetHours}`}
          sub="of 24"
        />
      </dl>

      {hasHours ? (
        <>
          <ChartBlock
            title="Rainfall by hour"
            note={
              windowStart && windowTotal > 0.3
                ? `Heaviest 3 hours from ${formatHour(windowStart.hour)} — ${windowTotal.toFixed(1)} mm`
                : undefined
            }
          >
            <RainAreaChart
              data={rainSeries}
              color={palette.tide}
              gridColor={palette.hairline}
              axisColor={palette.inkDim}
              unit="mm"
              highlightHour={peak && peak.precipitation > 0 ? peak.hour : null}
              ariaLabel={`Hourly rainfall for ${dateLabel}. Total ${total.toFixed(1)} millimetres.`}
            />
          </ChartBlock>

          <ChartBlock title="Chance of rain by hour">
            <RainAreaChart
              data={chanceSeries}
              color={palette.inkDim}
              gridColor={palette.hairline}
              axisColor={palette.inkDim}
              unit="%"
              max={100}
              ariaLabel={`Hourly chance of rain for ${dateLabel}. Highest ${Math.round(maxChance)} percent.`}
            />
          </ChartBlock>

          {/* the chart is not the only way to read this */}
          <details className="group mt-5">
            <summary className="text-ink-dim hover:text-ink cursor-pointer text-[11.5px] font-medium">
              View as a table
            </summary>
            <div className="border-hairline/60 mt-2 max-h-48 overflow-y-auto rounded-lg border">
              <table className="w-full text-left text-[11.5px]">
                <thead className="bg-raised/60 text-ink-dim sticky top-0">
                  <tr>
                    <th scope="col" className="px-3 py-1.5 font-medium">Hour</th>
                    <th scope="col" className="px-3 py-1.5 font-medium">Rain</th>
                    <th scope="col" className="px-3 py-1.5 font-medium">Chance</th>
                  </tr>
                </thead>
                <tbody>
                  {day.hours.map((h) => (
                    <tr key={h.time} className="border-hairline/40 border-t">
                      <td className="text-ink-dim px-3 py-1" data-numeric>
                        {formatHour(h.hour)}
                      </td>
                      <td className="text-ink px-3 py-1" data-numeric>
                        {h.precipitation.toFixed(1)} mm
                      </td>
                      <td className="text-ink-dim px-3 py-1" data-numeric>
                        {Math.round(h.probability)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="text-ink-dim mt-5 text-[13px]">
          Hourly detail isn&apos;t available for this day.
        </p>
      )}

      <p className="border-hairline/60 text-ink-dim mt-5 border-t pt-4 text-[11px] leading-relaxed">
        Forecast from Open-Meteo. Rain is context, not a flood warning — heavy
        rain does not always flood, and flooding can happen without it. Follow
        PAGASA and your barangay DRRM office for advisories.
      </p>
    </div>
  );
}

function ChartBlock({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-ink text-[12.5px] font-semibold">{title}</h3>
        {note && <p className="text-ink-dim text-[10.5px]">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="py-3">
      <dt className="text-ink-dim flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase">
        {icon}
        {label}
      </dt>
      <dd className="text-ink mt-1.5 text-[17px] font-semibold">{value}</dd>
      <dd className="text-ink-dim text-[10.5px]">{sub}</dd>
    </div>
  );
}
