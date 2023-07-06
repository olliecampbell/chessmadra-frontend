import { createSignal, createEffect, Accessor } from "solid-js";

export const createPrevious = <T>(signal: Accessor<T>) => {
  const [previous, setPrevious] = createSignal(null as T | null);
  createEffect((prev: T | undefined) => {
    if (signal() !== prev) {
      setPrevious((prev ?? null) as T | null);
    }
    return signal();
  });
  return previous;
};
