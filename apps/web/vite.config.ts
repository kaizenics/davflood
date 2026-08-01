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
      sitemap: { host: "https://app.naboflood.app" },
    }),
    react(),
  ],
});
