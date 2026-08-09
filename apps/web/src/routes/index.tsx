import { BARANGAYS_MAPPED } from "@davflood/hazard/barangays";
import { footprintOf, formatArea } from "@davflood/hazard/footprint";
import { CAMERA } from "@davflood/hazard/geo";
import type { LngLat } from "@davflood/hazard/geo";
import { formatDepth } from "@davflood/hazard/schema";
import type { HazardCollection, HazardProperties } from "@davflood/hazard/schema";
import { DEFAULT_SCENARIO, scenarioByYears } from "@davflood/hazard/scenarios";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  ChevronUp,
  Construction,
  MousePointerClick,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CityReading } from "@/components/map/city-reading";
import { FloodMap, type FloodMapHandle } from "@/components/map/flood-map";
import { MapControls } from "@/components/map/map-controls";
import { MapViewDrawer } from "@/components/map/map-view-drawer";
import { MapViewSheet } from "@/components/map/map-view-sheet";
import { RainfallPanel } from "@/components/map/rainfall-panel";
import { ReadingSlot } from "@/components/map/reading-slot";
import { ScenarioToggle } from "@/components/map/scenario-toggle";
import { FloodNews } from "@/components/map/flood-news";
import { NewsDialog } from "@/components/map/news-dialog";
import type { NewsPin } from "@/components/map/news-pin";
import { RainLegend } from "@/components/map/rain-legend";
import { RiverPanel } from "@/components/map/river-panel";
import { useNewsPins } from "@/hooks/use-news-pins";
import { useRainGrid } from "@/hooks/use-rain-grid";
import { useBottomSheet } from "@/lib/bottom-sheet";
import { DATA_IS_PLACEHOLDER, EMPTY, loadScenario } from "@/lib/hazard-source";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** `b` is the barangay name, carried only so the pin can be labelled. */
type Search = { lng?: number; lat?: number; b?: string };

export const Route = createFileRoute("/")({
  component: MapScreen,
  validateSearch: (search: Record<string, unknown>): Search => ({
    lng: typeof search.lng === "number" ? search.lng : undefined,
    lat: typeof search.lat === "number" ? search.lat : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
});

function MapScreen() {
  const { lng, lat, b } = Route.useSearch();
  const navigate = Route.useNavigate();
  const mapRef = useRef<FloodMapHandle>(null);

  const [scenario, setScenario] = useState<ScenarioYears>(DEFAULT_SCENARIO);
  const [selected, setSelected] = useState<HazardProperties | null>(null);
  const [terrain, setTerrain] = useState(true);
  const [view, setView] = useState<"map" | "satellite">("map");
  const { theme } = useTheme();
  // satellite overrides the theme; otherwise the basemap follows it
  const basemap = view === "satellite" ? "satellite" : theme;
  const [showHazard, setShowHazard] = useState(true);
  // depth extrusion on by default — it is the app's "3D" and degrades to a
  // flat-looking top face when the camera is not pitched
  const [extrude, setExtrude] = useState(true);
  // mirrors the camera; updated by slider, presets AND drag gestures alike
  const [pitch, setPitch] = useState<number>(CAMERA.pitch);

  // maplibre needs a DOM and a WebGL context, neither of which exists during
  // prerendering — so the map only mounts on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // hazard data is fetched per scenario rather than bundled — see
  // lib/hazard-source.ts for why
  const [data, setData] = useState<HazardCollection>(EMPTY);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setDataError(null);
    loadScenario(scenario)
      .then((fc) => {
        if (live) setData(fc);
      })
      .catch((err: unknown) => {
        if (live) setDataError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      live = false;
    };
  }, [scenario]);

  const activeScenario = scenarioByYears[scenario];

  /* ~10k polygons at the 100-year return period; a shoelace pass over them is
     sub-frame, but it has no business re-running on an unrelated render.
     Measured here rather than inside the reading because the collapsed mobile
     sheet shows the same figure, and it should only ever be computed once. */
  const footprint = useMemo(() => footprintOf(data), [data]);

  /* The URL is the whole state of "take me to this barangay" — the map flies
     and pins from this prop rather than an imperative call, because the map
     is not loaded yet at the moment the link lands and would drop it. */
  const focus = useMemo(
    () =>
      typeof lng === "number" && typeof lat === "number"
        ? { center: [lng, lat] as LngLat, name: b }
        : null,
    [lng, lat, b],
  );

  // a zone selected under one scenario may not exist under another
  useEffect(() => setSelected(null), [scenario]);

  /* The panel is a drag-to-open sheet below lg and the static column above it;
     `open` is inert at desktop widths, where the classes never apply. */
  const sheet = useBottomSheet();

  /* Tapping a zone is a question, and on a phone the answer lives inside a
     collapsed sheet. Open it — otherwise the tap appears to do nothing. */
  const { setOpen: setSheetOpen } = sheet;
  useEffect(() => {
    if (selected) setSheetOpen(true);
  }, [selected, setSheetOpen]);

  /* Phones reach the map-view controls from the map; desktop from the panel. */
  const [mapViewOpen, setMapViewOpen] = useState(false);

  /* Off by default: it is weather, the hazard map is the point, and the
     request only goes out once someone asks for it. */
  const [showRain, setShowRain] = useState(false);
  const { data: rainGrid } = useRainGrid(showRain);

  /* Places named in recent flood reporting. On by default — unlike the rain
     layer this costs no extra request (the panel already has the file) and
     it is the only thing here describing flooding that actually happened. */
  const [showNews, setShowNews] = useState(true);
  const newsPins = useNewsPins();
  const [openNews, setOpenNews] = useState<NewsPin | null>(null);

  /* The slider is the camera's mirror, so both have to move together. */
  const setPitchEverywhere = (p: number, animate: boolean) => {
    setPitch(p);
    mapRef.current?.setPitch(p, animate);
  };

  return (
    <div className="absolute inset-0 lg:flex lg:flex-row">
      {/* On a phone the sheet covers the map while it is open, so tapping the
          scrim is the fastest way back to the map. */}
      {sheet.open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Collapse the panel"
          onClick={() => sheet.setOpen(false)}
          className="fixed inset-0 z-20 cursor-default bg-black/40 lg:hidden"
        />
      )}

      {/* ── panel ────────────────────────────────────────────
          Ordered by consequence, not by category: which storm,
          what it does, what is at the place you tapped, then —
          folded away — how the map is drawn.

          One element, two shapes. Below lg it is a draggable bottom
          sheet over a full-bleed map; from lg up it is the static
          left column it has always been. Same DOM either way, so the
          panel is never built twice and never flashes on hydration. */}
      <aside
        ref={sheet.ref}
        data-open={sheet.open}
        className={cn(
          // `nf-sheet` owns position, height and the open/closed transform
          // below lg — see app.css for why that is hand-written CSS
          "nf-sheet border-hairline bg-deep/95 lg:bg-deep/40 flex min-w-0 flex-col backdrop-blur-xl",
          "lg:h-full lg:w-[21rem] lg:border-r lg:backdrop-blur-none xl:w-[23rem]",
        )}
      >
        {/* The grab handle — and, collapsed, the only part of the panel on
            screen, so it carries the reading rather than being decoration. */}
        <button
          type="button"
          {...sheet.handleProps}
          aria-expanded={sheet.open}
          aria-label={sheet.open ? "Collapse the panel" : "Expand the panel"}
          className="flex h-[60px] w-full shrink-0 cursor-grab touch-none flex-col items-center justify-center gap-1.5 px-5 active:cursor-grabbing lg:hidden"
        >
          <span
            className="bg-hairline h-1 w-9 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <span className="flex w-full items-center gap-2">
            <span className="text-ink min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold">
              {selected
                ? `Brgy. ${selected.barangay} · ${formatDepth(selected)}`
                : footprint.zones > 0
                  ? `About ${formatArea(footprint.totalKm2)} km² floods · ${activeScenario.label}`
                  : `${activeScenario.label} storm`}
            </span>
            <ChevronUp
              className={cn(
                "text-ink-dim size-4 shrink-0 transition-transform",
                sheet.open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </span>
        </button>

        {/* scroll area — the footer below is pinned, so long content
            can never collide with it */}
        <div className="divide-hairline/60 min-h-0 flex-1 divide-y overflow-y-auto">
          {DATA_IS_PLACEHOLDER && (
            <p className="text-haz-med bg-haz-med/10 flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold">
              <Construction className="size-3.5 shrink-0" aria-hidden="true" />
              Placeholder data — not real hazard information
            </p>
          )}

          {/* The scenario governs everything below it, so it sits above
              everything below it — and states its own consequence rather
              than being labelled "Scenario". */}
          <div className="px-5 py-4">
            <ScenarioToggle value={scenario} onChange={setScenario} />
          </div>

          {dataError && (
            <p className="text-haz-high bg-haz-high/10 px-5 py-2.5 text-[11px] font-semibold">
              Hazard data failed to load — {dataError}
            </p>
          )}

          {/* ONE reading slot, two scales. Tapping a zone narrows the
              question from "the city" to "this place"; going back widens
              it again. Both answer "how deep does it get here". */}
          {/* The hint lives inside the slot rather than beside it: it belongs
              to the city-wide state and has to leave with it, otherwise it
              disappears on its own while the reading is still animating. Its
              divider is written out because it is no longer a direct child of
              the divide-y column. */}
          <ReadingSlot zone={selected} onClose={() => setSelected(null)}>
            <CityReading
              footprint={footprint}
              scenario={activeScenario}
              dimmed={!showHazard}
            />
            <p className="text-ink-dim border-hairline/60 flex items-start gap-2.5 border-t px-5 py-3 text-[11.5px] leading-relaxed">
              <MousePointerClick
                className="mt-px size-3.5 shrink-0 opacity-70"
                aria-hidden="true"
              />
              Tap a coloured zone for the expected depth at that spot.
            </p>
          </ReadingSlot>

          <div className="px-5 py-3.5">
            <RainfallPanel />
          </div>

          {/* Rain that already fell upstream and is on its way down — the one
              thing local rainfall cannot show. */}
          <div className="px-5 py-3.5">
            <RiverPanel />
          </div>

          {/* Renders nothing until CI has published a file, which is the
              normal state on a fresh deploy. */}
          <div className="empty:hidden [&>*]:px-5 [&>*]:py-3.5">
            <FloodNews />
          </div>

          {/* Desktop only: on a phone these live on the map itself, one tap
              from the thing they change — see MapViewSheet. */}
          <div className="hidden lg:block">
            <MapViewDrawer
              basemap={view}
              onBasemapChange={setView}
              showHazard={showHazard}
              onShowHazardChange={setShowHazard}
              extrude={extrude}
              onExtrudeChange={setExtrude}
              showRain={showRain}
              onShowRainChange={setShowRain}
              showNews={showNews}
              onShowNewsChange={setShowNews}
              newsCount={newsPins.length}
              pitch={pitch}
              onPitchChange={setPitchEverywhere}
            />
          </div>

          {/* The other way in. Hunting for your own barangay by panning a
              city 53 km across is the hard path; this is the easy one, and
              it was previously only reachable from the top nav. */}
          <Link
            to="/barangays"
            className="group hover:bg-raised/40 flex items-center gap-2.5 px-5 py-3.5 transition"
          >
            <Search
              className="text-ink-dim size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="text-ink block text-[12.5px] font-semibold">
                Find your barangay
              </span>
              <span className="text-ink-dim block text-[11px]">
                Search all {BARANGAYS_MAPPED} and fly straight to it
              </span>
            </span>
            <ChevronRight
              className="text-ink-dim group-hover:text-ink size-4 shrink-0 transition"
              aria-hidden="true"
            />
          </Link>
        </div>

      </aside>

      {/* ── map ────────────────────────────────────────────
          Full-bleed under the sheet on a phone — the sheet is
          fixed, so it takes no space out of the flow and the map
          gets the whole screen. */}
      <div className="absolute inset-0 lg:relative lg:order-2 lg:h-full lg:flex-1">
        {mounted ? (
          <FloodMap
            ref={mapRef}
            scenario={scenario}
            data={data}
            selectedZoneId={selected?.zone_id ?? null}
            onSelect={setSelected}
            terrain={terrain}
            basemap={basemap}
            showHazard={showHazard}
            extrude={extrude}
            onPitchChange={setPitch}
            focus={focus}
            onFocusClear={() =>
              navigate({ to: "/", search: {}, replace: true })
            }
            rain={rainGrid?.cells}
            showRain={showRain}
            newsPins={newsPins}
            showNews={showNews}
            onOpenNews={setOpenNews}
          />
        ) : (
          <div className="bg-abyss absolute inset-0" />
        )}

        {/* Top-left: clear of the control stack on the right, and above the
            sheet on a phone. Only while the layer it explains is on. */}
        {showRain && (
          <div className="absolute top-4 left-4">
            <RainLegend grid={rainGrid} theme={basemap === "light" ? "light" : "dark"} />
          </div>
        )}

        <div className="absolute top-4 right-4">
          <MapControls
            onLocate={(center) => mapRef.current?.flyTo(center, 15)}
            onReset={() => mapRef.current?.resetCamera()}
            terrain={terrain}
            onToggleTerrain={() => setTerrain((v) => !v)}
            onOpenMapView={() => setMapViewOpen((v) => !v)}
            mapViewOpen={mapViewOpen}
          />
        </div>
      </div>

      <MapViewSheet
        open={mapViewOpen}
        onClose={() => setMapViewOpen(false)}
        basemap={view}
        onBasemapChange={setView}
        showHazard={showHazard}
        onShowHazardChange={setShowHazard}
        extrude={extrude}
        onExtrudeChange={setExtrude}
        showRain={showRain}
        onShowRainChange={setShowRain}
        showNews={showNews}
        onShowNewsChange={setShowNews}
        newsCount={newsPins.length}
        pitch={pitch}
        onPitchChange={setPitchEverywhere}
      />

      {openNews && (
        <NewsDialog pin={openNews} onClose={() => setOpenNews(null)} />
      )}
    </div>
  );
}
