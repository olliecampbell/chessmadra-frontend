export const logProxy = (p: any) => {
  if (p) {
    return JSON.parse(JSON.stringify(p));
  } else {
    return p;
  }
};
