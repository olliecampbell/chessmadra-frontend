import { s } from "~/utils/styles";
import { useOnScreen } from "~/utils/useIntersectionObserver";
import { createVisibilityObserver } from "@solid-primitives/intersection-observer";
import { createEffect, createSignal, Show } from "solid-js";

export const LazyLoad = (props: {
  children: any;
  maxOpacity?: number;
  style?: any;
}) => {
  const [ref, setRef] = createSignal(null as HTMLElement | null);
  const visible = createVisibilityObserver({
    rootMargin: "300px",
    threshold: 0.8,
  })(ref);
  createEffect(() => {
    console.log("visible?", visible());
  });

  return (
    <div ref={setRef} style={props.style}>
      <Show when={visible()}>{props.children}</Show>
    </div>
  );
};
