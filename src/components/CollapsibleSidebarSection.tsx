import { JSXElement, createSignal } from "solid-js";
import { clsx } from "~/utils/classes";
import { c, stylex } from "~/utils/styles";
import { BP, useResponsiveV2 } from "~/utils/useResponsive";
import { CMText } from "./CMText";
import { Pressable } from "./Pressable";

export const CollapsibleSidebarSection = (props: {
	children: JSXElement | JSXElement[];
	header: string;
}) => {
	const responsive = useResponsiveV2();
	const [collapsed, setCollapsed] = createSignal(true);
	return (
		<div style={stylex()}>
			<Pressable
				style={stylex(
					c.row,
					c.justifyBetween,
					c.py(8),
					c.alignCenter,
					c.px(c.getSidebarPadding(responsive())),
					c.clickable,
				)}
				class={clsx("&hover:bg-gray-18 h-sidebar-button")}
				onPress={() => {
					setCollapsed(!collapsed());
				}}
			>
				<CMText
					style={stylex(
						c.fontSize(responsive().switch(14, [BP.lg, 14])),
						c.fg(c.colors.text.primary),
					)}
				>
					{props.header}
				</CMText>
				<div style={stylex()}>
					<i
						class={clsx(
							"fa fa-chevron-right rotate-0 transition-transform",
							!collapsed() && "rotate-90",
						)}
						style={stylex(c.fg(c.colors.text.primary), c.fontSize(14))}
					/>
				</div>
			</Pressable>
			<div style={stylex()}>{collapsed() ? null : props.children}</div>
		</div>
	);
};
