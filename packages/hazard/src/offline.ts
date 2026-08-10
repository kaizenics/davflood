import { OFFLINE_PACK } from "./geo";
import type { BBox } from "./geo";

/**
 * Which tiles make up "Davao City, saved for offline".
 *
 * Domain rather than app code because the extent and the zoom range are
 * geography — the same numbers the offline pack has always been defined by in
 * ./geo.
 */

/** Slippy-map tile coordinates for a bbox at one zoom. */
export function tilesForBBox(
  [w, s, e, n]: BBox,
  zoom: number,
): { z: number; x: number; y: number }[] {
  const scale = 2 ** zoom;
  const lonToX = (lon: number) => Math.floor(((lon + 180) / 360) * scale);
  const latToY = (lat: number) => {
    const rad = (lat * Math.PI) / 180;
    return Math.floor(
      ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale,
    );
  };

  const out: { z: number; x: number; y: number }[] = [];
  // y is inverted: north is the smaller index
  for (let x = lonToX(w); x <= lonToX(e); x++) {
    for (let y = latToY(n); y <= latToY(s); y++) {
      out.push({ z: zoom, x, y });
    }
  }
  return out;
}

/**
 * The vector tiles for the city.
 *
 * Stops at 13, not the 14 the pack allows. Fourteen roughly quadruples the
 * count for detail that matters when you are standing in a street — and the
 * point of saving this is knowing which streets to avoid before you leave the
 * house. Anything finer still works online, and whatever gets looked at is
 * cached as it is viewed.
 */
export function offlineTileUrls(maxZoom = 13): string[] {
  const urls: string[] = [];
  for (let z = OFFLINE_PACK.minZoom; z <= maxZoom; z++) {
    for (const t of tilesForBBox(OFFLINE_PACK.bounds as BBox, z)) {
      urls.push(`https://tiles.openfreemap.org/planet/${t.z}/${t.x}/${t.y}.pbf`);
    }
  }
  return urls;
}

/** Rough, for telling someone what they are about to download. */
export function estimateMb(tileCount: number, hazardBytes: number): number {
  // vector tiles over a city average well under 30 KB; 25 is close enough to
  // be honest without pretending to precision
  return Math.round(((tileCount * 25_000 + hazardBytes) / 1_000_000) * 10) / 10;
}
