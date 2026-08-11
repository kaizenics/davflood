import { rainBand } from "./rainfall";
import type { Rainfall } from "./rainfall";
import type { River } from "./river";
import type { ScenarioYears } from "./scenarios";
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
function rainClause(w: RainWindow): { text: string; heavy: boolean } | null {
  const todayBand = rainBand(w.todayMm);
  const tomorrowBand = rainBand(w.tomorrowMm);

  if (todayBand === "heavy") {
    return {
      text: `Heavy rain forecast today — ${Math.round(w.todayMm)} mm`,
      heavy: true,
    };
  }
  if (tomorrowBand === "heavy") {
    return {
      text: `Heavy rain forecast tomorrow — ${Math.round(w.tomorrowMm)} mm`,
      heavy: true,
    };
  }
  if (todayBand === "moderate") {
    return {
      text: `Rain forecast today — ${Math.round(w.todayMm)} mm`,
      heavy: false,
    };
  }
  if (tomorrowBand === "moderate") {
    return {
      text: `Rain forecast tomorrow — ${Math.round(w.tomorrowMm)} mm`,
      heavy: false,
    };
  }
  return null;
}

/** Where the sentence is about: a tapped zone, or the city as a whole. */
export type OutlookPlace =
  | { kind: "zone"; hazard: HazardId; barangay: string | null }
  | { kind: "city"; floodedKm2: number };

function placeClause(place: OutlookPlace, scenario: ScenarioYears): string {
  if (place.kind === "zone") {
    const tier = hazardById[place.hazard];
    const where = place.barangay
      ? `${place.barangay}`
      : "the spot you tapped";
    /* "models … as" rather than "floods to": the depth is a modelled band for
       a storm of a given size, and the verb has to carry that. */
    return `the ${scenario}-year model puts ${where} at ${tier.depthShort} (${tier.summary.toLowerCase().replace(/\.$/, "")})`;
  }
  return `the ${scenario}-year model floods about ${place.floodedKm2.toFixed(0)} km² of the city`;
}

/**
 * The river clause. Only ever appears when the river is genuinely unusual —
 * "running about as it usually does" is not news, and printing it every day
 * is how a line becomes wallpaper.
 */
function riverClause(river: River | null | undefined): string | null {
  const id = river?.level.id;
  if (id === "very-high" || id === "high") {
    return "the Davao River is forecast to run high";
  }
  if (id === "elevated") {
    return "the Davao River is forecast to run above normal";
  }
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
}: {
  rain: Rainfall | null | undefined;
  river: River | null | undefined;
  place: OutlookPlace;
  scenario: ScenarioYears;
}): Outlook | null {
  const w = rainWindow(rain);
  const weather = w ? rainClause(w) : null;
  const flow = riverClause(river);

  // no weather news and no river news: the map alone is the honest answer
  if (!weather && !flow) return null;

  const hazardous =
    place.kind === "zone" ? place.hazard === "high" || place.hazard === "medium" : false;

  /* alert needs BOTH halves — heavy rain forecast AND somewhere that the
     model floods deeply. Heavy rain over ground the model leaves dry is not
     an alert, and saying it is would teach people to ignore the real one. */
  const tone: OutlookTone = weather?.heavy && (hazardous || flow) ? "alert" : "watch";

  // at least one part is present — the early return above guarantees it
  const parts = [weather?.text, flow].filter((p): p is string => Boolean(p));
  const sentence = `${parts.join(", and ")}, while ${placeClause(place, scenario)}.`;

  return {
    tone,
    sentence: sentence.charAt(0).toUpperCase() + sentence.slice(1),
    caveat:
      "Forecast rainfall and modelled hazard — not a measurement of water on the ground. For live warnings follow PAGASA and your barangay.",
  };
}
