import { c, s } from "app/styles";
import React, { useState } from "react";
import { Text } from "react-native";

export const CMText = (props) => {
  let { children } = props;
  return (
    <Text
      {...{
        props,
        style: s(props.style, {
          fontFamily: "Roboto Flex",
          fontVariationSettings: '"wdth" 110',
        }),
      }}
    >
      {children}
    </Text>
  );
};
