import { scenarios } from "@naboflood/hazard/scenarios";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";

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
      className="border-hairline rounded-pill flex w-full gap-1 border p-1"
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
            className={`rounded-pill flex-1 px-3 py-2 text-xs font-bold transition ${
              active ? "bg-tide text-abyss" : "text-ink-dim hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
