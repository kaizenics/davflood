# NaboFlood

A free flood hazard map for Panabo City, Davao del Norte. It shows how deep water is expected
to get in each barangay during a storm of a given severity — for an ordinary flood, a bad one,
and the worst one in the model.

> **NaboFlood is a hazard map, not a flood sensor.** It shows modelled risk, not water on the
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

`@naboflood/hazard` is the single source of truth for anything both surfaces need: the UP NOAH
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

The hazard polygons currently shipped are **synthetic placeholders**, generated so the app is
fully functional while the real UP NOAH dataset is obtained. They are not a description of real
flood risk, and the app says so in three places.

```bash
pnpm generate:data     # regenerate the placeholder dataset (deterministic)
pnpm validate:style    # validate the map style against the MapLibre spec
```

Swapping in real data means producing GeoJSON that satisfies `HazardProperties` in
`packages/hazard/src/schema.ts`, then flipping `DATA_IS_PLACEHOLDER`. No component changes.

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

NaboFlood is an independent project and is not affiliated with the City Government of Panabo,
PAGASA, the OCD, or the University of the Philippines.
