import { DEFAULT_LOCALE, LOCALES, isLocale, localeMeta } from "@davflood/hazard/locale";
import type { Locale, LocaleMeta } from "@davflood/hazard/locale";
import { STRINGS } from "@davflood/hazard/strings";
import type { Strings } from "@davflood/hazard/strings";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Which language the reader has chosen.
 *
 * A module-level store rather than context, for the same reason the theme is:
 * it is read in a dozen places, changes about once per person per lifetime,
 * and threading a provider through the shell to carry one enum is more moving
 * parts than the problem has.
 *
 * The server and the first client render ALWAYS produce English. Reading
 * localStorage during render would make the prerendered HTML and the hydrated
 * DOM disagree, which React treats as an error — so the stored choice is
 * applied on subscribe, one render later. The cost is a frame of English on a
 * hard load; the alternative is a hydration mismatch on the one page a person
 * might be reading in an emergency.
 */

const KEY = "davflood:locale";

let current: Locale = DEFAULT_LOCALE;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): Locale {
  try {
    const stored = localStorage.getItem(KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    // private mode, or a browser that has decided storage is a privilege
    return DEFAULT_LOCALE;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  /* First subscriber pulls the stored choice in. Doing it here rather than at
     module scope keeps the module import-safe during prerender, where there
     is no localStorage at all. */
  if (!hydrated) {
    hydrated = true;
    const stored = read();
    if (stored !== current) {
      current = stored;
      applyLang(current);
      queueMicrotask(emit);
    }
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Keeps `<html lang>` truthful — screen readers switch voice on it. */
function applyLang(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = localeMeta(locale).tag;
}

export function setLocale(locale: Locale) {
  if (locale === current) return;
  current = locale;
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    // the choice still applies to this session; it just will not survive it
  }
  applyLang(locale);
  emit();
}

export function useLocale(): {
  locale: Locale;
  meta: LocaleMeta;
  strings: Strings;
  /** true when the reader is looking at copy no native speaker has checked */
  isDraft: boolean;
  set: (locale: Locale) => void;
  locales: LocaleMeta[];
} {
  const locale = useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT_LOCALE,
  );

  const set = useCallback((next: Locale) => setLocale(next), []);
  const meta = localeMeta(locale);

  return {
    locale,
    meta,
    strings: STRINGS[locale],
    isDraft: meta.status === "draft",
    set,
    locales: LOCALES,
  };
}

/** The strings alone, for the many components that need nothing else. */
export function useStrings(): Strings {
  return useLocale().strings;
}
