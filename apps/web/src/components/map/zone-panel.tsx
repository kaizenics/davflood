import { formatDepth } from "@naboflood/hazard/schema";
import type { HazardProperties } from "@naboflood/hazard/schema";
import { scenarioByYears } from "@naboflood/hazard/scenarios";
import { hazardById } from "@naboflood/hazard/tiers";
import { ShieldAlert, X } from "lucide-react";

type Props = {
  zone: HazardProperties | null;
  onClose: () => void;
};

/**
 * The tap-a-zone card.
 *
 * Order is deliberate: WHERE, then HOW DEEP, then WHAT THAT MEANS, then WHAT
 * TO DO. Someone reading this in a hurry should reach the actionable part
 * without scrolling.
 */
export function ZonePanel({ zone, onClose }: Props) {
  if (!zone) return null;

  const tier = hazardById[zone.hazard];
  const scenario = scenarioByYears[zone.scenario];

  return (
    <aside
      aria-label={`Selected zone: Barangay ${zone.barangay}`}
      className="border-hairline bg-abyss/95 rounded-card pointer-events-auto w-full overflow-hidden border backdrop-blur sm:w-80"
    >
      <div className="h-1 w-full" style={{ backgroundColor: tier.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-ink-dim text-[10px] font-bold tracking-widest uppercase">
              Selected zone
            </p>
            <h2 className="text-ink mt-0.5 text-lg font-bold">
              Brgy. {zone.barangay}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close zone details"
            className="text-ink-dim hover:text-ink -mt-1 -mr-1 rounded-lg p-1.5 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span
            className="rounded-pill inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-bold"
            style={{
              color: tier.color,
              borderColor: `${tier.color}88`,
              backgroundColor: `${tier.color}1f`,
            }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: tier.color }}
              aria-hidden="true"
            />
            {tier.label.toUpperCase()}
          </span>
          <span className="text-ink text-sm font-bold" data-numeric>
            {formatDepth(zone)}
          </span>
        </div>

        <p className="text-ink-dim mt-1.5 text-[11px]">
          {tier.name} · {scenario.label} scenario
        </p>

        <p className="text-ink-dim mt-3 text-[13px] leading-relaxed">
          {tier.human}
        </p>

        <div className="border-hairline bg-raised/50 rounded-card mt-4 border p-3">
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase">
            <ShieldAlert className="size-3.5" style={{ color: tier.color }} />
            <span className="text-ink">What to do</span>
          </p>
          <p className="text-ink-dim text-[13px] leading-relaxed">{tier.action}</p>
        </div>

        <p className="text-ink-dim mt-3 text-[10px] leading-relaxed">
          Modelled hazard for a {scenario.label} storm — roughly a{" "}
          {scenario.annualChance} chance in any given year. Not a reading of
          water on the ground right now.
        </p>
      </div>
    </aside>
  );
}
