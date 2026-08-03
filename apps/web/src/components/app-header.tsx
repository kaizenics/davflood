import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";

const NAV = [
  { to: "/", label: "Map", exact: true },
  { to: "/barangays", label: "Barangays", exact: false },
  { to: "/learn", label: "Hazard levels", exact: false },
  { to: "/about", label: "The data", exact: false },
] as const;

export function AppHeader() {
  const { theme, toggle } = useTheme();

  return (
    <header className="border-hairline bg-abyss/90 sticky top-0 z-30 shrink-0 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[110rem] items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="min-w-0 flex-1">
          <ul className="flex items-center gap-1 overflow-x-auto">
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
      </div>
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
        Nabo<span className="text-tide">Flood</span>
      </span>
    </>
  );
}
