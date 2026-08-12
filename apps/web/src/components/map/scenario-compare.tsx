import type { LngLat } from "@davflood/hazard/geo";
import { zoneAt } from "@davflood/hazard/place";
import { formatDepth } from "@davflood/hazard/schema";
import { scenarios } from "@davflood/hazard/scenarios";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { useEffect, useState } from "react";

import { hazardBg, hazardText } from "@/lib/hazard-classes";
import { loadScenario } from "@/lib/hazard-source";
import { useStrings } from "@/lib/locale";

/**
 * The same spot, in all three storms.
 *
 * This is the answer the national hazard portal structurally cannot give: it
 * publishes the 100-year footprint alone, so "is this a rare disaster or does
 * it happen most years" is unanswerable there. Standing on one spot and
 * seeing dry / knee / chest in one column is the difference between a number
 * and a decision.
 *
 * Loaded on demand and progressively. The three scenarios are separate files
 * — 0.8, 0.9 and 4.1 MB — so this asks for the two the reader is not already
 * looking at only once they have tapped something, renders each row the
 * moment its file lands, and never blocks the depth reading above it. Anyone
 * who saved the offline pack has all three already; everybody else pays once,
 * because loadScenario caches.
 */

type Row = {
  years: ScenarioYears;
  label: string;
  annualChance: string;
  /** undefined while loading, null when that scenario leaves the spot dry */
  depth?: { text: string; hazard: "low" | "medium" | "high" } | null;
};

export function ScenarioCompare({
  at,
  active,
}: {
  at: LngLat;
  /** the scenario the map is showing, highlighted in the list */
  active: ScenarioYears;
}) {
  const t = useStrings();
  const [rows, setRows] = useState<Row[]>(() =>
    scenarios.map((s) => ({
      years: s.years,
      label: s.label,
      annualChance: s.annualChance,
    })),
  );

  useEffect(() => {
    let live = true;

    setRows(
      scenarios.map((s) => ({
        years: s.years,
        label: s.label,
        annualChance: s.annualChance,
      })),
    );

    for (const s of scenarios) {
      loadScenario(s.years)
        .then((fc) => {
          if (!live) return;
          const zone = zoneAt(fc, at);
          setRows((prev) =>
            prev.map((row) =>
              row.years === s.years
                ? {
                    ...row,
                    depth: zone
                      ? { text: formatDepth(zone), hazard: zone.hazard }
                      : null,
                  }
                : row,
            ),
          );
        })
        /* A scenario that will not load is left as "…" rather than reported
           as dry. Silence is wrong here, but so is a zero. */
        .catch(() => {});
    }

    return () => {
      live = false;
    };
  }, [at]);

  return (
    <div className="border-hairline/60 mt-3 border-t pt-3">
      <p className="text-ink-dim text-[10px] font-semibold tracking-[0.13em] uppercase">
        This spot in every storm
      </p>

      <ul className="mt-2 flex flex-col gap-1">
        {rows.map((row) => (
          <li
            key={row.years}
            className={`flex items-baseline gap-2 rounded-lg px-1.5 py-1 ${
              row.years === active ? "bg-raised/60" : ""
            }`}
          >
            <span className="text-ink min-w-0 flex-1 text-[11.5px] font-medium">
              {row.label}
              <span className="text-ink-dim ml-1.5 text-[10px]">
                {row.annualChance}
              </span>
            </span>

            {row.depth === undefined ? (
              <span className="text-ink-dim shrink-0 text-[11px]">…</span>
            ) : row.depth === null ? (
              <span className="text-ink-dim shrink-0 text-[11px]">dry</span>
            ) : (
              <span className="flex shrink-0 items-center gap-1.5">
                <span
                  className={`${hazardBg[row.depth.hazard]} size-2 shrink-0 rounded-[2px]`}
                  aria-hidden="true"
                />
                <span
                  className={`${hazardText[row.depth.hazard]} text-[11.5px] font-semibold`}
                  data-numeric
                >
                  {row.depth.text}
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="text-ink-dim mt-1.5 text-[10.5px] leading-relaxed">
        {t.disclaimer.pill}
      </p>
    </div>
  );
}
