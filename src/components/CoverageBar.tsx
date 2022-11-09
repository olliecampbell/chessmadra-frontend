import React, { useEffect } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, isNil, capitalize, clamp, keys } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { RepertoireState } from "app/utils/repertoire_state";
import {
  SIDES,
  Side,
  RepertoireMiss,
  formatIncidence,
} from "app/utils/repertoire";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { RepertoireWizard } from "./RepertoireWizard";
import { GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import { RepertoireEditingView } from "./RepertoireEditingView";
import { RepertoireBrowsingView } from "./RepertoireBrowsingView";
import { ShareRepertoireModal } from "./ShareRepertoireModal";
import {
  useRepertoireState,
  useDebugState,
  quick,
  useUserState,
  useBrowsingState,
} from "app/utils/app_state";
import { RepertoireReview } from "./RepertoireReview";
import { SideSettingsModal } from "./SideSettingsModal";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { ProfileModal } from "./ProfileModal";
import { BP, useResponsive } from "app/utils/useResponsive";
import { RepertoirePageLayout } from "./RepertoirePageLayout";

export const CoverageBar = ({
  side,
  inverse,
  bottomNav,
}: {
  side: Side;
  bottomNav?: boolean;
  inverse?: boolean;
}) => {
  const [progressState] = useBrowsingState(([s]) => {
    let progressState = s.repertoireProgressState[side];
    return [progressState];
  });
  const [backgroundColor, inProgressColor, completedColor] = bottomNav
    ? [c.grays[14], c.grays[75], c.grays[75]]
    : inverse
    ? [c.grays[14], c.yellows[45], c.greens[50]]
    : [c.grays[80], c.yellows[65], c.greens[50]];
  let overlap = 8;
  return (
    <View
      style={s(
        c.relative,
        c.fullHeight,
        c.fullWidth,
        c.bg(backgroundColor),
        c.round,
        c.relative
      )}
    >
      <Animated.View
        style={s(
          c.absolute,
          c.top(0),
          c.round,
          c.bottom(0),
          c.opacity(progressState.pendingMoves > 0 ? 100 : 0),
          c.left(
            progressState.newProgressLeftAnim.interpolate({
              inputRange: [0, 100],
              outputRange: [
                `max(0%, calc(0% - ${overlap}px))`,
                `max(0%, calc(100% - ${overlap}px))`,
              ],
            })
          ),
          c.width(
            progressState.newProgressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: [
                `max(0%, calc(0% + ${overlap}px))`,
                `max(0%, calc(100% + ${overlap}px))`,
              ],
            })
          ),

          c.bg(c.purples[55]),
          c.fullHeight
        )}
      >
        <View
          style={s(
            c.transform("translateX(-50%)"),
            c.absolute,
            c.bottom(28),
            c.left("50%"),
            !progressState.showPopover && c.noPointerEvents
          )}
        >
          <Animated.View
            style={s(
              c.opacity(progressState.popoverOpacityAnim),
              c.rounded,
              c.cardShadow,
              c.px(12),
              c.py(12),
              c.bg(c.purples[45])
            )}
          >
            <CMText
              style={s(
                c.whitespace("nowrap"),
                c.weightSemiBold,
                c.fg(c.colors.textPrimary)
              )}
            >
              <>{pluralize(progressState.pendingMoves, "move")} pending</>
            </CMText>
            <View
              style={s(
                c.absolute,
                c.top("100%"),
                c.left("50%"),
                c.transform("translateX(-50%)"),
                // c.ml("-10px"),
                c.keyedProp("backgroundImage")(
                  `linear-gradient(to top right, transparent 50%, ${c.purples[45]} 0), linear-gradient(to bottom right, ${c.purples[45]} 50%, transparent 0)`
                ),
                c.keyedProp("backgroundSize")("50% 100%"),
                c.keyedProp("backgroundRepeat")("no-repeat"),
                c.keyedProp("backgroundPosition")("left, right"),
                c.width(18),
                c.height(10)
                // c.borderTop(`solid 10px ${c.purples[45]}`),
                // c.borderLeft(`solid 10px transparent`),
                // c.borderRight(`solid 10px transparent`),
                // c.borderBottom(``)
              )}
            ></View>
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.View
        style={s(
          c.absolute,
          c.round,
          c.top(0),
          c.bottom(0),
          c.left(0),
          c.width(
            progressState.savedProgressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            })
          ),
          c.bg(progressState.completed ? completedColor : inProgressColor),
          c.fullHeight
        )}
      ></Animated.View>
    </View>
  );
};
