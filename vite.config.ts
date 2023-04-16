import solid from "solid-start/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import UnoCSS from "unocss/vite";
import { presetUno, presetAttributify, presetTagify } from "unocss";
import { grays, colors as allShades } from "./src/utils/styles";
const colorMapping = {
  gray: "grays",
  blue: "blues",
  red: "reds",
  orange: "oranges",
  yellow: "yellows",
  green: "greens",
  purple: "purples",
  success: "successShades",
};
const colors = {
  border: allShades.border,
  success: "#459B45",
  ["sidebar_button_primary"]: grays[24],
  ["sidebar_button_primary_hover"]: grays[32],
};
// map color mpapins key and values
const colorMap = Object.entries(colorMapping).forEach(([key, value]) => {
  colors[`${key}`] = {};
  colors[`${key}`]["DEFAULT"] = allShades[value]["50"];
  Object.entries(allShades[value]).forEach(([shade, color]) => {
    colors[`${key}`][`${shade}`] = color;
    colors[`${key}`][`${parseInt(shade) * 10}`] = color;
  });
});

const unoConfig = {
  rules: [
    ["custom-rule", { color: "red" }],
    ["custom-rule", { color: "blue" }],
    [
      /^text-(.*)$/,
      ([, c], { theme }) => {
        if (theme.colors[c]) return { color: theme.colors[c] };
      },
    ],
  ],
  theme: {
    colors: {
      ...colors,
    },
    height: {
      "sidebar-button": "45px",
    },
    minHeight: {
      "sidebar-button": "45px",
    },
    spacing: {
      // "sidebar-button": "45px",
    },
  },
  variants: [
    (matcher) => {
      // The prefix cannot start with "-" or "hover", you can customize the prefix.
      if (!matcher.startsWith("&hover:")) return matcher;
      return {
        // slice `hover:` prefix and passed to the next variants and rules
        matcher: matcher.slice(7), // The 7 here represents the number of characters in the prefix.
        parent: [`@media (hover: hover) and (pointer: fine)`],
        selector: (s) => `${s}:hover`,
      };
    },
  ],

  shortcuts: [
    {
      row: "flex flex-row",
      col: "flex",
      btn: "bg-blue-50 &hover:bg-blue-70 text-primary font-bold py-2 px-4 rounded cursor-pointer",
      ["padding-sidebar"]: "px-3 lg:px-[18px]",
      ["text-primary"]: "text-gray-95",
      ["text-secondary"]: "text-gray-80",
      ["text-tertiary"]: "text-gray-50",
      ["flexible"]: "basis-0 min-w-0 min-h-0 grow",
    },
    [/^square-(.*)$/, ([, c]) => `w-${c} h-${c}`],
  ],
  presets: [presetUno(), presetAttributify(), presetTagify()],
};

// const plugins = [];
export default defineConfig({
  define: {
    "process.env": JSON.stringify({}),
  },
  plugins: [
    devtools({
      /* additional options */
      autoname: true, // e.g. enable autoname
    }),
    UnoCSS(unoConfig),
    solid(),
  ],
});
