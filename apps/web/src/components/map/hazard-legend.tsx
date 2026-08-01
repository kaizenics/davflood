import { mapAttribution } from "@naboflood/hazard/copy";
import { hazardTiers } from "@naboflood/hazard/tiers";

/**
 * Every swatch carries its label AND its depth band. Colour is never the sole
 * information channel — roughly 8% of men have a colour vision deficiency, and
 * this is safety information, not decoration.
 */
export function HazardLegend() {
  return (
    <div className="border-hairline bg-abyss/90 rounded-card border p-3 backdrop-blur">
      <p className="text-ink-dim mb-2 text-[10px] font-bold tracking-widest uppercase">
        Hazard level
      </p>
      <ul className="flex flex-col gap-1.5">
        {hazardTiers.map((tier) => (
          <li key={tier.id} className="flex items-center gap-2">
            <span
              className="size-3 rounded-[3px]"
              style={{ backgroundColor: tier.color }}
              aria-hidden="true"
            />
            <span className="text-ink text-xs font-bold">{tier.label}</span>
            <span className="text-ink-dim text-xs" data-numeric>
              {tier.depthShort}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-ink-dim mt-2.5 max-w-[15rem] text-[9px] leading-relaxed">
        {mapAttribution}
      </p>
    </div>
  );
}
