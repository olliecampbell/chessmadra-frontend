import { useEffect, useRef, useState } from "react";

export const useHovering = () => {
  let [hovering, setHovering] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleEnter = (event) => {
      setHovering(true);
    };
    const handleLeave = (event) => {
      setHovering(false);
    };

    let element = ref.current;
    element?.addEventListener("mouseover", handleEnter);
    element?.addEventListener("mouseleave", handleLeave);

    return () => {
      element?.removeEventListener("mouseover", handleEnter);
      element?.removeEventListener("mouseleave", handleLeave);
    };
  }, []);
  return { hovering, hoverRef: ref };
};
