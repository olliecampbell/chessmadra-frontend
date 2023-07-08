import { useVisualizationState, quick, getAppState } from "~/utils/app_state";
import { onMount } from "solid-js";
import { createEffect, Match, Switch } from "solid-js";
import { BP, useResponsive, useResponsiveV2 } from "~/utils/useResponsive";
import {
  VERTICAL_BREAKPOINT,
  SidebarLayout,
  NavBreadcrumbs,
} from "./SidebarLayout";
import { Dynamic } from "solid-js/web";
import { Spacer } from "./Space";

import { c, s } from "~/utils/styles";
import { SettingsButtons } from "./Settings";
import { trackEvent } from "~/utils/trackEvent";
import { clsx } from "~/utils/classes";
import { VisualizationTraining } from "./VisualizationTraining";
import { DirectorySidebar } from "./chessmadra/DirectorySidebar";
import { isNil } from "lodash-es";
import { FadeInOut } from "./FadeInOut";
import { Pressable } from "./Pressable";

export const ChessMadra = (props: { initialTool: string }) => {
  onMount(() => {
    if (props.initialTool) {
      quick((s) => {
        s.trainersState.pushView(VisualizationTraining);
      });
    }
  });
  const responsive = useResponsiveV2();
  const activeTool = () => getAppState().trainersState.getActiveTool();
  const [state] = useVisualizationState((s) => [s]);
  const view = () => getAppState().trainersState.currentView();
  const sidebarContent = (
    <>
      <Switch fallback={<DirectorySidebar />}>
        <Match when={view()}>
          <Dynamic component={view()?.component} {...view()?.props} />
        </Match>
      </Switch>
    </>
  );

  const [isPlaying] = useVisualizationState((s) => [s.isPlaying]);
  const [startedSolvingVis] = useVisualizationState((s) => [s.startedSolving]);
  const [flashPlayButton] = useVisualizationState((s) => [s.pulsePlay]);
  const belowChessboard = (
    <Switch>
      <Match when={activeTool() === "visualization" && !startedSolvingVis()}>
        <>
          <div
            style={s(c.row, c.alignStretch)}
            class={clsx(
              "w-full",
              responsive().isMobile ? "padding-sidebar" : ""
            )}
          >
            <button
              style={s(
                c.grow,
                c.height(60),
                c.py(0),
                c.fontSize(22),
                c.overflowHidden
              )}
              class={clsx(
                "row w-full cursor-pointer items-center justify-center rounded-sm bg-blue-50",
                flashPlayButton() && "animate-pulse"
              )}
              onClick={() => {
                trackEvent(`visualization.play_hidden_moves`);
                quick((s) => {
                  s.trainersState.visualizationState.visualizeHiddenMoves();
                });
              }}
            >
              <i
                style={s(c.fg(c.colors.text.primary))}
                class={`fa-sharp ${isPlaying() ? "fa-pause" : "fa-play"}`}
              />
            </button>
          </div>
          <Spacer height={12} />
        </>
      </Match>
    </Switch>
  );

  return (
    <SidebarLayout
      loading={false}
      breadcrumbs={<NavBreadcrumbs />}
      sidebarContent={sidebarContent}
      settings={<SettingsButtons />}
      chessboardInterface={state().chessboard}
      backSection={<BackSection />}
      belowChessboard={belowChessboard}
      setAnimateSidebar={(fn) => {
        quick((s) => {
          s.trainersState.animateSidebarState = fn;
        });
      }}
    />
  );
};

const BackSection = () => {
  const responsive = useResponsiveV2();
  const paddingTop = 140;
  const vertical = () => responsive().bp < VERTICAL_BREAKPOINT;
  const backButtonAction = () => {
    let backButtonAction: (() => void) | null = null;
    if (getAppState().trainersState.currentView()) {
      backButtonAction = () => {
        quick((s) => {
          s.trainersState.animateSidebarState?.("left");
          s.trainersState.popView();
        });
      };
    }

    return backButtonAction;
  };

  const puzzle = () =>
    getAppState().trainersState.visualizationState.puzzleState.puzzle;
  const isOpen = () => !isNil(backButtonAction());
  createEffect(() => {
    console.log("isOpen", isOpen());
  });
  const iconStyles = s(c.fontSize(responsive().switch(12, [BP.md, 14])));
  const activeTool = () => getAppState().trainersState.getActiveTool();

  return (
    <FadeInOut
      id="back-button"
      style={s(
        c.column,
        !vertical() ? c.height(paddingTop) : c.height(isOpen() ? 52 : 12)
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
          <p style={s(c.weightBold, c.row, c.alignCenter)}>
            <i class="fa fa-arrow-left pr-2" />
            Back
          </p>
        </Pressable>
        <Pressable
          style={s()}
          class={clsx(
            "text-tertiary &hover:text-primary text-md py-2 font-semibold transition-colors md:self-end md:pb-8",
            activeTool() === "visualization" ? "" : "hidden"
          )}
          onPress={() => {
            quick((s) => {
              window.open(
                // @ts-ignore
                `https://lichess.org/training/${puzzle().id}`,
                "_blank"
              );
            });
          }}
        >
          <p>
            View on Lichess
            <i class="fa fa-up-right-from-square pl-2" style={s(iconStyles)} />
          </p>
        </Pressable>
      </div>
    </FadeInOut>
  );
};
