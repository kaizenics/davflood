import { fetchRainfall } from "@naboflood/hazard/rainfall";
import type { Rainfall } from "@naboflood/hazard/rainfall";
import { useQuery } from "@tanstack/react-query";

/**
 * Rainfall is a BONUS on top of the hazard map, never a dependency of it.
 *
 * During a storm the network is the first thing to go — which is exactly when
 * people open this app. So: no retries worth waiting on, no error surfaced as
 * a blocking state, and every consumer must render fine with `data`
 * undefined. The hazard layer is the product.
 */
export function useRainfall() {
  return useQuery<Rainfall>({
    queryKey: ["rainfall", "panabo"],
    queryFn: ({ signal }) => fetchRainfall(undefined, signal),
    staleTime: 30 * 60 * 1000, // 30 min — the forecast does not move faster
    gcTime: 24 * 60 * 60 * 1000, // keep the last good reading for a day
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
