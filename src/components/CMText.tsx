import { c, s } from "app/styles";
import React from "react";
import { Animated, Text } from "react-native";

export const CMText = (props) => {
  let { children } = props;
  return (
    <Animated.Text
      {...{
        props,
        style: s(
          {
            fontFamily: "Inter",
            // fontVariationSettings: '"wdth" 112.5',
          },
          c.weightRegular,
          c.fg(c.colors.textSecondary),
          props.style
        ),
      }}
    >
      {children}
    </Animated.Text>
  );
};
