import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isEmpty, capitalize, dropRight, last, isNil, sortBy } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { SIDES, Side, pgnToLine, lineToPgn } from "app/utils/repertoire";
import { plural, pluralize } from "app/utils/pluralize";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  useDebugState,
  quick,
  useUserState,
  getAppState,
  useBrowsingState,
} from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import { BP, useResponsive } from "app/utils/useResponsive";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { CoverageBar } from "./CoverageBar";
import { trackModule } from "app/utils/user_state";
import { CoverageGoal } from "./CoverageGoal";
import { useHovering } from "app/hooks/useHovering";
import { CoverageAndBar } from "./RepertoirtOverview";
import { START_EPD } from "app/utils/chess";
import { ReviewText } from "./ReviewText";
import { SettingButton, SettingsButtons } from "./Settings";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  SidebarAction,
  SidebarActions,
  SidebarFullWidthButton,
  SidebarSectionHeader,
} from "./SidebarActions";
import { mapSides } from "app/utils/repertoire_state";
import { bySide } from "app/utils/repertoire";
import {
  CoverageSettings,
  RatingSettings,
  SidebarSetting,
  ThemeSettings,
} from "./SidebarSettings";

export const RepertoireHome = (props: {}) => {
  const isMobile = useIsMobile();
  const buttonStyles = s(c.width("unset"), c.py(8));
  const responsive = useResponsive();
  const [user, missThreshold] = useUserState((s) => [
    s.user,
    s.getCurrentThreshold(),
  ]);
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
      style: "secondary",
      onPress: () => {
        trackEvent("home.practice_all_due");
        quick((s) => {
          s.repertoireState.reviewState.startReview(null, {});
        });
      },
    });
  }
  if (!user) {
    return null;
  }
  return (
    <SidebarTemplate header={null} actions={[]} bodyPadding={false}>
      <View style={s(c.column, c.fullWidth, c.gap(10))}>
        {SIDES.map((side, i) => {
          return (
            <SidebarFullWidthButton
              action={{
                style: "wide",
                text: capitalize(side),
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
                      s.repertoireState.browsingState.moveSidebarState("right");
                      s.repertoireState.startBrowsing(side, "overview");
                    } else {
                      s.repertoireState.browsingState.moveSidebarState("right");
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
              rightText: `1 in ${Math.round(1 / missThreshold)} games`,
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
              rightText: `${user.ratingRange} ${user.ratingSystem}`,
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
              rightText: null,
              style: "secondary",
            } as SidebarAction,
          ].map((action: SidebarAction, i) => {
            return <SidebarFullWidthButton key={i} action={action} />;
          })}
        </View>
        <Spacer height={46} />
      </>
    </SidebarTemplate>
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
