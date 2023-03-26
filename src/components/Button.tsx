import { Show } from "solid-js";
import { BarLoader } from "~/mocks";
import { c, s } from "~/utils/styles";
// import { LoaderSizeMarginProps } from "react-spinners/interfaces";
import { CMText } from "./CMText";
import { Pressable } from "./Pressable";
import { View } from "./View";

export const Button = ({
  onPress,
  style,
  children,
  isLoading,
  loaderProps,
}: {
  onPress?: any;
  loaderProps?: any;
  style?: any;
  children: any;
  isLoading?: boolean;
}) => {
  let inner = children;
  if (typeof inner === "string") {
    inner = <CMText style={style.textStyles}>{inner}</CMText>;
  }
  return (
    <Pressable
      style={s(c.relative, style)}
      onPress={() => {
        if (!isLoading) {
          onPress();
        }
      }}
    >
      <Show when={isLoading}>
        <div style={s(c.absolute, c.fullHeight, c.fullWidth, c.center)}>
          <div style={s(c.maxWidth("calc(100% - 18px)"), c.fullWidth)}>
            <BarLoader {...loaderProps} cssOverride={s(c.width("100%"))} />
          </div>
        </div>
      </Show>
      <div
        style={s(c.opacity(isLoading ? 0 : 100), c.row, c.center, c.fullWidth)}
      >
        {inner}
      </div>
    </Pressable>
  );
};
