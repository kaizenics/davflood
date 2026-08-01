/**
 * Single source of truth for every string and list on the marketing site.
 * Components read from here and never hardcode copy — so retitling a
 * section, or translating the whole site into Bisaya, is one file.
 */

export const site = {
	name: "NaboFlood",
	tagline: "Know the water before it comes.",
	description:
		"Free 3D flood hazard maps for every barangay in Panabo City, built on UP NOAH and Phil-LiDAR data. Works offline.",
	locale: "en-PH",
	city: "Panabo City",
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
/* The disclaimer. This is the single most important sentence on the
   site — model-based hazard maps read as live flood status to people
   who are scared and in a hurry. It appears above the fold.           */
/* ------------------------------------------------------------------ */

export const disclaimer = {
	short: "This is a hazard map, not a flood sensor.",
	long: "NaboFlood shows modelled flood hazard — how deep water is expected to get in a given area during a storm of a given severity. It does not show water on the ground right now. For live warnings, follow PAGASA and your barangay's disaster risk reduction office.",
} as const;

/* ------------------------------------------------------------------ */
/* Hazard tiers — these depth bands are the UP NOAH classification.    */
/* ------------------------------------------------------------------ */

export type HazardTier = {
	id: "low" | "medium" | "high";
	label: string;
	name: string;
	depth: string;
	depthShort: string;
	summary: string;
	/** what it actually looks like at your front door */
	human: string;
	/** what a resident should do */
	action: string;
	/** tailwind colour token suffix — text-haz-low, bg-haz-low, … */
	token: "haz-low" | "haz-med" | "haz-high";
};

export const hazardTiers: HazardTier[] = [
	{
		id: "low",
		label: "Low",
		name: "Shallow flooding",
		depth: "0.1 – 0.5 metres",
		depthShort: "0.1–0.5 m",
		summary: "Ankle to knee deep.",
		human: "Water reaches your ankles or knees. Streets become impassable to motorcycles and small cars. Anything stored on the floor gets wet.",
		action: "Move belongings off the floor. Avoid driving through it — half a metre of moving water can float a small car.",
		token: "haz-low",
	},
	{
		id: "medium",
		label: "Medium",
		name: "Moderate flooding",
		depth: "0.5 – 1.5 metres",
		depthShort: "0.5–1.5 m",
		summary: "Waist to chest deep.",
		human: "Water reaches your waist or chest. A single-storey house takes water throughout. Electrical outlets are submerged. Wading becomes dangerous once it moves.",
		action: "Evacuate early, before the water reaches this depth. Cut power at the breaker if it is safe to do so.",
		token: "haz-med",
	},
	{
		id: "high",
		label: "High",
		name: "Deep flooding",
		depth: "Over 1.5 metres",
		depthShort: "> 1.5 m",
		summary: "Above head height.",
		human: "Water goes over an adult's head. Single-storey homes are fully submerged. This depth is life-threatening regardless of how well you swim, because of current and debris.",
		action: "Do not wait. Evacuate as soon as a storm is forecast — not when the water arrives.",
		token: "haz-high",
	},
];

/* ------------------------------------------------------------------ */

export const scenarios = [
	{
		years: "5",
		label: "5-year",
		blurb: "The flood you can expect roughly every few years. The most useful one for everyday planning.",
	},
	{
		years: "25",
		label: "25-year",
		blurb: "A serious storm. Bigger footprint, deeper water, more barangays affected.",
	},
	{
		years: "100",
		label: "100-year",
		blurb: "The worst case in the model. Use it to know where you would go, not where you'd stay.",
	},
] as const;

export const stats = [
	{ value: "40", label: "barangays covered", sub: "all of Panabo City" },
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
		body: "No sign-up, no email, no permissions you have to think about. It opens straight onto Panabo.",
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

/* ------------------------------------------------------------------ */
/* Attribution is a licence obligation, not a nicety.                  */
/* ------------------------------------------------------------------ */

export const dataSources = [
	{
		name: "UP NOAH",
		full: "Nationwide Operational Assessment of Hazards",
		role: "Flood hazard maps for the 5, 25 and 100-year return periods.",
		licence: "Open data, attribution required",
		url: "https://noah.up.edu.ph/",
	},
	{
		name: "Phil-LiDAR 1 / LiPAD",
		full: "LiDAR Portal for Archiving and Distribution",
		role: "High-resolution elevation model used to build the 3D terrain.",
		licence: "Research and public use, attribution required",
		url: "https://lipad.dream.upd.edu.ph/",
	},
	{
		name: "OpenStreetMap",
		full: "OpenStreetMap contributors",
		role: "Roads, buildings and place names underneath the hazard layers.",
		licence: "ODbL 1.0",
		url: "https://www.openstreetmap.org/copyright",
	},
	{
		name: "OpenFreeMap",
		full: "OpenFreeMap",
		role: "Free basemap tile hosting.",
		licence: "Open, no API key",
		url: "https://openfreemap.org/",
	},
	{
		name: "Open-Meteo",
		full: "Open-Meteo weather API",
		role: "Current conditions and the 3-day rainfall forecast.",
		licence: "CC BY 4.0",
		url: "https://open-meteo.com/",
	},
] as const;

/* ------------------------------------------------------------------ */

export type FaqItem = { q: string; a: string; onLanding?: boolean };

export const faqs: FaqItem[] = [
	{
		q: "Does this show flooding happening right now?",
		a: "No — and this is the most important thing to understand about it. NaboFlood shows modelled hazard: how deep water is expected to get in an area during a storm of a given severity. It is a map of risk, not a live sensor network. For real-time warnings, follow PAGASA and your local DRRM office.",
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
		a: "No. NaboFlood is an independent project built on publicly available government and academic data. It is not affiliated with the City Government of Panabo, PAGASA, or the OCD. Always defer to official advisories.",
		onLanding: true,
	},
	{
		q: "How accurate is it for my specific house?",
		a: "Treat it as a neighbourhood-level guide, not a survey of your lot. Hazard models are built from elevation data at a fixed resolution, and local details — a raised foundation, a new subdivision, a clogged canal — are not in the model. If your street floods and the map says it shouldn't, believe your street.",
	},
	{
		q: "Why Panabo City first?",
		a: "It's home, the flood hazard data covers it well, and it is small enough to get right. The data pipeline is reusable, so once it works properly here, adding a city is mostly a matter of processing.",
	},
	{
		q: "Will you add other cities?",
		a: "That's the plan — Tagum, Carmen and Davao City are the obvious next steps, since the same NOAH hazard layers cover them. Getting Panabo genuinely right comes first.",
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
