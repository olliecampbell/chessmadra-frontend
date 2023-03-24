// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import {
  isEmpty,
  capitalize,
  dropRight,
  last,
  isNil,
  sortBy,
  upperFirst,
} from "lodash-es";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import { SIDES, Side, pgnToLine, lineToPgn } from "~/utils/repertoire";
import { plural, pluralize } from "~/utils/pluralize";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  useDebugState,
  quick,
  useUserState,
  getAppState,
  useBrowsingState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { BP, useResponsive } from "~/utils/useResponsive";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { CoverageBar } from "./CoverageBar";
import { trackModule } from "~/utils/user_state";
import { CoverageGoal } from "./CoverageGoal";
import { CoverageAndBar } from "./RepertoirtOverview";
import { START_EPD } from "~/utils/chess";
import { ReviewText } from "./ReviewText";
import { SettingButton, SettingsButtons } from "./Settings";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  SidebarAction,
  SidebarActions,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { mapSides } from "~/utils/repertoire_state";
import { bySide } from "~/utils/repertoire";
import {
  CoverageSettings,
  RatingSettings,
  SidebarSetting,
  ThemeSettings,
} from "./SidebarSettings";
import { BOARD_THEMES_BY_ID } from "~/utils/theming";
import { View } from "./View";
import { createEffect, Show, splitProps } from "solid-js";

export const RepertoireHome = (props: {}) => {
  const userState = useUserState((s) => s);
  let themeId = () => userState.user?.theme;
  // let { theme: themeId, pieceSet } = splitProps(user, ["theme", "pieceSet"]);
  let theme = () => BOARD_THEMES_BY_ID[themeId()];
  let pieceSet = () => userState.user?.pieceSet;
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
  const totalDue =
    numMovesDueBySide?.white ?? 0 + numMovesDueBySide?.black ?? 0;
  const overallActions: SidebarAction[] = [];
  if (totalDue > 0) {
    overallActions.push({
      text: "Practice all moves due for review",
      right: (
        <ReviewText
          date={
            earliestDueDate["white"] < earliestDueDate["black"]
              ? earliestDueDate["white"]
              : earliestDueDate["black"]
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
    });
  }
  createEffect(() => {
    console.log("userState.user", userState.user);
  });
  return (
    <Show when={userState.user}>
      <SidebarTemplate header={null} actions={[]} bodyPadding={false}>
        <View style={s(c.column, c.fullWidth, c.gap("10px"))}>
          {SIDES.map((side, i) => {
            return (
              <SidebarFullWidthButton
                action={{
                  style: "wide",
                  text: `${capitalize(side)} repertoire`,
                  right: (
                    <CMText style={s(c.fg(c.colors.textSecondary))}>
                      {numLines[side] > 0
                        ? `${Math.round(
                            progressState[side].percentComplete
                          )}% complete`
                        : "Not started"}
                    </CMText>
                  ),
                  onPress: () => {
                    quick((s) => {
                      trackEvent("home.select_side", { side });
                      if (numLines[side] > 0) {
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
          })}
        </View>
        <Spacer height={46} />
        {!isEmpty(overallActions) && (
          <>
            {/*
          <SidebarSectionHeader
            text="It's time to review the moves you've added"
            right={
              <ReviewText
                date={
                  earliestDueDate["white"] < earliestDueDate["black"]
                    ? earliestDueDate["white"]
                    : earliestDueDate["black"]
                }
                numDue={totalDue}
              />
            }
          />
        */}
            <View style={s(c.gridColumn({ gap: 12 }))}>
              {overallActions.map((action, i) => {
                return <SidebarFullWidthButton key={i} action={action} />;
              })}
            </View>
            <Spacer height={46} />
          </>
        )}
        <>
          <SidebarSectionHeader text="Repertoire settings" />
          <View style={s()}>
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
                    : theme
                    ? `${upperFirst(theme.name())}`
                    : pieceSet
                    ? `${pieceSet()}`
                    : "No theme",
                style: "secondary",
              } as SidebarAction,
            ].map((action: SidebarAction, i) => {
              return <SidebarFullWidthButton key={i} action={action} />;
            })}
          </View>
          <Spacer height={46} />
        </>
      </SidebarTemplate>
    </Show>
  );
};

export const getExpectedNumberOfMovesForTarget = (target: number) => {
  let [a, b] = [98.76334927, 137.34870497];

  return (1 / (target * a)) * b;
};
// THRESHOLD_OPTIONS.forEach((o) => {
//   console.log("_____THRESHOLDS______");
//   console.log(o, getExpectedNumberOfMovesForTarget(o));
// });
