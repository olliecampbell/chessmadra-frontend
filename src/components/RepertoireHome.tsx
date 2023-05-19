// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { capitalize, upperFirst, find, isEmpty } from "lodash-es";
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
import {
  BOARD_THEMES_BY_ID,
  combinedThemes,
  COMBINED_THEMES_BY_ID,
} from "~/utils/theming";
import { Accessor, createEffect, For, onCleanup, Show } from "solid-js";
import { unwrap } from "solid-js/store";
import { FeedbackView } from "./FeedbackView";

export const RepertoireHome = () => {
  const userState = getAppState().userState;
  const themeId = () => userState.user?.theme;
  const theme = () =>
    find(combinedThemes, (theme) => theme.boardTheme == themeId()) ||
    COMBINED_THEMES_BY_ID["default"];
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
  const overallActions: Accessor<SidebarAction[]> = () => {
    const totalDue =
      (numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
    const actions = [];

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
      disabled: totalDue == 0,
      onPress: () => {
        trackEvent("home.practice_all_due");
        quick((s) => {
          s.repertoireState.reviewState.startReview(null, {});
        });
      },
    } as SidebarAction);
    return actions;
  };
  return (
    <Show when={userState.user}>
      <SidebarTemplate header={null} actions={[]} bodyPadding={false}>
        <div style={s(c.column, c.fullWidth, c.gap("10px"))}>
          <For each={SIDES}>
            {(side) => {
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
        <Show when={!isEmpty(overallActions())}>
          <div style={s()}>
            <For each={overallActions()}>
              {(action) => <SidebarFullWidthButton action={action} />}
            </For>
          </div>
          <Spacer height={46} />
        </Show>
        <>
          <SidebarSectionHeader text="Repertoire settings" />
          <div style={s()}>
            <For
              each={[
                {
                  onPress: () => {
                    quick((s) => {
                      trackEvent("home.settings.coverage");
                      s.repertoireState.browsingState.pushView(
                        CoverageSettings
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
                      s.repertoireState.browsingState.pushView(RatingSettings);
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
                      s.repertoireState.browsingState.pushView(ThemeSettings);
                    });
                  },
                  text: "Board appearance",
                  right: `${upperFirst(theme().name)}`,
                  style: "secondary",
                } as SidebarAction,
              ]}
            >
              {(action, i) => <SidebarFullWidthButton action={action} />}
            </For>
          </div>
          <Spacer height={46} />
        </>
        <>
          <SidebarSectionHeader text="Contact us" />
          <div style={s()}>
            <For
              each={[
                {
                  onPress: () => {
                    quick((s) => {
                      trackEvent("home.contact.feedback");
                      s.repertoireState.browsingState.pushView(FeedbackView);
                    });
                  },
                  text: "Share your feedback",
                  style: "secondary",
                } as SidebarAction,
                {
                  onPress: () => {
                    quick((s) => {
                      trackEvent("home.contact.discord");
                      window.open("https://discord.gg/vNzfu5VetQ", "_blank");
                    });
                  },
                  text: "Join our Discord",
                  style: "secondary",
                } as SidebarAction,
              ]}
            >
              {(action) => <SidebarFullWidthButton action={action} />}
            </For>
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
