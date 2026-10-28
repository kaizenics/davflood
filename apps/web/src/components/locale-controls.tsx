import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Languages } from "lucide-react";

import { useLocale } from "@/lib/locale";

/**
 * Choosing a language, and being told what that choice costs.
 *
 * A menu rather than a cycle: with three languages, cycling meant tapping
 * through one you did not want to reach the one you did. Every option names
 * itself in its own language, and the draft ones say so before you pick them.
 */
export function LocaleToggle() {
  const { meta, locales, strings, set } = useLocale();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`${strings.ui.language}: ${meta.endonym}`}
        title={`${strings.ui.language}: ${meta.endonym}`}
        className="border-hairline/80 bg-deep text-ink-dim hover:text-ink hover:border-tide/60 data-[state=open]:border-tide/60 data-[state=open]:text-ink flex h-8 shrink-0 items-center gap-1 rounded-[10px] border px-2 text-[10.5px] font-semibold transition active:scale-95"
      >
        <Languages className="size-3.5 shrink-0" aria-hidden="true" />
        {meta.short}
        <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden="true" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          // above the mobile header (z-40) and the map sheet
          className="nf-menu border-hairline bg-deep/95 z-50 min-w-44 rounded-xl border p-1 shadow-xl backdrop-blur-xl"
        >
          <DropdownMenu.RadioGroup
            value={meta.id}
            onValueChange={(id) => set(id as typeof meta.id)}
          >
            {locales.map((l) => (
              <DropdownMenu.RadioItem
                key={l.id}
                value={l.id}
                lang={l.tag}
                className="text-ink data-[highlighted]:bg-raised flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] outline-none"
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  <DropdownMenu.ItemIndicator>
                    <Check className="text-tide size-3.5" aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </span>
                <span className="flex-1 font-medium">{l.endonym}</span>
                {l.status === "draft" && (
                  <span className="text-haz-med text-[10px] font-semibold">
                    {strings.locale.draftBadge}
                  </span>
                )}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
