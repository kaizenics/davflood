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

/**
 * The publishers' own feeds.
 *
 * Worth reading directly, for two reasons Google News cannot give us. Their
 * links are the real article rather than an interstitial, and their items
 * carry the lead photograph — Google's every og:image is Google's own logo,
 * so anything sourced through it is text or nothing.
 *
 * They are also the local desks. A national wire says "Davao City"; MindaNews
 * says which barangay, which is what puts a pin on the map.
 */
const LOCAL_FEEDS: [name: string, url: string][] = [
  // WordPress exposes its search as a feed, which is the difference between
  // "the last ten things this desk published" and "everything this desk has
  // written about flooding". The front-page feeds carried almost nothing:
  // flood stories are common, but flood stories whose HEADLINE also says
  // Davao are not.
  ["MindaNews", "https://mindanews.com/?s=flood&feed=rss2"],
  ["Mindanao Times", "https://www.mindanaotimes.com.ph/?s=flood&feed=rss2"],
  ["Edge Davao", "https://edgedavao.net/?s=flood&feed=rss2"],
  ["Davao Today", "https://davaotoday.com/feed/"],
  ["Inquirer", "https://newsinfo.inquirer.net/feed"],
];

async function fromLocalFeeds(): Promise<NewsItem[]> {
  const out: NewsItem[] = [];

  for (const [name, url] of LOCAL_FEEDS) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "davflood-news/1.0" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const xml = await res.text();

      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const block = m[1] ?? "";
        const cdata = (s: string) =>
          s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
        const tag = (n: string) => {
          const hit = block.match(
            new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`),
          );
          return hit?.[1] ? cdata(hit[1]) : "";
        };

        const title = decodeEntities(tag("title")).replace(/\s+/g, " ").trim();
        const link = tag("link");
        if (!title || !link || !keep(title)) continue;

        const when = new Date(tag("pubDate"));
        if (Number.isNaN(when.getTime())) continue;

        out.push({
          title,
          url: link,
          source: name,
          date: when.toISOString().slice(0, 10),
          ...(imageFrom(block) ? { image: imageFrom(block)! } : {}),
        });
      }
    } catch (err) {
      // one dead feed is not worth failing the run over
      console.warn(`  ${name}: ${err instanceof Error ? err.message : err}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  return out;
}

/**
 * WordPress feeds emit headlines pre-escaped — "Dizon&#8217;s pledge",
 * "EMERGENCE &#124; ...". Unescaped, those land in the UI as literal
 * ampersand-hash noise, and they also break barangay matching on any name
 * containing punctuation.
 */
function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    hellip: "…",
    mdash: "—",
    ndash: "–",
    rsquo: "’",
    lsquo: "‘",
    ldquo: "“",
    rdquo: "”",
  };
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (whole, name: string) => named[name.toLowerCase()] ?? whole);
}

/**
 * Is `candidate` a better copy of the same story than the one we hold?
 *
 * A photograph is the strongest signal, then a real article link — a
 * news.google.com URL is an interstitial the reader has to click through.
 */
function betterCopy(candidate: NewsItem, held: NewsItem): boolean {
  const score = (i: NewsItem) =>
    (i.image ? 2 : 0) + (i.url.includes("news.google.com") ? 0 : 1);
  return score(candidate) > score(held);
}

/** Feeds carry the lead image in one of three places, depending on the CMS. */
function imageFrom(block: string): string | null {
  const raw =
    block.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] ??
    block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ??
    block.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpe?g|png|webp))["']/i)?.[1] ??
    block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  if (!raw) return null;
  // the site is https and some CMSs still emit http; a mixed-content image is
  // blocked outright, so upgrade it and let the browser hide it if it 404s
  return raw.replace(/^http:\/\//, "https://");
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
    // Publishers first, so their version of a story — with its real link and
    // its photograph — is the one that wins the dedupe below.
    ["Local feeds", fromLocalFeeds],
    // Then Google News for reach: it is the one that reliably carries Davao
    // City, and the only one that has never refused us.
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

  /**
   * Two sources carry the same story under different URLs, so the headline is
   * the identity, not the link. Where they collide the better copy wins: a
   * publisher's version has the real article link and its photograph, where
   * Google's has an interstitial and no usable image.
   */
  const byKey = new Map<string, NewsItem>();
  for (const item of [...previous, ...items]) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key) continue;
    if (ageInDays(item.date) > NEWS_RETENTION_DAYS) continue;

    const held = byKey.get(key);
    if (held && !betterCopy(item, held)) continue;

    // geotag late, so re-runs pick up matcher improvements on old items too
    const where = locateHeadline(item.title);
    byKey.set(key, {
      title: item.title,
      url: item.url,
      source: item.source,
      // keep the earliest date we ever saw, so a story does not appear to
      // re-happen when a second source picks it up days later
      date: held ? (held.date < item.date ? held.date : item.date) : item.date,
      ...(item.image ? { image: item.image } : held?.image ? { image: held.image } : {}),
      ...(where ? { barangay: where.barangay, center: where.center } : {}),
    });
  }

  const merged = [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));
  const located = merged.filter((i) => i.center).length;
  const pictured = merged.filter((i) => i.image).length;

  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    out,
    `${JSON.stringify({ fetched: new Date().toISOString(), items: merged }, null, 2)}\n`,
  );
  console.log(
    `wrote ${merged.length} items (${located} pinned, ${pictured} with a photo, ${previous.length} carried over) to ${out}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
