// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
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
import { useIsMobile } from "~/utils/isMobile";
import { intersperse } from "~/utils/intersperse";
import {
  formatIncidence,
  RepertoireMiss,
  RepertoireMove,
  Side,
} from "~/utils/repertoire";
import { MoveTag, PositionReport, SuggestedMove } from "~/utils/models";
import { formatStockfishEval } from "~/utils/stockfish";
import {
  formatPlayPercentage,
  getPlayRate,
  getTotalGames,
  isNegligiblePlayrate,
} from "~/utils/results_distribution";
import {
  useAppState,
  useBrowsingState,
  useSidebarState,
  useDebugState,
  useRepertoireState,
  useUserState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { getAppropriateEcoName } from "~/utils/eco_codes";
import {
  getMoveRatingIcon,
  getWinPercentage,
  MoveRating,
} from "~/utils/move_inaccuracy";
import { quick } from "~/utils/app_state";
import { TableResponseScoreSource } from "~/utils/table_scoring";
import { getCoverageProgress } from "~/utils/browsing_state";
import { useResponsive } from "~/utils/useResponsive";
import { TableResponse } from "~/components/RepertoireMovesTable";
import { CMText } from "~/components/CMText";
import { GameResultsBar } from "~/components/GameResultsBar";
import { pluralize } from "./pluralize";
import { ReviewText } from "~/components/ReviewText";
import { View } from "~/components/View";
import { Accessor } from "solid-js";
import { destructure } from "@solid-primitives/destructure";

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
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
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
  if (mode() == "browse") {
    sections = sections.concat(
      getReviewModeSections({
        myTurn,
        textStyles,
        usePeerRates,
        isMobile,
        debugUi,
        threshold,
        activeSide: activeSide(),
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
        activeSide: activeSide(),
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
              <div style={s(c.column)}>
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
              </div>
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
                <div
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
                </div>
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
              <div style={s(c.fullWidth)}>
                <GameResultsBar
                  previousResults={positionReport?.results}
                  activeSide={activeSide}
                  gameResults={suggestedMove.results}
                />
              </div>
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
  tableResponse: Accessor<TableResponse>;
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const threshold = useUserState((s) => s.getCurrentThreshold());
  let epdAfter =
    tableResponse.suggestedMove?.epdAfter ??
    tableResponse.repertoireMove?.epdAfter;
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [hasResponse, numMovesFromHere, expectedNumMovesNeeded, missFromHere] =
    useRepertoireState((s) => [
      s.repertoire[activeSide()]?.positionResponses[epdAfter]?.length > 0,
      s.numMovesFromEpd[activeSide()][epdAfter],
      s.expectedNumMovesFromEpd[activeSide()][epdAfter],
      s.repertoireGrades[activeSide()]?.biggestMisses[epdAfter],
    ]);

  const backgroundColor = c.grays[28];
  const completedColor = c.greens[50];
  let { completed, progress } = destructure(() => {
    let completed = isNil(missFromHere());
    let progress = clamp(
      getCoverageProgress(numMovesFromHere(), expectedNumMovesNeeded()),
      5,
      95
    );
    if (!hasResponse()) {
      progress = 0;
      completed = false;
    }
    return { completed, progress };
  });

  const inProgressColor = () => (progress() < 20 ? c.reds[65] : c.oranges[65]);
  return (
    <div style={s(c.column, c.fullWidth)}>
      <div
        style={s(
          c.fullWidth,
          c.bg(backgroundColor),
          c.round,
          c.overflowHidden,
          c.height(4)
        )}
      >
        <div
          style={s(
            c.width(completed() ? "100%" : `${progress}%`),
            c.bg(completed() ? completedColor : inProgressColor),
            c.fullHeight
          )}
        ></div>
      </div>
    </div>
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
    width: 120,
    alignLeft: true,
    content: ({ suggestedMove, positionReport, tableResponse }) => {
      return (
        <ReviewText
          date={tableResponse.reviewInfo.earliestDue}
          numDue={tableResponse.reviewInfo.due}
        />
      );
    },
    header: "",
  });

  return sections;
};
