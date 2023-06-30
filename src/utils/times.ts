export const times = (x: number) => (f: (i: number) => any) => {
  const results = [];
  for (let i = 0; i < x; i++) {
    results.push(f(i));
  }
  return results;
};
