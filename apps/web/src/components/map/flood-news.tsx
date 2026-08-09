import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";

type NewsItem = {
  title: string;
  url: string;
  source: string;
  date: string;
};

type NewsFile = {
  fetched: string;
  items: NewsItem[];
};

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
  const { data } = useQuery<NewsFile | null>({
    queryKey: ["flood-news"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/flood-news.json", { signal });
      if (!res.ok) return null; // not published yet — not an error
      return (await res.json()) as NewsFile;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

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

      <ul className="mt-2.5 space-y-2.5">
        {items.slice(0, 4).map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <span className="text-ink group-hover:text-tide block text-[12px] leading-snug font-medium transition">
                {item.title}
                <ExternalLink
                  className="ml-1 inline size-3 align-[-1px] opacity-60"
                  aria-hidden="true"
                />
              </span>
              <span className="text-ink-dim mt-0.5 block text-[10.5px]">
                {item.source} · {item.date}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="text-ink-dim mt-2.5 text-[10px] leading-relaxed">
        Reported by others, not verified by DavFlood. Headlines are shown as
        published.
      </p>
    </div>
  );
}
