import type { LngLat } from "@naboflood/hazard/geo";
import type { HazardProperties } from "@naboflood/hazard/schema";
import { DEFAULT_SCENARIO } from "@naboflood/hazard/scenarios";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloodMap, type FloodMapHandle } from "@/components/map/flood-map";
import { HazardLegend } from "@/components/map/hazard-legend";
import { MapControls } from "@/components/map/map-controls";
import { MapStatusBar } from "@/components/map/map-status-bar";
import { RainfallPanel } from "@/components/map/rainfall-panel";
import { ScenarioToggle } from "@/components/map/scenario-toggle";
import { ZoneSheet } from "@/components/map/zone-sheet";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<FloodMapHandle>(null);

  const [scenario, setScenario] = useState<ScenarioYears>(DEFAULT_SCENARIO);
  const [selected, setSelected] = useState<HazardProperties | null>(null);
  const [terrain, setTerrain] = useState(true);
  const [showUser, setShowUser] = useState(false);

  const { checked, needsOnboarding, complete } = useOnboarding();

  // first run: explain what the hazard levels mean before showing a map of them
  useEffect(() => {
    if (checked && needsOnboarding) {
      void complete();
      router.push("/onboarding");
    }
  }, [checked, needsOnboarding, complete, router]);

  // arriving from the Barangays tab with a target to fly to
  const params = useLocalSearchParams<{ lng?: string; lat?: string }>();
  useEffect(() => {
    const lng = Number(params.lng);
    const lat = Number(params.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      mapRef.current?.flyTo([lng, lat] as LngLat);
    }
  }, [params.lng, params.lat]);

  return (
    // NOT wrapped in Container: its default ScrollView would fight the map for
    // pan gestures. The map owns the whole surface.
    <View className="flex-1 bg-abyss">
      <FloodMap
        ref={mapRef}
        scenario={scenario}
        selectedZoneId={selected?.zone_id ?? null}
        onSelect={setSelected}
        terrain={terrain}
        showUserLocation={showUser}
      />

      {/* top overlay */}
      <View
        pointerEvents="box-none"
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 gap-2.5 px-4"
      >
        <MapStatusBar />
        <View className="flex-row items-start justify-between gap-3">
          <ScenarioToggle value={scenario} onChange={setScenario} />
          <MapControls
            onLocate={(center) => {
              setShowUser(true);
              mapRef.current?.flyTo(center, 15);
            }}
            onReset={() => mapRef.current?.resetCamera()}
            terrain={terrain}
            onToggleTerrain={() => setTerrain((v) => !v)}
          />
        </View>
      </View>

      {/* bottom overlay */}
      <View
        pointerEvents="box-none"
        style={{ paddingBottom: insets.bottom + 8 }}
        className="absolute inset-x-0 bottom-0 gap-2.5 px-4"
      >
        <RainfallPanel />
        <HazardLegend compact />
      </View>

      <ZoneSheet zone={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
