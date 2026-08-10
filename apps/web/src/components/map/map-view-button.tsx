import { ChevronUp, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  MapViewControls,
  mapViewSummary,
  type MapViewProps,
} from "@/components/map/map-view-controls";

/**
 * "Map view", as a control on the map itself.
 *
 * It used to be a disclosure in the panel, which meant adjusting how the map
 * is drawn happened over here while the map was over there. On the map, the
 * change and the thing being changed are in the same glance — which is the
 * only way to tell whether the change was the one you wanted.
 *
 * Bottom-left: the reading floats top-left, the camera controls are
 * top-right, and the attribution sits bottom-right. It is the corner that was
 * free, and the far corner from the reading is the right place for chrome.
 *
 * Desktop only. The phone reaches the same controls from its own control
 * stack — see map-view-sheet.tsx.
 */
export function MapViewButton(props: MapViewProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    /* A click on the map is a click somewhere else. Anything that opens over
       the map has to close when attention moves back to it, or it becomes
       something the user has to dismiss before they can carry on. */
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div ref={root} className="pointer-events-auto relative">
      {open && (
        <div
          role="dialog"
          aria-label="Map view"
          className="nf-viewpop border-hairline bg-deep/95 absolute bottom-full left-0 mb-2 w-[19rem] rounded-2xl border p-4 shadow-2xl backdrop-blur-xl"
        >
          <MapViewControls {...props} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`border-hairline rounded-pill flex items-center gap-2.5 border py-2 pr-3 pl-3 shadow-lg backdrop-blur transition ${
          open ? "bg-raised text-ink" : "bg-abyss/90 text-ink hover:border-tide"
        }`}
      >
        <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
        <span className="text-left">
          <span className="block text-[12.5px] leading-tight font-semibold">
            Map view
          </span>
          <span className="text-ink-dim block text-[10.5px] leading-tight" data-numeric>
            {mapViewSummary(props)}
          </span>
        </span>
        <ChevronUp
          className={`text-ink-dim size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
