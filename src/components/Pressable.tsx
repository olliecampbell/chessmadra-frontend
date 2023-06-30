import { c, s } from "~/utils/styles";

export const Pressable = (props: any) => {
  return (
    <button
      {...props}
      style={s(c.clickable, props.style ?? {})}
      onClick={(e) => {
        props.onPress?.(e);
      }}
    />
  );
};
