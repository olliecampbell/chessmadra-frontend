import { c, s } from "~/utils/styles";

export const Pressable = (props) => {
  return (
    <div
      {...props}
      style={s(props.style ?? {}, c.clickable)}
      onClick={() => {
        props.onPress();
      }}
    />
  );
};
