import { X } from "lucide-react";
import { useEffect } from "react";

import {
  MapViewControls,
  type MapViewProps,
} from "@/components/map/map-view-controls";

type Props = MapViewProps & {
  open: boolean;
  onClose: () => void;
};

/**
 * How the map is drawn, reachable from the map itself — phones only.
 *
 * Deliberately short: it stops well above the bottom of the screen so the map
 * stays in view behind it, which is the only way to tell whether a change was
 * the one you wanted. Desktop gets the same controls from a button in the
 * bottom-left corner of the map — see map-view-button.tsx.
 */
export function MapViewSheet({ open, onClose, ...controls }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="lg:hidden">
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close map view options"
          onClick={onClose}
          className="fixed inset-0 z-30 cursor-default bg-black/40"
        />
      )}

      <div
        role="dialog"
        aria-label="Map view"
        aria-hidden={!open}
        data-open={open}
        // rendered rather than mounted on open so it can animate both ways;
        // inert while closed so it cannot be tabbed into behind the map
        inert={!open}
        className="nf-viewsheet border-hairline bg-deep/95 fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-ink text-[13px] font-semibold">Map view</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map view options"
            className="text-ink-dim hover:text-ink -mr-1.5 rounded-lg p-1.5 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <MapViewControls {...controls} />
      </div>
    </div>
  );
}
