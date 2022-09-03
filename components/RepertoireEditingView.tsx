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
  filter,
  times,
  findIndex,
  map,
} from "lodash";
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
import { useRepertoireState } from "app/utils/app_state";
import React, { useState } from "react";
import { plural, pluralize } from "app/utils/pluralize";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { RepertoireMovesTable, TableResponse } from "./RepertoireMovesTable";
import { RepertoireEditingBottomNav } from "./RepertoireEditingBottomNav";
import { ConfirmMoveConflictModal } from "./ConfirmMoveConflictModal";
import { BackControls } from "./BackControls";

export const MoveLog = () => {
  let pairs = [];
  let currentPair = [];
  const [hasPendingLineToAdd, position, differentMoveIndices] =
    useRepertoireState(
      (s) => [
        s.hasPendingLineToAdd,
        s.chessboardState.position,
        s.differentMoveIndices,
      ],
    );
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
  const [chessboardState, backOne] = useRepertoireState((s) => [
    s.chessboardState,
    s.backOne,
  ]);
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
                <View style={s(c.width(400), c.maxWidth("100%"))}>
                  <ChessboardView state={chessboardState} />
                </View>
                <Spacer height={12} />
                <BackControls includeAnalyze />
                <Spacer height={12} />
                {isMobile && <EditingTabPicker />}
              </View>
              {!isMobile && (
                <>
                  <Spacer width={48} />
                  <View style={s(c.column)}>
                    <PositionOverview />
                    <Spacer height={48} />
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

const Responses = () => {
  let [
    positionReport,
    currentLine,
    position,
    activeSide,
    repertoire,
    currentEpd,
    existingMoves,
    playSan,
  ] = useRepertoireState(
    (s) => [
      s.getCurrentPositionReport(),
      s.currentLine,
      s.chessboardState.position,
      s.activeSide,
      s.repertoire,
      s.getCurrentEpd(),
      s.repertoire[s.activeSide].positionResponses[s.getCurrentEpd()],
      s.playSan,
    ],
  );
  let coveredSans = new Set();
  forEach(existingMoves, (m) => {
    coveredSans.add(m.sanPlus);
  });
  let side: Side = position.turn() === "b" ? "black" : "white";
  console.warn("---------");
  console.log(position.turn());
  let ownSide = side === activeSide;
  console.warn({ positionReport });
  let suggestedMoves = positionReport
    ? sortSuggestedMoves(
        positionReport,
        activeSide,
        repertoire,
        currentEpd,
        side === activeSide ? EFFECTIVENESS_WEIGHTS : PLAYRATE_WEIGHTS
      )
    : [];
  console.log({ suggestedMoves });
  // existingMoves = sortBy(existingMoves, (m) => {
  //   return findIndex(suggestedMoves, (s) => s.sanPlus === m.sanPlus);
  // });
  let tableResponses: TableResponse[] = map(
    suggestedMoves,
    (sm: SuggestedMove) => {
      let existingMove = find(existingMoves, (rm) => rm.sanPlus === sm.sanPlus);
      return {
        repertoireMove: existingMove,
        suggestedMove: sm,
      };
    }
  );
  let myMoves = filter(tableResponses, (tr) => {
    return !isNil(tr.repertoireMove) && activeSide === side;
  });
  let otherMoves = filter(tableResponses, (tr) => {
    return isNil(tr.repertoireMove) && activeSide === side;
  });
  let prepareFor = filter(
    sortBy(tableResponses, (tr) => {
      return isNil(tr.repertoireMove);
    }),
    (tr) => {
      return activeSide !== side;
    }
  );
  const isMobile = false;
  const [showOtherMoves, setShowOtherMoves] = useState(false);
  return (
    <View style={s(c.column, c.width(500), c.constrainWidth)}>
      {!isEmpty(myMoves) && (
        <RepertoireMovesTable
          {...{
            header: `Your ${plural(myMoves.length, "move")}`,
            activeSide,
            side,
            responses: myMoves,
            setShouldShowOtherMoves: (show: boolean) => {
              setShowOtherMoves(true);
            },
            showOtherMoves: showOtherMoves,
            myMoves: true,
          }}
        />
      )}
      {!isEmpty(otherMoves) && showOtherMoves && (
        <>
          <Spacer height={12} />
          <RepertoireMovesTable
            {...{
              header: "Other moves",
              activeSide,
              side,
              responses: otherMoves,
              myMoves: false,
            }}
          />
        </>
      )}
      {!isEmpty(otherMoves) && isEmpty(myMoves) && (
        <RepertoireMovesTable
          {...{
            header: "You can play...",
            activeSide,
            side,
            responses: otherMoves,
            myMoves: false,
          }}
        />
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
};

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

const sortSuggestedMoves = (
  report: PositionReport,
  side: Side,
  repertoire: Repertoire,
  epd: string,
  weights: {
    eval: number;
    winrate: number;
    playrate: number;
    masterPlayrate: number;
  }
): SuggestedMove[] => {
  let positionWinRate = getWinRate(report.results, side);
  let DEBUG_MOVE = null;
  return reverse(
    sortBy(report.suggestedMoves, (m) => {
      let score = 0;
      if (
        some(
          repertoire[side].positionResponses[epd],
          (r) => r.sanPlus === m.sanPlus
        )
      ) {
        score += 1000000;
      }
      if (m.stockfish?.mate < 0 && side === "black") {
        score += 10000 * weights.eval;
      }
      if (m.stockfish?.mate > 0 && side === "white") {
        score += 10000 * weights.eval;
      }
      if (!isNil(m.stockfish?.eval) && !isNil(report.stockfish?.eval)) {
        let eval_loss = Math.abs(
          Math.max(report.stockfish.eval - m.stockfish.eval, 0)
        );
        let scoreChangeEval = -eval_loss * weights.eval;
        score += scoreChangeEval;
        if (m.sanPlus === DEBUG_MOVE) {
          console.log(
            `For ${m.sanPlus}, the eval_loss is ${eval_loss}, Score change is ${scoreChangeEval}`
          );
        }
      } else {
        // Punish for not having stockfish eval, so good stockfish evals get bumped up if compared against no stockfish eval
        score -= 400 * weights.eval;
      }

      let moveWinRate = getWinRate(m.results, side);
      let winrateChange = moveWinRate - positionWinRate;
      let rateAdditionalWeight = Math.min(getTotalGames(m.results) / 100, 1);
      let scoreForWinrate =
        winrateChange * weights.winrate * rateAdditionalWeight;
      let playRate = getPlayRate(m, report);
      if (!Number.isNaN(playRate)) {
        let scoreForPlayrate =
          playRate * weights.playrate * rateAdditionalWeight;
        score += scoreForPlayrate;
        if (m.sanPlus === DEBUG_MOVE) {
          console.log(
            `For ${m.sanPlus}, the playrate is ${playRate}, Score change is ${scoreForPlayrate}`
          );
        }
      }
      score += scoreForWinrate;
      if (m.sanPlus === DEBUG_MOVE) {
        console.log(
          `For ${m.sanPlus}, there are ${getTotalGames(
            m.results
          )} games, the winrate is ${positionWinRate} -> ${moveWinRate} : ${winrateChange}, Score change is ${scoreForWinrate}`
        );
      }
      let masterRateAdditionalWeight = Math.min(
        getTotalGames(m.masterResults) / 100,
        1
      );
      let masterPlayRate = getPlayRate(m, report, true);
      if (!Number.isNaN(masterPlayRate)) {
        let scoreForMasterPlayrate =
          masterPlayRate * weights.masterPlayrate * masterRateAdditionalWeight;
        score += scoreForMasterPlayrate;
        if (m.sanPlus === DEBUG_MOVE) {
          console.log(
            `For ${m.sanPlus}, the masters playrate is ${masterPlayRate}, Score change is ${scoreForMasterPlayrate}`
          );
        }
      }
      if (m.sanPlus === DEBUG_MOVE) {
        console.log(`Final score for ${m.sanPlus} is ${score}`);
      }

      return score;
    })
  );
};

let EFFECTIVENESS_WEIGHTS = {
  eval: 1.0,
  winrate: 700.0,
  playrate: 200.0,
  masterPlayrate: 400.0,
};

let PLAYRATE_WEIGHTS = {
  eval: 0.0,
  winrate: 0.0,
  playrate: 1.0,
  masterPlayrate: 0.0,
};

const ResponseStatSection = ({
  positionReport,
  side,
  masters,
  m,
}: {
  positionReport: PositionReport;
  m: SuggestedMove;
  masters: boolean;
  side: Side;
}) => {
  let neutralTextColor = c.grays[75];
  let numberStyles = s(
    c.weightBold,
    c.fontSize(16),
    c.fg(neutralTextColor),
    c.unshrinkable
  );
  let textStyles = s(
    c.weightRegular,
    c.fontSize(14),
    c.fg(c.colors.textSecondary)
  );
  let groupName = masters ? "masters" : "your peers";
  let tooLow = getTotalGames(masters ? m.masterResults : m.results) < 3;
  return (
    <View style={s(c.column, c.grow)}>
      <View style={s(c.row, c.alignEnd)}>
        {!tooLow && (
          <>
            <CMText style={s(numberStyles)}>
              {formatPlayPercentage(getPlayRate(m, positionReport, masters))}{" "}
            </CMText>
            <Spacer width={2} />
          </>
        )}
        {/* TODO: need to add moves from repertoire that are uncovered (odd moves)*/}
        <CMText style={s(textStyles)}>
          {tooLow ? `No games from ${groupName}` : `of ${groupName} play this`}
        </CMText>
      </View>
      {!tooLow && (
        <>
          <Spacer height={8} />
          <View style={s(c.height(18), c.fullWidth)}>
            <GameResultsBar
              activeSide={side}
              gameResults={masters ? m.masterResults : m.results}
            />
          </View>
        </>
      )}
    </View>
  );
};

const EditingTabPicker = () => {
  const [selectedTab, quick] = useRepertoireState(
    (s) => [s.editingState.selectedTab, s.quick],
  );
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
  const [positionReport, ecoCode, activeSide, pawnStructure] =
    useRepertoireState((s) => {
      return [
        s.getCurrentPositionReport(),
        s.editingState.lastEcoCode,
        s.activeSide,
        s.pawnStructureLookup[
          s.getCurrentPositionReport()?.pawnStructure?.name
        ],
      ];
    }, );
  let fontColor = c.grays[60];
  let [openingName, variations] = ecoCode
    ? getAppropriateEcoName(ecoCode.fullName)
    : [];
  const plansText = s(c.fontSize(14), c.fg(c.colors.textSecondary));
  return (
    <>
      {ecoCode && (
        <View style={s(c.mb(12))}>
          <CMText style={s(c.fg(c.grays[80]), c.weightBold, c.fontSize(16))}>
            {openingName}
          </CMText>
          <Spacer height={4} />
          <CMText style={s(c.fg(c.grays[60]), c.weightRegular, c.fontSize(14))}>
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
            <CMText style={s(c.fg(fontColor))}>Your Elo</CMText>
            <Spacer height={4} />
            <GameResultsBar
              activeSide={activeSide}
              gameResults={positionReport.results}
            />
          </View>
        )}
        {positionReport?.masterResults && (
          <>
            <Spacer width={12} />
            <View style={s(c.column, c.grow)}>
              <CMText style={s(c.fg(fontColor))}>Masters</CMText>
              <Spacer height={4} />
              <GameResultsBar
                activeSide={activeSide}
                gameResults={positionReport.masterResults}
              />
            </View>
          </>
        )}
      </View>
      {pawnStructure && false && (
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
            <CMText style={s(plansText)}>{pawnStructure.opponentPlans}</CMText>
          </View>
        </>
      )}
    </>
  );
};
