import { barangays } from "@davflood/hazard/barangays";
import { slugify } from "@davflood/hazard/slug";
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
      /**
       * Prerendering 189 pages inside a build container.
       *
       * The prerenderer starts a server in-process and fetches every page
       * from it over loopback. That was fine at six pages; at 189 — the
       * barangay profiles — Netlify's build failed with ECONNREFUSED on
       * 127.0.0.1 four pages in, which is the shape of the server dying
       * rather than a page rendering wrong. Its own concurrency is derived
       * from CPU count, and a build container has few and shares them.
       *
       * One at a time, with retries. Serial costs seconds on a build that
       * already takes a minute; a failed deploy costs the whole deploy. The
       * retry covers the other half of that error — a fetch racing the
       * server's first listen, which no amount of serialising prevents.
       *
       * failOnError stays true. A barangay page that silently did not render
       * would be a 404 for somebody looking up their own barangay, and it
       * should stop the deploy rather than ship.
       */
      prerender: {
        /**
         * Skip the map's query-string permutations.
         *
         * Every barangay profile links to "See it on the map", which carries
         * ?lng=&lat=&b=. crawlLinks followed all 183 of them and prerendered
         * a separate copy of the map page for each — 372 renders for 189
         * pages, all the extras being the same route with a different camera.
         * They were already being stripped from the sitemap and disallowed in
         * robots.txt; this stops them being built in the first place, which
         * is the half that was costing build time.
         */
        filter: (page) => !page.path.includes("?"),
        failOnError: true,
        concurrency: 1,
        retryCount: 3,
        retryDelay: 500,
      },
      // must match lib/seo.ts — a sitemap on a different origin than the
      // canonical tags is a sitemap Search Console rejects
      sitemap: { host: "https://www.davflood.site" },

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

        /**
         * Every barangay profile, listed explicitly rather than discovered.
         *
         * These used to arrive by crawlLinks, because the barangay list
         * linked to each one. The list now links straight to the map — which
         * is what a person picking their barangay actually wants — and those
         * links carry ?lng&lat&b, which the filter above deliberately drops.
         * The crawler consequently reached none of the 183 and the sitemap
         * fell from 189 URLs to 6.
         *
         * Seeding them from the same barangays.ts the routes are built from
         * makes the set explicit and impossible to lose to a UI change: add a
         * barangay and its page is prerendered, whether or not anything links
         * to it.
         *
         * Low priority, rarely changing: they are the long tail somebody
         * reaches by searching their own barangay's name, which is exactly
         * the search worth being findable for.
         */
        ...barangays.map(({ name }) => ({
          path: `/barangay/${slugify(name)}`,
          sitemap: { priority: 0.4, changefreq: "monthly" as const },
        })),
      ],
    }),
    react(),
  ],
});
