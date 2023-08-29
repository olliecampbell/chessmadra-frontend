import { VitePluginConfig } from "unocss/vite";
import { presetUno, presetAttributify, presetTagify } from "unocss";
import { colors } from "./design-system";

const colorMapping = {
  gray: "grays",
  blue: "blues",
  teal: "teals",
  red: "reds",
  orange: "oranges",
  yellow: "yellows",
  green: "greens",
  purple: "purples",
  success: "successShades",
};
const unoColors: Record<string, Record<string, string>> = {
  // @ts-ignore
  border: colors.border,
  // @ts-ignore
  success: "#459B45",
};
// map color mpapins key and values
const colorMap = Object.entries(colorMapping).forEach(([key, value]) => {
  unoColors[`${key}`] = {};
  // @ts-ignore
  unoColors[`${key}`]["DEFAULT"] = colors[key]["50"];
  // @ts-ignore
  Object.entries(colors[key]).forEach(([shade, color]) => {
    unoColors[`${key}`][`${shade}`] = color as string;
    unoColors[`${key}`][`${parseInt(shade) * 10}`] = color as string;
  });
});
unoColors["red"]["black"] = colors.red["55"];
unoColors["green"]["black"] = colors.green["60"];
unoColors["red"]["white"] = colors.red["25"];
unoColors["green"]["white"] = "#1A9200";
Object.entries(colors.components).forEach(([color, value]) => {
  // @ts-ignore
  unoColors[color] = value;
});
const bgColors = Object.entries(unoColors).flatMap(([hue, shades]) => {

return Object.entries(shades).map(([shade, color]) => {
  return `bg-${hue}-${shade}`;
})
})

export const unoConfig: VitePluginConfig = {
  rules: [
    ["custom-rule", { color: "red" }],
    ["text-highlight", { color: colors.components.arrows[55] }],
    [
      /^text-(.*)$/,
      ([, c], { theme }) => {
        // @ts-ignore
        if (theme.colors[c]) return { color: theme.colors[c] };
      },
    ],
  ],
  theme: {
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
      "7xl": "4.5rem",
      "8xl": "6rem",
      "9xl": "8rem",
    },

    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    colors: {
      ...unoColors,
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
    // @ts-ignore
    (matcher) => {
      // The prefix cannot start with "-" or "hover", you can customize the prefix.
      if (!matcher.startsWith("&hoVer:")) return matcher;
      return {
        // slice `hover:` prefix and passed to the next variants and rules
        matcher: matcher.slice(7), // The 7 here represents the number of characters in the prefix.
        parent: ["@media (hover: hover) and (pointer: fine)"],
        selector: (s) => `${s}:hover`,
      };
    },
  ],

  shortcuts: [
    {
      row: "flex flex-row",
      col: "flex",
      center: "flex items-center justify-center",
      btn: "bg-blue-50 &hover:bg-blue-70 text-primary font-bold py-2 px-4 rounded cursor-pointer",
      ["padding-sidebar"]: "px-3 lg:px-[18px]",
      ["text-inverse"]: "text-gray-5",
      ["text-primary"]: "text-gray-95",
      ["text-secondary"]: "text-gray-80",
      ["text-tertiary"]: "text-gray-50",
      ["flexible"]: "basis-0 min-w-0 min-h-0 grow",
      ["body-text"]: "text-secondary leading-5",
    },
    [/^square-(.*)$/, ([, c]) => `w-${c} h-${c}`],
    [/^&hover:(.*)$/, ([, c]) => `&hoVer:${c} active:${c}`],
  ],
  extraContent: {

plain: bgColors
    },
  presets: [presetUno()],
};
