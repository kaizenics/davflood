import { Languages } from "lucide-react";

import { useLocale } from "@/lib/locale";
import { fill } from "@davflood/hazard/strings";

/**
 * Choosing a language, and being told what that choice costs.
 *
 * The toggle cycles rather than opening a menu: there are three languages,
 * the current one is always visible on the control, and a dropdown in a 21rem
 * masthead is a popover layer to maintain for a decision most people make
 * once.
 */
export function LocaleToggle() {
  const { meta, locales, strings, set } = useLocale();

  const index = locales.findIndex((l) => l.id === meta.id);
  const next = locales[(index + 1) % locales.length] ?? locales[0]!;
  const label = fill(strings.locale.switchTo, { language: next.endonym });

  return (
    <button
      type="button"
      onClick={() => set(next.id)}
      aria-label={label}
      title={label}
      className="border-hairline text-ink-dim hover:text-ink hover:border-tide rounded-pill flex h-8 shrink-0 items-center gap-1 border px-2 text-[10.5px] font-semibold transition"
    >
      <Languages className="size-3.5 shrink-0" aria-hidden="true" />
      {meta.short}
    </button>
  );
}

/**
 * The badge that has to sit beside draft copy.
 *
 * Renders nothing in English, which is not a special case — English is the
 * language this app's safety wording was written and argued over in, so it is
 * the only one carrying no warning.
 *
 * `compact` is for panels with no room for the full sentence; it still says
 * the word "draft", because that is the part that must never be dropped.
 */
export function DraftNotice({ compact = false }: { compact?: boolean }) {
  const { isDraft, strings, set } = useLocale();
  if (!isDraft) return null;

  if (compact) {
    return (
      <p className="text-ink-dim mt-2 text-[10.5px] leading-relaxed">
        {strings.locale.draftBadge} ·{" "}
        <button
          type="button"
          onClick={() => set("en")}
          className="hover:text-tide underline underline-offset-2 transition"
        >
          {strings.locale.readInEnglish}
        </button>
      </p>
    );
  }

  return (
    <aside className="border-haz-med/45 bg-haz-med/10 mt-4 rounded-2xl border px-3.5 py-3">
      <p className="text-ink flex gap-2.5 text-[12px] leading-relaxed">
        <Languages
          className="text-haz-med mt-[2px] size-4 shrink-0"
          aria-hidden="true"
        />
        <span>
          {strings.locale.draftNotice}{" "}
          <button
            type="button"
            onClick={() => set("en")}
            className="text-tide hover:text-ink font-semibold underline underline-offset-2 transition"
          >
            {strings.locale.readInEnglish}
          </button>
        </span>
      </p>
    </aside>
  );
}
