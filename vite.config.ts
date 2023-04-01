import solid from "solid-start/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import UnoCSS from "unocss/vite";
import { presetUno, presetAttributify } from "unocss";
const unoConfig = {
  rules: [["custom-rule", { color: "red" }]],
  shortcuts: {
    "custom-shortcut": "text-lg text-orange hover:text-teal",
  },
  presets: [presetUno(), presetAttributify()],
};

// const plugins = [];
export default defineConfig({
  plugins: [
    devtools({
      /* additional options */
      autoname: true, // e.g. enable autoname
    }),
    UnoCSS(unoConfig),
    solid(),
  ],
});
