import {  c, s } from "~/utils/styles";

// rome-ignore lint: ignore
export const Pressable = (props: any) => {
  return (
    <button
    type="button"
      {...props}
      style={s(c.clickable, props.style ?? {})}
      onClick={(e) => {
        props.onPress?.(e);
      }}
    />
  );
};
