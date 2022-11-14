import { Animated } from "react-native";
import { useRef } from "react";
import React from "react";

export const useFadeAnimation = (
  visible: boolean,
  options: { duration: number }
) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: options.duration ?? 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);
  return { fadeStyling: fadeAnim };
};
