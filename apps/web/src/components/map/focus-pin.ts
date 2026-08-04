/**
 * The marker dropped on a barangay the user asked to be taken to.
 *
 * Built as plain DOM rather than a React component because maplibre owns the
 * node: `new maplibregl.Marker({ element })` rewrites its transform on every
 * frame to keep it pinned to a coordinate. Mounting a React root inside a
 * node someone else mutates buys reconciliation bookkeeping for markup that
 * never changes after it is created.
 *
 * Colour comes from CSS variables, not `@davflood/hazard/tokens`, so the pin
 * follows a light/dark switch without being rebuilt. `tide` — never a hazard
 * colour: this marks a place, not a severity.
 */

const NS = "http://www.w3.org/2000/svg";

/**
 * A teardrop whose tip sits exactly on the bottom edge of the viewBox, so
 * `anchor: "bottom"` puts the point of the pin on the coordinate with no
 * fudge offset.
 */
const PIN_PATH = "M12 32c0 0 9-13.4 9-21a9 9 0 1 0-18 0c0 7.6 9 21 9 21Z";

export function createFocusPin(opts: {
  name?: string;
  onClear?: () => void;
}): HTMLElement {
  const root = document.createElement("div");
  root.className = "nf-pin";

  if (opts.name) {
    const label = document.createElement("div");
    label.className = "nf-pin-label";

    const text = document.createElement("span");
    text.className = "nf-pin-name";
    text.textContent = opts.name;
    label.append(text);

    if (opts.onClear) {
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "nf-pin-clear";
      clear.setAttribute("aria-label", `Clear the pin on ${opts.name}`);
      clear.textContent = "×";
      clear.addEventListener("click", (e) => {
        // the map's own click handler sits on the canvas below this
        e.stopPropagation();
        opts.onClear?.();
      });
      label.append(clear);
    }

    root.append(label);
  }

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

  // sits under the tip and expands outwards — the thing that says "here",
  // and the reason the pin is findable after a long flight
  const pulse = document.createElement("span");
  pulse.className = "nf-pin-pulse";
  root.append(pulse);

  return root;
}
