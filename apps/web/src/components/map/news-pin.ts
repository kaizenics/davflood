import { describeAge, newsOpacity } from "@davflood/hazard/news";
import type { NewsItem } from "@davflood/hazard/news";

/**
 * A marker for "this place was in the news".
 *
 * Neutral on purpose. The hazard ramp means expected depth and the focus pin
 * means the place you searched for; a news mention is neither, so it gets the
 * panel's own surface colours and a count instead of a hue. Nothing here may
 * look like a severity.
 *
 * Older reports fade but stay: a flood in a barangay six weeks ago is still
 * the most useful thing anyone can tell you about that barangay, and it is
 * the kind of local memory a hazard model has no way to hold.
 */

export type NewsPin = {
  barangay: string;
  center: [number, number];
  items: NewsItem[];
};

export function createNewsPin(
  pin: NewsPin,
  onOpen: (pin: NewsPin) => void,
): HTMLElement {
  const newest = pin.items[0];
  const root = document.createElement("button");
  root.type = "button";
  root.className = "nf-newspin";
  root.setAttribute(
    "aria-label",
    `${pin.items.length} flood report${pin.items.length === 1 ? "" : "s"} mentioning ${pin.barangay}, most recent ${newest ? describeAge(newest.date) : ""}`,
  );
  root.title = `${pin.barangay} — ${pin.items.length} report${pin.items.length === 1 ? "" : "s"}`;

  /**
   * The age fade goes on an inner element, not on the button.
   *
   * MapLibre's Marker writes `element.style.opacity` itself while terrain is
   * on — that is how it fades markers occluded by a hill — so anything set on
   * the root is overwritten on the next frame. Owning a child leaves both
   * mechanisms working.
   */
  const inner = document.createElement("span");
  inner.className = "nf-newspin-inner";
  inner.style.opacity = String(newest ? newsOpacity(newest.date) : 0.6);

  const dot = document.createElement("span");
  dot.className = "nf-newspin-dot";
  dot.textContent = String(pin.items.length);
  inner.append(dot);

  const label = document.createElement("span");
  label.className = "nf-newspin-label";
  label.textContent = pin.barangay;
  inner.append(label);

  root.append(inner);

  root.addEventListener("click", (e) => {
    // the map's own click handler is on the canvas below this
    e.stopPropagation();
    onOpen(pin);
  });

  return root;
}
