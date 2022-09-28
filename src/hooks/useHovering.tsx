import { useRef, useState } from "react";

export const useHovering = (
  onHover?: () => void,
  onHoverLeave?: () => void
) => {
  let [hovering, setHovering] = useState(false);
  const startTime = useRef(performance.now());
  let hoveringProps = {
    onMouseEnter: () => {
      // let timeSince = performance.now() - startTime.current;
      // if (timeSince > 300) {
      setHovering(true);
      onHover?.();
      // }
    },
    onMouseLeave: () => {
      setHovering(false);
      onHoverLeave?.();
    },
  };
  return { hovering, hoveringProps, onHover, onHoverLeave };
};
