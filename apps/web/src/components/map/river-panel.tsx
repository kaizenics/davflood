import { RIVER_NORMAL } from "@davflood/hazard/river";
import type { River } from "@davflood/hazard/river";
import { colorsFor } from "@davflood/hazard/tokens";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { gcTime } from "@/lib/query";

import { fetchRiver } from "@davflood/hazard/river";
import { RiverChannel } from "@/components/ui/river-channel";
import { RiverTrendChart } from "@/components/ui/river-trend-chart";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { fill, type Strings } from "@davflood/hazard/strings";

/**
 * The river, forecast from rainfall over the whole catchment.
 *
 * This is the one signal in the app that can see water the sky above you
 * cannot: rain that fell upstream hours ago and is still on its way down. It
 * is also the easiest to over-read, so the wording does the same job the rain
 * legend does — says what it is, and says what it is not.
 *
 * Brand colour, never the hazard ramp. A river running high is not a depth
 * band, and the moment those two share a palette the map starts making claims
 * neither of them supports.
 */
export function useRiver() {
  return useQuery<River>({
    // client-only, like every fetch here — see use-news-pins.ts
    enabled: typeof window !== "undefined",
    // v2 adds six historical days and an explicit todayDate. Keeping it
    // separate prevents an older in-memory forecast-only response from being
    // rendered with the history-aware chart.
    queryKey: ["river", "davao", "history-v2"],
    queryFn: ({ signal }) => fetchRiver(signal),
    // GloFAS is a daily model; polling faster returns the same number
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: gcTime(24 * 60 * 60 * 1000),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** Low and normal are the quiet days; anything above is worth the accent. */
export function riverIsNotable(river: River): boolean {
  return river.level.id !== "low" && river.level.id !== "normal";
}

const LEVEL_KEYS = {
  low: ["riverLowLabel", "riverLowBlurb"],
  normal: ["riverNormalLabel", "riverNormalBlurb"],
  elevated: ["riverElevatedLabel", "riverElevatedBlurb"],
  high: ["riverHighLabel", "riverHighBlurb"],
  "very-high": ["riverVeryHighLabel", "riverVeryHighBlurb"],
} as const satisfies Record<River["level"]["id"], readonly [keyof Strings["ui"], keyof Strings["ui"]]>;

/** The level's name and meaning in the reader's language. */
export function riverLevelText(river: River, ui: Strings["ui"]) {
  const [label, blurb] = LEVEL_KEYS[river.level.id];
  return { label: ui[label], blurb: ui[blurb] };
}

/** The expanded half of the river tile: what it means, and the two-week trend. */
export function RiverDetail({ river }: { river: River }) {
  const { theme } = useTheme();
  const palette = colorsFor(theme);
  const [view, setView] = useState<"chart" | "channel">("chart");
  const { strings, meta } = useLocale();
  const { ui } = strings;

  return (
    <div>
      <p className="text-ink text-[12.5px] leading-relaxed">
        {riverLevelText(river, ui).blurb}
        {river.peak
          ? ` ${fill(ui.riverPeak, { q: river.peak.discharge.toFixed(0), day: weekday(river.peak.date, meta.tag) })}`
          : ""}
      </p>

      <section aria-labelledby="river-trend-heading">
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <h3 id="river-trend-heading" className="text-ink text-[11.5px] font-semibold">
            {view === "chart" ? ui.trendTitle : ui.channelTitle}
          </h3>
          <div role="radiogroup" aria-label={ui.riverView} className="bg-raised/60 border-hairline/60 flex gap-0.5 rounded-lg border p-0.5">
            {(["chart", "channel"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition ${
                  view === v ? "bg-deep text-ink shadow-sm" : "text-ink-dim hover:text-ink"
                }`}
              >
                {v === "chart" ? ui.viewChart : ui.viewRiver}
              </button>
            ))}
          </div>
        </div>
        {view === "chart" ? (
          <>
            <div className="text-ink-dim mt-2 flex items-center justify-end gap-2.5 text-[10px]">
              <span className="flex items-center gap-1"><i className="bg-tide block h-0.5 w-3" />{ui.recent}</span>
              <span className="flex items-center gap-1"><i className="border-ink-dim block w-3 border-t border-dashed" />{ui.forecast}</span>
            </div>
            <RiverTrendChart river={river} palette={palette} />
          </>
        ) : (
          <RiverChannel river={river} />
        )}
      </section>

      <p className="text-ink-dim mt-1 text-[10.5px] leading-relaxed">
        {fill(ui.riverNote, {
          p90: RIVER_NORMAL.p90.toFixed(0),
          from: RIVER_NORMAL.from,
          to: RIVER_NORMAL.to,
        })}
      </p>
    </div>
  );
}

function weekday(iso: string, tag: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(tag, { weekday: "long" });
}
