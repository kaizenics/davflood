// `?url` for the same reason the hazard scenarios use it — see hazard-source.ts.
// 3.0 MB of GeoJSON has no business inside the JS bundle.
import url from "@davflood/hazard/data/davao-landslide.json?url";

/**
 * The landslide overlay, fetched the first time it is switched on.
 *
 * NOT bundled and NOT fetched on load, unlike the flood layer. Flood is what
 * the app is for and the map is useless without it; landslide is a second
 * reading somebody asks for, and the upland barangays it matters to are a
 * minority of the city's population even though they are most of its area.
 * Making everyone pay 0.63 MB on first paint for a layer most will never open
 * would be the wrong trade in a city where the network is the first thing a
 * storm takes.
 *
 * Cached after the first fetch, so toggling it costs nothing thereafter.
 *
 * DELIBERATELY NOT IN THE OFFLINE PACK. `?url` puts it under /assets/, which
 * the service worker serves cache-first, so opening the layer once while
 * online keeps it available with the network down — the behaviour someone
 * who uses it actually wants. Adding it to the saved pack would instead grow
 * "Davao City and all three scenarios" by a third for every user, including
 * the majority on the coastal plain who will never open it. Opt-in data
 * should not be in a pack whose size is quoted up front.
 */
export const LANDSLIDE_URL = url;

export const EMPTY: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

let cache: GeoJSON.FeatureCollection | null = null;
let inflight: Promise<GeoJSON.FeatureCollection> | null = null;

export async function loadLandslide(): Promise<GeoJSON.FeatureCollection> {
  if (cache) return cache;
  // a second toggle while the first fetch is still in the air joins it rather
  // than starting another 3 MB download
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(LANDSLIDE_URL);
    if (!res.ok) {
      throw new Error(`Could not load the landslide data (${res.status})`);
    }
    /* No smoothing pass, unlike the flood collection. Corner-cutting exists
       there because those polygons are extruded into volumes whose walls show
       every vertex; this layer is drawn flat and is already simplified harder
       at build time. */
    const fc = (await res.json()) as GeoJSON.FeatureCollection;
    cache = fc;
    return fc;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
