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

type NewsItem = {
  title: string;
  url: string;
  source: string;
  /** ISO date */
  date: string;
};

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
  return t.includes("davao");
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

  const seen = new Set<string>();
  const deduped = items
    .filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);

  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    out,
    `${JSON.stringify({ fetched: new Date().toISOString(), items: deduped }, null, 2)}\n`,
  );
  console.log(`wrote ${deduped.length} items to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
