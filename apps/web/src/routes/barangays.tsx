import {
  BARANGAYS_MAPPED,
  BARANGAYS_OFFICIAL,
  BARANGAYS_SURVEYED,
  barangays,
  searchBarangays,
} from "@davflood/hazard/barangays";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, ChevronRight, Leaf, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/barangays")({
  component: BarangaysScreen,
});

/**
 * The other way into the map: pick a name instead of hunting a city 53 km
 * across for it.
 *
 * The search box sticks to the top of the panel rather than scrolling away
 * with the first few results — with 182 names below it, a search field you
 * have to scroll back up to reach is a search field you stop using. See
 * routes/about.tsx for why nothing here sets a width or a `sm:` breakpoint.
 */
function BarangaysScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchBarangays(query), [query]);

  return (
    <div className="pb-8">
      <header className="bg-deep/95 border-hairline/60 sticky top-0 z-10 border-b px-5 pt-6 pb-4 backdrop-blur-xl">
        <h1 className="text-ink text-[1.7rem] leading-[1.15] font-semibold tracking-tight">
          Find your barangay
        </h1>
        <p className="text-ink-dim mt-2 text-[13.5px] leading-relaxed">
          {barangays.length} barangays across Davao City. Pick one to fly the
          map there.
        </p>

        <div className="border-hairline bg-raised/60 rounded-pill mt-3.5 flex items-center gap-2.5 border px-4">
          <Search className="text-ink-dim size-4 shrink-0" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search barangays"
            autoCorrect="off"
            className="text-ink placeholder:text-ink-dim min-w-0 flex-1 bg-transparent py-2.5 text-[13.5px] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-ink-dim hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      <div className="px-5">
        {results.length === 0 ? (
          <p className="text-ink-dim py-16 text-center text-[13.5px]">
            No barangay matches “{query}”.
          </p>
        ) : (
          <ul>
            {results.map((b) => (
              <li key={b.name}>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/",
                      search: {
                        lng: b.center[0],
                        lat: b.center[1],
                        b: b.name,
                      },
                    })
                  }
                  className="border-hairline/60 hover:bg-raised/40 -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 border-b px-2 py-3 text-left transition"
                >
                  <span className="border-hairline bg-raised/60 flex size-8 shrink-0 items-center justify-center rounded-full border">
                    {b.poblacion ? (
                      <Building2 className="text-tide size-4" aria-hidden="true" />
                    ) : (
                      <Leaf className="text-tide size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block text-[14px] font-semibold">
                      {b.name}
                    </span>
                    {b.poblacion && (
                      <span className="text-ink-dim block text-[10.5px]">
                        Poblacion
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className="text-ink-dim size-4 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-ink-dim mt-4 text-[10px] leading-relaxed">
          {BARANGAYS_SURVEYED} of these {BARANGAYS_MAPPED} barangays sit on a
          surveyed OpenStreetMap boundary; the rest are a single mapped point,
          so their position is approximate. Davao City officially has{" "}
          {BARANGAYS_OFFICIAL}. The hazard map is clipped to the city outline
          rather than built per barangay, so it covers the whole city either
          way.
        </p>
      </div>
    </div>
  );
}
