import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Repairs the generated sitemap: adds the homepage, drops the map's
 * query-string permutations.
 *
 * TanStack Start marks "/" as sitemap-excluded because it is also the SPA
 * shell — the document a static host serves for any unmatched path (see the
 * `spa` block in vite.config.ts). That is right for the shell and wrong for
 * the page: they are the same file, but only one of them is the most
 * important URL on the site. Declaring `sitemap: { exclude: false }` in
 * `pages` does not override it, so this repairs the output instead.
 *
 * Deliberately additive and idempotent: if a future version of the plugin
 * starts including "/", this finds it already there and does nothing.
 */

const SITE = "https://davflood.site";
/* Resolved from this file, not from the working directory: pnpm runs the
   script with the workspace package as cwd, so a repo-root-relative path
   resolves to apps/web/apps/web. */
const PATH = fileURLToPath(new URL("../dist/client/sitemap.xml", import.meta.url));

let xml = readFileSync(PATH, "utf8");

/* The crawler follows "See it on the map" from every barangay profile, and
   those links carry ?lng=&lat=&b= — so 183 query-string URLs land in the
   sitemap, all of them rendering the same page. robots.txt disallows exactly
   that pattern, and a sitemap listing URLs robots blocks is a Search Console
   error rather than a wasted crawl. Drop them here, at the one place that
   already knows about both files. */
const before = (xml.match(/<url>/g) ?? []).length;
xml = xml.replace(
  /\s*<url>\s*<loc>[^<]*\?[^<]*<\/loc>[\s\S]*?<\/url>/g,
  "",
);
const dropped = before - (xml.match(/<url>/g) ?? []).length;
if (dropped > 0) console.log(`[sitemap] dropped ${dropped} query-string URLs`);

if (xml.includes(`<loc>${SITE}/</loc>`)) {
  writeFileSync(PATH, xml);
  console.log("[sitemap] homepage already present");
  process.exit(0);
}

const lastmod = new Date().toISOString().slice(0, 10);
const entry = `  <url>
    <loc>${SITE}/</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
  </url>
`;

// first, so the file reads in the order a person would write it
const out = xml.replace(/(<urlset[^>]*>\n(?:\s*<!--[^>]*-->\n)?)/, `$1${entry}`);

if (out === xml) {
  console.error("[sitemap] could not find <urlset> — homepage NOT added");
  process.exit(1);
}

writeFileSync(PATH, out);
console.log(`[sitemap] homepage added (${(out.match(/<url>/g) ?? []).length} URLs)`);
