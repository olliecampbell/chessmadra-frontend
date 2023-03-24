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

export const FadeInOut = ({
  children,
  open,
  maxOpacity: _maxOpacity,
  style,
}: {
  children: any;
  open: boolean;
  maxOpacity?: number;
  style?: any;
}) => {
  let maxOpacity = _maxOpacity ?? 1;
  // TODO: solid
  const fadeAnim = 100;
  // const fadeAnim = React.useRef(
  //   new Animated.Value(open ? maxOpacity : 0.0)
  // ).current;

  // TODO: solid
  // React.useEffect(() => {
  //   Animated.timing(fadeAnim, {
  //     toValue: open ? maxOpacity : 0,
  //     duration: 200,
  //     easing: Easing.quad,
  //     useNativeDriver: false,
  //   }).start();
  // }, [open, maxOpacity]);
  return (
    <Animated.View
      style={s(c.opacity(fadeAnim), !open && c.noPointerEvents, style)}
    >
      {children}
    </Animated.View>
  );
};
