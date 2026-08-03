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

export type RainPoint = {
  hour: number;
  label: string;
  value: number;
};

type Props = {
  data: RainPoint[];
  /** the mark colour — a CSS colour, resolved by the caller from the theme */
  color: string;
  gridColor: string;
  axisColor: string;
  unit: string;
  /** fixed domain for percentages; omit to fit the data */
  max?: number;
  /** drawn as a dashed rule, e.g. the day's peak hour */
  highlightHour?: number | null;
  ariaLabel: string;
};

/**
 * One measure, one chart, one axis.
 *
 * Rainfall (mm) and chance of rain (%) are different scales, so they get
 * separate stacked charts rather than a second y-axis. A dual-axis chart lets
 * the reader infer a correlation from whatever the two scalings happen to make
 * cross, which is exactly the wrong instinct to encourage on a flood app.
 *
 * A single series carries no legend — the heading above names it. Colour is
 * passed in rather than read from a token here so the same component serves
 * the brand accent (rainfall) and neutral ink (probability), and so it follows
 * the light/dark theme without duplicating the palette.
 */
export function RainAreaChart({
  data,
  color,
  gridColor,
  axisColor,
  unit,
  max,
  highlightHour,
  ariaLabel,
}: Props) {
  // unique per instance so two charts on screen cannot share a gradient id
  const gradientId = `rain-fill-${useId().replace(/:/g, "")}`;

  return (
    <div
      className="h-32 w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 6, right: 4, bottom: 0, left: -22 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.42} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* solid hairline, one shade off the surface — dashing reads as a
              threshold or a projection when it is only a grid */}
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: axisColor, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={5}
            tickMargin={6}
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={max ? [0, max] : [0, "auto"]}
            allowDecimals={false}
          />

          {highlightHour != null && (
            <ReferenceLine
              x={formatHour(highlightHour)}
              stroke={color}
              strokeDasharray="4 3"
              strokeOpacity={0.55}
            />
          )}

          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.5 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0]?.value;
              return (
                <div className="border-hairline bg-abyss rounded-lg border px-2.5 py-1.5 shadow-lg">
                  <p className="text-ink-dim text-[10px]">{String(label)}</p>
                  <p className="text-ink text-[13px] font-semibold" data-numeric>
                    {typeof v === "number" ? v.toFixed(unit === "%" ? 0 : 1) : "—"}
                    <span className="text-ink-dim ml-0.5 font-normal">{unit}</span>
                  </p>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}
