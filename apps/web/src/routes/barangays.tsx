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

function BarangaysScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchBarangays(query), [query]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <header className="mx-auto w-full max-w-3xl shrink-0 px-6 pt-10 pb-4 sm:px-8">
        <h1 className="text-ink text-3xl font-bold tracking-tight sm:text-4xl">Find your barangay</h1>
        <p className="text-ink-dim mt-3 text-base">
          {barangays.length} barangays across Davao City. Pick one to jump the
          map there.
        </p>

        <div className="border-hairline bg-raised/60 rounded-pill mt-4 flex items-center gap-2.5 border px-4">
          <Search className="text-ink-dim size-4 shrink-0" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search barangays"
            autoCorrect="off"
            className="text-ink placeholder:text-ink-dim min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
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

      <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto px-6 pb-10 sm:px-8">
        {results.length === 0 ? (
          <p className="text-ink-dim py-16 text-center text-sm">
            No barangay matches “{query}”.
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 sm:gap-x-6">
            {results.map((b) => (
              <li key={b.name}>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/",
                      search: { lng: b.center[0], lat: b.center[1] },
                    })
                  }
                  className="border-hairline/60 hover:bg-raised/40 flex w-full items-center gap-3 border-b py-3.5 text-left transition"
                >
                  <span className="border-hairline bg-raised/60 flex size-9 shrink-0 items-center justify-center rounded-full border">
                    {b.poblacion ? (
                      <Building2 className="text-tide size-4" aria-hidden="true" />
                    ) : (
                      <Leaf className="text-tide size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block text-[15px] font-semibold">
                      {b.name}
                    </span>
                    {b.poblacion && (
                      <span className="text-ink-dim block text-[11px]">
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
