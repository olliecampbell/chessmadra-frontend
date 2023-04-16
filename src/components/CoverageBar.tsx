// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Side } from "~/utils/repertoire";
import { useBrowsingState } from "~/utils/app_state";
import { View } from "./View";

export const CoverageBar = (props: {
  side: Side;
  rounded?: boolean;
  isInSidebar?: boolean;
}) => {
  const [progressState] = useBrowsingState(([s]) => {
    const progressState = s.repertoireProgressState[props.side];
    return [progressState];
  });
  const inverse = () => props.side === "white";
  const [backgroundColor, inProgressColor, completedColor] = props.isInSidebar
    ? [c.grays[30], c.colors.success, c.colors.success]
    : [c.grays[30], c.oranges[65], c.colors.success];
  const overlap = 8;
  return (
    <div
      style={s(
        c.relative,
        c.fullHeight,
        c.fullWidth,
        c.bg(backgroundColor),
        c.br(props.rounded ? 999 : 2),
        c.relative
      )}
    >
      <View
        style={s(
          c.absolute,
          c.br(2),
          c.top(0),
          c.bottom(0),
          c.left(0),
          c.width(progressState().percentComplete + "%"),
          c.bg(progressState().completed ? completedColor : inProgressColor),
          c.fullHeight
        )}
      ></View>
    </div>
  );
};
