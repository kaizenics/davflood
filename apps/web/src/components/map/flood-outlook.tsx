import { floodOutlook } from "@davflood/hazard/outlook";
import type { OutlookPlace } from "@davflood/hazard/outlook";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { CloudRain } from "lucide-react";

import { DraftNotice } from "@/components/locale-controls";

import { useRainfall } from "@/hooks/use-rainfall";
import { useLocale } from "@/lib/locale";
import { useMounted } from "@/lib/query";
import { useRiver } from "@/components/map/river-panel";

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
    bar: "bg-haz-high",
    wash: "from-haz-high/14",
    icon: "text-haz-high bg-haz-high/14",
  },
  watch: {
    bar: "bg-haz-med",
    wash: "from-haz-med/12",
    icon: "text-haz-med bg-haz-med/14",
  },
  calm: {
    bar: "bg-tide",
    wash: "from-tide/10",
    icon: "text-tide bg-tide/12",
  },
} as const;

type Props = {
  place: OutlookPlace;
  scenario: ScenarioYears;
};

export function FloodOutlook({ place, scenario }: Props) {
  const { locale, isDraft } = useLocale();
  const { data: rain } = useRainfall();

  const { data: river } = useRiver();

  /* Prerender sees no data and no fetch in flight; the browser starts one
     immediately. Waiting for mount makes both render nothing, and the real
     answer arrives on the render after — see routes/news.tsx. */
  const mounted = useMounted();

  const outlook = mounted
    ? floodOutlook({ rain, river, place, scenario, locale })
    : null;
  if (!outlook) return null;

  const tone = TONE[outlook.tone];

  return (
    <aside
      /* polite, never assertive: this is a forecast joining a model, and
         interrupting a screen reader mid-sentence would overstate it */
      aria-live="polite"
      className={`border-hairline/60 relative overflow-hidden border-b bg-gradient-to-r to-transparent py-3.5 pr-4 pl-5 ${tone.wash}`}
    >
      {/* the tone as an edge rather than a box: it colours the warning without
          turning the whole card into one */}
      <span className={`absolute inset-y-0 left-0 w-[3px] ${tone.bar}`} aria-hidden="true" />
      <p className="flex gap-3">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
        >
          <CloudRain className="size-4" aria-hidden="true" />
        </span>
        <span className="text-ink text-[13px] leading-snug font-medium text-pretty">
          {outlook.sentence}
        </span>
      </p>
      <p className="text-ink-dim mt-2 pl-10 text-[10.5px] leading-relaxed">
        {outlook.caveat}
      </p>
      {/* The compact badge, not the full notice: a paragraph about
          translation quality would be longer than the warning it sits under. */}
      {isDraft && (
        <div className="pl-10">
          <DraftNotice compact />
        </div>
      )}
    </aside>
  );
}
