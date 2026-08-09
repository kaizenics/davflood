import { describeAge } from "@davflood/hazard/news";
import type { NewsItem } from "@davflood/hazard/news";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, MapPin, Newspaper } from "lucide-react";

import { useNewsFile } from "@/hooks/use-news-pins";

export const Route = createFileRoute("/news")({
  component: NewsScreen,
});

/**
 * Every flood report we have, newest first.
 *
 * The panel on the map shows four; this is the rest. It exists because the
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

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <header className="mx-auto w-full max-w-3xl shrink-0 px-6 pt-10 pb-4 sm:px-8">
        <h1 className="text-ink text-3xl font-bold tracking-tight sm:text-4xl">
          Flood reports
        </h1>
        <p className="text-ink-dim mt-3 text-base">
          What the news has carried about flooding in Davao City over the last
          two months, newest first. Reported by others — not verified by
          DavFlood, and not a statement about conditions right now.
        </p>
      </header>

      <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto px-6 pb-12 sm:px-8">
        {isLoading ? (
          <p className="text-ink-dim py-16 text-center text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Newspaper
              className="text-ink-dim mx-auto size-6 opacity-50"
              aria-hidden="true"
            />
            <p className="text-ink mt-3 text-sm font-semibold">
              No reports on record.
            </p>
            <p className="text-ink-dim mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed">
              Nothing has been published in the window we keep, or the feed has
              not run yet. The hazard map does not depend on this.
            </p>
          </div>
        ) : (
          <ul className="divide-hairline/60 divide-y">
            {items.map((item) => (
              <Report key={item.url} item={item} />
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <p className="text-ink-dim mt-6 text-[11px] leading-relaxed">
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
  return (
    <li className="py-4">
      <div className="flex gap-4">
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
              className="border-hairline/60 bg-raised h-20 w-28 rounded-lg border object-cover sm:h-24 sm:w-36"
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
            <h2 className="text-ink group-hover:text-tide text-[15px] leading-snug font-semibold text-balance transition">
              {item.title}
              <ExternalLink
                className="ml-1 inline size-3.5 align-[-2px] opacity-60"
                aria-hidden="true"
              />
            </h2>
          </a>

          <p className="text-ink-dim mt-1.5 text-[12px]">
            {item.source} · {item.date} · {describeAge(item.date)}
          </p>

          {/* The bridge back to the map: the report named this barangay, so
              this is the one place the news can hand you a location. */}
          {item.barangay && item.center && (
            <Link
              to="/"
              search={{
                lng: item.center[0],
                lat: item.center[1],
                b: item.barangay,
              }}
              className="border-hairline text-ink-dim hover:text-ink hover:border-tide rounded-pill mt-2.5 inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium transition"
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
