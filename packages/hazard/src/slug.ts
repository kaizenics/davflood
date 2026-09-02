/**
 * URL-safe barangay names.
 *
 * Its own module, and the reason is build tooling rather than tidiness.
 * `barangay.ts` is where this naturally lives, but that file pulls in
 * `barangay-profiles.ts` — 183 records with a scenario matrix each — and
 * vite.config.ts needs the slugs to seed prerendering. A config file is
 * loaded by Node before any bundler is involved, so importing the profile
 * graph there fails outright on extensionless relative imports.
 *
 * A slug function with no dependencies can be imported from anywhere: the
 * config, the routes, and `barangay.ts`, which re-exports it so nothing that
 * already imported it from there has to change.
 */

/**
 * The numbered downtown barangays ("19-B Garcia Heights") keep their number,
 * because that is how people say them and how they are signposted — dropping
 * it would produce two barangays called "Garcia Heights" in different parts
 * of the city.
 */
export function slugify(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
