// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isEmpty, isNil, dropRight } from "lodash-es";
import { CMText } from "./CMText";
import {
  quick,
  useBrowsingState,
  useRepertoireState,
  useSidebarState,
} from "~/utils/app_state";
import { SidebarStateContext } from "~/utils/browsing_state";
import { useResponsive } from "~/utils/useResponsive";
import { Responses } from "./RepertoireEditingView";
import { SidebarActions } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { CoverageBar } from "./CoverageBar";
import { DeleteLineView } from "./DeleteLineView";
import { SidebarOnboarding } from "./SidebarOnboarding";
import { FeedbackView } from "./FeedbackView";
import { FadeInOut } from "./FadeInOut";
import { TargetCoverageReachedView } from "./TargetCoverageReachedView";
import { TransposedView } from "./TransposedView";
import { RepertoireReview } from "./RepertoireReview";
import { RepertoireOverview } from "./RepertoirtOverview";
import { SettingsButtons } from "./Settings";
import { RepertoireHome } from "./RepertoireHome";
import { useHovering } from "~/mocks";
import { trackEvent } from "~/utils/trackEvent";
import { Animated } from "./View";
import {
  createEffect,
  createSignal,
  Match,
  Show,
  Switch,
  useContext,
} from "solid-js";
import { Pressable } from "./Pressable";
import { AnalyzeOnLichessButton, VERTICAL_BREAKPOINT } from "./SidebarLayout";
import { clsx } from "~/utils/classes";

export const BrowserSidebar = function BrowserSidebar() {
  const [previousSidebarAnim, currentSidebarAnim, direction, sidebarIter] =
    useBrowsingState(([s]) => [
      s.previousSidebarAnim,
      s.currentSidebarAnim,
      s.sidebarDirection,
      s.sidebarIter,
    ]);
  createEffect(() => {
    // to trigger
    if (sidebarIter() === 0) {
      return;
    }
    if (!previousRef() || !currentRef()) {
      return;
    }
    const dir = direction();
    const ms = 200;
    const duration = `${ms}ms`;
    previousRef().style.transform = "translateX(0px)";
    currentRef().style.transform =
      dir === "right" ? "translateX(40px)" : "translateX(-40px)";
    previousRef().style.transition = null;
    currentRef().style.transition = null;
    previousRef().style.opacity = "1";
    currentRef().style.opacity = "0";
    previousRef().offsetHeight; /* trigger reflow */
    previousRef().style.transition = `opacity ${duration}, transform ${duration}`;
    currentRef().style.transition = `opacity ${duration}, transform ${duration}`;
    previousRef().style.opacity = "0";
    previousRef().style.transform =
      dir === "left" ? "translateX(40px)" : "translateX(-40px)";
    setTimeout(() => {
      currentRef().style.opacity = "1";
      currentRef().style.transform = "translateX(0px)";
    }, ms);
  });
  // currentRef().style.opacity = "0";
  // const previousRef: Element | null = null;
  // @ts-ignore
  const [previousRef, setPreviousRef] = createSignal<Element>(null);
  // @ts-ignore
  const [currentRef, setCurrentRef] = createSignal<Element>(null);

  const responsive = useResponsive();
  const vertical = () => responsive.bp < VERTICAL_BREAKPOINT;

  return (
    <div
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
      <Show when={!vertical()}>
        <div
          style={s(
            c.absolute,
            c.top(0),
            c.right(0),
            c.zIndex(15),
            c.pr(c.getSidebarPadding(responsive)),
            c.pt(c.getSidebarPadding(responsive))
          )}
        >
          <SettingsButtons />
        </div>
      </Show>
      {!vertical() && <BackSection />}
      <div
        style={s(
          c.column,
          // c.top(200),
          c.fullWidth,
          c.displayGrid,
          c.grow,
          c.right(0)
        )}
      >
        <div
          id="prev-sidebar"
          ref={setPreviousRef}
          style={s(
            c.keyedProp("grid-area")("1/1"),
            c.displayFlex,
            c.noPointerEvents,

            c.opacity(100),
            isNil(direction()) && s(c.opacity(0))
            // TODO: solid
            // {
            //   transform:
            //     {
            //       translateX: previousSidebarAnim.interpolate({
            //         inputRange: [0, 1],
            //         outputRange: [
            //           "0px",
            //           direction === "left" ? "40px" : "-40px",
            //         ],
            //       }),
            //     },
            //   ],
            // }
          )}
        >
          <SidebarStateContext.Provider value={true}>
            <InnerSidebar />
          </SidebarStateContext.Provider>
        </div>
        <div
          ref={setCurrentRef}
          style={s(c.keyedProp("grid-area")("1/1"), c.displayFlex)}
        >
          <SidebarStateContext.Provider value={false}>
            <InnerSidebar />
          </SidebarStateContext.Provider>
        </div>
      </div>
    </div>
  );
};

export const InnerSidebar = function InnerSidebar() {
  const [sidebarState] = useSidebarState(([s]) => [s]);
  const [view] = useSidebarState(([s]) => [s.view]);
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

  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  return (
    <>
      <Show when={vertical}>
        <BackSection />
      </Show>
      <div id="sidebar-inner" style={s(c.relative, c.zIndex(100))}>
        <Switch fallback={<Responses />}>
          <Match when={view()}>{view()}</Match>
          <Match when={submitFeedbackState().visible}>
            <FeedbackView />
          </Match>
          <Match when={mode() == "home"}>
            <RepertoireHome />
          </Match>
          <Match when={mode() == "overview"}>
            <RepertoireOverview />
          </Match>
          <Match when={mode() == "review"}>
            <RepertoireReview />
          </Match>
          <Match when={!isEmpty(stageStack())}>
            <SidebarOnboarding />
          </Match>
          <Match when={deleteLineState().visible}>
            <DeleteLineView />
          </Match>
          <Match when={transposedState().visible}>
            <TransposedView />
          </Match>
          <Match when={showPlansState().visible}>
            <TargetCoverageReachedView />
          </Match>
          <Match when={addedLineState().visible}>
            <SavedLineView />
          </Match>
        </Switch>
      </div>
      <Spacer height={44} />
      <SidebarActions />
      <Spacer height={44} grow />
      <FeedbackPrompt />
    </>
  );
};

const BackSection = () => {
  const [
    addedLineState,
    deleteLineState,
    stageStack,
    submitFeedbackState,
    showPlansState,
    transposedState,
    mode,
    side,
    view,
  ] = useSidebarState(([s]) => [
    s.addedLineState,
    s.deleteLineState,
    s.sidebarOnboardingState.stageStack,
    s.submitFeedbackState,
    s.showPlansState,
    s.transposedState,
    s.mode,
    s.activeSide,
    s.view,
  ]);
  const [moveLog] = useBrowsingState(([s, rs]) => [
    s.chessboard.get((v) => v).moveLog,
  ]);
  const responsive = useResponsive();
  const paddingTop = 140;
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  const backToOverview = () => {
    console.log("back to overview");
    quick((s) => {
      s.repertoireState.startBrowsing(side(), "overview");
    });
  };
  const usePrevious = useContext(SidebarStateContext);
  createEffect(() => {
    if (usePrevious) {
      console.log(
        `This was previous, should open? ${isOpen()}, mode ${mode()} action ${backButtonAction()}`
      );
    }
  });
  const backButtonAction = () => {
    let backButtonAction: (() => void) | null = null;

    if (mode() === "build") {
      if (
        addedLineState().visible ||
        deleteLineState().visible ||
        transposedState().visible
      ) {
        backButtonAction = () => {
          quick((s) => {
            s.repertoireState.browsingState.dismissTransientSidebarState();
          });
        };
      } else if (showPlansState().visible) {
        backButtonAction = () => {
          quick((s) => {
            s.repertoireState.browsingState.dismissTransientSidebarState();
          });
        };
      } else if (showPlansState().visible) {
        backButtonAction = () => {
          quick((s) => {
            s.repertoireState.browsingState.chessboard.backOne();
            s.repertoireState.browsingState.dismissTransientSidebarState();
          });
        };
      } else if (stageStack().length > 1) {
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
      } else if (!isEmpty(moveLog())) {
        backButtonAction = () => {
          quick((s) => {
            s.repertoireState.browsingState.chessboard.backOne();
          });
        };
      } else if (isEmpty(moveLog())) {
        backButtonAction = () => {
          backToOverview();
        };
      }
    }

    if (mode() == "review") {
    }
    if (mode() == "browse") {
      if (!isEmpty(moveLog())) {
        backButtonAction = () => {
          quick((s) => {
            s.repertoireState.browsingState.chessboard.backOne();
          });
        };
      } else if (isEmpty(moveLog())) {
        backButtonAction = () => {
          backToOverview();
        };
      }
    }
    if (mode() == "overview") {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.backToOverview();
        });
      };
    }
    if (submitFeedbackState().visible) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.dismissTransientSidebarState();
        });
      };
    }
    if (view()) {
      // this is terrible
      backButtonAction = "bogus";
    }
    return backButtonAction;
  };

  const isOpen = () => !isNil(backButtonAction()) || !!view();
  createEffect(() => {
    console.log("isOpen", isOpen());
  });

  return (
    <FadeInOut
      id="back-button"
      style={s(
        c.column,
        !vertical ? c.height(paddingTop) : c.height(isOpen() ? 52 : 12)
      )}
      open={() => isOpen()}
      // className="transition-height"
    >
      <div class={"row padding-sidebar h-full items-center justify-between"}>
        <Pressable
          onPress={() => {
            quick((s) => {
              if (view()) {
                s.repertoireState.browsingState.replaceView(null, "left");
              } else if (backButtonAction()) {
                s.repertoireState.browsingState.moveSidebarState("left");
                backButtonAction()?.();
              }
            });
          }}
          style={s(c.unshrinkable, c.column, c.justifyCenter)}
          class={
            "text-md text-tertiary &hover:text-secondary place-items-center py-2 md:self-end md:pb-8"
          }
        >
          <CMText style={s(c.weightBold, c.row, c.alignCenter)}>
            <i class="fa fa-arrow-left pr-2"></i>
            Back
          </CMText>
        </Pressable>
        <Show when={vertical}>
          <AnalyzeOnLichessButton />
        </Show>
      </div>
    </FadeInOut>
  );
};

const FeedbackPrompt = () => {
  const responsive = useResponsive();
  const [submitFeedbackState] = useSidebarState(([s]) => [
    s.submitFeedbackState,
  ]);

  if (submitFeedbackState().visible) {
    return null;
  }
  return (
    <Show when={submitFeedbackState().visible}>
      <Pressable
        style={s(c.selfEnd, c.clickable, c.px(c.getSidebarPadding(responsive)))}
        onPress={() => {
          quick((s) => {
            trackEvent("give_feedback.clicked");
            s.repertoireState.browsingState.moveSidebarState("right");
            s.repertoireState.browsingState.sidebarState.submitFeedbackState.visible =
              true;
          });
        }}
      >
        <CMText style={s(c.fg(c.grays[60]), c.fontSize(12))}>Feedback?</CMText>
      </Pressable>
    </Show>
  );
};

const SavedLineView = function SavedLineView() {
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[activeSide()],
  ]);
  const responsive = useResponsive();
  return (
    <div style={s(c.column)}>
      <RepertoireEditingHeader>Line saved!</RepertoireEditingHeader>
      <div style={s(c.px(c.getSidebarPadding(responsive)))}>
        <Spacer height={24} />
        <div style={s(c.fullWidth)}>
          <Animated.View
            style={s(
              c.row,
              c.alignCenter,
              c.justifyBetween,
              c.fullWidth,
              c.opacity(100),
              c.relative,
              c.zIndex(2)
            )}
          >
            <CMText style={s(c.sidebarDescriptionStyles(responsive))}>
              Your {activeSide()} repertoire is now{" "}
              <CMText style={s(c.fg(c.grays[80]), c.weightSemiBold)}>
                {Math.round(progressState().percentComplete)}%
              </CMText>{" "}
              complete.
            </CMText>
          </Animated.View>
          <Spacer height={4} />
          <div style={s(c.height(24))}>
            <CoverageBar isInSidebar side={activeSide()} />
          </div>
        </div>
        <Spacer height={12} />
      </div>
    </div>
  );
};
