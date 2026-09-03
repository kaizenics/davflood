import type { RainGrid } from "@davflood/hazard/rain-grid";
import { BookOpen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LandslideLegend } from "@/components/map/landslide-legend";
import { RainLegend } from "@/components/map/rain-legend";

/**
 * The wait before the legend shows itself.
 *
 * It does NOT appear the instant the layer is switched on, and that pause is
 * the point. Turning on landslide puts purple across half the city; the first
 * thing a reader wants is to see that happen. A key that arrives in the same
 * frame is explaining something nobody has looked at yet, and it lands as an
 * interruption. Two seconds later it is an answer to a question they have by
 * then actually asked.
 *
 * Counted from when the data lands, not from the switch — see the effect.
 */
const SHOW_DELAY_MS = 2000;

/**
 * How long it stays before minimising back to the pill.
 *
 * The landslide legend runs to about 45 words. Read properly that is thirteen
 * seconds; scanned, nearer five. Any fixed number cuts somebody off mid
 * sentence, which is why the number matters less than the two rules around
 * it: touching or hovering the legend cancels the countdown outright, and a
 * legend opened from the button never counts down at all.
 */
const AUTO_HIDE_MS = 10000;

type Props = {
  showRain: boolean;
  rainGrid: RainGrid | undefined;
  showLandslide: boolean;
  landslideLoading: boolean;
  theme: "dark" | "light";
};

/**
 * The keys for whichever overlays are switched on — shown when they become
 * relevant, then out of the way.
 *
 * They used to sit open permanently in the corner. On a phone that was a
 * third of the screen covered by the thing explaining the map, over the map
 * it was explaining, and there is no free corner on a phone to move it to.
 * Hiding it in the panel instead would have buried the one piece of text that
 * says the purple means susceptibility rather than a forecast.
 *
 * So it behaves like a hint rather than furniture. Switching a layer on lets
 * the map redraw first, brings the key in a couple of seconds later, and
 * minimises it to a pill ten seconds after that. The pill keeps it one tap
 * away for as long as the layer is on. Nobody has to dismiss anything, and
 * nobody has to hunt for it either.
 *
 * Renders nothing at all when no overlay is on, which is the default visit.
 */
export function MapLegends({
  showRain,
  rainGrid,
  showLandslide,
  landslideLoading,
  theme,
}: Props) {
  const [open, setOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /* Set the moment the reader touches or opens it. From then on the legend
     stays until it is closed, because every remaining reason it is on screen
     is one the reader chose. */
  const held = useRef(false);

  const active = showRain || showLandslide;
  /* Which layers, not merely whether any: turning landslide on while rain is
     already showing is new information and earns a fresh look. */
  const key = `${showRain}:${showLandslide}`;

  const clear = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };

  /**
   * Wait, show, then minimise — the whole sequence for one switch-on.
   *
   * Both waits are measured from AFTER the data lands rather than from the
   * switch. The 3 MB of slope model takes a moment to arrive and the legend
   * reads "Loading the slope model…" until it does; counting through that
   * would spend the delay on an empty map and the ten seconds on a spinner.
   * The effect re-runs when `landslideLoading` flips, which is where the
   * sequence really begins.
   */
  useEffect(() => {
    clear();
    held.current = false;
    setOpen(false);
    if (!active || landslideLoading) return;

    timers.current.push(
      setTimeout(() => {
        // a reader who opened it themselves in the meantime owns it now
        if (held.current) return;
        setOpen(true);
        timers.current.push(
          setTimeout(() => {
            if (!held.current) setOpen(false);
          }, AUTO_HIDE_MS),
        );
      }, SHOW_DELAY_MS),
    );

    return clear;
    // `key` is the real trigger; `active` is derived from it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, landslideLoading]);

  useEffect(() => clear, []);

  if (!active) return null;

  /** Reading it is reason enough to keep it. */
  const hold = () => {
    held.current = true;
    clear();
  };

  return (
    <div className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => {
          hold();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={open ? "Hide the map key" : "Show the map key"}
        className={`border-hairline flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur transition ${
          open ? "bg-tide text-abyss" : "bg-abyss/90 text-ink hover:border-tide"
        }`}
      >
        {open ? (
          <X className="size-3.5" aria-hidden="true" />
        ) : (
          <BookOpen className="size-3.5" aria-hidden="true" />
        )}
        Key
      </button>

      {/* Absolutely positioned so the button never moves when the legend
          opens or closes — a control that shifts under a finger mid-tap is
          how a toggle earns a double press.

          It opens downward on a phone, where this stack is anchored to the
          top of the map, and upward from lg, where it sits at the bottom.
          Same reasoning as the map-view popover beside it. */}
      <div
        data-open={open || undefined}
        inert={!open || undefined}
        onPointerEnter={hold}
        onPointerDown={hold}
        onFocusCapture={hold}
        /* The width has to be explicit. An absolutely positioned box with
           only `left-0` takes its available width from the positioned
           ancestor — here a ~60px pill — and shrink-to-fits into it, which
           wrapped the legend to two words a line and made it taller than the
           phone. 16rem clears a 320px screen with the stack's own inset. */
        className="nf-legendpop absolute top-full left-0 mt-2 flex w-64 flex-col gap-2 lg:top-auto lg:bottom-full lg:mt-0 lg:mb-2"
      >
        {showRain && <RainLegend grid={rainGrid} theme={theme} />}
        {showLandslide && (
          <LandslideLegend theme={theme} loading={landslideLoading} />
        )}
      </div>
    </div>
  );
}
