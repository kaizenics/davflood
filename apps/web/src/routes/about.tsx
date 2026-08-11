import { dataSources, mapAttribution } from "@davflood/hazard/copy";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Construction } from "lucide-react";

import { DraftNotice } from "@/components/locale-controls";
import { DATA_IS_PLACEHOLDER } from "@/lib/hazard-source";
import { useStrings } from "@/lib/locale";

export const Route = createFileRoute("/about")({
  component: AboutScreen,
});

/**
 * A panel, not a page.
 *
 * The shell owns the column and the scrolling (see components/map/map-shell),
 * so nothing here sets a width, and nothing here uses a `sm:` breakpoint: the
 * column is ~26rem whatever the window is doing, and a viewport breakpoint
 * would put two columns of text inside it on a wide screen.
 */
function AboutScreen() {
  const t = useStrings();

  return (
    <article className="px-5 py-7">
      {DATA_IS_PLACEHOLDER && (
        <aside className="border-haz-med mb-8 border-l-2 pl-4">
          <p className="flex items-center gap-2">
            <Construction
              className="text-haz-med size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="text-ink text-[14px] font-semibold">
              This build uses placeholder data
            </span>
          </p>
          <p className="text-ink-dim mt-2 text-[13px] leading-relaxed">
            The hazard zones shown are synthetic — generated to build and test
            the app while the real UP NOAH dataset is obtained. They are not a
            description of real flood risk in Davao City and must not be used to
            make decisions.
          </p>
        </aside>
      )}

      <header>
        <p className="text-tide text-[10.5px] font-semibold tracking-[0.16em] uppercase">
          About
        </p>
        <h1 className="text-ink mt-2.5 text-[1.7rem] leading-[1.15] font-semibold tracking-tight text-balance">
          {t.disclaimer.short}
        </h1>
        <p className="text-ink-dim mt-3.5 text-[14.5px] leading-relaxed">
          {t.disclaimer.long}
        </p>
        <p className="text-ink-dim mt-3 text-[13.5px] leading-relaxed">
          {t.disclaimer.independence}
        </p>
        <DraftNotice />
      </header>

      <section className="mt-10">
        <h2 className="text-ink text-[1.15rem] leading-tight font-semibold tracking-tight">
          Where the data comes from
        </h2>
        <p className="text-ink-dim mt-2.5 text-[13.5px] leading-relaxed">
          Every layer is public data produced by people who made it public on
          purpose. Crediting them is a licence obligation, not a courtesy.
        </p>

        {/* Stacked, always. The two-column version needed 40rem and this
            column has 26. */}
        <ul className="border-hairline/60 mt-5 flex flex-col border-t">
          {dataSources.map((source) => (
            <li key={source.name} className="border-hairline/60 border-b">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-raised/30 -mx-3 flex flex-col gap-1 px-3 py-3.5 transition"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-ink inline-flex items-center gap-1 text-[14px] font-semibold">
                    {source.name}
                    <ArrowUpRight
                      className="size-3.5 shrink-0 opacity-50"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-ink-dim shrink-0 text-[10.5px]">
                    {source.licence}
                  </span>
                </span>
                <span className="text-ink-dim text-[13px] leading-relaxed">
                  {source.role}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-ink-dim mt-10 flex flex-col gap-2 text-[11.5px] leading-relaxed">
        <p>{mapAttribution}</p>
        <p>
          DavFlood is free, has no accounts, shows no ads and collects no
          analytics. A flood map does not need to know who you are.
        </p>
      </footer>
    </article>
  );
}
