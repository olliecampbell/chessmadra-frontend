import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, take, sortBy, size, isNil, dropRight } from "lodash-es";
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
import { Responses } from "./RepertoireEditingView";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import useKeypress from "react-use-keypress";
import { SidebarActions } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import {
  formatWinPercentage,
  getWinRate,
} from "app/utils/results_distribution";
import {
  getSidebarPadding,
  VERTICAL_BREAKPOINT,
} from "./RepertoireBrowsingView";
import { CoverageBar } from "./CoverageBar";
import { DeleteLineView } from "./DeleteLineView";
import { SidebarOnboarding } from "./SidebarOnboarding";
import { CoverageGoal } from "./CoverageGoal";
import { FeedbackView } from "./FeedbackView";

export const BrowserSidebar = React.memo(function BrowserSidebar() {
  const [
    addedLineState,
    deleteLineState,
    stageStack,
    moveLog,
    submitFeedbackState,
  ] = useRepertoireState((s) => [
    s.browsingState.addedLineState,
    s.browsingState.deleteLineState,
    s.browsingState.sidebarOnboardingState.stageStack,
    s.browsingState.chessboardState.moveLog,
    s.browsingState.submitFeedbackState,
  ]);
  // const isMobile = useIsMobile();
  const responsive = useResponsive();
  let inner = null;
  if (!isEmpty(stageStack)) {
    inner = <SidebarOnboarding />;
  } else if (submitFeedbackState.visible) {
    inner = <FeedbackView />;
  } else if (deleteLineState.visible) {
    inner = <DeleteLineView />;
  } else if (addedLineState.visible) {
    inner = <SavedLineView />;
  } else {
    inner = <Responses />;
  }
  let backButtonAction = null;
  if (
    addedLineState.visible ||
    deleteLineState.visible ||
    submitFeedbackState.visible
  ) {
    backButtonAction = () => {
      quick((s) => {
        s.repertoireState.browsingState.dismissTransientSidebarState();
      });
    };
  } else if (stageStack.length > 1) {
    backButtonAction = () => {
      quick((s) => {
        s.repertoireState.browsingState.sidebarOnboardingState.stageStack =
          dropRight(
            s.repertoireState.browsingState.sidebarOnboardingState.stageStack,
            1
          );
      });
    };
  } else if (!isEmpty(moveLog)) {
    backButtonAction = () => {
      quick((s) => {
        s.repertoireState.browsingState.chessboardState.backOne();
      });
    };
  }
  const paddingTop = 140;
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  return (
    <View
      style={s(
        c.column,
        c.zIndex(4),
        c.bg(c.grays[15]),
        c.pb(20),
        c.fullHeight
      )}
    >
      <Pressable
        onPress={() => {
          quick((s) => {
            backButtonAction();
          });
        }}
        style={s(
          !vertical ? c.height(paddingTop) : c.pt(backButtonAction ? 16 : 0),
          c.unshrinkable,
          isNil(backButtonAction) && s(c.opacity(0), c.noPointerEvents),
          c.column,
          c.justifyEnd,
          c.px(getSidebarPadding(responsive))
        )}
      >
        <CMText style={s()}>
          <i className="fa fa-arrow-left"></i>
          <Spacer width={8} />
          Back
        </CMText>
        <Spacer height={!vertical ? 44 : backButtonAction ? 18 : 0} />
      </Pressable>
      {inner}
      <Spacer height={44} />
      <SidebarActions />
      <Spacer height={44} grow />
      <FeedbackPrompt />
    </View>
  );
});

const FeedbackPrompt = () => {
  const responsive = useResponsive();
  const [submitFeedbackState] = useBrowsingState(([s]) => [
    s.submitFeedbackState,
  ]);

  if (submitFeedbackState.visible) {
    return null;
  }
  return (
    <Pressable
      style={s(c.selfEnd, c.clickable, c.px(getSidebarPadding(responsive)))}
      onPress={() => {
        quick((s) => {
          s.repertoireState.browsingState.submitFeedbackState.visible = true;
        });
      }}
    >
      <CMText style={s(c.fg(c.grays[60]), c.fontSize(12))}>Feedback?</CMText>
    </Pressable>
  );
};

const SavedLineView = React.memo(function SavedLineView() {
  const [positionReport, activeSide] = useRepertoireState((s) => [
    s.browsingState.getCurrentPositionReport(),
    s.browsingState.activeSide,
  ]);
  let [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[activeSide],
  ]);
  const responsive = useResponsive();
  return (
    <View style={s(c.column)}>
      <RepertoireEditingHeader>Line saved!</RepertoireEditingHeader>
      <View style={s(c.px(getSidebarPadding(responsive)))}>
        <Spacer height={8} />
        {positionReport && (
          <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
            At your level, {activeSide} wins{" "}
            <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
              {formatWinPercentage(
                getWinRate(positionReport.results, activeSide)
              )}
              %
            </CMText>{" "}
            of the time.
          </CMText>
        )}
        <Spacer height={12} />
        <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
          Your {activeSide} repertoire is now{" "}
          <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
            {Math.round(progressState.percentComplete)}%
          </CMText>{" "}
          complete.
        </CMText>
        <Spacer height={12} />
        <View style={s(c.fullWidth)}>
          <Animated.View
            style={s(
              c.row,
              c.alignEnd,
              c.justifyBetween,
              c.fullWidth,
              c.opacity(progressState.headerOpacityAnim),
              c.relative,
              c.zIndex(2)
            )}
          >
            <Spacer width={0} grow />
            {responsive.bp >= BP.md && (
              <CoverageGoal textColor={c.grays[90]} fromTop />
            )}
          </Animated.View>
          <Spacer height={4} />
          <View style={s(c.height(12))}>
            <CoverageBar isSavedView side={activeSide} />
          </View>
        </View>
        <Spacer height={12} />
      </View>
    </View>
  );
});
