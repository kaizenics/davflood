import { mapAttribution } from "@naboflood/hazard/copy";
import { hazardTiers } from "@naboflood/hazard/tiers";

/**
 * Every swatch carries its label AND its depth band. Colour is never the sole
 * information channel — roughly 8% of men have a colour vision deficiency, and
 * this is safety information, not decoration.
 */
export function HazardLegend() {
  return (
    <div className="border-hairline rounded-card border p-3">
      <ul className="flex flex-col gap-2">
        {hazardTiers.map((tier) => (
          <li key={tier.id} className="flex items-baseline gap-2.5">
            <span
              className="size-3 shrink-0 translate-y-0.5 rounded-[3px]"
              style={{ backgroundColor: tier.color }}
              aria-hidden="true"
            />
            <span className="text-ink w-16 shrink-0 text-xs font-bold">
              {tier.label}
            </span>
            <span className="text-ink-dim shrink-0 text-xs" data-numeric>
              {tier.depthShort}
            </span>
            <span className="text-ink-dim ml-auto truncate text-[11px]">
              {tier.summary}
            </span>
          </li>
        ))}
      </ul>
      <p className="border-hairline text-ink-dim mt-3 border-t pt-2.5 text-[10px] leading-relaxed">
        {mapAttribution}
      </p>
    </div>
  );
}
