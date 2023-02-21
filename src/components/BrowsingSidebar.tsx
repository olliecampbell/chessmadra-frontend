import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty, isNil, dropRight } from "lodash-es";
import { CMText } from "./CMText";
import {
  quick,
  useBrowsingState,
  useUserState,
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
import { FadeInOut } from "./FadeInOut";
import { TargetCoverageReachedView } from "./TargetCoverageReachedView";
import { lineToPgn } from "app/utils/repertoire";
import useKeypress from "react-use-keypress";
import { isDevelopment } from "app/utils/env";
import { TransposedView } from "./TransposedView";
import { RepertoireReview } from "./RepertoireReview";
import { RepertoireOverview } from "./RepertoirtOverview";
import { SettingsButtons } from "./Settings";
import { useHovering } from "app/hooks/useHovering";
import { RepertoireHome } from "./RepertoireHome";

export const BrowserSidebar = React.memo(function BrowserSidebar() {
  let [previousSidebarAnim, currentSidebarAnim, direction] = useBrowsingState(
    ([s]) => [s.previousSidebarAnim, s.currentSidebarAnim, s.sidebarDirection]
  );
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;

  const user = useUserState((s) => s.user);
  return (
    <View
      style={s(
        c.column,
        c.zIndex(4),
        c.relative,
        c.overflowHidden,
        c.bg(c.grays[14]),
        c.pb(20),
        c.minHeight("100%")
      )}
    >
      {!vertical && (
        <View
          style={s(
            c.absolute,
            c.top(0),
            c.right(0),
            c.zIndex(15),
            c.pr(getSidebarPadding(responsive)),
            c.pt(getSidebarPadding(responsive))
          )}
        >
          <SettingsButtons />
        </View>
      )}
      {!vertical && <BackSection />}
      <View
        nativeID="body"
        key="body"
        style={s(
          c.column,
          // c.top(200),
          c.fullWidth,
          c.displayGrid,
          c.grow,
          c.right(0)
        )}
      >
        <Animated.View
          nativeID="previous-sidebar"
          style={s(
            c.keyedProp("gridArea")("1/1"),
            c.noPointerEvents,
            c.opacity(
              previousSidebarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              })
            ),
            isNil(direction) && s(c.opacity(0)),
            {
              transform: [
                {
                  translateX: previousSidebarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      "0px",
                      direction === "left" ? "40px" : "-40px",
                    ],
                  }),
                },
              ],
            }
          )}
        >
          <SidebarStateContext.Provider value={true}>
            <InnerSidebar />
          </SidebarStateContext.Provider>
        </Animated.View>
        <Animated.View
          style={s(
            c.keyedProp("gridArea")("1/1"),
            !isNil(direction) &&
              s(
                c.opacity(
                  currentSidebarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  })
                ),
                {
                  transform: [
                    {
                      translateX: currentSidebarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          direction === "left" ? "-40px" : "40px",
                          "0px",
                        ],
                      }),
                    },
                  ],
                }
              )
          )}
        >
          <SidebarStateContext.Provider value={false}>
            <InnerSidebar />
          </SidebarStateContext.Provider>
        </Animated.View>
      </View>
    </View>
  );
});

export const InnerSidebar = React.memo(function InnerSidebar() {
  const [
    addedLineState,
    deleteLineState,
    stageStack,
    submitFeedbackState,
    showPlansState,
    transposedState,
    mode,
  ] = useSidebarState(([s]) => [
    s.addedLineState,
    s.deleteLineState,
    s.sidebarOnboardingState.stageStack,
    s.submitFeedbackState,
    s.showPlansState,
    s.transposedState,
    s.mode,
  ]);
  let inner = null;
  if (submitFeedbackState.visible) {
    inner = <FeedbackView />;
  } else if (mode == "home") {
    inner = <RepertoireHome />;
  } else if (mode == "overview") {
    inner = <RepertoireOverview />;
  } else if (mode == "review") {
    inner = <RepertoireReview />;
  } else if (!isEmpty(stageStack)) {
    inner = <SidebarOnboarding />;
  } else if (deleteLineState.visible) {
    inner = <DeleteLineView />;
  } else if (transposedState.visible) {
    inner = <TransposedView />;
  } else if (showPlansState.visible) {
    inner = <TargetCoverageReachedView />;
  } else if (addedLineState.visible) {
    inner = <SavedLineView />;
  } else {
    inner = <Responses />;
  }
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  return (
    <>
      {vertical && <BackSection />}
      <View style={s(c.relative, c.zIndex(100))}>{inner}</View>
      <Spacer height={44} />
      <SidebarActions />
      <Spacer height={44} grow />
      <FeedbackPrompt />
    </>
  );
});

const BackSection = () => {
  const { hovering, hoveringProps } = useHovering();
  const [
    addedLineState,
    deleteLineState,
    stageStack,
    submitFeedbackState,
    showPlansState,
    transposedState,
    mode,
    side,
  ] = useSidebarState(([s]) => [
    s.addedLineState,
    s.deleteLineState,
    s.sidebarOnboardingState.stageStack,
    s.submitFeedbackState,
    s.showPlansState,
    s.transposedState,
    s.mode,
    s.activeSide,
  ]);
  const [moveLog] = useBrowsingState(([s, rs]) => [s.chessboardState.moveLog]);
  const responsive = useResponsive();
  const paddingTop = 140;
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  let backButtonAction: (() => void) | null = null;
  const backToOverview = () => {
    console.log("back to overview");
    quick((s) => {
      s.repertoireState.animateChessboardShown(responsive, false, () => {
        quick((s) => {
          s.repertoireState.startBrowsing(side, "overview");
        });
      });
    });
  };
  if (mode === "build") {
    if (
      addedLineState.visible ||
      deleteLineState.visible ||
      transposedState.visible
    ) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.dismissTransientSidebarState();
        });
      };
    } else if (showPlansState.visible) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.dismissTransientSidebarState();
        });
      };
    } else if (showPlansState.visible) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.chessboardState.backOne();
          s.repertoireState.browsingState.dismissTransientSidebarState();
        });
      };
    } else if (stageStack.length > 1) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
            dropRight(
              s.repertoireState.browsingState.sidebarState
                .sidebarOnboardingState.stageStack,
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
    } else if (isEmpty(moveLog)) {
      backButtonAction = () => {
        backToOverview();
      };
    }
  }

  if (mode == "review") {
  }
  if (mode == "browse") {
    if (!isEmpty(moveLog)) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.chessboardState.backOne();
        });
      };
    } else if (isEmpty(moveLog)) {
      backButtonAction = () => {
        backToOverview();
      };
    }
  }
  if (mode == "overview") {
    backButtonAction = () => {
      quick((s) => {
        s.repertoireState.backToOverview();
      });
    };
  }
  const color = hovering ? c.colors.textSecondary : c.colors.textTertiary;
  if (submitFeedbackState.visible) {
    backButtonAction = () => {
      quick((s) => {
        s.repertoireState.browsingState.dismissTransientSidebarState();
      });
    };
  }

  return (
    <FadeInOut style={s(c.column)} open={!isNil(backButtonAction)}>
      <Pressable
        {...hoveringProps}
        onPress={() => {
          quick((s) => {
            s.repertoireState.browsingState.moveSidebarState("left");
            backButtonAction?.();
          });
        }}
        style={s(
          !vertical ? c.height(paddingTop) : c.pt(backButtonAction ? 16 : 0),
          c.unshrinkable,
          c.column,
          c.justifyEnd,
          c.px(getSidebarPadding(responsive))
        )}
      >
        <CMText style={s(c.weightBold, c.fg(color))}>
          <i className="fa fa-arrow-left"></i>
          <Spacer width={8} />
          Back
        </CMText>
        <Spacer height={!vertical ? 32 : backButtonAction ? 18 : 0} />
      </Pressable>
    </FadeInOut>
  );
};

const FeedbackPrompt = () => {
  const responsive = useResponsive();
  const [submitFeedbackState] = useSidebarState(([s]) => [
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
          s.repertoireState.browsingState.moveSidebarState("right");
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
  const [currentEpd, activeSide] = useSidebarState(([s]) => [
    s.currentEpd,
    s.activeSide,
  ]);
  const [currentLine] = useSidebarState(([s]) => [lineToPgn(s.moveLog)]);
  const [positionReport, lineReport] = useRepertoireState(
    (s) => [
      s.positionReports[activeSide][currentEpd],
      s.lineReports[currentLine],
    ],
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
        <Spacer height={24} />
        <View style={s(c.fullWidth)}>
          <Animated.View
            style={s(
              c.row,
              c.alignCenter,
              c.justifyBetween,
              c.fullWidth,
              c.opacity(progressState.headerOpacityAnim),
              c.relative,
              c.zIndex(2)
            )}
          >
            <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
              Your {activeSide} repertoire is now{" "}
              <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
                {Math.round(progressState.percentComplete)}%
              </CMText>{" "}
              complete.
            </CMText>
            <Spacer width={0} grow />
            {responsive.bp >= BP.md && (
              <CoverageGoal textColor={c.grays[90]} fromTop />
            )}
          </Animated.View>
          <Spacer height={4} />
          <View style={s(c.height(24))}>
            <CoverageBar isInSidebar side={activeSide} />
          </View>
        </View>
        <Spacer height={12} />
      </View>
    </View>
  );
});
