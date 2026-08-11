import { floodOutlook } from "@davflood/hazard/outlook";
import type { OutlookPlace } from "@davflood/hazard/outlook";
import type { River } from "@davflood/hazard/river";
import { fetchRiver } from "@davflood/hazard/river";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { useQuery } from "@tanstack/react-query";
import { CloudRain } from "lucide-react";

import { useRainfall } from "@/hooks/use-rainfall";
import { gcTime, useMounted } from "@/lib/query";

/**
 * The one line that joins the three things this app already knew separately.
 *
 * Placed at the top of the panel, above the reading, because it is the only
 * thing here that changes hour to hour — everything below it is a model that
 * is the same today as it was last month.
 *
 * Renders NOTHING on a quiet day. That is the design: a banner that appears
 * every single day is a banner nobody sees on the day it matters. It is also
 * why it degrades to nothing rather than to an error — during a storm the
 * network is the first thing to go, and a broken box where the calm sentence
 * used to be would read as alarming all by itself.
 */

const TONE = {
  alert: {
    box: "border-haz-high/50 bg-haz-high/10",
    icon: "text-haz-high",
  },
  watch: {
    box: "border-haz-med/45 bg-haz-med/10",
    icon: "text-haz-med",
  },
  calm: {
    box: "border-hairline bg-raised/40",
    icon: "text-tide",
  },
} as const;

type Props = {
  place: OutlookPlace;
  scenario: ScenarioYears;
};

export function FloodOutlook({ place, scenario }: Props) {
  const { data: rain } = useRainfall();

  /* The same query the river panel runs, so on the map route this is a cache
     hit rather than a second request. GloFAS is a daily model — see
     river-panel.tsx for why polling faster returns the same number. */
  const { data: river } = useQuery<River>({
    enabled: typeof window !== "undefined",
    queryKey: ["river", "davao"],
    queryFn: ({ signal }) => fetchRiver(signal),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: gcTime(24 * 60 * 60 * 1000),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  /* Prerender sees no data and no fetch in flight; the browser starts one
     immediately. Waiting for mount makes both render nothing, and the real
     answer arrives on the render after — see routes/news.tsx. */
  const mounted = useMounted();

  const outlook = mounted ? floodOutlook({ rain, river, place, scenario }) : null;
  if (!outlook) return null;

  const tone = TONE[outlook.tone];

  return (
    <aside
      /* polite, never assertive: this is a forecast joining a model, and
         interrupting a screen reader mid-sentence would overstate it */
      aria-live="polite"
      className={`mx-5 mt-4 rounded-2xl border px-3.5 py-3 ${tone.box}`}
    >
      <p className="flex gap-2.5">
        <CloudRain
          className={`mt-[1px] size-4 shrink-0 ${tone.icon}`}
          aria-hidden="true"
        />
        <span className="text-ink text-[13px] leading-relaxed font-medium text-balance">
          {outlook.sentence}
        </span>
      </p>
      <p className="text-ink-dim mt-1.5 pl-[26px] text-[10.5px] leading-relaxed">
        {outlook.caveat}
      </p>
    </aside>
  );
}
