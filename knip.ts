import type { KnipConfig } from "knip";

const config: KnipConfig = {
	entry: [
		"src/routes/**/*.{ts,tsx}",
		"src/landing_page_src/**/*.{js,jsx,ts,tsx}",
		"src/app.tsx",
		"src/entry-client.tsx",
		"src/entry-server.tsx",
	],
	project: ["src/**/*.{ts,tsx}"],
};

export default config;
