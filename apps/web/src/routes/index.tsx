import { disclaimer } from "@naboflood/hazard/copy";
import type { LngLat } from "@naboflood/hazard/geo";
import type { HazardProperties } from "@naboflood/hazard/schema";
import { DEFAULT_SCENARIO, scenarioByYears } from "@naboflood/hazard/scenarios";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";
import { colors } from "@naboflood/hazard/tokens";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Construction, Info, MousePointerClick } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FloodMap, type FloodMapHandle } from "@/components/map/flood-map";
import { HazardLegend } from "@/components/map/hazard-legend";
import { MapControls } from "@/components/map/map-controls";
import { RainfallPanel } from "@/components/map/rainfall-panel";
import { ScenarioToggle } from "@/components/map/scenario-toggle";
import { ZonePanel } from "@/components/map/zone-panel";
import { DATA_IS_PLACEHOLDER, loadScenario } from "@/lib/hazard-source";

type Search = { lng?: number; lat?: number };

export const Route = createFileRoute("/")({
  component: MapScreen,
  validateSearch: (search: Record<string, unknown>): Search => ({
    lng: typeof search.lng === "number" ? search.lng : undefined,
    lat: typeof search.lat === "number" ? search.lat : undefined,
  }),
});

function MapScreen() {
  const { lng, lat } = Route.useSearch();
  const mapRef = useRef<FloodMapHandle>(null);

  const [scenario, setScenario] = useState<ScenarioYears>(DEFAULT_SCENARIO);
  const [selected, setSelected] = useState<HazardProperties | null>(null);
  const [terrain, setTerrain] = useState(true);

  // maplibre needs a DOM and a WebGL context, neither of which exists during
  // prerendering — so the map only mounts on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => loadScenario(scenario), [scenario]);
  const activeScenario = scenarioByYears[scenario];

  useEffect(() => {
    if (typeof lng === "number" && typeof lat === "number") {
      mapRef.current?.flyTo([lng, lat] as LngLat, 14);
    }
  }, [lng, lat]);

  // a zone selected under one scenario may not exist under another
  useEffect(() => setSelected(null), [scenario]);

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row">
      {/* ── sidebar ─────────────────────────────────────────── */}
      <aside className="border-hairline order-2 flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t p-5 lg:order-1 lg:w-[22rem] lg:border-t-0 lg:border-r xl:w-[24rem]">
        {DATA_IS_PLACEHOLDER && (
          <p
            className="rounded-card flex items-start gap-2 border p-3 text-[11px] leading-relaxed font-semibold"
            style={{
              color: colors.hazMed,
              borderColor: `${colors.hazMed}55`,
              backgroundColor: `${colors.hazMed}14`,
            }}
          >
            <Construction className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Placeholder data — not real hazard information.
          </p>
        )}

        <section>
          <SidebarHeading>Flood scenario</SidebarHeading>
          <ScenarioToggle value={scenario} onChange={setScenario} />
          <p className="text-ink-dim mt-2.5 text-xs leading-relaxed">
            {activeScenario.blurb}
          </p>
        </section>

        <section>
          <SidebarHeading>Rainfall</SidebarHeading>
          <RainfallPanel />
        </section>

        <section>
          <SidebarHeading>Hazard level</SidebarHeading>
          <HazardLegend />
        </section>

        <section className="min-h-0">
          <SidebarHeading>Selected zone</SidebarHeading>
          {selected ? (
            <ZonePanel zone={selected} onClose={() => setSelected(null)} />
          ) : (
            <p className="border-hairline text-ink-dim rounded-card flex items-center gap-2.5 border border-dashed p-4 text-xs leading-relaxed">
              <MousePointerClick className="size-4 shrink-0" aria-hidden="true" />
              Click any coloured zone on the map to see its expected depth and
              what to do.
            </p>
          )}
        </section>

        <Link
          to="/about"
          className="border-hairline text-ink-dim hover:text-ink rounded-card mt-auto flex items-start gap-2 border p-3 text-[11px] leading-relaxed transition"
        >
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {disclaimer.short} Read where the data comes from.
        </Link>
      </aside>

      {/* ── map ─────────────────────────────────────────────── */}
      <div className="relative order-1 min-h-[22rem] flex-1 lg:order-2">
        {mounted ? (
          <FloodMap
            ref={mapRef}
            scenario={scenario}
            data={data}
            selectedZoneId={selected?.zone_id ?? null}
            onSelect={setSelected}
            terrain={terrain}
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

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-ink-dim mb-2 text-[10px] font-bold tracking-[0.14em] uppercase">
      {children}
    </h2>
  );
}
