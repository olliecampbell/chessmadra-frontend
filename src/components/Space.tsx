export const Spacer = (props: {
	width?: number | null;
	height?: number | null;
	block?: boolean;
	grow?: boolean;
	style?: any;
	isMobile?: boolean;
}) => {
	const _styles = () => {
		const styles: any = { "flex-grow": props.grow ? 1 : 0, ...props.style };
		if (props.block) {
			styles.display = "block";
		}
		if (props.isMobile === true) {
			styles.height = `${props.height}px`;
		}
		if (props.isMobile === false) {
			styles.width = `${props.width}px`;
		}
		if (props.height) {
			styles.height = `${props.height}px`;
		}
		if (props.width) {
			styles.width = `${props.width}px`;
		}
		return styles;
	};
	return <div style={_styles()} />;
};
