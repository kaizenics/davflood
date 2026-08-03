import { setWorkerUrl } from "maplibre-gl";
// Vite compiles the worker (resolving its sibling `maplibre-gl-shared.mjs`
// import) and hands back a URL that is correct in dev and in the build.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

/**
 * Point MapLibre at its worker explicitly.
 *
 * MapLibre derives the worker URL from `import.meta.url` and expects
 * `maplibre-gl-worker.mjs` to sit next to the module that asked for it:
 *
 *   function getWorkerUrl() {
 *     const u = import.meta.url;
 *     if (!/^https?:/.test(u)) return "";
 *     return new URL("./maplibre-gl-worker.mjs", u).href;
 *   }
 *
 * That assumption does not survive a bundler. In dev, Vite pre-bundles
 * maplibre-gl into node_modules/.vite/deps/, where no sibling worker exists.
 * In the build it is bundled into a hashed chunk under /assets/, same problem.
 * Either way the worker 404s.
 *
 * The failure is silent and total: MapLibre does all tiling in the worker, so
 * every source stalls at "pending" forever, `isStyleLoaded()` never becomes
 * true, and nothing paints — not even a bundled GeoJSON source that needs no
 * network at all. No error event is emitted. The map is just black.
 *
 * Importing the worker through Vite's `?worker&url` makes it a real build
 * artifact with its dependencies resolved, so the URL is always right.
 *
 * Must run before the first `new maplibregl.Map()`.
 */
setWorkerUrl(maplibreWorkerUrl);
