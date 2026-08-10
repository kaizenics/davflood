import { RIVER_GAUGE, RIVER_NORMAL } from "@davflood/hazard/river";
import type { River } from "@davflood/hazard/river";
import { Waves } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { gcTime, useMounted } from "@/lib/query";

import { fetchRiver } from "@davflood/hazard/river";

/**
 * The river, forecast from rainfall over the whole catchment.
 *
 * This is the one signal in the app that can see water the sky above you
 * cannot: rain that fell upstream hours ago and is still on its way down. It
 * is also the easiest to over-read, so the wording does the same job the rain
 * legend does — says what it is, and says what it is not.
 *
 * Brand colour, never the hazard ramp. A river running high is not a depth
 * band, and the moment those two share a palette the map starts making claims
 * neither of them supports.
 */
export function RiverPanel() {
  const { data, isLoading, isError } = useQuery<River>({
    // client-only, like every fetch here — see use-news-pins.ts
    enabled: typeof window !== "undefined",
    queryKey: ["river", "davao"],
    queryFn: ({ signal }) => fetchRiver(signal),
    // GloFAS is a daily model; polling faster returns the same number
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: gcTime(24 * 60 * 60 * 1000),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // see lib/query.ts — the server and the first client render must agree
  const mounted = useMounted();
  const pending = !mounted || isLoading;
  // three states, and only `ready` may touch `data`
  const ready = !pending && !isError && !!data;
  const notable = ready && data.level.id !== "low" && data.level.id !== "normal";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            ready ? "bg-tide/12" : "bg-raised"
          }`}
        >
          <Waves
            className={`size-[18px] ${ready ? "text-tide" : "text-ink-dim"}`}
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-[13.5px] font-semibold">
            {pending
              ? "Checking the river…"
              : ready
                ? `${RIVER_GAUGE.name} — ${data.level.label.toLowerCase()}`
                : "River forecast unavailable"}
          </span>
          <span className="text-ink-dim block truncate text-[11.5px]" data-numeric>
            {pending
              ? " "
              : ready
                ? `${data.today.toFixed(0)} m³/s · ${data.timesNormal.toFixed(1)}× the usual`
                : "The map still works without it"}
          </span>
        </span>

        {notable && (
          <span className="text-tide bg-tide/12 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            {data.level.label}
          </span>
        )}
      </div>

      {ready && (
        <>
          <p className="text-ink-dim mt-2.5 text-[12px] leading-relaxed">
            {data.level.blurb}
            {data.peak
              ? ` Forecast to peak around ${data.peak.discharge.toFixed(0)} m³/s on ${weekday(data.peak.date)}.`
              : ""}
          </p>

          <p className="text-ink-dim mt-2 text-[10px] leading-relaxed">
            Modelled flow in the river channel {RIVER_GAUGE.where}, against its{" "}
            {RIVER_NORMAL.from}–{RIVER_NORMAL.to} range. It says how hard the
            river is running — not that anywhere is flooded.
          </p>
        </>
      )}
    </div>
  );
}

function weekday(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-PH", { weekday: "long" });
}
