import { QueryClient } from "@tanstack/react-query";

/**
 * The app talks to exactly one network service — Open-Meteo, for rainfall —
 * and nothing else. No backend, no auth, no accounts.
 *
 * Defaults are tuned for a phone in a storm: don't hammer a flaky connection,
 * and keep the last good response around so a cold cell signal still shows
 * something rather than a spinner.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});
