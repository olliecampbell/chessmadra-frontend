import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import UnoCSS from "unocss/vite";
import { fileURLToPath } from "node:url";
import { unoConfig } from "./src/utils/uno";

export default defineConfig({
	root: "./capacitor",
	define: {
		"process.env": JSON.stringify({}),
	},
	resolve: {
		alias: {
			"~": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},

	plugins: [
		[
			solidPlugin(),
			devtools({
				/* additional options */
				autoname: true, // e.g. enable autoname
			}),
			UnoCSS(unoConfig),
		],
	],
	build: {
		target: "esnext",
		outDir: "../dist",
		rollupOptions: {
			input: "./capacitor/index.html",
		},
	},
});
