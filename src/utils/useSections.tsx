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
import { Show } from "solid-js";
import { destructure } from "@solid-primitives/destructure";
import { initTooltip } from "~/components/Tooltip";
import { pluralize } from "./pluralize";
import { MoveRating } from "./move_inaccuracy";
import { clsx } from "./classes";

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
      content: (props) => {
        const playRate =
          props.suggestedMove &&
          props.positionReport &&
          getPlayRate(props.suggestedMove, props.positionReport, false);
        const denominator = Math.round(
          1 / (props.tableResponse.suggestedMove?.incidence ?? 0.0001)
        );
        const belowCoverageGoal =
          (props.tableResponse.suggestedMove?.incidence ?? 0) < threshold;
        let veryRare = false;
        let hideGamesText = false;
        if (denominator >= 1000) {
          hideGamesText = true;
        }
        if (denominator >= 10000) {
          veryRare = true;
        }
        const sanPlus =
          props.tableResponse.repertoireMove?.sanPlus ??
          props.tableResponse.suggestedMove?.sanPlus;
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
                            You'll see the position after <b>{sanPlus}</b> in{" "}
                            <b>1 in {denominator.toLocaleString()}</b> games as{" "}
                            {otherSide(props.side)}
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
      content: (props) => {
        return (
          <>{<CoverageProgressBar tableResponse={props.tableResponse} />}</>
        );
      },
      header: "Your coverage",
    });
  }
  if (myTurn) {
    sections.push({
      width: 34,
      alignRight: true,
      content: (props: {
        suggestedMove: SuggestedMove;
        positionReport: PositionReport;
      }) => {
        const playRate =
          props.suggestedMove &&
          props.positionReport &&
          getPlayRate(
            props.suggestedMove,
            props.positionReport,
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
      content: (props) => {
        const whiteWinning =
          props.suggestedMove?.stockfish?.eval >= 0 ||
          props.suggestedMove?.stockfish?.mate > 0;
        const backgroundSide = whiteWinning ? "white" : "black";
        const moveRating: MoveRating = props.tableResponse.moveRating;
        const isBadMove = !isNil(moveRating);
        const formattedEval = formatStockfishEval(
          props.suggestedMove?.stockfish
        );
        return (
          <>
            <Show when={props.suggestedMove?.stockfish}>
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
                        } else if (props.suggestedMove?.stockfish?.mate) {
                          const mateMoves =
                            props.suggestedMove?.stockfish?.mate;
                          const side = mateMoves > 0 ? "white" : "black";
                          return `This position is a forced mate in ${pluralize(
                            mateMoves,
                            "move"
                          )} for ${side}`;
                        } else if (props.suggestedMove?.stockfish?.eval) {
                          const betterSide = whiteWinning ? "white" : "black";
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
                    style={s(c.weightHeavy, c.fontSize(10))}
                    class={clsx(
                      isBadMove
                        ? `text-red-black`
                        : backgroundSide === "white"
                        ? "text-gray-10"
                        : "text-gray-90"
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
      content: (props) => {
        if (!props.suggestedMove?.results) {
          return na();
        }
        if (props.tableResponse.lowConfidence) {
          return (
            <CMText style={s(naStyles)}>
              {props.suggestedMove?.results[activeSide]} out of{" "}
              {getTotalGames(props.suggestedMove?.results)}
            </CMText>
          );
        }
        return (
          <>
            <Show when={props.suggestedMove}>
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
                              getWinRate(props.suggestedMove?.results, "white")
                            )}
                          </b>{" "}
                          of games <br />•<span class="pr-2" />
                          Black wins{" "}
                          <b>
                            {formatPlayPercentage(
                              getWinRate(props.suggestedMove?.results, "black")
                            )}
                          </b>{" "}
                          of games <br />•<span class="pr-2" />
                          <b>
                            {formatPlayPercentage(
                              1 -
                                getWinRate(
                                  props.suggestedMove?.results,
                                  "white"
                                ) -
                                getWinRate(
                                  props.suggestedMove?.results,
                                  "black"
                                )
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
                  previousResults={props.positionReport?.results}
                  activeSide={activeSide}
                  gameResults={props.suggestedMove.results}
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
        />
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
    content: (props) => {
      return (
        <ReviewText
          date={props.tableResponse.reviewInfo.earliestDue}
          numDue={props.tableResponse.reviewInfo.due}
        />
      );
    },
    header: "",
  });

  return sections;
};
