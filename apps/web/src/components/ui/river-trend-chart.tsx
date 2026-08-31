import { RIVER_NORMAL } from "@davflood/hazard/river";
import type { River } from "@davflood/hazard/river";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Palette } from "@davflood/hazard/tokens";

type Props = {
  river: River;
  palette: Palette;
};

export function RiverTrendChart({ river, palette }: Props) {
  const historyFill = `river-history-${useId().replace(/:/g, "")}`;
  const forecastFill = `river-forecast-${useId().replace(/:/g, "")}`;
  // Old cached responses did not carry todayDate and began with today. The
  // fallback keeps their tooltip and line styles internally consistent until
  // the versioned query replaces them.
  const todayDate = river.todayDate ?? river.days[0]?.date ?? "";
  const matchedTodayIndex = river.days.findIndex((day) => day.date === todayDate);
  const todayIndex = matchedTodayIndex >= 0 ? matchedTodayIndex : 0;
  const points = river.days.map((day, index) => ({
    ...day,
    label: shortDay(day.date),
    history: index <= todayIndex ? day.discharge : null,
    // Include today in both series so the projection starts without a gap.
    forecast: index >= todayIndex ? day.discharge : null,
  }));

  return (
    <div
      className="mt-3 h-36 w-full"
      role="img"
      aria-label={`Davao River flow for the past six days, today at ${river.today.toFixed(0)} cubic metres per second, and the next six forecast days.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 10, right: 3, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id={historyFill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.tide} stopOpacity={0.34} />
              <stop offset="100%" stopColor={palette.tide} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={forecastFill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.inkDim} stopOpacity={0.18} />
              <stop offset="100%" stopColor={palette.inkDim} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={palette.hairline} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: palette.inkDim, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval={1}
            tickMargin={6}
          />
          <YAxis
            tick={{ fill: palette.inkDim, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={42}
            unit=""
            allowDecimals={false}
          />
          <ReferenceLine
            y={RIVER_NORMAL.p90}
            stroke={palette.inkDim}
            strokeDasharray="3 4"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            x={shortDay(todayDate)}
            stroke={palette.tide}
            strokeWidth={1.5}
            label={{ value: "NOW", fill: palette.tide, fontSize: 8, position: "top" }}
          />
          <Tooltip
            cursor={{ stroke: palette.tide, strokeOpacity: 0.45 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof points)[number] | undefined;
              if (!point) return null;
              const isFuture = point.date > todayDate;
              return (
                <div className="border-hairline bg-abyss rounded-lg border px-2.5 py-1.5 shadow-lg">
                  <p className="text-ink-dim text-[10px]">
                    {longDay(point.date)} · {isFuture ? "forecast" : point.date === todayDate ? "today" : "recent"}
                  </p>
                  <p className="text-ink text-[13px] font-semibold" data-numeric>
                    {point.discharge.toFixed(0)} <span className="text-ink-dim font-normal">m³/s</span>
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="history"
            stroke={palette.tide}
            strokeWidth={2.25}
            fill={`url(#${historyFill})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: palette.tide }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke={palette.inkDim}
            strokeWidth={1.75}
            strokeDasharray="4 3"
            fill={`url(#${forecastFill})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: palette.inkDim }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-PH", { weekday: "short" });
}

function longDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}
