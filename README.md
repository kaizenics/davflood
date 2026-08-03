# DavFlood

A free flood hazard map for Davao City, Davao del Norte. It shows how deep water is expected
to get in each barangay during a storm of a given severity — for an ordinary flood, a bad one,
and the worst one in the model.

> **DavFlood is a hazard map, not a flood sensor.** It shows modelled risk, not water on the
> ground right now. For live warnings, follow PAGASA and your barangay's DRRM office.

## Workspaces

```
apps/
  web         the app — TanStack Start (SPA + prerender), MapLibre GL
  marketing   the public site — Astro, near-zero JS
packages/
  hazard      domain: hazard tiers, geography, barangays, map style, data
  config      shared tsconfig base
```

`@davflood/hazard` is the single source of truth for anything both surfaces need: the UP NOAH
hazard classification, the design tokens, the map style and the attribution text. Safety and
licence copy lives there so the app and the site cannot drift apart.

## Getting started

```bash
pnpm install
pnpm dev            # everything
pnpm dev:web        # the app   -> http://localhost:3001
pnpm dev:marketing  # the site  -> http://localhost:4321
```

## Data

The hazard polygons are the **real UP NOAH flood hazard model** for Davao del Norte, clipped to
Davao City — the 5, 25 and 100-year return periods, under ODC-ODbL.

Source: [Project NOAH hazard maps](https://huggingface.co/datasets/bettergovph/project-noah-hazard-maps),
per-province ESRI shapefiles. Already WGS84, with a single `Var` attribute (1 = low, 2 = medium,
3 = high) matching the tiers in `packages/hazard/src/tiers.ts`.

```bash
# rebuild from the shapefiles — download and unzip Flood/{5yr,25yr,100yr}/DavaoDelNorte.zip
pnpm --filter @davflood/hazard exec tsx scripts/build-noah-data.ts <dir>

pnpm validate:style    # validate every map style variant against the MapLibre spec
```

`build-noah-data.ts` carries its own shapefile reader, so no GDAL is needed. It simplifies to
~22 m and drops fragments under 0.25 ha — the raw export is raster-derived and otherwise runs to
40,000 sliver polygons and 32 MB.

`generate-synthetic.ts` still exists as a schema reference and fallback, but refuses to run
without `--force`: it would overwrite real hazard information with invented shapes.

**It is still a model.** Real data means the polygons come from the national hazard assessment —
not that they describe water on the ground right now. Barangay attribution on a tapped zone is
nearest-centroid against the unsurveyed coordinates in `barangays.ts`, so it can be wrong near
boundaries; the geometry and depth bands are not.

## Deployment

`apps/web` builds to static files — there is no server. Every route's data is either bundled
(hazard polygons) or fetched client-side from a keyless public API (rainfall), so nothing is
computed per request and hosting stays free.

```bash
pnpm build          # -> apps/web/dist/client
```

`dist/client/index.html` is both the `/` document and the SPA fallback; `/about`, `/learn` and
`/barangays` are prerendered to real HTML. Point any static host at `dist/client`.

## Attribution

Hazard data © UP NOAH. Elevation from Phil-LiDAR / AWS Terrain Tiles. Map data ©
OpenStreetMap contributors (ODbL), served by OpenFreeMap. Rainfall from Open-Meteo (CC BY 4.0).

DavFlood is an independent project and is not affiliated with the City Government of Davao,
PAGASA, the OCD, or the University of the Philippines.
