import { RIVER_NORMAL } from "@davflood/hazard/river";
import type { River } from "@davflood/hazard/river";
import { fill } from "@davflood/hazard/strings";
import { useId, useState } from "react";

import { useLocale } from "@/lib/locale";

/**
 * The river as a cross-section: a channel, filled to the day's flow.
 *
 * The chart answers "which way is it going"; this answers "how full is it",
 * which is the question people actually ask of a river. The channel's brim is
 * the highest flow of the 2021–2025 record, so a full channel means "as high
 * as it has been in five years" — never "overflowing", which a discharge model
 * cannot say.
 *
 * Height is not linear in discharge: a river widens as it rises, so each extra
 * m³/s lifts it less. shortcut: a 0.6 power stands in for the real rating
 * curve at this gauge; replace it if one is ever published.
 */
const TOP = 14;
const BED = 112;
const lift = (q: number) =>
  Math.min(1, Math.max(0, q / RIVER_NORMAL.max)) ** 0.6;
const surfaceY = (q: number) => BED - lift(q) * (BED - TOP);

// trapezoid banks: brim 24–296, bed 96–224
const bankX = (y: number, side: "l" | "r") => {
  const t = (y - TOP) / (BED - TOP);
  return side === "l" ? 24 + t * 72 : 296 - t * 72;
};

const MARKS = [
  { q: RIVER_NORMAL.p50, key: "channelUsual" },
  { q: RIVER_NORMAL.p90, key: "channelElevated" },
] as const;

export function RiverChannel({ river }: { river: River }) {
  const clip = `river-channel-${useId().replace(/:/g, "")}`;
  const todayIndex = Math.max(
    0,
    river.days.findIndex((d) => d.date === river.todayDate),
  );
  const [index, setIndex] = useState(todayIndex);
  const { strings, meta } = useLocale();
  const { ui } = strings;
  const day = river.days[index] ?? river.days[todayIndex];
  if (!day) return null;

  const y = surfaceY(day.discharge);
  const when =
    day.date === river.todayDate
      ? ui.today
      : day.date > river.todayDate
        ? `${longDay(day.date, meta.tag)} · ${ui.forecastLower}`
        : longDay(day.date, meta.tag);

  return (
    <div className="mt-3">
      <div
        role="img"
        aria-label={fill(ui.channelAria, {
          when,
          q: day.discharge.toFixed(0),
          pct: Math.round(lift(day.discharge) * 100),
        })}
        className="relative"
      >
        <svg viewBox="0 0 320 124" className="h-auto w-full" aria-hidden="true">
          <clipPath id={clip}>
            <polygon points={`24,${TOP} 296,${TOP} 224,${BED} 96,${BED}`} />
          </clipPath>

          {/* ground either side, and the channel cut into it */}
          <path
            d={`M0,${TOP} L24,${TOP} L96,${BED} L224,${BED} L296,${TOP} L320,${TOP} L320,124 L0,124 Z`}
            className="fill-raised"
          />

          {/* the water — one tall rect slid down, so the move is a transform
              and animates on the GPU rather than re-laying the path */}
          <g clipPath={`url(#${clip})`}>
            <rect
              x="0"
              y="0"
              width="320"
              height="124"
              className="fill-tide/30 motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out"
              style={{ transform: `translateY(${y}px)` }}
            />
            <rect
              x="0"
              y="0"
              width="320"
              height="2"
              className="fill-tide motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out"
              style={{ transform: `translateY(${y - 1}px)` }}
            />
          </g>

          {MARKS.map((m) => {
            const my = surfaceY(m.q);
            return (
              <g key={m.key}>
                <line
                  x1={bankX(my, "l")}
                  x2={bankX(my, "r")}
                  y1={my}
                  y2={my}
                  className="stroke-ink-dim"
                  strokeOpacity={0.55}
                  strokeDasharray="3 4"
                />
                <text
                  x={bankX(my, "r") + 6}
                  y={my + 3}
                  className="fill-ink-dim"
                  fontSize="9"
                >
                  {ui[m.key]}
                </text>
              </g>
            );
          })}

          <text x="300" y={TOP - 4} textAnchor="end" className="fill-ink-dim" fontSize="9">
            {ui.channelHigh}
          </text>
          <line x1="24" x2="296" y1={TOP} y2={TOP} className="stroke-hairline" />
        </svg>

        <div className="pointer-events-none absolute top-[38%] left-1/2 -translate-x-1/2 text-center" data-numeric>
          <span className="text-ink block text-[22px] leading-none font-semibold tracking-[-0.03em]">
            {day.discharge.toFixed(0)}
            <span className="text-ink-dim ml-0.5 text-[10.5px] font-medium tracking-normal">m³/s</span>
          </span>
          <span className="text-ink-dim mt-1 block text-[10.5px]">{when}</span>
        </div>
      </div>

      <label className="mt-2 block">
        <span className="sr-only">{ui.day}</span>
        <input
          type="range"
          min={0}
          max={river.days.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-valuetext={`${when}, ${day.discharge.toFixed(0)} m³/s`}
          className="accent-tide w-full"
        />
      </label>
      <div className="text-ink-dim flex justify-between text-[10px]">
        <span>{shortDay(river.days[0]!.date, meta.tag)}</span>
        <button
          type="button"
          onClick={() => setIndex(todayIndex)}
          className="hover:text-tide font-semibold transition"
        >
          {ui.today}
        </button>
        <span>{shortDay(river.days.at(-1)!.date, meta.tag)}</span>
      </div>
    </div>
  );
}

function shortDay(iso: string, tag: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(tag, { weekday: "short" });
}

function longDay(iso: string, tag: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(tag, { weekday: "short", month: "short", day: "numeric" });
}
