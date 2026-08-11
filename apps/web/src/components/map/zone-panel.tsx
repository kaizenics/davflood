import { formatDepth } from "@davflood/hazard/schema";
import type { HazardProperties } from "@davflood/hazard/schema";
import { scenarioByYears } from "@davflood/hazard/scenarios";
import { directionsUrl } from "@davflood/hazard/evacuation";
import type { NearestSite } from "@davflood/hazard/evacuation";
import type { LngLat } from "@davflood/hazard/geo";
import { formatDistance } from "@davflood/hazard/safe-ground";
import type { SafeGround } from "@davflood/hazard/safe-ground";
import { hazardById } from "@davflood/hazard/tiers";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Navigation, Phone } from "lucide-react";

import { hazardBg, hazardText } from "@/lib/hazard-classes";

type Props = {
  zone: HazardProperties;
  /** where the tap landed — the origin every distance here is measured from */
  at?: LngLat | null;
  onClose: () => void;
  /** nearest point outside the modelled footprint, if the tap was inside one */
  safeGround?: SafeGround | null;
  onShowSafeGround?: () => void;
  /** nearest public building the scenario does not flood */
  evacuation?: NearestSite | null;
  onShowEvacuation?: () => void;
};

/**
 * The tapped zone — the same question the city reading answers, asked of one
 * place instead of the whole city. It takes over that slot rather than sitting
 * below it: this is the answer the user just asked for, and it used to render
 * six sections down, off the bottom of the panel.
 *
 * Order is deliberate: WHERE, HOW DEEP, WHAT IT MEANS, WHAT TO DO.
 *
 * The severity colour is load-bearing here — stripe, figure and label all
 * carry it — because this block is a hazard statement. Everything around it
 * stays on the brand accent for exactly the same reason.
 */
export function ZonePanel({
  zone,
  at,
  onClose,
  safeGround,
  onShowSafeGround,
  evacuation,
  onShowEvacuation,
}: Props) {
  const tier = hazardById[zone.hazard];
  const scenario = scenarioByYears[zone.scenario];

  return (
    <section
      aria-label={`Selected zone in Barangay ${zone.barangay}`}
      className="relative px-5 pt-4 pb-5"
    >
      <span
        className={`${hazardBg[zone.hazard]} absolute top-0 bottom-0 left-0 w-[3px]`}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onClose}
        className="text-ink-dim hover:text-ink -ml-1 flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-medium transition"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to the whole city
      </button>

      <h2 className="text-ink mt-2 text-[15px] leading-snug font-semibold text-balance">
        Brgy. {zone.barangay}
      </h2>

      {/* the number people actually came for */}
      <p
        className={`${hazardText[zone.hazard]} mt-3 text-[30px] leading-none font-semibold tracking-tight`}
        data-numeric
      >
        {formatDepth(zone)}
      </p>
      <p
        className={`${hazardText[zone.hazard]} mt-1.5 text-[12.5px] font-semibold`}
      >
        {tier.summary.replace(/\.$/, "")} · {tier.name}
      </p>

      <p className="text-ink-dim mt-1 text-[11px]">
        In a {scenario.label} storm · {scenario.annualChance} chance in any
        given year
      </p>

      <p className="text-ink-dim mt-3.5 text-[12.5px] leading-relaxed">
        {tier.human}
      </p>

      <div className="border-hairline/60 mt-3.5 border-t pt-3">
        <p className="text-ink text-[12.5px] leading-relaxed">
          <span className="text-ink font-semibold">What to do: </span>
          {tier.action}
        </p>
      </div>

      {/* The next question after "how deep" is always "which way".
          A straight-line distance is a poor answer to it, but it is a far
          better one than the silence that was here before — and the wording
          has to carry what it leaves out. */}
      {safeGround && (
        <div className="border-hairline/60 mt-3 border-t pt-3">
          <div className="flex items-baseline gap-2">
            <p className="text-ink flex-1 text-[12.5px] leading-relaxed">
              <span className="font-semibold">Out of the water: </span>
              about {formatDistance(safeGround.meters)} {safeGround.direction}.
            </p>
            {onShowSafeGround && (
              <button
                type="button"
                onClick={onShowSafeGround}
                className="border-hairline text-ink-dim hover:text-ink hover:border-tide rounded-pill flex shrink-0 items-center gap-1 border px-2 py-0.5 text-[10.5px] font-medium transition"
              >
                <Navigation className="size-3" aria-hidden="true" />
                Show
              </button>
            )}
          </div>
          <p className="text-ink-dim mt-1.5 text-[10.5px] leading-relaxed">
            Straight line to the nearest ground this scenario does not flood.
            Higher ground may be further.
          </p>
        </div>
      )}

      {evacuation && (
        <div className="border-hairline/60 mt-3 border-t pt-3">
          <p className="text-ink-dim text-[10px] font-semibold tracking-[0.13em] uppercase">
            Somewhere to go
          </p>
          <p className="text-ink mt-1.5 text-[13px] leading-snug font-semibold text-balance">
            {evacuation.site.name}
          </p>
          <p className="text-ink-dim mt-0.5 text-[11px]" data-numeric>
            {evacuation.site.kind} · {formatDistance(evacuation.meters)}{" "}
            {evacuation.direction}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {onShowEvacuation && (
              <button
                type="button"
                onClick={onShowEvacuation}
                className="border-hairline text-ink hover:border-tide rounded-pill flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold transition"
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                Show on map
              </button>
            )}
            <a
              href={directionsUrl(evacuation.site.center, at)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-tide text-abyss rounded-pill flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold transition hover:opacity-90"
            >
              <Navigation className="size-3.5" aria-hidden="true" />
              Directions
            </a>
          </div>

          <p className="text-ink-dim mt-2.5 text-[10.5px] leading-relaxed">
            A public building on ground this scenario does not flood — not a
            designated evacuation centre. Directions open Google Maps
            {at ? " walking from the spot you tapped" : ""}, which does not
            know which roads are flooded.
          </p>
          {/* The sentence above admits what this app cannot know. This is the
              link to the people who do — without it, the admission is a dead
              end at the exact moment somebody needs the next step. */}
          <Link
            to="/emergency"
            className="border-haz-high/40 bg-haz-high/8 hover:bg-haz-high/14 mt-2.5 flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition"
          >
            <Phone
              className="text-haz-high size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="text-ink text-[11px] font-semibold">
              Hotlines &amp; official centres
            </span>
            <span
              data-numeric
              className="text-haz-high ml-auto text-[11px] font-bold"
            >
              911
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
