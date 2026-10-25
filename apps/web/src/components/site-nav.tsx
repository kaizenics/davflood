import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Moon, Phone, Sun } from "lucide-react";
import { useId } from "react";

import { LocaleToggle } from "@/components/locale-controls";
import { currentVersion } from "@/lib/changelog";
import { useTheme } from "@/lib/theme";

/**
 * The shared identity and navigation.
 *
 * One definition, three placements: the top of the map's own panel, a column
 * down the left of every other page, and — below lg, where no column fits — a
 * bar across the top. From lg up the site is a sidebar app: the same wordmark
 * and the same five links, in the same place, whichever page you are on.
 */

export const REPO_URL = "https://github.com/kaizenics/davflood";
/** Where "what's new" actually lives — GitHub publishes it already. */
export const RELEASES_URL = `${REPO_URL}/releases`;

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
  /**
   * The clip needs an id, and the mark is now on screen twice — the header
   * keeps rendering it while hidden, and the panel renders another. A fixed id
   * makes both `url(#…)` references resolve to whichever came first in the
   * document, which is the one inside `display: none`, and the mark drew
   * clipped to nothing.
   */
  const clipId = `nf-mark-${useId()}`;

  return (
    <span className="flex items-center gap-2.5">
      <svg
        className="size-7 shrink-0"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <clipPath id={clipId}>
          <rect x="2.5" y="2.5" width="27" height="27" rx="8.5" />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
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
  "border-hairline/80 bg-deep text-ink-dim hover:text-ink hover:border-tide/60 flex size-8 shrink-0 items-center justify-center rounded-[10px] border transition active:scale-95";

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

/**
 * The way to the hotlines — deliberately NOT a sixth item in NAV.
 *
 * Two reasons, and the second is the real one. The row of links is sized to
 * fit five items on one line in a 21rem panel. But an emergency number that
 * looks exactly like "Barangays" and "The data" is an emergency number nobody
 * finds while panicking: this has to be scannable as *different*, which means
 * its own row, its own colour, and the word "911" visible without a tap.
 */
export function EmergencyLink() {
  return (
    <Link
      to="/emergency"
      className="group border-haz-high/35 bg-haz-high/10 hover:bg-haz-high/16 mt-3 flex items-center gap-2.5 rounded-xl border py-2 pr-2 pl-2.5 transition"
      activeProps={{ className: "!bg-haz-high/18" }}
    >
      <span className="bg-haz-high/15 flex size-6 shrink-0 items-center justify-center rounded-lg">
        <Phone className="text-haz-high size-3.5" aria-hidden="true" />
      </span>
      <span className="text-ink text-[12.5px] font-semibold">
        Emergency hotlines
      </span>
      <span
        data-numeric
        className="bg-haz-high text-abyss ml-auto rounded-md px-2 py-0.5 text-[12px] font-bold tracking-wide"
      >
        911
      </span>
    </Link>
  );
}

/**
 * The build you are looking at, and a way into what changed.
 *
 * An outbound link, not a route. GitHub already publishes every release with
 * its notes, its diff and its tag; a second rendering of the same changelog
 * on this site was a page to keep in sync that told nobody anything the first
 * one did not. What the app owes the reader is which build they are on — that
 * is the chip — and a door to the rest.
 *
 * Renders the words "What's new" until a release exists, because inventing a
 * version number to fill the chip would be a false claim about which build
 * this is.
 */
export function VersionChip() {
  const label = currentVersion ? `v${currentVersion}` : "What's new";

  return (
    <a
      href={RELEASES_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        currentVersion
          ? `Version ${currentVersion} — release notes on GitHub`
          : "Release notes on GitHub"
      }
      title="Release notes on GitHub"
      className="text-ink-dim hover:text-ink flex shrink-0 items-center gap-0.5 px-1 text-[10.5px] font-medium whitespace-nowrap transition"
      data-numeric={currentVersion ? "" : undefined}
    >
      {label}
      <ArrowUpRight className="size-3 shrink-0 opacity-60" aria-hidden="true" />
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
 * The masthead: who this is, and where else you can go.
 *
 * The links sit in a row rather than a stack, and use their short spellings:
 * the column is 21rem, the full labels wrap there, and five items in a row
 * cost one line where a stack costs five — leaving the room below for the
 * thing the page is actually about.
 */
function NavBlock() {
  return (
    <div className="px-4 pt-4 pb-3.5">
      <div className="flex items-center gap-1.5">
        <Link to="/" aria-label="DavFlood — home" className="min-w-0 flex-1">
          <Wordmark />
        </Link>
        <VersionChip />
        <LocaleToggle />
        <GithubLink />
        <ThemeToggle />
      </div>

      <nav aria-label="Main" className="mt-4">
        <ul className="bg-raised/60 border-hairline/60 grid grid-cols-5 gap-0.5 rounded-xl border p-0.5">
          {NAV.map(({ to, short, label, exact }) => (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                activeOptions={{ exact }}
                className="text-ink-dim hover:text-ink block rounded-[9px] py-1.5 text-center text-[11.5px] font-medium whitespace-nowrap transition"
                activeProps={{ className: "!text-ink bg-deep font-semibold shadow-sm ring-1 ring-hairline/80" }}
              >
                {short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <EmergencyLink />
    </div>
  );
}

/**
 * The masthead at the top of the shell's panel — every route, one position.
 *
 * Desktop only. Below lg the panel is either a sheet collapsed to a 60px
 * handle or the page itself, so nav in here would be nav you cannot see or nav
 * you have to scroll past; the header keeps that job on a phone.
 */
export function SidebarNav() {
  return (
    <div className="border-hairline/70 hidden shrink-0 border-b lg:block">
      <NavBlock />
    </div>
  );
}
