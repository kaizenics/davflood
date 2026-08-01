import type { LngLat } from "./geo";

/**
 * The 40 barangays of Panabo City.
 *
 * ⚠ The NAMES are real. The CENTROIDS ARE PLACEHOLDERS — plausible positions
 * spread across the real city extent, not surveyed coordinates. They exist so
 * search and jump-to-barangay are functional before the real data lands.
 *
 * When the NOAH / PSA boundary export arrives, replace `center` from the real
 * polygon centroids. Nothing else needs to change: `center` is the only field
 * anything reads for camera movement.
 */

export type Barangay = {
	name: string;
	/** poblacion / urban core barangays */
	poblacion?: boolean;
	center: LngLat;
	/** true once a surveyed centroid replaces the placeholder */
	surveyed: boolean;
};

export const BARANGAY_CENTROIDS_ARE_PLACEHOLDER = true;

export const barangays: Barangay[] = [
	{ name: "A. O. Floirendo", center: [125.6512, 7.3612], surveyed: false },
	{ name: "Buenavista", center: [125.7118, 7.2884], surveyed: false },
	{ name: "Cacao", center: [125.6689, 7.3402], surveyed: false },
	{ name: "Cagangohan", center: [125.7005, 7.3126], surveyed: false },
	{ name: "Consolacion", center: [125.6398, 7.3288], surveyed: false },
	{ name: "Dapco", center: [125.6934, 7.3521], surveyed: false },
	{ name: "Datu Abdul Dadia", center: [125.6221, 7.3105], surveyed: false },
	{ name: "Gredu", poblacion: true, center: [125.6871, 7.3042], surveyed: false },
	{ name: "J. P. Laurel", center: [125.6604, 7.2981], surveyed: false },
	{ name: "Kasilak", center: [125.6316, 7.3468], surveyed: false },
	{ name: "Katipunan", center: [125.7186, 7.3298], surveyed: false },
	{ name: "Katualan", center: [125.6448, 7.3711], surveyed: false },
	{ name: "Kauswagan", center: [125.6752, 7.2796], surveyed: false },
	{ name: "Kiotoy", center: [125.7042, 7.3684], surveyed: false },
	{ name: "Little Panay", center: [125.6572, 7.3195], surveyed: false },
	{ name: "Lower Panaga", center: [125.7231, 7.2712], surveyed: false },
	{ name: "Mabunao", center: [125.6108, 7.3842], surveyed: false },
	{ name: "Maduao", center: [125.6285, 7.3925], surveyed: false },
	{ name: "Malativas", center: [125.6698, 7.3878], surveyed: false },
	{ name: "Manay", center: [125.7094, 7.2568], surveyed: false },
	{ name: "Nanyo", center: [125.6841, 7.3324], surveyed: false },
	{ name: "New Malaga", center: [125.6169, 7.3556], surveyed: false },
	{ name: "New Malitbog", center: [125.6027, 7.3312], surveyed: false },
	{ name: "New Pandan", poblacion: true, center: [125.6812, 7.3088], surveyed: false },
	{ name: "New Visayas", center: [125.6461, 7.2874], surveyed: false },
	{ name: "Quezon", center: [125.7148, 7.3512], surveyed: false },
	{ name: "Salvacion", center: [125.6355, 7.2742], surveyed: false },
	{ name: "San Francisco", poblacion: true, center: [125.6795, 7.2998], surveyed: false },
	{ name: "San Nicolas", center: [125.6928, 7.2841], surveyed: false },
	{ name: "San Pedro", center: [125.6248, 7.3652], surveyed: false },
	{ name: "San Roque", center: [125.6612, 7.3582], surveyed: false },
	{ name: "San Vicente", center: [125.7012, 7.2645], surveyed: false },
	{ name: "Santa Cruz", center: [125.6534, 7.2668], surveyed: false },
	{ name: "Santo Niño", poblacion: true, center: [125.6884, 7.3151], surveyed: false },
	{ name: "Sindaton", center: [125.6072, 7.3728], surveyed: false },
	{ name: "Southern Davao", center: [125.6721, 7.2712], surveyed: false },
	{ name: "Tagpore", center: [125.7268, 7.3082], surveyed: false },
	{ name: "Tibungol", center: [125.6392, 7.3982], surveyed: false },
	{ name: "Upper Licanan", center: [125.5978, 7.2938], surveyed: false },
	{ name: "Waterfall", center: [125.6145, 7.4062], surveyed: false },
];

/** Diacritic- and case-insensitive search, so "santo nino" finds "Santo Niño". */
export function normalizeName(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

export function searchBarangays(query: string, limit = 40): Barangay[] {
	const q = normalizeName(query);
	if (!q) return barangays.slice(0, limit);

	const scored = barangays
		.map((b) => {
			const n = normalizeName(b.name);
			// prefix match beats substring match beats nothing
			const score = n.startsWith(q) ? 2 : n.includes(q) ? 1 : 0;
			return { b, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, z) => z.score - a.score || a.b.name.localeCompare(z.b.name));

	return scored.slice(0, limit).map((x) => x.b);
}
