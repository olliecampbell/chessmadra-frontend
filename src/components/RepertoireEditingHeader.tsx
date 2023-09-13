import { CMText } from "./CMText";

export const SidebarHeader = (props: { children: any }) => {
	return (
		<CMText class="text-primary mt-0 text-xl font-semibold lg:-mt-2 lg:text-2xl">
			{props.children}
		</CMText>
	);
};
