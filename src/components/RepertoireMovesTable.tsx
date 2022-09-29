import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  some,
  isNaN,
  takeWhile,
  debounce,
  isEmpty,
  filter,
  isNil,
  last,
  every,
  clamp,
} from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { formatIncidence, RepertoireMove, Side } from "app/utils/repertoire";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { PositionReport, SuggestedMove } from "app/models";
import { formatStockfishEval } from "app/utils/stockfish";
import { GameResultsBar } from "./GameResultsBar";
import {
  formatPlayPercentage,
  getPlayRate,
  getTotalGames,
} from "app/utils/results_distribution";
import {
  useAppState,
  useBrowsingState,
  useDebugState,
  useRepertoireState,
  useUserState,
} from "app/utils/app_state";
import React, { useCallback, useEffect, useState } from "react";
import { useHovering } from "app/hooks/useHovering";
import { TableResponseScoreSource } from "./RepertoireEditingView";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { trackEvent } from "app/hooks/useTrackEvent";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { css } from "@emotion/react";
import {
  getMoveRating,
  getMoveRatingIcon,
  getWinPercentage,
  MoveRating,
} from "app/utils/move_inaccuracy";
import { quick } from "app/utils/app_state";
import { AnnotationEditor, MAX_ANNOTATION_LENGTH } from "./AnnotationEditor";
import { getExpectedNumberOfMovesForTarget } from "./RepertoireOverview";

const DELETE_WIDTH = 30;

export interface TableResponse {
  incidenceUpperBound?: number;
  coverage?: number;
  bestMove?: boolean;
  moveRating?: MoveRating;
  repertoireMove?: RepertoireMove;
  suggestedMove?: SuggestedMove;
  incidence?: number;
  score?: number;
  scoreTable?: ScoreTable;
}

export interface ScoreTable {
  factors: ScoreFactor[];
  notes: string[];
}

export interface ScoreFactor {
  weight?: number;
  value: number;
  source: TableResponseScoreSource;
  total?: number;
}

export const RepertoireMovesTable = ({
  header,
  activeSide,
  side,
  responses,
  setShouldShowOtherMoves,
  showOtherMoves,
}: {
  header: string;
  activeSide: Side;
  showOtherMoves?: boolean;
  side: Side;
  responses: TableResponse[];
  setShouldShowOtherMoves?: (show: boolean) => void;
}) => {
  let anyMine = some(responses, (m) => m.repertoireMove?.mine);
  let [currentThreshold] = useUserState((s) => [s.getCurrentThreshold()]);
  let [currentIncidence] = useBrowsingState(([s]) => [
    s.getIncidenceOfCurrentLine() * 100,
  ]);
  let user = useAppState((s) => s.userState.user);
  let myTurn = side === activeSide;
  const isMobile = useIsMobile();
  let sections = useSections({
    myTurn,
    isMobile,
  });
  let [expanded, setExpanded] = useState(false);
  let MIN_TRUNCATED = isMobile ? 3 : 3;
  let completed = currentIncidence < currentThreshold;
  console.log({ currentIncidence, currentThreshold, completed });
  const [editingAnnotations, setEditingAnnotations] = useState(false);
  let trimmedResponses = [...responses];
  if (!expanded) {
    trimmedResponses = filter(responses, (r, i) => {
      if (
        (r.incidence > currentThreshold ||
          r.incidenceUpperBound > currentThreshold) &&
        !myTurn
      ) {
        return true;
      }
      if (r.repertoireMove) {
        return true;
      }
      return i < MIN_TRUNCATED || r.repertoireMove || r.score > 0;
    }) as TableResponse[];
  }
  let numTruncated = responses.length - trimmedResponses.length;
  let truncated = numTruncated > 0;
  return (
    <View style={s(c.column)}>
      {!isMobile && <RepertoireEditingHeader>{header}</RepertoireEditingHeader>}
      <View style={s(c.height(16))}>
        {!editingAnnotations && (
          <TableHeader anyMine={anyMine} sections={sections} />
        )}
      </View>
      <Spacer height={12} />
      {intersperse(
        trimmedResponses.map((tableResponse, i) => {
          return (
            <Response
              myTurn={myTurn}
              anyMine={anyMine}
              sections={sections}
              editing={editingAnnotations}
              key={
                tableResponse.repertoireMove?.sanPlus ||
                tableResponse.suggestedMove?.sanPlus
              }
              tableResponse={tableResponse}
            />
          );
        }),
        (i) => {
          return <Spacer height={12} key={i} />;
        }
      )}
      <Spacer height={12} />
      <View style={s(c.row)}>
        {truncated && (
          <>
            <Pressable
              style={s(c.pb(2), c.borderBottom(`1px solid ${c.grays[80]}`))}
              onPress={() => {
                setExpanded(true);
                trackEvent("repertoire.moves_table.show_more");
              }}
            >
              <CMText
                style={s(c.fontSize(12), c.fg(c.grays[35]), c.weightSemiBold)}
              >
                Show more moves <>({numTruncated})</>
              </CMText>
            </Pressable>
            <Spacer width={12} />
          </>
        )}
        {
          <>
            <Pressable
              style={s(c.pb(2), c.borderBottom(`1px solid ${c.grays[80]}`))}
              onPress={() => {
                trackEvent("repertoire.moves_table.edit_annotations");
                setEditingAnnotations(!editingAnnotations);
              }}
            >
              <CMText
                style={s(c.fontSize(12), c.fg(c.grays[35]), c.weightSemiBold)}
              >
                {editingAnnotations
                  ? "Stop editing annotations"
                  : "Add/edit annotations"}
              </CMText>
            </Pressable>
            <Spacer width={12} />
          </>
        }
      </View>
    </View>
  );
};

interface Section {
  width: number;
  header: string;
  content: (_: {
    suggestedMove: SuggestedMove;
    positionReport: PositionReport;
    tableResponse: TableResponse;
    side: Side;
  }) => any;
}

let useSections = ({
  myTurn,
  isMobile,
}: {
  myTurn: boolean;
  isMobile: boolean;
}) => {
  let [activeSide] = useRepertoireState((s) => [s.browsingState.activeSide]);
  const debugUi = useDebugState((s) => s.debugUi);
  const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
  let sections: Section[] = [];
  let textStyles = s(c.fg(c.grays[20]), c.weightSemiBold);

  let na = <CMText style={s(textStyles)}>N/A</CMText>;
  let notEnoughGames = (
    <CMText style={s(c.fg(c.grays[50]))}>
      {isMobile ? "N/A" : "Not enough games"}
    </CMText>
  );
  if (!myTurn) {
    sections.push({
      width: 60,
      content: ({ suggestedMove, positionReport }) => {
        let playRate =
          suggestedMove &&
          positionReport &&
          getPlayRate(suggestedMove, positionReport, false);
        let icon = "fa-signal-bars-weak";
        if (playRate > 0.3) {
          icon = "fa-signal-bars";
        } else if (playRate > 0.2) {
          icon = "fa-signal-bars-good";
        } else if (playRate > 0.05) {
          icon = "fa-signal-bars-fair";
        }
        return (
          <>
            {
              <View style={s(c.column)}>
                <CMText style={s(textStyles)}>
                  <i
                    className={`fa fa-duotone ${icon}`}
                    style={s(
                      c.fontSize(16),
                      c.duotone(c.grays[15], c.grays[75])
                    )}
                  />
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
      header: "Popularity",
    });
  }
  if (!myTurn) {
    sections.push({
      width: 80,
      content: ({ suggestedMove, positionReport, tableResponse }) => {
        return <>{<CoverageProgressBar tableResponse={tableResponse} />}</>;
      },
      header: "Your coverage",
    });
  }
  if (myTurn) {
    sections.push({
      width: 40,
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
          getPlayRate(suggestedMove, positionReport, true);
        if (
          !playRate ||
          isNaN(playRate) ||
          formatPlayPercentage(playRate) === "0%"
        ) {
          return <CMText style={s(c.fg(c.grays[50]))}>N/A</CMText>;
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
      header: "Masters",
    });
  }
  if (myTurn) {
    sections.push({
      width: 40,
      content: ({ suggestedMove, positionReport }) => (
        <>
          {suggestedMove?.stockfish && (
            <>
              <Spacer width={0} grow />
              <View style={s(c.row, c.alignEnd)}>
                <CMText style={s(c.weightSemiBold, c.fontSize(14), textStyles)}>
                  {formatStockfishEval(suggestedMove?.stockfish)}
                </CMText>
              </View>
            </>
          )}
        </>
      ),
      header: "Eval",
    });
  }
  if (myTurn) {
    sections.push({
      width: isMobile ? 120 : 120,
      content: ({ suggestedMove, positionReport, side }) => {
        if (
          !suggestedMove?.results ||
          getTotalGames(suggestedMove?.results) < 5
        ) {
          return notEnoughGames;
        }
        return (
          <>
            {suggestedMove && (
              <View style={s(c.width(80))}>
                <GameResultsBar
                  onLightUi={true}
                  activeSide={activeSide}
                  gameResults={suggestedMove.results}
                />
              </View>
            )}
          </>
        );
      },
      header: "Peer results",
    });
  }
  return sections;
};

const Response = ({
  tableResponse,
  sections,
  anyMine,
  myTurn,
  editing,
}: {
  tableResponse: TableResponse;
  anyMine: boolean;
  sections: any[];
  myTurn: boolean;
  editing;
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const { hovering, hoveringProps } = useHovering();
  const { hovering: hoveringCheckbox, hoveringProps: hoveringCheckboxProps } =
    useHovering();
  const { suggestedMove, repertoireMove, incidence, moveRating } =
    tableResponse;
  const [
    playSan,
    currentLine,
    positionReport,
    turn,
    // uploadMoveAnnotation,
    currentEpd,
    nextEcoCode,
    currentEcoCode,
    previewMove,
    uploadMoveAnnotation,
  ] = useBrowsingState(([s, rs]) => [
    s.chessboardState.makeMove,
    s.chessboardState.moveLog,
    s.getCurrentPositionReport(),
    s.chessboardState.position.turn(),
    s.chessboardState.getCurrentEpd(),
    rs.ecoCodeLookup[suggestedMove?.epdAfter],
    s.editingState.lastEcoCode,
    s.chessboardState.previewMove,
    rs.uploadMoveAnnotation,
  ]);
  let side: Side = turn === "b" ? "black" : "white";
  const isMobile = useIsMobile();
  let tags = [];
  if (suggestedMove) {
    let tags = [];
  }
  let moveNumber = Math.floor(currentLine.length / 2) + 1;
  let sanPlus = suggestedMove?.sanPlus ?? repertoireMove?.sanPlus;
  let mine = repertoireMove?.mine;
  let [annotation, setAnnotation] = useState(suggestedMove?.annotation);

  let { hoveringProps: responseHoverProps, hovering: hoveringRow } =
    useHovering(
      () => {
        previewMove(sanPlus);
      },
      () => {
        previewMove(null);
      }
    );
  useEffect(() => {
    if (isEmpty(annotation)) {
      setAnnotation(suggestedMove?.annotation);
    }
  }, [suggestedMove?.annotation]);

  if (editing) {
    return (
      <View style={s(c.row, c.alignCenter)}>
        <Pressable
          onPress={() => {}}
          style={s(
            c.grow,
            c.height(128),
            c.lightCardShadow,
            c.br(2),
            // c.py(8),
            // c.pl(14),
            // c.pr(8),
            c.clickable,
            c.row
          )}
        >
          <View
            style={s(
              c.width(120),
              c.selfStretch,
              c.row,
              c.px(12),
              c.py(12),
              c.bg(c.grays[95])
            )}
          >
            <CMText
              style={s(
                c.fg(c.colors.textInverse),
                c.weightSemiBold,
                c.fontSize(18)
              )}
            >
              {moveNumber}
              {side === "black" ? "... " : "."}
            </CMText>
            <Spacer width={2} />
            <CMText
              key={sanPlus}
              style={s(
                c.fg(c.colors.textInverse),
                c.fontSize(18),
                c.weightSemiBold,
                c.keyedProp("letterSpacing")("0.04rem")
              )}
            >
              {sanPlus}
            </CMText>
          </View>
          <AnnotationEditor
            annotation={annotation}
            onUpdate={(annotation) => {
              uploadMoveAnnotation({
                epd: currentEpd,
                san: sanPlus,
                text: annotation,
              });
            }}
          />
        </Pressable>
      </View>
    );
  }
  let newOpeningName = null;
  let [currentOpeningName, currentVariations] = currentEcoCode
    ? getAppropriateEcoName(currentEcoCode.fullName)
    : [];
  if (nextEcoCode) {
    let [name, variations] = getAppropriateEcoName(nextEcoCode.fullName);
    if (name != currentOpeningName) {
      newOpeningName = name;
    }
    let lastVariation = last(variations);
    if (
      name === currentOpeningName &&
      lastVariation != last(currentVariations)
    ) {
      newOpeningName = last(variations);
    }
  }
  let annotationOrOpeningName = suggestedMove?.annotation ?? newOpeningName;
  let bestMoveTag = tableResponse.bestMove && (
    <CMText
      style={s(
        c.fg(c.grays[20]),
        c.fontSize(12),
        c.weightBold,
        c.row,
        c.alignCenter
      )}
    >
      <i
        className="fa-duotone fa-trophy"
        style={s(c.fg(c.yellows[60]), c.fontSize(18))}
      />
      <Spacer width={4} />
      Clear best move
    </CMText>
  );

  return (
    <View style={s(c.row, c.alignStart)} {...responseHoverProps}>
      <Pressable
        onPress={() => {
          playSan(sanPlus);
          trackEvent("repertoire.moves_table.select_move");
        }}
        style={s(
          c.grow,
          c.flexible,
          c.lightCardShadow,
          // tableResponse.bestMove && c.border(`1px solid ${c.yellows[60]}`),
          c.br(2),
          c.pr(8),
          c.py(12),
          c.bg(hoveringRow ? c.grays[100] : c.grays[97]),

          // mine && c.border(`2px solid ${c.purples[60]}`),
          c.clickable,
          c.row
        )}
      >
        <View style={s(c.column, c.grow, c.constrainWidth)}>
          <View style={s(c.row, c.fullWidth, c.alignStart)}>
            {true && (
              <Pressable
                style={s(
                  c.px(12),
                  c.center,
                  !repertoireMove?.mine && c.noPointerEvents
                )}
                {...hoveringCheckboxProps}
                onPress={() => {
                  console.log("tapped on checkbox");
                  quick((s) => {
                    s.repertoireState.deleteMoveState.modalOpen = true;
                    s.repertoireState.deleteMoveState.response = repertoireMove;
                    trackEvent(`editor.delete_move`);
                  });
                }}
              >
                <i
                  style={s(
                    repertoireMove?.mine && hoveringCheckbox
                      ? c.duotone(c.grays[90], c.reds[55])
                      : !repertoireMove && anyMine && !hoveringRow
                      ? s(c.fg("transparent"))
                      : repertoireMove
                      ? c.duotone(c.grays[90], c.purples[55])
                      : hoveringRow
                      ? c.duotone(c.grays[90], c.purples[55])
                      : c.fg(c.grays[80]),
                    hoveringRow && !repertoireMove && c.opacity(40),
                    c.fontSize(22)
                  )}
                  className={
                    repertoireMove?.mine && hoveringCheckbox
                      ? `fa-duotone fa-square-xmark`
                      : repertoireMove || hoveringRow
                      ? `fa-duotone fa-square-check`
                      : `fa-thin fa-square`
                  }
                ></i>
              </Pressable>
            )}
            {!myTurn && <Spacer width={8} />}
            <View style={s(c.row, c.alignCenter, c.pl(4))}>
              <View style={s(c.row, c.alignCenter, c.minWidth(60))}>
                <CMText
                  key={sanPlus}
                  style={s(
                    c.fg(c.grays[10]),
                    c.fontSize(18),
                    c.weightSemiBold,
                    c.keyedProp("letterSpacing")("0.04rem")
                  )}
                >
                  {sanPlus}
                </CMText>
                {!isNil(moveRating) && (
                  <>
                    <Spacer width={4} />
                    {getMoveRatingIcon(moveRating)}
                  </>
                )}
              </View>
            </View>
            <Spacer width={12} />
            {!isMobile ? (
              <View style={s(c.width(0), c.grow, c.mt(2), c.pr(8))}>
                <CMText
                  style={s(
                    c.fg(c.grays[15]),
                    c.fontSize(14),
                    c.lineHeight("1.3rem")
                  )}
                >
                  {annotationOrOpeningName}
                </CMText>
              </View>
            ) : (
              <Spacer width={0} grow />
            )}
            <View style={s(c.row, c.alignCenter)}>
              {intersperse(
                sections.map((section, i) => {
                  return (
                    <View
                      style={s(c.width(section.width), c.center, c.row)}
                      key={i}
                    >
                      {section.content({
                        suggestedMove,
                        positionReport,
                        tableResponse,
                        side,
                      })}
                    </View>
                  );
                }),
                (i) => {
                  return (
                    <Spacer
                      width={getSpaceBetweenStats(isMobile)}
                      key={`${i}-spacer`}
                    />
                  );
                }
              )}
            </View>
          </View>
          <View style={s(c.column, c.pl(48), c.pr(12))}>
            {isMobile && annotationOrOpeningName && (
              <View style={s(c.grow, c.pt(12), c.minWidth(0))}>
                <CMText style={s(c.fg(c.grays[25]), c.fontSize(14))}>
                  {annotationOrOpeningName}
                </CMText>
              </View>
            )}
            {bestMoveTag && (
              // TODO: dumb way to line up things here
              <View style={s(c.grow, c.pt(8), c.row, c.justifyStart)}>
                {bestMoveTag}
              </View>
            )}
          </View>
          {debugUi && suggestedMove?.stockfish && (
            <View style={s(c.row)}>
              <View style={s(c.grow, c.pt(6), c.px(12), c.minWidth(0))}>
                <CMText style={s(c.fg(c.colors.debugColor), c.fontSize(14))}>
                  {incidence ? formatIncidence(incidence) : "No incidence"}
                </CMText>
              </View>
              <Spacer width={4} />
              <CMText style={s(c.fg(c.colors.debugColor))}>
                Win before:{" "}
                {positionReport?.stockfish &&
                  getWinPercentage(positionReport?.stockfish, side).toFixed(1)}
              </CMText>
              <Spacer width={4} />
              <CMText style={s(c.fg(c.colors.debugColor))}>
                Win after:{" "}
                {positionReport?.stockfish &&
                  getWinPercentage(suggestedMove?.stockfish, side).toFixed(1)}
              </CMText>
            </View>
          )}
          {debugUi && (
            <View style={s(c.row)} {...hoveringProps}>
              <CMText
                style={s(c.fg(c.colors.debugColor), c.relative, c.px(12))}
              >
                (score: {tableResponse.score?.toFixed(1)})
                {hovering && (
                  <View
                    style={s(
                      c.absolute,
                      c.bottom(20),
                      c.border(`1px solid ${c.colors.debugColor}`),
                      c.px(12),
                      c.py(12),
                      c.bg(c.grays[20])
                    )}
                  >
                    <DebugScoreView tableResponse={tableResponse} />
                  </View>
                )}
              </CMText>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const TableHeader = ({
  sections,
  anyMine,
}: {
  sections: any[];
  anyMine: boolean;
}) => {
  const isMobile = useIsMobile();
  return (
    <View style={s(c.row, c.fullWidth, c.pl(14), c.pr(8))}>
      <Spacer width={12} grow />
      <View style={s(c.row, c.alignCenter)}>
        {intersperse(
          sections.map((section, i) => {
            return (
              <View
                style={s(
                  c.width(section.width),
                  c.center,
                  c.row,
                  c.textAlign("center")
                )}
                key={i}
              >
                <CMText style={s(c.fg(c.grays[40]), c.fontSize(12))}>
                  {section.header}
                </CMText>
              </View>
            );
          }),
          (i) => {
            return (
              <Spacer
                width={getSpaceBetweenStats(isMobile)}
                key={`${i}-spacer`}
              />
            );
          }
        )}
      </View>
      {anyMine && false && <Spacer width={DELETE_WIDTH} />}
    </View>
  );
};

export const DebugScoreView = ({
  tableResponse,
}: {
  tableResponse: TableResponse;
}) => {
  return (
    <View style={s()}>
      <View style={s(c.row, c.textAlign("end"), c.weightBold)}>
        <CMText style={s(c.width(120))}>Source</CMText>
        <Spacer width={12} />
        <CMText style={s(c.width(60))}>Value</CMText>
        <Spacer width={12} />
        <CMText style={s(c.width(60))}>Weight</CMText>
        <Spacer width={12} grow />
        <CMText style={s(c.width(60))}>Total</CMText>
      </View>
      <Spacer height={12} />
      {intersperse(
        tableResponse.scoreTable?.factors.map((factor, i) => {
          return (
            <View style={s(c.row, c.fullWidth, c.textAlign("end"))} key={i}>
              <CMText style={s(c.width(120))}>{factor.source}</CMText>
              <Spacer width={12} />
              <CMText style={s(c.width(60))}>{factor.value.toFixed(2)}</CMText>
              <Spacer width={12} />
              <CMText style={s(c.width(60))}>{factor.weight.toFixed(2)}</CMText>
              <Spacer width={12} grow />
              <CMText style={s(c.width(60))}>{factor.total.toFixed(2)}</CMText>
            </View>
          );
        }),
        (i) => {
          return <Spacer height={12} key={i} />;
        }
      )}

      <Spacer height={24} />
      <View style={s(c.row)}>
        <CMText style={s(c.weightBold)}>Total</CMText>
        <Spacer width={12} grow />
        <CMText style={s()}>{tableResponse.score.toFixed(2)}</CMText>
      </View>
    </View>
  );
};

const getSpaceBetweenStats = (isMobile: boolean) => {
  return isMobile ? 12 : 24;
};

const CoverageProgressBar = ({
  tableResponse,
}: {
  tableResponse: TableResponse;
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const threshold = useUserState((s) => s.getCurrentThreshold()) / 100;

  const backgroundColor = c.grays[90];
  const completedColor = c.greens[55];
  let incidence = tableResponse?.incidenceUpperBound ?? tableResponse.incidence;
  let coverage = tableResponse?.coverage ?? incidence;
  let debugElements = debugUi && (
    <View style={s(c.column)}>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        incidence: {(tableResponse?.incidence * 100).toFixed(2)}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        incidence UB: {(tableResponse?.incidenceUpperBound * 100).toFixed(2)}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        coverage: {(tableResponse?.coverage * 100).toFixed(2)}
      </CMText>
    </View>
  );
  if (incidence && incidence < threshold) {
    return (
      <View style={s(c.column)}>
        <CMText style={s(c.fg(c.grays[60]))}>Not needed</CMText>
        {debugElements}
      </View>
    );
  }
  const completed = coverage < threshold;
  const expectedNumMovesNeeded = getExpectedNumberOfMovesForTarget(
    threshold * 100
  );
  const numMovesNeededForCurrentMissIncidence =
    getExpectedNumberOfMovesForTarget(coverage * 100);
  let progress = clamp(
    (numMovesNeededForCurrentMissIncidence / expectedNumMovesNeeded) * 100,
    12,
    90
  );
  const inProgressColor = progress < 20 ? c.reds[65] : c.yellows[65];
  return (
    <View style={s(c.column, c.fullWidth)}>
      <View
        style={s(
          c.fullWidth,
          c.bg(backgroundColor),
          c.round,
          c.overflowHidden,
          c.height(6)
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
