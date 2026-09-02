import { useEffect, useState } from "react";

/**
 * Map-only mode: every panel out of the way, nothing but cartography.
 *
 * The panel earns its space on a normal visit — it is where the reading, the
 * scenario and the forecast live. But the map is a 3D terrain view of a city
 * 53 km across, and there are moments (showing someone their barangay, taking
 * a screenshot, simply looking) when the chrome is the thing in the way. This
 * gets rid of all of it in one press.
 *
 * `allowed` is false on the document routes, where the panel IS the page:
 * hiding it there would leave a reader staring at cartography with the
 * article they were reading gone. The mode drops itself rather than making
 * every caller remember to.
 *
 * Not persisted, deliberately. It is a way of looking at the map for a
 * minute, not a preference, and a reader who returns to a chrome-less app
 * with no memory of turning it on has lost the app.
 */
export function useImmersive(allowed: boolean, onEnter?: () => void) {
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    if (!allowed && immersive) setImmersive(false);
  }, [allowed, immersive]);

  useEffect(() => {
    if (!immersive) return;
    // anything floating outside the panel has to be closed by the caller —
    // on a phone the map-view sheet would otherwise be left hanging over an
    // otherwise bare map
    onEnter?.();

    /* Escape is the second way out. The button is the first, but it is one
       40px target on a screen that has just lost every other affordance, and
       a mode with a single exit is a mode people get stuck in. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    /* `onEnter` is out of the deps on purpose: callers pass an inline arrow,
       and a new identity every render would re-run this on every render —
       re-closing the sheet each time and rebinding the key handler. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immersive]);

  return [immersive, setImmersive] as const;
}
