/// <reference types="vite/client" />
import { disclaimer } from "@davflood/hazard/copy";
import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { AppHeader } from "@/components/app-header";
import { MapShell } from "@/components/map/map-shell";
import { registerServiceWorker } from "@/lib/offline";
import { seo, siteJsonLd } from "@/lib/seo";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#060a0e" },
      { name: "color-scheme", content: "dark" },

      /* The defaults. Every route overrides title/description/canonical with
         its own seo() call — these are what an unmatched path would get, and
         what a crawler sees if a route ever forgets. */
      ...seo({
        title: "Flood hazard map for Davao City",
        description: disclaimer.long.slice(0, 155),
        path: "/",
      }).meta,
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      // installable, so it can be opened from a home screen with no signal
      { rel: "manifest", href: "/manifest.webmanifest" },

      /* Every third-party host the app reaches on a cold start. preconnect
         opens the TCP and TLS handshake while the HTML is still parsing;
         on a phone on mobile data during a storm that is a real fraction of
         time-to-first-tile. */
      { rel: "preconnect", href: "https://tiles.openfreemap.org", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://s3.amazonaws.com" },
      { rel: "dns-prefetch", href: "https://api.open-meteo.com" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: siteJsonLd(),
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  // once, on the client — see lib/offline.ts
  useEffect(() => registerServiceWorker(), []);

  const router = useRouter();

  /**
   * Pull the hotlines route into the cache on every visit, whichever page
   * that visit was for.
   *
   * Routes are code-split, and the service worker only ever caches a chunk it
   * has seen fetched. So /emergency — the one page whose entire reason for
   * existing is to work in the dark with no signal — would be the one page
   * that had never been downloaded, unless someone happened to open it on a
   * clear day. Preloading it costs a few KB once and removes that entirely.
   */
  useEffect(() => {
    void router.preloadRoute({ to: "/emergency" }).catch(() => {
      // preload is an optimisation; a failure here must never break the page
    });
  }, [router]);

  return (
    // no `className="dark"` here — THEME_INIT_SCRIPT sets it before paint
    <html lang="en-PH">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-abyss text-ink">
        <div className="flex h-dvh flex-col">
          {/* Phones only. There is no room beside the content at that width,
              and on the map the panel is a collapsed sheet, so nav inside it
              would be nav you cannot see. From lg up every page carries its
              navigation in a column instead — a bar across the top of a map is
              56px of the one thing the screen exists to show. */}
          <AppHeader />

          {/* Every page renders into the same column beside the same live
              map — see components/map/map-shell.tsx. */}
          <main className="relative min-h-0 flex-1">
            <MapShell>{children}</MapShell>
          </main>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-ink text-xl font-semibold">This page is underwater.</p>
      <p className="text-ink-dim text-sm">
        That link doesn&apos;t lead anywhere. The map still does.
      </p>
      <a
        href="/"
        className="bg-tide text-abyss rounded-pill mt-2 px-5 py-2.5 text-sm font-semibold"
      >
        Back to the map
      </a>
    </div>
  );
}
