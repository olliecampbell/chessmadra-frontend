// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Side } from "~/utils/repertoire";
import { useBrowsingState } from "~/utils/app_state";
import { Animated, View } from "./View";

export const CoverageBar = ({
  side,
  rounded,
  isInSidebar: isInSidebar,
}: {
  side: Side;
  rounded?: boolean;
  isInSidebar?: boolean;
}) => {
  const [progressState] = useBrowsingState(([s]) => {
    let progressState = s.repertoireProgressState[side];
    return [progressState];
  });
  const inverse = side === "white";
  const [backgroundColor, inProgressColor, completedColor] = isInSidebar
    ? [c.grays[30], c.greens[50], c.greens[50]]
    : inverse
    ? [c.grays[80], c.oranges[55], c.greens[50]]
    : [c.grays[30], c.oranges[65], c.greens[50]];
  let overlap = 8;
  return (
    <div
      style={s(
        c.relative,
        c.fullHeight,
        c.fullWidth,
        c.bg(backgroundColor),
        c.br(rounded ? 999 : 2),
        c.relative
      )}
    >
      <Animated.View
        style={s(
          c.absolute,
          c.br(2),
          c.top(0),
          c.bottom(0),
          c.left(0),
          c.width(
            // TODO solid
            "100%"
            // progressState.savedProgressAnim.interpolate({
            //   inputRange: [0, 100],
            //   outputRange: ["0%", "100%"],
            // })
          ),
          c.bg(progressState.completed ? completedColor : inProgressColor),
          c.fullHeight
        )}
      ></Animated.View>
    </div>
  );
};
