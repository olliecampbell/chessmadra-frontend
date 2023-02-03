import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  forEachRight,
  isEmpty,
  findLastIndex,
  findLast,
  filter,
  map,
  last,
  isNil,
  dropRight,
} from "lodash-es";
import { intersperse } from "app/utils/intersperse";
import { CMText } from "./CMText";
import {
  quick,
  useBrowsingState,
  useRepertoireState,
  useSidebarState,
} from "app/utils/app_state";
import { useResponsive } from "app/utils/useResponsive";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { useHovering } from "app/hooks/useHovering";
import { lineToPgn, pgnToLine, RepertoireMiss } from "app/utils/repertoire";
import { lineToPositions } from "app/utils/chess";
import { getNameEcoCodeIdentifier } from "app/utils/eco_codes";

export interface SidebarAction {
  onPress: () => void;
  text: string;
  subtext?: string;
  style: "primary" | "focus";
}

export const SidebarActions = () => {
  const responsive = useResponsive();
  let buttons = [] as SidebarAction[];
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
    showPlansState,
    transposedState,
    mode,
    numDue,
  ] = useSidebarState(([s, bs, rs]) => [
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
    s.showPlansState,
    s.transposedState,
    s.mode,
    rs.numMovesDueFromEpd[bs.activeSide][s.currentEpd],
  ]);
  const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup], {
    referenceEquality: true,
  });
  const [activeSide, hasPlans] = useBrowsingState(([s, rs]) => [
    s.activeSide,
    !isEmpty(
      rs.positionReports[s.sidebarState.currentSide][s.sidebarState.currentEpd]
        ?.plans
    ),
  ]);
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
  let addBiggestMissAction = () => {
    let miss = null;
    if (addedLineState.visible) {
      miss = nearestMiss ?? lineMiss;
    } else {
      miss = lineMiss;
    }
    if (isNil(miss)) {
      return;
    }
    let text = `Go to the biggest gap in your ${activeSide} repertoire`;
    let line = dropRight(pgnToLine(miss.lines[0]), 1);
    let missPositions = lineToPositions(line);
    let missPositionsSet = new Set(missPositions);
    let currentOpeningName = last(
      filter(
        map(positionHistory, (epd) => {
          let ecoCode = ecoCodeLookup[epd];
          if (ecoCode) {
            return getNameEcoCodeIdentifier(ecoCode.fullName);
          }
        })
      )
    );
    let openingNameOfMiss = last(
      filter(
        map(missPositions, (epd) => {
          let ecoCode = ecoCodeLookup[epd];
          if (ecoCode) {
            return getNameEcoCodeIdentifier(ecoCode.fullName);
          }
        })
      )
    );

    let i = findLastIndex(positionHistory, (epd) => {
      if (missPositionsSet.has(epd)) {
        return true;
      }
      return false;
    });
    if (addedLineState.visible && currentOpeningName === openingNameOfMiss) {
      text = `Keep filling in lines in the ${currentOpeningName}`;
    } else if (
      positionHistory.length === 1 ||
      (activeSide === "white" && positionHistory.length === 2) ||
      addedLineState.visible
    ) {
      text = `Go to the biggest gap in your ${activeSide} repertoire`;
    } else if (miss === lineMiss) {
      text = `Skip ahead to the next gap in this line`;
    }

    const isAtBiggestMiss = currentEpd === last(missPositions);
    if (miss && !isAtBiggestMiss) {
      buttons.push({
        onPress: () => {
          quick((s) => {
            s.repertoireState.browsingState.moveSidebarState("right");
            s.repertoireState.browsingState.dismissTransientSidebarState();
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
        text: text,
        style: "primary",
      });
    }
  };
  let showTogglePlansButton = true;
  if (submitFeedbackState.visible) {
    showTogglePlansButton = false;
    // This is taken care of by the delete line view, maybe bad though
  } else if (transposedState.visible) {
    showTogglePlansButton = false;
  } else if (showPlansState.visible) {
    showTogglePlansButton = false;
    // This is taken care of by the delete line view, maybe bad though
  } else if (deleteLineState.visible) {
    showTogglePlansButton = false;
    // This is taken care of by the delete line view, maybe bad though
  } else if (!isEmpty(stageStack)) {
    showTogglePlansButton = false;
    // Taken care of by onboarding
  } else if (addedLineState.visible) {
    addBiggestMissAction();
    buttons.push(reviewCurrentLineAction);
    buttons.push(continueAddingToThisLineAction);
  } else if (!hasPendingLineToAdd) {
    addBiggestMissAction();
  } else if (hasPendingLineToAdd) {
    buttons.push({
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.requestToAddCurrentLine();
        });
      },
      text: isPastCoverageGoal
        ? "Save this line to my repertoire"
        : "I'll finish this later, save my progress",
      style: "primary",
    });
  }
  if (showTogglePlansButton && hasPlans) {
    buttons.push({
      onPress: () => {
        quick((s) => {
          let bs = s.repertoireState.browsingState;
          bs.moveSidebarState("right");
          bs.sidebarState.showPlansState.visible = true;
          bs.sidebarState.showPlansState.coverageReached = false;
          bs.chessboardState.showPlans = true;
        });
      },
      text: "How to play from here",
      style: "primary",
    });
  }
  if (mode === "review") {
    buttons = [];
    buttons.push({
      onPress: () => {
        quick((s) => {
          s.repertoireState.reviewState.startReview(activeSide, {
            side: activeSide,
            startLine: currentLine,
            startPosition: currentEpd,
          });
        });
      },
      text: `Review ${numDue} due moves`,
      style: "primary",
    });
  }
  return (
    <View style={s(c.column, c.fullWidth)}>
      {intersperse(
        buttons.map((b, i) => <SidebarFullWidthButton key={i} action={b} />),
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

const TogglePlansButton = () => {
  let [showPlans] = useBrowsingState(([s, rs]) => [
    s.chessboardState.showPlans,
  ]);
  const responsive = useResponsive();
  return (
    <Pressable
      style={s(
        c.row,
        c.fullWidth,
        c.alignCenter,
        c.bg(c.grays[10]),
        c.py(8),
        c.px(getSidebarPadding(responsive))
      )}
      onPress={() => {
        quick((s) => {
          let cs = s.repertoireState.browsingState.chessboardState;
          cs.showPlans = !cs.showPlans;
        });
      }}
    >
      <View style={s(c.row, c.alignCenter)}>
        <CMText style={s(c.fg(c.colors.textSecondary), c.weightSemiBold)}>
          Show some common plans?
        </CMText>
        <Spacer width={8} />
        <CMText
          style={s(
            c.bg(c.grays[80]),
            c.fontSize(9),
            c.px(5),
            c.py(3),
            c.round,
            c.caps,
            c.weightHeavy,
            c.fg(c.colors.textInverse)
          )}
        >
          Beta
        </CMText>
      </View>
      <Spacer width={12} grow />
      <i
        className={`fa-solid fa-toggle-${showPlans ? "on" : "off"}`}
        style={s(c.fg(c.grays[90]), c.fontSize(24))}
      />
    </Pressable>
  );
};
