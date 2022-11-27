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
  maxOpacity: _maxOpacity,
  style,
}: {
  children: any;
  open: boolean;
  maxOpacity?: number;
  style: any;
}) => {
  let maxOpacity = _maxOpacity ?? 1;
  const fadeAnim = React.useRef(
    new Animated.Value(open ? maxOpacity : 0.0)
  ).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: open ? maxOpacity : 0,
      duration: 200,
      easing: Easing.quad,
      useNativeDriver: false,
    }).start();
  }, [open, maxOpacity]);
  return (
    <Animated.View
      style={s(c.opacity(fadeAnim), !open && c.noPointerEvents, style)}
    >
      {children}
    </Animated.View>
  );
};
