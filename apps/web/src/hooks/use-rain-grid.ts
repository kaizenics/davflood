import { EMPTY_RAIN_GRID, fetchRainGrid } from "@davflood/hazard/rain-grid";
import type { RainGrid } from "@davflood/hazard/rain-grid";
import { useQuery } from "@tanstack/react-query";
import { gcTime } from "@/lib/query";

/**
 * The rain grid, on the same terms as the rest of the weather in this app:
 * a bonus that must never hold up the hazard map.
 *
 * Only fetched once the layer is switched on. It is ~70 coordinates in one
 * request, and nobody should pay for it on a dry day they never asked about.
 * Ten minutes is roughly the model's own update cadence — polling faster
 * returns the same numbers.
 */
export function useRainGrid(enabled: boolean) {
  return useQuery<RainGrid>({
    queryKey: ["rain-grid", "davao"],
    queryFn: ({ signal }) => fetchRainGrid(signal),
    // and never during prerender — see use-news-pins.ts
    enabled: enabled && typeof window !== "undefined",
    staleTime: 10 * 60 * 1000,
    refetchInterval: enabled ? 10 * 60 * 1000 : false,
    gcTime: gcTime(60 * 60 * 1000),
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: EMPTY_RAIN_GRID,
  });
}
