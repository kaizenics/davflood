import { fetchRainfall } from "@davflood/hazard/rainfall";
import type { Rainfall } from "@davflood/hazard/rainfall";
import { useQuery } from "@tanstack/react-query";
import { gcTime } from "@/lib/query";

/**
 * Rainfall is a BONUS on top of the hazard map, never a dependency of it.
 *
 * During a storm the network is the first thing to go — which is exactly when
 * people open this. So: no long retry, no blocking error state, and every
 * consumer must render fine with `data` undefined.
 */
export function useRainfall() {
  return useQuery<Rainfall>({
    // client-only, like every fetch here — see use-news-pins.ts for the build
    // that hung because one of them ran during prerender
    enabled: typeof window !== "undefined",
    queryKey: ["rainfall", "davao"],
    queryFn: ({ signal }) => fetchRainfall(undefined, signal),
    staleTime: 30 * 60 * 1000,
    gcTime: gcTime(24 * 60 * 60 * 1000),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
