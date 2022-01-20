import { useEffect, useRef } from "react";

export const useEffectWithPrevious = (callback, dependencies) => {
  const previous = useRef([]);
  useEffect(() => {
    callback(...previous.current);
    previous.current = dependencies;
  }, dependencies);
};
