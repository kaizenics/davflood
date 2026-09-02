import {
  LANDSLIDE_CAVEAT,
  landslideColorFor,
  landslideTiers,
} from "@davflood/hazard/landslide";

type Props = {
  theme: "dark" | "light";
  /** true while the overlay is still being fetched */
  loading?: boolean;
};

/**
 * The key for the landslide overlay.
 *
 * On the map rather than in the panel, like the rain legend and for the same
 * reason: it is only useful while you are looking at what it explains.
 *
 * It carries NOAH's own land-use ruling for each class rather than a
 * paraphrase — "No dwelling zone" is the published wording for the red class,
 * and softening a national standard into "high risk" would be this app
 * editorialising over an agency it is only republishing.
 *
 * The caveat is not negotiable. Purple polygons on a hazard map get read as a
 * prediction unless the words say otherwise, and susceptibility is a property
 * of a slope, not a forecast that it will fail.
 */
export function LandslideLegend({ theme, loading = false }: Props) {
  const colors = landslideColorFor(theme);

  return (
    <div className="border-hairline bg-abyss/85 pointer-events-none max-w-[16rem] rounded-xl border p-3 shadow-lg backdrop-blur">
      <p className="text-ink text-[11px] font-semibold">
        Landslide susceptibility
      </p>

      {loading ? (
        <p className="text-ink-dim mt-1.5 text-[10.5px] leading-relaxed">
          Loading the slope model…
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {landslideTiers.map((tier) => (
            <li key={tier.id} className="flex items-start gap-2">
              <span
                className="mt-[3px] size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: colors[tier.id] }}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="text-ink block text-[10.5px] font-medium">
                  {tier.label}
                </span>
                {/* NOAH's wording, quoted — see landslide.ts */}
                <span className="text-ink-dim block text-[10px] leading-snug">
                  {tier.guidance}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-ink-dim mt-2.5 text-[9.5px] leading-relaxed">
        {LANDSLIDE_CAVEAT}
      </p>
    </div>
  );
}
