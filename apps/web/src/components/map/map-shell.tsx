import { BARANGAYS_MAPPED } from "@davflood/hazard/barangays";
import { footprintOf, formatArea } from "@davflood/hazard/footprint";
import { CAMERA } from "@davflood/hazard/geo";
import type { LngLat } from "@davflood/hazard/geo";
import { formatDepth } from "@davflood/hazard/schema";
import type { HazardProperties } from "@davflood/hazard/schema";
import { DEFAULT_SCENARIO, scenarioByYears } from "@davflood/hazard/scenarios";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { nearestEvacuation } from "@davflood/hazard/evacuation";
import type { OutlookPlace } from "@davflood/hazard/outlook";
import { zoneAt } from "@davflood/hazard/place";
import { nearestSafeGround } from "@davflood/hazard/safe-ground";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronRight,
  ChevronUp,
  Construction,
  MousePointerClick,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DATA_IS_PLACEHOLDER } from "@/lib/hazard-source";
import { useImmersive } from "@/hooks/use-immersive";
import {
  useLandslideData,
  useScenarioData,
} from "@/hooks/use-hazard-layers";
import { BarangayCard } from "@/components/map/barangay-card";
import { CityReading } from "@/components/map/city-reading";
import { FloodMap, type FloodMapHandle, type Guide } from "@/components/map/flood-map";
import { FloodNews } from "@/components/map/flood-news";
import { MapControls } from "@/components/map/map-controls";
import { MapViewButton } from "@/components/map/map-view-button";
import { MapViewSheet } from "@/components/map/map-view-sheet";
import { NewsDialog } from "@/components/map/news-dialog";
import type { NewsPin } from "@/components/map/news-pin";
import { OfflinePanel } from "@/components/map/offline-panel";
import { FloodOutlook } from "@/components/map/flood-outlook";
import { LandslideLegend } from "@/components/map/landslide-legend";
import { RainLegend } from "@/components/map/rain-legend";
import { SavedPlaceCard } from "@/components/map/saved-place";
import { RainfallPanel } from "@/components/map/rainfall-panel";
import { ReadingSlot } from "@/components/map/reading-slot";
import { RiverPanel } from "@/components/map/river-panel";
import { ScenarioToggle } from "@/components/map/scenario-toggle";
import { SidebarNav } from "@/components/site-nav";
import { useStrings } from "@/lib/locale";
import { useSavedPlace } from "@/lib/saved-place";
import { useNewsPins } from "@/hooks/use-news-pins";
import { useRainGrid } from "@/hooks/use-rain-grid";
import { useBottomSheet } from "@/lib/bottom-sheet";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * One screen, four pages.
 *
 * DavFlood is a map, so the map does not go away when you read about it. Every
 * route renders into the same column beside the same live map: the barangay
 * search, the reports, the hazard reference and the sources are panels, not
 * destinations. The URLs are unchanged and every page is still its own page —
 * what changes is that leaving the map no longer means losing it.
 *
 * This lives above the router (see routes/__root.tsx) because that is the only
 * place a MapLibre instance can survive a navigation. Unmounting and
 * remounting it would re-download the terrain, the basemap tiles and the
 * hazard geometry every time someone tapped "Reports".
 *
 * Below lg there is no room for a column beside anything: the map keeps its
 * bottom sheet, and the document pages are ordinary full-screen pages with the
 * header on top.
 */
export function MapShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMap = pathname === "/";
  const strings = useStrings();

  /* The map's own state lives in the URL (see routes/index.tsx), and is read
     here rather than there because here is where the map is. Untyped because
     this sits above the route that declares the shape. */
  const search = useRouterState({ select: (s) => s.location.search }) as {
    lng?: number;
    lat?: number;
    b?: string;
  };
  const { lng, lat, b } = search;
  const navigate = useNavigate();
  const mapRef = useRef<FloodMapHandle>(null);

  const [scenario, setScenario] = useState<ScenarioYears>(DEFAULT_SCENARIO);
  const [selected, setSelected] = useState<HazardProperties | null>(null);
  const [terrain, setTerrain] = useState(true);
  const [view, setView] = useState<"map" | "satellite">("satellite");
  const { theme } = useTheme();
  // satellite overrides the theme; otherwise the basemap follows it
  const basemap = view === "satellite" ? "satellite" : theme;
  const [showHazard, setShowHazard] = useState(true);
  /* Flat by default, 3D on request.
     The extruded volumes answer "how deep" beautifully at street zoom and get
     in the way everywhere else: at city zoom they lean across the streets
     they describe, and the map opens at z10.2 on the 100-year footprint,
     which is the densest set there is. A first-time reader should meet the
     footprint — where floods — before the depth of it. */
  const [extrude, setExtrude] = useState(false);
  // mirrors the camera; updated by slider, presets AND drag gestures alike
  const [pitch, setPitch] = useState<number>(CAMERA.pitch);

  // maplibre needs a DOM and a WebGL context, neither of which exists during
  // prerendering — so the map only mounts on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* On a phone a document page is the whole screen, so there is nothing for
     the map to be beside — mounting it there would download tiles for a map
     nobody can see. Measured rather than guessed from the CSS because this
     decides whether the map exists at all, not how it looks. */
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const showMap = mounted && (isMap || wide);

  // hazard data is fetched per scenario rather than bundled — see
  // lib/hazard-source.ts for why
  const { data, error: dataError } = useScenarioData(scenario);

  const activeScenario = scenarioByYears[scenario];

  /* ~10k polygons at the 100-year return period; a shoelace pass over them is
     sub-frame, but it has no business re-running on an unrelated render.
     Measured here rather than inside the reading because the collapsed mobile
     sheet shows the same figure, and it should only ever be computed once. */
  const footprint = useMemo(() => footprintOf(data), [data]);

  /**
   * Back to the top whenever the column changes what it is showing.
   *
   * One scroll container serves every route — the barangay list, the map
   * panel, the profile pages all render into it — which is what keeps the map
   * alive beside them instead of remounting. The cost is that the scroll
   * offset is shared too: picking a barangay from 183 rows meant arriving at
   * the map panel already scrolled most of the way down it, with the answer
   * to the thing just clicked somewhere above the viewport.
   *
   * Keyed on the barangay as well as the path, because choosing a different
   * barangay from the map does not change the route and would otherwise leave
   * the reader wherever the last one had them.
   */
  const scrollArea = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollArea.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, b]);

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

  /* Where the tap landed, which is where the way out is measured from — the
     zone's own geometry cannot say, since a zone can be kilometres long. */
  const [selectedAt, setSelectedAt] = useState<LngLat | null>(null);

  /**
   * Ground height at the tap, read straight off the DEM the 3D view already
   * loaded — no request, works offline, costs nothing.
   *
   * Not derived, because it cannot be: the answer depends on whether the DEM
   * tiles covering that point have arrived, which is a fact about the network
   * rather than about the tap. Hence the retry — the first query right after
   * a tap on ground that has just scrolled into view often lands before the
   * tiles do, and a permanently blank reading would be wrong rather than
   * merely late.
   */
  const [elevation, setElevation] = useState<number | null>(null);
  useEffect(() => {
    if (!selectedAt || !terrain) {
      setElevation(null);
      return;
    }

    const read = () => mapRef.current?.elevationAt(selectedAt) ?? null;

    const first = read();
    setElevation(first);
    if (first !== null) return;

    const t = setTimeout(() => setElevation(read()), 600);
    return () => clearTimeout(t);
  }, [selectedAt, terrain]);

  const safeGround = useMemo(
    () => (selectedAt ? nearestSafeGround(data, selectedAt) : null),
    [data, selectedAt],
  );

  /* Somewhere to actually go, rather than a direction to walk in. Keyed on the
     scenario because a building that is dry in a 25-year storm may not be in a
     100-year one, and offering it anyway would be the worst kind of wrong. */
  const evacuation = useMemo(
    () => (selectedAt ? nearestEvacuation(selectedAt, scenario) : null),
    [selectedAt, scenario],
  );

  /* What the outlook line is about: the tapped zone when there is one, the
     city otherwise. Named here rather than inside the component so the
     component stays a pure renderer of a sentence it did not compose. */
  const { place: savedPlace, save: savePlace } = useSavedPlace();

  /* The tapped point is already the saved one when the two coordinates match,
     and offering to save it again would put two pins on one spot. */
  const tapIsSaved =
    !!savedPlace &&
    !!selectedAt &&
    Math.abs(savedPlace.center[0] - selectedAt[0]) < 1e-6 &&
    Math.abs(savedPlace.center[1] - selectedAt[1]) < 1e-6;

  /* The saved place, read against the scenario currently showing. Null both
     when nothing is saved and when the model leaves that spot dry, and those
     two mean different things — see the card, which says so. */
  const savedZone = useMemo(
    () => (savedPlace ? zoneAt(data, savedPlace.center) : null),
    [data, savedPlace],
  );

  const outlookPlace = useMemo<OutlookPlace>(() => {
    /* Precedence is "what is the reader looking at right now": a tapped zone
       beats a saved one, because they just asked about it. The saved place
       only speaks when nothing else is. */
    if (selected) {
      return {
        kind: "zone",
        hazard: selected.hazard,
        barangay: selected.barangay,
      };
    }
    if (savedPlace && savedZone) {
      return {
        kind: "zone",
        hazard: savedZone.hazard,
        barangay: savedPlace.label,
      };
    }
    return { kind: "city", floodedKm2: footprint.totalKm2 };
  }, [selected, savedPlace, savedZone, footprint.totalKm2]);

  /* The pin dropped on our own map, on somewhere to go. Held here rather than
     derived, because it is the answer to a button press — it should not
     appear the moment a zone is tapped, and it should not vanish because the
     reading animated. */
  const [guide, setGuide] = useState<Guide | null>(null);

  /* The panel is a drag-to-open sheet below lg and the static column above it;
     `open` is inert at desktop widths, where the classes never apply. */
  const sheet = useBottomSheet();

  const showEvacuation = () => {
    if (!selectedAt || !evacuation) return;
    setGuide({
      to: evacuation.site.center,
      label: evacuation.site.name,
    });
    /* Keep the framing clear of the floating reading, which from lg up sits
       over the left edge of the map the pin is being dropped on. */
    const cardWidth = window.innerWidth >= 1024 ? 380 : 70;
    mapRef.current?.fitTo(selectedAt, evacuation.site.center, cardWidth);
    // on a phone the sheet is over the map it just drew on
    sheet.setOpen(false);
  };

  // a zone selected under one scenario may not exist under another
  useEffect(() => {
    setSelected(null);
    setSelectedAt(null);
    setGuide(null);
  }, [scenario]);

  /* A line to a shelter for a zone you are no longer looking at is a line to
     nowhere, so it goes when the reading does. */
  useEffect(() => {
    if (!selected) setGuide(null);
  }, [selected]);

  /* Tapping a zone is a question, and on a phone the answer lives inside a
     collapsed sheet. Open it — otherwise the tap appears to do nothing.

     Map-only mode hides that sheet entirely, so a tap there would be swallowed
     the same way, only worse: the panel is not merely closed, it is gone. A
     tap on a zone is a request for the reading, so it takes precedence over
     the mode and brings the chrome back. */
  const { setOpen: setSheetOpen } = sheet;
  useEffect(() => {
    if (!selected) return;
    setSheetOpen(true);
    setImmersive(false);
  }, [selected, setSheetOpen]);

  /* Phones reach the map-view controls from the map; desktop from the panel. */
  const [mapViewOpen, setMapViewOpen] = useState(false);

  const [immersive, setImmersive] = useImmersive(isMap, () =>
    setMapViewOpen(false),
  );

  /* Off by default: it is weather, the hazard map is the point, and the
     request only goes out once someone asks for it. */
  const [showRain, setShowRain] = useState(false);
  const { data: rainGrid } = useRainGrid(showRain);

  /**
   * Landslide susceptibility, fetched the first time it is asked for.
   *
   * Same shape as the rain toggle and for the same reason — 0.63 MB that most
   * readers never need should not be on the critical path of a map somebody
   * opened in a storm. A failure is swallowed: the switch goes back off and
   * the flood map, which is the thing that matters, is untouched.
   */
  const [showLandslide, setShowLandslide] = useState(false);
  const { data: landslide, loading: landslideLoading } = useLandslideData(
    showLandslide,
    () => setShowLandslide(false),
  );

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

  /**
   * The reading, built once and placed twice.
   *
   * From lg up it floats over the map, because the answer belongs beside the
   * thing it describes — you tap a zone and read it without your eye leaving
   * the map. On a phone there is no room to float anything: the sheet already
   * solves this, and a card over a 390px map would be the map.
   *
   * Only ever one of the two is rendered — the other is display:none, so it is
   * out of the accessibility tree as well as out of sight.
   */
  const reading = (
    <>
      {/* Above the reading, outside the slot: the slot animates its contents
          on every zone change, and the one line that is about *today* should
          not slide in and out because the user tapped a different polygon. */}
      <FloodOutlook place={outlookPlace} scenario={scenario} />
      <ReadingSlot
        zone={selected}
        at={selectedAt}
        onClose={() => {
          setSelected(null);
          setSelectedAt(null);
        }}
        elevation={elevation}
      safeGround={safeGround}
        onShowSafeGround={
          safeGround
            ? () => mapRef.current?.flyTo(safeGround.center, 15)
            : undefined
        }
        evacuation={evacuation}
        onShowEvacuation={evacuation ? showEvacuation : undefined}
      >
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
    </>
  );

  return (
    <div className="absolute inset-0 lg:flex lg:flex-row">
      {/* On a phone the sheet covers the map while it is open, so tapping the
          scrim is the fastest way back to the map. */}
      {isMap && sheet.open && !immersive && (
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

          One element, three shapes. On the map below lg it is a draggable
          bottom sheet over a full-bleed map; on a document page below lg it
          is the page itself; from lg up it is the left column either way, so
          the wordmark and the links never move between routes. */}
      <aside
        ref={isMap ? sheet.ref : undefined}
        data-open={sheet.open}
        /* `display: none` cannot be transitioned, so map-only mode is a
           data attribute and .nf-chrome-panel animates it out — left as a
           column above lg, downward as a sheet below it. See app.css. */
        data-hidden={immersive || undefined}
        inert={immersive || undefined}
        className={cn(
          "nf-chrome-panel",
          "border-hairline bg-deep/95 lg:bg-deep/40 flex min-w-0 flex-col backdrop-blur-xl",
          // `nf-sheet` owns position, height and the open/closed transform
          // below lg — see app.css for why that is hand-written CSS
          isMap ? "nf-sheet" : "absolute inset-0",
          "lg:relative lg:inset-auto lg:h-full lg:w-[26rem] lg:border-r lg:backdrop-blur-none xl:w-[29rem]",
        )}
      >
        {/* The grab handle — and, collapsed, the only part of the panel on
            screen, so it carries the reading rather than being decoration. */}
        {isMap && (
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
        )}

        <SidebarNav />

        {/* scroll area — one slot, whichever page you are on */}
        <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto">
          {isMap ? (
            <div className="divide-hairline/60 divide-y">
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

              {/* What the model says about the barangay just picked.
                  Above the reading slot: someone who arrived by choosing
                  their barangay came for this, and it should not be below the
                  city-wide answer they did not ask for. Also the only route
                  to those 183 profile pages now that the list flies to the
                  map instead of opening them. */}
              {b && (
                <BarangayCard
                  /* Remount per barangay: it replays the enter animation when
                     you pick a different one, and it clears the card's own
                     `closing` state, which would otherwise render the next
                     barangay already collapsed. */
                  key={b}
                  name={b}
                  scenario={scenario}
                  onClear={() =>
                    navigate({ to: "/", search: {}, replace: true })
                  }
                />
              )}

              {/* ONE reading slot, two scales. Tapping a zone narrows the
                  question from "the city" to "this place"; going back widens
                  it again. Both answer "how deep does it get here".

                  Below lg only — from lg up the same slot floats over the map. */}
              <div className="lg:hidden">{reading}</div>

              {/* Above the forecast panels: the model's answer about your own
                  house outranks the city-wide weather. Renders nothing until
                  something is saved. */}
              <SavedPlaceCard
                data={data}
                scenario={scenario}
                onShow={(p) => mapRef.current?.flyTo(p.center, 15)}
              />

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

              {/* The most useful thing here during a storm, so it sits with the
                  content rather than behind a disclosure. */}
              <OfflinePanel />

              {/* The other way in. Hunting for your own barangay by panning a
                  city 53 km across is the hard path; this is the easy one. */}
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
          ) : (
            children
          )}
        </div>
      </aside>

      {/* ── map ────────────────────────────────────────────
          Full-bleed under the sheet on a phone — the sheet is
          fixed, so it takes no space out of the flow and the map
          gets the whole screen. */}
      {(isMap || wide) && (
        <div className="absolute inset-0 lg:relative lg:order-2 lg:h-full lg:flex-1">
          {showMap ? (
            <FloodMap
              ref={mapRef}
              scenario={scenario}
              data={data}
              selectedZoneId={selected?.zone_id ?? null}
              onSelect={(zone, at) => {
                setSelected(zone);
                setSelectedAt(at);
              }}
              terrain={terrain}
              basemap={basemap}
              showHazard={showHazard}
              extrude={extrude}
              landslide={landslide}
              showLandslide={showLandslide}
              onPitchChange={setPitch}
              focus={focus}
              onFocusClear={() =>
                navigate({ to: "/", search: {}, replace: true })
              }
              guide={guide}
              savedPlace={
                savedPlace
                  ? { center: savedPlace.center, label: savedPlace.label }
                  : null
              }
              tapPoint={
                selectedAt && selected && !tapIsSaved
                  ? { center: selectedAt, label: strings.place.save }
                  : null
              }
              onSaveTapPoint={() => {
                if (!selectedAt || !selected) return;
                savePlace({
                  label: selected.barangay,
                  center: selectedAt,
                  barangay: selected.barangay,
                  savedOn: new Date().toISOString().slice(0, 10),
                });
              }}
              rain={rainGrid?.cells}
              showRain={showRain}
              newsPins={newsPins}
              showNews={showNews}
              onOpenNews={setOpenNews}
            />
          ) : (
            <div className="bg-abyss absolute inset-0" />
          )}

          {/* The reading, floating over the map from lg up.
              Its own surface, because it is no longer sitting on the panel's:
              a blurred card that reads over cartography, satellite imagery and
              the hazard ramp alike. It scrolls internally so a long reading can
              never grow past the map it belongs to.

              Only on the map route — a depth reading floating over the map
              while you are reading the sources is an answer to a question
              nobody is asking. */}
          {isMap && (
            <div
              data-hidden={immersive || undefined}
              inert={immersive || undefined}
              className="nf-chrome nf-chrome-reading border-hairline bg-deep/92 pointer-events-auto absolute top-4 left-4 z-10 hidden max-h-[calc(100%-2rem)] w-[21rem] overflow-x-hidden overflow-y-auto rounded-2xl border shadow-2xl backdrop-blur-xl lg:block"
            >
              {reading}
            </div>
          )}

          {/* Bottom-left, stacked: the reading floats top-left, the camera
              controls are top-right and the attribution is bottom-right, so this
              is the corner that is free. On a phone the legend goes back to the
              top-left, where the reading is down in the sheet. */}
          <div className="pointer-events-none absolute top-4 left-4 flex flex-col items-start gap-2 lg:top-auto lg:bottom-6">
            {showRain && (
              <RainLegend grid={rainGrid} theme={basemap === "light" ? "light" : "dark"} />
            )}
            {showLandslide && (
              <LandslideLegend
                theme={basemap === "light" ? "light" : "dark"}
                loading={landslideLoading}
              />
            )}
            {/* The legends deliberately stay in map-only mode.
                They are not chrome — they are what makes the colours on the
                map mean anything, and the landslide one carries the caveat
                that the purple is susceptibility rather than a forecast. A
                clean screenshot of an unexplained hazard overlay is exactly
                the artefact this app should not help anyone produce. Both
                are absent anyway unless their layer is switched on. */}
            <div
              data-hidden={immersive || undefined}
              inert={immersive || undefined}
              className="nf-chrome hidden lg:block"
            >
              <MapViewButton
                basemap={view}
                onBasemapChange={setView}
                showHazard={showHazard}
                onShowHazardChange={setShowHazard}
                extrude={extrude}
                onExtrudeChange={setExtrude}
                showRain={showRain}
                onShowRainChange={setShowRain}
                showLandslide={showLandslide}
                onShowLandslideChange={setShowLandslide}
                landslideLoading={landslideLoading}
                showNews={showNews}
                onShowNewsChange={setShowNews}
                newsCount={newsPins.length}
                pitch={pitch}
                onPitchChange={setPitchEverywhere}
              />
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <MapControls
              onLocate={(center) => mapRef.current?.flyTo(center, 15)}
              onReset={() => mapRef.current?.resetCamera()}
              terrain={terrain}
              onToggleTerrain={() => setTerrain((v) => !v)}
              onOpenMapView={() => setMapViewOpen((v) => !v)}
              mapViewOpen={mapViewOpen}
              immersive={immersive}
              onToggleImmersive={
                isMap ? () => setImmersive((v) => !v) : undefined
              }
            />
          </div>
        </div>
      )}

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
        showLandslide={showLandslide}
        onShowLandslideChange={setShowLandslide}
        landslideLoading={landslideLoading}
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
