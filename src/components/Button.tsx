import { c, s } from "app/styles";
import React from "react";
import { Pressable, View, Animated } from "react-native";
import { BarLoader } from "react-spinners";
// import { LoaderSizeMarginProps } from "react-spinners/interfaces";
import { CMText } from "./CMText";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    <AnimatedPressable
      style={s(c.relative, style)}
      onPress={() => {
        if (!isLoading) {
          onPress();
        }
      }}
    >
      {isLoading && (
        <View style={s(c.absolute, c.fullHeight, c.fullWidth, c.center)}>
          <View style={s(c.maxWidth("calc(100% - 18px)"), c.fullWidth)}>
            <BarLoader {...loaderProps} cssOverride={s(c.width("100%"))} />
          </View>
        </View>
      )}
      <View
        style={s(c.opacity(isLoading ? 0 : 100), c.row, c.center, c.fullWidth)}
      >
        {inner}
      </View>
    </AnimatedPressable>
  );
};
