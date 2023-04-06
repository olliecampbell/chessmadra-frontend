// mocks
export const View = (props) => {
  return <div {...props} style={{ ...props.style }} />;
};
export const Animated = { View };
