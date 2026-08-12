import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  // MapLibre creates its worker with { type: "module" }, so Vite has to emit
  // an ES module worker rather than the default IIFE.
  worker: {
    format: "es",
  },
  plugins: [
    tailwindcss(),
    /**
     * SPA + prerender, deliberately — no Nitro server.
     *
     * Every route's data is either bundled (the hazard polygons) or fetched
     * client-side from a keyless public API (rainfall). Nothing is computed
     * per request, so the whole app builds to static files and hosts for
     * free — which keeps the project's ₱0 hosting promise intact.
     *
     * Server functions stay available if Phase 5 (crowdsourced flood reports)
     * ever needs a real request cycle. That is a config change, not a rewrite.
     */
    tanstackStart({
      srcDirectory: "src",
      spa: {
        // The shell writes to index.html rather than the default _shell.html.
        // That makes it both the "/" document AND the fallback a static host
        // serves for any unmatched path — the standard SPA layout. Without
        // this, "/" emits no index.html at all and the root 404s.
        enabled: true,
        prerender: { outputPath: "/index", crawlLinks: true },
      },
      prerender: { failOnError: true },
      // must match lib/seo.ts — a sitemap on a different origin than the
      // canonical tags is a sitemap Search Console rejects
      sitemap: { host: "https://davflood.site" },

      /**
       * Declared so the sitemap is a statement of intent rather than a
       * by-product of what the crawler happened to reach.
       *
       * "/" is here because the SPA shell config marks it excluded — it is
       * the shell as well as a page — and a sitemap missing the homepage is
       * missing the single most important URL on the site.
       *
       * Priorities are relative, and ordered by what a stranger arriving in a
       * storm needs: the map, then the numbers to ring, then the reference.
       */
      pages: [
        { path: "/", sitemap: { exclude: false, priority: 1.0, changefreq: "weekly" } },
        { path: "/emergency", sitemap: { priority: 0.9, changefreq: "monthly" } },
        { path: "/barangays", sitemap: { priority: 0.8, changefreq: "monthly" } },
        { path: "/learn", sitemap: { priority: 0.7, changefreq: "monthly" } },
        // the only page whose content genuinely changes on its own
        { path: "/news", sitemap: { priority: 0.6, changefreq: "daily" } },
        { path: "/about", sitemap: { priority: 0.5, changefreq: "monthly" } },
      ],
    }),
    react(),
  ],
});
