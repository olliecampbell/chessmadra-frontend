export const Pressable = (props) => {
  return (
    <div
      {...props}
      onClick={() => {
        props.onPress();
      }}
    />
  );
};
