import { JSXElement } from "solid-js";
import { clsx } from "~/utils/classes";

export const Label = (props: { children: JSXElement }) => {
	return (
		<span
			class={clsx(
				"bg-gray-30 text-primary ml-2 rounded-sm px-1 py-0.5 text-xs font-semibold",
			)}
		>
			{props.children}
		</span>
	);
};
