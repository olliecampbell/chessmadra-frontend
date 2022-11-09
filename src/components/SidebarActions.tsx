import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, take, sortBy, size, isNil } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  formatIncidence,
  otherSide,
  RepertoireMiss,
  Side,
} from "app/utils/repertoire";
const DEPTH_CUTOFF = 4;
import { createStaticChessState } from "app/utils/chessboard_state";
import { CMText } from "./CMText";
import {
  getAppropriateEcoName,
  getNameEcoCodeIdentifier,
} from "app/utils/eco_codes";
import { SelectOneOf } from "./SelectOneOf";
import {
  quick,
  useBrowsingState,
  useDebugState,
  useRepertoireState,
} from "app/utils/app_state";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import {
  BrowserLine,
  BrowserSection,
  BrowsingTab,
} from "app/utils/browsing_state";
import { BackControls } from "./BackControls";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { useAppState } from "app/utils/app_state";
import { trackEvent, useTrack } from "app/hooks/useTrackEvent";
import { useParams } from "react-router-dom";
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import { PositionOverview, Responses } from "./RepertoireEditingView";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import useKeypress from "react-use-keypress";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { useHovering } from "app/hooks/useHovering";

export interface SidebarAction {
  onPress: () => void;
  text: string;
  style: "primary" | "secondary";
}

export const SidebarActions = () => {
  const responsive = useResponsive();
  const buttons = [] as SidebarAction[];
  const [
    hasPendingLineToAdd,
    nearestMiss,
    isPastCoverageGoal,
    currentSide,
    activeSide,
    addedLineState,
    deleteLineState,
    currentLine,
    seenOnboarding,
  ] = useBrowsingState(([s]) => [
    s.hasPendingLineToAdd,
    s.getNearestMiss(),
    s.isPastCoverageGoal,
    s.chessboardState.position.turn() === "b" ? "black" : "white",
    s.activeSide,
    s.addedLineState,
    s.deleteLineState,
    s.chessboardState.moveLog,
    s.seenOnboarding.value,
  ]);
  let reviewCurrentLineAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.reviewState.reviewLine(currentLine, activeSide);
      });
    },
    text: "Practice this line",
    style: "primary",
  };
  let continueAddingToThisLineAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.browsingState.addedLineState.visible = false;
      });
    },
    text: "Continue adding to this line",
    style: "primary",
  };
  let goToBiggestMissAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.browsingState.chessboardState.playPgn(
          nearestMiss.lines[0]
        );
      });
    },
    text: "Go to the biggest gap in your repertoire",
    style: "primary",
  };
  if (deleteLineState.visible) {
    // This is taken care of by the delete line view, maybe bad though
  } else if (!seenOnboarding) {
  } else if (addedLineState.visible) {
    buttons.push(goToBiggestMissAction);
    buttons.push(reviewCurrentLineAction);
    buttons.push(continueAddingToThisLineAction);
  } else if (!hasPendingLineToAdd) {
    buttons.push(goToBiggestMissAction);
  } else if (hasPendingLineToAdd && currentSide !== activeSide) {
    buttons.push({
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.requestToAddCurrentLine();
        });
      },
      text: isPastCoverageGoal
        ? "Save this line to my repertoire"
        : "I'll finish this later, save my progress",
      style: "primary",
    });
  }
  return (
    <View style={s(c.column, c.fullWidth)}>
      {intersperse(
        buttons.map((b) => <SidebarFullWidthButton action={b} />),
        () => {
          return <Spacer height={10} />;
        }
      )}
    </View>
  );
};
export const SidebarFullWidthButton = ({
  action,
}: {
  action: SidebarAction;
}) => {
  const responsive = useResponsive();
  const { hovering, hoveringProps } = useHovering();
  return (
    <Pressable
      onPress={action.onPress}
      {...hoveringProps}
      style={s(
        c.fullWidth,
        c.bg(hovering ? c.grays[25] : c.grays[30]),
        c.row,
        c.justifyBetween,
        c.alignCenter,
        c.py(12),
        c.px(getSidebarPadding(responsive))
      )}
      key={action.text}
    >
      <CMText style={s(c.fg(c.grays[90]), c.weightSemiBold, c.fontSize(14))}>
        {action.text}
      </CMText>
      <i
        className="fa-regular fa-arrow-right-long"
        style={s(c.fg(c.grays[80]))}
      />
    </Pressable>
  );
};
