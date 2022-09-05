import React from "react";
import { View } from "react-native";

export const Spacer = ({
  width = null,
  height = null,
  block = false,
  grow = false,
  style = {},
  isMobile = null,
}) => {
  let styles: any = { flexGrow: grow ? 1 : 0, ...style };
  if (block) {
    styles.display = "block";
  }
  if (isMobile === true) {
    styles.height = height;
  }
  if (isMobile === false) {
    styles.width = width;
  }
  if (height) {
    styles.height = height;
  }
  if (width) {
    styles.width = width;
  }
  return <View style={styles}></View>;
};
