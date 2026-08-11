import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Tag } from "lucide-react";

import { REPO_URL } from "@/components/site-nav";
import { formatReleaseDate, releases } from "@/lib/changelog";

export const Route = createFileRoute("/releases")({
  component: ReleasesScreen,
});

/**
 * What changed, and when.
 *
 * A hazard map that quietly changes underneath its readers is a hazard map
 * nobody can check. If a depth band moves or a data source is swapped, the
 * person who told their barangay something last month deserves to see that
 * it is not the same map any more — so this is a public log, not a developer
 * one, and it is built from the commit history so it cannot fall behind.
 *
 * A panel, not a page: the shell owns the column and the scrolling, so
 * nothing here sets a width (see routes/about.tsx).
 */
function ReleasesScreen() {
  return (
    <article className="px-5 py-7">
      <header>
        <p className="text-tide text-[10.5px] font-semibold tracking-[0.16em] uppercase">
          Releases
        </p>
        <h1 className="text-ink mt-2.5 text-[1.7rem] leading-[1.15] font-semibold tracking-tight text-balance">
          What&apos;s new in DavFlood
        </h1>
        <p className="text-ink-dim mt-3.5 text-[14.5px] leading-relaxed">
          Every change to the app, newest first — written from the commit
          history when a version is cut, so nothing ships here unlogged.
        </p>
      </header>

      {releases.length === 0 ? (
        <p className="text-ink-dim py-16 text-center text-[13.5px]">
          No releases yet.
        </p>
      ) : (
        <ol className="mt-9 flex flex-col gap-9">
          {releases.map((release, i) => (
            <li key={release.version}>
              <div className="flex items-baseline gap-2.5">
                <h2 className="text-ink inline-flex items-baseline gap-1.5 text-[1.05rem] leading-none font-semibold tracking-tight">
                  <Tag
                    className="text-tide size-3.5 shrink-0 self-center"
                    aria-hidden="true"
                  />
                  <span data-numeric>v{release.version}</span>
                </h2>
                {/* Only the newest gets the badge. On every other entry it
                    would be decoration, and this column has no room for it. */}
                {i === 0 && (
                  <span className="bg-tide/12 text-tide rounded-pill px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    Latest
                  </span>
                )}
                <time
                  dateTime={release.date}
                  className="text-ink-dim ml-auto shrink-0 text-[11px]"
                  data-numeric
                >
                  {formatReleaseDate(release.date)}
                </time>
              </div>

              {release.sections.map((section) => (
                <section key={section.title} className="mt-4">
                  <h3 className="text-ink-dim text-[10px] font-semibold tracking-[0.13em] uppercase">
                    {section.title}
                  </h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {section.changes.map((change) => (
                      <li
                        key={`${change.sha ?? ""}${change.text}`}
                        className="text-ink flex gap-2.5 text-[13.5px] leading-relaxed"
                      >
                        <span
                          className="bg-hairline mt-[0.6em] size-1 shrink-0 rounded-full"
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          {change.scope && (
                            <span className="text-ink-dim mr-1.5 text-[11px] font-semibold">
                              {change.scope}
                            </span>
                          )}
                          {change.text}
                          {change.url && (
                            <a
                              href={change.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-dim hover:text-tide ml-1.5 text-[11px] transition"
                              data-numeric
                            >
                              {change.sha}
                            </a>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              {release.url && (
                <a
                  href={release.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-dim hover:text-tide mt-3.5 inline-flex items-center gap-1 text-[11.5px] transition"
                >
                  Full diff
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </li>
          ))}
        </ol>
      )}

      <footer className="border-hairline/60 text-ink-dim mt-10 border-t pt-4 text-[11.5px] leading-relaxed">
        <p>
          Versions follow{" "}
          <a
            href="https://semver.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-tide underline underline-offset-2 transition"
          >
            semantic versioning
          </a>
          . Every release is tagged on{" "}
          <a
            href={`${REPO_URL}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-tide underline underline-offset-2 transition"
          >
            GitHub
          </a>
          , where the notes and the code are the same thing.
        </p>
      </footer>
    </article>
  );
}
