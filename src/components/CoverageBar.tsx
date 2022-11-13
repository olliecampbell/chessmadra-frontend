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
import { GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
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
  isSavedView,
}: {
  side: Side;
  isSavedView?: boolean;
  inverse?: boolean;
}) => {
  const [progressState] = useBrowsingState(([s]) => {
    let progressState = s.repertoireProgressState[side];
    return [progressState];
  });
  const [backgroundColor, inProgressColor, completedColor] = isSavedView
    ? [c.grays[30], c.greens[40], c.greens[40]]
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
        c.br(2),
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
