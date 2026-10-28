import { rainBand } from "@davflood/hazard/rainfall";
import { fill } from "@davflood/hazard/strings";
import { ChevronDown, CloudRain, Waves, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  fmt,
  RainDetail,
  weatherIcon,
  weatherLabel,
} from "@/components/map/rainfall-panel";
import {
  RiverDetail,
  riverIsNotable,
  riverLevelText,
  useRiver,
} from "@/components/map/river-panel";
import { useStrings } from "@/lib/locale";
import { useRainfall } from "@/hooks/use-rainfall";
import { useMounted } from "@/lib/query";
import { cn } from "@/lib/utils";

type Open = "rain" | "river" | null;

/**
 * "Right now": the two live signals as a pair of tiles, each opening its own
 * detail underneath.
 *
 * Side by side because they are read together — rain overhead and water
 * already in the river are the two halves of "is it getting worse" — and a
 * big number each is what someone glancing at a phone in a storm can take in.
 *
 * Brand colour throughout, never the hazard ramp: neither millimetres nor
 * cubic metres per second are a flood depth class.
 *
 * Each tile fails on its own — no connection to Open-Meteo leaves the river
 * standing, and the reverse.
 */
export function ConditionsCard() {
  const { ui } = useStrings();
  const rain = useRainfall();
  const river = useRiver();

  // see lib/query.ts — the server and the first client render must agree
  const mounted = useMounted();
  const rainPending = !mounted || rain.isLoading;
  const riverPending = !mounted || river.isLoading;
  const rainData = !rainPending && !rain.isError ? rain.data : undefined;
  const riverData = !riverPending && !river.isError ? river.data : undefined;

  const today = rainData?.days[0];
  const band = today ? rainBand(today.precipitation) : "none";
  const notable = !!riverData && riverIsNotable(riverData);

  /* Until the reader picks, a river running high opens itself: its chart is
     the one thing on this card that says "this is getting worse". */
  const [choice, setChoice] = useState<Open | undefined>(undefined);
  const open: Open = choice === undefined ? (notable ? "river" : null) : choice;
  const toggle = (which: "rain" | "river") =>
    setChoice(open === which ? null : which);

  return (
    <section className="bg-deep border-hairline/70 rounded-card overflow-hidden border">
      <div className="px-4 pt-3.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-ink-dim flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.14em] uppercase">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="bg-tide absolute inset-0 rounded-full motion-safe:animate-ping motion-safe:opacity-60" />
              <span className="bg-tide relative size-1.5 rounded-full" />
            </span>
            {ui.rightNow}
          </h2>
          <span className="text-ink-dim/80 text-[10.5px]">{ui.liveForecasts}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Tile
            id="rain"
            open={open === "rain"}
            onToggle={() => toggle("rain")}
            disabled={!rainData}
            icon={rainData ? weatherIcon(rainData.current.weatherCode) : CloudRain}
            label={rainData ? weatherLabel(rainData.current.weatherCode, ui) : ui.rain}
            value={rainPending ? "…" : today ? fmt(today.precipitation) : "—"}
            unit={today ? ui.mmToday : undefined}
            sub={
              rainPending
                ? ui.checking
                : today
                  ? fill(ui.rainChance, { n: Math.round(today.probability) })
                  : ui.unavailable
            }
            badge={
              band === "light"
                ? ui.bandLight
                : band === "moderate"
                  ? ui.bandModerate
                  : band === "heavy"
                    ? ui.bandHeavy
                    : undefined
            }
          />
          <Tile
            id="river"
            open={open === "river"}
            onToggle={() => toggle("river")}
            disabled={!riverData}
            icon={Waves}
            label={ui.riverName}
            value={riverPending ? "…" : riverData ? riverData.today.toFixed(0) : "—"}
            unit={riverData ? "m³/s" : undefined}
            sub={
              riverPending
                ? ui.checking
                : riverData
                  ? fill(ui.timesUsual, { n: riverData.timesNormal.toFixed(1) })
                  : ui.unavailable
            }
            badge={riverData ? riverLevelText(riverData, ui).label : undefined}
            loud={notable}
          />
        </div>
      </div>

      {/* Both details stay mounted so closing animates too — see
          `.nf-collapse` in app.css. `inert` keeps the closed one out of the
          tab order and the accessibility tree. */}
      <Detail id="rain" open={open === "rain" && !!rainData}>
        <RainDetail />
      </Detail>
      <Detail id="river" open={open === "river" && !!riverData}>
        {riverData && <RiverDetail river={riverData} />}
      </Detail>
      <div className="h-3.5" />
    </section>
  );
}

function Tile({
  id,
  open,
  onToggle,
  disabled,
  icon: Icon,
  label,
  value,
  unit,
  sub,
  badge,
  loud = false,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  loud?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={open}
      aria-controls={`conditions-${id}`}
      className={cn(
        "group relative flex min-w-0 flex-col rounded-[14px] border p-3 text-left transition",
        "disabled:cursor-default disabled:opacity-70",
        open
          ? "border-tide/50 bg-tide/8"
          : "border-hairline/70 bg-raised/40 enabled:hover:border-hairline enabled:hover:bg-raised/70",
        "enabled:active:scale-[0.98]",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            disabled ? "bg-raised" : "bg-tide/14",
          )}
        >
          <Icon
            className={cn("size-4", disabled ? "text-ink-dim" : "text-tide")}
            aria-hidden="true"
          />
        </span>
        <span className="text-ink min-w-0 flex-1 truncate text-[12px] font-semibold">
          {label}
        </span>
        {!disabled && (
          <ChevronDown
            className={cn(
              "text-ink-dim size-3.5 shrink-0 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        )}
      </span>

      <span className="mt-3 flex items-baseline gap-1" data-numeric>
        <span className="text-ink text-[26px] leading-none font-semibold tracking-[-0.03em]">
          {value}
        </span>
        {unit && (
          <span className="text-ink-dim text-[11px] font-medium">{unit}</span>
        )}
      </span>

      <span className="text-ink-dim mt-1.5 truncate text-[11px]" data-numeric>
        {sub}
      </span>

      {badge && (
        <span
          className={cn(
            "mt-2.5 self-start rounded-md px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.08em] uppercase",
            loud ? "bg-tide text-abyss" : "bg-tide/14 text-tide",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Detail({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div id={`conditions-${id}`} className="nf-collapse" data-open={open} inert={!open}>
      <div>
        <div className="px-4 pt-4">{children}</div>
      </div>
    </div>
  );
}
