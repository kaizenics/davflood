import { barangays } from "./barangays";
import type { LngLat } from "./geo";

/**
 * Pinning a news report to a barangay.
 *
 * A headline that says "flooding in Ma-a" is worth putting on the map, because
 * it is the only thing in this app that describes water that actually
 * happened rather than water a model expects. But it is a MENTION, not a
 * measurement: the report says a place was in the news, not that the app has
 * verified anything, and the wording downstream has to keep saying so.
 */

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  /** ISO date */
  date: string;
  /** set when the headline named a barangay we can place */
  barangay?: string;
  center?: LngLat;
};

export type NewsFile = {
  fetched: string | null;
  items: NewsItem[];
};

/**
 * Barangay names that are also something else.
 *
 * Every one of these produced a wrong pin in testing, or obviously would:
 * "Riverside" is a common noun and matched prose about a river bank; Baguio,
 * Fatima and Bato name far better-known places elsewhere in the country, and
 * a national weather roundup mentioning both Davao and Baguio would otherwise
 * drop a pin in the wrong city.
 *
 * They are excluded only as bare words — "Barangay Riverside" still matches,
 * because at that point the writer has told us which one they mean.
 */
const AMBIGUOUS = new Set([
  "riverside",
  "baguio",
  "fatima",
  "bato",
  "poblacion",
  "salvacion",
  "san isidro",
  "santo niño",
  "santa cruz",
  "new valencia",
]);

/** "76-A Bucana" is also just "Bucana" to anyone writing a headline. */
function bareName(name: string): string {
  return name.replace(/^\d+-[A-Z]\s+/, "");
}

function wordMatch(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Ma-a must not match "Maasin", and Toril must not match "Torilla"
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu").test(
    haystack,
  );
}

/**
 * The barangay a headline is about, if it names one unambiguously.
 *
 * Longest name first, so "Matina Pangi" wins over "Matina" and the pin lands
 * on the barangay the writer actually named.
 */
const CANDIDATES = barangays
  .flatMap((b) => {
    const names = new Set([b.name, bareName(b.name)]);
    return [...names]
      .filter((n) => n.length >= 4)
      .map((n) => ({ match: n.toLowerCase(), barangay: b.name, center: b.center }));
  })
  .sort((a, b) => b.match.length - a.match.length);

export function locateHeadline(
  title: string,
): { barangay: string; center: LngLat } | null {
  for (const c of CANDIDATES) {
    if (!wordMatch(title, c.match)) continue;
    if (AMBIGUOUS.has(c.match)) {
      // only accept it when the writer said which one they meant
      const qualified =
        wordMatch(title, `barangay ${c.match}`) ||
        wordMatch(title, `brgy ${c.match}`) ||
        wordMatch(title, `brgy. ${c.match}`);
      if (!qualified) continue;
    }
    return { barangay: c.barangay, center: c.center as LngLat };
  }
  return null;
}

/** How old, in whole days. */
export function ageInDays(iso: string, now = new Date()): number {
  const then = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86_400_000));
}

/** "today", "3 days ago", "5 weeks ago" — a pin has to say how old it is. */
export function describeAge(iso: string, now = new Date()): string {
  const days = ageInDays(iso, now);
  if (!Number.isFinite(days)) return "";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/**
 * Recent enough to still be on the map.
 *
 * Kept generous on purpose: a flood in Ma-a six weeks ago is still the most
 * useful thing anyone can tell you about Ma-a, and it is exactly the sort of
 * local memory that never makes it into a hazard model.
 */
export const NEWS_RETENTION_DAYS = 60;

/** Fresh reports read solid; old ones fade but never vanish inside the window. */
export function newsOpacity(iso: string, now = new Date()): number {
  const days = ageInDays(iso, now);
  if (!Number.isFinite(days)) return 0.45;
  if (days <= 2) return 1;
  if (days >= NEWS_RETENTION_DAYS) return 0.45;
  return 1 - 0.55 * (days / NEWS_RETENTION_DAYS);
}
