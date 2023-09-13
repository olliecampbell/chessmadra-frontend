// mocks
export const View = (props: object & { style?: any }) => {
	return <div {...props} style={{ ...props.style }} />;
};
export const Animated = { View };
