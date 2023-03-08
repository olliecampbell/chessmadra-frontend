import { assign } from "lodash-es";
import { BP, Responsive } from "./utils/useResponsive";

export const s = (...args) => assign({}, ...args);

const keyedProp = (key: string) => (x: any) => {
  return {
    [key]: x,
  };
};

const keyedPixelProp = (key: string) => (x: any) => {
  if (typeof x === "number") {
    return {
      [key]: `${x}px`,
    };
  }
  return {
    [key]: x,
  };
};

const pixelifyIfNeeded = (x: number) => {
  if (typeof x === "number") {
    return `${x}px`;
  }
  return x;
};

const keyedPercentProp = (key: string) => (x: number | string | any) => {
  if (typeof x === "number") {
    return {
      [key]: `${x}%`,
    };
  }
  return {
    [key]: x,
  };
};

const hsl = (h: number, s: number, l: number, a?: number) => {
  if (a) {
    return `hsla(${h}, ${s}%, ${l}%, ${a / 100})`;
  } else {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
};

const caps = {
  textTransform: "uppercase",
  letterSpacing: "0.03rem",
};
const p = keyedPixelProp("padding");
const pt = keyedPixelProp("paddingTop");
const pb = keyedPixelProp("paddingBottom");
const pl = keyedPixelProp("paddingLeft");
const pr = keyedPixelProp("paddingRight");
const px = (x) => s(pl(x), pr(x));
const py = (x) => s(pt(x), pb(x));

const m = keyedPixelProp("margin");
const mt = keyedPixelProp("marginTop");
const mb = keyedPixelProp("marginBottom");
const ml = keyedPixelProp("marginLeft");
const mr = keyedPixelProp("marginRight");
const mx = (x) => s(ml(x), mr(x));
const my = (x) => s(mt(x), mb(x));

const weightThin = keyedProp("fontWeight")(300);
const weightRegular = keyedProp("fontWeight")(400);
const weightSemiBold = keyedProp("fontWeight")(500);
const weightBold = keyedProp("fontWeight")(600);
const weightHeavy = keyedProp("fontWeight")(700);
const weightBlack = keyedProp("fontWeight")(800);

const flexGrow = keyedProp("flexGrow");
const flexShrink = keyedProp("flexShrink");
const flexStatic = s(keyedProp("flexGrow")(0), keyedProp("flexShrink")(0));
const unshrinkable = keyedProp("flexShrink")(0);
const grow = keyedProp("flexGrow")(1);
const flex = keyedProp("flex");
const textAlign = keyedProp("textAlign");

const pageHeight = keyedProp("minHeight")("100vh");
const constrainWidth = keyedProp("maxWidth")("100%");
const constrainHeight = keyedProp("maxHeight")("100%");
const fullHeight = keyedProp("height")("100%");
const fullWidth = keyedProp("width")("100%");

const height = keyedPixelProp("height");
const width = keyedPixelProp("width");
const minWidth = keyedPixelProp("minWidth");
const minHeight = keyedPixelProp("minHeight");
const size = (x: string | number) => {
  return s(height(x), width(x));
};

const selfStart = keyedProp("alignSelf")("flex-start");
const selfCenter = keyedProp("alignSelf")("center");
const selfStretch = keyedProp("alignSelf")("stretch");
const selfEnd = keyedProp("alignSelf")("flex-end");
const alignStart = keyedProp("alignItems")("flex-start");
const alignEnd = keyedProp("alignItems")("flex-end");
const justifyStart = keyedProp("justifyContent")("flex-start");
const justifyEnd = keyedProp("justifyContent")("flex-end");
const justifyBetween = keyedProp("justifyContent")("space-between");
const alignCenter = keyedProp("alignItems")("center");
const alignStretch = keyedProp("alignItems")("stretch");
const justifyCenter = keyedProp("justifyContent")("center");
const fg = keyedProp("color");
const bg = keyedProp("backgroundColor");

const flexWrap = keyedProp("flexWrap")("wrap");

const display = keyedProp("display");
const displayFlex = keyedProp("display")("flex");
const displayNone = keyedProp("display")("none");
const displayGrid = keyedProp("display")("grid");

const row = s(displayFlex, keyedProp("flexDirection")("row"));
const gap = keyedProp("gap");
const column = s(displayFlex, keyedProp("flexDirection")("column"));
const absolute = keyedProp("position")("absolute");
const fixed = keyedProp("position")("fixed");
const relative = keyedProp("position")("relative");
const posStatic = keyedProp("position")("static");

const border = keyedProp("border");
const borderBottom = keyedProp("borderBottom");
const borderTop = keyedProp("borderTop");
const borderRight = keyedProp("borderRight");
const borderLeft = keyedProp("borderLeft");

const center = s(alignCenter, justifyCenter, displayFlex);

const br = keyedPixelProp("borderRadius");
const rounded = br(2);
const brtl = keyedPixelProp("borderTopLeftRadius");
const brtr = keyedPixelProp("borderTopRightRadius");
const brbl = keyedPixelProp("borderBottomLeftRadius");
const brbr = keyedPixelProp("borderBottomRightRadius");
const brt = (x) => {
  return s(brtl(x), brtr(x));
};
const brb = (x) => {
  return s(brbr(x), brbl(x));
};
const brl = (x) => {
  return s(brtl(x), brbl(x));
};
const brr = (x) => s(brtr(x), brbr(x));
const maxWidth = keyedPixelProp("maxWidth");
const maxHeight = keyedPixelProp("maxHeight");
const clickable = keyedProp("cursor")("pointer");
const unclickable = keyedProp("cursor")("default");
const noBasis = keyedProp("flexBasis")(0);
const round = keyedPixelProp("borderRadius")(999);
const flexible = s(
  keyedProp("flexBasis")(0),
  keyedProp("minWidth")(0),
  keyedProp("minHeight")(0),
  grow
);
const fontSize = keyedPixelProp("fontSize");

const noResize = keyedProp("resize")("none");

const opacity = keyedPercentProp("opacity");

const left = keyedPixelProp("left");
const right = keyedPixelProp("right");
const bottom = keyedPixelProp("bottom");
const top = keyedPixelProp("top");

const absoluteFull = s(absolute, top(0), left(0), fullWidth, fullHeight);

// Compount style objects
const dashboardTitle = s(fontSize(40), weightBold, fg("#2e2e3c"));
const zIndex = keyedProp("zIndex");
const overflowHidden = keyedProp("overflow")("hidden");
const overflowY = keyedProp("overflow");
const scrollY = keyedProp("overflowY")("scroll");
const scrollX = keyedProp("overflowX")("scroll");
const aircamBlue = "#1160d6";
const lineHeight = keyedProp("lineHeight");
const fontFamily = keyedProp("fontFamily");

const shadow = (x, y, blur, spread, color) => {
  return {
    boxShadow: `${x}px ${y}px ${blur}px ${spread}px ${color}`,
  };
};
const cardShadow = shadow(0, 0, 4, 0, "rgba(0, 0, 0, 0.5)");
const lightCardShadow = shadow(0, 2, 4, 0, "rgba(0, 0, 0, 0.06)");

const white = (opacity: number) => {
  return `hsla(0, 0%, 100%, ${opacity}%)`;
};
const black = (opacity: number) => {
  return `hsla(0, 0%, 0%, ${opacity}%)`;
};

export const grayHue = 200;
// const grays = {
//   10: `hsl(${grayHue}, 39%, 4%)`,
//   20: `hsl(${grayHue}, 20%, 8%)`,
//   30: `hsl(${grayHue}, 15%, 15%)`,
//   40: `hsl(${grayHue}, 13%, 25%)`,
//   50: `hsl(${grayHue}, 7%, 35%)`,
//   60: `hsl(${grayHue}, 7%, 70%)`,
//   70: `hsl(${grayHue}, 9%, 80%)`,
//   80: `hsl(${grayHue}, 5%, 90%)`,
//   90: `hsl(${grayHue}, 3%, 95%)`
// }
function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}
const genGrays = (hue, minSat, maxSat) => {
  const grays = {};
  for (let i = 0; i <= 100; i = i + 1) {
    let saturation = minSat + ((maxSat - minSat) * i) / 100;
    grays[i] = `hsl(${hue}, ${saturation}%, ${i}%)`;
  }
  return grays;
};
const grays = genGrays(grayHue, 8, 5);
const trueGrays = genGrays(0, 0, 0);
const chessboardGrays = genGrays(grayHue, 10, 3);

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
const genShades = (
  hue: number,
  _minSaturation?: number,
  _maxSaturation?: number
) => {
  const shades = {};
  let minSaturation = _minSaturation ?? 20;
  let maxSaturation = _maxSaturation ?? 80;
  let minLightness = 4;
  let maxLightness = 80;
  for (let i = 0; i <= 100; i = i + 1) {
    let lightness_y = easeInOutSine(i / 100);
    let saturation =
      minSaturation + ((maxSaturation - minSaturation) * (100 - i)) / 100;
    let lightness = minLightness + (maxLightness - minLightness) * lightness_y;
    shades[i] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  return shades;
  // return {
  //   10: `hsl(${hue}, 45%, 8%)`,
  //   20: `hsl(${hue}, 45%, 13%)`,
  //   30: `hsl(${hue}, 40%, 18%)`,
  //   40: `hsl(${hue}, 35%, 25%)`,
  //   50: `hsl(${hue}, 35%, 40%)`,
  //   60: `hsl(${hue}, 40%, 50%)`,
  //   70: `hsl(${hue}, 50%, 60%)`,
  //   80: `hsl(${hue}, 50%, 90%)`,
  //   90: `hsl(${hue}, 65%, 95%)`,
  // };
};
const blues = genShades(grayHue, 50, 80);
const teals = genShades(150);
const primaries = blues;
const yellows = genShades(41, 70, 70);
const oranges = genShades(40, 70, 70);
const arrowColors = genShades(40, 100, 100);
const pinks = genShades(308);
const purples = genShades(271);
const reds = genShades(340);
const greens = genShades(109);
const forestGreens = genShades(83);
const failureShades = reds;
const successShades = genShades(164);
const colors = {
  textPrimary: grays[95],
  textSecondary: grays[80],
  textTertiary: grays[50],
  sidebarBorder: grays[25],
  border: grays[25],
  textInverse: grays[5],
  textInverseSecondary: grays[20],
  successColor: "hsl(164, 98%, 35%)",
  failureColor: "hsl(340, 70%, 52%)",
  failureLight: "hsl(348, 100%, 72%)",
  buttonSecondary: grays[80],
  backgroundColor: grays[10],
  header: "hsl(229, 19%, 14%)",
  modalColor: "hsl(229, 10%, 90%)",
  cardBackground: grays[18],
  // lightTile: grays[48],
  // darkTile: grays[38],

  lightTile: hsl(grayHue, 14, 60),
  darkTile: hsl(grayHue, 14, 40),
  debugColor: hsl(71, 100, 42),
  debugColorDark: hsl(71, 100, 28),
};
const extraDarkBorder = border(`1px solid ${grays[7]}`);

const basicButtonStyles = s(
  br(2),
  py(16),
  px(16),
  bg(colors.buttonSecondary),
  clickable,
  center,
  {
    textStyles: s(weightBold, fontSize(16), fg(colors.textInverse)),
  }
);
const outlineDarkButtonStyles = s(
  br(2),
  py(16),
  px(16),
  bg("none"),
  border(`1px solid ${grays[20]}`),
  clickable,
  center,
  {
    textStyles: s(weightBold, fontSize(16), fg(grays[10])),
  }
);
const outlineLightButtonStyles = s(
  br(2),
  py(16),
  px(16),
  bg("none"),
  border(`1px solid ${grays[60]}`),
  clickable,
  center,
  {
    textStyles: s(weightBold, fontSize(16), fg(grays[80])),
  }
);
const basicInverseButtonStyles = s(
  br(2),
  py(16),
  px(16),
  bg(grays[20]),
  clickable,
  center,
  {
    textStyles: s(weightBold, fontSize(16), fg(colors.textPrimary)),
  }
);
const disabledButtonStyles = s(
  br(2),
  py(16),
  px(16),
  bg(hsl(215, 38, 45)),
  opacity(20),
  clickable,
  center,
  {
    textStyles: s(weightBold, fontSize(16), fg("white")),
  }
);
const extraDarkButtonStyles = s(
  br(2),
  py(16),
  px(16),
  bg(grays[10]),
  border(`1px solid ${grays[7]}`),
  clickable,
  center,
  {
    textStyles: s(weightBold, fontSize(16), fg(grays[70])),
  }
);
const basicSecondaryButtonStyles = s(
  br(2),
  py(16),
  px(16),
  bg(grays[12]),
  border(`1px solid ${grays[20]}`),
  clickable,
  center,
  {
    textStyles: s(weightBold, fontSize(16), fg(grays[70])),
  }
);
const primaryButtonStyles = s(basicButtonStyles, bg(primaries[40]), {
  textStyles: s(weightBold, fg(colors.textPrimary), fontSize(16)),
});
const primaryDisabledButtonStyles = s(basicButtonStyles, bg(grays[40]), {
  textStyles: s(weightBold, fg(grays[75]), fontSize(16)),
});
const squareBottomRowButtonStyles = s(basicButtonStyles, size(48));
const buttons = {
  basic: basicButtonStyles,
  basicSecondary: basicSecondaryButtonStyles,
  extraDark: extraDarkButtonStyles,
  darkFloater: s(
    br(2),
    py(16),
    px(16),
    bg(colors.cardBackground),
    cardShadow,
    clickable,
    center,
    {
      textStyles: s(weightBold, fontSize(16), fg(grays[70])),
    }
  ),

  basicInverse: basicInverseButtonStyles,
  disabled: disabledButtonStyles,
  primary: primaryButtonStyles,
  primaryDisabled: primaryDisabledButtonStyles,
  squareBasicButtons: squareBottomRowButtonStyles,
  outlineLight: outlineLightButtonStyles,
  outlineDark: outlineDarkButtonStyles,
};

const duotone = (primary, secondary) => {
  return {
    "--fa-primary-color": primary,
    "--fa-secondary-color": secondary,
    "--fa-secondary-opacity": 1.0,
  };
};

export const chessboardColors = {
  outlineWidth: 0.8,
  blackFill: chessboardGrays[26],
  blackOutline: chessboardGrays[5],
  blackLightAccent: chessboardGrays[26],
  blackDarkAccent: "hsla(0, 0%, 100%, 10%)",
  blackKnightAccent: chessboardGrays[20],
  whiteFill: chessboardGrays[95],
  whiteOutline: chessboardGrays[0],
  whiteLightAccent: chessboardGrays[100],
  whiteKnightAccent: chessboardGrays[40],
  whiteDarkAccent: "hsla(0, 0%, 60%, 40%)",
};

const fillNoExpand = s(minWidth("100%"), width(0));

const noPointerEvents = keyedProp("pointerEvents")("none");
const transform = keyedProp("transform");
const oldContainerStyles = (isMobile, customMaxWidth?: number) =>
  s(
    width(
      `min(calc(100vw - ${isMobile ? 24 : 24}px), ${customMaxWidth ?? 1280}px)`
    ),
    column,
    selfCenter
  );

const containerStyles = (breakpoint: BP) =>
  s(
    width(
      `min(calc(100vw - ${breakpoint <= BP.lg ? 24 : 96}px), ${
        breakpoint >= BP.xxl ? 1440 : 1280
      }px)`
    ),
    column,
    selfCenter
  );

export const noUserSelect = {
  WebkitTouchCallout: "none",
  WebkitUserSelect: "none",
  KhtmlUserSelect: "none",
  MozUserSelect: "none",
  MsUserSelect: "none",
  UserSelect: "none",
};
export const rotate = (x) => transform(`rotate(${x}deg)`);

const grid = ({
  templateColumns,
  templateRows,
  rowGap,
  columnGap,
}: {
  templateColumns: any[];
  templateRows: any[];
  rowGap: number;
  columnGap: number;
}) => {
  return s(
    c.displayGrid,
    c.keyedProp("gridTemplateColumns")(
      templateColumns ? templateColumns.join(" ") : "1fr"
    ),
    c.keyedProp("gridTemplateRows")(
      templateRows ? templateRows.join(" ") : "1fr"
    ),
    c.keyedProp("rowGap")(rowGap ?? 12),
    c.keyedProp("columnGap")(columnGap ?? 12)
  );
};

const gridColumn = ({ gap }: { gap: number }) => {
  return s(
    c.displayGrid,
    c.keyedProp("gridTemplateColumns")("1fr"),
    // c.keyedProp("gridTemplateRows")("1fr"),
    c.keyedProp("rowGap")(gap)
    // c.keyedProp("columnGap")(columnGap ?? 12)
  );
};

const minmax = (min, max) => {
  return `minmax(${pixelifyIfNeeded(min)}, ${pixelifyIfNeeded(max)})`;
};
const min = (min, max) => {
  return `min(${pixelifyIfNeeded(min)}, ${pixelifyIfNeeded(max)})`;
};
const max = (min, max) => {
  return `max(${pixelifyIfNeeded(min)}, ${pixelifyIfNeeded(max)})`;
};
const calc = (c) => {
  return `calc(${c})`;
};
const sidebarDescriptionStyles = (responsive: Responsive) => {
  return s(c.fg(c.grays[70]));
};

export const c = {
  keyedProp,
  overflowY,
  oldContainerStyles,
  containerStyles,
  displayNone,
  rounded,
  noPointerEvents,
  caps,
  p,
  pt,
  pb,
  pl,
  pr,
  px,
  py,
  m,
  mt,
  mb,
  ml,
  mr,
  mx,
  colors,
  my,
  fillNoExpand,
  weightThin,
  weightRegular,
  weightSemiBold,
  weightBold,
  primaries,
  blues,
  purples,
  pinks,
  teals,
  yellows,
  oranges,
  failureShades,
  reds,
  greens,
  forestGreens,
  successShades,
  weightHeavy,
  weightBlack,
  flexGrow,
  flexShrink,
  flexStatic,
  unshrinkable,
  grow,
  flex,
  textAlign,
  lineHeight,
  pageHeight,
  fullHeight,
  fullWidth,
  constrainWidth,
  constrainHeight,
  height,
  width,
  minWidth,
  minHeight,
  size,
  selfCenter,
  selfStretch,
  selfStart,
  selfEnd,
  alignStart,
  alignEnd,
  justifyStart,
  justifyEnd,
  justifyBetween,
  alignCenter,
  grays,
  alignStretch,
  justifyCenter,
  fg,
  bg,
  flexWrap,
  displayFlex,
  displayGrid,
  row,
  gap,
  column,
  absolute,
  absoluteFull,
  fixed,
  relative,
  posStatic,
  border,
  borderBottom,
  borderTop,
  borderRight,
  borderLeft,
  center,
  br,
  brtl,
  brtr,
  brbl,
  brbr,
  brl,
  brb,
  brt,
  brr,
  maxWidth,
  maxHeight,
  clickable,
  unclickable,
  noBasis,
  round,
  flexible,
  fontSize,
  noResize,
  opacity,
  left,
  right,
  bottom,
  top,
  dashboardTitle,
  zIndex,
  overflowHidden,
  scrollY,
  scrollX,
  aircamBlue,
  hsl,
  fontFamily,
  block: display("-block"),
  inlineBlock: display("inline-block"),
  whitespace: keyedProp("whiteSpace"),
  shadow,
  cardShadow,
  lightCardShadow,
  stif: (x, styles) => {
    return x ? styles : {};
  },
  transition: (key) => {
    return {
      transition: `200ms ${key} ease-in-out`,
    };
  },
  gradient: (c1, c2, c3) => {
    return {
      background: `linear-gradient(180deg, ${c1} 0%, ${c2} 66%, ${c3} 100%)`,
    };
  },
  white,
  black,
  buttons,
  transform,
  extraDarkBorder,
  duotone,
  rotate,
  grid,
  gridColumn,
  minmax,
  min,
  max,
  calc,
  noUserSelect,
  sidebarDescriptionStyles,
  arrowColors,
};
