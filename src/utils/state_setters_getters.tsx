export type StateSetter<T, R> = (fn: (state: T) => R, identifier?: string) => R;
export type StateGetter<T, R> = (
  fn: (state: Readonly<T>) => R,
  identifier?: string
) => R;
