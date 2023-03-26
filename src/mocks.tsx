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
      onMouseEnter: () => {
        onHover?.();
        setHovering(true);
      },
      onMouseLeave: () => {
        onHoverLeave?.();
        setHovering(false);
      },
    },
  };
};
