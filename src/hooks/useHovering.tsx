import { useEffect, useRef, useState } from "react";

export const useHovering = () => {
  let [hovering, setHovering] = useState(false);
  console.log({ hovering });
  const ref = useRef(null);

  useEffect(() => {
    const handleEnter = (event) => {
      console.log("Handling enter!");
      setHovering(true);
    };
    const handleLeave = (event) => {
      setHovering(false);
    };

    let element = ref.current;
    console.log({ element });
    element?.addEventListener("mouseover", handleEnter);
    element?.addEventListener("mouseleave", handleLeave);

    return () => {
      console.log("Removing!");
      element.removeEventListener("mouseover", handleEnter);
      element.removeEventListener("mouseleave", handleLeave);
    };
  }, []);
  return { hovering, hoverRef: ref };
};
