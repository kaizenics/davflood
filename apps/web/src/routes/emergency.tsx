import {
  EMERGENCY_CONTACTS,
  INCOMPLETE_LIST_NOTE,
  OFFICIAL_CENTRES,
  VERIFIED_ON,
  telHref,
} from "@davflood/hazard/emergency";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Building2, Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/emergency")({
  component: EmergencyScreen,
});

/**
 * The numbers, and what the city has actually published about where to go.
 *
 * Everything on this page is bundled at build time, so it renders with no
 * network at all — which is the only condition under which it matters. A
 * hotline directory that needs a working connection to load is a hotline
 * directory that is missing exactly when it is wanted.
 *
 * The order is triage: ring 911, then the office that runs evacuation, then
 * read about centres. Nobody standing in rising water should have to scroll
 * past a paragraph to find a number.
 */
function EmergencyScreen() {
  return (
    <article className="px-5 py-7">
      <header>
        <p className="text-haz-high text-[10.5px] font-semibold tracking-[0.16em] uppercase">
          Emergency
        </p>
        <h1 className="text-ink mt-2.5 text-[1.7rem] leading-[1.15] font-semibold tracking-tight text-balance">
          Who to call in Davao City
        </h1>
        <p className="text-ink-dim mt-3.5 text-[14.5px] leading-relaxed">
          If water is rising where you are, stop reading and dial 911. The rest
          of this page is for before and after.
        </p>
      </header>

      {/* The 911 tile, apart from and above the directory: it is the one
          number that answers at 3am, and it should be reachable with a thumb
          without reading anything. */}
      <a
        href="tel:911"
        className="border-haz-high/50 bg-haz-high/10 hover:bg-haz-high/15 mt-6 flex items-center gap-3.5 rounded-2xl border px-4 py-4 transition"
      >
        <Phone className="text-haz-high size-6 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="text-ink block text-[1.5rem] leading-none font-bold tracking-tight">
            911
          </span>
          <span className="text-ink-dim mt-1 block text-[12px] leading-snug">
            Central 911 — fire, medical, rescue. Answers 24 hours.
          </span>
        </span>
      </a>

      <section className="mt-10">
        <h2 className="text-ink text-[1.15rem] leading-tight font-semibold tracking-tight">
          Offices
        </h2>

        <ul className="mt-4 flex flex-col gap-5">
          {EMERGENCY_CONTACTS.map((contact) => (
            <li
              key={contact.id}
              className="border-hairline/60 rounded-2xl border p-4"
            >
              <h3 className="text-ink text-[14px] leading-snug font-semibold text-balance">
                {contact.name}
              </h3>
              <p className="text-ink-dim mt-1.5 text-[12.5px] leading-relaxed">
                {contact.role}
              </p>

              <ul className="mt-3 flex flex-col gap-1.5">
                {contact.numbers.map((number) => (
                  <li key={number.dial}>
                    <a
                      href={telHref(number)}
                      className="hover:bg-raised/40 -mx-2 flex items-baseline gap-2.5 rounded-lg px-2 py-1 transition"
                    >
                      <span
                        className="text-ink-dim w-12 shrink-0 text-[10.5px]"
                        aria-hidden="true"
                      >
                        {number.label}
                      </span>
                      <span
                        data-numeric
                        className={`text-[13.5px] font-semibold ${
                          number.kind === "emergency"
                            ? "text-haz-high"
                            : "text-ink"
                        }`}
                      >
                        {number.display}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <dl className="text-ink-dim mt-3 flex flex-col gap-1.5 text-[11.5px] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="sr-only">Hours</dt>
                  <dd>{contact.hours}</dd>
                </div>
                {contact.address && (
                  <div className="flex gap-2">
                    <dt>
                      <span className="sr-only">Address</span>
                      <MapPin
                        className="mt-px size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    </dt>
                    <dd>{contact.address}</dd>
                  </div>
                )}
                {contact.emails.map((email) => (
                  <div key={email} className="flex gap-2">
                    <dt>
                      <span className="sr-only">Email</span>
                      <Mail
                        className="mt-px size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${email}`}
                        className="hover:text-tide break-all transition"
                      >
                        {email}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>

              <a
                href={contact.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-dim hover:text-tide mt-3 inline-flex items-center gap-1 text-[10.5px] transition"
              >
                Published by the City Government of Davao
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-ink text-[1.15rem] leading-tight font-semibold tracking-tight">
          Evacuation centres
        </h2>

        {/* The gap, stated before the list rather than after it. A reader who
            takes this list as complete and stops looking is the failure mode
            this whole page exists to prevent. */}
        <p className="border-haz-med/45 bg-haz-med/10 text-ink mt-3 rounded-2xl border px-3.5 py-3 text-[12.5px] leading-relaxed">
          {INCOMPLETE_LIST_NOTE}
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {OFFICIAL_CENTRES.map((centre) => (
            <li
              key={centre.name}
              className="border-hairline/60 rounded-2xl border p-4"
            >
              <h3 className="text-ink flex items-start gap-2 text-[14px] leading-snug font-semibold text-balance">
                <Building2
                  className="text-tide mt-[3px] size-4 shrink-0"
                  aria-hidden="true"
                />
                {centre.name}
              </h3>
              <p className="text-ink-dim mt-1.5 pl-6 text-[12.5px] leading-relaxed">
                {centre.barangay}, {centre.district}
                {centre.capacity !== null && (
                  <>
                    {" · "}
                    <span data-numeric>{centre.capacity}</span> persons
                  </>
                )}
              </p>
              <p className="text-ink-dim mt-1.5 pl-6 text-[11.5px] leading-relaxed">
                Built to serve {centre.serves.join(", ")}.
              </p>
              <a
                href={centre.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-dim hover:text-tide mt-2.5 ml-6 inline-flex items-center gap-1 text-[10.5px] transition"
              >
                Announced {centre.announced}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-hairline/60 text-ink-dim mt-10 border-t pt-4 text-[11.5px] leading-relaxed">
        <p>
          Every number and address on this page was transcribed from a page
          published by the City Government of Davao and last checked on{" "}
          <span data-numeric>{VERIFIED_ON}</span>. Nothing here is supplied by
          DavFlood — if a number has changed, the city&apos;s own page is right
          and this one is wrong. Tell us and we will fix it.
        </p>
      </footer>
    </article>
  );
}
