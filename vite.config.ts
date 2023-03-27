import solid from "solid-start/vite";
import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";

// const plugins = [];
export default defineConfig({
  plugins: [
    devtools({
      /* additional options */
      // autoname: true, // e.g. enable autoname
    }),
    solid(),
  ],
});
