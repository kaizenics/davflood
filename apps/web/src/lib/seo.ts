/**
 * What this site tells search engines and link previews about itself.
 *
 * One place, because the alternative is six routes each inventing their own
 * title format and half of them forgetting the canonical. Every page calls
 * `seo()` and gets a complete, consistent head.
 *
 * TWO AUDIENCES, ONE SET OF TAGS. A search result and a Messenger preview are
 * the same problem here: somebody is deciding whether to open a flood map
 * they have never heard of. In Davao the second audience is arguably the more
 * important one — hazard information travels through group chats far more
 * than through search — which is why og:image and the description get the
 * same care as the title.
 *
 * NOTHING HERE OVERSTATES THE APP. A title promising "live flood alerts"
 * would rank for searches this app cannot answer, and someone arriving from
 * one during a storm would be worse off than if they had never found it. The
 * wording matches what the disclaimer says: modelled hazard, not live water.
 */

import { currentVersion, currentVersionDate } from "@/lib/changelog";

/**
 * The canonical origin. No trailing slash — every helper appends one.
 *
 * WITH THE www, because that is the host Vercel actually serves: the apex and
 * davflood.kaizenics.dev both redirect here. This said `https://davflood.site`
 * while the redirect in vercel.json pointed at www, so every canonical tag,
 * every og:url and the whole sitemap named a host that answers 301 — which is
 * the opposite of what a canonical tag is for. It tells a crawler "this is the
 * address of this page", and the address it gave was a forwarding one.
 *
 * If the primary domain ever changes, this constant, `sitemap.host` in
 * vite.config.ts, robots.txt and llms.txt all have to move together.
 */
export const SITE_URL = "https://www.davflood.site";

/** Brand suffix. Titles read "<page> · DavFlood" so the tab is scannable. */
const BRAND = "DavFlood";

/**
 * 1200×630, the size Facebook, Messenger, X and LinkedIn all crop cleanly.
 * Absolute, because crawlers do not resolve relative image URLs.
 */
export const OG_IMAGE = `${SITE_URL}/og.png`;

export type SeoInput = {
  /** the page's own title, without the brand */
  title: string;
  /** ~155 characters; longer is truncated by Google mid-sentence */
  description: string;
  /** route path, e.g. "/barangays". "/" for the map. */
  path: string;
  /** set on pages that must never appear in search — see routes/index.tsx */
  noindex?: boolean;
};

/** Absolute URL for a route path, canonical form: no trailing slash but "/". */
export function canonicalFor(path: string): string {
  if (path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.replace(/\/+$/, "")}`;
}

/**
 * The full head for one page.
 *
 * Returns the exact shape TanStack Router's `head` wants, so a route is one
 * spread away from being properly described.
 */
export function seo({ title, description, path, noindex }: SeoInput) {
  const full = `${title} · ${BRAND}`;
  const url = canonicalFor(path);

  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),

      /* Open Graph. `og:title` deliberately omits the brand suffix — a preview
         card already shows the site name underneath, and repeating it wastes
         the one line people actually read. */
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: BRAND },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "DavFlood — modelled flood hazard for Davao City",
      },
      { property: "og:locale", content: "en_PH" },

      /* Twitter/X reads og:* for most fields but needs its own card type, or
         it renders a thumbnail beside the text instead of a full-width image. */
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/**
 * Structured data for the site as a whole.
 *
 * WebApplication rather than WebSite: this is a tool people use, not a
 * publication they read, and the category tells Google which of those two
 * results it is. Kept to claims that are verifiably true — a free, no-account
 * app about a named place — because structured data that flatters the product
 * is the kind that gets a site's rich results turned off.
 *
 * No `aggregateRating`, no `review`: there are none, and inventing them is
 * both a policy violation and a lie.
 */
export function siteJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND,
    url: `${SITE_URL}/`,
    applicationCategory: "https://schema.org/UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript.",
    inLanguage: ["en-PH", "ceb-PH", "fil-PH"],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PHP",
    },
    description:
      "A flood hazard map for Davao City. Tap anywhere to see how deep water is expected to get in a 5, 25 or 100-year storm, with rainfall, river levels and emergency hotlines.",
    about: {
      "@type": "Place",
      name: "Davao City",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Davao City",
        addressRegion: "Davao del Sur",
        addressCountry: "PH",
      },
    },
    /* The provenance of the hazard model, in the vocabulary a machine can
       read. It is the same credit the About page gives in prose, and it is a
       licence obligation either way. */
    creditText: "Hazard data © UP NOAH",
    isBasedOn: "https://noah.up.edu.ph/",

    /* Freshness, taken from the release the reader is on rather than from a
       date someone has to remember to bump. Omitted entirely before the
       first release — an absent dateModified is honest, a wrong one is not. */
    ...(currentVersion ? { softwareVersion: currentVersion } : {}),
    ...(currentVersionDate ? { dateModified: currentVersionDate } : {}),

    publisher: {
      "@type": "Organization",
      name: BRAND,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon-512.png`,
    },
  });
}
