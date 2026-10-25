import { formatArea } from "@davflood/hazard/footprint";
import type { Footprint } from "@davflood/hazard/footprint";
import type { Scenario } from "@davflood/hazard/scenarios";
import { hazardTiers } from "@davflood/hazard/tiers";

import { hazardBg } from "@/lib/hazard-classes";

type Props = {
  /** measured once by the route — the collapsed mobile sheet reports it too */
  footprint: Footprint;
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
export function CityReading({ footprint: fp, scenario, dimmed = false }: Props) {
  const ready = fp.zones > 0;

  return (
    <section
      aria-label="Flooded area in this scenario"
      className={`px-5 pt-4.5 pb-5 transition-opacity ${dimmed ? "opacity-45" : ""}`}
    >
      <p className="text-ink-dim flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.12em] uppercase">
        {scenario.label} storm
        <span className="bg-hairline size-1 rounded-full" aria-hidden="true" />
        <span data-numeric>{scenario.annualChance} chance a year</span>
      </p>

      {/* The headline is the number. The sentence is still all there for a
          screen reader — it just no longer has to be read to be understood. */}
      <p className="mt-2">
        {ready ? (
          <>
            <span className="sr-only">About </span>
            <span
              data-numeric
              className="text-ink text-[40px] leading-none font-semibold tracking-[-0.04em]"
            >
              {formatArea(fp.totalKm2)}
            </span>
            <span className="text-tide ml-1 text-[17px] font-semibold">km²</span>
            <span className="text-ink-dim mt-1.5 block text-[13px]">
              of Davao City floods
              <span className="sr-only"> in a {scenario.label} storm</span>
            </span>
          </>
        ) : (
          <span className="text-ink-dim text-[13px]">
            Measuring the {scenario.label} footprint…
          </span>
        )}
      </p>

      {/* A depth gauge: shallow at the top, deepest at the bottom, the way
          the water stacks. Each band gets its own track drawn to its share,
          so the 5 -> 100-year switch visibly pushes weight toward the bottom
          row. Colour is never the only channel — every row says its depth
          and its share in text. */}
      <dl className="mt-5 space-y-3.5">
        {hazardTiers.map((tier) => (
          <div key={tier.id}>
            <div className="flex items-baseline gap-2">
              <dt className="text-ink min-w-0 flex-1 truncate text-[12.5px] font-medium">
                {tier.summary.replace(/\.$/, "")}
                <span className="text-ink-dim ml-1.5 text-[11px]" data-numeric>
                  {tier.depthShort}
                </span>
              </dt>
              <dd className="shrink-0 text-[11px]" data-numeric>
                {ready ? (
                  <>
                    <span className="text-ink-dim">
                      {formatArea(fp.km2[tier.id])} km²
                    </span>
                    <span className="text-ink ml-2 inline-block min-w-[2.4em] text-right text-[13px] font-semibold">
                      {Math.round(fp.share[tier.id] * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="text-ink-dim">—</span>
                )}
              </dd>
            </div>
            <div
              className="bg-raised mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
              aria-hidden="true"
            >
              <span
                className={`${hazardBg[tier.id]} block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500`}
                style={{ width: ready ? `${fp.share[tier.id] * 100}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </dl>

      {dimmed && (
        <p className="text-ink-dim mt-4 text-[11px]">
          The overlay is switched off — the map is showing the basemap only.
        </p>
      )}
    </section>
  );
}
