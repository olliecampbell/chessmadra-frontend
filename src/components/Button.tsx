import { JSXElement, Show } from "solid-js";
import { BarLoader } from "~/mocks";
import { c, stylex } from "~/utils/styles";
import { CMText } from "./CMText";
import { Pressable } from "./Pressable";

export const Button = (props: {
	onPress?: (e: MouseEvent) => void;
	loaderProps?: any;
	style?: any;
	children: JSXElement;
	isLoading?: boolean;
	class?: string;
}) => {
	let inner = props.children;
	if (typeof inner === "string") {
		inner = <CMText style={props.style.textStyles}>{inner}</CMText>;
	}
	return (
		<Pressable
			class={props.class}
			style={stylex(c.relative, props.style)}
			onPress={(e: MouseEvent) => {
				if (!props.isLoading) {
					props.onPress?.(e);
				}
			}}
		>
			<Show when={props.isLoading}>
				<div style={stylex(c.absolute, c.fullHeight, c.fullWidth, c.center)}>
					<div style={stylex(c.maxWidth("calc(100% - 18px)"), c.fullWidth)}>
						<BarLoader
							{...props.loaderProps}
							cssOverride={stylex(c.width("100%"))}
						/>
					</div>
				</div>
			</Show>
			<div
				style={stylex(
					c.opacity(props.isLoading ? 0 : 100),
					c.row,
					c.center,
					c.fullWidth,
				)}
			>
				{inner}
			</div>
		</Pressable>
	);
};
