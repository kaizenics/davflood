import { barangays, searchBarangays } from "@naboflood/hazard/barangays";
import { mapAttribution } from "@naboflood/hazard/copy";
import { CAMERA, PANABO_BBOX } from "@naboflood/hazard/geo";
import {
  HAZARD_FILL_LAYER_IDS,
  HAZARD_BEFORE_ID,
  LAYER_IDS,
  SOURCE_HAZARD,
  hazardLayers,
} from "@naboflood/hazard/layers";
import { asHazardProperties, formatDepth } from "@naboflood/hazard/schema";
import type { HazardCollection, HazardProperties } from "@naboflood/hazard/schema";
import { DEFAULT_SCENARIO, scenarios } from "@naboflood/hazard/scenarios";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";
import { buildBaseStyle } from "@naboflood/hazard/style";
import { hazardById, hazardTiers } from "@naboflood/hazard/tiers";
import { colors } from "@naboflood/hazard/tokens";
import { createFileRoute } from "@tanstack/react-router";
// maplibre-gl v6 ships named exports only — there is no default export
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";

import hazard5 from "@naboflood/hazard/data/panabo-5.json";
import hazard25 from "@naboflood/hazard/data/panabo-25.json";
import hazard100 from "@naboflood/hazard/data/panabo-100.json";

export const Route = createFileRoute("/map-preview")({
  component: MapPreview,
});

/**
 * Browser harness for the flood map.
 *
 * This exists so the map style, hazard colours, layer order and tap behaviour
 * can be iterated without an Android toolchain — and so real UP NOAH data can
 * be sanity-checked the day it arrives. It consumes the exact same style
 * module, layer specs and GeoJSON as the native app: one source of truth,
 * two renderers.
 */

const DATA: Record<ScenarioYears, HazardCollection> = {
  5: hazard5 as unknown as HazardCollection,
  25: hazard25 as unknown as HazardCollection,
  100: hazard100 as unknown as HazardCollection,
};

function MapPreview() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [scenario, setScenario] = useState<ScenarioYears>(DEFAULT_SCENARIO);
  const [selected, setSelected] = useState<HazardProperties | null>(null);
  const [terrain, setTerrain] = useState(true);
  const [query, setQuery] = useState("");

  const style = useMemo(() => buildBaseStyle({ terrain: true }), []);

  /* ---- init once ---- */
  useEffect(() => {
    if (!container.current || map.current) return;

    const m = new maplibregl.Map({
      container: container.current,
      // the shared package pins style-spec to the version maplibre-react-native
      // uses; maplibre-gl tracks a newer one, so cast at this boundary only
      style: style as maplibregl.StyleSpecification,
      center: [...CAMERA.center],
      zoom: CAMERA.zoom,
      pitch: CAMERA.pitch,
      bearing: CAMERA.bearing,
      maxPitch: CAMERA.maxPitch,
      minZoom: CAMERA.minZoom,
      maxZoom: CAMERA.maxZoom,
      maxBounds: [
        [PANABO_BBOX[0], PANABO_BBOX[1]],
        [PANABO_BBOX[2], PANABO_BBOX[3]],
      ],
      attributionControl: false,
    });

    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    m.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    m.on("load", () => {
      m.addSource(SOURCE_HAZARD, {
        type: "geojson",
        data: DATA[DEFAULT_SCENARIO],
      });

      for (const layer of hazardLayers()) {
        m.addLayer(layer as maplibregl.LayerSpecification, HAZARD_BEFORE_ID);
      }

      m.on("click", (e) => {
        const hits = m.queryRenderedFeatures(e.point, {
          layers: HAZARD_FILL_LAYER_IDS,
        });
        // layers draw low -> high, so the last hit is the most severe zone
        const top = hits[hits.length - 1];
        setSelected(top ? (asHazardProperties(top.properties) ?? null) : null);
      });

      m.on("mouseenter", LAYER_IDS.fillLow, () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", LAYER_IDS.fillLow, () => {
        m.getCanvas().style.cursor = "";
      });

      setReady(true);
    });

    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, [style]);

  /* ---- scenario swap: data only, never a style reload ---- */
  useEffect(() => {
    if (!ready || !map.current) return;
    const src = map.current.getSource(SOURCE_HAZARD);
    if (src && "setData" in src) {
      (src as maplibregl.GeoJSONSource).setData(DATA[scenario]);
    }
    setSelected(null);
  }, [scenario, ready]);

  /* ---- selection highlight via filter ---- */
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setFilter(LAYER_IDS.selected, [
      "==",
      ["get", "zone_id"],
      selected?.zone_id ?? "",
    ]);
  }, [selected, ready]);

  /* ---- terrain toggle ---- */
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setTerrain(
      terrain ? { source: "terrain-dem", exaggeration: 1.4 } : null,
    );
  }, [terrain, ready]);

  const results = useMemo(() => (query ? searchBarangays(query, 6) : []), [query]);

  function flyTo(center: readonly [number, number]) {
    map.current?.flyTo({ center: [...center], zoom: 14, duration: 1200 });
    setQuery("");
  }

  const tier = selected ? hazardById[selected.hazard] : null;

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden">
      <div ref={container} className="absolute inset-0" />

      {/* ---- scenario toggle ---- */}
      <div className="pointer-events-auto absolute top-4 left-4 flex flex-col gap-3">
        <div
          className="flex gap-1 rounded-full p-1 backdrop-blur"
          style={{ background: `${colors.surface}e6`, border: `1px solid ${colors.hairline}` }}
        >
          {scenarios.map((s) => (
            <button
              key={s.years}
              type="button"
              onClick={() => setScenario(s.years)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
              style={{
                background: scenario === s.years ? colors.tide : "transparent",
                color: scenario === s.years ? colors.abyss : colors.inkDim,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ---- barangay search ---- */}
        <div className="w-56">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${barangays.length} barangays…`}
            className="w-full rounded-full px-4 py-2 text-xs outline-none backdrop-blur"
            style={{
              background: `${colors.surface}e6`,
              border: `1px solid ${colors.hairline}`,
              color: colors.ink,
            }}
          />
          {results.length > 0 && (
            <ul
              className="mt-1 overflow-hidden rounded-xl backdrop-blur"
              style={{ background: `${colors.surface}f2`, border: `1px solid ${colors.hairline}` }}
            >
              {results.map((b) => (
                <li key={b.name}>
                  <button
                    type="button"
                    onClick={() => flyTo(b.center)}
                    className="block w-full px-4 py-2 text-left text-xs"
                    style={{ color: colors.ink }}
                  >
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs backdrop-blur"
          style={{
            background: `${colors.surface}e6`,
            border: `1px solid ${colors.hairline}`,
            color: colors.inkDim,
          }}
        >
          <input
            type="checkbox"
            checked={terrain}
            onChange={(e) => setTerrain(e.target.checked)}
          />
          3D terrain
        </label>
      </div>

      {/* ---- legend: colour is NEVER the only channel ---- */}
      <div
        className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-xl p-3 backdrop-blur"
        style={{ background: `${colors.surface}e6`, border: `1px solid ${colors.hairline}` }}
      >
        <span
          className="text-[0.6rem] font-semibold tracking-widest uppercase"
          style={{ color: colors.inkDim }}
        >
          Hazard level
        </span>
        {hazardTiers.map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <span
              className="size-3 rounded-[3px]"
              style={{ background: t.color }}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold" style={{ color: colors.ink }}>
              {t.label}
            </span>
            <span className="text-xs tabular-nums" style={{ color: colors.inkDim }}>
              {t.depthShort}
            </span>
          </div>
        ))}
        <span className="max-w-48 text-[0.6rem]" style={{ color: colors.inkDim }}>
          {mapAttribution}
        </span>
      </div>

      {/* ---- tapped zone ---- */}
      {selected && tier && (
        <div
          className="absolute right-4 bottom-4 w-72 rounded-xl p-4 backdrop-blur"
          style={{ background: `${colors.surface}f2`, border: `1px solid ${colors.hairline}` }}
        >
          <div className="mb-2 h-1 w-10 rounded-full" style={{ background: tier.color }} />
          <p
            className="text-[0.6rem] font-semibold tracking-widest uppercase"
            style={{ color: colors.inkDim }}
          >
            Selected zone
          </p>
          <p className="text-base font-semibold" style={{ color: colors.ink }}>
            Brgy. {selected.barangay}
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: tier.color }}>
            {tier.label} · {formatDepth(selected)}
          </p>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: colors.inkDim }}>
            {tier.human}
          </p>
          <p className="mt-2 text-[0.65rem]" style={{ color: colors.inkDim }}>
            zone_id {selected.zone_id} · {selected.scenario}-yr
          </p>
        </div>
      )}

      <p
        className="absolute top-4 right-4 max-w-56 rounded-lg px-3 py-2 text-[0.65rem] leading-snug backdrop-blur"
        style={{
          background: `${colors.surface}e6`,
          border: `1px solid ${colors.hairline}`,
          color: colors.inkDim,
          marginTop: "6.5rem",
        }}
      >
        Preview harness · placeholder data, not real hazard information.
      </p>
    </div>
  );
}
