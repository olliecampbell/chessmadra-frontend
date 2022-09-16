import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
  sortBy,
  reverse,
  forEach,
  filter,
  times,
  values,
  sumBy,
} from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { EditingTab } from "app/utils/repertoire_state";
import { Side } from "app/utils/repertoire";
import { BeatLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { PositionReport, StockfishReport } from "app/models";
import { AddedLineModal } from "./AddedLineModal";
import { formatStockfishEval } from "app/utils/stockfish";
import { GameResultsBar } from "./GameResultsBar";
import {
  getTotalGames,
  getWinRate,
  getPlayRate,
} from "app/utils/results_distribution";
import useKeypress from "react-use-keypress";
import { SelectOneOf } from "./SelectOneOf";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { useDebugState, useRepertoireState } from "app/utils/app_state";
import React, { useEffect, useState } from "react";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import {
  RepertoireMovesTable,
  ScoreTable,
  TableResponse,
} from "./RepertoireMovesTable";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import { ConfirmMoveConflictModal } from "./ConfirmMoveConflictModal";
import { BackControls } from "./BackControls";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { useParams } from "react-router-dom";

export const MoveLog = () => {
  let pairs = [];
  let currentPair = [];
  const [hasPendingLineToAdd, position, differentMoveIndices] =
    useRepertoireState((s) => [
      s.hasPendingLineToAdd,
      s.chessboardState.position,
      s.differentMoveIndices,
    ]);
  let moveList = position.history({ verbose: true });
  forEach(moveList, (move, i) => {
    let isNew = differentMoveIndices.includes(i);
    if (move.color == "b" && isEmpty(currentPair)) {
      pairs.push([{}, { move, i, isNew }]);
      return;
    }
    currentPair.push({ move, i, isNew });
    if (move.color == "b") {
      pairs.push(currentPair);
      currentPair = [];
    }
  });
  if (!isEmpty(currentPair)) {
    if (currentPair.length === 1) {
      currentPair.push({});
    }
    pairs.push(currentPair);
  }
  const isMobile = useIsMobile();
  // let minimumNum = isMobile ? 4 : 10;
  let minimumNum = 1;
  if (pairs.length < minimumNum) {
    times(minimumNum - pairs.length, (i) => {
      pairs.push([{}, {}]);
    });
  }
  const moveStyles = s(
    c.width(60),
    c.weightBold,
    c.fullHeight,
    c.clickable,
    c.selfStretch,
    c.alignStart,
    c.justifyCenter,
    c.column,
    c.fontSize(16),
    c.fg(c.colors.textPrimary)
  );
  return (
    <View style={s(c.column, isMobile && c.alignCenter)}>
      <View
        style={s(
          c.column,
          c.br(2),
          !isMobile && s(c.px(12), c.py(12)),
          c.width(200),
          isMobile ? c.selfStretch : c.selfStart,
          !isMobile && c.bg(c.colors.cardBackground)
        )}
      >
        {!isMobile && (
          <>
            <CMText
              style={s(
                c.fontSize(22),
                c.fg(c.colors.textPrimary),
                c.py(8),
                c.weightHeavy,
                c.textAlign("center")
              )}
            >
              Current line
            </CMText>
            <Spacer height={12} />
          </>
        )}
        <View
          style={s(
            !isMobile && c.bg(c.grays[20]),
            c.py(12),
            c.minHeight(200),
            isMobile && c.br(2)
          )}
        >
          {intersperse(
            pairs.map((pair, i) => {
              const [
                { move: whiteMove, i: whiteI, isNew: whiteIsNew },
                { move: blackMove, i: blackI, isNew: blackIsNew },
              ] = pair;
              const newMoveStyles = s(c.fg(c.grays[65]), c.weightRegular);
              return (
                <View
                  key={`pair-${i}`}
                  style={s(c.column, c.overflowHidden, c.px(16), c.py(4))}
                >
                  <View style={s(c.row, c.alignEnd, c.py(2))}>
                    <View style={s(c.minWidth(18), c.alignStart, c.mb(1))}>
                      <CMText
                        style={s(
                          c.fg(c.grays[50]),
                          c.fontSize(14),
                          c.weightSemiBold
                        )}
                      >
                        {i + 1}.
                      </CMText>
                    </View>
                    <Spacer width={4} />
                    <Pressable onPress={() => {}}>
                      <CMText
                        style={s(moveStyles, whiteIsNew && newMoveStyles)}
                      >
                        {whiteMove?.san}
                      </CMText>
                    </Pressable>
                    <Pressable onPress={() => {}}>
                      <CMText
                        style={s(moveStyles, blackIsNew && newMoveStyles)}
                      >
                        {blackMove?.san ?? ""}
                      </CMText>
                    </Pressable>
                  </View>
                </View>
              );
            }),
            (i) => {
              return null;
            }
          )}
        </View>
      </View>
    </View>
  );
};

let desktopHeaderStyles = s(
  c.fg(c.colors.textPrimary),
  c.fontSize(22),
  c.mb(12),
  c.weightBold
);

export const RepertoireEditingView = () => {
  const isMobile = useIsMobile();
  const [chessboardState, backOne, activeSide, isEditing, quick] =
    useRepertoireState((s) => [
      s.chessboardState,
      s.backOne,
      s.activeSide,
      s.isEditing,
      s.quick,
    ]);
  let { side: paramSide } = useParams();
  useEffect(() => {
    if (paramSide !== activeSide || !isEditing) {
      quick((s) => {
        s.startEditing(paramSide as Side);
      });
    }
  }, []);
  useKeypress(["ArrowLeft", "ArrowRight"], (event) => {
    if (event.key === "ArrowLeft") {
      backOne();
    }
  });

  return (
    <>
      <DeleteMoveConfirmationModal />
      <ConfirmMoveConflictModal />
      <AddedLineModal />
      <RepertoirePageLayout bottom={<RepertoireEditingBottomNav />}>
        <View style={s(c.containerStyles(isMobile), c.alignCenter)}>
          <View style={s(c.column, c.alignStart, c.constrainWidth)}>
            <View style={s(c.row, c.selfCenter, c.constrainWidth)}>
              <View style={s(c.column, c.constrainWidth)}>
                <View style={s(c.width(400), c.maxWidth("100%"), c.selfCenter)}>
                  <ChessboardView state={chessboardState} />
                  <Spacer height={12} />
                  <BackControls includeAnalyze />
                </View>
                <Spacer height={12} />
                {isMobile && <EditingTabPicker />}
              </View>
              {!isMobile && (
                <>
                  <Spacer width={48} />
                  <View style={s(c.column)}>
                    <PositionOverview />
                    <Spacer height={24} />
                    <Responses />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </RepertoirePageLayout>
    </>
  );
};

const Responses = React.memo(function Responses() {
  let [
    positionReport,
    position,
    activeSide,
    currentEpd,
    existingMoves,
    currentLineIncidence,
    hasPendingLine,
  ] = useRepertoireState((s) => [
    s.getCurrentPositionReport(),
    s.chessboardState.position,
    s.activeSide,
    s.getCurrentEpd(),
    s.repertoire[s.activeSide].positionResponses[s.getCurrentEpd()],
    s.getIncidenceOfCurrentLine(),
    s.hasPendingLineToAdd,
  ]);
  let side: Side = position.turn() === "b" ? "black" : "white";
  let ownSide = side === activeSide;
  let _tableResponses: Record<string, TableResponse> = {};
  positionReport?.suggestedMoves.map((sm) => {
    _tableResponses[sm.sanPlus] = {
      suggestedMove: sm,
    };
  });
  existingMoves?.map((r) => {
    if (_tableResponses[r.sanPlus]) {
      _tableResponses[r.sanPlus].repertoireMove = r;
    } else {
      _tableResponses[r.sanPlus] = { repertoireMove: r };
    }
  });
  let tableResponses = scoreTableResponses(
    values(_tableResponses),
    positionReport,
    side,
    currentEpd,
    ownSide ? EFFECTIVENESS_WEIGHTS : PLAYRATE_WEIGHTS
  );
  tableResponses.forEach((tr) => {
    let moveIncidence = 0.0;
    if (ownSide) {
      moveIncidence = 1.0;
    } else if (tr.suggestedMove) {
      moveIncidence = getPlayRate(tr.suggestedMove, positionReport);
    }
    tr.incidence = currentLineIncidence * moveIncidence;
  });
  let youCanPlay = filter(tableResponses, (tr) => {
    return activeSide === side;
  });
  // let myMoves =
  // let otherMoves = filter(tableResponses, (tr) => {
  //   return isNil(tr.repertoireMove) && activeSide === side;
  // });
  let prepareFor = filter(tableResponses, (tr) => {
    return activeSide !== side;
  });
  const isMobile = false;
  const [showOtherMoves, setShowOtherMoves] = useState(false);
  useEffect(() => {
    const beforeUnloadListener = (event) => {
      if (hasPendingLine) {
        event.preventDefault();
        let prompt = "You have an unsaved line, are you sure you want to exit?";
        event.returnValue = prompt;
        return prompt;
      }
    };
    addEventListener("beforeunload", beforeUnloadListener, { capture: true });
    return () => {
      removeEventListener("beforeunload", beforeUnloadListener, {
        capture: true,
      });
    };
  }, []);
  return (
    <View style={s(c.column, c.width(600), c.constrainWidth)}>
      {!isEmpty(youCanPlay) && (
        <View style={s()} key={`you-can-play-${currentEpd}`}>
          <RepertoireMovesTable
            {...{
              header: `Choose your next move`,
              activeSide,
              side,
              responses: youCanPlay,
            }}
          />
        </View>
      )}
      {!isEmpty(prepareFor) && (
        <RepertoireMovesTable
          {...{
            header: "Prepare for...",
            activeSide,
            side,
            responses: prepareFor,
            myMoves: false,
          }}
        />
      )}
      {!ownSide &&
        (() => {
          if (!positionReport) {
            return (
              <View style={s(c.center, c.column, c.py(48))}>
                <BeatLoader color={c.grays[100]} size={14} />
              </View>
            );
          } else if (isEmpty(prepareFor)) {
            return (
              <>
                <View
                  style={s(
                    c.row,
                    c.alignCenter,
                    c.selfCenter,
                    c.px(12),
                    c.maxWidth(240),
                    c.py(48)
                  )}
                >
                  <CMText>
                    <i
                      className="fa-light fa-empty-set"
                      style={s(c.fg(c.grays[50]), c.fontSize(24))}
                    />
                  </CMText>
                  <Spacer width={18} />
                  <CMText style={s(c.fg(c.grays[75]))}>
                    No moves available for this position. You can still add a
                    move by playing it on the board.
                  </CMText>
                </View>
              </>
            );
          } else {
            return <></>;
          }
        })()}
    </View>
  );
});

const isGoodStockfishEval = (stockfish: StockfishReport, side: Side) => {
  if (!isNil(stockfish.eval) && stockfish.eval >= 0 && side === "white") {
    return true;
  }
  if (stockfish.mate && stockfish.mate > 0 && side === "white") {
    return true;
  }
  if (!isNil(stockfish.eval) && stockfish.eval <= 0 && side === "black") {
    return true;
  }
  if (stockfish.mate && stockfish.mate < 0 && side === "black") {
    return true;
  }
  return false;
};

export enum TableResponseScoreSource {
  Start = "start",
  Eval = "eval",
  Winrate = "winrate",
  Playrate = "playrate",
  MasterPlayrate = "masterPlayrate",
}

const scoreTableResponses = (
  tableResponses: TableResponse[],
  report: PositionReport,
  side: Side,
  epd: string,
  weights: {
    startScore: number;
    eval: number;
    winrate: number;
    playrate: number;
    masterPlayrate: number;
  }
): TableResponse[] => {
  let positionWinRate = report ? getWinRate(report?.results, side) : NaN;
  let DEBUG_MOVE = null;
  return reverse(
    sortBy(tableResponses, (tableResponse: TableResponse) => {
      let score = weights.startScore;
      let scoreTable = { factors: [], notes: [] } as ScoreTable;
      if (isNil(report)) {
        return score;
      }
      let suggestedMove = tableResponse.suggestedMove;
      if (suggestedMove) {
        let stockfish = tableResponse.suggestedMove?.stockfish;
        if (stockfish?.mate < 0 && side === "black") {
          scoreTable.factors.push({
            source: TableResponseScoreSource.Eval,
            value: 10000,
          });
        }
        if (stockfish?.mate > 0 && side === "white") {
          scoreTable.factors.push({
            source: TableResponseScoreSource.Eval,
            value: 10000,
          });
        }
        if (!isNil(stockfish?.eval) && !isNil(report.stockfish?.eval)) {
          let eval_loss = Math.abs(
            Math.max(report.stockfish.eval - stockfish.eval, 0)
          );
          scoreTable.factors.push({
            source: TableResponseScoreSource.Eval,
            value: -eval_loss,
          });
          // if (m.sanPlus === DEBUG_MOVE) {
          //   console.log(
          //     `For ${m.sanPlus}, the eval_loss is ${eval_loss}, Score change is ${scoreChangeEval}`
          //   );
          // }
        } else {
          // Punish for not having stockfish eval, so good stockfish evals get bumped up if compared against no stockfish eval
          // score -= 400 * weights.eval;
        }
        let rateAdditionalWeight = Math.min(
          getTotalGames(tableResponse?.suggestedMove.results) / 100,
          1
        );
        let playRate = getPlayRate(tableResponse.suggestedMove, report);
        if (
          !Number.isNaN(playRate) &&
          getTotalGames(suggestedMove.results) > 10
        ) {
          let scoreForPlayrate = playRate * 100 * rateAdditionalWeight;
          scoreTable.factors.push({
            source: TableResponseScoreSource.Playrate,
            value: scoreForPlayrate,
          });
          // if (m.sanPlus === DEBUG_MOVE) {
          //   console.log(
          //     `For ${m.sanPlus}, the playrate is ${playRate}, Score change is ${scoreForPlayrate}`
          //   );
          // }
        } else if (weights[TableResponseScoreSource.Playrate] != 0) {
          scoreTable.notes.push("Insufficient games for playrate");
        }
        let moveWinRate = getWinRate(
          tableResponse.suggestedMove?.results,
          side
        );
        let winrateChange = moveWinRate - positionWinRate;
        let scoreForWinrate = winrateChange * 100 * rateAdditionalWeight;
        if (getTotalGames(suggestedMove.results) > 10) {
          scoreTable.factors.push({
            source: TableResponseScoreSource.Winrate,
            value: scoreForWinrate,
          });
        }
        let masterRateAdditionalWeight = Math.min(
          getTotalGames(tableResponse.suggestedMove?.masterResults) / 100,
          1
        );
        let masterPlayRate = getPlayRate(
          tableResponse?.suggestedMove,
          report,
          true
        );
        if (
          !Number.isNaN(masterPlayRate) &&
          getTotalGames(tableResponse.suggestedMove?.masterResults) > 10
        ) {
          let scoreForMasterPlayrate =
            masterPlayRate * 100 * masterRateAdditionalWeight;
          scoreTable.factors.push({
            source: TableResponseScoreSource.MasterPlayrate,
            value: scoreForMasterPlayrate,
          });
          // if (m.sanPlus === DEBUG_MOVE) {
          //   console.log(
          //     `For ${m.sanPlus}, the masters playrate is ${masterPlayRate}, Score change is ${scoreForMasterPlayrate}`
          //   );
          // }
        }
      }
      scoreTable.factors.forEach((f) => {
        f.weight = weights[f.source] ?? 1.0;
        f.total = f.weight * f.value;
      });
      if (weights.startScore) {
        scoreTable.factors.push({
          source: TableResponseScoreSource.Start,
          weight: 1.0,
          value: weights.startScore,
          total: weights.startScore,
        });
      }
      tableResponse.scoreTable = scoreTable;
      tableResponse.score = sumBy(scoreTable.factors, (f) => {
        return f.total;
      });
      if (tableResponse.repertoireMove && tableResponse.repertoireMove?.mine) {
        return tableResponse.score + 1000000;
      } else {
        return tableResponse.score;
      }
    })
  );
};

let EFFECTIVENESS_WEIGHTS = {
  startScore: 0.0,
  eval: 0.2,
  winrate: 4.0,
  playrate: 0.0,
  masterPlayrate: 8.0,
};

let PLAYRATE_WEIGHTS = {
  startScore: -3,
  eval: 0.0,
  winrate: 0.0,
  playrate: 1.0,
  masterPlayrate: 0.0,
};

const EditingTabPicker = () => {
  const [selectedTab, quick] = useRepertoireState((s) => [
    s.editingState.selectedTab,
    s.quick,
  ]);
  return (
    <View style={s(c.column)}>
      <SelectOneOf
        tabStyle
        containerStyles={s(c.fullWidth, c.justifyBetween)}
        choices={[EditingTab.Position, EditingTab.Responses]}
        activeChoice={selectedTab}
        horizontal
        onSelect={(tab) => {}}
        renderChoice={(tab, active) => {
          return (
            <Pressable
              onPress={() => {
                quick((s) => {
                  s.editingState.selectedTab = tab;
                });
              }}
              style={s(
                c.column,
                c.grow,
                c.alignCenter,
                c.borderBottom(
                  `2px solid ${active ? c.grays[90] : c.grays[20]}`
                ),
                c.zIndex(5),
                c.pb(8)
              )}
            >
              <CMText
                style={s(
                  c.fg(active ? c.colors.textPrimary : c.colors.textSecondary),
                  c.fontSize(16),
                  c.weightBold
                )}
              >
                {tab}
              </CMText>
            </Pressable>
          );
        }}
      />
      <Spacer height={24} />

      {selectedTab === EditingTab.Position && <PositionOverview />}
      {selectedTab === EditingTab.Responses && <Responses />}
    </View>
  );
};

const PositionOverview = () => {
  const pawnStructure = null;
  const pawnStructureReversed = false;
  const [
    positionReport,
    ecoCode,
    activeSide,
    // { pawnStructure, reversed: pawnStructureReversed },
  ] = useRepertoireState((s) => {
    return [
      s.getCurrentPositionReport(),
      s.editingState.lastEcoCode,
      s.activeSide,
      // s.getPawnStructure(s.getCurrentEpd()),
    ];
  });
  let fontColor = c.grays[60];
  let [openingName, variations] = ecoCode
    ? getAppropriateEcoName(ecoCode.fullName)
    : [];
  const plansText = s(c.fontSize(14), c.fg(c.colors.textSecondary));
  const debugUi = useDebugState((s) => s.debugUi);
  return (
    <>
      <RepertoireEditingHeader>Current position</RepertoireEditingHeader>
      <Spacer height={12} />
      <View style={s(c.px(12), c.py(12), c.border(`1px solid ${c.grays[33]}`))}>
        {ecoCode && (
          <View style={s(c.mb(12))}>
            <CMText style={s(c.fg(c.grays[80]), c.weightBold, c.fontSize(16))}>
              {openingName}
            </CMText>
            <Spacer height={4} />
            <CMText
              style={s(c.fg(c.grays[60]), c.weightRegular, c.fontSize(14))}
            >
              {variations.join(", ")}
            </CMText>
          </View>
        )}
        {positionReport?.stockfish && (
          <View style={s(c.mb(12), c.row, c.alignEnd)}>
            <CMText style={s(c.fg(c.grays[80]), c.weightBold, c.fontSize(18))}>
              {formatStockfishEval(positionReport.stockfish)}
            </CMText>
            <Spacer width={6} />
            <CMText style={s(c.fg(fontColor))}>Stockfish</CMText>
          </View>
        )}
        <View style={s(c.row)}>
          {positionReport?.results && (
            <View style={s(c.grow)}>
              <View style={s(c.row)}>
                <CMText style={s(c.fg(fontColor))}>
                  Results at your level
                </CMText>
                {debugUi && (
                  <>
                    <Spacer width={4} />
                    <CMText style={s(c.fg(c.colors.debugColor))}>
                      ({getTotalGames(positionReport.results)} games)
                    </CMText>
                  </>
                )}
              </View>
              <Spacer height={4} />
              <GameResultsBar
                activeSide={activeSide}
                gameResults={positionReport.results}
              />
            </View>
          )}
        </View>
        {pawnStructure && (
          <>
            <Spacer height={24} />
            <View
              style={s(
                c.bg(c.colors.cardBackground),
                c.px(12),
                c.py(12),
                c.fillNoExpand
              )}
            >
              <CMText
                style={s(
                  c.fontSize(14),
                  c.weightRegular,
                  c.fg(c.colors.textSecondary)
                )}
              >
                Pawn structure
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fontSize(18), c.weightBold)}>
                {pawnStructure.name}
              </CMText>
              <Spacer height={12} />
              <CMText style={s(c.fontSize(12), c.fg(c.colors.textPrimary))}>
                White plans
              </CMText>
              <Spacer height={4} />
              <CMText style={s(plansText)}>{pawnStructure.plans}</CMText>
              <Spacer height={12} />
              <CMText style={s(c.fontSize(12), c.fg(c.colors.textPrimary))}>
                Black plans
              </CMText>
              <Spacer height={4} />
              <CMText style={s(plansText)}>
                {pawnStructure.opponentPlans}
              </CMText>
            </View>
          </>
        )}
      </View>
    </>
  );
};
