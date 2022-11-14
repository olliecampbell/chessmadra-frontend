import React, { useLayoutEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty, isNil, dropRight } from "lodash-es";
import { CMText } from "./CMText";
import {
  quick,
  useBrowsingState,
  useRepertoireState,
  useSidebarState,
} from "app/utils/app_state";
import { SidebarStateContext } from "app/utils/browsing_state";
import { BP, useResponsive } from "app/utils/useResponsive";
import { Responses } from "./RepertoireEditingView";
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
  let body = <InnerSidebar />;
  // let _previousBody = usePrevious(body);
  let previousBody = useRef(null);
  // useEffect(() => {
  //   let t1 = null;
  //   let toggle = () => {
  //     t1 = window.setTimeout(() => {
  //       quick((s) => {
  //         s.repertoireState.browsingState.chessboardState.makeMove("e4");
  //         t1 = window.setTimeout(() => {
  //           quick((s) => {
  //             s.repertoireState.browsingState.chessboardState.backOne();
  //             toggle();
  //           });
  //         }, 1000);
  //       });
  //     }, 1000);
  //   };
  //   toggle();
  //   return () => {
  //     window.clearTimeout(t1);
  //   };
  // }, []);
  // if (previousSlideNumber !== sidebarSlideNumber) {
  //   previousBody.current = _previousBody;
  //   console.log("slide number changed!");
  // }
  return (
    <View
      style={s(
        c.column,
        c.zIndex(4),
        c.relative,
        c.bg(c.grays[15]),
        c.pb(20),
        c.minHeight("100%")
      )}
    >
      <View
        nativeID="body"
        key="body"
        style={s(
          c.column,
          // c.top(200),
          c.fullWidth,
          c.right(0),
          c.transform("translate(0%, 0%)")
        )}
      >
        <SidebarStateContext.Provider value={false}>
          <InnerSidebar />
        </SidebarStateContext.Provider>
      </View>
    </View>
  );
});

export const OldSidebar = function OldSidebar({
  previousBody,
}: {
  previousBody: any;
}) {
  let previousBodyContainer = useRef(null);
  useLayoutEffect(() => {
    console.log("previousBody", previousBody.current);
    console.log("previousBodyContainer", previousBodyContainer.current);
    if (previousBodyContainer.current && previousBody.current) {
      previousBodyContainer.current.appendChild(previousBody.current);
    }
  });
  return <View style={s()} ref={previousBodyContainer} />;
};

export const InnerSidebar = React.memo(function InnerSidebar() {
  const [addedLineState, deleteLineState, stageStack, submitFeedbackState] =
    useSidebarState((s) => [
      s.addedLineState,
      s.deleteLineState,
      s.sidebarOnboardingState.stageStack,
      s.submitFeedbackState,
    ]);
  const [moveLog] = useBrowsingState(([s, rs]) => [s.chessboardState.moveLog]);
  // const isMobile = useIsMobile();
  const responsive = useResponsive();
  let inner = null;
  if (!isEmpty(stageStack)) {
    console.log("Inner is rendering onboarding");
    inner = <SidebarOnboarding />;
  } else if (submitFeedbackState.visible) {
    inner = <FeedbackView />;
  } else if (deleteLineState.visible) {
    inner = <DeleteLineView />;
  } else if (addedLineState.visible) {
    inner = <SavedLineView />;
  } else {
    console.log("Inner is rendering responses");
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
        s.repertoireState.browsingState.moveSidebarState("left");
        s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
          dropRight(
            s.repertoireState.browsingState.sidebarState.sidebarOnboardingState
              .stageStack,
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
    <>
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
    </>
  );
});

const FeedbackPrompt = () => {
  const responsive = useResponsive();
  const [submitFeedbackState] = useSidebarState((s) => [s.submitFeedbackState]);

  if (submitFeedbackState.visible) {
    return null;
  }
  return (
    <Pressable
      style={s(c.selfEnd, c.clickable, c.px(getSidebarPadding(responsive)))}
      onPress={() => {
        quick((s) => {
          s.repertoireState.browsingState.moveSidebarState("left");
          s.repertoireState.browsingState.sidebarState.submitFeedbackState.visible =
            true;
        });
      }}
    >
      <CMText style={s(c.fg(c.grays[60]), c.fontSize(12))}>Feedback?</CMText>
    </Pressable>
  );
};

const SavedLineView = React.memo(function SavedLineView() {
  const [currentEpd] = useSidebarState((s) => [s.currentEpd]);
  const [positionReport, activeSide] = useRepertoireState(
    (s) => [s.positionReports[currentEpd], s.browsingState.activeSide],
    { referenceEquality: true }
  );
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
