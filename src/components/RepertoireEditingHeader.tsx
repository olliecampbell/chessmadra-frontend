import { JSXElement } from "solid-js";
import { CMText } from "./CMText";

export const SidebarHeader = (props: { children: JSXElement }) => {
	return (
		<CMText class="text-primary mt-0 text-xl font-semibold lg:-mt-2 lg:text-2xl leading-relaxed align-bottom">
			{props.children}
		</CMText>
	);
};
