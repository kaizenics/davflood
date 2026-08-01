import { fetchRainfall } from "@naboflood/hazard/rainfall";
import type { Rainfall } from "@naboflood/hazard/rainfall";
import { useQuery } from "@tanstack/react-query";

/**
 * Rainfall is a BONUS on top of the hazard map, never a dependency of it.
 *
 * During a storm the network is the first thing to go — which is exactly when
 * people open this. So: no long retry, no blocking error state, and every
 * consumer must render fine with `data` undefined.
 */
export function useRainfall() {
  return useQuery<Rainfall>({
    queryKey: ["rainfall", "panabo"],
    queryFn: ({ signal }) => fetchRainfall(undefined, signal),
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
