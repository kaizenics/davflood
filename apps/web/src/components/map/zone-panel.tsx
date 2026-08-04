import { formatDepth } from "@davflood/hazard/schema";
import type { HazardProperties } from "@davflood/hazard/schema";
import { scenarioByYears } from "@davflood/hazard/scenarios";
import { hazardById } from "@davflood/hazard/tiers";
import { ArrowLeft } from "lucide-react";

import { hazardBg, hazardText } from "@/lib/hazard-classes";

type Props = {
  zone: HazardProperties;
  onClose: () => void;
};

/**
 * The tapped zone — the same question the city reading answers, asked of one
 * place instead of the whole city. It takes over that slot rather than sitting
 * below it: this is the answer the user just asked for, and it used to render
 * six sections down, off the bottom of the panel.
 *
 * Order is deliberate: WHERE, HOW DEEP, WHAT IT MEANS, WHAT TO DO.
 *
 * The severity colour is load-bearing here — stripe, figure and label all
 * carry it — because this block is a hazard statement. Everything around it
 * stays on the brand accent for exactly the same reason.
 */
export function ZonePanel({ zone, onClose }: Props) {
  const tier = hazardById[zone.hazard];
  const scenario = scenarioByYears[zone.scenario];

  return (
    <section
      aria-label={`Selected zone in Barangay ${zone.barangay}`}
      className="relative px-5 pt-4 pb-5"
    >
      <span
        className={`${hazardBg[zone.hazard]} absolute top-0 bottom-0 left-0 w-[3px]`}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onClose}
        className="text-ink-dim hover:text-ink -ml-1 flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-medium transition"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to the whole city
      </button>

      <h2 className="text-ink mt-2 text-[15px] leading-snug font-semibold text-balance">
        Brgy. {zone.barangay}
      </h2>

      {/* the number people actually came for */}
      <p
        className={`${hazardText[zone.hazard]} mt-3 text-[30px] leading-none font-semibold tracking-tight`}
        data-numeric
      >
        {formatDepth(zone)}
      </p>
      <p
        className={`${hazardText[zone.hazard]} mt-1.5 text-[12.5px] font-semibold`}
      >
        {tier.summary.replace(/\.$/, "")} · {tier.name}
      </p>

      <p className="text-ink-dim mt-1 text-[11px]">
        In a {scenario.label} storm · {scenario.annualChance} chance in any
        given year
      </p>

      <p className="text-ink-dim mt-3.5 text-[12.5px] leading-relaxed">
        {tier.human}
      </p>

      <div className="border-hairline/60 mt-3.5 border-t pt-3">
        <p className="text-ink text-[12.5px] leading-relaxed">
          <span className="text-ink font-semibold">What to do: </span>
          {tier.action}
        </p>
      </div>
    </section>
  );
}
