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

function LearnScreen() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <article className="mx-auto max-w-2xl px-6 py-12 sm:px-8 lg:py-16">
        <header>
          <p className="text-tide text-[11px] font-semibold tracking-[0.16em] uppercase">
            Reference
          </p>
          <h1 className="text-ink mt-3 text-[2.25rem] leading-[1.1] font-semibold tracking-tight sm:text-[2.75rem]">
            What the colours mean
          </h1>
          <p className="text-ink-dim mt-4 text-[17px] leading-relaxed">
            A colour is only useful if you know what it costs you. Here is each
            hazard level in metres, in furniture, and in decisions.
          </p>
        </header>

        {/* hazard tiers — a colour rule per tier, not a tinted card per tier */}
        <div className="mt-12 flex flex-col">
          {hazardTiers.map((tier) => (
            <section
              key={tier.id}
              className="border-hairline/60 border-t py-7 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline gap-3">
                <span
                  className={`size-3 translate-y-px rounded-[3px] ${hazardBg[tier.id]}`}
                  aria-hidden="true"
                />
                <h2
                  className={`text-xl font-semibold tracking-tight ${hazardText[tier.id]}`}
                >
                  {tier.label}
                </h2>
                <span className="text-ink-dim text-sm" data-numeric>
                  {tier.depth}
                </span>
              </div>

              <p className="text-ink mt-2 text-[15px] font-medium">{tier.name}</p>
              <p className="text-ink-dim mt-3 text-[15px] leading-relaxed">
                {tier.human}
              </p>

              <p
                className={`mt-4 border-l-2 pl-4 text-[15px] leading-relaxed ${hazardBorder[tier.id]}`}
              >
                <span className="text-ink font-semibold">What to do. </span>
                <span className="text-ink-dim">{tier.action}</span>
              </p>
            </section>
          ))}
        </div>

        {/* ---- return periods ---- */}
        <section className="mt-16">
          <h2 className="text-ink text-[1.6rem] leading-tight font-semibold tracking-tight">
            A “100-year flood” is not a once-a-century flood
          </h2>
          <p className="text-ink-dim mt-4 text-[15px] leading-relaxed">
            It means a 1-in-100 chance in any given year. Two can land in
            consecutive years without the model being wrong — the same way
            rolling two sixes in a row doesn&apos;t break the dice. And the risk
            compounds:
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {HORIZONS.map((years) => {
              const pct = chanceOver(100, years) * 100;
              return (
                <div key={years} className="flex items-center gap-4">
                  <span className="text-ink-dim w-20 shrink-0 text-[13px]" data-numeric>
                    {years} {years === 1 ? "year" : "years"}
                  </span>
                  <span className="bg-raised h-1.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-tide block h-full rounded-full"
                      style={{ width: `${Math.max(1.5, pct)}%` }}
                    />
                  </span>
                  <span
                    className="text-ink w-11 shrink-0 text-right text-[13px] font-semibold"
                    data-numeric
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-ink-dim mt-3 text-[11px]">
            Chance of at least one 100-year flood, assuming independent years.
          </p>

          <dl className="border-hairline/60 mt-8 flex flex-col border-t">
            {scenarios.map((s) => (
              <div
                key={s.years}
                className="border-hairline/60 grid gap-1 border-b py-4 sm:grid-cols-[9rem_1fr] sm:gap-4"
              >
                <dt
                  className="text-tide text-[13px] font-semibold tracking-wide"
                >
                  {s.label}
                  <span className="text-ink-dim ml-2 font-normal">
                    {s.annualChance}/yr
                  </span>
                </dt>
                <dd className="text-ink-dim text-[15px] leading-relaxed">
                  {s.blurb}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- disclaimer ---- */}
        <aside className="border-haz-med mt-14 border-l-2 pl-4">
          <p className="flex items-center gap-2">
            <TriangleAlert
              className="text-haz-med size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="text-ink text-[15px] font-semibold">
              {disclaimer.short}
            </span>
          </p>
          <p className="text-ink-dim mt-2 text-[14px] leading-relaxed">
            {disclaimer.long}
          </p>
        </aside>
      </article>
    </div>
  );
}
