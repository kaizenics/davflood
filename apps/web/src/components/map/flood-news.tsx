import { describeAge } from "@davflood/hazard/news";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ExternalLink, Newspaper } from "lucide-react";

import { useNow } from "@/hooks/use-now";
import { useNewsFile } from "@/hooks/use-news-pins";

/** The panel is a summary; the rest live on /news. */
const SHOWN = 4;

/**
 * Recent flooding coverage for Davao City.
 *
 * Read from a file this site serves itself, refreshed by CI — see
 * scripts/build-flood-news.ts for why it cannot be fetched from the browser.
 * The file may simply not exist yet, on a fresh deploy or if every source was
 * down when CI last ran, so absence is a normal state and renders nothing at
 * all rather than an empty box or an apology.
 *
 * These are OTHER PEOPLE'S REPORTS, not the app's own claim. Everything is
 * attributed and dated, and nothing here is summarised or reworded — an app
 * that paraphrases a flood report is inventing a source.
 */
export function FloodNews() {
  // shares its query with the map pins, so the list and the pins can never
  // disagree about what was reported
  const { data } = useNewsFile();

  /* "how long ago" rather than a calendar date. During a storm the question
     behind every one of these headlines is "is this about what is happening
     right now", and 2026-08-08 makes the reader do that subtraction. Null
     until mount, so prerender and hydration agree — see use-now.ts. */
  const now = useNow();
  const age = (iso: string) => (now ? describeAge(iso, now) : "");

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Newspaper className="text-ink-dim size-4 shrink-0" aria-hidden="true" />
        <h2 className="text-ink flex-1 text-[12.5px] font-semibold">
          In the news
        </h2>
      </div>

      <ul className="mt-2.5 space-y-3">
        {items.slice(0, SHOWN).map((item) => (
          <li key={item.title}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-2.5"
            >
              {item.image && <Thumb src={item.image} />}
              <span className="min-w-0 flex-1">
                <span className="text-ink group-hover:text-tide block text-[12px] leading-snug font-medium transition">
                  {item.title}
                  <ExternalLink
                    className="ml-1 inline size-3 align-[-1px] opacity-60"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-ink-dim mt-0.5 block text-[10.5px]">
                  {item.source}
                  {age(item.date) && ` · ${age(item.date)}`}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {items.length > SHOWN && (
        <Link
          to="/news"
          className="border-hairline text-ink-dim hover:text-ink hover:border-tide rounded-pill mt-3 flex items-center justify-center gap-1.5 border px-3 py-1.5 text-[11px] font-medium transition"
        >
          Show all {items.length} reports
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}

      <p className="text-ink-dim mt-2.5 text-[10px] leading-relaxed">
        Reported by others, not verified by DavFlood. Headlines and pictures
        are shown as published.
      </p>
    </div>
  );
}

/**
 * The publisher's lead photograph, hotlinked from their CDN.
 *
 * Not copied into this repo: the picture is theirs, it can be corrected or
 * withdrawn at the source, and a cron job committing binaries every half hour
 * would bloat the history for no one's benefit. `no-referrer` keeps the
 * reader's visit to this map out of the publisher's logs.
 *
 * It removes itself if the URL dies, which they do — a story that outlives
 * its picture should still read as a story rather than a broken frame.
 */
function Thumb({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className="border-hairline/60 bg-raised size-14 shrink-0 rounded-lg border object-cover"
    />
  );
}
