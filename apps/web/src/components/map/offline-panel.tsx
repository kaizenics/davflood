import { Check, Download, Loader2, WifiOff } from "lucide-react";

import { fill } from "@davflood/hazard/strings";

import { useStrings } from "@/lib/locale";
import { PACK_MB, useOfflinePack } from "@/lib/offline";

/**
 * Save the city to the device.
 *
 * The most useful thing this app can do is open during a storm, and during a
 * storm the network is gone. Everything else here is a refinement of a map
 * nobody can load.
 *
 * Deliberately a button rather than something automatic: it is the user's
 * data allowance, and a flood app that quietly downloads twelve megabytes is
 * not a good citizen of a prepaid connection.
 */
export function OfflinePanel() {
  const { state, progress, save, clear } = useOfflinePack();
  const { ui } = useStrings();

  if (state === "unsupported") return null;

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
            state === "saved" ? "bg-tide/12" : "bg-raised"
          }`}
        >
          {state === "saving" ? (
            <Loader2 className="text-tide size-4 animate-spin" aria-hidden="true" />
          ) : state === "saved" ? (
            <Check className="text-tide size-4" aria-hidden="true" />
          ) : (
            <WifiOff className="text-ink-dim size-4" aria-hidden="true" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-ink block text-[12.5px] font-semibold">
            {state === "saved" ? ui.savedOffline : ui.useWithoutSignal}
          </span>
          <span className="text-ink-dim block text-[11px]" data-numeric>
            {state === "saving"
              ? fill(ui.savingPct, { pct })
              : state === "saved"
                ? ui.opensNoConnection
                : fill(ui.packSize, { mb: PACK_MB })}
          </span>
        </span>

        {state === "idle" && (
          <button
            type="button"
            onClick={save}
            className="border-hairline text-ink hover:border-tide rounded-pill flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold transition"
          >
            <Download className="size-3.5" aria-hidden="true" />
            {ui.save}
          </button>
        )}

        {state === "saved" && (
          <button
            type="button"
            onClick={clear}
            className="text-ink-dim hover:text-ink shrink-0 text-[11px] font-medium transition"
          >
            {ui.remove}
          </button>
        )}
      </div>

      {state === "saving" && (
        <div
          className="bg-raised mt-2.5 h-1 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className="bg-tide block h-full transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {state === "saved" && progress.failed > 0 && (
        <p className="text-ink-dim mt-2 text-[10px] leading-relaxed">
          {fill(ui.tilesFailed, { failed: progress.failed, total: progress.total })}
        </p>
      )}

      <p className="text-ink-dim mt-2 text-[10px] leading-relaxed">
        {ui.offlineNote}
      </p>
    </div>
  );
}
