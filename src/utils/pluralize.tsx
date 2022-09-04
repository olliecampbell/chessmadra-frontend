export function pluralize(length: number, singular: string, _plural?: string) {
  let plural = _plural ?? singular + "s";
  let x = length === 1 ? singular : plural;
  return `${length} ${x}`;
}

export function plural(length: number, singular: string, _plural?: string) {
  let plural = _plural ?? singular + "s";
  let x = length === 1 ? singular : plural;
  return `${x}`;
}
