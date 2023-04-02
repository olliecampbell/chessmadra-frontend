import solid from "solid-start/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import UnoCSS from "unocss/vite";
import { presetUno, presetAttributify } from "unocss";
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
const colors = {};
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
  },
  shortcuts: {
    row: "flex flex-row",
    col: "flex",
    btn: "bg-blue-50 hover:bg-blue-70 text-primary font-bold py-2 px-4 rounded cursor-pointer",
    ["text-primary"]: "text-gray-95",
    ["text-secondary"]: "text-gray-80",
    ["text-tertiary"]: "text-gray-50",
  },
  presets: [presetUno(), presetAttributify()],
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
