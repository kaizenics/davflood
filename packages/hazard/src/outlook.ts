import type { Locale } from "./locale";
import { rainBand, soakBand } from "./rainfall";
import type { Rainfall } from "./rainfall";
import type { River } from "./river";
import type { ScenarioYears } from "./scenarios";
import { STRINGS, fill } from "./strings";
import type { Strings } from "./strings";
import { hazardById } from "./tiers";
import type { HazardId } from "./tiers";

/**
 * Rain, river and hazard in one sentence.
 *
 * The app has had all three of these for a while and has never once said them
 * together. The rainfall panel knows heavy rain is coming; the map knows this
 * spot floods to chest height in a 25-year storm; the river panel knows the
 * Davao is already running high. A reader has to hold all three in their head
 * and do the joining themselves — and the whole reason they opened the app is
 * that they wanted someone to do that joining for them.
 *
 * THE HARD PART IS THE WORDING, NOT THE LOGIC.
 *
 * Every clause here is forecast or model. None of it is observation. The app
 * cannot see water on the ground and must never imply it can, so:
 *
 *   - rain is always "forecast", with the millimetres shown
 *   - hazard is always "in a <N>-year storm", never "will flood"
 *   - the river is "running high", which is what the model says, not
 *     "the river is about to burst", which it does not
 *   - the two are joined with "and", never with "so" or "therefore" — this
 *     function does not have the standing to draw a causal conclusion
 *
 * The tone is for styling only. It must never be the sole carrier of meaning:
 * the sentence has to survive being read aloud with no colour at all.
 */

export type OutlookTone = "calm" | "watch" | "alert";

export type Outlook = {
  tone: OutlookTone;
  /** the joined sentence — forecast and model, never observation */
  sentence: string;
  /** what the sentence above does NOT say. Always rendered with it. */
  caveat: string;
};

/** Rain totals for the two days the sentence can talk about. */
type RainWindow = {
  todayMm: number;
  tomorrowMm: number;
  tomorrowChance: number;
};

function rainWindow(rain: Rainfall | null | undefined): RainWindow | null {
  const today = rain?.days[0];
  if (!today) return null;
  const tomorrow = rain.days[1];
  return {
    todayMm: today.precipitation,
    tomorrowMm: tomorrow?.precipitation ?? 0,
    tomorrowChance: tomorrow?.probability ?? 0,
  };
}

/**
 * The rain clause, or null when there is nothing worth saying.
 *
 * "Nothing worth saying" is a real answer. A line that appears every day
 * announcing light rain is a line people stop reading, and it has to still be
 * being read on the day it matters.
 */
function rainClause(
  w: RainWindow,
  t: Strings["outlook"],
): { text: string; heavy: boolean } | null {
  const todayBand = rainBand(w.todayMm);
  const tomorrowBand = rainBand(w.tomorrowMm);

  if (todayBand === "heavy") {
    return { text: fill(t.heavyToday, { mm: Math.round(w.todayMm) }), heavy: true };
  }
  if (tomorrowBand === "heavy") {
    return {
      text: fill(t.heavyTomorrow, { mm: Math.round(w.tomorrowMm) }),
      heavy: true,
    };
  }
  if (todayBand === "moderate") {
    return { text: fill(t.rainToday, { mm: Math.round(w.todayMm) }), heavy: false };
  }
  if (tomorrowBand === "moderate") {
    return {
      text: fill(t.rainTomorrow, { mm: Math.round(w.tomorrowMm) }),
      heavy: false,
    };
  }
  return null;
}

/**
 * What has already fallen.
 *
 * The one clause here that looks backwards, and the reason it earns a place
 * is that it is the only one describing ground rather than sky. Forty
 * millimetres forecast onto dry ground and forty onto ground that took a
 * hundred and sixty since Sunday are not the same warning, and until now the
 * app could not tell them apart — it never asked for the past.
 *
 * STILL NOT A MEASUREMENT, and the wording has to hold that line. Open-Meteo's
 * past days come from the same model as its forecast, reanalysed rather than
 * observed; there is no rain gauge behind this number. So the clause says what
 * fell and stops there. It never says the ground is saturated, never says
 * drains are full, and never predicts — those are the inferences a reader may
 * draw and this function may not, and `caveat` already tells them the whole
 * line is model output rather than water anyone has seen.
 *
 * Silent below `wet`. An ordinary damp week in Davao is not news.
 */
function soakClause(
  rain: Rainfall | null | undefined,
  t: Strings["outlook"],
): { text: string; saturated: boolean } | null {
  const recent = rain?.recent;
  if (!recent || recent.days === 0) return null;

  const band = soakBand(recent.mm);
  if (band === "dry" || band === "damp") return null;

  return {
    text: fill(t.soak, { mm: Math.round(recent.mm), days: recent.days }),
    saturated: band === "saturated",
  };
}

/** Where the sentence is about: a tapped zone, or the city as a whole. */
export type OutlookPlace =
  | { kind: "zone"; hazard: HazardId; barangay: string | null }
  | { kind: "city"; floodedKm2: number };

function placeClause(
  place: OutlookPlace,
  scenario: ScenarioYears,
  t: Strings["outlook"],
  tiers: Strings["tiers"],
): string {
  if (place.kind === "zone") {
    const where = place.barangay ?? t.tapped;
    /* "the model puts X at" rather than "X floods to": the depth is a
       modelled band for a storm of a given size, and the verb has to carry
       that in every language. depthShort is a number and a unit, so it is the
       one part that does not get translated. */
    return fill(t.zone, {
      years: scenario,
      where,
      depth: hazardById[place.hazard].depthShort,
      summary: tiers[place.hazard].summary.toLowerCase().replace(/\.$/, ""),
    });
  }
  return fill(t.city, {
    years: scenario,
    km2: place.floodedKm2.toFixed(0),
  });
}

/**
 * The river clause. Only ever appears when the river is genuinely unusual —
 * "running about as it usually does" is not news, and printing it every day
 * is how a line becomes wallpaper.
 */
function riverClause(
  river: River | null | undefined,
  t: Strings["outlook"],
): string | null {
  const id = river?.level.id;
  if (id === "very-high" || id === "high") return t.riverHigh;
  if (id === "elevated") return t.riverAbove;
  return null;
}

/**
 * Join what is known into one sentence, or return null when there is nothing
 * to say that the map is not already saying better.
 *
 * Null is the common case on a dry day, and that is correct. This line earns
 * its place by being absent when it has no news.
 */
export function floodOutlook({
  rain,
  river,
  place,
  scenario,
  locale = "en",
}: {
  rain: Rainfall | null | undefined;
  river: River | null | undefined;
  place: OutlookPlace;
  scenario: ScenarioYears;
  /** defaults to the source language, so non-UI callers need not care */
  locale?: Locale;
}): Outlook | null {
  const strings = STRINGS[locale];
  const t = strings.outlook;

  const w = rainWindow(rain);
  const weather = w ? rainClause(w, t) : null;
  const flow = riverClause(river, t);
  const soak = soakClause(rain, t);

  // nothing behind, nothing coming, nothing in the river: the map alone is
  // the honest answer
  if (!weather && !flow && !soak) return null;

  const hazardous =
    place.kind === "zone" ? place.hazard === "high" || place.hazard === "medium" : false;

  /* alert needs BOTH halves — heavy rain forecast AND somewhere for it to
     matter. Heavy rain over ground the model leaves dry is not an alert, and
     saying it is would teach people to ignore the real one.

     A saturated third day now counts as the second half too. Heavy rain
     forecast onto ground that has already taken 150 mm is the case this
     sentence exists for, and it was previously indistinguishable from the
     same forecast falling on a dry week. */
  const tone: OutlookTone =
    weather?.heavy && (hazardous || flow || soak?.saturated) ? "alert" : "watch";

  /* Chronological: what fell, what is forecast, what the river is doing. At
     least one is present — the early return above guarantees it.

     Joined as a real list rather than with `and` between every pair, because
     three clauses can now appear where only two ever could and "A, and B, and
     C" reads like a machine wrote it. Two clauses still produce exactly the
     string they always did. */
  const parts = [soak?.text, weather?.text, flow].filter((p): p is string =>
    Boolean(p),
  );
  const joined =
    parts.length > 1
      ? parts.slice(0, -1).join(t.listSep) + t.and + parts[parts.length - 1]
      : parts[0]!;
  const sentence = joined + placeClause(place, scenario, t, strings.tiers);

  return {
    tone,
    sentence: sentence.charAt(0).toUpperCase() + sentence.slice(1),
    caveat: t.caveat,
  };
}
