import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  GithubLink,
  NAV,
  REPO_URL,
  ThemeToggle,
  Wordmark,
} from "@/components/site-nav";
import { cn } from "@/lib/utils";

type Props = {
  /** the map screen passes `lg:hidden` — see routes/__root.tsx */
  className?: string;
};

/**
 * The header for the document pages.
 *
 * The map screen hides this from lg up and carries the same identity and links
 * at the top of its panel instead: a bar across the top of a map costs 56px of
 * the one thing the screen exists to show. Every other page has no panel, so
 * this is their only navigation and it stays.
 */
export function AppHeader({ className }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // a tapped link navigates without unmounting the header, so the menu has to
  // be told the journey is over
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    // above the map sheet, which is z-30 — the menu must never open behind it
    <header
      className={cn(
        "border-hairline bg-abyss/90 sticky top-0 z-40 shrink-0 border-b backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-[110rem] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link to="/" aria-label="DavFlood — home" className="shrink-0">
          <Wordmark />
        </Link>

        {/* Four labels do not fit a phone. Below lg they move into the menu
            below rather than being clipped by a scroll container the user
            cannot see the end of. */}
        <nav aria-label="Main" className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map(({ to, label, exact }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact }}
                  className="rounded-pill text-ink-dim hover:text-ink hover:bg-raised/60 block px-3 py-1.5 text-sm font-medium whitespace-nowrap transition"
                  activeProps={{ className: "!text-ink !bg-raised" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 lg:hidden" />

        <a
          href="https://noah.up.edu.ph/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-dim hover:text-tide hidden text-xs whitespace-nowrap transition lg:block"
        >
          Data © UP NOAH
        </a>

        <GithubLink />
        <ThemeToggle />

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="border-hairline text-ink-dim hover:text-ink flex size-8 shrink-0 items-center justify-center rounded-full border transition lg:hidden"
        >
          {menuOpen ? (
            <X className="size-4" aria-hidden="true" />
          ) : (
            <Menu className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen && (
        <>
          {/* catches the tap that means "I'm done here" */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 top-14 z-30 cursor-default bg-black/40 lg:hidden"
          />
          <nav
            id="mobile-nav"
            aria-label="Main"
            className="nf-menu border-hairline bg-abyss/95 absolute inset-x-0 top-full z-40 border-b backdrop-blur-xl lg:hidden"
          >
            <ul className="mx-auto max-w-[110rem] px-3 py-2">
              {NAV.map(({ to, label, exact }) => (
                <li key={to}>
                  <Link
                    to={to}
                    activeOptions={{ exact }}
                    onClick={() => setMenuOpen(false)}
                    className="text-ink-dim hover:text-ink hover:bg-raised/60 block rounded-xl px-3 py-3 text-[15px] font-medium transition"
                    activeProps={{ className: "!text-ink !bg-raised" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-dim border-hairline/60 mt-1 block border-t px-3 py-3 text-[13px]"
                >
                  Source on GitHub ↗
                </a>
              </li>
              <li>
                <a
                  href="https://noah.up.edu.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-dim block px-3 pb-3 text-[13px]"
                >
                  Data © UP NOAH ↗
                </a>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
