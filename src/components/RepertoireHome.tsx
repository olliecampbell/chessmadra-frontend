// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { capitalize, upperFirst } from "lodash-es";
import { SIDES } from "~/utils/repertoire";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  quick,
  getAppState,
  useBrowsingState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { START_EPD } from "~/utils/chess";
import { ReviewText } from "./ReviewText";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  SidebarAction,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { bySide } from "~/utils/repertoire";
import {
  CoverageSettings,
  RatingSettings,
  ThemeSettings,
} from "./SidebarSettings";
import { BOARD_THEMES_BY_ID } from "~/utils/theming";
import { Accessor, createEffect, For, onCleanup, Show } from "solid-js";
import { unwrap } from "solid-js/store";

export const RepertoireHome = (props: {}) => {
  const userState = getAppState().userState;
  const themeId = () => userState.user?.theme;
  const theme = () => BOARD_THEMES_BY_ID[themeId()];
  const pieceSet = () => userState.user?.pieceSet;
  const [numMovesDueBySide, numLines, earliestDueDate] = useRepertoireState(
    (s) => [
      bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
      bySide((side) => s.getLineCount(side)),
      bySide((side) => s.earliestReviewDueFromEpd[side][START_EPD]),
    ]
  );
  const [progressState] = useBrowsingState(([s]) => {
    return [bySide((side) => s.repertoireProgressState[side])];
  });
  createEffect(() => {});
  const overallActions: Accessor<SidebarAction[]> = () => {
    const totalDue =
      (numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
    const actions = [];

    if (totalDue > 0) {
      actions.push({
        text: "Practice all moves due for review",
        right: (
          <ReviewText
            date={
              earliestDueDate()["white"] < earliestDueDate()["black"]
                ? earliestDueDate()["white"]
                : earliestDueDate()["black"]
            }
            numDue={totalDue}
          />
        ),
        style: "primary",
        onPress: () => {
          trackEvent("home.practice_all_due");
          quick((s) => {
            s.repertoireState.reviewState.startReview(null, {});
          });
        },
      } as SidebarAction);
    }
    return actions;
  };
  return (
    <Show when={userState.user}>
      <SidebarTemplate header={null} actions={[]} bodyPadding={false}>
        <div style={s(c.column, c.fullWidth, c.gap("10px"))}>
          <For each={SIDES}>
            {(side, i) => {
              return (
                <SidebarFullWidthButton
                  action={{
                    style: "wide",
                    text: `${capitalize(side)} repertoire`,
                    right: (
                      <CMText style={s(c.fg(c.colors.textSecondary))}>
                        {numLines()[side] > 0
                          ? `${Math.round(
                              progressState()[side].percentComplete
                            )}% complete`
                          : "Not started"}
                      </CMText>
                    ),
                    onPress: () => {
                      quick((s) => {
                        trackEvent("home.select_side", { side });
                        if (numLines()[side] > 0) {
                          s.repertoireState.browsingState.moveSidebarState(
                            "right"
                          );
                          s.repertoireState.startBrowsing(side, "overview");
                        } else {
                          s.repertoireState.browsingState.moveSidebarState(
                            "right"
                          );
                          s.repertoireState.startBrowsing(side, "overview");
                        }
                      });
                    },
                  }}
                />
              );
            }}
          </For>
        </div>
        <Spacer height={46} />
        <Show when={overallActions()}>
          <div style={s()}>
            <For each={overallActions()}>
              {(action, i) => <SidebarFullWidthButton action={action} />}
            </For>
          </div>
          <Spacer height={46} />
        </Show>
        <>
          <SidebarSectionHeader text="Repertoire settings" />
          <div style={s()}>
            {[
              {
                onPress: () => {
                  quick((s) => {
                    trackEvent("home.settings.coverage");
                    s.repertoireState.browsingState.replaceView(
                      <CoverageSettings />,
                      "right"
                    );
                  });
                },
                text: "Cover lines seen in",
                right: `1 in ${Math.round(
                  1 / userState.getCurrentThreshold()
                )} games`,
                style: "secondary",
              } as SidebarAction,
              {
                onPress: () => {
                  quick((s) => {
                    trackEvent("home.settings.rating");
                    s.repertoireState.browsingState.replaceView(
                      <RatingSettings />,
                      "right"
                    );
                  });
                },
                text: "Your rating",
                right: `${userState.user?.ratingRange} ${userState.user?.ratingSystem}`,
                style: "secondary",
              } as SidebarAction,
              {
                onPress: () => {
                  quick((s) => {
                    trackEvent("home.settings.theme");
                    s.repertoireState.browsingState.replaceView(
                      <ThemeSettings />,
                      "right"
                    );
                  });
                },
                text: "Board appearance",
                right:
                  theme() && pieceSet()
                    ? `${upperFirst(theme().name)} / ${upperFirst(pieceSet())}`
                    : theme()
                    ? `${upperFirst(theme().name)}`
                    : pieceSet()
                    ? `${pieceSet()}`
                    : "No theme",
                style: "secondary",
              } as SidebarAction,
            ].map((action: SidebarAction, i) => {
              return <SidebarFullWidthButton key={i} action={action} />;
            })}
          </div>
          <Spacer height={46} />
        </>
      </SidebarTemplate>
    </Show>
  );
};

export const getExpectedNumberOfMovesForTarget = (target: number) => {
  const [a, b] = [98.76334927, 137.34870497];

  return (1 / (target * a)) * b;
};
// THRESHOLD_OPTIONS.forEach((o) => {
//   console.log("_____THRESHOLDS______");
//   console.log(o, getExpectedNumberOfMovesForTarget(o));
// });
