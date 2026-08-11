/**
 * The languages Davao actually speaks.
 *
 * Cebuano/Bisaya is the first language of most of this city. An English-only
 * flood map is a flood map that reads fluently to the people least likely to
 * be standing in the water, and haltingly to the people most likely to be.
 *
 * THE STATUS FIELD IS NOT DECORATION. Every non-English string in this app is
 * currently a draft written by the developers with the help of an AI, not by
 * a native speaker. On a map that tells people whether water will go over
 * their head, the difference between "checked by a Bisaya speaker" and "our
 * best attempt" is a difference the reader is entitled to see — so `status`
 * is rendered in the UI, and English is always one tap away.
 *
 * Marking a locale `reviewed` is a one-line change, and should be made the
 * moment a native speaker has actually gone through strings.ts line by line.
 */

export type Locale = "en" | "ceb" | "fil";

export type LocaleStatus =
  /** the language the copy was written and argued over in */
  | "source"
  /** translated, but not yet checked by a native speaker */
  | "draft"
  /** a native speaker has been through it */
  | "reviewed";

export type LocaleMeta = {
  id: Locale;
  /** what the language calls itself — never the English exonym */
  endonym: string;
  /** two or three letters, for the toggle */
  short: string;
  /** BCP 47, for the `lang` attribute and screen readers */
  tag: string;
  status: LocaleStatus;
};

export const LOCALES: LocaleMeta[] = [
  { id: "en", endonym: "English", short: "EN", tag: "en-PH", status: "source" },
  { id: "ceb", endonym: "Bisaya", short: "BIS", tag: "ceb-PH", status: "draft" },
  { id: "fil", endonym: "Tagalog", short: "TL", tag: "fil-PH", status: "draft" },
];

export const DEFAULT_LOCALE: Locale = "en";

export function localeMeta(id: Locale): LocaleMeta {
  return LOCALES.find((l) => l.id === id) ?? LOCALES[0]!;
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ceb" || value === "fil";
}
