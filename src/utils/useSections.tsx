// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { isNil, clamp } from "lodash-es";
import { otherSide, Side } from "~/utils/repertoire";
import { PositionReport, SuggestedMove } from "~/utils/models";
import { formatStockfishEval } from "~/utils/stockfish";
import {
  formatPlayPercentage,
  getPlayRate,
  getTotalGames,
  getWinRate,
  isNegligiblePlayrate,
} from "~/utils/results_distribution";
import {
  useSidebarState,
  useDebugState,
  useRepertoireState,
  useUserState,
} from "~/utils/app_state";
import { getCoverageProgress } from "~/utils/browsing_state";
import { TableResponse } from "~/components/RepertoireMovesTable";
import { CMText } from "~/components/CMText";
import { GameResultsBar } from "~/components/GameResultsBar";
import { ReviewText } from "~/components/ReviewText";
import { Accessor, createEffect, Show } from "solid-js";
import { destructure } from "@solid-primitives/destructure";
import { initTooltip } from "~/components/Tooltip";
import { pluralize } from "./pluralize";

interface Section {
  width: number;
  header: string;
  alignLeft?: boolean;
  alignRight?: boolean;
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
  const [debugUi] = useDebugState((s) => [s.debugUi]);
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  let sections: Section[] = [];
  const textStyles = s(
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
        debugUi: debugUi(),
        threshold: threshold(),
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
        debugUi: debugUi(),
        threshold: threshold(),
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
  const sections = [];
  const naStyles = s(textStyles, c.fg(c.grays[50]));
  const na = () => <p style={s(naStyles)}>0%</p>;
  if (!myTurn) {
    sections.push({
      width: 100,
      alignLeft: true,
      content: ({ suggestedMove, positionReport, tableResponse, side }) => {
        const playRate =
          suggestedMove &&
          positionReport &&
          getPlayRate(suggestedMove, positionReport, false);
        const denominator = Math.round(
          1 / (tableResponse.suggestedMove?.incidence ?? 0.0001)
        );
        const belowCoverageGoal =
          (tableResponse.suggestedMove?.incidence ?? 0) < threshold;
        let veryRare = false;
        let hideGamesText = false;
        if (denominator >= 1000) {
          hideGamesText = true;
        }
        if (denominator >= 10000) {
          veryRare = true;
        }
        const sanPlus =
          tableResponse.repertoireMove?.sanPlus ??
          tableResponse.suggestedMove?.sanPlus;
        return (
          <>
            {
              <div
                style={s(c.column)}
                ref={(ref) => {
                  initTooltip({
                    ref,
                    content: () => (
                      <p>
                        {veryRare ? (
                          <>
                            You should expect to see this move in less than 1 in
                            10,000 games.
                          </>
                        ) : (
                          <>
                            You'll see the position after <b>{sanPlus}</b>
                            in <b>1 in {denominator.toLocaleString()}</b> games
                            as {otherSide(side)}
                          </>
                        )}
                      </p>
                    ),
                    maxWidth: 200,
                  });
                }}
              >
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
                <Show when={debugUi}>
                  <CMText style={s(c.fg(c.colors.debugColorDark))}>
                    {(playRate * 100).toFixed(2)}
                  </CMText>
                </Show>
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
      alignRight: true,
      content: ({
        suggestedMove,
        positionReport,
      }: {
        suggestedMove: SuggestedMove;
        positionReport: PositionReport;
      }) => {
        const playRate =
          suggestedMove &&
          positionReport &&
          getPlayRate(
            suggestedMove,
            positionReport,
            usePeerRates ? false : true
          );

        return (
          <div
            ref={(ref) => {
              initTooltip({
                ref,
                content: () => (
                  <p>
                    <b>{formatPlayPercentage(playRate)}</b> of{" "}
                    {usePeerRates ? "players in your rating range" : "masters"}{" "}
                    choose this move
                  </p>
                ),
                maxWidth: 200,
              });
            }}
          >
            <Show when={!isNegligiblePlayrate(playRate)} fallback={na()}>
              <p style={s(textStyles)}>{formatPlayPercentage(playRate)}</p>
            </Show>
          </div>
        );
      },
      header: usePeerRates ? "Peers" : "Masters",
    });
  }
  if (myTurn) {
    sections.push({
      width: 40,
      content: ({ suggestedMove, positionReport }) => {
        const whiteWinning =
          suggestedMove?.stockfish?.eval >= 0 ||
          suggestedMove?.stockfish?.mate > 0;
        const formattedEval = formatStockfishEval(suggestedMove?.stockfish);
        return (
          <>
            <Show when={suggestedMove?.stockfish}>
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
                  ref={(ref) => {
                    initTooltip({
                      ref,
                      content: () => {
                        if (formattedEval == "=") {
                          return (
                            <p>
                              After this move, the computer evaluates the
                              position as <b>equal</b>
                            </p>
                          );
                        } else if (suggestedMove?.stockfish?.mate) {
                          let mateMoves = suggestedMove?.stockfish?.mate;
                          let side = mateMoves > 0 ? "white" : "black";
                          return `This position is a forced mate in ${pluralize(
                            mateMoves,
                            "move"
                          )} for ${side}`;
                        } else if (suggestedMove?.stockfish?.eval) {
                          const betterSide =
                            suggestedMove?.stockfish?.eval >= 0
                              ? "white"
                              : "black";
                          return (
                            <p>
                              The computer evaluates this move as{" "}
                              <b>better for {betterSide}</b> by the equivalent
                              of <b>{formattedEval.replace(/[-+]/, "")} </b>
                              pawns
                            </p>
                          );
                        }
                      },
                      maxWidth: 200,
                    });
                  }}
                >
                  <CMText
                    style={s(
                      c.weightHeavy,
                      c.fontSize(10),
                      c.fg(whiteWinning ? c.grays[10] : c.grays[90])
                    )}
                  >
                    {formattedEval}
                  </CMText>
                </div>
              </>
            </Show>
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
          return na();
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
            <Show when={suggestedMove}>
              <div
                style={s(c.fullWidth)}
                ref={(ref) => {
                  initTooltip({
                    ref,
                    content: () => {
                      return (
                        <p class="text-left">
                          <span class="block pb-2">
                            When this is played at your level:
                          </span>
                          •<span class="pr-2" />
                          White wins{" "}
                          <b>
                            {formatPlayPercentage(
                              getWinRate(suggestedMove?.results, "white")
                            )}
                          </b>{" "}
                          of games <br />•<span class="pr-2" />
                          Black wins{" "}
                          <b>
                            {formatPlayPercentage(
                              getWinRate(suggestedMove?.results, "black")
                            )}
                          </b>{" "}
                          of games <br />•<span class="pr-2" />
                          <b>
                            {formatPlayPercentage(
                              1 -
                                getWinRate(suggestedMove?.results, "white") -
                                getWinRate(suggestedMove?.results, "black")
                            )}
                          </b>{" "}
                          of games are drawn
                        </p>
                      );
                    },
                    maxWidth: 200,
                  });
                }}
              >
                <GameResultsBar
                  previousResults={positionReport?.results}
                  activeSide={activeSide}
                  gameResults={suggestedMove.results}
                />
              </div>
            </Show>
          </>
        );
      },
      header: isMobile ? "Peer results" : "Peer results",
    });
  }
  return sections;
};

const CoverageProgressBar = (props: { tableResponse: TableResponse }) => {
  const [debugUi] = useDebugState((s) => [s.debugUi]);
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  const epdAfter = () =>
    props.tableResponse.suggestedMove?.epdAfter ??
    props.tableResponse.repertoireMove?.epdAfter;
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [hasResponse, numMovesFromHere, expectedNumMovesNeeded, missFromHere] =
    useRepertoireState((s) => [
      s.repertoire[activeSide()]?.positionResponses[epdAfter()]?.length > 0,
      s.numMovesFromEpd[activeSide()][epdAfter()],
      s.expectedNumMovesFromEpd[activeSide()][epdAfter()],
      s.repertoireGrades[activeSide()]?.biggestMisses[epdAfter()],
    ]);

  const backgroundColor = c.grays[28];
  const completedColor = c.colors.success;
  const { completed, progress } = destructure(() => {
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
  console.log("rendered coveragebar");
  return (
    <div
      style={s(c.column, c.fullWidth)}
      class="py-1"
      ref={(ref) => {
        console.log("initting tooltip", ref);
        initTooltip({
          ref,
          content: () => {
            if (completed()) {
              return "You've reached your coverage goal for this move";
            }
            if (progress() === 0) {
              return "You haven't added any responses to this move";
            }
            return "Your coverage of this move is incomplete";
          },
          maxWidth: 160,
        });
      }}
    >
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
            c.width(completed() ? "100%" : `${progress()}%`),
            c.bg(completed() ? completedColor : inProgressColor()),
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
  const sections: Section[] = [];

  sections.push({
    width: 140,
    alignRight: true,
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
