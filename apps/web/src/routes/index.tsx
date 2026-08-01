import type { LngLat } from "@naboflood/hazard/geo";
import type { HazardProperties } from "@naboflood/hazard/schema";
import { DEFAULT_SCENARIO } from "@naboflood/hazard/scenarios";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { FloodMap, type FloodMapHandle } from "@/components/map/flood-map";
import { HazardLegend } from "@/components/map/hazard-legend";
import { MapControls } from "@/components/map/map-controls";
import { MapStatusBar } from "@/components/map/map-status-bar";
import { RainfallPanel } from "@/components/map/rainfall-panel";
import { ScenarioToggle } from "@/components/map/scenario-toggle";
import { ZonePanel } from "@/components/map/zone-panel";
import { loadScenario } from "@/lib/hazard-source";

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

  // maplibre needs a real DOM and a WebGL context, neither of which exists
  // during prerendering — so the map only mounts on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => loadScenario(scenario), [scenario]);

  // arriving from the Barangays tab with a target
  useEffect(() => {
    if (typeof lng === "number" && typeof lat === "number") {
      mapRef.current?.flyTo([lng, lat] as LngLat, 14);
    }
  }, [lng, lat]);

  // a zone selected under one scenario may not exist under another
  useEffect(() => setSelected(null), [scenario]);

  return (
    <div className="absolute inset-0 overflow-hidden">
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

      {/* top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
        <div className="flex flex-col gap-2">
          <MapStatusBar />
          <div className="pointer-events-auto">
            <ScenarioToggle value={scenario} onChange={setScenario} />
          </div>
        </div>
        <MapControls
          onLocate={(center) => mapRef.current?.flyTo(center, 15)}
          onReset={() => mapRef.current?.resetCamera()}
          terrain={terrain}
          onToggleTerrain={() => setTerrain((v) => !v)}
        />
      </div>

      {/* bottom overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
        <div className="flex max-w-[16rem] flex-col gap-2">
          <div className="pointer-events-auto">
            <RainfallPanel />
          </div>
          <div className="hidden sm:block">
            <HazardLegend />
          </div>
        </div>
        <ZonePanel zone={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}
