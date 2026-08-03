// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
	site: "https://davflood.app",
	output: "static",
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "hover",
	},
	integrations: [sitemap(), icon({ include: { lucide: ["*"] } })],
	vite: {
		plugins: [tailwindcss()],
	},
});
