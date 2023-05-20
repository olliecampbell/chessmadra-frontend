import { useVisualizationState, quick } from "~/utils/app_state";
import { For, onMount } from "solid-js";
import { createEffect, createSignal, Match, Show, Switch } from "solid-js";
import { BP, useResponsive } from "~/utils/useResponsive";
import { createElementBounds } from "@solid-primitives/bounds";
import { BackSection } from "./BackSection";
import {
  VERTICAL_BREAKPOINT,
  SidebarLayout,
  NavBreadcrumbs,
  AnalyzeOnLichessButton,
} from "./SidebarLayout";
import { Dynamic } from "solid-js/web";
import { Spacer } from "./Space";
import {
  SidebarAction,
  SidebarActions,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { c, s } from "~/utils/styles";
import { SettingsButtons } from "./Settings";
import { SidebarTemplate } from "./SidebarTemplate";
import { trackEvent } from "~/utils/trackEvent";
import { clsx } from "~/utils/classes";

const eventsIdentifier = "visualization";

export const VisualizationTraining = () => {
  onMount(() => {
    quick((s) => {
      s.trainersState.activeTool = "visualization";
    });
  });
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  const [view] = useVisualizationState((s) => [s.viewStack.at(-1)]);
  const [state] = useVisualizationState((s) => [s]);
  onMount(() => {
    quick((s) => {
      s.trainersState.activeTool = "visualization";
    });
  });

  const sidebarContent = (
    <>
      <Switch fallback={<VisualizationSidebar />}>
        <Match when={view()}>
          <Dynamic component={view()?.component} {...view()?.props} />
        </Match>
      </Switch>
    </>
  );

  const [isPlaying] = useVisualizationState((s) => [s.isPlaying]);
  const [flashPlayButton] = useVisualizationState((s) => [s.pulsePlay]);
  onMount(() => {
    quick((s) => {
      s.visualizationState.refreshPuzzle();
    });
  });
  const player = (
    <>
      <div style={s(c.row, c.alignStretch, c.fullWidth)}>
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
            trackEvent(`${eventsIdentifier}.play_hidden_moves`);
            quick((s) => {
              s.visualizationState.visualizeHiddenMoves();
            });
          }}
        >
          <i
            style={s(c.fg(c.colors.textPrimary))}
            class={`fa-sharp ${isPlaying() ? "fa-pause" : "fa-play"}`}
          ></i>
        </button>
      </div>
      <Spacer height={12} />
    </>
  );

  return (
    <SidebarLayout
      breadcrumbs={<NavBreadcrumbs />}
      sidebarContent={sidebarContent}
      settings={<SettingsButtons />}
      chessboardInterface={state().chessboard}
      backSection={<BackSection />}
      belowChessboard={player}
      setAnimateSidebar={(fn) => {
        quick((s) => {
          s.repertoireState.animateSidebarState = fn;
        });
      }}
    />
  );
};

export const VisualizationSidebar = () => {
  const [progressMessage, isDone] = useVisualizationState((s) => [
    s.puzzleState.progressMessage,
    s.isDone,
  ]);
  let actions = () => {
    let actions: SidebarAction[] = [];
    if (isDone()) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.visualizationState.refreshPuzzle();
          });
        },
        text: "Anotha' one",
        style: "primary",
      });
    }
    actions.push({
      onPress: () => {},
      text: "Analyze on Lichess",
      style: "tertiary",
    });
    return actions;
  };
  return (
    <>
      <SidebarTemplate
        header={"Visualization training"}
        actions={actions()}
        bodyPadding
      >
        <Switch>
          <Match when={isDone()}>
            <p class="text-body">Nice! Another?</p>
          </Match>
          <Match when={progressMessage()}>
            <p class="text-body">{progressMessage()?.message}</p>
          </Match>
          <Match when={true}>
            <p class="text-body">
              Press the play button to see the next few moves, then try to find
              the move.
            </p>
          </Match>
        </Switch>
      </SidebarTemplate>
      <Spacer height={44} />
      <SidebarSectionHeader text="Settings" />
      <div style={s()}>
        <For
          each={[
            {
              onPress: () => {
                quick((s) => {
                  trackEvent("home.settings.coverage");
                  s.repertoireState.browsingState.pushView(CoverageSettings);
                });
              },
              text: "Playback speed",
              right: `Fast`,
              style: "secondary",
            } as SidebarAction,
            {
              onPress: () => {
                quick((s) => {
                  trackEvent("home.settings.rating");
                  s.repertoireState.browsingState.pushView(RatingSettings);
                });
              },
              text: "Number of hidden moves",
              right: `2`,
              style: "secondary",
            } as SidebarAction,
            {
              onPress: () => {
                quick((s) => {
                  trackEvent("home.settings.theme");
                  s.repertoireState.browsingState.pushView(ThemeSettings);
                });
              },
              text: "Puzzle Difficulty",
              right: `1300-1500`,
              style: "secondary",
            } as SidebarAction,
          ]}
        >
          {(action, i) => <SidebarFullWidthButton action={action} />}
        </For>
      </div>
    </>
  );
};
