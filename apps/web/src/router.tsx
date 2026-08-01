import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

/**
 * The app talks to exactly one network service — Open-Meteo, for rainfall.
 * Everything else is bundled. Defaults are tuned for a phone on a bad
 * connection during a storm: don't hammer it, and keep the last good response
 * rather than showing a spinner forever.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function getRouter() {
  const queryClient = makeQueryClient();

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
