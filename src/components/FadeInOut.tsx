// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { quick, useUserState } from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { useOutsideClick } from "~/components/useOutsideClick";
import { SelectOneOf } from "./SelectOneOf";
import { Animated } from "./View";
import { Motion } from "@motionone/solid";
import { Accessor, createEffect } from "solid-js";

export const FadeInOut = ({
  children,
  id,
  open,
  maxOpacity: _maxOpacity,
  style,
}: {
  children: any;
  open: Accessor<boolean>;
  maxOpacity?: number;
  style?: any;
  id?: string;
}) => {
  let maxOpacity = _maxOpacity ?? 100;
  const opacity = () => (open() ? maxOpacity : 0);
  return (
    <Motion
      id={id}
      initial={{ opacity: opacity() }}
      animate={{ opacity: opacity() }}
      style={s(!open && c.noPointerEvents, style)}
    >
      {children}
    </Motion>
  );
};
