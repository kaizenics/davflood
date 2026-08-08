import type { HazardProperties } from "@davflood/hazard/schema";
import { type ReactNode, useEffect, useState } from "react";

import { ZonePanel } from "@/components/map/zone-panel";

/** Mirrors the `.nf-reading` exit duration in app.css. */
const EXIT_MS = 130;

type Props = {
  zone: HazardProperties | null;
  onClose: () => void;
  /** What the slot holds when nothing is selected — the city-wide reading. */
  children: ReactNode;
};

/**
 * The reading slot's presence layer.
 *
 * React unmounts on the same frame it re-renders, so an outgoing panel gets no
 * chance to animate. This holds the old content for one exit animation before
 * letting it go — `shown` trails `zone` by exactly that long.
 *
 * The direction carries the meaning. Narrowing from the city to one barangay
 * moves left-to-right, going back moves the other way, so the swap reads as a
 * drill-down rather than one block being replaced by another.
 */
export function ReadingSlot({ zone, onClose, children }: Props) {
  const [shown, setShown] = useState(zone);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [dir, setDir] = useState<"deeper" | "back">("back");

  useEffect(() => {
    if (zone === shown) return;

    /* Zone → zone is neither an open nor a close: the question stayed at the
       same scale and only the place changed. Swap at once and let the key
       replay the enter. Making the user sit through an exit here would put a
       stall between their tap and the depth they tapped for. */
    if (zone && shown) {
      setShown(zone);
      setPhase("in");
      return;
    }

    setDir(zone ? "deeper" : "back");
    setPhase("out");
    const t = setTimeout(() => {
      setShown(zone);
      setPhase("in");
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [zone, shown]);

  return (
    /* The key is what replays the animation: a changed key remounts the
       subtree, which restarts it from the first frame. Without it, tapping a
       second zone would swap the text with no motion at all. */
    <div
      key={shown ? shown.zone_id : "city"}
      data-phase={phase}
      data-dir={dir}
      className="nf-reading"
    >
      {shown ? <ZonePanel zone={shown} onClose={onClose} /> : children}
    </div>
  );
}
