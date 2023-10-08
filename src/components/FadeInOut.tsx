import { clsx } from "~/utils/classes";
import { c, stylex } from "~/utils/styles";

export const FadeInOut = (props: {
	children: any;
	open: boolean;
	maxOpacity?: number;
	style?: any;
	className?: string;
	class?: string;
	id?: string;
}) => {
	const maxOpacity = props.maxOpacity ?? 100;
	return (
		<div
			id={props.id}
			style={stylex(!props.open && c.noPointerEvents, props.style)}
			class={clsx(
				"transition-opacity",
				props.open ? "opacity-100" : "opacity-0",
				!props.open && "pointer-events-none",
				props.className,
				props.class,
			)}
		>
			{props.children}
		</div>
	);
};
