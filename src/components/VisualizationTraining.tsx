import {
  useVisualizationState,
  quick,
  getAppState,
} from "~/utils/app_state";
import { For, onMount } from "solid-js";
import { createEffect, Match, Switch } from "solid-js";
import { useResponsive } from "~/utils/useResponsive";


import { Spacer } from "./Space";
import {
  SidebarAction,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { s } from "~/utils/styles";
import { SidebarTemplate } from "./SidebarTemplate";
import { PlaybackSpeed } from "~/types/VisualizationState";
import { getPlaybackSpeedDescription } from "~/utils/playback_speed";
import { SidebarSelectOneOf } from "./SidebarSelectOneOf";
import { range } from "lodash-es";

const eventsIdentifier = "visualization";

export const VisualizationTraining = () => {
  const responsive = useResponsive();
  const [state] = useVisualizationState((s) => [s]);
  onMount(() => {
    quick((s) => {
      s.trainersState.visualizationState.refreshPuzzle();
    });
  });

  return <VisualizationSidebar />;
};

export const VisualizationSidebar = () => {
  const playbackSpeed =
    getAppState().trainersState.visualizationState.playbackSpeedUserSetting;
  const numberHiddenMoves =
    getAppState().trainersState.visualizationState.plyUserSetting;
  const ratingGte =
    getAppState().trainersState.visualizationState.ratingGteUserSetting;
  const ratingLte =
    getAppState().trainersState.visualizationState.ratingLteUserSetting;
  const [progressMessage, isDone] = useVisualizationState((s) => [
    s.puzzleState.progressMessage,
    s.isDone,
  ]);
  createEffect(() => {
    console.log("progress is ", progressMessage());
  });
  const actions = () => {
    const actions: SidebarAction[] = [];
    if (isDone()) {
      actions.push({
        onPress: () => {
          quick((s) => {
            s.trainersState.visualizationState.refreshPuzzle();
          });
        },
        text: "Next puzzle",
        style: "focus",
      });
    }
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
            <p class="body-text">Nice! Another?</p>
          </Match>
          <Match when={progressMessage()}>
            <p class="body-text">{progressMessage()?.message}</p>
          </Match>
          <Match when={true}>
            <p class="body-text">
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
                  s.trainersState.pushView(PlaypackSpeedSettings);
                });
              },
              text: "Playback speed",
              right: getPlaybackSpeedDescription(playbackSpeed.value),
              style: "secondary",
            } as SidebarAction,
            {
              onPress: () => {
                quick((s) => {
                  s.trainersState.pushView(NumberHiddenMovesSettings);
                });
              },
              text: "Number of hidden moves",
              right: numberHiddenMoves.value,
              style: "secondary",
            } as SidebarAction,
            {
              onPress: () => {
                quick((s) => {
                  s.trainersState.pushView(PuzzleDifficultySettings);
                });
              },
              text: "Puzzle Difficulty",
              right: `${ratingGte.value} - ${ratingLte.value}`,
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

const PlaypackSpeedSettings = (props: {}) => {
  const selected =
    getAppState().trainersState.visualizationState.playbackSpeedUserSetting;
  const onSelect = (t: PlaybackSpeed) => {
    quick((s) => {
      console.log("setting value");
      s.trainersState.visualizationState.playbackSpeedUserSetting.value = t;
    });
  };
  createEffect(() => {
    console.log("ply setting", selected.value);
  });
  return (
    <SidebarTemplate actions={[]} header={"Coverage goal"}>
      <SidebarSelectOneOf
        description={`Set the playback speed of the visualization dot`}
        choices={[
          PlaybackSpeed.Slow,
          PlaybackSpeed.Normal,
          PlaybackSpeed.Fast,
          PlaybackSpeed.Ludicrous,
        ]}
        // cellStyles={s(c.bg(c.gray[15]))}
        // horizontal={true}
        activeChoice={selected.value}
        onSelect={onSelect}
        renderChoice={(r: PlaybackSpeed, active: boolean) => {
          return (
            <div class="row items-end">
              <div>{getPlaybackSpeedDescription(r)}</div>
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};

const NumberHiddenMovesSettings = (props: {}) => {
  const selected = () =>
    getAppState().trainersState.visualizationState.plyUserSetting;
  const onSelect = (t: number) => {
    quick((s) => {
      console.log("setting to", t);
      s.trainersState.visualizationState.plyUserSetting.value = t;
    });
  };
  createEffect(() => {
    console.log("ply setting", selected().value);
  });
  return (
    <SidebarTemplate actions={[]} header={"Coverage goal"}>
      <SidebarSelectOneOf
        description={`Set the number of moves to visualize`}
        choices={range(1, 20)}
        // cellStyles={s(c.bg(c.gray[15]))}
        // horizontal={true}
        activeChoice={selected().value}
        onSelect={onSelect}
        renderChoice={(r: number, active: boolean) => {
          return (
            <div class="row items-end">
              <div>{r} moves</div>
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};

interface DifficultySetting {
  min: number;
  max: number;
  text: string;
}

const PuzzleDifficultySettings = (props: {}) => {
  const selected = () =>
    getAppState().trainersState.visualizationState.playbackSpeedUserSetting;
  const onSelect = (t: DifficultySetting) => {
    quick((s) => {
      s.trainersState.visualizationState.ratingGteUserSetting.value = t.min;
      s.trainersState.visualizationState.ratingLteUserSetting.value = t.max;
    });
  };
  return (
    <SidebarTemplate actions={[]} header={"Coverage goal"}>
      <SidebarSelectOneOf
        description={`Set the playback speed of the visualization dot`}
        choices={[
          {
            text: "Easy",
            min: 0,
            max: 1200,
          },
          {
            text: "Intermediate",
            min: 1200,
            max: 1600,
          },
          {
            text: "Hard",
            min: 1600,
            max: 2000,
          },
          {
            text: "Expert",
            min: 2000,
            max: 3000,
          },
          {
            text: "Varied",
            min: 0,
            max: 2000,
          },
        ]}
        // cellStyles={s(c.bg(c.gray[15]))}
        // horizontal={true}
        activeChoice={selected().value}
        onSelect={onSelect}
        renderChoice={(r: DifficultySetting, active: boolean) => {
          return (
            <div class="row items-end">
              <div>{r.text}</div> (
              <p>
                {r.min}-{r.max}
              </p>
              )
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};
