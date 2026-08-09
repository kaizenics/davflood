import type { Config, Context } from "@netlify/functions";

import { collectNews, mergeNews } from "@davflood/hazard/news-sources";

/**
 * /api/news — the flood reports, fetched when someone asks for them.
 *
 * This exists so nothing has to be committed to the repository to keep the
 * news current. The feeds cannot be read from the browser (no CORS on any of
 * them, and Google rate-limits hard), so something server-side has to do it;
 * the question was only whether that something writes to git every half hour
 * or answers a request. This answers a request.
 *
 * The CDN is what makes that affordable. `s-maxage` means Netlify's edge
 * serves one cached copy to everybody for half an hour and only one visitor
 * in that window actually reaches this code — so the sources see roughly the
 * same traffic a cron job would have sent them, and the repository stays
 * clean. `stale-while-revalidate` means the refresh happens behind an
 * already-served response, so nobody waits for the feeds.
 *
 * It is shallow on purpose: one Google News query and the publishers' feeds,
 * fetched in parallel, about two seconds. The deep sweep that reaches the
 * back of the two-month window is the CLI's job, and the file it produces is
 * what this merges on top of.
 */
export default async (req: Request, _context: Context) => {
  // Concurrently: the seed is a fetch of our own origin and has no reason to
  // spend any of the budget the sources need.
  const [seed, collected] = await Promise.all([
    loadSeed(req),
    collectNews({
      ...(process.env["RELIEFWEB_APPNAME"]
        ? { reliefwebAppname: process.env["RELIEFWEB_APPNAME"] }
        : {}),
    }),
  ]);
  const { items, notes, allFailed } = collected;
  console.log(notes.join(" | "));

  // Every source down is not a reason to blank the page — the committed file
  // is stale but still true, and its items carry their own dates.
  const merged = allFailed ? seed : mergeNews(seed, items);

  return Response.json(
    { fetched: new Date().toISOString(), items: merged },
    {
      headers: {
        // the browser re-asks often; the edge is what actually holds it
        "cache-control": "public, max-age=60",
        "netlify-cdn-cache-control":
          "public, s-maxage=1800, stale-while-revalidate=3600, durable",
      },
    },
  );
};

/**
 * The committed file, used as the floor.
 *
 * It carries the two-month history the shallow fetch above cannot reach, and
 * it is why a cold start still returns a full list rather than today's four
 * headlines. Fetched from the deployed site rather than read from disk: a
 * bundled function has no reliable path to the publish directory.
 */
async function loadSeed(req: Request) {
  try {
    const res = await fetch(new URL("/flood-news.json", req.url), {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const file = (await res.json()) as { items?: unknown };
    return Array.isArray(file.items) ? file.items : [];
  } catch {
    return [];
  }
}

export const config: Config = {
  path: "/api/news",
};
