/// <reference types="vite/client" />
import { disclaimer } from "@naboflood/hazard/copy";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "NaboFlood — flood hazard map for Panabo City" },
      { name: "description", content: disclaimer.short },
      { name: "theme-color", content: "#060a0e" },
      { name: "color-scheme", content: "dark" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en-PH" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-abyss text-ink">
        <div className="flex h-dvh flex-col">
          <main className="relative min-h-0 flex-1">{children}</main>
          <AppNav />
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
