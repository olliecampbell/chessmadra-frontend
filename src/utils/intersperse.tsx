import { chunk, flatMap, filter } from "lodash-es";

export const intersperse = <T,>(
  arr: T[],
  separator: (k: string, isLast: boolean) => T
): T[] => {
  if (!arr) {
    // @ts-ignore
    return null;
  }
  return (filter(arr, (a) => a) as T[]).reduce<T[]>(
    (acc, currentElement, currentIndex) => {
      const isLast = currentIndex === arr.length - 1;
      const isLastSpacer = currentIndex === arr.length - 2;
      return [
        ...acc,
        currentElement,
        ...(isLast ? [] : [separator(`spacer-${currentIndex}`, isLastSpacer)]),
      ];
    },
    []
  );
};

export const chunked = <T,>(
  arr: T[],
  separator: (n: number) => T,
  chunking?: number,
  chunkSeperator?: (n: number) => T,
  chunkContainer?: (n: T) => T
): T[] => {
  let segments = chunk(arr, chunking);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  segments = intersperse(segments, (i) => chunkSeperator(-i));
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  segments = flatMap(segments, (segment) => {
    if (Array.isArray(segment)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return chunkContainer(intersperse(segment, separator));
    }
    return segment;
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return segments;
};
