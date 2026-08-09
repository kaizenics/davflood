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

import { NEWS_RETENTION_DAYS, ageInDays, locateHeadline } from "./news";
import type { NewsItem } from "./news";

/**
 * "Davao" alone is a region, three provinces and a city. Requiring a flood
 * word AND a Davao word still lets Davao Oriental landslides through, so the
 * result is filtered again below rather than trusted.
 */
// Parentheses are only legal around an OR in GDELT's grammar; wrapping the
// bare term as "(Davao)" made it reject the whole query.
const GDELT_QUERY = "(flood OR flooding OR flashflood) Davao";

/**
 * No single source may hold up the others.
 *
 * Everything here is someone else's server, and one of them being slow is the
 * normal case rather than the exception — GDELT alone spent ten seconds
 * failing to connect, which is the entire budget of the function that calls
 * this. Whatever has not answered by now was not going to.
 */
const SOURCE_TIMEOUT_MS = 6500;

function get(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { "user-agent": "davflood-news/1.0", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
  });
}

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
async function fromGoogleNews(opts: CollectOptions): Promise<NewsItem[]> {
  const base = '(flood OR flooding OR baha) "Davao City"';

  // The live path asks once. Reaching the back of the window is the scheduled
  // job's business, and its results are what the live path merges on top of.
  if (!opts.deep) return googleNewsPage(base);

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
    out.push(...(await googleNewsPage(`${base}${window}`)));
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
   * Which barangays to ask about is the caller's decision, because it comes
   * from the hazard data and only the scheduled job has that on disk.
   */
  for (const name of opts.floodProne ?? []) {
    out.push(...(await googleNewsPage(`(flood OR flooding OR baha) "${name}" Davao`)));
    await new Promise((r) => setTimeout(r, 800));
  }

  return out;
}

async function googleNewsPage(query: string): Promise<NewsItem[]> {
  const q = encodeURIComponent(query);
  const res = await get(
    `https://news.google.com/rss/search?q=${q}&hl=en-PH&gl=PH&ceid=PH:en`,
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
  // Five different hosts, so there is nobody to be polite to by going one at
  // a time — and going one at a time is most of what made this slow.
  const perFeed = await Promise.allSettled(
    LOCAL_FEEDS.map(([name, url]) => readFeed(name, url)),
  );
  return perFeed.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

async function readFeed(name: string, url: string): Promise<NewsItem[]> {
  const out: NewsItem[] = [];
  {
    try {
      const res = await get(url, { redirect: "follow" });
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
  const res = await get(url);
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
  const res = await get(`https://api.reliefweb.int/v2/reports?appname=${appname}`, {
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

export type CollectOptions = {
  /**
   * Sweep the back of the window: three overlapping date ranges plus a query
   * per flood-prone barangay. Thorough and slow — around twenty requests with
   * pauses between them, which is fine on a schedule and far too slow inside
   * a request. Off by default, so the live path stays quick.
   */
  deep?: boolean;
  /** barangay names to ask about individually; only used when `deep` */
  floodProne?: string[];
  reliefwebAppname?: string;
};

export type Collected = {
  items: NewsItem[];
  /** one line per source, for whoever is watching the logs */
  notes: string[];
  /** true when every source failed — the caller must not publish emptiness */
  allFailed: boolean;
};

/**
 * Ask every source, and never let one of them take the others down.
 *
 * Publishers go first so their version of a story — real link, photograph —
 * is the copy that wins the dedupe in `mergeNews`.
 */
export async function collectNews(
  opts: CollectOptions = {},
): Promise<Collected> {
  const sources: [string, () => Promise<NewsItem[]>][] = [
    ["Local feeds", fromLocalFeeds],
    ["Google News", () => fromGoogleNews(opts)],
    // GDELT only on the scheduled path. It has never once answered us — 429
    // when it is reachable at all — and a source with that record is not
    // worth any of a request's budget.
    ...(opts.deep ? ([["GDELT", fromGdelt]] as [string, () => Promise<NewsItem[]>][]) : []),
    ...(opts.reliefwebAppname
      ? ([["ReliefWeb", () => fromReliefWeb(opts.reliefwebAppname!)]] as [
          string,
          () => Promise<NewsItem[]>,
        ][])
      : []),
  ];

  /**
   * In parallel, deliberately.
   *
   * The sequential version existed to be polite to Google, and on a half-hour
   * schedule that costs nothing. Inside a request it would be the difference
   * between two seconds and twenty — and these are four different hosts, so
   * the politeness argument does not apply across them anyway.
   */
  const settled = await Promise.allSettled(sources.map(([, run]) => run()));

  const items: NewsItem[] = [];
  const notes: string[] = [];
  let failures = 0;
  settled.forEach((result, i) => {
    const name = sources[i]?.[0] ?? "?";
    if (result.status === "fulfilled") {
      items.push(...result.value);
      notes.push(`${name}: ${result.value.length} kept`);
    } else {
      failures++;
      notes.push(
        `${name} failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
      );
    }
  });

  return { items, notes, allFailed: failures === sources.length };
}

/**
 * Fold new items into whatever is already published.
 *
 * Additive, and pruned strictly by age: the sources drop stories off the back
 * of their own windows, so a thin run would otherwise silently shorten the
 * history.
 */
export function mergeNews(
  previous: NewsItem[],
  incoming: NewsItem[],
): NewsItem[] {
  const items = incoming;

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

  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));
}
