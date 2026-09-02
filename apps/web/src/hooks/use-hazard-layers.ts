import type { HazardCollection } from "@davflood/hazard/schema";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { useEffect, useState } from "react";

import { EMPTY, loadScenario } from "@/lib/hazard-source";
import { loadLandslide } from "@/lib/landslide-source";

/**
 * The two hazard datasets, and the very different rules for fetching them.
 *
 * Both were inline in map-shell.tsx, which held twenty-three useState calls
 * across six unrelated concerns. These are the two that are genuinely their
 * own thing: a fetch, its error, and the state that says whether it has
 * arrived. Pulling them out is what lets the shell read as layout again.
 */

/**
 * The flood polygons for the scenario being viewed.
 *
 * Fetched per scenario rather than bundled — see lib/hazard-source.ts for the
 * 5.9 MB that decision is about. Starts as an empty collection so the map can
 * render its layers before any data arrives, which is also what it falls back
 * to if the fetch fails: an empty hazard layer over a working map, and an
 * error the shell can show, rather than a blank screen.
 */
export function useScenarioData(scenario: ScenarioYears) {
  const [data, setData] = useState<HazardCollection>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    loadScenario(scenario)
      .then((fc) => {
        if (live) setData(fc);
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      live = false;
    };
  }, [scenario]);

  return { data, error };
}

/**
 * Landslide susceptibility, fetched the first time it is switched on.
 *
 * Not on the critical path, unlike the flood data: 0.63 MB that most readers
 * never need should not be in front of a map somebody opened in a storm. A
 * failure switches the layer back off and is otherwise swallowed — the flood
 * map is the thing that matters and is untouched by it.
 *
 * `loading` IS NOT A DEPENDENCY OF THE EFFECT, and this is the whole reason
 * the hook is worth reading. It used to be, and that deadlocked the layer:
 * the effect set the flag, the state change re-ran the effect, the cleanup
 * marked the in-flight fetch cancelled, and the re-run bailed out on the very
 * flag it had just set. Nothing was drawn, the switch read "Loading…"
 * forever, and it could not recover, because the guard it was stuck behind
 * was the same flag it was waiting on. `data` alone is the correct guard.
 */
export function useLandslideData(enabled: boolean, onFailure: () => void) {
  const [data, setData] = useState<GeoJSON.FeatureCollection>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || data) return;
    let alive = true;
    setLoading(true);
    loadLandslide()
      .then((fc) => {
        if (alive) setData(fc);
      })
      .catch((err) => {
        console.error("[useLandslideData] failed to load:", err);
        if (alive) onFailure();
      })
      // unguarded on purpose: a spinner that outlives its fetch is the bug
      // above in miniature, and a state call after unmount is a no-op
      .finally(() => setLoading(false));
    return () => {
      alive = false;
    };
    /* `onFailure` is deliberately out: callers pass an inline arrow, so a new
       identity every render would restart the fetch on every render. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, data]);

  return { data, loading };
}
