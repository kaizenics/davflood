import { describeAge, newsDay } from "@davflood/hazard/news";
import type { NewsItem } from "@davflood/hazard/news";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, MapPin, Newspaper } from "lucide-react";

import { useNow } from "@/hooks/use-now";
import { useMounted } from "@/lib/query";
import { seo } from "@/lib/seo";

import { useNewsFile } from "@/hooks/use-news-pins";

export const Route = createFileRoute("/news")({
  head: () => seo({
    title: "Davao City flood reports",
    description:
      "Recent news coverage of flooding in Davao City, newest first, with the barangay each report names. Sourced from Philippine publishers.",
    path: "/news",
  }),
  component: NewsScreen,
});

/**
 * Every flood report we have, newest first.
 *
 * The map's own panel shows four; this is the rest. It exists because the
 * older ones are not clutter — a barangay that has been in the news three
 * times in six weeks is telling you something no single headline does, and
 * something the hazard model, which knows nothing about what has actually
 * happened, cannot tell you at all.
 *
 * These are other people's reports throughout. Nothing here is summarised or
 * reworded, every item names its source and its age, and the page says so
 * before the list rather than after it.
 */
function NewsScreen() {
  const { data, isLoading } = useNewsFile();
  const items = data?.items ?? [];

  /**
   * The prerendered HTML and the first client render have to say the same
   * thing, or React throws a hydration mismatch.
   *
   * They did not. The query cannot run during prerender, so the server saw no
   * data and no fetch in flight and rendered "no reports"; the browser starts
   * the fetch immediately and renders "loading". Waiting for mount makes both
   * sides render the same placeholder, and the real answer arrives on the
   * render after.
   */
  const pending = !useMounted() || isLoading;

  return (
    <div className="pb-8">
      <header className="px-5 pt-7 pb-2">
        <h1 className="text-ink text-[1.7rem] leading-[1.15] font-semibold tracking-tight">
          Flood reports
        </h1>
        <p className="text-ink-dim mt-2.5 text-[13.5px] leading-relaxed">
          What the news has carried about flooding in Davao City over the last
          two months, newest first. Reported by others — not verified by
          DavFlood, and not a statement about conditions right now.
        </p>
      </header>

      <div className="px-5">
        {pending ? (
          <p className="text-ink-dim py-16 text-center text-[13.5px]">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Newspaper
              className="text-ink-dim mx-auto size-6 opacity-50"
              aria-hidden="true"
            />
            <p className="text-ink mt-3 text-[13.5px] font-semibold">
              No reports on record.
            </p>
            <p className="text-ink-dim mt-1.5 text-[12.5px] leading-relaxed">
              Nothing has been published in the window we keep, or the feed has
              not run yet. The hazard map does not depend on this.
            </p>
          </div>
        ) : (
          <ul className="divide-hairline/60 divide-y">
            {/* Keyed on the title, which is what `mergeNews` dedupes on and
                therefore the only field guaranteed unique here. Two sources
                can carry one story under different URLs — and, less often,
                two stories behind one URL, which is a duplicate React key and
                a dropped row. */}
            {items.map((item) => (
              <Report key={item.title} item={item} />
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <p className="text-ink-dim mt-5 text-[10.5px] leading-relaxed">
            {items.length} reports, refreshed automatically. Headlines and
            pictures are shown as published, and link back to the publisher.
            Reports older than two months are dropped.
          </p>
        )}
      </div>
    </div>
  );
}

function Report({ item }: { item: NewsItem }) {
  /* Ticks every 30s so "4 minutes ago" does not quietly become a lie while
     the page sits open during a storm — see use-now.ts. Per row rather than
     hoisted: the interval is shared by React's scheduler anyway, and the
     alternative is threading a clock through a presentational component. */
  const now = useNow();

  return (
    <li className="py-3.5">
      <div className="flex gap-3">
        {item.image && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img
              src={item.image}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // a story that outlives its picture is still a story
                e.currentTarget.style.display = "none";
              }}
              className="border-hairline/60 bg-raised h-16 w-20 rounded-lg border object-cover"
            />
          </a>
        )}

        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <h2 className="text-ink group-hover:text-tide text-[13.5px] leading-snug font-semibold text-balance transition">
              {item.title}
              <ExternalLink
                className="ml-1 inline size-3 align-[-1px] opacity-60"
                aria-hidden="true"
              />
            </h2>
          </a>

          <p className="text-ink-dim mt-1.5 text-[11px]">
            {item.source} · {newsDay(item.date)}
            {now && ` · ${describeAge(item.date, now)}`}
          </p>

          {/* The bridge back to the map, which is right there — the report
              named this barangay, so this is the one place the news can hand
              you a location. */}
          {item.barangay && item.center && (
            <Link
              to="/"
              search={{
                lng: item.center[0],
                lat: item.center[1],
                b: item.barangay,
              }}
              className="border-hairline text-ink-dim hover:text-ink hover:border-tide rounded-pill mt-2 inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-medium transition"
            >
              <MapPin className="size-3" aria-hidden="true" />
              {item.barangay} on the map
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
