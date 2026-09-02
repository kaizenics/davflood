import { barangayBySlug, profileFor } from "@davflood/hazard/barangay";
import { formatArea, formatShare } from "@davflood/hazard/footprint";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { slugify } from "@davflood/hazard/slug";
import { hazardById } from "@davflood/hazard/tiers";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Leaf, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { hazardBg, hazardText } from "@/lib/hazard-classes";

/** Mirrors the `.nf-card` exit duration in app.css. */
const EXIT_MS = 190;

/**
 * What the model says about the barangay currently framed on the map.
 *
 * Picking a barangay used to mean leaving the map for a profile page, then
 * pressing a button to come back to the map. The list now flies the camera
 * straight there, which is what someone looking for their own barangay
 * wanted — but flying there and saying nothing traded one problem for
 * another, because the name on a pin is not an answer to "does it flood".
 * This is that answer, in the panel, beside the map showing it.
 *
 * Deliberately the SHORT version. The full page still exists, still carries
 * every scenario side by side, and is one tap away; this card answers the
 * scenario the map is currently set to and stops. Re-reads on every scenario
 * change, for the same reason SavedPlaceCard does — a barangay that stays dry
 * in a 5-year storm can be chest-deep in a 100-year one.
 */
export function BarangayCard({
  name,
  scenario,
  onClear,
}: {
  name: string;
  scenario: ScenarioYears;
  onClear?: () => void;
}) {
  const profile = useMemo(() => {
    const barangay = barangayBySlug(slugify(name));
    return barangay ? profileFor(barangay) : null;
  }, [name]);

  /**
   * Hold the card open for its own exit.
   *
   * Dismissing it clears `b` from the URL, and React unmounts on the same
   * frame it re-renders — so the card had no chance to animate and simply
   * blinked out. `closing` delays the caller by exactly one animation.
   *
   * The same trick the reading slot uses for its swap; see reading-slot.tsx.
   */
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // navigating away mid-animation should not fire a route change behind
    // whatever the reader went to instead
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function dismiss() {
    if (closing) return; // a second press must not queue a second navigation
    setClosing(true);
    timer.current = setTimeout(() => onClear?.(), EXIT_MS);
  }

  // a `b` in the URL that matches no barangay is a hand-edited link, not a
  // state worth rendering an error for
  if (!profile) return null;

  const row = profile.scenarios.find((s) => s.years === scenario);
  const stat = row?.stat;
  const worst = row?.worst ?? null;

  return (
    <div
      data-phase={closing ? "out" : "in"}
      className="nf-card border-hairline/60 relative border-t px-5 py-4"
    >
      {worst && (
        <span
          className={`${hazardBg[worst]} absolute top-0 bottom-0 left-0 w-[3px]`}
          aria-hidden="true"
        />
      )}

      <div className="flex items-baseline gap-2">
        <p className="text-ink-dim text-[10px] font-semibold tracking-[0.13em] uppercase">
          Barangay
        </p>
        {onClear && (
          <button
            type="button"
            onClick={dismiss}
            aria-label={`Stop showing ${name}`}
            className="text-ink-dim hover:text-ink ml-auto -mr-1 flex size-5 shrink-0 items-center justify-center rounded transition"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="text-ink mt-1.5 flex items-center gap-2 text-[14px] leading-snug font-semibold">
        <Leaf className="text-tide size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate">{name}</span>
      </p>

      {stat && stat.total > 0 && worst ? (
        <>
          {/* The share leads when it exists, because "a third of it" is a
              scale a person holds in their head and "2.1 km²" is not. Where
              OSM has no boundary there is no share, and the area leads
              instead — see BARANGAYS_WITH_BOUNDARY in barangay-profiles. */}
          <p
            className={`${hazardText[worst]} mt-3 text-[22px] leading-none font-semibold tracking-tight`}
            data-numeric
          >
            {stat.share !== null
              ? formatShare(stat.share)
              : `${formatArea(stat.total)} km²`}
          </p>
          <p className="text-ink-dim mt-2 text-[12px] leading-relaxed">
            {stat.share !== null ? (
              <>
                of {name} floods in a {row.label} storm — about{" "}
                {formatArea(stat.total)} km²
                {profile.areaKm2 !== null
                  ? ` of its ${formatArea(profile.areaKm2)} km²`
                  : ""}
                , reaching {hazardById[worst].depthShort}.
              </>
            ) : (
              <>
                of modelled flooding near {name} in a {row.label} storm,
                reaching {hazardById[worst].depthShort}. OpenStreetMap has no
                boundary for this barangay, so there is no area to take a share
                of.
              </>
            )}
          </p>
        </>
      ) : (
        <p className="text-ink-dim mt-2.5 text-[12px] leading-relaxed">
          The {row?.label ?? "selected"} model does not flood {name}. That is
          the model&apos;s answer, not a promise — it says nothing about
          drainage failures or a storm larger than this one.
        </p>
      )}

      <Link
        to="/barangay/$slug"
        params={{ slug: profile.slug }}
        className="border-hairline text-ink-dim hover:text-ink hover:border-tide rounded-pill mt-3 flex w-fit items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium transition"
      >
        Every storm size
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
