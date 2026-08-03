import { dataSources, disclaimer, mapAttribution } from "@davflood/hazard/copy";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Construction } from "lucide-react";

import { DATA_IS_PLACEHOLDER } from "@/lib/hazard-source";

export const Route = createFileRoute("/about")({
  component: AboutScreen,
});

function AboutScreen() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <article className="mx-auto max-w-2xl px-6 py-12 sm:px-8 lg:py-16">
        {DATA_IS_PLACEHOLDER && (
          <aside className="border-haz-med mb-10 border-l-2 pl-4">
            <p className="flex items-center gap-2">
              <Construction
                className="text-haz-med size-4 shrink-0"
                aria-hidden="true"
              />
              <span className="text-ink text-[15px] font-semibold">
                This build uses placeholder data
              </span>
            </p>
            <p className="text-ink-dim mt-2 text-[14px] leading-relaxed">
              The hazard zones shown are synthetic — generated to build and test
              the app while the real UP NOAH dataset is obtained. They are not a
              description of real flood risk in Davao City and must not be used
              to make decisions.
            </p>
          </aside>
        )}

        <header>
          <p className="text-tide text-[11px] font-semibold tracking-[0.16em] uppercase">
            About
          </p>
          <h1 className="text-ink mt-3 text-[2.25rem] leading-[1.1] font-semibold tracking-tight sm:text-[2.75rem]">
            {disclaimer.short}
          </h1>
          <p className="text-ink-dim mt-4 text-[17px] leading-relaxed">
            {disclaimer.long}
          </p>
          <p className="text-ink-dim mt-4 text-[15px] leading-relaxed">
            {disclaimer.independence}
          </p>
        </header>

        <section className="mt-16">
          <h2 className="text-ink text-[1.6rem] leading-tight font-semibold tracking-tight">
            Where the data comes from
          </h2>
          <p className="text-ink-dim mt-3 text-[15px] leading-relaxed">
            Every layer is public data produced by people who made it public on
            purpose. Crediting them is a licence obligation, not a courtesy.
          </p>

          <ul className="border-hairline/60 mt-7 flex flex-col border-t">
            {dataSources.map((source) => (
              <li key={source.name} className="border-hairline/60 border-b">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-raised/30 -mx-3 flex flex-col gap-1 px-3 py-4 transition sm:flex-row sm:items-baseline sm:gap-5"
                >
                  <span className="sm:w-44 sm:shrink-0">
                    <span className="text-ink inline-flex items-center gap-1 text-[15px] font-semibold">
                      {source.name}
                      <ArrowUpRight
                        className="size-3.5 opacity-50"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-ink-dim mt-0.5 block text-[11px]">
                      {source.licence}
                    </span>
                  </span>
                  <span className="text-ink-dim flex-1 text-[14px] leading-relaxed">
                    {source.role}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="text-ink-dim mt-14 flex flex-col gap-2 text-[12px] leading-relaxed">
          <p>{mapAttribution}</p>
          <p>
            DavFlood is free, has no accounts, shows no ads and collects no
            analytics. A flood map does not need to know who you are.
          </p>
        </footer>
      </article>
    </div>
  );
}
