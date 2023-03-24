import React, { useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { quick, useUserState } from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { useOutsideClick } from "~/components/useOutsideClick";
import { SelectOneOf } from "./SelectOneOf";
import { useOnScreen } from "~/utils/useIntersectionObserver";

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
