import { PITCH_PRESETS } from "@davflood/hazard/geo";

type Props = {
  /** current camera pitch in degrees, kept in sync with drag gestures */
  pitch: number;
  /** animate=false while the slider is being dragged, true for preset jumps */
  onPitchChange: (pitch: number, animate: boolean) => void;
};

const MAX = 85;

/**
 * The view-angle control: a slider from straight down (0°) to standing on the
 * street (85°), with the three named stops as one-click presets.
 *
 * This exists because the tilt gesture (right-drag / Ctrl-drag) is the least
 * discoverable interaction on the whole map — and the 3D terrain and depth
 * extrusions are invisible without it. A visible slider is the difference
 * between a 3D map and a 2D map that secretly has a 3D mode.
 */
export function PitchControl({ pitch, onPitchChange }: Props) {
  // which preset the current pitch is sitting on, if any (± a nudge)
  const active = PITCH_PRESETS.find((p) => Math.abs(p.pitch - pitch) < 3)?.id;

  return (
    <div>
      <div className="bg-raised/70 flex w-full gap-0.5 rounded-lg p-0.5">
        {PITCH_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={active === preset.id}
            onClick={() => onPitchChange(preset.pitch, true)}
            className={`flex-1 rounded-[6px] py-1.5 text-[12px] font-semibold transition ${
              active === preset.id
                ? "bg-tide text-abyss shadow-sm"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="text-ink-dim text-[10px]" aria-hidden="true">
          0°
        </span>
        <input
          type="range"
          min={0}
          max={MAX}
          step={1}
          value={Math.round(pitch)}
          onChange={(e) => onPitchChange(Number(e.target.value), false)}
          aria-label="View angle in degrees, from top-down to street level"
          aria-valuetext={`${Math.round(pitch)} degrees`}
          className="accent-tide h-1 min-w-0 flex-1 cursor-ew-resize"
        />
        <span className="text-ink-dim text-[10px]" aria-hidden="true">
          {MAX}°
        </span>
        <span
          className="text-ink w-8 text-right text-[11px] font-semibold"
          data-numeric
        >
          {Math.round(pitch)}°
        </span>
      </div>
    </div>
  );
}
