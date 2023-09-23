import { createVisibilityObserver } from "@solid-primitives/intersection-observer";
import { Show, createEffect, createSignal } from "solid-js";

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

	return (
		<div ref={setRef} style={props.style}>
			<Show when={visible()}>{props.children}</Show>
		</div>
	);
};
