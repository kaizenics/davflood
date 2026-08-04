import { disclaimer } from "@davflood/hazard/copy";
import { CAMERA } from "@davflood/hazard/geo";
import type { LngLat } from "@davflood/hazard/geo";
import type { HazardCollection, HazardProperties } from "@davflood/hazard/schema";
import { DEFAULT_SCENARIO, scenarioByYears } from "@davflood/hazard/scenarios";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Construction, MousePointerClick } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FloodMap, type FloodMapHandle } from "@/components/map/flood-map";
import { HazardLegend } from "@/components/map/hazard-legend";
import { MapControls } from "@/components/map/map-controls";
import { MapLayers } from "@/components/map/map-layers";
import { PitchControl } from "@/components/map/pitch-control";
import { RainfallPanel } from "@/components/map/rainfall-panel";
import { ScenarioToggle } from "@/components/map/scenario-toggle";
import { ZonePanel } from "@/components/map/zone-panel";
import { DATA_IS_PLACEHOLDER, EMPTY, loadScenario } from "@/lib/hazard-source";
import { useTheme } from "@/lib/theme";

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

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row">
      {/* ── sidebar ──────────────────────────────────────────
          One surface, divided by hairlines. Not a stack of
          separately-bordered cards. */}
      <aside className="border-hairline order-2 flex w-full min-w-0 shrink-0 flex-col border-t lg:order-1 lg:h-full lg:w-[21rem] lg:border-t-0 lg:border-r xl:w-[23rem]">
        {/* scroll area — the footer below is pinned, so long content
            can never collide with it */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {DATA_IS_PLACEHOLDER && (
            <p className="text-haz-med bg-haz-med/10 border-haz-med/25 flex items-center gap-2 border-b px-5 py-2.5 text-[11px] font-semibold">
              <Construction className="size-3.5 shrink-0" aria-hidden="true" />
              Placeholder data — not real hazard information
            </p>
          )}

          <Section label="Scenario">
            <ScenarioToggle value={scenario} onChange={setScenario} />
            <p className="text-ink-dim mt-2.5 text-[12.5px] leading-relaxed">
              {activeScenario.blurb}
            </p>
          </Section>

          <Section label="Rainfall">
            <RainfallPanel />
          </Section>

          <Section label="View angle">
            <PitchControl
              pitch={pitch}
              onPitchChange={(p, animate) => {
                setPitch(p);
                mapRef.current?.setPitch(p, animate);
              }}
            />
          </Section>

          <Section label="Layers">
            <MapLayers
              basemap={view}
              onBasemapChange={setView}
              showHazard={showHazard}
              onShowHazardChange={setShowHazard}
              extrude={extrude}
              onExtrudeChange={setExtrude}
            />
          </Section>

          {dataError && (
            <p className="text-haz-high bg-haz-high/10 border-haz-high/25 border-b px-5 py-2.5 text-[11px] font-semibold">
              Hazard data failed to load — {dataError}
            </p>
          )}

          <Section label="Hazard levels">
            <HazardLegend basemap={basemap} dimmed={!showHazard} />
          </Section>

          {selected ? (
            <ZonePanel zone={selected} onClose={() => setSelected(null)} />
          ) : (
            <Section label="Selected zone">
              <p className="text-ink-dim flex items-start gap-2.5 text-[12.5px] leading-relaxed">
                <MousePointerClick
                  className="mt-0.5 size-4 shrink-0 opacity-60"
                  aria-hidden="true"
                />
                Click a coloured zone on the map to see its expected depth and
                what to do.
              </p>
            </Section>
          )}
        </div>

        <Link
          to="/about"
          className="border-hairline text-ink-dim hover:text-ink hover:bg-raised/40 shrink-0 border-t px-5 py-3 text-[11px] leading-relaxed transition"
        >
          <span className="text-ink font-semibold">{disclaimer.short}</span>{" "}
          Where the data comes from →
        </Link>
      </aside>

      {/* ── map ──────────────────────────────────────────── */}
      <div className="relative order-1 min-h-[20rem] flex-1 lg:order-2 lg:h-full">
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
          />
        ) : (
          <div className="bg-abyss absolute inset-0" />
        )}

        <div className="absolute top-4 right-4">
          <MapControls
            onLocate={(center) => mapRef.current?.flyTo(center, 15)}
            onReset={() => mapRef.current?.resetCamera()}
            terrain={terrain}
            onToggleTerrain={() => setTerrain((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="border-hairline/60 border-b px-5 py-4">
      <h2 className="text-ink-dim mb-2.5 text-[10px] font-semibold tracking-[0.13em] uppercase">
        {label}
      </h2>
      {children}
    </section>
  );
}
