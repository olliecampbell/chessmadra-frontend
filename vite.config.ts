import solid from "solid-start/vite";
import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import UnoCSS from "unocss/vite";
import { fileURLToPath } from "node:url";
import { unoConfig } from "./src/utils/uno";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const IS_STORYBOOK = !!process.env.IS_STORYBOOK;

export default defineConfig({
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
      ...(process.env.VITEST
        ? []
        : [
            devtools({
              /* additional options */
              autoname: true, // e.g. enable autoname
            }),
            UnoCSS(unoConfig),
          ]),
    ],
    [...(IS_STORYBOOK || process.env.VITEST ? [] : [solid()])],
    sentryVitePlugin({
      org: "marcus-lr",
      project: "chessmadra",

      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and need `project:releases` and `org:read` scopes
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
