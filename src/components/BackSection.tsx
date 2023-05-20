// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { isEmpty, isNil, dropRight, filter } from "lodash-es";
import { CMText } from "./CMText";
import {
  getAppState,
  quick,
  useBrowsingState,
  useRepertoireState,
  useSidebarState,
} from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { FadeInOut } from "./FadeInOut";
import { createEffect, Show } from "solid-js";
import { Pressable } from "./Pressable";
import { OnboardingIntro } from "./SidebarOnboarding";
import { AnalyzeOnLichessButton, VERTICAL_BREAKPOINT } from "./SidebarLayout";
export const BackSection = () => {
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
  const [view] = useBrowsingState(([s]) => [s.currentView()]);
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  const repertoireState = getAppState().repertoireState;
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
    if (repertoireState.onboarding.isOnboarding) {
    }
    if (submitFeedbackState().visible) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.dismissTransientSidebarState();
        });
      };
    }
    if (view()) {
      backButtonAction = () => {
        quick((s) => {
          s.repertoireState.browsingState.popView();
        });
      };
    }
    if (view()?.component === OnboardingIntro) {
      backButtonAction = null;
    }
    return backButtonAction;
  };

  const isOpen = () => !isNil(backButtonAction());
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
              if (backButtonAction()) {
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
