import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import shallow from "zustand/shallow";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  isEmpty,
  isNil,
  dropRight,
  capitalize,
  drop,
  keys,
  take,
  sortBy,
  reverse,
  some,
  forEach,
  first,
  find,
  filter,
  times,
  findIndex,
  zip,
  map,
  every,
} from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
  EditingTab,
  RepertoireState,
  useRepertoireState,
} from "app/utils/repertoire_state";
import {
  RepertoireGrade,
  RepertoireMove,
  getAllRepertoireMoves,
  RepertoireSide,
  lineToPgn,
  pgnToLine,
  SIDES,
  Side,
  RepertoireMiss,
  formatIncidence,
  otherSide,
  Repertoire,
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { RepertoireWizard } from "./RepertoireWizard";
import { BeatLoader, GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 4;
import { AppStore } from "app/store";
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";
import { ChessboardState, createChessState } from "app/utils/chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { LichessGameCellMini } from "./LichessGameCellMini";
import { CMText } from "./CMText";
import {
  GameResultsDistribution,
  PositionReport,
  StockfishReport,
  SuggestedMove,
} from "app/models";
import { failOnAny, failOnTrue } from "app/utils/test_settings";
import { AddedLineModal } from "./AddedLineModal";
import { formatStockfishEval } from "app/utils/stockfish";
import { GameResultsBar } from "./GameResultsBar";
import {
  getTotalGames,
  formatPlayPercentage,
  formatWinPercentage,
  getWinRate,
} from "app/utils/results_distribution";
import useKeypress from "react-use-keypress";
import { SelectOneOf } from "./SelectOneOf";
import { getAppropriateEcoName } from "app/utils/eco_codes";
import { Modal } from "./Modal";
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";

type BackControlsProps = {
  state: RepertoireState;
};

export const BackControls: React.FC<BackControlsProps> = ({ state }) => {
  let backButtonActive = state.position.history().length > 0;

  let [searchOnChessable, analyzeLineOnLichess, quick] = useRepertoireState(
    (s) => [s.searchOnChessable, s.analyzeLineOnLichess, s.quick],
    shallow
  );
  const isMobile = useIsMobile();
  let gap = isMobile ? 6 : 12;
  return (
    <View style={s(c.row, c.height(isMobile ? 32 : 42))}>
      <Button
        style={s(c.buttons.basicSecondary, c.width(64))}
        onPress={() => {
          state.backToStartPosition();
        }}
      >
        <i
          className="fas fa-angles-left"
          style={s(c.buttons.basicSecondary.textStyles, c.fontSize(18))}
        />
      </Button>
      <Spacer width={gap} />
      <Button
        style={s(c.buttons.basicSecondary, c.grow)}
        onPress={() => {
          state.backOne();
        }}
      >
        <i
          className="fas fa-angle-left"
          style={s(c.buttons.basicSecondary.textStyles, c.fontSize(18))}
        />
      </Button>
      <Spacer width={gap} />
      <Button
        style={s(c.buttons.basicSecondary)}
        onPress={() => {
          analyzeLineOnLichess();
        }}
      >
        <CMText
          style={s(
            c.buttons.basicSecondary.textStyles,
            c.fg(c.colors.textPrimary)
          )}
        >
          <i
            style={s(c.fontSize(14), c.fg(c.grays[60]))}
            className="fas fa-search"
          ></i>
        </CMText>
      </Button>
      <Spacer width={gap} />
      <Button
        style={s(c.buttons.basicSecondary)}
        onPress={() => {
          quick((s) => {
            s.editingState.etcModalOpen = true;
          });
        }}
      >
        <CMText
          style={s(
            c.buttons.basicSecondary.textStyles,
            c.fg(c.colors.textPrimary)
          )}
        >
          <i
            style={s(c.fontSize(14), c.fg(c.grays[60]))}
            className="fas fa-gear"
          ></i>
        </CMText>
      </Button>
    </View>
  );
};

export const MoveLog = () => {
  let pairs = [];
  let currentPair = [];
  const [hasPendingLineToAdd, position, differentMoveIndices] =
    useRepertoireState(
      (s) => [s.hasPendingLineToAdd, s.position, s.differentMoveIndices],
      shallow
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
        {!isMobile && hasPendingLineToAdd && (
          <>
            <Spacer height={12} />
            <AddPendingLineButton />
          </>
        )}
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

export const RepertoireEditingView = ({
  state,
  backToOverviewRow,
}: {
  state: RepertoireState;
  backToOverviewRow: any;
}) => {
  const isMobile = useIsMobile();
  let side = state.activeSide;
  useKeypress(["ArrowLeft", "ArrowRight"], (event) => {
    if (event.key === "ArrowLeft") {
      state.backOne();
    }
  });

  let biggestMiss = state.repertoireGrades?.[state.activeSide]?.biggestMiss;
  let positionReport = state.getCurrentPositionReport();
  return (
    <>
      <DeleteMoveConfirmationModal />
      <AddedLineModal />
      <EditEtcModal />
      <View style={s(c.containerStyles(isMobile), c.alignCenter)}>
        <View style={s(c.column, c.alignStart, c.constrainWidth)}>
          {backToOverviewRow}
          <Spacer height={isMobile ? 12 : 24} />
          <View style={s(c.row, c.selfCenter, c.constrainWidth)}>
            {!isMobile && (
              <>
                <MoveLog />
                <Spacer width={48} />
              </>
            )}
            <View style={s(c.column, c.constrainWidth)}>
              <View style={s(c.width(400), c.maxWidth("100%"))}>
                <ChessboardView state={state} />
              </View>
              <Spacer height={12} />
              <BackControls state={state} />
              <Spacer height={12} />
              {isMobile && state.hasPendingLineToAdd ? (
                <>
                  <AddPendingLineButton />
                  <Spacer height={12} />
                </>
              ) : (
                <Spacer height={12} />
              )}
              {isMobile && <EditingTabPicker />}
              {!isMobile && <PositionOverview />}
            </View>
            {!isMobile && (
              <>
                <Spacer width={48} />
                <Responses />
              </>
            )}
          </View>
        </View>
      </View>
      <Spacer height={12} />
    </>
  );
};

const Responses = React.memo(function Responses() {
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
      s.position,
      s.activeSide,
      s.repertoire,
      s.getCurrentEpd(),
      s.repertoire[s.activeSide].positionResponses[s.getCurrentEpd()],
      s.playSan,
    ],
    shallow
  );
  let coveredSans = new Set();
  forEach(existingMoves, (m) => {
    coveredSans.add(m.sanPlus);
  });
  let side: Side = position.turn() === "b" ? "black" : "white";
  let ownSide = side === activeSide;
  let suggestedMoves = positionReport
    ? sortSuggestedMoves(
        positionReport,
        activeSide,
        repertoire,
        currentEpd,
        side === activeSide ? EFFECTIVENESS_WEIGHTS : PLAYRATE_WEIGHTS
      )
    : [];
  existingMoves = sortBy(existingMoves, (m) => {
    return findIndex(suggestedMoves, (s) => s.sanPlus === m.sanPlus);
  });
  const isMobile = false;
  let otherMoves = take(
    filter(suggestedMoves, (m) => {
      return !coveredSans.has(m.sanPlus);
    }),
    5
  );
  return (
    <View style={s(c.column, c.width(400), c.constrainWidth)}>
      {!isEmpty(existingMoves) && (
        <>
          <CMText style={s(desktopHeaderStyles)}>
            {ownSide ? "Your move" : "Covered moves"}
          </CMText>
          {intersperse(
            existingMoves.map((x, i) => {
              let sm = find(suggestedMoves, (m) => m.sanPlus === x.sanPlus);
              return <Response repertoireMove={x} suggestedMove={sm} />;
            }),
            (i) => {
              return <Spacer height={12} key={i} />;
            }
          )}

          <Spacer height={24} />
        </>
      )}
      {!isMobile && (
        <CMText style={s(desktopHeaderStyles)}>
          {ownSide
            ? !isEmpty(existingMoves)
              ? "Other moves"
              : "You can play"
            : !isEmpty(existingMoves)
            ? "Other moves"
            : "Prepare for..."}
        </CMText>
      )}
      {(() => {
        if (!positionReport) {
          return (
            <View style={s(c.center, c.column, c.py(48))}>
              <BeatLoader color={c.grays[100]} size={14} />
            </View>
          );
        } else if (isEmpty(suggestedMoves)) {
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
                  No moves available for this position. You can still add a move
                  by playing it on the board.
                </CMText>
              </View>
            </>
          );
        } else {
          return (
            <>
              {intersperse(
                otherMoves.map((m, i) => {
                  if (coveredSans.has(m.sanPlus)) {
                    return null;
                  }
                  return <Response suggestedMove={m} />;
                }),
                (i) => {
                  return <Spacer height={12} key={i} />;
                }
              )}
            </>
          );
        }
      })()}
    </View>
  );
});

const Response = ({
  suggestedMove,
  repertoireMove,
}: {
  suggestedMove?: SuggestedMove;
  repertoireMove?: RepertoireMove;
}) => {
  const [playSan, currentLine, positionReport, side, quick] =
    useRepertoireState(
      (s) => [
        s.playSan,
        s.currentLine,
        s.getCurrentPositionReport(),
        s.activeSide,
        s.quick,
      ],
      shallow
    );
  const isMobile = useIsMobile();
  let tags = [];
  if (suggestedMove) {
    let tags = [];
    // take(
    //   genMoveTags(suggestedMove, positionReport, currentEpd, side),
    //   5
    // );
  }
  let moveNumber = Math.floor(currentLine.length / 2) + 1;
  let sanPlus = suggestedMove?.sanPlus ?? repertoireMove?.sanPlus;
  let mine = repertoireMove?.mine;

  return (
    <Pressable
      onPress={() => {
        playSan(sanPlus);
      }}
    >
      <View
        style={s(
          c.br(2),
          c.py(8),
          c.pl(14),
          c.pr(8),
          c.bg(c.grays[12]),
          c.border(`1px solid ${c.grays[20]}`),
          c.clickable,
          c.row
        )}
      >
        <View style={s(c.column, c.grow, c.constrainWidth)}>
          <View style={s(c.row, c.justifyBetween, c.fullWidth)}>
            <View style={s(c.row, c.alignCenter)}>
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
            </View>
            <View style={s(c.row, c.alignCenter)}>
              {suggestedMove?.stockfish && (
                <>
                  <Spacer width={0} grow />
                  <View style={s(c.row, c.alignEnd)}>
                    <CMText
                      style={s(
                        c.weightSemiBold,
                        c.fontSize(14),
                        c.fg(c.grays[75])
                        // isGoodStockfishEval(
                        //   m.stockfish,
                        //   activeSide
                        // )
                        //   ? c.fg(goodTextColor)
                        //   : c.fg(badTextColor)
                      )}
                    >
                      {formatStockfishEval(suggestedMove?.stockfish)}
                    </CMText>
                  </View>
                </>
              )}
              {repertoireMove?.mine && (
                <>
                  <Spacer width={12} />
                  <Pressable
                    style={s()}
                    onPress={() => {
                      quick((s) => {
                        s.editingState.deleteConfirmationModalOpen = true;
                        s.editingState.deleteConfirmationResponse =
                          repertoireMove;
                      });
                    }}
                  >
                    <CMText style={s(c.clickable)}>
                      <i
                        style={s(c.fg(c.colors.failureColor), c.fontSize(18))}
                        className={`fa-regular fa-trash`}
                      ></i>
                    </CMText>
                  </Pressable>
                </>
              )}
            </View>
          </View>
          {suggestedMove && positionReport && (
            <>
              <Spacer height={12} />
              <View style={s(isMobile ? c.column : c.row, c.selfStretch)}>
                <ResponseStatSection
                  {...{
                    masters: false,
                    positionReport,
                    side,
                    m: suggestedMove,
                  }}
                />
                <Spacer width={12} height={12} isMobile={isMobile} />
                <ResponseStatSection
                  {...{
                    masters: true,
                    positionReport,
                    side,
                    m: suggestedMove,
                  }}
                />
              </View>
              <Spacer height={12} />
              <View style={s(c.row, c.constrainWidth, c.flexWrap, c.gap(8))}>
                {intersperse(
                  tags.map((tag, i) => {
                    let [foreground, background] = getTagColors(tag.type);
                    let icon = getTagIcon(tag.type);
                    return (
                      <View
                        style={s(
                          c.bg(background),
                          c.border(`1px solid ${c.grays[5]}`),
                          c.br(2),
                          c.px(8),
                          c.py(4),
                          c.row
                        )}
                      >
                        {icon && (
                          <>
                            <CMText style={s(c.fg(foreground))}>
                              <i className={getTagIcon(tag.type)} />
                            </CMText>
                            <Spacer width={4} />
                          </>
                        )}
                        <CMText style={s(c.fg(foreground), c.weightBold)}>
                          {tag.type}
                        </CMText>
                      </View>
                    );
                  }),
                  (i) => {
                    return null;
                  }
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const OpeningTree = ({
  repertoire,
  state,
  grade,
}: {
  repertoire: RepertoireSide;
  grade: RepertoireGrade;
  state: RepertoireState;
}) => {
  return (
    <View style={s()}>
      {state.hasPendingLineToAdd &&
        (state.pendingResponses[state.divergencePosition] ?? []).map((move) => {
          return (
            <OpeningNode
              key={`pending-${move.epdAfter}`}
              seenEpds={new Set()}
              line={dropRight(
                state.currentLine,
                keys(state.pendingResponses).length
              )}
              state={state}
              grade={grade}
              move={move}
              repertoire={repertoire}
            />
          );
        })}
      {!state.hasPendingLineToAdd &&
        (
          state.repertoire[state.activeSide].positionResponses[
            state.getCurrentEpd(state)
          ] ?? []
        ).map((move) => {
          return (
            <OpeningNode
              key={move.epdAfter}
              seenEpds={new Set()}
              line={state.currentLine}
              state={state}
              grade={grade}
              move={move}
              repertoire={repertoire}
            />
          );
        })}
    </View>
  );
};

const OpeningNode = ({
  move,
  grade,
  seenEpds: _seenEpds,
  state,
  repertoire,
  responseQueue,
  line,
}: {
  move: RepertoireMove;
  line?: string[];
  responseQueue?: RepertoireMove[];
  seenEpds: Set<string>;
  grade: RepertoireGrade;
  state: RepertoireState;
  repertoire: RepertoireSide;
}) => {
  // let incidence = grade?.moveIncidence[move.id];
  let responses =
    state.repertoire[state.activeSide].positionResponses[move.epdAfter];
  if (isEmpty(responses)) {
    responses = state.pendingResponses[move.epdAfter];
  }
  let trueDepth = line?.length ?? 0;
  // let trueDepth = 0;
  let assumedDepth = state.currentLine.length;
  let depthDifference = trueDepth - assumedDepth;
  let moveNumber = Math.floor(trueDepth / 2) + 1;
  let cumulativeLine = null;
  let seenEpds = new Set(_seenEpds);
  seenEpds.add(move.epd);
  if (line) {
    cumulativeLine = [...line, move.sanPlus];
  } else {
  }
  // let responses = [];
  return (
    <View style={s(c.pl(2))}>
      <Pressable
        onPress={() => {
          let pgn = lineToPgn(cumulativeLine);
          state.playPgn(pgn);
        }}
      >
        <View
          style={s(
            c.row,
            c.br(2),
            c.px(4),
            // c.bg(c.grays[20]),
            c.my(0),
            c.py(2),
            c.justifyBetween
          )}
        >
          <CMText
            style={s(
              c.fg(
                move.mine || true || move.pending ? c.grays[85] : c.grays[70]
              ),
              c.weightSemiBold

              // move.mine ? c.weightBold : c.weightRegular
            )}
          >
            {trueDepth % 2 === 0 ? `${moveNumber}.` : null}
            {move.sanPlus}
            {responses && depthDifference >= DEPTH_CUTOFF && "…"}
            {move.pending && (
              <CMText style={s(c.opacity(60), c.weightSemiBold)}>
                {" "}
                [pending]
              </CMText>
            )}
          </CMText>
          {/*incidence && !move.mine && (
            <>
              <Spacer width={0} grow />
              <CMText style={s(c.fg(c.colors.textSecondary))}>
                {formatIncidence(incidence)}
              </CMText>
            </>
          )*/}

          {/*
          <Spacer width={12} />
          <CMText style={s(c.clickable)}>
            <i
              style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
              className={`fas fa-trash`}
            ></i>
          </CMText>
          */}
        </View>
      </Pressable>
      {depthDifference < DEPTH_CUTOFF && (
        <View
          style={s(c.pl(10), c.ml(6), c.borderLeft(`1px solid ${c.grays[25]}`))}
        >
          <View style={s()}>
            {intersperse(
              (responses || [])
                .filter((m) => !seenEpds.has(m.epdAfter))
                .map((move) => {
                  return (
                    <OpeningNode
                      key={move.epdAfter}
                      seenEpds={seenEpds}
                      line={cumulativeLine}
                      repertoire={repertoire}
                      state={state}
                      move={move}
                      responseQueue={responseQueue && drop(responseQueue, 1)}
                      grade={grade}
                    />
                  );
                }),
              (i) => {
                return <Spacer key={i} height={0} />;
              }
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const SectionDivider = () => {
  const isMobile = useIsMobile();
  return (
    <View
      style={s(c.selfStretch, c.width(1), c.bg(c.grays[18]), c.mx(24))}
    ></View>
  );
};

const EditEtcModal = () => {
  let [open, activeSide, exportPgn, deleteRepertoire, quick] =
    useRepertoireState(
      (s) => [
        s.editingState.etcModalOpen,
        s.activeSide,
        s.exportPgn,
        s.deleteRepertoire,
        s.quick,
      ],
      shallow
    );
  const isMobile = useIsMobile();
  return (
    <Modal
      onClose={() => {
        quick((s) => {
          s.editingState.etcModalOpen = false;
        });
      }}
      visible={open}
    >
      <View style={s(c.maxWidth(500))}>
        <View
          style={s(
            c.column,
            c.alignStretch,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fas fa-arrow-down-to-line"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Export
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Export your {activeSide} repertoire to a PGN file. You can
                import this file into a Lichess study, ChessBase, Chessable
                course, etc.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(c.buttons.primary, c.height(36), c.selfEnd)}
                onPress={() => {
                  exportPgn(activeSide);
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Export</CMText>
              </Button>
            </View>
          </View>
        </View>
        <View
          style={s(
            c.column,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fa-regular fa-trash"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Delete
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Delete your entire {activeSide} repertoire. This cannot be
                undone.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(
                  c.buttons.primary,
                  c.bg(c.failureShades[50]),
                  c.height(36),
                  c.selfEnd
                )}
                onPress={() => {
                  deleteRepertoire(activeSide);
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
  let DEBUG_MOVE = "Nf6";
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

const getPlayRate = (
  m: SuggestedMove,
  report: PositionReport,
  masters?: boolean
): number => {
  let k = masters ? "masterResults" : "results";
  return getTotalGames(m[k]) / getTotalGames(report[k]);
};

interface ResponseTag {
  type: ResponseTagType;
}

enum ResponseTagType {
  Sound = "Sound",
  // Dubious = "Dubious",
  Gambit = "Gambit",
  HighWinrate = "High win-rate",
  MasterApproved = "GM-approved",
  YourMove = "Your move",
  Covered = "Covered",
}

const genMoveTags = (
  m: SuggestedMove,
  positionReport: PositionReport,
  epd: string,
  side: Side
): ResponseTag[] => {
  let tags = [];
  // let r = find(
  //   repertoire.positionResponses[epd],
  //   (r) => r.sanPlus === m.sanPlus
  // );
  // if (r) {
  //   if (r.mine) {
  //     tags.push({ type: ResponseTagType.YourMove });
  //   } else {
  //     tags.push({ type: ResponseTagType.Covered });
  //   }
  // }
  // if (m.stockfish?.eval && positionReport.stockfish?.eval) {
  //   if (Math.abs(m.stockfish.eval - positionReport.stockfish.eval) <= 30) {
  //     tags.push({ type: ResponseTagType.Sound });
  //   }
  // }
  // if (getPlayRate(m, positionReport, true) > 0.05) {
  //   tags.push({ type: ResponseTagType.MasterApproved });
  // }
  // if (
  //   getWinRate(m.results, side) > 0.5 &&
  //   getPlayRate(m, positionReport) > 0.05
  // ) {
  //   tags.push({ type: ResponseTagType.HighWinrate });
  // }
  return tags;
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

const getTagColors = (tagType: ResponseTagType): [string, string] => {
  let defaultBg = c.grays[20];
  let defaultFg = c.grays[80];
  switch (tagType) {
    case ResponseTagType.Sound:
      return [defaultFg, defaultBg];
    case ResponseTagType.Gambit:
      return [defaultFg, defaultBg];
    case ResponseTagType.HighWinrate:
      return [defaultFg, defaultBg];
    case ResponseTagType.MasterApproved:
      return [defaultFg, defaultBg];
    case ResponseTagType.YourMove:
      return [c.grays[90], c.primaries[35]];
    case ResponseTagType.Covered:
      return [defaultFg, defaultBg];
  }
};

const getTagIcon = (tagType: ResponseTagType): string => {
  switch (tagType) {
    case ResponseTagType.Sound:
      return null;
    case ResponseTagType.Gambit:
      return null;
    case ResponseTagType.HighWinrate:
      return null;
    case ResponseTagType.MasterApproved:
      return null;
    case ResponseTagType.YourMove:
      return null;
    case ResponseTagType.Covered:
      return "fa fa-check";
  }
};

const AddPendingLineButton = () => {
  const [isAddingPendingLine, addPendingLine] = useRepertoireState((s) => [
    s.isAddingPendingLine,
    s.addPendingLine,
  ]);
  const isMobile = useIsMobile();
  return (
    <Button
      style={s(
        c.buttons.primary,
        c.height(36),
        c.selfStretch,
        c.bg(c.purples[45])
      )}
      isLoading={isAddingPendingLine}
      loaderProps={{ color: c.grays[75] }}
      onPress={() => {
        addPendingLine();
      }}
    >
      <CMText style={s(c.buttons.primary.textStyles)}>
        <i
          className="fas fa-check"
          style={s(c.fg(c.grays[90]), c.fontSize(14))}
        />
        <Spacer width={8} />
        <CMText
          style={s(c.weightBold, c.fg(c.colors.textPrimary), c.fontSize(14))}
        >
          Save to repertoire
        </CMText>
      </CMText>
    </Button>
  );
};

const EditingTabPicker = () => {
  const [selectedTab, quick] = useRepertoireState(
    (s) => [s.editingState.selectedTab, s.quick],
    shallow
  );
  return (
    <View style={s(c.column)}>
      <SelectOneOf
        tabStyle
        containerStyles={s(c.fullWidth, c.justifyBetween)}
        choices={[
          EditingTab.Position,
          EditingTab.Responses,
          EditingTab.MoveLog,
        ]}
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
      <Spacer height={12} />

      {selectedTab === EditingTab.Position && <PositionOverview />}
      {selectedTab === EditingTab.Responses && <Responses />}
      {selectedTab === EditingTab.MoveLog && (
        <View style={s(c.column, c.alignCenter)}>
          <MoveLog />
        </View>
      )}
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
    }, shallow);
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

const MoveOverrideWarning = () => {
  const [numMovesWouldBeDeleted] = useRepertoireState(
    (s) => [s.numMovesWouldBeDeleted],
    shallow
  );
  if (isNil(numMovesWouldBeDeleted) || numMovesWouldBeDeleted === 0) {
    return null;
  }
  return (
    <View
      style={s(
        c.mx(6),
        c.py(4),
        c.br(2),
        c.px(6),
        c.bg(c.yellows[90]),
        c.row,
        c.justifyStart,
        c.alignCenter
      )}
    >
      <i
        className="fa-regular fa-triangle-exclamation"
        style={s(c.fontSize(20), c.fg(c.yellows[50]))}
      ></i>
      <Spacer width={8} />
      <CMText style={s(c.fg(c.colors.textInverse), c.fontSize(12))}>
        Adding this line will replace <b>{numMovesWouldBeDeleted}</b> responses
        in your repertoire
      </CMText>
    </View>
  );
};
function debugEquality(a: any[], b: any[]): boolean {
  return every(
    map(zip(a, b), ([a, b]) => {
      if (a === b) {
        return true;
      } else {
        return false;
      }
    })
  );
}
