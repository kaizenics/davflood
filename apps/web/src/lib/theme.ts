import type { Theme } from "@davflood/hazard/tokens";
import { useCallback, useEffect, useState } from "react";

export type { Theme };

export const THEME_KEY = "davflood.theme";

/**
 * Runs before first paint, inlined into <head>.
 *
 * Without it the page renders in the default (light) theme and then snaps to
 * dark once React hydrates — a full-screen white flash, which is genuinely
 * unpleasant if you opened this at night during a storm.
 *
 * Kept as a string so it can be injected verbatim; it must not depend on any
 * bundled module, because it runs before the bundle does.
 */
export const THEME_INIT_SCRIPT = `
(function(){try{
  var s=localStorage.getItem(${JSON.stringify(THEME_KEY)});
  var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
  if(d)document.documentElement.classList.add("dark");
}catch(e){document.documentElement.classList.add("dark");}})();
`;

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  // starts as "dark" during prerender; the init script has already set the
  // real class by the time this mounts, so sync on mount
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => setThemeState(currentTheme()), []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // private mode — the toggle still works, it just won't be remembered
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(currentTheme() === "dark" ? "light" : "dark"),
    [setTheme],
  );

  return { theme, setTheme, toggle };
}
