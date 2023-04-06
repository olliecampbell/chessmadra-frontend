import { every, map, zip } from "lodash-es";

export function debugEquality(a: any[], b: any[]): boolean {
  return every(
    map(zip(a, b), ([a, b]) => {
      if (a === b) {
        return true;
      } else {
        console.log("These weren't equal!", a, b);
        return false;
      }
    })
  );
}

export function debugEqualityObj(a: any, b: any): boolean {
  const keys: Set<string> = new Set();
  Object.keys(a).forEach((k) => {
    keys.add(k);
  });
  Object.keys(b).forEach((k) => {
    keys.add(k);
  });
  return every(
    map(keys.keys, (k) => {
      console.log("Checking key", k);
      const x = a[k];
      const y = b[k];
      if (x === y) {
        return true;
      } else {
        console.log("These weren't equal!", x, y);
        return false;
      }
    })
  );
}
