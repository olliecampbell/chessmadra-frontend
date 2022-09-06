import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import shallow from "zustand/shallow";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
  take,
  sortBy,
  reverse,
  some,
  forEach,
  find,
  max,
  maxBy,
  filter,
  times,
  findIndex,
  every,
  isNaN,
  takeWhile,
} from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { EditingTab, RepertoireState } from "app/utils/repertoire_state";
import { RepertoireMove, Side, Repertoire } from "app/utils/repertoire";
import { BeatLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { PositionReport, StockfishReport, SuggestedMove } from "app/models";
import { AddedLineModal } from "./AddedLineModal";
import { formatStockfishEval } from "app/utils/stockfish";
import { GameResultsBar } from "./GameResultsBar";
import {
  getTotalGames,
  formatPlayPercentage,
  getWinRate,
  getPlayRate,
} from "app/utils/results_distribution";
import useKeypress from "react-use-keypress";
import { SelectOneOf } from "./SelectOneOf";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { Modal } from "./Modal";
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { useDebugState, useRepertoireState } from "app/utils/app_state";
import React, { useState } from "react";
import { plural, pluralize } from "app/utils/pluralize";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { failOnAny } from "app/utils/test_settings";
import { useHovering } from "app/hooks/useHovering";
import { TableResponseScoreSource } from "./RepertoireEditingView";

const DELETE_WIDTH = 30;

export interface TableResponse {
  repertoireMove?: RepertoireMove;
  suggestedMove?: SuggestedMove;
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

let desktopHeaderStyles = s(
  c.fg(c.colors.textPrimary),
  c.fontSize(22),
  c.mb(12),
  c.weightBold
);

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
  let sections = getSections({
    myTurn: side === activeSide,
  });
  let [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  let MAX_TRUNCATED = isMobile ? 4 : 6;
  let MIN_TRUNCATED = isMobile ? 2 : 3;
  let truncated = responses.length > MAX_TRUNCATED && !expanded;
  let trimmedResponses = [...responses];
  if (!expanded) {
    trimmedResponses = takeWhile(responses, (r, i) => {
      console.log({ i });
      console.log({ r });
      if (r.repertoireMove) {
        return true;
      }
      if (i > MAX_TRUNCATED) {
        return false;
      }
      return i < MIN_TRUNCATED || r.repertoireMove || r.score > 0;
    });
    console.log({ trimmedResponses });
  }
  let numTruncated = responses.length - trimmedResponses.length;
  return (
    <View style={s(c.column)}>
      <CMText
        style={s(
          desktopHeaderStyles,
          c.mb(-2),
          isMobile &&
            s(
              c.mb(8),
              c.selfStart,
              c.fontSize(14),
              c.pb(2),
              c.borderBottom(`2px solid ${c.grays[80]}`)
            )
        )}
      >
        {header}
      </CMText>
      <TableHeader anyMine={anyMine} sections={sections} />
      <Spacer height={12} />
      {intersperse(
        trimmedResponses.map((tableResponse, i) => {
          return (
            <Response
              anyMine={anyMine}
              sections={sections}
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
              style={s(c.borderBottom(`1px solid ${c.grays[40]}`), c.pb(1))}
              onPress={() => {
                setExpanded(true);
              }}
            >
              <CMText style={s(c.fontSize(12))}>
                Show more moves <>({numTruncated})</>
              </CMText>
            </Pressable>
            <Spacer width={12} />
          </>
        )}
      </View>
    </View>
  );
};

let getSections = ({ myTurn }: { myTurn: boolean }) => {
  let [activeSide] = useRepertoireState((s) => [s.browsingState.activeSide]);
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
      content: ({ suggestedMove, positionReport }) => {
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

const SPACE_BETWEEN_STATS = 24;

const START_CELL_WIDTH = 40;

const Response = ({
  tableResponse,
  sections,
  anyMine,
}: {
  tableResponse: TableResponse;
  anyMine: boolean;
  sections: any[];
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const { hovering, hoverRef } = useHovering();
  const { suggestedMove, repertoireMove } = tableResponse;
  const [playSan, currentLine, positionReport, activeSide, quick, position] =
    useRepertoireState((s) => [
      s.playSan,
      s.currentLine,
      s.getCurrentPositionReport(),
      s.activeSide,
      s.quick,
      s.chessboardState.position,
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

  return (
    <View style={s(c.row, c.alignCenter)}>
      <Pressable
        onPress={() => {
          playSan(sanPlus);
        }}
        style={s(
          c.grow,
          c.br(2),
          c.py(8),
          c.pl(14),
          c.pr(8),
          c.bg(c.grays[10]),
          c.border(
            `${repertoireMove?.mine ? 2 : 1}px solid ${
              repertoireMove?.mine ? c.purples[65] : c.grays[7]
            }`
          ),
          c.clickable,
          c.row
        )}
      >
        <View style={s(c.column, c.grow, c.constrainWidth)}>
          <View style={s(c.row, c.fullWidth)}>
            <View style={s(c.row, c.alignCenter, c.width(START_CELL_WIDTH))}>
              <View style={s(c.row, c.alignCenter, c.minWidth(54))}>
                <CMText
                  style={s(c.fg(c.grays[60]), c.weightSemiBold, c.fontSize(16))}
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
                {debugUi && (
                  <View style={s(c.row)} ref={hoverRef}>
                    <Spacer width={4} />

                    <CMText style={s(c.fg(c.colors.debugColor), c.relative)}>
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
              {repertoireMove && !mine && (
                <>
                  <Spacer width={8} />

                  <i
                    style={s(c.fg(c.purples[60]), c.fontSize(22))}
                    className={`fas fa-check`}
                  ></i>
                </>
              )}
            </View>
            <Spacer width={12} grow style={s(c.noPointerEvents)} />
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
                    <Spacer width={SPACE_BETWEEN_STATS} key={`${i}-spacer`} />
                  );
                }
              )}
            </View>
          </View>
        </View>
      </Pressable>
      {anyMine && (
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
                  className="fa-regular fa-trash"
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
      <View style={s(c.width(START_CELL_WIDTH))}></View>
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
            return <Spacer width={SPACE_BETWEEN_STATS} key={`${i}-spacer`} />;
          }
        )}
      </View>
      {anyMine && <Spacer width={DELETE_WIDTH} />}
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
        tableResponse.scoreTable.factors.map((factor, i) => {
          return (
            <View style={s(c.row, c.fullWidth, c.textAlign("end"))} key={i}>
              <CMText style={s(c.width(120))}>{factor.source}</CMText>
              <Spacer width={12} />
              <CMText style={s(c.width(60))}>{factor.value.toFixed(1)}</CMText>
              <Spacer width={12} />
              <CMText style={s(c.width(60))}>{factor.weight.toFixed(1)}</CMText>
              <Spacer width={12} grow />
              <CMText style={s(c.width(60))}>{factor.total.toFixed(1)}</CMText>
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
        <CMText style={s()}>{tableResponse.score.toFixed(1)}</CMText>
      </View>
    </View>
  );
};
