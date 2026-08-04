import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/lib/theme";

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
      <div className="mx-auto flex h-14 max-w-[110rem] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
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

function Wordmark() {
  return (
    <>
      <svg className="size-6 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M2 23.5 L10.5 11 L15.5 18 L21 8.5 L30 23.5 Z"
          fill="#1a2027"
          stroke="#979fa8"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M2 23.5 C5.5 21.6, 8 25.4, 11.5 23.5 C15 21.6, 17.5 25.4, 21 23.5 C24.5 21.6, 27 25.4, 30 23.5"
          stroke="#3bcddc"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-ink text-base font-semibold tracking-tight">
        Dav<span className="text-tide">Flood</span>
      </span>
    </>
  );
}
