import { Accessor, createSignal } from "solid-js";

export const GridLoader = () => {
  return <div>mocked GridLoader</div>;
};
export const BarLoader = () => {
  return <div>mocked bar loader</div>;
};
export const useHovering = (
  onHover?: () => void,
  onHoverLeave?: () => void
): {
  hovering: Accessor<boolean>;

  hoveringProps: { onMouseEnter: () => void; onMouseLeave: () => void };
} => {
  const [hovering, setHovering] = createSignal(false);
  return {
    hovering,
    hoveringProps: {
      onMouseEnter: (e) => {
        const isTouchDevice =
          "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
          console.log("touch device");
          return;
        }
        onHover?.();
        setHovering(true);
      },
      onMouseLeave: (e) => {
        const isTouchDevice =
          "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
          console.log("touch device");
          return;
        }
        onHoverLeave?.();
        setHovering(false);
      },
    },
  };
};
