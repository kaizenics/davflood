/**
 * Safety- and licence-critical copy. Shared so the app and the marketing site
 * physically cannot drift: attribution is a licence obligation under the
 * NOAH and OSM terms, and the disclaimer is the single most important
 * sentence in the product.
 */

export const disclaimer = {
	short: "This is a hazard map, not a flood sensor.",
	long: "NaboFlood shows modelled flood hazard — how deep water is expected to get in a given area during a storm of a given severity. It does not show water on the ground right now. For live warnings, follow PAGASA and your barangay's disaster risk reduction office.",
	/** compact form for the persistent on-map pill */
	pill: "Modelled hazard · not live conditions",
	independence:
		"NaboFlood is an independent project. It is not affiliated with, endorsed by, or operated on behalf of the City Government of Panabo, PAGASA, the OCD, or the University of the Philippines. It uses their published data under the terms those bodies made it available.",
} as const;

export type DataSource = {
	name: string;
	full: string;
	role: string;
	licence: string;
	url: string;
};

export const dataSources: DataSource[] = [
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
	{
		name: "AWS Terrain Tiles",
		full: "Terrain Tiles on AWS Open Data",
		role: "Global elevation tiles powering 3D terrain until LiDAR data is processed.",
		licence: "Open, various source licences",
		url: "https://registry.opendata.aws/terrain-tiles/",
	},
];

/** Single-line credit required on any screen showing the map. */
export const mapAttribution =
	"© OpenStreetMap contributors · OpenFreeMap · Hazard data © UP NOAH";

export const onboarding = [
	{
		title: "Know the water before it comes.",
		body: "NaboFlood shows how deep flooding is expected to get in every barangay of Panabo City — so you can decide what to do before the rain starts, not during it.",
	},
	{
		title: "Three levels. One meaning.",
		body: "Yellow is ankle to knee. Orange is waist to chest. Red is over your head. Every zone shows the words as well as the colour, because colour alone is never enough.",
	},
	{
		title: "This is a forecast of risk, not of today.",
		body: "The map shows modelled hazard from a storm of a given severity. It is not a live sensor and it cannot tell you whether water is rising right now. Follow PAGASA for that.",
	},
	{
		title: "It works without signal.",
		body: "The hazard map is stored on your phone. When the network drops during a storm — exactly when you need this — it still opens.",
	},
] as const;
