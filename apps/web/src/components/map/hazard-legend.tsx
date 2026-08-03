import { attributionFor } from "@naboflood/hazard/copy";
import { hazardTiers } from "@naboflood/hazard/tiers";

import { hazardBg } from "@/lib/hazard-classes";
import type { BasemapKind } from "@naboflood/hazard/style";

type Props = {
  basemap?: BasemapKind;
  /** the overlay is hidden on the map, so say so rather than lying */
  dimmed?: boolean;
};

/**
 * Every swatch carries its label AND its depth band. Colour is never the sole
 * information channel — roughly 8% of men have a colour vision deficiency, and
 * this is safety information, not decoration.
 *
 * No border of its own: it sits inside a divided sidebar section, and wrapping
 * it in another box would just add a frame around a frame.
 */
export function HazardLegend({ basemap = "dark", dimmed = false }: Props) {
  return (
    <>
      <dl
        className={`grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 gap-y-2 transition-opacity ${
          dimmed ? "opacity-40" : ""
        }`}
      >
        {hazardTiers.map((tier) => (
          <div key={tier.id} className="contents">
            <dt className="flex items-baseline gap-2.5">
              <span
                className={`size-2.5 translate-y-px rounded-[2px] ${hazardBg[tier.id]}`}
                aria-hidden="true"
              />
              <span className="text-ink text-[12.5px] font-semibold">
                {tier.label}
              </span>
            </dt>
            <dd className="text-ink-dim text-[12.5px]" data-numeric>
              {tier.depthShort}
            </dd>
            <dd className="text-ink-dim text-right text-[11px]">
              {tier.summary.replace(/\.$/, "")}
            </dd>
          </div>
        ))}
      </dl>

      {dimmed && (
        <p className="text-ink-dim mt-2.5 text-[11px] italic">
          Overlay hidden — the map is showing the basemap only.
        </p>
      )}

      {/* Esri's imagery licence requires its credit whenever the imagery is
          on screen, so this tracks the active basemap. */}
      <p className="text-ink-dim mt-3 text-[10px] leading-relaxed">
        {attributionFor(basemap)}
      </p>
    </>
  );
}
