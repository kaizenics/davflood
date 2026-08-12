import { BARANGAY_PROFILES } from "./barangay-profiles";
import type { BarangayStat } from "./barangay-profiles";
import { barangays } from "./barangays";
import type { Barangay } from "./barangays";
import { scenarios } from "./scenarios";
import type { ScenarioYears } from "./scenarios";
import type { HazardId } from "./tiers";

/**
 * One barangay, as a page.
 *
 * The city-wide map answers "where floods". This answers "what about mine",
 * which is the question almost everybody actually arrives with — and the one
 * a national hazard portal cannot answer without you already knowing how to
 * read a return period.
 */

export type BarangayProfile = {
  barangay: Barangay;
  slug: string;
  /** every scenario, in ascending severity */
  scenarios: {
    years: ScenarioYears;
    label: string;
    annualChance: string;
    stat: BarangayStat;
    /** deepest band present, or null when the model leaves it dry */
    worst: HazardId | null;
  }[];
  /** true when no scenario floods it at all */
  dryInEveryScenario: boolean;
};

/**
 * URL-safe name.
 *
 * The numbered downtown barangays ("19-B Garcia Heights") keep their number,
 * because that is how people say them and how they are signposted — dropping
 * it would produce two barangays called "Garcia Heights" in different parts
 * of the city.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BY_SLUG = new Map<string, Barangay>(
  barangays.map((b) => [slugify(b.name), b]),
);

export function barangayBySlug(slug: string): Barangay | null {
  return BY_SLUG.get(slug) ?? null;
}

/** Every slug, for prerendering and for the sitemap. */
export function allBarangaySlugs(): string[] {
  return [...BY_SLUG.keys()];
}

function worstBand(stat: BarangayStat): HazardId | null {
  if (stat.high > 0) return "high";
  if (stat.medium > 0) return "medium";
  if (stat.low > 0) return "low";
  return null;
}

const EMPTY: BarangayStat = { low: 0, medium: 0, high: 0, total: 0, zones: 0 };

export function profileFor(barangay: Barangay): BarangayProfile {
  const byScenario = BARANGAY_PROFILES[barangay.name];

  const rows = scenarios.map((s) => {
    const stat = byScenario?.[s.years] ?? EMPTY;
    return {
      years: s.years,
      label: s.label,
      annualChance: s.annualChance,
      stat,
      worst: worstBand(stat),
    };
  });

  return {
    barangay,
    slug: slugify(barangay.name),
    scenarios: rows,
    dryInEveryScenario: rows.every((r) => r.stat.total === 0),
  };
}

/**
 * The one-line summary, which is also the meta description and the sentence
 * an AI assistant is most likely to lift.
 *
 * Written to be true standing alone, with no page around it: it names the
 * barangay, the city, the model and the scenario, because a passage quoted
 * out of context should not be able to become a claim about somewhere else.
 */
export function summaryFor(profile: BarangayProfile): string {
  const name = profile.barangay.name;

  if (profile.dryInEveryScenario) {
    return `The UP NOAH model does not flood Barangay ${name}, Davao City in any of its three storm scenarios — a 5, 25 or 100-year return period. That is the model, and it says nothing about drainage failures or the roads out.`;
  }

  const worst = profile.scenarios[profile.scenarios.length - 1];
  const mild = profile.scenarios[0];
  if (!worst || !mild) return "";

  const deepest = worst.worst;
  const depthWords =
    deepest === "high"
      ? "over 1.5 metres — above head height"
      : deepest === "medium"
        ? "0.5 to 1.5 metres — waist to chest"
        : "0.1 to 0.5 metres — ankle to knee";

  const mildClause =
    mild.stat.total > 0
      ? `about ${mild.stat.total.toFixed(mild.stat.total < 1 ? 2 : 1)} km² floods even in a 5-year storm`
      : "the 5-year storm leaves it dry";

  return `In Barangay ${name}, Davao City, the UP NOAH model floods about ${worst.stat.total.toFixed(worst.stat.total < 1 ? 2 : 1)} km² in a 100-year storm, reaching ${depthWords}. By comparison, ${mildClause}.`;
}
