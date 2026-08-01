import { disclaimer } from "@naboflood/hazard/copy";
import { chanceOver, scenarios } from "@naboflood/hazard/scenarios";
import { hazardTiers } from "@naboflood/hazard/tiers";
import { colors } from "@naboflood/hazard/tokens";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/learn")({
  component: LearnScreen,
});

const HORIZONS = [1, 10, 30, 50];

function LearnScreen() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 lg:py-14">
        <h1 className="text-ink text-3xl font-bold tracking-tight sm:text-4xl">Reading the map</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-base leading-relaxed">
          A colour is only useful if you know what it costs you. Here is each
          hazard level in metres, and what it means at your front door.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {hazardTiers.map((tier) => (
            <section
              key={tier.id}
              className="rounded-card border p-4"
              style={{
                borderColor: `${tier.color}55`,
                backgroundColor: `${tier.color}0d`,
              }}
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="size-3.5 rounded-[4px]"
                  style={{ backgroundColor: tier.color }}
                  aria-hidden="true"
                />
                <h2 className="text-lg font-bold" style={{ color: tier.color }}>
                  {tier.label}
                </h2>
                <span className="text-ink-dim text-xs" data-numeric>
                  {tier.depth}
                </span>
              </div>
              <p className="text-ink mt-1.5 text-sm font-semibold">{tier.name}</p>
              <p className="text-ink-dim mt-3 max-w-2xl text-base leading-relaxed">
                {tier.human}
              </p>
              <div className="border-hairline/60 mt-3 flex gap-2 border-t pt-3">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: tier.color }}
                  aria-hidden="true"
                />
                <p className="text-ink text-sm leading-relaxed">
                  <span className="font-bold">What to do: </span>
                  {tier.action}
                </p>
              </div>
            </section>
          ))}
        </div>

        {/* ---- return periods ---- */}
        <h2 className="text-ink mt-14 text-2xl font-bold tracking-tight">
          A “100-year flood” is not a once-a-century flood
        </h2>
        <p className="text-ink-dim mt-3 max-w-2xl text-base leading-relaxed">
          It means a 1-in-100 chance in any given year. Two can land in
          consecutive years without the model being wrong — the same way rolling
          two sixes in a row doesn&apos;t break the dice. And the risk compounds:
        </p>

        <div className="border-hairline bg-raised/40 rounded-card mt-4 flex flex-col gap-2.5 border p-4">
          {HORIZONS.map((years) => {
            const pct = chanceOver(100, years) * 100;
            return (
              <div key={years} className="flex items-center gap-3">
                <span className="text-ink-dim w-16 text-xs" data-numeric>
                  {years} {years === 1 ? "year" : "years"}
                </span>
                <span className="bg-hairline h-2 flex-1 overflow-hidden rounded-full">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max(2, pct)}%`,
                      backgroundColor: colors.tide,
                    }}
                  />
                </span>
                <span
                  className="text-ink w-10 text-right text-xs font-bold"
                  data-numeric
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
          <p className="text-ink-dim mt-1 text-[10px]">
            Chance of at least one 100-year flood, assuming independent years.
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {scenarios.map((s) => (
            <div
              key={s.years}
              className="border-hairline bg-raised/30 rounded-card border p-4"
            >
              <p
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: colors.tide }}
              >
                {s.label} · {s.annualChance} a year
              </p>
              <p className="text-ink-dim mt-1 text-sm leading-relaxed">{s.blurb}</p>
            </div>
          ))}
        </div>

        {/* ---- disclaimer ---- */}
        <div
          className="rounded-card mt-10 border p-4"
          style={{
            borderColor: `${colors.hazMed}55`,
            backgroundColor: `${colors.hazMed}0d`,
          }}
        >
          <p className="flex items-center gap-2">
            <TriangleAlert
              className="size-4 shrink-0"
              style={{ color: colors.hazMed }}
              aria-hidden="true"
            />
            <span className="text-ink text-base font-bold">
              {disclaimer.short}
            </span>
          </p>
          <p className="text-ink-dim mt-2 text-sm leading-relaxed">
            {disclaimer.long}
          </p>
        </div>
      </div>
    </div>
  );
}
