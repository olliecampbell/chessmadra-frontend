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
} from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  formatIncidence,
  RepertoireMiss,
  RepertoireMove,
  Side,
} from "app/utils/repertoire";
import { CMText } from "./CMText";
import { MoveTag, PositionReport, SuggestedMove } from "app/models";
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
  useSidebarState,
  useDebugState,
  useRepertoireState,
  useUserState,
} from "app/utils/app_state";
import React, { useRef, useState } from "react";
import { useHovering } from "app/hooks/useHovering";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { trackEvent } from "app/hooks/useTrackEvent";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import {
  getMoveRatingIcon,
  getWinPercentage,
  MoveRating,
} from "app/utils/move_inaccuracy";
import { quick } from "app/utils/app_state";
import { AnnotationEditor } from "./AnnotationEditor";
import { TableResponseScoreSource } from "app/utils/table_scoring";
import { getCoverageProgress } from "app/utils/browsing_state";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { useResponsive } from "app/utils/useResponsive";

const DELETE_WIDTH = 30;

export interface TableResponse {
  disableBadgePriority?: boolean;
  biggestMiss?: RepertoireMiss;
  needed?: boolean;
  incidenceUpperBound?: number;
  coverage?: number;
  moveRating?: MoveRating;
  repertoireMove?: RepertoireMove;
  suggestedMove?: SuggestedMove;
  incidence?: number;
  score?: number;
  scoreTable?: ScoreTable;
  side: Side;
  tags: MoveTag[];
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
  usePeerRates,
  setShouldShowOtherMoves,
  showOtherMoves,
  body,
}: {
  header: string;
  body?: string;
  activeSide: Side;
  showOtherMoves?: boolean;
  usePeerRates?: boolean;
  side: Side;
  responses: TableResponse[];
  setShouldShowOtherMoves?: (show: boolean) => void;
}) => {
  const responsive = useResponsive();
  let anyMine = some(responses, (m) => m.repertoireMove?.mine);
  let mine = filter(responses, (m) => m.repertoireMove?.mine);
  let anyNeeded = some(responses, (m) => m.needed);
  let [currentThreshold] = useUserState((s) => [s.getCurrentThreshold()]);
  let user = useAppState((s) => s.userState.user);
  let myTurn = side === activeSide;
  const isMobile = useIsMobile();
  let sections = useSections({
    myTurn,
    usePeerRates,
    isMobile,
  });
  let [expandedLength, setExpandedLength] = useState(0);
  let MIN_TRUNCATED = isMobile ? 1 : 1;
  const [editingAnnotations, setEditingAnnotations] = useState(false);
  let trimmedResponses = filter(responses, (r, i) => {
    if (i < expandedLength) {
      return true;
    }
    if (r.repertoireMove) {
      return true;
    }
    if (anyNeeded && !r.needed) {
      return false;
    }
    if (anyMine) {
      return false;
    }
    if (
      (r.incidence > currentThreshold ||
        r.incidenceUpperBound > currentThreshold) &&
      !myTurn
    ) {
      return true;
    }
    return (
      i < MIN_TRUNCATED ||
      r.repertoireMove ||
      (myTurn && r.score > 0) ||
      moveHasTag(r, MoveTag.Dangerous) ||
      (myTurn && moveHasTag(r, MoveTag.Transposes))
    );
  }) as TableResponse[];
  let numTruncated = responses.length - trimmedResponses.length;
  let truncated = numTruncated > 0;
  let widths = useRef({});
  const [moveMaxWidth, setMoveMaxWidth] = useState(40);
  const onMoveRender = (sanPlus, e) => {
    if (isNil(e)) {
      // TODO: better deletion, decrease widths
      widths.current[sanPlus] = null;
      return;
    }
    let width = e.getBoundingClientRect().width;
    widths.current[sanPlus] = width;
    if (width > moveMaxWidth) {
      setMoveMaxWidth(width);
    }
  };
  return (
    <View style={s(c.column)}>
      {header && (
        <>
          <RepertoireEditingHeader>{header}</RepertoireEditingHeader>
          <Spacer height={24} />
        </>
      )}
      {body && (
        <>
          <CMText style={s(c.px(getSidebarPadding(responsive)))}>{body}</CMText>
          <Spacer height={24} />
        </>
      )}
      <View style={s(c.height(16))}>
        {!editingAnnotations && (
          <TableHeader anyMine={anyMine} sections={sections} />
        )}
      </View>
      <Spacer height={12} />
      <View
        style={s(
          c.column,
          !editingAnnotations &&
            s(
              c.borderTop(`1px solid ${c.grays[30]}`),
              c.borderBottom(`1px solid ${c.grays[30]}`)
            )
        )}
      >
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
                moveMinWidth={moveMaxWidth}
                moveRef={(e) => {
                  onMoveRender(
                    tableResponse.suggestedMove?.sanPlus ||
                      tableResponse.repertoireMove?.sanPlus,
                    e
                  );
                }}
              />
            );
          }),
          (i) => {
            return (
              <View
                style={s(
                  c.height(editingAnnotations ? 12 : 1),
                  !editingAnnotations && c.bg(c.grays[30])
                )}
              ></View>
            );
          }
        )}
      </View>
      <Spacer height={12} />
      <View style={s(c.row, c.px(getSidebarPadding(responsive)))}>
        {truncated && (
          <>
            <Pressable
              style={s(c.pb(2))}
              onPress={() => {
                console.log({ expandedLength });
                setExpandedLength(trimmedResponses.length + 5);
                trackEvent("repertoire.moves_table.show_more");
              }}
            >
              <CMText
                style={s(c.fontSize(12), c.fg(c.grays[65]), c.weightSemiBold)}
              >
                Show more moves
              </CMText>
            </Pressable>
            <Spacer width={16} />
          </>
        )}
        {
          <>
            <Pressable
              style={s(c.pb(2))}
              onPress={() => {
                trackEvent("repertoire.moves_table.edit_annotations");
                setEditingAnnotations(!editingAnnotations);
              }}
            >
              <CMText
                style={s(c.fontSize(12), c.fg(c.grays[65]), c.weightSemiBold)}
              >
                {editingAnnotations
                  ? "Stop editing annotations"
                  : "Edit annotations"}
              </CMText>
            </Pressable>
            <Spacer width={16} />
          </>
        }
        {anyMine && (
          <>
            <Pressable
              style={s(c.pb(2))}
              onPress={() => {
                trackEvent("repertoire.moves_table.edit_annotations");
                quick((s) => {
                  s.repertoireState.browsingState.moveSidebarState("right");
                  s.repertoireState.browsingState.sidebarState.deleteLineState.visible =
                    true;
                });
              }}
            >
              <CMText
                style={s(c.fontSize(12), c.fg(c.grays[65]), c.weightSemiBold)}
              >
                {`Remove ${mine.length > 1 ? "a" : "this"} move`}
              </CMText>
            </Pressable>
            <Spacer width={12} />
          </>
        )}
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
  usePeerRates,
  isMobile,
}: {
  myTurn: boolean;
  usePeerRates?: boolean;
  isMobile: boolean;
}) => {
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

  let na = <CMText style={s(textStyles, c.fg(c.grays[50]))}>N/A</CMText>;
  let notEnoughGames = (
    <CMText style={s(c.fg(c.grays[50]))}>{isMobile ? "N/A" : "N/A"}</CMText>
  );
  if (!myTurn) {
    sections.push({
      width: 100,
      content: ({ suggestedMove, positionReport, tableResponse }) => {
        let playRate =
          suggestedMove &&
          positionReport &&
          getPlayRate(suggestedMove, positionReport, false);
        let denominator = Math.round(1 / tableResponse.incidence);
        let belowCoverageGoal = tableResponse.incidence < threshold;
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
      content: ({ suggestedMove, positionReport, tableResponse }) => {
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
        if (
          !playRate ||
          isNaN(playRate) ||
          formatPlayPercentage(playRate) === "0%"
        ) {
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
      width: isMobile ? 70 : 80,
      content: ({ suggestedMove, positionReport, side }) => {
        if (
          !suggestedMove?.results ||
          getTotalGames(suggestedMove?.results) < 5
        ) {
          return na;
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

const Response = ({
  tableResponse,
  sections,
  anyMine,
  myTurn,
  editing,
  moveMinWidth,
  moveRef,
}: {
  tableResponse: TableResponse;
  anyMine: boolean;
  sections: any[];
  myTurn: boolean;
  moveMinWidth: number;
  moveRef: any;
  editing;
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const { hovering, hoveringProps } = useHovering();
  const { suggestedMove, repertoireMove, incidence, moveRating } =
    tableResponse;
  const [currentEpd] = useSidebarState(([s]) => [s.currentEpd]);
  const positionReport = useBrowsingState(
    ([s, rs]) => rs.positionReports?.[currentEpd],
    { referenceEquality: true }
  );

  const [playSan, nextEcoCode, previewMove, uploadMoveAnnotation] =
    useBrowsingState(([s, rs]) => [
      s.chessboardState.makeMove,
      rs.ecoCodeLookup[suggestedMove?.epdAfter],
      s.chessboardState.previewMove,
      rs.uploadMoveAnnotation,
    ]);
  const [currentLine, currentSide, currentEcoCode] = useSidebarState(
    ([s, rs]) => [s.moveLog, s.currentSide, s.lastEcoCode]
  );
  const isMobile = useIsMobile();
  let moveNumber = Math.floor(currentLine.length / 2) + 1;
  let sanPlus = suggestedMove?.sanPlus ?? repertoireMove?.sanPlus;
  let mine = repertoireMove?.mine;

  const responsive = useResponsive();
  let { hoveringProps: responseHoverProps, hovering: hoveringRow } =
    useHovering(
      () => {
        previewMove(sanPlus);
      },
      () => {
        previewMove(null);
      }
    );

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
            c.mx(getSidebarPadding(responsive)),
            c.bg(c.grays[12]),
            c.row
          )}
        >
          <View
            style={s(c.width(120), c.selfStretch, c.row, c.px(12), c.py(12))}
          >
            <CMText
              style={s(
                c.fg(c.colors.textSecondary),
                c.weightSemiBold,
                c.fontSize(18)
              )}
            >
              {moveNumber}
              {currentSide === "black" ? "... " : "."}
            </CMText>
            <Spacer width={2} />
            <CMText
              key={sanPlus}
              style={s(
                c.fg(c.colors.textSecondary),
                c.fontSize(18),
                c.weightSemiBold,
                c.keyedProp("letterSpacing")("0.04rem")
              )}
            >
              {sanPlus}
            </CMText>
          </View>
          <AnnotationEditor
            annotation={suggestedMove?.annotation}
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
  let annotation = renderAnnotation(suggestedMove?.annotation);
  let tags = [];
  if (moveHasTag(tableResponse, MoveTag.BestMove)) {
    tags.push(
      <MoveTagView
        text="Clear best move"
        icon="fa-duotone fa-trophy"
        style={s(c.fg(c.yellows[60]), c.fontSize(14))}
      />
    );
  }
  if (moveHasTag(tableResponse, MoveTag.Transposes)) {
    tags.push(
      <MoveTagView
        text="Transposes to your repertoire"
        icon="fa-solid fa-merge"
        style={s(c.fg(c.grays[75]), c.fontSize(14), c.rotate(-90))}
      />
    );
  }
  if (moveHasTag(tableResponse, MoveTag.TheoryHeavy)) {
    tags.push(
      <MoveTagView
        text="Warning: heavy theory"
        icon="fa-solid fa-triangle-exclamation"
        style={s(c.fg(c.reds[60]), c.fontSize(14))}
      />
    );
  }
  if (moveHasTag(tableResponse, MoveTag.Dangerous)) {
    // tags.push(
    //   <MoveTagView
    //     text="Dangerous move"
    //     icon="fa fa-radiation"
    //     style={s(c.fg(c.reds[65]), c.fontSize(18))}
    //   />
    // );
  }
  if (moveHasTag(tableResponse, MoveTag.CommonMistake)) {
    tags.push(
      <MoveTagView
        text="Common mistake"
        icon="fa fa-person-falling"
        style={s(c.fg(c.grays[80]), c.fontSize(14))}
      />
    );
  }

  const editingMyMoves = true;

  let hasInlineAnnotationOrOpeningName =
    newOpeningName || (!isMobile && annotation);

  const tagsRow = !isEmpty(tags) && (
    <View style={s(c.grow, c.row, c.flexWrap, c.justifyStart, c.gap(4))}>
      {tags.map((tag, i) => {
        return tag;
      })}
    </View>
  );

  return (
    <View style={s(c.row, c.alignStart)} {...responseHoverProps}>
      <Pressable
        onPress={() => {
          quick((s) => {
            s.repertoireState.browsingState.moveSidebarState("right");
            playSan(sanPlus);
          });
          trackEvent("repertoire.moves_table.select_move");
        }}
        style={s(
          c.grow,
          c.flexible,
          // tableResponse.bestMove && c.border(`1px solid ${c.yellows[60]}`),
          c.br(2),

          c.px(getSidebarPadding(responsive)),
          c.py(12),
          hoveringRow && c.bg(c.grays[18]),

          // mine && c.border(`2px solid ${c.purples[60]}`),
          c.clickable,
          c.row
        )}
      >
        <View style={s(c.column, c.grow, c.constrainWidth)}>
          <View style={s(c.row, c.fullWidth, c.alignStart)}>
            <View style={s(c.row, c.alignCenter)}>
              <View style={s(c.minWidth(moveMinWidth))}>
                <View
                  style={s(c.row, c.alignCenter)}
                  ref={(e) => {
                    moveRef(e);
                  }}
                >
                  {true && (
                    <>
                      <CMText
                        style={s(
                          c.fg(c.grays[60]),
                          c.fontSize(14),
                          c.weightSemiBold,
                          c.lineHeight("1.3rem"),
                          c.keyedProp("letterSpacing")("0.04rem")
                        )}
                      >
                        {moveNumber}
                        {currentSide === "black" ? "…" : "."}
                      </CMText>
                      <Spacer width={4} />
                    </>
                  )}
                  <CMText
                    key={sanPlus}
                    style={s(
                      c.fg(c.grays[85]),
                      c.fontSize(14),
                      c.lineHeight("1.3rem"),
                      c.weightBold,
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
            </View>
            <Spacer width={12} />
            {
              <View
                style={s(
                  c.width(0),
                  c.grow,
                  c.pr(8),
                  c.column,

                  !hasInlineAnnotationOrOpeningName && c.selfCenter
                )}
              >
                <CMText
                  style={s(
                    c.fg(c.grays[80]),
                    c.fontSize(12),
                    c.lineHeight("1.3rem")
                  )}
                >
                  {newOpeningName && (
                    <>
                      <b>{newOpeningName}</b>
                      {!isMobile && annotation && (
                        <>
                          . <Spacer width={2} />
                        </>
                      )}
                    </>
                  )}
                  {!isMobile && annotation}
                </CMText>
                {tagsRow && (
                  <>
                    {hasInlineAnnotationOrOpeningName && <Spacer height={12} />}
                    {tagsRow}
                  </>
                )}
              </View>
            }
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
                        side: currentSide,
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
          <View style={s(c.column, c.maxWidth(400))}>
            {isMobile && annotation && (
              <CMText style={s(c.grow, c.pt(8), c.minWidth(0))}>
                <CMText style={s(c.fg(c.grays[70]), c.fontSize(12))}>
                  {annotation}
                </CMText>
              </CMText>
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
                  getWinPercentage(
                    positionReport?.stockfish,
                    currentSide
                  ).toFixed(1)}
              </CMText>
              <Spacer width={4} />
              <CMText style={s(c.fg(c.colors.debugColor))}>
                Win after:{" "}
                {positionReport?.stockfish &&
                  getWinPercentage(
                    suggestedMove?.stockfish,
                    currentSide
                  ).toFixed(1)}
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
  const responsive = useResponsive();
  return (
    <View
      style={s(
        c.row,
        c.fullWidth,
        c.pl(14),
        c.px(getSidebarPadding(responsive))
      )}
    >
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
                <CMText
                  style={s(
                    c.fg(c.grays[70]),
                    c.fontSize(12),
                    c.whitespace("nowrap")
                  )}
                >
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
  return isMobile ? 16 : 16;
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
  const [hasResponse, numMovesFromHere, expectedNumMovesNeeded] =
    useRepertoireState((s) => [
      s.repertoire[s.browsingState.activeSide]?.positionResponses[epdAfter]
        ?.length > 0,
      s.numMovesFromEpd[s.browsingState.activeSide][epdAfter],
      s.expectedNumMovesFromEpd[s.browsingState.activeSide][epdAfter],
    ]);

  const backgroundColor = c.grays[28];
  const completedColor = c.greens[50];
  let incidence = tableResponse?.incidenceUpperBound ?? tableResponse.incidence;
  let coverage = tableResponse?.biggestMiss?.incidence ?? incidence;
  let completed = coverage < threshold;
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
        incidence: {(tableResponse?.incidence * 100).toFixed(2)}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        Moves from here: {numMovesFromHere}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        Expected # from here: {expectedNumMovesNeeded}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        incidence UB: {(tableResponse?.incidenceUpperBound * 100).toFixed(2)}
      </CMText>
      <CMText style={s(c.fg(c.colors.debugColorDark), c.weightSemiBold)}>
        coverage: {(tableResponse?.coverage * 100).toFixed(2)}
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

function renderAnnotation(annotation: string) {
  if (annotation) {
    if (annotation.endsWith(".")) {
      return annotation;
    } else {
      return `${annotation}.`;
    }
  }
}

const MoveTagView = ({ text, icon, style }: { icon; text; style }) => {
  return (
    <CMText
      style={s(
        c.fg(c.grays[80]),
        c.fontSize(10),
        c.weightBold,
        c.row,
        c.alignCenter
      )}
    >
      <i className={icon} style={s(style)} />
      <Spacer width={8} />
      {text}
    </CMText>
  );
};

const moveHasTag = (m: TableResponse, tag: MoveTag): boolean => {
  return includes(m.tags, tag);
};
