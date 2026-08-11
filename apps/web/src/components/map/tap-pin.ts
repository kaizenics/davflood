/**
 * The marker on the spot you just tapped, carrying the offer to keep it.
 *
 * Plain DOM, like the other pins — maplibre owns the node and rewrites its
 * transform every frame.
 *
 * The button lives on the pin rather than in the panel because the pin is
 * where the place is. "Save this place" sitting in a column of text has to be
 * read to be understood; sitting on the point it would save, it explains
 * itself. It also means the thing being saved is never ambiguous — a panel
 * button describes a coordinate you cannot see.
 *
 * `.nf-pin` is pointer-events: none so the map keeps its own clicks; the
 * label opts back in, which is what makes the button clickable without the
 * pin swallowing drags across the rest of the map.
 */

const NS = "http://www.w3.org/2000/svg";

/** Same teardrop as every other pin — tip on the bottom edge of the viewBox. */
const PIN_PATH = "M12 32c0 0 9-13.4 9-21a9 9 0 1 0-18 0c0 7.6 9 21 9 21Z";
const HOUSE_PATH = "M12 6.2 6.6 10.6v6.2h3.5v-3.6h3.8v3.6h3.5v-6.2Z";

export function createTapPin(opts: {
  /** "Save this place" — already in the reader's language */
  label: string;
  onSave: () => void;
}): HTMLElement {
  const root = document.createElement("div");
  root.className = "nf-pin nf-pin--tap";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "nf-pin-label nf-pin-save";
  button.append(iconSvg(HOUSE_PATH, "nf-pin-save-icon", "0 0 24 24", 6.2));

  const text = document.createElement("span");
  text.className = "nf-pin-name";
  text.textContent = opts.label;
  button.append(text);

  button.addEventListener("click", (e) => {
    /* The map's own click handler sits on the canvas below this. Without
       this the save would also register as a tap on whatever polygon is
       underneath, reselecting the zone and moving the pin out from under the
       cursor mid-click. */
    e.stopPropagation();
    opts.onSave();
  });

  root.append(button);

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 32");
  svg.setAttribute("class", "nf-pin-glyph");
  svg.setAttribute("aria-hidden", "true");

  const body = document.createElementNS(NS, "path");
  body.setAttribute("d", PIN_PATH);
  body.setAttribute("class", "nf-pin-body");
  svg.append(body);

  const hole = document.createElementNS(NS, "circle");
  hole.setAttribute("cx", "12");
  hole.setAttribute("cy", "11");
  hole.setAttribute("r", "3.4");
  hole.setAttribute("class", "nf-pin-hole");
  svg.append(hole);

  root.append(svg);
  return root;
}

/** A small inline glyph for the button, drawn rather than imported. */
function iconSvg(
  path: string,
  className: string,
  viewBox: string,
  shift: number,
): SVGSVGElement {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const shape = document.createElementNS(NS, "path");
  // the house glyph is drawn for the pin body, which sits lower in its box
  shape.setAttribute("d", path);
  shape.setAttribute("transform", `translate(0 ${-shift})`);
  svg.append(shape);
  return svg;
}
