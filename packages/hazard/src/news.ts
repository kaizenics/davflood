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
  /**
   * The publisher's own lead image, hotlinked.
   *
   * Only ever present for items that came from a publisher's own feed —
   * Google News hands back an interstitial URL whose og:image is Google's
   * logo, so those items stay text-only rather than carrying a picture that
   * says nothing.
   */
  image?: string;
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

/**
 * Does this stamp carry a clock, or only a calendar?
 *
 * The distinction is the whole point of the two branches below. RSS gives a
 * real publication time; some aggregators give a bare date. Saying "4 hours
 * ago" about a value that only ever meant "the 8th" invents precision the
 * publisher never claimed, and on an app that is careful about what it does
 * not know, that is not a rounding error.
 */
function hasClock(iso: string): boolean {
  return /\d{2}:\d{2}/.test(iso);
}

/** How old, in whole days. */
export function ageInDays(iso: string, now = new Date()): number {
  const then = new Date(hasClock(iso) ? iso : `${iso}T00:00:00Z`);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86_400_000));
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

/**
 * "just now", "3 minutes ago", "yesterday", "5 weeks ago".
 *
 * Down to seconds when the publisher gave a time, and no finer than a day
 * when they did not — see hasClock. A reader deciding whether a report is
 * still describing the current storm needs the difference between "an hour
 * ago" and "on Tuesday", and a bare date cannot tell them.
 */
export function describeAge(iso: string, now = new Date()): string {
  if (hasClock(iso)) {
    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return "";

    /* Clamp at zero. A publisher's clock running ahead of the reader's would
       otherwise produce "in 3 minutes", which reads as a bug in a feed of
       things that have already happened. */
    const seconds = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
    if (seconds < 10) return "just now";
    if (seconds < 60) return plural(seconds, "second");

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return plural(minutes, "minute");

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return plural(hours, "hour");
  }

  const days = ageInDays(iso, now);
  if (!Number.isFinite(days)) return "";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** The calendar part, for wherever the exact day is wanted alongside the age. */
export function newsDay(iso: string): string {
  return iso.slice(0, 10);
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
