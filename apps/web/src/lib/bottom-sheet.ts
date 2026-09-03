import { useCallback, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

/**
 * How much of the sheet stays on screen when it is closed. Must match the
 * `translate-y-[calc(100%-...)]` class on the sheet — the drag maths works in
 * pixels and the resting position is a CSS transform, so the two have to agree
 * on where "closed" is.
 */
export const SHEET_PEEK_PX = 60;

/** Past this many pixels a drag counts as a decision rather than a wobble. */
const COMMIT_PX = 48;

/**
 * A bottom sheet you can drag, for the map panel on small screens.
 *
 * The resting positions are CSS classes so the sheet is correct before any JS
 * runs and on a desktop breakpoint where it is not a sheet at all. The drag
 * only takes over in between: it writes an inline transform while the finger
 * is down and hands control back to the class on release, which is what makes
 * the snap animate.
 */
export function useBottomSheet(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const ref = useRef<HTMLElement | null>(null);
  const startY = useRef<number | null>(null);
  const moved = useRef(false);

  /** distance between the open and closed resting positions */
  const travel = useCallback(
    () => Math.max(0, (ref.current?.offsetHeight ?? 0) - SHEET_PEEK_PX),
    [],
  );

  const release = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.style.transition = "";
      el.style.transform = "";
    }
    startY.current = null;
  }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    // a second finger means the user is pinching the map, not dragging this
    if (!e.isPrimary) return;
    startY.current = e.clientY;
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = ref.current;
    // the transition would lag the finger; it comes back on release
    if (el) el.style.transition = "none";
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (startY.current === null) return;
      const el = ref.current;
      if (!el) return;
      const max = travel();
      const dy = e.clientY - startY.current;
      if (Math.abs(dy) > 3) moved.current = true;
      // clamp to the two resting positions — the sheet never leaves the screen
      // and never floats above its open height
      const next = Math.min(max, Math.max(0, (open ? 0 : max) + dy));
      el.style.transform = `translateY(${next}px)`;
    },
    [open, travel],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (startY.current === null) return;
      const dy = e.clientY - startY.current;
      release();
      // a tap toggles; a drag goes where it was thrown
      if (!moved.current) setOpen((v) => !v);
      else if (dy <= -COMMIT_PX) setOpen(true);
      else if (dy >= COMMIT_PX) setOpen(false);
    },
    [release],
  );

  /**
   * The handle is a `<button aria-expanded>`, so it has to work like one.
   *
   * Toggling lived entirely in `onPointerUp`, which keyboard activation never
   * fires — so the control announced itself as expandable to a screen reader
   * and then did nothing on Enter or Space. Handled here rather than with
   * `onClick`, which a pointer drag also fires: that would toggle the sheet a
   * second time at the end of every throw, undoing the gesture.
   */
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    // Space scrolls the page otherwise, and this sheet is the page
    e.preventDefault();
    setOpen((v) => !v);
  }, []);

  return {
    open,
    setOpen,
    /** put on the sheet element itself */
    ref,
    /** put on the grab handle */
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: release,
      onKeyDown,
      // the browser must not also scroll or pull-to-refresh on this gesture
      style: { touchAction: "none" as const },
    },
  };
}
