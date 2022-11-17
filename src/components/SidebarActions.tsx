import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { forEachRight, isEmpty, findLastIndex } from "lodash-es";
import { intersperse } from "app/utils/intersperse";
import { CMText } from "./CMText";
import { quick, useBrowsingState, useSidebarState } from "app/utils/app_state";
import { useResponsive } from "app/utils/useResponsive";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { useHovering } from "app/hooks/useHovering";
import { lineToPgn, pgnToLine, RepertoireMiss } from "app/utils/repertoire";
import { lineToPositions } from "app/utils/chess";

export interface SidebarAction {
  onPress: () => void;
  text: string;
  subtext?: string;
  style: "primary" | "focus";
}

export const SidebarActions = () => {
  const responsive = useResponsive();
  const buttons = [] as SidebarAction[];
  const [
    hasPendingLineToAdd,
    isPastCoverageGoal,
    currentSide,
    addedLineState,
    submitFeedbackState,
    deleteLineState,
    currentLine,
    stageStack,
    currentEpd,
    nearestMiss,
    lineMiss,
    positionHistory,
  ] = useSidebarState(([s, bs]) => [
    s.hasPendingLineToAdd,
    s.isPastCoverageGoal,
    s.currentSide,
    s.addedLineState,
    s.submitFeedbackState,
    s.deleteLineState,
    s.moveLog,
    s.sidebarOnboardingState.stageStack,
    s.currentEpd,
    bs.getNearestMiss(s),
    bs.getMissInThisLine(s),
    s.positionHistory,
  ]);
  const [activeSide] = useBrowsingState(([s]) => [s.activeSide]);
  let reviewCurrentLineAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.reviewState.reviewLine(currentLine, activeSide);
      });
    },
    text: "Practice this line",
    style: "primary",
  };
  let continueAddingToThisLineAction: SidebarAction = {
    onPress: () => {
      quick((s) => {
        s.repertoireState.browsingState.moveSidebarState("right");
        s.repertoireState.browsingState.sidebarState.addedLineState.visible =
          false;
      });
    },
    text: "Continue adding to this line",
    style: "primary",
  };
  let addBiggestMissAction = (miss: RepertoireMiss) => {
    if (miss && miss.epd !== currentEpd) {
      buttons.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.moveSidebarState("right");
            s.repertoireState.browsingState.dismissTransientSidebarState();
            let line = pgnToLine(miss.lines[0]);
            let missPositions = new Set(lineToPositions(line));
            console.log("Miss positions", missPositions);
            console.log("positions history", positionHistory);
            let i = findLastIndex(positionHistory, (epd) => {
              if (missPositions.has(epd)) {
                return true;
              }
              return false;
            });
            let lastMatchingEpd = positionHistory[i];
            s.repertoireState.browsingState.chessboardState.playPgn(
              lineToPgn(line),
              {
                animated: true,
                fromEpd: lastMatchingEpd,
                animateLine: line.slice(i),
              }
            );
          });
        },
        text: "Go to the next gap in your repertoire",
        style: "primary",
      });
    }
  };
  if (submitFeedbackState.visible) {
    // This is taken care of by the delete line view, maybe bad though
  } else if (deleteLineState.visible) {
    // This is taken care of by the delete line view, maybe bad though
  } else if (!isEmpty(stageStack)) {
    // Taken care of by onboarding
  } else if (addedLineState.visible) {
    addBiggestMissAction(nearestMiss);
    buttons.push(reviewCurrentLineAction);
    buttons.push(continueAddingToThisLineAction);
  } else if (!hasPendingLineToAdd) {
    addBiggestMissAction(lineMiss);
  } else if (hasPendingLineToAdd) {
    buttons.push({
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.moveSidebarState("right");
          s.repertoireState.browsingState.requestToAddCurrentLine();
        });
      },
      text: isPastCoverageGoal
        ? "Save this line to my repertoire"
        : "I'll finish this later, save my progress",
      style: isPastCoverageGoal ? "focus" : "primary",
    });
  }
  return (
    <View style={s(c.column, c.fullWidth)}>
      {intersperse(
        buttons.map((b) => <SidebarFullWidthButton action={b} />),
        () => {
          return <Spacer height={10} />;
        }
      )}
    </View>
  );
};
export const SidebarFullWidthButton = ({
  action,
}: {
  action: SidebarAction;
}) => {
  const responsive = useResponsive();
  const { hovering, hoveringProps } = useHovering();
  let backgroundColor,
    foregroundColor,
    subtextColor = null;
  if (action.style === "focus") {
    foregroundColor = c.grays[10];
    subtextColor = c.grays[20];
    if (hovering) {
      backgroundColor = c.grays[86];
    } else {
      backgroundColor = c.grays[82];
    }
  }
  if (action.style === "primary") {
    foregroundColor = c.grays[90];
    subtextColor = c.grays[70];
    if (hovering) {
      backgroundColor = c.grays[26];
    } else {
      backgroundColor = c.grays[22];
    }
  }
  return (
    <Pressable
      onPress={action.onPress}
      {...hoveringProps}
      style={s(
        c.fullWidth,
        c.bg(backgroundColor),
        c.row,
        c.justifyBetween,
        c.alignCenter,
        c.py(12),
        c.px(getSidebarPadding(responsive))
      )}
      key={action.text}
    >
      <View style={s(c.column)}>
        <CMText
          style={s(
            c.fg(foregroundColor),
            action.style === "focus" ? c.weightBold : c.weightSemiBold,
            c.fontSize(14)
          )}
        >
          {action.text}
        </CMText>
        {action.subtext && (
          <>
            <Spacer height={4} />
            <CMText
              style={s(
                c.fg(subtextColor),
                action.style === "focus" ? c.weightBold : c.weightSemiBold,
                c.fontSize(14)
              )}
            >
              {action.subtext}
            </CMText>
          </>
        )}
      </View>
      <Spacer width={16} />
      <i
        className="fa-regular fa-arrow-right-long"
        style={s(c.fg(foregroundColor))}
      />
    </Pressable>
  );
};
