import { Link } from "@tanstack/react-router";
import { BookOpen, Info, Map, Search } from "lucide-react";

/**
 * Bottom navigation.
 *
 * Bottom rather than top on purpose: the primary audience is on a phone, and
 * the whole point of this app is being usable one-handed in bad conditions.
 */
const TABS = [
  { to: "/", label: "Map", icon: Map, exact: true },
  { to: "/barangays", label: "Barangays", icon: Search, exact: false },
  { to: "/learn", label: "Learn", icon: BookOpen, exact: false },
  { to: "/about", label: "About", icon: Info, exact: false },
] as const;

export function AppNav() {
  return (
    <nav
      aria-label="Main"
      className="border-hairline bg-abyss/95 shrink-0 border-t backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="text-ink-dim flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition"
              activeProps={{ className: "!text-tide" }}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
