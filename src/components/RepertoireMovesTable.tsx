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
} from "app/utils/results_distribution";
import {
  useAppState,
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
} from "app/utils/move_inaccuracy";

const DELETE_WIDTH = 30;

export interface TableResponse {
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
  let user = useAppState((s) => s.userState.user);
  let myTurn = side === activeSide;
  let sections = getSections({
    myTurn,
  });
  let [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  let MAX_TRUNCATED = isMobile ? 4 : 6;
  let MIN_TRUNCATED = isMobile ? 2 : 3;
  let truncated = responses.length > MAX_TRUNCATED && !expanded;
  const [editingAnnotations, setEditingAnnotations] = useState(false);
  let trimmedResponses = [...responses];
  if (!expanded) {
    trimmedResponses = filter(responses, (r, i) => {
      if (r.incidence > currentThreshold && !myTurn) {
        return true;
      }
      if (r.repertoireMove) {
        return true;
      }
      if (i > MAX_TRUNCATED) {
        return false;
      }
      return i < MIN_TRUNCATED || r.repertoireMove || r.score > 0;
    }) as TableResponse[];
  }
  let numTruncated = responses.length - trimmedResponses.length;
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
              style={s(c.pb(2), c.borderBottom(`1px solid ${c.grays[40]}`))}
              onPress={() => {
                setExpanded(true);
                trackEvent("repertoire.moves_table.show_more");
              }}
            >
              <CMText
                style={s(c.fontSize(12), c.fg(c.grays[60]), c.weightSemiBold)}
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
              style={s(c.pb(2), c.borderBottom(`1px solid ${c.grays[40]}`))}
              onPress={() => {
                trackEvent("repertoire.moves_table.edit_annotations");
                setEditingAnnotations(!editingAnnotations);
              }}
            >
              <CMText
                style={s(c.fontSize(12), c.fg(c.grays[60]), c.weightSemiBold)}
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

let getSections = ({ myTurn }: { myTurn: boolean }) => {
  let [activeSide] = useRepertoireState((s) => [s.activeSide]);
  let sections = [];
  if (!myTurn) {
    sections.push({
      width: 40,
      content: ({ suggestedMove, positionReport }) => {
        let playRate =
          suggestedMove &&
          positionReport &&
          getPlayRate(suggestedMove, positionReport, false);
        if (
          !playRate ||
          isNaN(playRate) ||
          formatPlayPercentage(playRate) === "0%"
        ) {
          return <CMText style={s(c.fg(c.grays[50]))}>N/A</CMText>;
        }
        return (
          <>{<CMText style={s()}>{formatPlayPercentage(playRate)}</CMText>}</>
        );
      },
      header: "Peers",
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
          <>{<CMText style={s()}>{formatPlayPercentage(playRate)}</CMText>}</>
        );
      },
      header: "Masters",
    });
  }
  sections.push({
    width: 40,
    content: ({ suggestedMove, positionReport }) => (
      <>
        {suggestedMove?.stockfish && (
          <>
            <Spacer width={0} grow />
            <View style={s(c.row, c.alignEnd)}>
              <CMText
                style={s(c.weightSemiBold, c.fontSize(14), c.fg(c.grays[75]))}
              >
                {formatStockfishEval(suggestedMove?.stockfish)}
              </CMText>
            </View>
          </>
        )}
      </>
    ),
    header: "Eval",
  });
  sections.push({
    width: 120,
    content: ({ suggestedMove, positionReport, side }) => (
      <>
        {suggestedMove && (
          <View style={s(c.width(100))}>
            <GameResultsBar
              activeSide={activeSide}
              gameResults={suggestedMove.results}
            />
          </View>
        )}
      </>
    ),
    header: "Results at your level",
  });
  return sections;
};

const MAX_ANNOTATION_LENGTH = 300;

const Response = ({
  tableResponse,
  sections,
  anyMine,
  editing,
}: {
  tableResponse: TableResponse;
  anyMine: boolean;
  sections: any[];
  editing;
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const { hovering, hoveringProps } = useHovering();
  const { suggestedMove, repertoireMove, incidence } = tableResponse;
  const [
    playSan,
    currentLine,
    positionReport,
    quick,
    position,
    uploadMoveAnnotation,
    currentEpd,
    nextEcoCode,
    currentEcoCode,
    previewMove,
  ] = useRepertoireState((s) => [
    s.playSan,
    s.currentLine,
    s.getCurrentPositionReport(),
    s.quick,
    s.chessboardState.position,
    s.uploadMoveAnnotation,
    s.getCurrentEpd(),
    s.ecoCodeLookup[suggestedMove?.epdAfter],
    s.editingState.lastEcoCode,
    s.chessboardState.previewMove,
  ]);
  let side: Side = position?.turn() === "b" ? "black" : "white";
  const isMobile = useIsMobile();
  let tags = [];
  if (suggestedMove) {
    let tags = [];
  }
  let moveNumber = Math.floor(currentLine.length / 2) + 1;
  let sanPlus = suggestedMove?.sanPlus ?? repertoireMove?.sanPlus;
  let mine = repertoireMove?.mine;
  let [annotation, setAnnotation] = useState(suggestedMove?.annotation);
  let moveRating = getMoveRating(
    positionReport?.stockfish,
    suggestedMove?.stockfish,
    side
  );

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
  const [focus, setFocus] = useState(false);
  const updateAnnotation = useCallback(
    debounce(
      (annotation: string) => {
        uploadMoveAnnotation({
          epd: currentEpd,
          san: sanPlus,
          text: annotation,
        });
      },
      400,
      { leading: true }
    ),
    []
  );

  if (editing) {
    return (
      <View style={s(c.row, c.alignCenter)}>
        <Pressable
          onPress={() => {}}
          style={s(
            c.grow,
            c.height(128),
            c.br(2),
            // c.py(8),
            // c.pl(14),
            // c.pr(8),
            c.bg(c.grays[10]),
            c.clickable,
            c.row
          )}
        >
          <View
            style={s(c.width(80), c.selfStretch, c.row, c.px(12), c.py(12))}
          >
            <CMText
              style={s(c.fg(c.grays[60]), c.weightSemiBold, c.fontSize(18))}
            >
              {moveNumber}
              {side === "black" ? "... " : "."}
            </CMText>
            <Spacer width={2} />
            <CMText
              key={sanPlus}
              style={s(
                c.fg(c.grays[90]),
                c.fontSize(18),
                c.weightSemiBold,
                c.keyedProp("letterSpacing")("0.04rem")
              )}
            >
              {sanPlus}
            </CMText>
          </View>
          <View style={s(c.grow, c.relative)}>
            <textarea
              value={annotation ?? ""}
              style={s(
                {
                  fontFamily: "Roboto Flex",
                  fontVariationSettings: '"wdth" 110',
                },
                c.grow,
                c.border("none"),
                c.br(0),
                c.px(12),
                c.py(12),
                c.pb(24),
                c.keyedProp("resize")("none")
              )}
              placeholder={'ex. "Intending Bg5 after d4"'}
              onFocus={() => {
                setFocus(true);
              }}
              onBlur={() => {
                setFocus(false);
              }}
              onChange={(e) => {
                setAnnotation(e.target.value);
                updateAnnotation(e.target.value);
              }}
            />
            <View
              style={s(
                c.absolute,
                c.bottom(12),
                c.right(12),
                c.opacity(focus ? 100 : 0)
              )}
            >
              <CMText
                style={s(
                  annotation?.length > MAX_ANNOTATION_LENGTH && c.weightBold,
                  c.fg(
                    annotation?.length > MAX_ANNOTATION_LENGTH
                      ? c.reds[60]
                      : c.grays[50]
                  )
                )}
              >
                {annotation?.length ?? 0}/{MAX_ANNOTATION_LENGTH}
              </CMText>
            </View>
          </View>
        </Pressable>
      </View>
    );
  }
  let newOpeningName = null;
  let [currentOpeningName] = currentEcoCode
    ? getAppropriateEcoName(currentEcoCode.fullName)
    : [];
  if (nextEcoCode) {
    let [name] = getAppropriateEcoName(nextEcoCode.fullName);
    if (name != currentOpeningName) {
      newOpeningName = name;
    }
  }
  let annotationOrOpeningName = suggestedMove?.annotation ?? newOpeningName;

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
          c.br(2),
          c.pr(8),
          c.py(12),
          c.bg(hoveringRow ? c.grays[22] : c.colors.cardBackground),

          // mine && c.border(`2px solid ${c.purples[60]}`),
          c.cardShadow,
          c.clickable,
          c.row
        )}
      >
        <View style={s(c.column, c.grow, c.constrainWidth)}>
          <View style={s(c.row, c.fullWidth, c.alignStart)}>
            <View style={s(c.px(12), c.center)}>
              <i
                style={s(
                  !repertoireMove && anyMine && !hoveringRow
                    ? s(c.fg("transparent"))
                    : repertoireMove
                    ? c.duotone(c.grays[90], c.purples[55])
                    : hoveringRow
                    ? c.duotone(c.grays[90], c.purples[55])
                    : c.fg(c.grays[40]),
                  hoveringRow && !repertoireMove && c.opacity(40),
                  c.fontSize(22)
                )}
                className={
                  repertoireMove || hoveringRow
                    ? `fa-duotone fa-square-check`
                    : `fa-thin fa-square`
                }
              ></i>
            </View>
            <View
              style={s(
                c.fullHeight,
                c.width(1),
                c.bg(c.grays[100]),
                c.opacity(0)
              )}
            ></View>
            <View style={s(c.row, c.alignCenter, c.pl(4))}>
              <View style={s(c.row, c.alignCenter, c.minWidth(60))}>
                <CMText
                  key={sanPlus}
                  style={s(
                    c.fg(c.grays[90]),
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
                    c.fg(c.grays[85]),
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
          {isMobile && annotationOrOpeningName && (
            <View style={s(c.grow, c.pt(12), c.px(12), c.minWidth(0))}>
              <CMText style={s(c.fg(c.grays[75]), c.fontSize(14))}>
                {annotationOrOpeningName}
              </CMText>
            </View>
          )}
          {debugUi && (
            <View style={s(c.row)}>
              <View style={s(c.grow, c.pt(6), c.px(12), c.minWidth(0))}>
                <CMText style={s(c.fg(c.colors.debugColor), c.fontSize(14))}>
                  {incidence ? formatIncidence(incidence) : "No incidence"}
                </CMText>
              </View>
              <Spacer width={4} />
              <CMText style={s(c.fg(c.colors.debugColor))}>
                Win before:{" "}
                {getWinPercentage(positionReport?.stockfish, side).toFixed(1)}
              </CMText>
              <Spacer width={4} />
              <CMText style={s(c.fg(c.colors.debugColor))}>
                Win after:{" "}
                {getWinPercentage(suggestedMove?.stockfish, side).toFixed(1)}
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
      {anyMine && false && (
        <>
          <Pressable
            onPress={() => {
              quick((s) => {
                if (repertoireMove?.mine) {
                  s.deleteMoveState.modalOpen = true;
                  s.deleteMoveState.response = repertoireMove;
                }
              });
            }}
            style={s(
              c.width(DELETE_WIDTH),
              c.row,
              c.selfStretch,
              c.alignCenter
            )}
          >
            {repertoireMove?.mine && (
              <>
                <Spacer width={12} />
                <i
                  style={s(c.fontSize(16), c.fg(c.grays[60]))}
                  className="fa-sharp fa-trash"
                ></i>
              </>
            )}
          </Pressable>
        </>
      )}
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
                <CMText style={s(c.fg(c.colors.textSecondary), c.fontSize(12))}>
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
