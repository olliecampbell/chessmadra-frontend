export const hsl = (h: number, s: number, l: number, a?: number) => {
  if (a) {
    return `hsla(${h}, ${s}%, ${l}%, ${a / 100})`;
  } else {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
};

const genShades = (
  hue: number,
  _minSaturation?: number,
  _maxSaturation?: number
): Record<number, string> => {
  const shades: Record<number, string> = {};
  const minSaturation = _minSaturation ?? 20;
  const maxSaturation = _maxSaturation ?? 80;
  const minLightness = 4;
  const maxLightness = 80;
  for (let i = 0; i <= 100; i = i + 1) {
    const lightness_y = easeInOutSine(i / 100);
    const saturation =
      minSaturation + ((maxSaturation - minSaturation) * (100 - i)) / 100;
    const lightness =
      minLightness + (maxLightness - minLightness) * lightness_y;
    shades[i] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  return shades;
};

export const grayHue = 200;
function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}
const genGrays = (
  hue: number,
  minSat: number,
  maxSat: number
): Record<number, string> => {
  const grays: Record<number, string> = {};
  for (let i = 0; i <= 100; i = i + 1) {
    const saturation = minSat + ((maxSat - minSat) * i) / 100;
    grays[i] = `hsl(${hue}, ${saturation}%, ${i}%)`;
  }
  return grays;
};
export const gray = genGrays(grayHue, 8, 5);

const blue = genShades(grayHue, 50, 80);
const teal = genShades(150);
const primary = blue;
const yellow = genShades(41, 70, 70);
const orange = genShades(40, 70, 70);
const pink = genShades(308);
const purple = genShades(271);
const red = genShades(340, 40, 60);
const green = genShades(109);
const success = genShades(164);
const arrows = genShades(40, 100, 100);

export const colors = {
  blue,
  teal,
  primary,
  yellow,
  orange,
  pink,
  red,
  gray,
  purple,
  green,
  success: "#459B45",
  successShades: success,
  text: {
    primary: gray[95],
    secondary: gray[80],
    tertiary: gray[50],
    inverse: gray[5],
    inverseSecondary: gray[20],
  },
  sidebarBorder: gray[25],
  border: gray[20],
  successColor: "hsl(164, 98%, 55%)",
  failureColor: "hsl(340, 70%, 52%)",
  failureLight: "hsl(348, 100%, 72%)",
  buttonSecondary: gray[80],
  backgroundColor: gray[10],
  debugColor: hsl(71, 100, 42),
  debugColorDark: hsl(71, 100, 28),
  components: {
    ["sidebar_button_primary"]: gray[24],
    ["sidebar_button_primary_hover"]: gray[32],
    ["arrows"]: arrows,
  },
};
