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
            fontFamily: "Roboto Flex",
            fontVariationSettings: '"wdth" 110',
          },
          c.fg(c.colors.textSecondary),
          props.style
        ),
      }}
    >
      {children}
    </Animated.Text>
  );
};
