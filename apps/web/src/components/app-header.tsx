import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/lib/theme";

const REPO_URL = "https://github.com/kaizenics/davflood";

const NAV = [
  { to: "/", label: "Map", exact: true },
  { to: "/barangays", label: "Barangays", exact: false },
  { to: "/learn", label: "Hazard levels", exact: false },
  { to: "/about", label: "The data", exact: false },
] as const;

export function AppHeader() {
  const { theme, toggle } = useTheme();
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
    <header className="border-hairline bg-abyss/90 sticky top-0 z-40 shrink-0 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[110rem] items-center gap-3 px-4 sm:px-6">
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

        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source code on GitHub"
          title="Source code on GitHub"
          className="border-hairline text-ink-dim hover:text-ink hover:border-tide flex size-8 shrink-0 items-center justify-center rounded-full border transition"
        >
          <GithubMark />
        </a>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="border-hairline text-ink-dim hover:text-ink hover:border-tide flex size-8 shrink-0 items-center justify-center rounded-full border transition"
        >
          {theme === "dark" ? (
            <Sun className="size-4" aria-hidden="true" />
          ) : (
            <Moon className="size-4" aria-hidden="true" />
          )}
        </button>

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
                  href="https://noah.up.edu.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-dim border-hairline/60 mt-1 block border-t px-3 py-3 text-[13px]"
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

/**
 * The GitHub mark, drawn here rather than imported: lucide dropped its brand
 * icons in v1, and this is the same hand-written-SVG treatment the wordmark
 * below already gets.
 */
function GithubMark() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/**
 * The mark is a map cell with the water partway up it — the one thing this app
 * actually reports. Three tints of `tide` and no outline drawing: the dry
 * portion is a wash, the water body is `tide-deep`, and the surface gets a
 * bright meniscus so the waterline is the first thing the eye lands on even at
 * 16px. Everything is a token, so it inverts with the theme instead of being
 * frozen at the dark palette the way the old hardcoded hexes were.
 *
 * The word stays pure ink. The colour lives in the mark, which is what keeps
 * the lockup from looking like a startup template.
 */
function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        className="size-7 shrink-0"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <clipPath id="nf-mark-cell">
          <rect x="2.5" y="2.5" width="27" height="27" rx="8.5" />
        </clipPath>
        <g clipPath="url(#nf-mark-cell)">
          <rect x="2.5" y="2.5" width="27" height="27" className="fill-tide/12" />
          {/* Two periods, drawn past the clip on both sides so the surface
              meets the cell wall instead of tapering to a point at it. The
              control points sit ±7 off the baseline, which a cubic flattens to
              a crest of ~2 units — about 1.8px at the rendered 28px. Pulling
              them in any further reads as a straight line. */}
          <path
            d="M-2 18.6C4 11.6 10 25.6 16 18.6C22 11.6 28 25.6 34 18.6L34 34H-2Z"
            className="fill-tide-deep"
          />
          <path
            d="M-2 18.6C4 11.6 10 25.6 16 18.6C22 11.6 28 25.6 34 18.6"
            className="stroke-tide"
            strokeWidth="1.7"
          />
        </g>
        <rect
          x="2.5"
          y="2.5"
          width="27"
          height="27"
          rx="8.5"
          className="stroke-tide/30"
          strokeWidth="1.25"
        />
      </svg>
      <span className="text-ink text-[17px] leading-none font-extrabold tracking-[-0.03em]">
        DavFlood
      </span>
    </span>
  );
}
