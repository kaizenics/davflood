import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  GithubLink,
  NAV,
  RELEASES_URL,
  REPO_URL,
  ThemeToggle,
  Wordmark,
} from "@/components/site-nav";
import { LocaleToggle } from "@/components/locale-controls";
import { currentVersion } from "@/lib/changelog";

/**
 * The navigation for phones.
 *
 * From lg up the site is a sidebar app — the map carries its masthead at the
 * top of its panel, every other page gets a column beside the content — so
 * this bar exists only below that, where no column fits. Five labels do not
 * fit across a phone either, hence the menu.
 */
export function AppHeader() {
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
    <header className="border-hairline bg-abyss/90 sticky top-0 z-40 shrink-0 border-b backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="DavFlood — home" className="min-w-0 flex-1">
          <Wordmark />
        </Link>

        <LocaleToggle />
        <GithubLink />
        <ThemeToggle />

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="border-hairline text-ink-dim hover:text-ink flex size-8 shrink-0 items-center justify-center rounded-full border transition"
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
            className="fixed inset-0 top-14 z-30 cursor-default bg-black/40"
          />
          <nav
            id="mobile-nav"
            aria-label="Main"
            className="nf-menu border-hairline bg-abyss/95 absolute inset-x-0 top-full z-40 border-b backdrop-blur-xl"
          >
            <ul className="px-3 py-2">
              {/* First, above the five. On a phone this menu is the whole
                  navigation, and the hotlines are the one item somebody might
                  be opening it for in an emergency. */}
              <li className="mb-1">
                <Link
                  to="/emergency"
                  onClick={() => setMenuOpen(false)}
                  className="border-haz-high/40 bg-haz-high/8 flex items-center gap-2.5 rounded-xl border px-3 py-3 transition"
                  activeProps={{ className: "!bg-haz-high/16" }}
                >
                  <Phone
                    className="text-haz-high size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-ink text-[15px] font-semibold">
                    Emergency hotlines
                  </span>
                  <span
                    data-numeric
                    className="text-haz-high ml-auto text-[15px] font-bold"
                  >
                    911
                  </span>
                </Link>
              </li>
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
              {/* Below the five, with the other outbound links: the notes
                  live on GitHub, so this leaves the site. */}
              <li>
                <a
                  href={RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-dim border-hairline/60 mt-1 flex items-baseline justify-between gap-3 border-t px-3 py-3 text-[13px]"
                >
                  What&apos;s new ↗
                  {currentVersion && (
                    <span data-numeric className="text-[11.5px]">
                      v{currentVersion}
                    </span>
                  )}
                </a>
              </li>
              <li>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-dim block px-3 py-3 text-[13px]"
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
