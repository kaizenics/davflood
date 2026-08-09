/**
 * Fetches recent flooding news for Davao City and writes it as a static file
 * the app can read same-origin.
 *
 * WHY A SCRIPT AND NOT A FETCH IN THE APP: the sources will not allow it.
 * GDELT sends no `access-control-allow-origin`, so a browser cannot read it at
 * all, and it rate-limits to roughly one request every five seconds — which a
 * page hit by many people at once would blow through immediately. Run from CI
 * every half hour instead, that is one request from one address, and the app
 * only ever loads its own JSON.
 *
 * ReliefWeb is the second source and is deliberately optional: its v2 API
 * refuses unregistered callers with a 403, so it stays off until someone
 * registers an appname and sets RELIEFWEB_APPNAME. Everything still works
 * without it.
 *
 * Usage: tsx scripts/build-flood-news.ts <output.json>
 */

import { existsSync, readFileSync } from "node:fs";

import { NEWS_RETENTION_DAYS, ageInDays, locateHeadline } from "../src/news";
import type { NewsFile, NewsItem } from "../src/news";

/**
 * "Davao" alone is a region, three provinces and a city. Requiring a flood
 * word AND a Davao word still lets Davao Oriental landslides through, so the
 * result is filtered again below rather than trusted.
 */
const GDELT_QUERY = '(flood OR flooding OR flashflood) (Davao)';

/** Words that mean this is about somewhere else that happens to be called Davao. */
const ELSEWHERE = [
  "davao oriental",
  "davao del norte",
  "davao occidental",
  "davao de oro",
  "compostela valley",
  "mati city",
  "tagum",
  "panabo",
  "digos",
];

/** Without one of these it is not about flooding. */
const FLOOD_WORDS = ["flood", "flash flood", "baha", "inundat", "submerged", "overflow"];

function keep(title: string): boolean {
  const t = title.toLowerCase();
  if (!FLOOD_WORDS.some((w) => t.includes(w))) return false;
  // an explicit "Davao City" beats the elsewhere list
  if (t.includes("davao city")) return true;
  if (ELSEWHERE.some((w) => t.includes(w))) return false;
  if (t.includes("davao")) return true;
  /**
   * Naming one of our barangays is as good as naming the city, and this is
   * the clause that makes the per-barangay queries worth running: a local
   * desk writing "flooding hits Ma-a" has no reason to add "Davao City", and
   * requiring it threw away precisely the barangay-level reporting the pins
   * exist to show.
   */
  return locateHeadline(title) !== null;
}

/**
 * Google News RSS — the source that actually carries Davao City.
 *
 * It surfaces the local desks that cover this beat (MindaNews, Davao Today,
 * SunStar) alongside the nationals, which is the difference between "a flood
 * happened in Mindanao" and "Bucana is under water". No key, no rate limit
 * worth the name, and from Node there is no CORS to worry about — that
 * restriction only ever applied to the browser.
 */
async function fromGoogleNews(): Promise<NewsItem[]> {
  /**
   * Three overlapping windows rather than one query.
   *
   * A single search caps out around 100 items, which during a wet month is
   * only the last couple of weeks — and the whole point of keeping these is
   * that a flood in Ma-a six weeks ago still tells you something about Ma-a.
   * Asking month by month reaches the back of the window instead of letting
   * the recent stuff crowd it out.
   */
  const now = Date.now();
  const day = 86_400_000;
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const windows = [
    "",
    ` after:${iso(now - 35 * day)} before:${iso(now - 12 * day)}`,
    ` after:${iso(now - NEWS_RETENTION_DAYS * day)} before:${iso(now - 32 * day)}`,
  ];

  const out: NewsItem[] = [];
  for (const window of windows) {
    out.push(...(await googleNewsPage(`(flood OR flooding OR baha) "Davao City"${window}`)));
    await new Promise((r) => setTimeout(r, 800));
  }

  /**
   * Then ask about the flood-prone barangays by name.
   *
   * The city-wide search overwhelmingly returns city-wide coverage: of the
   * first sweep, five headlines in sixty named a barangay. But a pin is only
   * possible when a place is named, and "was there flooding in Ma-a" is
   * exactly the question someone opens this app with. Naming the barangay in
   * the query is what surfaces the local desks that answer it.
   *
   * Which barangays to ask about comes from the hazard model rather than a
   * hand-written list: the ones carrying the most deep-water zones are the
   * ones worth watching, and the list re-derives itself if the data changes.
   */
  for (const name of mostFloodProne(10)) {
    out.push(...(await googleNewsPage(`(flood OR flooding OR baha) "${name}" Davao`)));
    await new Promise((r) => setTimeout(r, 800));
  }

  return out;
}

/** Barangays with the most high-hazard zones in the 25-year scenario. */
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

async function googleNewsPage(query: string): Promise<NewsItem[]> {
  const q = encodeURIComponent(query);
  const res = await fetch(
    `https://news.google.com/rss/search?q=${q}&hl=en-PH&gl=PH&ceid=PH:en`,
    { headers: { "user-agent": "davflood-news/1.0" } },
  );
  if (!res.ok) throw new Error(`Google News ${res.status}`);
  const xml = await res.text();

  const cdata = (s: string) =>
    s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();

  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map((m) => {
      const block = m[1] ?? "";
      const tag = (name: string) => {
        // <source> carries a url attribute, so the open tag is not bare
        const hit = block.match(
          new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`),
        );
        return hit?.[1] ? cdata(hit[1]) : "";
      };

      const raw = tag("title");
      const source = tag("source");
      // Google appends " - Publisher" to every headline; the publisher is
      // already in <source>, so the suffix is noise
      const title = source
        ? raw.replace(new RegExp(`\\s+-\\s+${escapeRe(source)}$`), "")
        : raw;
      const when = new Date(tag("pubDate"));

      return {
        title,
        url: tag("link"),
        source: source || "Google News",
        date: Number.isNaN(when.getTime())
          ? ""
          : when.toISOString().slice(0, 10),
      };
    })
    .filter((i) => i.title && i.url && i.date && keep(i.title));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fromGdelt(): Promise<NewsItem[]> {
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(GDELT_QUERY)}` +
    `&mode=artlist&format=json&maxrecords=60&timespan=14d&sort=datedesc`;
  const res = await fetch(url, { headers: { "user-agent": "davflood-news/1.0" } });
  if (!res.ok) throw new Error(`GDELT ${res.status}: ${(await res.text()).slice(0, 120)}`);

  const body = await res.text();
  let parsed: { articles?: { title?: string; url?: string; domain?: string; seendate?: string }[] };
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`GDELT returned non-JSON: ${body.slice(0, 120)}`);
  }

  return (parsed.articles ?? [])
    .filter((a) => a.title && a.url && keep(a.title))
    .map((a) => ({
      title: a.title!.replace(/\s+/g, " ").trim(),
      url: a.url!,
      source: a.domain ?? "",
      // GDELT stamps are YYYYMMDDTHHMMSSZ
      date: `${a.seendate?.slice(0, 4)}-${a.seendate?.slice(4, 6)}-${a.seendate?.slice(6, 8)}`,
    }));
}

async function fromReliefWeb(appname: string): Promise<NewsItem[]> {
  const res = await fetch(`https://api.reliefweb.int/v2/reports?appname=${appname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      limit: 20,
      sort: ["date.created:desc"],
      fields: { include: ["title", "date.created", "source.shortname", "url"] },
      query: { value: "Davao AND flood" },
      filter: { field: "country.iso3", value: "phl" },
    }),
  });
  if (!res.ok) throw new Error(`ReliefWeb ${res.status}`);
  const json = (await res.json()) as {
    data?: { fields?: { title?: string; url?: string; date?: { created?: string }; source?: { shortname?: string }[] } }[];
  };
  return (json.data ?? [])
    .map((d) => d.fields)
    .filter((f): f is NonNullable<typeof f> => !!f?.title && !!f.url && keep(f.title))
    .map((f) => ({
      title: f.title!.replace(/\s+/g, " ").trim(),
      url: f.url!,
      source: f.source?.[0]?.shortname ?? "ReliefWeb",
      date: (f.date?.created ?? "").slice(0, 10),
    }));
}

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("usage: build-flood-news.ts <output.json>");

  const items: NewsItem[] = [];
  const problems: string[] = [];

  for (const [name, run] of [
    // Google News first: it is the one that reliably carries Davao City, and
    // the only one that has never refused us. The rest are best-effort.
    ["Google News", fromGoogleNews],
    ["GDELT", fromGdelt],
    ...(process.env["RELIEFWEB_APPNAME"]
      ? ([["ReliefWeb", () => fromReliefWeb(process.env["RELIEFWEB_APPNAME"]!)]] as const)
      : []),
  ] as [string, () => Promise<NewsItem[]>][]) {
    try {
      const got = await run();
      items.push(...got);
      console.log(`${name}: ${got.length} kept`);
    } catch (err) {
      // one dead source must not empty the file — a stale item beats no item
      problems.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      console.warn(`${name} failed:`, err);
    }
  }

  if (!items.length && problems.length) {
    console.error("every source failed; leaving the existing file alone");
    process.exitCode = 1;
    return;
  }

  /**
   * Merge with what is already published rather than replacing it.
   *
   * The sources drop stories off the back of their windows, and a run that
   * happened to see fewer would otherwise silently shorten the history. This
   * only ever adds, and prunes strictly by age.
   */
  const previous: NewsItem[] = existsSync(out)
    ? ((JSON.parse(readFileSync(out, "utf8")) as NewsFile).items ?? [])
    : [];

  // Two sources carry the same story under different URLs, so the headline is
  // the identity that matters, not the link. Previously-seen items win, so a
  // story keeps the date it was first published under.
  const seen = new Set<string>();
  const merged: NewsItem[] = [];
  for (const item of [...previous, ...items]) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    if (ageInDays(item.date) > NEWS_RETENTION_DAYS) continue;
    seen.add(key);
    // geotag late, so re-runs pick up matcher improvements on old items too
    const where = locateHeadline(item.title);
    merged.push({
      title: item.title,
      url: item.url,
      source: item.source,
      date: item.date,
      ...(where ? { barangay: where.barangay, center: where.center } : {}),
    });
  }

  merged.sort((a, b) => b.date.localeCompare(a.date));
  const located = merged.filter((i) => i.center).length;

  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    out,
    `${JSON.stringify({ fetched: new Date().toISOString(), items: merged }, null, 2)}\n`,
  );
  console.log(
    `wrote ${merged.length} items (${located} pinned to a barangay, ${previous.length} carried over) to ${out}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
