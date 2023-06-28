import { VitePluginConfig } from "unocss/vite";
import { presetUno, presetAttributify, presetTagify } from "unocss";
import { colors } from "./design-system";

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
const unoColors: Record<string, Record<string, string> | string> = {
  border: colors.border,
  success: "#459B45",
};
// map color mpapins key and values
const colorMap = Object.entries(colorMapping).forEach(([key, value]) => {
  unoColors[`${key}`] = {};
  unoColors[`${key}`]["DEFAULT"] = colors[value]["50"];
  Object.entries(allShades[value]).forEach(([shade, color]) => {
    unoColors[`${key}`][`${shade}`] = color;
    unoColors[`${key}`][`${parseInt(shade) * 10}`] = color;
  });
});
unoColors["red"]["black"] = colors.red["55"];
unoColors["green"]["black"] = colors.green["60"];
unoColors["red"]["white"] = colors.red["25"];
unoColors["green"]["white"] = "#1A9200";

export const unoConfig: VitePluginConfig = {
  rules: [
    ["custom-rule", { color: "red" }],
    ["text-highlight", { color: colors.components.arrows[55] }],
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
      if (!matcher.startsWith("&hoVer:")) return matcher;
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
      ["body-text"]: "text-secondary leading-5",
    },
    [/^square-(.*)$/, ([, c]) => `w-${c} h-${c}`],
    [/^&hover:(.*)$/, ([, c]) => `&hoVer:${c} active:${c}`],
  ],
  presets: [presetUno(), presetAttributify(), presetTagify()],
};
