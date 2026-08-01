import { barangays, searchBarangays } from "@naboflood/hazard/barangays";
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
      <header className="shrink-0 px-5 pt-5 pb-3">
        <h1 className="text-ink text-2xl font-bold">Find your barangay</h1>
        <p className="text-ink-dim mt-1 text-sm">
          All {barangays.length} barangays of Panabo City. Pick one to jump the
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

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {results.length === 0 ? (
          <p className="text-ink-dim py-16 text-center text-sm">
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
          Barangay positions are approximate until surveyed boundary data is
          loaded.
        </p>
      </div>
    </div>
  );
}
