import { Accessor, JSX, onCleanup } from "solid-js";
import tippy from "tippy.js";

export const initTooltip = ({
	content,
	ref,
	maxWidth,
}: {
	content: Accessor<JSX.Element>;
	ref: HTMLElement;
	maxWidth: number;
}) => {
	const tip = tippy(ref, {
		content: content() as any,
		placement: "bottom",
		animation: "shift-away",
		touch: false,
		theme: "tooltip",
		maxWidth: maxWidth ? `${maxWidth}px` : undefined,
	});
	onCleanup(() => {
		tip.destroy();
	});
};
