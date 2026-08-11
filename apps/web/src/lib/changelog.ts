import raw from "../../../../CHANGELOG.md?raw";

/**
 * The releases, read out of CHANGELOG.md at build time.
 *
 * Bundled rather than fetched from the GitHub API, and parsed here rather
 * than rendered with a markdown library. Both for the same reason: /releases
 * has to work in the offline pack and cost nothing to serve, and the GitHub
 * API is rate-limited, needs a network the reader may not have, and would put
 * a third-party request on a page that currently makes none.
 *
 * The shape is not "some markdown" — it is release-please's output, which is
 * a format we control. Parsing exactly that is ~40 lines; a markdown renderer
 * is ~40 KB and would still need this structure teased back out of it.
 */

export type ReleaseChange = {
  /** the commit subject, scope stripped */
  text: string;
  /** the scope in "feat(web): …", when there was one */
  scope: string | null;
  /** short SHA, linked back to the commit */
  sha: string | null;
  url: string | null;
};

export type ReleaseSection = {
  /** "New", "Fixed", … — the section names in release-please-config.json */
  title: string;
  changes: ReleaseChange[];
};

export type Release = {
  version: string;
  /** ISO yyyy-mm-dd, exactly as release-please writes it */
  date: string;
  /** the compare/tag link on the version heading, when there is one */
  url: string | null;
  sections: ReleaseSection[];
};

/** `## [1.2.0](https://…/compare/v1.1.0...v1.2.0) (2026-08-11)` — the link is
 *  absent on the very first release, which has nothing to compare against. */
const VERSION = /^##+\s+\[?v?([\d.]+(?:-[\w.]+)?)\]?(?:\(([^)]+)\))?\s*\((\d{4}-\d{2}-\d{2})\)/;
const SECTION = /^###+\s+(.+?)\s*$/;
const BULLET = /^[*-]\s+(.*)$/;
/** trailing `([abc1234](https://…/commit/abc1234…))`, plus any PR link after it */
const TRAILING_LINK = /\s*\(\[([0-9a-f]{6,})\]\(([^)]+)\)\).*$/i;
/** a leading `**web:** ` scope, which release-please writes bold */
const SCOPE = /^\*\*([^*]+):\*\*\s*/;

function parseChange(body: string): ReleaseChange {
  let text = body.trim();
  let sha: string | null = null;
  let url: string | null = null;

  const link = text.match(TRAILING_LINK);
  if (link?.[1] && link[2]) {
    sha = link[1].slice(0, 7);
    url = link[2];
    text = text.slice(0, link.index).trim();
  }

  const scoped = text.match(SCOPE);
  const scope = scoped?.[1] ?? null;
  if (scoped) text = text.slice(scoped[0].length);

  // sentence case: commit subjects are lowercase by convention, and a list of
  // them reads as a list of sentences on the page
  text = text.charAt(0).toUpperCase() + text.slice(1);

  return { text, scope, sha, url };
}

function parse(markdown: string): Release[] {
  const releases: Release[] = [];
  let release: Release | null = null;
  let section: ReleaseSection | null = null;

  for (const line of markdown.split("\n")) {
    const version = line.match(VERSION);
    if (version?.[1] && version[3]) {
      release = {
        version: version[1],
        url: version[2] ?? null,
        date: version[3],
        sections: [],
      };
      section = null;
      releases.push(release);
      continue;
    }

    if (!release) continue; // the file's own preamble

    const heading = line.match(SECTION);
    if (heading?.[1]) {
      section = { title: heading[1], changes: [] };
      release.sections.push(section);
      continue;
    }

    const bullet = line.match(BULLET);
    /* A bullet before any `###` happens when a release has one unclassified
       note — give it a home rather than dropping it on the floor. */
    if (bullet?.[1]) {
      if (!section) {
        section = { title: "Changes", changes: [] };
        release.sections.push(section);
      }
      section.changes.push(parseChange(bullet[1]));
    }
  }

  // a release whose every section was empty is noise on a public page
  return releases.filter((r) => r.sections.some((s) => s.changes.length > 0));
}

export const releases: Release[] = parse(raw);

/** What the version chip in the masthead shows. */
export const currentVersion: string = releases[0]?.version ?? "0.0.0";

/** `2026-08-11` → `11 Aug 2026`, in a fixed locale so SSR and the browser
 *  agree. Prerendering with the machine's locale is how you get hydration
 *  mismatches on dates. */
export function formatReleaseDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
