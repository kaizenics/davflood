/**
 * Writes the flood news file from the command line.
 *
 * The fetching itself lives in `src/news-sources.ts`, because the Netlify
 * function serving /api/news runs exactly the same code. This is only the
 * disk end of it: read what is already there, merge, write it back.
 *
 * Use this to seed or repair the committed file by hand. The deployed site
 * does not need it — see netlify/functions/news.mts.
 *
 * Usage: tsx scripts/build-flood-news.ts <output.json>
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import type { NewsFile, NewsItem } from "../src/news";
import { collectNews, mergeNews } from "../src/news-sources";

/**
 * Barangays with the most high-hazard zones in the 25-year scenario.
 *
 * Ranked from the model rather than hand-written, so the list re-derives
 * itself if the data changes. Only the CLI can do this — it is the only
 * caller with the polygons on disk.
 */
function mostFloodProne(limit: number): string[] {
  try {
    const url = new URL("../src/data/davao-25.json", import.meta.url);
    const fc = JSON.parse(readFileSync(url, "utf8")) as {
      features?: { properties?: { barangay?: string; hazard?: string } }[];
    };
    const tally = new Map<string, number>();
    for (const f of fc.features ?? []) {
      const b = f.properties?.barangay;
      if (!b || f.properties?.hazard !== "high") continue;
      tally.set(b, (tally.get(b) ?? 0) + 1);
    }
    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  } catch (err) {
    console.warn("could not rank barangays, skipping per-barangay queries:", err);
    return [];
  }
}

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("usage: build-flood-news.ts <output.json>");

  const { items, notes, allFailed } = await collectNews({
    deep: true,
    floodProne: mostFloodProne(10),
    ...(process.env["RELIEFWEB_APPNAME"]
      ? { reliefwebAppname: process.env["RELIEFWEB_APPNAME"] }
      : {}),
  });
  for (const note of notes) console.log(note);

  if (allFailed) {
    console.error("every source failed; leaving the existing file alone");
    process.exitCode = 1;
    return;
  }

  const previous: NewsItem[] = existsSync(out)
    ? ((JSON.parse(readFileSync(out, "utf8")) as NewsFile).items ?? [])
    : [];

  const merged = mergeNews(previous, items);
  writeFileSync(
    out,
    `${JSON.stringify({ fetched: new Date().toISOString(), items: merged }, null, 2)}\n`,
  );
  console.log(
    `wrote ${merged.length} items (${merged.filter((i) => i.center).length} pinned, ` +
      `${merged.filter((i) => i.image).length} with a photo, ${previous.length} carried over) to ${out}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
