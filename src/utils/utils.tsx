export const times = (x) => (f) => {
  const results = [];
  for (let i = 0; i < x; i++) {
    results.push(f(i));
  }
  return results;
};
