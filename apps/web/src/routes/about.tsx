import { dataSources, disclaimer, mapAttribution } from "@naboflood/hazard/copy";
import { colors } from "@naboflood/hazard/tokens";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Construction } from "lucide-react";

import { DATA_IS_PLACEHOLDER } from "@/lib/hazard-source";

export const Route = createFileRoute("/about")({
  component: AboutScreen,
});

function AboutScreen() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-6">
        {DATA_IS_PLACEHOLDER && (
          <div
            className="rounded-card mb-6 border p-4"
            style={{
              borderColor: `${colors.hazMed}66`,
              backgroundColor: `${colors.hazMed}14`,
            }}
          >
            <p className="flex items-center gap-2">
              <Construction
                className="size-4 shrink-0"
                style={{ color: colors.hazMed }}
                aria-hidden="true"
              />
              <span className="text-ink text-sm font-bold">
                This build uses placeholder data
              </span>
            </p>
            <p className="text-ink-dim mt-2 text-sm leading-relaxed">
              The hazard zones currently shown are synthetic — generated to build
              and test the app while the real UP NOAH dataset is being obtained.
              They are not a description of real flood risk in Panabo City and
              must not be used to make decisions.
            </p>
          </div>
        )}

        <h1 className="text-ink text-xl font-bold">{disclaimer.short}</h1>
        <p className="text-ink-dim mt-2 text-sm leading-relaxed">
          {disclaimer.long}
        </p>
        <p className="text-ink-dim mt-3 text-sm leading-relaxed">
          {disclaimer.independence}
        </p>

        <h2 className="text-ink mt-8 text-lg font-bold">Data sources</h2>
        <p className="text-ink-dim mt-1 text-sm leading-relaxed">
          Every layer is public data produced by people who made it public on
          purpose. Crediting them is a licence obligation, not a courtesy.
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {dataSources.map((source) => (
            <li key={source.name}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-hairline bg-raised/40 rounded-card hover:border-tide block border p-4 transition"
              >
                <span className="text-ink inline-flex items-center gap-1.5 text-base font-bold">
                  {source.name}
                  <ArrowUpRight className="size-3.5 opacity-60" aria-hidden="true" />
                </span>
                <span className="text-ink-dim mt-0.5 block text-[11px]">
                  {source.full}
                </span>
                <span className="text-ink-dim mt-1.5 block text-sm leading-relaxed">
                  {source.role}
                </span>
                <span
                  className="mt-1.5 block text-[11px] font-semibold"
                  style={{ color: colors.tide }}
                >
                  {source.licence}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-ink-dim mt-8 text-[11px] leading-relaxed">
          {mapAttribution}
        </p>
        <p className="text-ink-dim mt-2 text-[11px] leading-relaxed">
          NaboFlood is free, has no accounts, shows no ads and collects no
          analytics. A flood map does not need to know who you are.
        </p>
      </div>
    </div>
  );
}
