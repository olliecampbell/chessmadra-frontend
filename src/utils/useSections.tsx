import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  some,
  isNaN,
  isEmpty,
  filter,
  isNil,
  last,
  clamp,
  includes,
  max,
  map,
  reverse,
  cloneDeep,
} from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  formatIncidence,
  RepertoireMiss,
  RepertoireMove,
  Side,
} from "app/utils/repertoire";
import { MoveTag, PositionReport, SuggestedMove } from "app/models";
import { formatStockfishEval } from "app/utils/stockfish";
import {
  formatPlayPercentage,
  getPlayRate,
  getTotalGames,
  isNegligiblePlayrate,
} from "app/utils/results_distribution";
import {
  useAppState,
  useBrowsingState,
  useSidebarState,
  useDebugState,
  useRepertoireState,
  useUserState,
} from "app/utils/app_state";
import React, { useRef, useState } from "react";
import { useHovering } from "app/hooks/useHovering";
import { trackEvent } from "app/hooks/useTrackEvent";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import {
  getMoveRatingIcon,
  getWinPercentage,
  MoveRating,
} from "app/utils/move_inaccuracy";
import { quick } from "app/utils/app_state";
import { TableResponseScoreSource } from "app/utils/table_scoring";
import { getCoverageProgress } from "app/utils/browsing_state";
import { useResponsive } from "app/utils/useResponsive";
import { TableResponse } from "app/components/RepertoireMovesTable";
import { CMText } from "app/components/CMText";
import { GameResultsBar } from "app/components/GameResultsBar";
import { pluralize } from "./pluralize";

interface Section {
  width: number;
  header: string;
  alignLeft?: boolean;
  content: (_: {
    suggestedMove: SuggestedMove;
    positionReport: PositionReport;
    tableResponse: TableResponse;
    tableMeta: TableMeta;
    earliestDueDate: string;
    numMovesDueFromHere: number;
    side: Side;
  }) => any;
}

export interface TableMeta {
  highestIncidence: number;
}
interface UseSectionProps {
  myTurn: boolean;
  usePeerRates?: boolean;
  isMobile: boolean;
}

export const useSections = ({
  myTurn,
  usePeerRates,
  isMobile,
}: UseSectionProps) => {
  let [activeSide] = useRepertoireState((s) => [s.browsingState.activeSide]);
  const debugUi = useDebugState((s) => s.debugUi);
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  let sections: Section[] = [];
  let textStyles = s(
    c.fg(c.grays[80]),
    c.weightSemiBold,
    c.fontSize(12),
    c.lineHeight("1.3rem")
  );

  const [mode] = useSidebarState(([s]) => [s.mode]);
  if (mode == "review") {
    sections = sections.concat(
      getReviewModeSections({
        myTurn,
        textStyles,
        usePeerRates,
        isMobile,
        debugUi,
        threshold,
        activeSide,
      })
    );
  } else {
    sections = sections.concat(
      getBuildModeSections({
        myTurn,
        textStyles,
        usePeerRates,
        isMobile,
        debugUi,
        threshold,
        activeSide,
      })
    );
  }
  return sections;
};
interface SectionProps extends UseSectionProps {
  debugUi: boolean;
  threshold: number;
  activeSide: Side;
  textStyles: any;
}
const getBuildModeSections = ({
  myTurn,
  usePeerRates,
  isMobile,
  debugUi,
  activeSide,
  threshold,
  textStyles,
}: SectionProps) => {
  let sections = [];
  let naStyles = s(textStyles, c.fg(c.grays[50]));
  let na = <CMText style={s(naStyles)}>N/A</CMText>;
  if (!myTurn) {
    sections.push({
      width: 100,
      alignLeft: true,
      content: ({ suggestedMove, positionReport, tableResponse }) => {
        let playRate =
          suggestedMove &&
          positionReport &&
          getPlayRate(suggestedMove, positionReport, false);
        let denominator = Math.round(
          1 / (tableResponse.suggestedMove?.incidence ?? 0.0001)
        );
        let belowCoverageGoal =
          (tableResponse.suggestedMove?.incidence ?? 0) < threshold;
        let veryRare = false;
        let hideGamesText = false;
        if (denominator >= 1000) {
          hideGamesText = true;
        }
        if (denominator >= 10000) {
          veryRare = true;
        }
        return (
          <>
            {
              <View style={s(c.column)}>
                <CMText
                  style={s(
                    textStyles,
                    belowCoverageGoal && s(c.fg(c.grays[44]))
                  )}
                >
                  {veryRare ? (
                    <>Very rare</>
                  ) : (
                    <>
                      <b>1</b> in <b>{denominator.toLocaleString()}</b>{" "}
                      {hideGamesText ? "" : "games"}
                    </>
                  )}
                </CMText>
                {debugUi && (
                  <CMText style={s(c.fg(c.colors.debugColorDark))}>
                    {(playRate * 100).toFixed(2)}
                  </CMText>
                )}
              </View>
            }
          </>
        );
      },
      header: "Expected in",
    });
  }
  if (!myTurn) {
    sections.push({
      width: 80,
      alignLeft: true,
      content: ({
        suggestedMove,
        positionReport,
        tableResponse,
        tableMeta,
      }) => {
        return <>{<CoverageProgressBar tableResponse={tableResponse} />}</>;
      },
      header: "Your coverage",
    });
  }
  if (myTurn) {
    sections.push({
      width: 34,
      content: ({
        suggestedMove,
        positionReport,
      }: {
        suggestedMove: SuggestedMove;
        positionReport: PositionReport;
      }) => {
        let playRate =
          suggestedMove &&
          positionReport &&
          getPlayRate(
            suggestedMove,
            positionReport,
            usePeerRates ? false : true
          );
        if (isNegligiblePlayrate(playRate)) {
          return na;
        }
        return (
          <>
            {
              <CMText style={s(textStyles)}>
                {formatPlayPercentage(playRate)}
              </CMText>
            }
          </>
        );
      },
      header: usePeerRates ? "Peers" : "Masters",
    });
  }
  if (myTurn) {
    sections.push({
      width: 40,
      content: ({ suggestedMove, positionReport }) => {
        let whiteWinning =
          suggestedMove?.stockfish?.eval >= 0 ||
          suggestedMove?.stockfish?.mate > 0;
        return (
          <>
            {suggestedMove?.stockfish && (
              <>
                <View
                  style={s(
                    c.row,
                    c.bg(whiteWinning ? c.grays[90] : c.grays[4]),
                    c.px(4),
                    c.minWidth(30),
                    c.height(18),
                    c.center,
                    c.br(2)
                  )}
                >
                  <CMText
                    style={s(
                      c.weightHeavy,
                      c.fontSize(10),
                      c.fg(whiteWinning ? c.grays[10] : c.grays[90])
                    )}
                  >
                    {formatStockfishEval(suggestedMove?.stockfish)}
                  </CMText>
                </View>
              </>
            )}
          </>
        );
      },
      header: "Eval",
    });
  }
  if (myTurn) {
    sections.push({
      width: isMobile ? 80 : 80,
      content: ({ suggestedMove, positionReport, side, tableResponse }) => {
        if (!suggestedMove?.results) {
          return na;
        }
        if (tableResponse.lowConfidence) {
          return (
            <CMText style={s(naStyles)}>
              {suggestedMove?.results[activeSide]} out of{" "}
              {getTotalGames(suggestedMove?.results)}
            </CMText>
          );
        }
        return (
          <>
            {suggestedMove && (
              <View style={s(c.fullWidth)}>
                <GameResultsBar
                  previousResults={positionReport?.results}
                  activeSide={activeSide}
                  gameResults={suggestedMove.results}
                />
              </View>
            )}
          </>
        );
      },
      header: isMobile ? "Peer results" : "Peer results",
    });
  }
  return sections;
};

const CoverageProgressBar = ({
  tableResponse,
}: {
  tableResponse: TableResponse;
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const threshold = useUserState((s) => s.getCurrentThreshold());
  let epdAfter =
    tableResponse.suggestedMove?.epdAfter ??
    tableResponse.repertoireMove?.epdAfter;
  const [hasResponse, numMovesFromHere, expectedNumMovesNeeded, missFromHere] =
    useRepertoireState((s) => [
      s.repertoire[s.browsingState.activeSide]?.positionResponses[epdAfter]
        ?.length > 0,
      s.numMovesFromEpd[s.browsingState.activeSide][epdAfter],
      s.expectedNumMovesFromEpd[s.browsingState.activeSide][epdAfter],
      s.repertoireGrades[s.browsingState.activeSide]?.biggestMisses[epdAfter],
    ]);
  const [movesFromHere] = useRepertoireState((s) => [
    s.numMovesFromEpd[s.browsingState.activeSide],
  ]);

  const backgroundColor = c.grays[28];
  const completedColor = c.greens[50];
  // let incidence = tableResponse?.incidenceUpperBound ?? tableResponse.incidence;
  // let coverage = tableResponse?.biggestMiss?.incidence ?? incidence;
  let completed = isNil(missFromHere);
  // if (!completed) {
  //   console.log({
  //     numMovesFromHere,
  //     expectedNumMovesNeeded,
  //     san: tableResponse.suggestedMove?.sanPlus,
  //     incidence: tableResponse.repertoireMove?.incidence,
  //   });
  // }
  let debugElements = debugUi && (
    <View style={s(c.column)}>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        incidence: {(tableResponse?.suggestedMove?.incidence * 100).toFixed(2)}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        Moves from here: {numMovesFromHere}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        Expected # from here: {expectedNumMovesNeeded}
      </CMText>
    </View>
  );
  // TODO: is this incorrect, to check whether the move is in your repertoire, and not whether a response is in your repertoire?
  // if (incidence < threshold && !hasResponse) {
  //   return (
  //     <View style={s(c.column)}>
  //       <CMText style={s(c.fontSize(12), c.fg(c.grays[60]))}>Not needed</CMText>
  //       {debugElements}
  //     </View>
  //   );
  // }
  let progress = clamp(
    getCoverageProgress(numMovesFromHere, expectedNumMovesNeeded),
    5,
    95
  );
  if (!hasResponse) {
    progress = 0;
    completed = false;
  }
  const inProgressColor = progress < 20 ? c.reds[65] : c.oranges[65];
  return (
    <View style={s(c.column, c.fullWidth)}>
      <View
        style={s(
          c.fullWidth,
          c.bg(backgroundColor),
          c.round,
          c.overflowHidden,
          c.height(4)
        )}
      >
        <View
          style={s(
            c.width(completed ? "100%" : `${progress}%`),
            c.bg(completed ? completedColor : inProgressColor),
            c.fullHeight
          )}
        ></View>
      </View>

      {debugElements}
    </View>
  );
};
const getReviewModeSections = ({
  myTurn,
  usePeerRates,
  isMobile,
  debugUi,
  activeSide,
  threshold,
  textStyles,
}: SectionProps) => {
  let sections: Section[] = [];
  let naStyles = s(textStyles, c.fg(c.grays[50]));
  let na = <CMText style={s(naStyles)}>N/A</CMText>;

  sections.push({
    width: 100,
    alignLeft: true,
    content: ({ suggestedMove, positionReport, tableResponse }) => {
      const date = new Date(tableResponse.reviewInfo.earliestDue);
      const numMovesDueFromHere = tableResponse.reviewInfo.due;
      let now = new Date();
      let diff = date.getTime() - now.getTime();
      let dueString = "";
      let seconds = diff / 1000;
      let minutes = seconds / 60;
      let hours = minutes / 60;
      let days = hours / 24;
      console.log({ date, now });
      console.log({ diff, hours, minutes });
      let color = c.grays[50];
      if (diff < 0) {
        color = c.oranges[70];
        dueString = "Due now";
      } else if (minutes < 60) {
        dueString = `In ${pluralize(Math.round(minutes), "minutes")}`;
      } else if (hours < 24) {
        dueString = `In ${pluralize(Math.round(hours), "hours")}`;
      } else {
        dueString = `In ${pluralize(Math.round(days), "day")}`;
      }
      return (
        <>
          {
            <View style={s(c.row, c.alignCenter)}>
              <i
                style={s(c.fg(color), c.fontSize(14))}
                className="fa-regular fa-clock"
              ></i>
              <Spacer width={4} />
              <CMText style={s(textStyles, c.fg(color))}>{dueString}</CMText>
            </View>
          }
        </>
      );
    },
    header: "Review status",
  });

  return sections;
};
