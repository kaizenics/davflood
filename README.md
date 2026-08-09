<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/brand/wordmark-dark.png">
  <img src=".github/brand/wordmark-light.png" alt="DavFlood" width="340">
</picture>

**A free flood hazard map for Davao City.**

How deep water is expected to get in each barangay during a storm of a given
severity — for an ordinary flood, a bad one, and the worst one in the model.

</div>

<img width="1901" height="854" alt="DavFlood showing the 25-year flood scenario over Davao City" src="https://github.com/user-attachments/assets/a8e14d7f-fbc3-46bb-94b7-491dfa514adc" />

> [!IMPORTANT]
> **DavFlood is a hazard map, not a flood sensor.** It shows modelled risk, not water on the
> ground right now. For live warnings, follow PAGASA and your barangay's DRRM office.

## What it shows

**Three scenarios.** The 5, 25 and 100-year return periods from the UP NOAH model. Switching
between them changes the whole reading, so the panel leads with the consequence rather than the
label: *about 73 km² of Davao City floods in a 25-year storm*, split across the three depth
bands by area and share.

**Depth, in words as well as colour.** Ankle-to-knee, waist-to-chest, above-head-height — every
zone carries its band in text, because roughly 8% of men have a colour vision deficiency and
this is safety information, not decoration. Tap a zone for its expected depth, what it looks
like at your front door, and what to do.

**183 barangays, searchable.** Pick one and the map flies to it and drops a pin, rather than
leaving you to find it by panning a city 53 km across.

**Depth in 3D.** Zones stand up by their expected depth over real terrain, so a tilted view
reads as volumes of water rather than flat paint.

## Live conditions

Three signals sit alongside the hazard model. None of them claims anywhere is flooded — that is
a statement about the present that no model can make without an observer, and inventing it
would undo the one thing this app is for.

**Rain falling now.** A toggleable layer of ~8 km cells coloured by intensity, using PAGASA's
own mm/h bands so the legend agrees with the advisory on the radio. Deliberately square and
coarse: that is the weather model's real resolution, and a smooth heatmap would imply
street-level precision that does not exist. Blue-to-violet, never the hazard ramp.

**The river.** GloFAS forecasts discharge from rainfall over the whole catchment, so it sees
water that fell upstream hours ago and is still on its way down — the case local rainfall cannot
cover, and the one that matters here. Reported against five years of daily history, as a
multiple of the median.

**In the news.** Recent flooding coverage for Davao City, refreshed by CI every half hour into
a file the site serves itself. Headlines are shown as published, attributed and dated, never
summarised — an app that paraphrases a flood report has invented a source.

## Workspaces

```
apps/
  web         the app — TanStack Start (SPA + prerender), MapLibre GL
packages/
  hazard      domain: hazard tiers, geography, barangays, map style, weather, data
  config      shared tsconfig base
```

`@davflood/hazard` is the single source of truth for the domain: the UP NOAH hazard
classification, the design tokens, the map style and the attribution text. Safety and licence
copy lives there so it stays in one place rather than scattered through the UI.

## Getting started

```bash
pnpm install
pnpm dev      # the app -> http://localhost:3001
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

### News

```bash
pnpm --filter @davflood/hazard exec tsx scripts/build-flood-news.ts apps/web/public/flood-news.json
```

Run from CI by `.github/workflows/flood-news.yml`, not from the browser: the sources send no
`access-control-allow-origin`, and GDELT rate-limits to roughly one request every five seconds,
which a page opened by many people during a storm would exhaust instantly. One caller on a
schedule instead of one per visitor. Google News carries the local desks; GDELT is best-effort
behind it, and ReliefWeb joins in if `RELIEFWEB_APPNAME` is set (its API refuses unregistered
callers).

## Deployment

`apps/web` builds to static files — there is no server. Every route's data is either bundled
(hazard polygons) or fetched client-side from a keyless public API (rainfall, river), so nothing
is computed per request and hosting stays free.

```bash
pnpm build          # -> apps/web/dist/client
```

`dist/client/index.html` is both the `/` document and the SPA fallback; `/about`, `/learn` and
`/barangays` are prerendered to real HTML. Point any static host at `dist/client`.

A visit costs about 500 KB over the wire — the shell plus one scenario's polygons. Basemap
tiles, terrain, imagery and weather all come from third parties the browser talks to directly,
so they never touch the host's bandwidth.

> [!WARNING]
> Verify against the built output, not the dev server. Two production-only faults have shipped
> from here already: a `"sideEffects": false` that tree-shook away MapLibre's worker setup, and
> a race that left the hazard source empty. Neither can occur under `pnpm dev`. Use
> `pnpm -F web serve`.

## Attribution

Hazard data © UP NOAH. Elevation from Phil-LiDAR / AWS Terrain Tiles. Map data ©
OpenStreetMap contributors (ODbL), served by OpenFreeMap. Satellite imagery © Esri, Maxar,
Earthstar Geographics. Rainfall and river discharge from Open-Meteo (CC BY 4.0), the latter
derived from Copernicus GloFAS.

Credits are shown on the map itself, via MapLibre's attribution control, because ODbL and Esri's
terms require them wherever the map is drawn — not merely somewhere on the site.

DavFlood is an independent project and is not affiliated with the City Government of Davao,
PAGASA, the OCD, or the University of the Philippines.

## License

[MIT](LICENSE) for the code. The data carries its own terms — see Attribution above.
