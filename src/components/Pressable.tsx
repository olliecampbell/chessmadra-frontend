import { c, stylex } from "~/utils/styles";

export const Pressable = (props: any) => {
	return (
		<button
			type="button"
			{...props}
			style={stylex(c.clickable, props.style ?? {})}
			onClick={(e) => {
				props.onPress?.(e);
			}}
		/>
	);
};
