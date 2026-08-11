import { zoneAt } from "@davflood/hazard/place";
import type { SavedPlace } from "@davflood/hazard/place";
import { formatDepth } from "@davflood/hazard/schema";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { fill } from "@davflood/hazard/strings";
import { House, MapPin, X } from "lucide-react";
import { useMemo } from "react";

import { hazardBg, hazardText } from "@/lib/hazard-classes";
import { useStrings } from "@/lib/locale";
import { useSavedPlace } from "@/lib/saved-place";

/**
 * What the model says about the one place a person actually cares about.
 *
 * The map has always been able to answer "how deep here" for wherever you are
 * currently pointing. This answers it for your house while you are at work on
 * the other side of the city and it has started raining — which is the
 * version of the question people open a flood map to ask.
 *
 * Re-read on every scenario change, because the answer genuinely differs: a
 * street that stays dry in a 5-year storm can be waist-deep in a 100-year
 * one, and a card that kept showing the first answer would be worse than no
 * card.
 */
export function SavedPlaceCard({
  data,
  scenario,
  onShow,
}: {
  data: GeoJSON.FeatureCollection;
  scenario: ScenarioYears;
  onShow: (place: SavedPlace) => void;
}) {
  const { place, forget } = useSavedPlace();
  const t = useStrings();

  const zone = useMemo(
    () => (place ? zoneAt(data, place.center) : null),
    [data, place],
  );

  if (!place) return null;

  return (
    <section
      aria-label={t.place.title}
      className="border-hairline/60 relative border-t px-5 py-4"
    >
      {zone && (
        <span
          className={`${hazardBg[zone.hazard]} absolute top-0 bottom-0 left-0 w-[3px]`}
          aria-hidden="true"
        />
      )}

      <div className="flex items-baseline gap-2">
        <p className="text-ink-dim text-[10px] font-semibold tracking-[0.13em] uppercase">
          {t.place.title}
        </p>
        <button
          type="button"
          onClick={forget}
          aria-label={t.place.forget}
          title={t.place.forget}
          className="text-ink-dim hover:text-ink ml-auto -mr-1 flex size-5 shrink-0 items-center justify-center rounded transition"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="text-ink mt-1.5 flex items-center gap-2 text-[14px] leading-snug font-semibold">
        <House className="text-tide size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate">{place.label}</span>
      </p>
      {place.barangay && (
        <p className="text-ink-dim mt-0.5 pl-6 text-[11px]">
          Brgy. {place.barangay}
        </p>
      )}

      {/* The depth, then the sentence. Dry is not "no data" — it is the
          answer most people are hoping for, and it gets said in full. */}
      {zone ? (
        <>
          <p
            className={`${hazardText[zone.hazard]} mt-3 text-[22px] leading-none font-semibold tracking-tight`}
            data-numeric
          >
            {formatDepth(zone)}
          </p>
          <p className="text-ink-dim mt-2 text-[12px] leading-relaxed">
            {fill(t.place.inFootprint, {
              years: scenario,
              depth: formatDepth(zone),
            })}
          </p>
        </>
      ) : (
        <p className="text-ink-dim mt-2.5 text-[12px] leading-relaxed">
          {fill(t.place.dry, { years: scenario })}
        </p>
      )}

      <button
        type="button"
        onClick={() => onShow(place)}
        className="border-hairline text-ink-dim hover:text-ink hover:border-tide rounded-pill mt-3 flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium transition"
      >
        <MapPin className="size-3.5" aria-hidden="true" />
        {t.place.show}
      </button>
    </section>
  );
}
