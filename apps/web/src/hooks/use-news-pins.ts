import type { NewsFile, NewsItem } from "@davflood/hazard/news";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { NewsPin } from "@/components/map/news-pin";

/**
 * The published news file, and the subset of it that can go on the map.
 *
 * Shares a query key with the sidebar list, so the file is fetched once and
 * both surfaces read the same copy — the pins and the list can never disagree
 * about what was reported.
 */
export function useNewsFile() {
  return useQuery<NewsFile | null>({
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
