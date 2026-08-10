import { NEWS_RETENTION_DAYS, ageInDays } from "@davflood/hazard/news";
import type { NewsFile, NewsItem } from "@davflood/hazard/news";
import { useQuery } from "@tanstack/react-query";
import { gcTime } from "@/lib/query";
import { useMemo } from "react";

import type { NewsPin } from "@/components/map/news-pin";

/**
 * The published news file, and the subset of it that can go on the map.
 *
 * Shares a query key with the sidebar list, so the file is fetched once and
 * both surfaces read the same copy — the pins and the list can never disagree
 * about what was reported.
 */
/**
 * Every network hook in this app is client-only, and this one is why.
 *
 * Prerendering renders these components in Node. React Query happily ran this
 * query there, and the fetch below is a RELATIVE url — which the prerenderer
 * resolves against its own server, where /api/news does not exist. The request
 * never settled, its socket kept the event loop alive, and `vite build` did
 * all of its work and then hung: forever locally, and until Netlify killed the
 * deploy at eighteen minutes.
 *
 * The data is client-side by design anyway. There is nothing to gain from
 * fetching it during a build whose output is a static shell.
 */
const IS_BROWSER = typeof window !== "undefined";

export function useNewsFile() {
  return useQuery<NewsFile | null>({
    enabled: IS_BROWSER,
    queryKey: ["flood-news"],
    queryFn: async ({ signal }) => {
      /**
       * The function first, the committed file second.
       *
       * /api/news re-fetches the sources behind a CDN cache, so it is current
       * without anything being committed. The static file is what answers on
       * a plain static host, in local preview, and if the function is down —
       * it is older, but every item carries its own date and anything past
       * the retention window is dropped below, so stale cannot masquerade as
       * current.
       */
      const file =
        (await read("/api/news", signal)) ?? (await read("/flood-news.json", signal));
      if (!file) return null; // nothing published yet — not an error

      return {
        ...file,
        items: (file.items ?? []).filter(
          (item) => ageInDays(item.date) <= NEWS_RETENTION_DAYS,
        ),
      };
    },
    staleTime: 15 * 60 * 1000,
    gcTime: gcTime(60 * 60 * 1000),
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

async function read(url: string, signal: AbortSignal): Promise<NewsFile | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return (await res.json()) as NewsFile;
  } catch {
    return null;
  }
}

/**
 * One pin per barangay, newest report first.
 *
 * Grouped because three reports about Ma-a are one place on a map, not three
 * overlapping markers — and the count is itself information: a barangay named
 * repeatedly over a fortnight is telling you something a single headline is
 * not.
 */
export function useNewsPins(): NewsPin[] {
  const { data } = useNewsFile();

  return useMemo(() => {
    const byBarangay = new Map<string, NewsPin>();
    for (const item of data?.items ?? []) {
      if (!item.barangay || !item.center) continue;
      const pin = byBarangay.get(item.barangay);
      if (pin) pin.items.push(item);
      else
        byBarangay.set(item.barangay, {
          barangay: item.barangay,
          center: [item.center[0], item.center[1]],
          items: [item],
        });
    }
    for (const pin of byBarangay.values()) {
      pin.items.sort((a: NewsItem, b: NewsItem) => b.date.localeCompare(a.date));
    }
    return [...byBarangay.values()];
  }, [data]);
}
