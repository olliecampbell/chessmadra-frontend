import { c, grayHue, s } from "app/styles";
import { keyBy } from "lodash-es";
export type BoardTheme = {
  light: TileTheme;
  dark: TileTheme;
  id: BoardThemeId;
  highlight: string;
  highlightDark: string;
  name: string;
};
export type TileTheme = {
  color: string;
  styles?: any;
};

export type BoardThemeId =
  | "default"
  | "reddish"
  | "stripey"
  | "chess.com"
  | "low-contrast"
  | "lichess-brown"
  | "lichess-blue";
export type PieceSetId = string;
export const PIECE_SETS = [
  "cburnett",
  "merida",
  "alpha",
  "monochrome",
  "fantasy",
  "anarcandy",
  "companion",
  "chessnut",
  "chess7",
  "cardinal",
  // "california",
  // "celtic",
  // "disguised",
  // "dubrovny",
  // "fresca",
  // "gioco",
  // "governor",
  // "horsey",
  // "icpieces",
  // "kosal",
  // "leipzig",
  // "letter",
  // "libra",
  // "maestro",
  // "pirouetti",
  // "pixel",
  // "riohacha",
  // "shapes",
  // "spatial",
  // "staunty",
  // "tatiana",
];
const adjustOpacity = (hsl: string, opacity: number) => {
  return hsl.replace("hsl", "hsla").replace(")", `, ${opacity / 100})`);
};
console.log("adjusted", adjustOpacity(c.primaries[60], 40));

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "default",
    name: "Default",
    highlight: adjustOpacity(c.primaries[60], 40),
    highlightDark: adjustOpacity(c.primaries[0], 40),
    light: {
      color: c.hsl(grayHue, 14, 60),
    },
    dark: {
      color: c.hsl(grayHue, 14, 40),
    },
  },
  // top 3 lichess themes
  {
    id: "lichess-brown",
    name: "Lichess brown",
    highlight: adjustOpacity(c.trueGrays[0], 40),
    highlightDark: adjustOpacity(c.trueGrays[0], 40),
    light: {
      color: `hsl(37, 67%, 83%)`,
    },
    dark: {
      color: `hsl(27, 40%, 57%)`,
    },
  },
  {
    id: "lichess-blue",
    name: "Lichess blue",
    highlight: adjustOpacity(c.yellows[60], 50),
    highlightDark: adjustOpacity(c.yellows[35], 60),
    light: {
      color: `hsl(200, 20%, 92%)`,
    },
    dark: {
      color: `hsl(198, 19%, 64%)`,
    },
  },
  {
    id: "chess.com",
    name: "chess.com",
    highlight: adjustOpacity(c.yellows[70], 80),
    highlightDark: adjustOpacity(c.yellows[60], 100),
    light: {
      color: `hsl(60, 44%, 88%)`,
    },
    dark: {
      color: `hsl(90, 27%, 46%)`,
    },
  },
  {
    id: "stripey",
    name: "Stripey",
    highlight: c.hsl(0, 0, 0, 40),
    highlightDark: c.hsl(0, 0, 0, 50),
    light: {
      color: c.hsl(0, 0, 86),
      styles: c.keyedProp("box-shadow")(`    inset 0px 0px 0px 0.5px black `),
    },
    dark: {
      color: c.hsl(0, 0, 79),
      styles: s(
        c.keyedProp("background")(
          `
      repeating-linear-gradient(
        135deg,
        ${c.grays[60]},
        ${c.grays[60]} 1px,
        hsla(0, 0%, 79%, 100%) 1px,
        hsla(0, 0%, 79%, 100%) 6px
      )

      `
        ),
        c.keyedProp("box-shadow")(`    inset 0px 0px 0px 0.5px black `)
      ),
    },
  },
  {
    id: "low-contrast",
    name: "Low Contrast",
    highlight: adjustOpacity(c.blues[60], 30),
    highlightDark: adjustOpacity(c.blues[80], 30),
    light: {
      color: c.grays[20],
    },
    dark: {
      color: c.grays[8],
    },
  },
  {
    id: "reddish",
    name: "Reddish",
    highlight: c.hsl(10, 34, 50, 40),
    highlightDark: c.hsl(10, 24, 40, 80),
    light: {
      color: c.hsl(10, 14, 60),
    },
    dark: {
      color: c.hsl(10, 14, 40),
    },
  },
];

// @ts-ignore
export const BOARD_THEMES_BY_ID: Record<BoardThemeId, BoardTheme> = keyBy(
  BOARD_THEMES,
  "id"
);
