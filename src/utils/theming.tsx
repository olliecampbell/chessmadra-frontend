import { c, grayHue, s } from "~/utils/styles";
import { keyBy } from "lodash-es";
import chessbookBoard from "/boards/chessbook_board.png";
export type BoardTheme = {
  light: TileTheme;
  dark: TileTheme;
  boardImage?: string;
  id: BoardThemeId;
  highlightNextMove: string;
  highlightLastMove: string;
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
  "staunty",
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
  // "tatiana",
];
export const adjustOpacity = (hsl: string, opacity: number) => {
  return hsl.replace("hsl", "hsla").replace(")", `, ${opacity / 100})`);
};

const defaultHighlight = `hsla(73, 100%, 39%, 0.41)`;
const defaultDarkHighlight = `hsla(129, 60%, 21%, 0.5)`;

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "default",
    name: "Default",
    // highlight: {
    //   dark: "#295929",
    //   light: "#666666",
    // },
    // highlight: "hsla(198, 100%, 63%, 0.30)",
    // highlightDark: "hsla(198, 100%, 63%, 0.30)",
    // boardImage: chessbookBoard,
    highlightLastMove: "hsla(198, 100%, 63%, 0.5)",
    highlightNextMove: "hsla(38, 74%, 55%, 0.5)",
    light: {
      color: "hsl(118, 24%, 50%)",
    },
    dark: {
      color: "hsl(146, 35%, 38%)",
    },
  },
  {
    id: "lichess-brown",
    name: "Lichess brown",
    highlightLastMove: defaultHighlight,
    highlightNextMove: "hsla(129, 62%, 21%, 0.5)",
    light: {
      color: `hsl(37, 67%, 83%)`,
    },
    dark: {
      color: `hsl(27, 36%, 55%)`,
    },
  },
  {
    id: "chess.com",
    name: "chess.com",
    highlightLastMove: defaultHighlight,
    highlightNextMove: defaultHighlight,
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
    highlightLastMove: defaultHighlight,
    highlightNextMove: defaultHighlight,
    light: {
      color: c.hsl(0, 0, 86),
      styles: c.keyedProp("box-shadow")(`inset 0px 0px 0px 0.5px black`),
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
];

// @ts-ignore
export const BOARD_THEMES_BY_ID: Record<BoardThemeId, BoardTheme> = keyBy(
  BOARD_THEMES,
  "id"
);
export const combinedThemes = [
  {
    name: "Chessbook",
    id: "default",
    boardTheme: "default",
    pieceSet: "chessbook_monochrome",
  },
  {
    name: "Lichess",
    id: "lichess",
    boardTheme: "lichess-brown",
    pieceSet: "cburnett",
  },
  {
    name: "Chess.com",
    id: "chess.com",
    boardTheme: "chess.com",
    pieceSet: "staunty",
  },
  {
    name: "Anarchy",
    id: "anarchy",
    boardTheme: "stripey",
    pieceSet: "anarcandy",
  },
] as CombinedTheme[];
export type CombinedThemeID = "default" | "lichess" | "chess.com" | "anarchy";
export type CombinedTheme = {
  name: "Anarchy";
  id: "anarchy";
  boardTheme: "stripey";
  pieceSet: "anarcandy";
};
export const COMBINED_THEMES_BY_ID: Record<CombinedThemeID, CombinedTheme> =
  keyBy(combinedThemes, "id");
