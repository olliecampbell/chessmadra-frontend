import { Show } from "solid-js";
import { BarLoader } from "~/mocks";
import { c, s } from "~/utils/styles";
// import { LoaderSizeMarginProps } from "react-spinners/interfaces";
import { CMText } from "./CMText";
import { Pressable } from "./Pressable";

export const Button = (props: {
	onPress?: any;
	loaderProps?: any;
	style?: any;
	children: any;
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
			style={s(c.relative, props.style)}
			onPress={() => {
				if (!props.isLoading) {
					props.onPress();
				}
			}}
		>
			<Show when={props.isLoading}>
				<div style={s(c.absolute, c.fullHeight, c.fullWidth, c.center)}>
					<div style={s(c.maxWidth("calc(100% - 18px)"), c.fullWidth)}>
						<BarLoader
							{...props.loaderProps}
							cssOverride={s(c.width("100%"))}
						/>
					</div>
				</div>
			</Show>
			<div
				style={s(
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
