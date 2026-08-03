import type { HazardCollection } from "@naboflood/hazard/schema";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";

import hazard5 from "@naboflood/hazard/data/panabo-5.json";
import hazard25 from "@naboflood/hazard/data/panabo-25.json";
import hazard100 from "@naboflood/hazard/data/panabo-100.json";

/**
 * THE LOADING SEAM.
 *
 * The hazard polygons are bundled, so they are present before the first frame
 * and the map works with no network at all. That is the entire offline story,
 * and at a few KB per scenario it is comfortably the right call for one city.
 *
 * If the real UP NOAH export turns out large enough to hurt load time, THIS
 * FUNCTION is the only thing that changes — swap it for a lazy fetch or a
 * hosted tile source. No component knows where the data came from.
 */
const SCENARIOS: Record<ScenarioYears, HazardCollection> = {
  5: hazard5 as unknown as HazardCollection,
  25: hazard25 as unknown as HazardCollection,
  100: hazard100 as unknown as HazardCollection,
};

export function loadScenario(years: ScenarioYears): HazardCollection {
  return SCENARIOS[years];
}

export function scenarioFeatureCount(years: ScenarioYears): number {
  return SCENARIOS[years].features.length;
}

/**
 * The placeholder dataset must never be mistaken for real hazard information.
 * Flip this in the same commit that lands the real NOAH export.
 */
export const DATA_IS_PLACEHOLDER = true;
