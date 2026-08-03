import { formatDepth } from "@davflood/hazard/schema";
import type { HazardProperties } from "@davflood/hazard/schema";
import { scenarioByYears } from "@davflood/hazard/scenarios";
import { hazardById } from "@davflood/hazard/tiers";
import { X } from "lucide-react";

import { hazardBorder, hazardText } from "@/lib/hazard-classes";

type Props = {
  zone: HazardProperties | null;
  onClose: () => void;
};

/**
 * The tapped zone — the reason the map exists, so it is the one block in the
 * sidebar allowed to carry weight: a colour rule down the edge and a depth
 * figure large enough to read at a glance.
 *
 * Order is deliberate: WHERE, HOW DEEP, WHAT IT MEANS, WHAT TO DO.
 */
export function ZonePanel({ zone, onClose }: Props) {
  if (!zone) return null;

  const tier = hazardById[zone.hazard];
  const scenario = scenarioByYears[zone.scenario];

  return (
    <section
      aria-label={`Selected zone: Barangay ${zone.barangay}`}
      className={`border-hairline/60 border-b border-l-[3px] px-5 py-4 ${hazardBorder[zone.hazard]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-ink-dim text-[10px] font-semibold tracking-[0.13em] uppercase">
          Selected zone
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Clear selection"
          className="text-ink-dim hover:text-ink -mt-1 -mr-1 rounded p-1 transition"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <p className="text-ink mt-1.5 text-[17px] leading-tight font-semibold">
        Brgy. {zone.barangay}
      </p>

      {/* the number people actually came for */}
      <div className="mt-3 flex items-baseline gap-2.5">
        <span
          className={`text-[26px] leading-none font-semibold tracking-tight ${hazardText[zone.hazard]}`}
          data-numeric
        >
          {formatDepth(zone)}
        </span>
        <span
          className={`text-[11px] font-bold tracking-wide uppercase ${hazardText[zone.hazard]}`}
        >
          {tier.label}
        </span>
      </div>

      <p className="text-ink-dim mt-1.5 text-[11px]">
        {tier.name} · {scenario.label} scenario · {scenario.annualChance} chance
        a year
      </p>

      <p className="text-ink-dim mt-3.5 text-[12.5px] leading-relaxed">
        {tier.human}
      </p>

      <div className="border-hairline/60 mt-3.5 border-t pt-3">
        <p className="text-ink mb-1 text-[10px] font-semibold tracking-[0.13em] uppercase">
          What to do
        </p>
        <p className="text-ink text-[12.5px] leading-relaxed">{tier.action}</p>
      </div>
    </section>
  );
}
