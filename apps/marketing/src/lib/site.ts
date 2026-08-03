/**
 * Single source of truth for every string and list on the marketing site.
 * Components read from here and never hardcode copy — so retitling a
 * section, or translating the whole site into Bisaya, is one file.
 *
 * Safety- and licence-critical content lives in `@davflood/hazard` and is
 * re-exported below, so the mobile app and this site physically cannot
 * disagree about what "medium hazard" means or who the data belongs to.
 * Everything defined *in this file* is web chrome only.
 */

export { disclaimer } from "@davflood/hazard/copy";
export { dataSources } from "@davflood/hazard/copy";
export type { DataSource } from "@davflood/hazard/copy";
export { hazardTiers } from "@davflood/hazard/tiers";
export type { HazardTier, HazardId } from "@davflood/hazard/tiers";
export { scenarios } from "@davflood/hazard/scenarios";
export type { Scenario } from "@davflood/hazard/scenarios";

export const site = {
	name: "DavFlood",
	tagline: "Know the water before it comes.",
	description:
		"Free 3D flood hazard maps for every barangay in Davao City, built on UP NOAH and Phil-LiDAR data. Works offline.",
	locale: "en-PH",
	city: "Davao City",
	province: "Davao del Norte",
} as const;

/** Store link is intentionally inert until the app actually ships.
 *  When it does: set `released: true` and drop in the URL. That's it. */
export const store = {
	released: false,
	url: "#",
	label: "Coming soon to Google Play",
	labelReleased: "Get it on Google Play",
	note: "Android first. iOS later.",
} as const;

export const nav = [
	{ label: "Features", href: "/#features" },
	{ label: "Hazard levels", href: "/hazard-levels" },
	{ label: "The data", href: "/about" },
	{ label: "FAQ", href: "/faq" },
] as const;

/* ------------------------------------------------------------------ */
/* `disclaimer`, `hazardTiers` and `scenarios` are re-exported at the
   top of this file from @davflood/hazard — they are shared with the
   mobile app and must not be redefined here.                          */
/* ------------------------------------------------------------------ */

export const stats = [
	{ value: "40", label: "barangays covered", sub: "all of Davao City" },
	{ value: "3", label: "flood scenarios", sub: "5, 25 and 100-year" },
	{ value: "₱0", label: "forever", sub: "no account, no ads" },
] as const;

export const features = [
	{
		icon: "lucide:mountain",
		title: "Terrain you can tilt",
		body: "Flooding is a story about elevation. Pitch and rotate a real 3D terrain map to see which side of your barangay sits lower — and where the water goes first.",
		wide: true,
	},
	{
		icon: "lucide:layers",
		title: "Three scenarios, one tap",
		body: "Switch between the 5, 25 and 100-year flood models and watch the hazard footprint grow.",
		wide: false,
	},
	{
		icon: "lucide:map-pin",
		title: "Tap any zone",
		body: "Get the hazard level and the expected water depth for that exact spot, in plain language.",
		wide: false,
	},
	{
		icon: "lucide:cloud-rain",
		title: "Rain, next three days",
		body: "Current conditions and a 3-day rainfall forecast sit right beside the map, so the hazard layer has context.",
		wide: false,
	},
	{
		icon: "lucide:search",
		title: "Find your barangay",
		body: "Search all 40 barangays by name and jump straight to it. No pinching around the map hunting for home.",
		wide: false,
	},
	{
		icon: "lucide:wifi-off",
		title: "Works when the signal doesn't",
		body: "Map tiles cache on your phone. During a storm — exactly when you need this and exactly when the network dies — it still opens.",
		wide: true,
	},
] as const;

export const steps = [
	{
		n: "01",
		title: "Open the map",
		body: "No sign-up, no email, no permissions you have to think about. It opens straight onto Davao.",
	},
	{
		n: "02",
		title: "Pick a scenario",
		body: "Start with the 5-year model for everyday risk. Switch to 100-year to plan for the worst.",
	},
	{
		n: "03",
		title: "Read your zone",
		body: "Tap where you live. You get a hazard level, an expected depth, and what that depth means at your door.",
	},
] as const;

/* `dataSources` is re-exported from @davflood/hazard — attribution is a
   licence obligation and must be identical in the app and on the site. */

/* ------------------------------------------------------------------ */

export type FaqItem = { q: string; a: string; onLanding?: boolean };

export const faqs: FaqItem[] = [
	{
		q: "Does this show flooding happening right now?",
		a: "No — and this is the most important thing to understand about it. DavFlood shows modelled hazard: how deep water is expected to get in an area during a storm of a given severity. It is a map of risk, not a live sensor network. For real-time warnings, follow PAGASA and your local DRRM office.",
		onLanding: true,
	},
	{
		q: "Where does the data come from?",
		a: "The flood hazard layers come from UP NOAH, the University of the Philippines' hazard mapping programme, derived from Phil-LiDAR elevation surveys. The basemap is OpenStreetMap. Rainfall comes from Open-Meteo. Every source is credited on the About page with its licence.",
		onLanding: true,
	},
	{
		q: "What does a “100-year flood” actually mean?",
		a: "It does not mean the flood happens once a century. It means that in any given year there is roughly a 1-in-100 chance of a flood that size. Two of them can happen in consecutive years — that is not a contradiction, it is just probability. Over a 30-year mortgage, the chance of seeing at least one is about 26%.",
		onLanding: true,
	},
	{
		q: "Will it work when the network goes down?",
		a: "That's the point. Map tiles are cached on the device after your first visit, so the map still opens during a storm when cell service is patchy or gone. The rainfall forecast needs a connection; the hazard map does not.",
		onLanding: true,
	},
	{
		q: "Is it really free?",
		a: "Yes. No account, no subscription, no ads, no data collection. It is built on free and open data with free tooling, so there is nothing to charge for.",
		onLanding: true,
	},
	{
		q: "Is this an official government app?",
		a: "No. DavFlood is an independent project built on publicly available government and academic data. It is not affiliated with the City Government of Davao, PAGASA, or the OCD. Always defer to official advisories.",
		onLanding: true,
	},
	{
		q: "How accurate is it for my specific house?",
		a: "Treat it as a neighbourhood-level guide, not a survey of your lot. Hazard models are built from elevation data at a fixed resolution, and local details — a raised foundation, a new subdivision, a clogged canal — are not in the model. If your street floods and the map says it shouldn't, believe your street.",
	},
	{
		q: "Why Davao City first?",
		a: "It's home, the flood hazard data covers it well, and it is small enough to get right. The data pipeline is reusable, so once it works properly here, adding a city is mostly a matter of processing.",
	},
	{
		q: "Will you add other cities?",
		a: "That's the plan — Tagum, Carmen and Davao City are the obvious next steps, since the same NOAH hazard layers cover them. Getting Davao genuinely right comes first.",
	},
	{
		q: "How often is the data updated?",
		a: "Hazard maps are not a live feed; they change when UP NOAH republishes its models, which is infrequent. When a layer is updated, the app updates with it. The rainfall forecast refreshes continuously.",
	},
];

export const landingFaqs = faqs.filter((f) => f.onLanding);

export const footerNav = [
	{
		heading: "Product",
		links: [
			{ label: "Features", href: "/#features" },
			{ label: "Hazard levels", href: "/hazard-levels" },
			{ label: "How it works", href: "/#how-it-works" },
		],
	},
	{
		heading: "Understand",
		links: [
			{ label: "About the data", href: "/about" },
			{ label: "FAQ", href: "/faq" },
			{ label: "Return periods", href: "/hazard-levels#return-periods" },
		],
	},
	{
		heading: "Sources",
		links: [
			{ label: "UP NOAH", href: "https://noah.up.edu.ph/", external: true },
			{
				label: "OpenStreetMap",
				href: "https://www.openstreetmap.org/copyright",
				external: true,
			},
			{ label: "Open-Meteo", href: "https://open-meteo.com/", external: true },
		],
	},
] as const;
