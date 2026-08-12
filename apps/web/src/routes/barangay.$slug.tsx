import {
  barangayBySlug,
  profileFor,
  summaryFor,
} from "@davflood/hazard/barangay";
import { formatArea } from "@davflood/hazard/footprint";
import { hazardById } from "@davflood/hazard/tiers";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Phone } from "lucide-react";

import { hazardBg, hazardText } from "@/lib/hazard-classes";
import { SITE_URL, seo } from "@/lib/seo";

export const Route = createFileRoute("/barangay/$slug")({
  loader: ({ params }) => {
    const barangay = barangayBySlug(params.slug);
    if (!barangay) throw notFound();
    return profileFor(barangay);
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const name = loaderData.barangay.name;
    return {
      ...seo({
        title: `Flood risk in Barangay ${name}, Davao City`,
        description: summaryFor(loaderData).slice(0, 158),
        path: `/barangay/${loaderData.slug}`,
      }),
      /* Place, not Article: the subject of this page is a location, and the
         claim being made is about that location's modelled hazard. */
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Place",
            name: `Barangay ${name}`,
            url: `${SITE_URL}/barangay/${loaderData.slug}`,
            description: summaryFor(loaderData),
            address: {
              "@type": "PostalAddress",
              addressLocality: "Davao City",
              addressRegion: "Davao del Sur",
              addressCountry: "PH",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: loaderData.barangay.center[1],
              longitude: loaderData.barangay.center[0],
            },
          }),
        },
      ],
    };
  },
  component: BarangayScreen,
});

/**
 * One barangay's flood profile.
 *
 * The city map answers "where floods". Almost nobody arrives with that
 * question — they arrive with "what about mine", and until now the only way
 * to answer it was to know how to read a hazard map. This is that answer as a
 * page: addressable, shareable into a group chat, and readable by someone who
 * has never heard of a return period.
 *
 * All three scenarios are shown side by side, which is the thing the national
 * portal structurally cannot do: it publishes the 100-year footprint alone,
 * so "is this a rare disaster or does it happen most years" is unanswerable
 * there. Here it is the first thing on the page.
 */
function BarangayScreen() {
  const profile = Route.useLoaderData();
  const { barangay } = profile;

  return (
    <article className="px-5 py-7">
      <Link
        to="/barangays"
        className="text-ink-dim hover:text-ink -ml-1 mb-3 flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-medium transition"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All barangays
      </Link>

      <header>
        <p className="text-tide text-[10.5px] font-semibold tracking-[0.16em] uppercase">
          Davao City
        </p>
        <h1 className="text-ink mt-2 text-[1.7rem] leading-[1.15] font-semibold tracking-tight text-balance">
          Barangay {barangay.name}
        </h1>
        <p className="text-ink-dim mt-3.5 text-[14px] leading-relaxed">
          {summaryFor(profile)}
        </p>
      </header>

      {/* The comparison the official map cannot make. Three rows, ascending,
          so the reader sees a rare storm and a likely one at the same time
          rather than being shown the worst case alone. */}
      <section className="mt-8">
        <h2 className="text-ink text-[1.15rem] leading-tight font-semibold tracking-tight">
          How much floods, by storm size
        </h2>

        <ul className="border-hairline/60 mt-4 flex flex-col border-t">
          {profile.scenarios.map((row) => (
            <li
              key={row.years}
              className="border-hairline/60 flex items-baseline gap-3 border-b py-3.5"
            >
              <span className="min-w-0 flex-1">
                <span className="text-ink block text-[13.5px] font-semibold">
                  {row.label} storm
                </span>
                <span className="text-ink-dim block text-[11px]">
                  {row.annualChance} chance in any year
                </span>
              </span>

              {row.stat.total > 0 && row.worst ? (
                <span className="shrink-0 text-right">
                  <span
                    className="text-ink block text-[15px] leading-none font-semibold"
                    data-numeric
                  >
                    {formatArea(row.stat.total)} km²
                  </span>
                  <span
                    className={`${hazardText[row.worst]} mt-1 flex items-center justify-end gap-1.5 text-[11px] font-semibold`}
                  >
                    <span
                      className={`${hazardBg[row.worst]} size-2 shrink-0 rounded-[2px]`}
                      aria-hidden="true"
                    />
                    up to {hazardById[row.worst].depthShort}
                  </span>
                </span>
              ) : (
                <span className="text-ink-dim shrink-0 text-[12px]">
                  not flooded
                </span>
              )}
            </li>
          ))}
        </ul>

        <p className="text-ink-dim mt-3 text-[11px] leading-relaxed">
          Square kilometres of modelled flood footprint inside this barangay —
          not a share of it. Two thirds of Davao&apos;s barangays exist in
          OpenStreetMap as a point rather than a boundary, so there is no area
          to divide by, and a percentage would be invented.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          to="/"
          search={{
            lng: barangay.center[0],
            lat: barangay.center[1],
            b: barangay.name,
          }}
          className="bg-tide text-abyss rounded-pill flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition hover:opacity-90"
        >
          <MapPin className="size-3.5" aria-hidden="true" />
          See it on the map
        </Link>
        <Link
          to="/emergency"
          className="border-haz-high/40 bg-haz-high/8 hover:bg-haz-high/14 rounded-pill flex items-center gap-1.5 border px-3 py-1.5 text-[12px] font-semibold transition"
        >
          <Phone className="text-haz-high size-3.5" aria-hidden="true" />
          Hotlines
        </Link>
      </div>

      <footer className="border-hairline/60 text-ink-dim mt-9 border-t pt-4 text-[11.5px] leading-relaxed">
        <p>
          Modelled flood hazard from UP NOAH, measured over the polygons this
          app draws. It describes a storm of a given severity, not water on the
          ground right now, and it says nothing about drainage failures or
          whether the roads out of {barangay.name} stay passable.
        </p>
        {!barangay.surveyed && (
          <p className="mt-2">
            This barangay is mapped in OpenStreetMap as a point rather than a
            surveyed boundary, so its position on the map is approximate. The
            hazard figures above come from the model and are unaffected.
          </p>
        )}
      </footer>
    </article>
  );
}

