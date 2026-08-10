import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";

/**
 * The shared identity and navigation.
 *
 * Two placements, one definition: a header across the top of every document
 * page, and a block at the top of the map's own panel. The map does not want a
 * header — it is the whole point of the screen, and a bar across the top costs
 * it 56px of the thing people came to look at — but the other pages have no
 * panel to put a nav in, so both exist and share this.
 */

export const REPO_URL = "https://github.com/kaizenics/davflood";

/**
 * `short` is for the panel, which is 21rem wide.
 *
 * The full labels wrap there and strand "The data" alone on a second row,
 * which reads as a mistake rather than a menu. The two spellings are never on
 * screen together — the header is hidden wherever the panel nav is shown.
 */
export const NAV = [
  { to: "/", label: "Map", short: "Map", exact: true },
  { to: "/barangays", label: "Barangays", short: "Barangays", exact: false },
  { to: "/news", label: "Reports", short: "Reports", exact: false },
  { to: "/learn", label: "Hazard levels", short: "Hazard", exact: false },
  { to: "/about", label: "The data", short: "Data", exact: false },
] as const;

export function Wordmark() {
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
              meets the cell wall instead of tapering to a point at it. */}
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

/**
 * The GitHub mark, drawn here rather than imported: lucide dropped its brand
 * icons in v1, and this is the same hand-written-SVG treatment the wordmark
 * gets.
 */
export function GithubMark() {
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

const ROUND_BUTTON =
  "border-hairline text-ink-dim hover:text-ink hover:border-tide flex size-8 shrink-0 items-center justify-center rounded-full border transition";

export function GithubLink() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Source code on GitHub"
      title="Source code on GitHub"
      className={ROUND_BUTTON}
    >
      <GithubMark />
    </a>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={ROUND_BUTTON}>
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * The map screen's own masthead, at the top of the panel.
 *
 * Desktop only. Below lg the panel is a bottom sheet collapsed to a 60px
 * handle, so anything in here would be navigation you cannot see — the header
 * keeps that job on a phone.
 *
 * The links sit in a row rather than a stack, and wrap rather than scroll: a
 * nav you have to scroll sideways hides its own last item, which is exactly
 * what the header used to do on a narrow screen.
 */
export function SidebarNav() {
  return (
    <div className="border-hairline hidden border-b px-5 py-4 lg:block">
      <div className="flex items-center gap-2">
        <Link to="/" aria-label="DavFlood — home" className="min-w-0 flex-1">
          <Wordmark />
        </Link>
        <GithubLink />
        <ThemeToggle />
      </div>

      <nav aria-label="Main" className="mt-3.5">
        <ul className="flex items-center gap-0.5">
          {NAV.map(({ to, short, label, exact }) => (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                activeOptions={{ exact }}
                className="rounded-pill text-ink-dim hover:text-ink hover:bg-raised/60 block px-2 py-1 text-[11.5px] font-medium whitespace-nowrap transition"
                activeProps={{ className: "!text-ink !bg-raised" }}
              >
                {short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
