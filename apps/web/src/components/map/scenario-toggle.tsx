import { scenarios } from "@davflood/hazard/scenarios";
import type { ScenarioYears } from "@davflood/hazard/scenarios";

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
  return (
    <div
      role="radiogroup"
      aria-label="Flood scenario"
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
            aria-label={`${s.label} flood scenario`}
            onClick={() => onChange(s.years)}
            className={`flex flex-1 flex-col items-center rounded-[9px] py-2 transition active:scale-[0.98] ${
              active
                ? "bg-deep text-ink ring-tide/60 shadow-sm ring-1"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            <span className="text-[12.5px] font-semibold">{s.years}-yr storm</span>
            <span
              className={`text-[10px] ${active ? "text-tide" : "opacity-80"}`}
              data-numeric
            >
              {s.annualChance} a year
            </span>
          </button>
        );
      })}
    </div>
  );
}
