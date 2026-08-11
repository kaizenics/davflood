import raw from "../../../../CHANGELOG.md?raw";

/**
 * Which build this is.
 *
 * Read out of CHANGELOG.md at build time rather than from package.json,
 * because the changelog is what release-please writes LAST — a version that
 * appears here has a released entry behind it, where a bumped package.json
 * can sit in an unmerged release PR.
 *
 * The full notes are not rendered by this app. GitHub already publishes them
 * per release with the diff, the commits and the tag attached, and a second
 * copy on the site was a page to keep in sync for no reader who was not
 * better served by the first. The version chip links there instead.
 */

/** `## [1.2.0](…) (2026-08-11)` — the link is absent on the first release. */
const VERSION = /^##+\s+\[?v?([\d.]+(?:-[\w.]+)?)\]?(?:\([^)]*\))?\s*\(\d{4}-\d{2}-\d{2}\)/m;

/**
 * Null until a release has actually been cut — never a "0.0.0" default. A
 * version number on a live site is a claim about which build a reader is
 * looking at, and inventing one to fill the chip makes that claim false.
 */
export const currentVersion: string | null = raw.match(VERSION)?.[1] ?? null;
