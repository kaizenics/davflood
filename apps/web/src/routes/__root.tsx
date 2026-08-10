/// <reference types="vite/client" />
import { disclaimer } from "@davflood/hazard/copy";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { AppHeader } from "@/components/app-header";
import { registerServiceWorker } from "@/lib/offline";
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
      { title: "DavFlood — flood hazard map for Davao City" },
      { name: "description", content: disclaimer.short },
      { name: "theme-color", content: "#060a0e" },
      { name: "color-scheme", content: "dark" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      // installable, so it can be opened from a home screen with no signal
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  // once, on the client — see lib/offline.ts
  useEffect(() => registerServiceWorker(), []);

  return (
    // no `className="dark"` here — THEME_INIT_SCRIPT sets it before paint
    <html lang="en-PH">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-abyss text-ink">
        <div className="flex h-dvh flex-col">
          <AppHeader />
          <main className="relative min-h-0 flex-1">{children}</main>
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
