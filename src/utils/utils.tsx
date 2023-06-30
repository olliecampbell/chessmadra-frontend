export const compareFloats = (a: number, b: number) => {
  return Math.abs(a - b) < Number.EPSILON;
};
