import { disclaimer } from "@naboflood/hazard/copy";
import { colors } from "@naboflood/hazard/tokens";
import { Link } from "@tanstack/react-router";
import { Construction, Info } from "lucide-react";

import { DATA_IS_PLACEHOLDER } from "@/lib/hazard-source";

/**
 * The persistent honesty strip.
 *
 * A hazard map that looks live is dangerous, so the "modelled, not live"
 * statement is always on screen rather than buried in an About page.
 */
export function MapStatusBar() {
  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      {DATA_IS_PLACEHOLDER && (
        <p
          className="rounded-pill inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-bold"
          style={{
            color: colors.hazMed,
            borderColor: `${colors.hazMed}66`,
            backgroundColor: `${colors.hazMed}1f`,
          }}
        >
          <Construction className="size-3" aria-hidden="true" />
          PLACEHOLDER DATA — NOT REAL HAZARD INFORMATION
        </p>
      )}

      <Link
        to="/about"
        className="border-hairline bg-abyss/90 rounded-pill text-ink-dim hover:text-ink inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] backdrop-blur transition"
      >
        <Info className="size-3 shrink-0" aria-hidden="true" />
        {disclaimer.pill}
      </Link>
    </div>
  );
}
