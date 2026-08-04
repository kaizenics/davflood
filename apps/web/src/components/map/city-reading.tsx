import { footprintOf, formatArea } from "@davflood/hazard/footprint";
import type { HazardCollection } from "@davflood/hazard/schema";
import type { Scenario } from "@davflood/hazard/scenarios";
import { hazardTiers } from "@davflood/hazard/tiers";
import { useMemo } from "react";

import { hazardBg } from "@/lib/hazard-classes";

type Props = {
  data: HazardCollection;
  scenario: Scenario;
  /** the overlay is switched off on the map, so this is describing something invisible */
  dimmed?: boolean;
};

/**
 * The city-scale reading: how much of Davao floods under the chosen scenario,
 * and how that footprint splits across the three depth bands.
 *
 * This is the legend and the summary in one block, deliberately. They were two
 * sections saying half a thing each — the swatch table explained what the
 * colours meant but not how much of the city wore them, and the scenario blurb
 * described "a bigger footprint" without ever showing one. Together they turn
 * the 5/25/100 switch from a setting into a visible consequence.
 *
 * Colour is never the only channel: every row carries its depth band and its
 * share as text.
 */
export function CityReading({ data, scenario, dimmed = false }: Props) {
  // ~10k polygons at the 100-year return period; a shoelace pass over them is
  // sub-frame, but it has no business re-running on an unrelated render
  const fp = useMemo(() => footprintOf(data), [data]);
  const ready = fp.zones > 0;

  return (
    <section
      aria-label="Flooded area in this scenario"
      className={`px-5 pt-4 pb-5 transition-opacity ${dimmed ? "opacity-45" : ""}`}
    >
      <p className="text-ink text-[15px] leading-snug font-semibold text-balance">
        {ready ? (
          <>
            About{" "}
            <span data-numeric className="text-tide">
              {formatArea(fp.totalKm2)} km²
            </span>{" "}
            of Davao City floods in a {scenario.label} storm.
          </>
        ) : (
          <>Measuring the {scenario.label} footprint…</>
        )}
      </p>
      <p className="text-ink-dim mt-1 text-[12.5px]">
        {scenario.annualChance} chance in any given year.
      </p>

      {/* One bar, three segments, drawn to scale. The 5 -> 100-year switch
          visibly grows the deep-water share, which no wording achieved. */}
      <div
        className="bg-raised mt-3.5 flex h-2 w-full overflow-hidden rounded-full"
        aria-hidden="true"
      >
        {ready &&
          hazardTiers.map((tier) => (
            <span
              key={tier.id}
              className={`${hazardBg[tier.id]} motion-safe:transition-[width] motion-safe:duration-500`}
              style={{ width: `${fp.share[tier.id] * 100}%` }}
            />
          ))}
      </div>

      <dl className="mt-3.5 space-y-2">
        {hazardTiers.map((tier) => (
          <div key={tier.id} className="flex items-baseline gap-2.5">
            <span
              className={`${hazardBg[tier.id]} size-2 shrink-0 translate-y-[-1px] rounded-[2px]`}
              aria-hidden="true"
            />
            <dt className="text-ink min-w-0 flex-1 text-[12.5px] font-medium">
              {tier.summary.replace(/\.$/, "")}
              <span className="text-ink-dim ml-1.5 text-[11px]" data-numeric>
                {tier.depthShort}
              </span>
            </dt>
            <dd
              className="text-ink-dim shrink-0 text-[11px] tracking-tight"
              data-numeric
            >
              {ready ? (
                <>
                  {formatArea(fp.km2[tier.id])} km²
                  <span className="text-ink ml-1.5 font-semibold">
                    {Math.round(fp.share[tier.id] * 100)}%
                  </span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
        ))}
      </dl>

      {dimmed && (
        <p className="text-ink-dim mt-3 text-[11px]">
          The overlay is switched off — the map is showing the basemap only.
        </p>
      )}
    </section>
  );
}
