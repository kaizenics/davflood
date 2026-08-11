/**
 * The marker on the place someone saved.
 *
 * Plain DOM for the same reason as focus-pin.ts: maplibre owns the node and
 * rewrites its transform every frame.
 *
 * Deliberately a DIFFERENT pin from the focus one, in two ways that both
 * matter:
 *
 *   OUTLINED, not filled. A solid tide pin means "the thing you just asked to
 *   be taken to". This one is always on the map whether you asked or not, so
 *   it has to read as furniture rather than as an answer — otherwise every
 *   session starts with the map appearing to have selected something.
 *
 *   NO PULSE. The focus pin pulses because it has just landed and needs
 *   finding. This one has been there since the app opened; a marker pulsing
 *   forever is a marker people stop seeing, and it would be pulsing over the
 *   one place they most need to look at.
 */

const NS = "http://www.w3.org/2000/svg";

/** Same teardrop as the focus pin — tip on the bottom edge of the viewBox. */
const PIN_PATH = "M12 32c0 0 9-13.4 9-21a9 9 0 1 0-18 0c0 7.6 9 21 9 21Z";
/** A house, small enough to read at 22px wide. */
const HOUSE_PATH = "M12 6.2 6.6 10.6v6.2h3.5v-3.6h3.8v3.6h3.5v-6.2Z";

export function createHomePin(opts: { name: string }): HTMLElement {
  const root = document.createElement("div");
  root.className = "nf-pin nf-pin--home";

  const label = document.createElement("div");
  label.className = "nf-pin-label";
  const text = document.createElement("span");
  text.className = "nf-pin-name";
  text.textContent = opts.name;
  label.append(text);
  root.append(label);

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 32");
  svg.setAttribute("class", "nf-pin-glyph");
  svg.setAttribute("aria-hidden", "true");

  const body = document.createElementNS(NS, "path");
  body.setAttribute("d", PIN_PATH);
  body.setAttribute("class", "nf-pin-body");
  svg.append(body);

  const house = document.createElementNS(NS, "path");
  house.setAttribute("d", HOUSE_PATH);
  house.setAttribute("class", "nf-pin-house");
  svg.append(house);

  root.append(svg);
  return root;
}
