import { disclaimer } from "@davflood/hazard/copy";
import { chanceOver, scenarios } from "@davflood/hazard/scenarios";
import { hazardTiers } from "@davflood/hazard/tiers";
import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

import { hazardBg, hazardBorder, hazardText } from "@/lib/hazard-classes";

export const Route = createFileRoute("/learn")({
  component: LearnScreen,
});

const HORIZONS = [1, 10, 30, 50];

/**
 * What each colour on the map costs you.
 *
 * A panel beside the map it explains, which is the point: the swatch here and
 * the same colour out there are one glance apart. See routes/about.tsx for why
 * nothing in here sets a width or a `sm:` breakpoint.
 */
function LearnScreen() {
  return (
    <article className="px-5 py-7">
      <header>
        <p className="text-tide text-[10.5px] font-semibold tracking-[0.16em] uppercase">
          Reference
        </p>
        <h1 className="text-ink mt-2.5 text-[1.7rem] leading-[1.15] font-semibold tracking-tight">
          What the colours mean
        </h1>
        <p className="text-ink-dim mt-3.5 text-[14.5px] leading-relaxed">
          A colour is only useful if you know what it costs you. Here is each
          hazard level in metres, in furniture, and in decisions.
        </p>
      </header>

      {/* hazard tiers — a colour rule per tier, not a tinted card per tier */}
      <div className="mt-8 flex flex-col">
        {hazardTiers.map((tier) => (
          <section
            key={tier.id}
            className="border-hairline/60 border-t py-6 first:border-t-0 first:pt-0"
          >
            <div className="flex items-baseline gap-2.5">
              <span
                className={`size-3 translate-y-px shrink-0 rounded-[3px] ${hazardBg[tier.id]}`}
                aria-hidden="true"
              />
              <h2
                className={`text-[1.05rem] font-semibold tracking-tight ${hazardText[tier.id]}`}
              >
                {tier.label}
              </h2>
              <span className="text-ink-dim text-[12.5px]" data-numeric>
                {tier.depth}
              </span>
            </div>

            <p className="text-ink mt-2 text-[14px] font-medium">{tier.name}</p>
            <p className="text-ink-dim mt-2.5 text-[13.5px] leading-relaxed">
              {tier.human}
            </p>

            <p
              className={`mt-3.5 border-l-2 pl-3.5 text-[13.5px] leading-relaxed ${hazardBorder[tier.id]}`}
            >
              <span className="text-ink font-semibold">What to do. </span>
              <span className="text-ink-dim">{tier.action}</span>
            </p>
          </section>
        ))}
      </div>

      {/* ---- return periods ---- */}
      <section className="mt-12">
        <h2 className="text-ink text-[1.15rem] leading-tight font-semibold tracking-tight text-balance">
          A “100-year flood” is not a once-a-century flood
        </h2>
        <p className="text-ink-dim mt-3 text-[13.5px] leading-relaxed">
          It means a 1-in-100 chance in any given year. Two can land in
          consecutive years without the model being wrong — the same way rolling
          two sixes in a row doesn&apos;t break the dice. And the risk compounds:
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {HORIZONS.map((years) => {
            const pct = chanceOver(100, years) * 100;
            return (
              <div key={years} className="flex items-center gap-3">
                <span
                  className="text-ink-dim w-[4.25rem] shrink-0 text-[12.5px]"
                  data-numeric
                >
                  {years} {years === 1 ? "year" : "years"}
                </span>
                <span className="bg-raised h-1.5 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-tide block h-full rounded-full"
                    style={{ width: `${Math.max(1.5, pct)}%` }}
                  />
                </span>
                <span
                  className="text-ink w-9 shrink-0 text-right text-[12.5px] font-semibold"
                  data-numeric
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-ink-dim mt-3 text-[10.5px]">
          Chance of at least one 100-year flood, assuming independent years.
        </p>

        <dl className="border-hairline/60 mt-6 flex flex-col border-t">
          {scenarios.map((s) => (
            <div
              key={s.years}
              className="border-hairline/60 grid gap-1 border-b py-3.5"
            >
              <dt className="text-tide text-[12.5px] font-semibold tracking-wide">
                {s.label}
                <span className="text-ink-dim ml-2 font-normal">
                  {s.annualChance}/yr
                </span>
              </dt>
              <dd className="text-ink-dim text-[13.5px] leading-relaxed">
                {s.blurb}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- disclaimer ---- */}
      <aside className="border-haz-med mt-10 border-l-2 pl-4">
        <p className="flex items-start gap-2">
          <TriangleAlert
            className="text-haz-med mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="text-ink text-[14px] leading-snug font-semibold">
            {disclaimer.short}
          </span>
        </p>
        <p className="text-ink-dim mt-2 text-[13px] leading-relaxed">
          {disclaimer.long}
        </p>
      </aside>
    </article>
  );
}
