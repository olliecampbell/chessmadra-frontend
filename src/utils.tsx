export const times = (x) => (f) => {
  let results = [];
  for (let i = 0; i < x; i++) {
    results.push(f(i));
  }
  return results;
};
