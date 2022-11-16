import React, { useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { CMText } from "./CMText";
import { quick, useUserState } from "app/utils/app_state";
import { THRESHOLD_OPTIONS } from "./ProfileModal";
import { useResponsive } from "app/utils/useResponsive";
import { getRecommendedMissThreshold } from "app/utils/user_state";
import { useOutsideClick } from "app/components/useOutsideClick";
import { SelectOneOf } from "./SelectOneOf";

export const FadeInOut = ({
  children,
  open,
  style,
}: {
  children: any;
  open: boolean;
  style: any;
}) => {
  const fadeAnim = React.useRef(new Animated.Value(open ? 1.0 : 0.0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.quad,
      useNativeDriver: false,
    }).start();
  }, [open]);
  return (
    <Animated.View
      style={s(c.opacity(fadeAnim), !open && c.noPointerEvents, style)}
    >
      {children}
    </Animated.View>
  );
};
