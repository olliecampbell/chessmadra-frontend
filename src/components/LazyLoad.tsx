import React, { useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { CMText } from "./CMText";
import { quick, useUserState } from "app/utils/app_state";
import { useResponsive } from "app/utils/useResponsive";
import { getRecommendedMissThreshold } from "app/utils/user_state";
import { useOutsideClick } from "app/components/useOutsideClick";
import { SelectOneOf } from "./SelectOneOf";
import { useOnScreen } from "app/utils/useIntersectionObserver";

export const LazyLoad = ({
  children,
  style,
}: {
  children: any;
  maxOpacity?: number;
  style: any;
}) => {
  const ref = useRef(null);
  const onScreen = useOnScreen(ref, "300px");

  return (
    <View ref={ref} style={s(style)}>
      {onScreen && children}
    </View>
  );
};
