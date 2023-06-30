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
  hoveringRef: (x: HTMLDivElement) => void;
} => {
  const [hovering, setHovering] = createSignal(false);

  return {
    hovering,
    hoveringRef: (x: HTMLDivElement) => {
      setTimeout(() => {
        if (x?.matches(":hover")) {
          console.log("matches hover");
          onHover?.();
          setHovering(true);
        }
      }, 0);
    },
    hoveringProps: {
      // @ts-ignore
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
      onMouseLeave: () => {
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
