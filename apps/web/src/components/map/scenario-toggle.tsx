import { scenarios } from "@davflood/hazard/scenarios";
import type { ScenarioYears } from "@davflood/hazard/scenarios";
import { fill } from "@davflood/hazard/strings";

import { useStrings } from "@/lib/locale";

type Props = {
  value: ScenarioYears;
  onChange: (value: ScenarioYears) => void;
};

/**
 * 5 / 25 / 100-year switch.
 *
 * Uses the brand accent, never a hazard colour — the control is not itself a
 * severity signal, and conflating the two is how people misread a map.
 */
export function ScenarioToggle({ value, onChange }: Props) {
  const { ui } = useStrings();
  return (
    <div
      role="radiogroup"
      aria-label={ui.scenarioGroup}
      className="bg-raised/60 border-hairline/60 flex w-full gap-0.5 rounded-xl border p-0.5"
    >
      {scenarios.map((s) => {
        const active = s.years === value;
        return (
          <button
            key={s.years}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={fill(ui.scenarioAria, { n: s.years })}
            onClick={() => onChange(s.years)}
            className={`flex flex-1 flex-col items-center rounded-[9px] py-2 transition active:scale-[0.98] ${
              active
                ? "bg-deep text-ink ring-tide/60 shadow-sm ring-1"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            <span className="text-[12.5px] font-semibold">{fill(ui.stormYr, { n: s.years })}</span>
            <span
              className={`text-[10px] ${active ? "text-tide" : "opacity-80"}`}
              data-numeric
            >
              {fill(ui.perYear, { p: s.annualChance })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
