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
  every,
  cloneDeep,
} from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { EditingTab } from "app/utils/repertoire_state";
import { Side } from "app/utils/repertoire";
import { BeatLoader } from "react-spinners";
import { CMText } from "./CMText";
import { PositionReport, StockfishReport } from "app/models";
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
import {
  useDebugState,
  useRepertoireState,
  useBrowsingState,
  useUserState,
  quick,
} from "app/utils/app_state";
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
import { failOnAny } from "app/utils/test_settings";
import { START_EPD } from "app/utils/chess";
import { formatLargeNumber } from "app/utils/number_formatting";
import { BP, useResponsive } from "app/utils/useResponsive";
import { getMoveRating } from "app/utils/move_inaccuracy";
import { plural, pluralize } from "app/utils/pluralize";
import { shouldUsePeerRates } from "app/utils/table_scoring";
import { Button } from "./Button";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

export const MoveLog = () => {
  let pairs = [];
  let currentPair = [];
  const [hasPendingLineToAdd, position, differentMoveIndices] =
    useBrowsingState(([s]) => [
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

const VERTICAL_BREAKPOINT = BP.md;

export const RepertoireEditingView = () => {
  const isMobile = useIsMobile();
  const [chessboardState, backOne, activeSide, isEditing, quick] =
    useRepertoireState((s) => [
      s.browsingState.chessboardState,
      s.backOne,
      s.browsingState.activeSide,
      s.isEditing,
      s.quick,
    ]);
  let { side: paramSide } = useParams();
  useEffect(() => {
    if (paramSide !== activeSide || !isEditing) {
      quick((s) => {
        // s.startEditing(paramSide as Side);
      });
    }
  }, []);
  useKeypress(["ArrowLeft", "ArrowRight"], (event) => {
    if (event.key === "ArrowLeft") {
      backOne();
    }
  });

  const responsive = useResponsive();
  const vertical = responsive.bp <= VERTICAL_BREAKPOINT;
  return (
    <>
      <ConfirmMoveConflictModal />
      <RepertoirePageLayout bottom={<RepertoireEditingBottomNav />}>
        <View style={s(c.containerStyles(responsive.bp), c.alignCenter)}>
          <View
            style={s(
              vertical ? c.width(c.min(600, "100%")) : c.fullWidth,
              vertical ? c.column : c.row
              // c.grid({
              //   templateColumns: !vertical && ["fit-content(600px)", "1fr"],
              //   templateRows: vertical && ["1fr"],
              //   rowGap: responsive.switch(12, [BP.lg, 24], [BP.xl, 48]),
              //   columnGap: responsive.switch(12, [BP.lg, 24], [BP.xl, 48]),
              // })
            )}
          >
            <View
              style={s(
                c.column,
                c.grow,
                vertical ? c.width("min(400px, 100%)") : c.maxWidth(600),
                vertical ? c.selfCenter : c.selfStretch
              )}
            >
              <View style={s()}>
                <ChessboardView state={chessboardState} />
                <Spacer height={12} />
                <BackControls
                  height={responsive.switch(42, [BP.lg, 42], [BP.xl, 60])}
                  includeAnalyze
                />
              </View>
              <Spacer height={12} />
            </View>
            {vertical ? (
              <>
                <Spacer height={12} />
                <EditingTabPicker />
              </>
            ) : (
              <>
                <Spacer width={48} />
                <View style={s(c.column, c.flexGrow(10), c.maxWidth(700))}>
                  <Responses />
                </View>
              </>
            )}
          </View>
        </View>
      </RepertoirePageLayout>
    </>
  );
};

export const Responses = React.memo(function Responses() {
  let [
    positionReport,
    position,
    activeSide,
    currentEpd,
    currentLine,
    currentLineIncidence,
    hasPendingLine,
    tableResponses,
    showingPastCoverageGoal,
  ] = useBrowsingState(([s, rs]) => [
    s.getCurrentPositionReport(),
    s.chessboardState.position,
    s.activeSide,
    s.chessboardState.getCurrentEpd(),
    s.chessboardState.moveLog,
    s.getIncidenceOfCurrentLine(),
    s.hasPendingLineToAdd,
    s.tableResponses,
    s.getShouldShowPastGoalOverlay(),
  ]);
  let [currentThreshold] = useUserState((s) => [s.getCurrentThreshold()]);
  let usePeerRates = shouldUsePeerRates(positionReport);
  let side: Side = position.turn() === "b" ? "black" : "white";
  let ownSide = side === activeSide;
  let yourMoves = filter(tableResponses, (tr) => {
    return !isNil(tr.repertoireMove) && activeSide === side;
  });
  let otherMoves = filter(tableResponses, (tr) => {
    return isNil(tr.repertoireMove) && activeSide === side;
  });
  // let youCanPlay = filter(tableResponses, (tr) => {
  //   return activeSide === side;
  // });
  let prepareFor = filter(tableResponses, (tr) => {
    return activeSide !== side;
  });
  const isMobile = false;
  const [showOtherMoves, setShowOtherMoves] = useState(false);
  const debugUi = useDebugState((s) => s.debugUi);
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
  }, [hasPendingLine]);
  const responsive = useResponsive();
  const checkmarkSize = 30;
  return (
    <View style={s(c.column, c.constrainWidth)}>
      {debugUi && (
        <CMText style={s(c.fg(c.colors.debugColorDark))}>
          Current line incidence: {(currentLineIncidence * 100).toFixed(2)}%
        </CMText>
      )}
      <>
        {!isEmpty(yourMoves) && (
          <View style={s()} key={`your-moves-play-${currentEpd}`}>
            <RepertoireMovesTable
              {...{
                header: getResponsesHeader(currentLine, !isEmpty(yourMoves)),
                usePeerRates,
                activeSide,
                side,
                responses: yourMoves,
              }}
            />
          </View>
        )}
        {isEmpty(yourMoves) && !isEmpty(otherMoves) && (
          <View style={s()} key={`choose-next-move-${currentEpd}`}>
            <RepertoireMovesTable
              {...{
                header: "Choose your next move",
                usePeerRates,
                activeSide,
                side,
                responses: otherMoves,
              }}
            />
          </View>
        )}
        {!isEmpty(yourMoves) && !isEmpty(otherMoves) && (
          <View style={s(c.mt(36))} key={`alternate-moves-${currentEpd}`}>
            <CollapsibleSidebarSection header="Add an alternative move">
              <Spacer height={12} />
              <RepertoireMovesTable
                {...{
                  header: null,
                  usePeerRates,
                  activeSide,
                  side,
                  responses: otherMoves,
                }}
              />
            </CollapsibleSidebarSection>
          </View>
        )}
        {!isEmpty(prepareFor) && (
          <RepertoireMovesTable
            {...{
              header: "What do you want to prepare for?",
              activeSide,
              side,
              responses: prepareFor,
              myMoves: false,
            }}
          />
        )}
      </>
      {(() => {
        if (!positionReport) {
          return (
            <View style={s(c.center, c.column, c.py(48))}>
              <BeatLoader color={c.grays[100]} size={14} />
            </View>
          );
        } else if (
          isEmpty(positionReport.suggestedMoves) &&
          isEmpty(yourMoves)
        ) {
          return (
            <>
              <View
                style={s(
                  c.column,
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
                <Spacer height={18} />
                <CMText style={s(c.fg(c.grays[75]))}>
                  No moves available for this position. You can still add a move
                  by playing it on the board.
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

const EditingTabPicker = () => {
  const responsive = useResponsive();
  const [selectedTab, currentLine, quick] = useRepertoireState((s) => [
    s.browsingState.editingState.selectedTab,
    s.browsingState.chessboardState.moveLog,
    s.quick,
  ]);
  const vertical = responsive.bp <= VERTICAL_BREAKPOINT;
  return (
    <View
      style={s(
        c.column,
        vertical && s(c.selfCenter),
        c.fullWidth,
        c.maxWidth(responsive.switch(600, [BP.xl, 700]))
      )}
    >
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
                  s.browsingState.editingState.selectedTab = tab;
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
                {tab === EditingTab.Responses
                  ? getResponsesHeader(currentLine)
                  : tab}
              </CMText>
            </Pressable>
          );
        }}
      />
      {selectedTab === EditingTab.Responses && <Responses />}
    </View>
  );
};

export const PositionOverview = ({ card }: { card?: boolean }) => {
  const pawnStructure = null;
  const pawnStructureReversed = false;
  const [
    positionReport,
    ecoCode,
    activeSide,
    isStartPosition,
    // { pawnStructure, reversed: pawnStructureReversed },
  ] = useRepertoireState((s) => {
    return [
      s.browsingState.getCurrentPositionReport(),
      s.browsingState.editingState.lastEcoCode,
      s.browsingState.activeSide,
      s.browsingState.chessboardState.getCurrentEpd() === START_EPD,
      // s.getPawnStructure(s.getCurrentEpd()),
    ];
  });
  let fontColor = card ? c.grays[80] : c.grays[80];
  let [openingName, variations] = ecoCode
    ? getAppropriateEcoName(ecoCode.fullName)
    : [];
  const plansText = s(c.fontSize(14), c.fg(c.colors.textSecondary));
  const debugUi = useDebugState((s) => s.debugUi);
  const isMobile = useIsMobile();
  return (
    <>
      <View
        style={s(
          card &&
            s(c.bg(c.colors.cardBackground), c.cardShadow, c.px(12), c.py(12)),
          c.minHeight(120)
        )}
      >
        <View style={s(c.row, c.alignStart, c.fullHeight)}>
          <View style={s(c.column, c.fullHeight)}>
            {(ecoCode || isStartPosition) && (
              <View style={s(c.mb(12))}>
                <CMText
                  style={s(
                    c.fg(card ? c.grays[80] : c.grays[80]),
                    c.weightBold,
                    c.fontSize(16)
                  )}
                >
                  {openingName || "Starting position"}
                </CMText>
                {variations && (
                  <>
                    <Spacer height={4} />
                    <CMText
                      style={s(
                        c.fg(card ? c.grays[60] : c.grays[60]),
                        c.weightRegular,
                        c.fontSize(14)
                      )}
                    >
                      {variations.join(", ")}
                    </CMText>
                  </>
                )}
              </View>
            )}
            <Spacer height={4} grow />
            <View style={s(c.row)}>
              {positionReport?.results && (
                <View style={s(c.grow, c.fullWidth, c.maxWidth(300))}>
                  <View style={s(c.row)}>
                    <CMText style={s(c.fg(fontColor))}>
                      Results at your level
                    </CMText>
                    {(debugUi ||
                      getTotalGames(positionReport.results) > 10) && (
                      <>
                        <Spacer width={4} />
                        <CMText
                          style={s(
                            c.fg(debugUi ? c.colors.debugColor : fontColor)
                          )}
                        >
                          –{" "}
                          {formatLargeNumber(
                            getTotalGames(positionReport.results),
                            false
                          )}{" "}
                          games
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
          <Spacer width={12} grow />
          {positionReport?.stockfish && (
            <View style={s(c.mb(12), c.row, c.alignEnd)}>
              <CMText style={s(c.fg(fontColor), c.weightBold, c.fontSize(18))}>
                {formatStockfishEval(positionReport.stockfish)}
              </CMText>
              {debugUi && (
                <CMText style={s(c.fg(c.colors.debugColor))}>
                  ({formatLargeNumber(positionReport.stockfish.nodesK * 1000)})
                </CMText>
              )}
            </View>
          )}
        </View>
      </View>
    </>
  );
};

function getResponsesHeader(currentLine: string[], hasMove?: boolean): string {
  // TODO: account for multiple moves, "These moves are"
  if (hasMove && !isEmpty(currentLine)) {
    return "This move is in your repertoire";
  }
  return `${hasMove ? "Choose your" : "Your"} ${
    isEmpty(currentLine) ? "first" : "next"
  } move`;
}
