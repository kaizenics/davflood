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
      className="bg-raised/70 flex w-full gap-0.5 rounded-lg p-0.5"
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
            className={`flex-1 rounded-[6px] py-1.5 text-[12.5px] font-semibold transition ${
              active
                ? "bg-tide text-abyss shadow-sm"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {s.years}-yr
          </button>
        );
      })}
    </div>
  );
}
