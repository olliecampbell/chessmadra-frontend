import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
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
  forEach,
} from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import {
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
import { failOnTrue } from "app/utils/test_settings";

type BackControlsProps = {
  state: RepertoireState;
};

export const BackControls: React.FC<BackControlsProps> = ({ state }) => {
  let backButtonActive = state.position.history().length > 0;
  return (
    <View style={s(c.row)}>
      <Button
        style={s(c.buttons.basicSecondary, c.height(42), c.width(64))}
        onPress={() => {
          state.backToStartPosition();
        }}
      >
        <i
          className="fas fa-angles-left"
          style={s(c.buttons.basicSecondary.textStyles, c.fontSize(18))}
        />
      </Button>
      <Spacer width={12} />
      <Button
        style={s(c.buttons.basicSecondary, c.height(42), c.grow)}
        onPress={() => {
          state.backOne();
        }}
      >
        <i
          className="fas fa-angle-left"
          style={s(c.buttons.basicSecondary.textStyles, c.fontSize(18))}
        />
      </Button>
    </View>
  );
};

type MoveLogProps = {
  state: RepertoireState;
  setConfirmMoveDeleteModalOpen: (_: boolean) => void;
};

export const MoveLog = ({ state }: { state: RepertoireState }) => {
  let pairs = [];
  let currentPair = [];
  let moveList = state.position.history({ verbose: true });
  forEach(moveList, (move, i) => {
    if (move.color == "b" && isEmpty(currentPair)) {
      pairs.push([{}, { move, i }]);
      return;
    }
    currentPair.push({ move, i });
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
  const moveStyles = s(
    c.width(50),
    c.weightBold,
    c.fullHeight,
    c.clickable,
    c.selfStretch,
    c.alignStart,
    c.justifyCenter,
    c.column,
    c.fontSize(22),
    c.fg(c.colors.textPrimary)
  );
  return (
    <View style={s(c.column, c.br(2))}>
      {intersperse(
        pairs.map((pair, i) => {
          const [
            { move: whiteMove, i: whiteI },
            { move: blackMove, i: blackI },
          ] = pair;
          const activeMoveStyles = s(c.weightBlack, c.fontSize(20));
          return (
            <View key={`pair-${i}`} style={s(c.column, c.overflowHidden)}>
              <View style={s(c.row, c.alignStretch, c.py(8))}>
                <View style={s(c.width(35), c.center)}>
                  <CMText
                    style={s(
                      c.fg(c.colors.textSecondary),
                      c.fontSize(18),
                      c.weightSemiBold
                    )}
                  >
                    {i + 1}.
                  </CMText>
                </View>
                <Spacer width={4} />
                <Pressable onPress={() => {}}>
                  <CMText style={s(moveStyles)}>
                    {whiteMove?.san ?? "..."}
                  </CMText>
                </Pressable>
                <Pressable onPress={() => {}}>
                  <CMText style={s(moveStyles)}>{blackMove?.san}</CMText>
                </Pressable>
              </View>
            </View>
          );
        }),
        (i) => {
          return <Spacer height={12} key={i} />;
        }
      )}
    </View>
  );
};

export const OldMoveLog: React.FC<MoveLogProps> = ({
  state,
  setConfirmMoveDeleteModalOpen,
}) => {
  const isMobile = useIsMobile();
  const side = state.activeSide;
  let hasNoMovesThisSide = isEmpty(state.repertoire[side]?.positionResponses);
  let grade = state.repertoireGrades[state.activeSide];
  return (
    <View
      style={s(
        c.bg(c.grays[20]),
        c.br(4),
        c.overflowHidden,
        // c.maxHeight(300),
        c.height(isMobile ? 220 : 260),
        c.column
      )}
    >
      {hasNoMovesThisSide && !state.showPendingMoves ? (
        <View style={s(c.column, c.selfCenter, c.center, c.grow, c.px(12))}>
          <CMText>
            <i
              className="fa-light fa-empty-set"
              style={s(c.fg(c.grays[50]), c.fontSize(24))}
            />
          </CMText>
          <Spacer height={12} />
          <CMText style={s(c.fg(c.grays[85]))}>
            You don't have any moves in your repertoire yet! Play a line on the
            board to add it.
          </CMText>
          <Spacer height={12} />
          <CMText style={s(c.fg(c.grays[85]), c.selfStart)}>
            {state.activeSide === "black"
              ? "Maybe start with a response to e4?"
              : "e4 and d4 are the most popular first moves for white, maybe one of those?"}
          </CMText>
        </View>
      ) : (
        <>
          {state.moveLog && (
            <View
              style={s(
                c.bg(c.grays[15]),
                c.py(12),
                c.px(12),
                c.row,
                c.alignCenter
              )}
            >
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.weightSemiBold,
                  c.minHeight("1em")
                )}
              >
                {state.moveLog}
              </CMText>
              <Spacer grow width={12} />
              <Button
                style={s(
                  c.buttons.basic,
                  c.bg("none"),
                  c.border(`1px solid ${c.failureShades[55]}`),
                  c.px(6),
                  c.py(6)
                )}
                onPress={() => {
                  setConfirmMoveDeleteModalOpen(true);
                }}
              >
                <i
                  className="fa-regular fa-trash"
                  style={s(c.fg(c.failureShades[55]), c.fontSize(14))}
                />
              </Button>
            </View>
          )}
          <View style={s(c.flexShrink(1), c.grow)}>
            <View
              style={s(
                c.px(12),
                c.py(8),
                c.fullHeight,
                c.fullWidth,

                c.scrollY
              )}
            >
              <OpeningTree
                state={state}
                repertoire={state.repertoire.white}
                grade={grade}
              />
              {!state.showPendingMoves &&
                isEmpty(
                  state.repertoire[state.activeSide].positionResponses[
                    state.getCurrentEpd(state)
                  ]
                ) && (
                  <View
                    style={s(
                      c.column,
                      c.selfCenter,
                      c.center,
                      c.grow,
                      c.px(12)
                    )}
                  >
                    <CMText
                      style={s(
                        c.fg(c.grays[75]),
                        c.textAlign("center"),
                        c.weightSemiBold
                      )}
                    >
                      Play a move on the board to add a response
                    </CMText>
                  </View>
                )}
            </View>
          </View>
          {/*!isNil(biggestMiss) && !state.divergencePosition && biggestMissRow*/}
          {state.showPendingMoves && (
            <>
              {!isNil(state.numMovesWouldBeDeleted) &&
                state.numMovesWouldBeDeleted > 0 && (
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
                    <CMText
                      style={s(c.fg(c.colors.textInverse), c.fontSize(12))}
                    >
                      Adding this line will replace{" "}
                      <b>{state.numMovesWouldBeDeleted}</b> responses in your
                      repertoire
                    </CMText>
                  </View>
                )}
              <View
                style={s(
                  c.py(12),
                  c.px(12),
                  c.row,
                  c.justifyEnd,
                  c.alignCenter
                )}
              >
                <Button
                  style={s(c.buttons.primary, c.height(36))}
                  isLoading={state.isAddingPendingLine}
                  loaderProps={{ color: c.grays[75] }}
                  onPress={() => {
                    state.addPendingLine();
                  }}
                >
                  <CMText style={s(c.buttons.primary.textStyles)}>
                    <i
                      className="fa-regular fa-plus"
                      style={s(c.fg(c.grays[90]))}
                    />
                    <Spacer width={6} />
                    <CMText style={s(c.weightBold)}>Add line</CMText>
                  </CMText>
                </Button>
              </View>
            </>
          )}

          {/*
          {state.currentLine && (
            <CMText style={s(c.weightSemiBold, c.fg(c.colors.textSecondary))}>
              {lineToPgn(state.currentLine)}
            </CMText>
          )}
          */}
        </>
      )}
    </View>
  );
};

export const RepertoireEditingView = ({
  state,
  backToOverviewRow,
}: {
  state: RepertoireState;
  backToOverviewRow: any;
}) => {
  const isMobile = useIsMobile();
  let side = state.activeSide;
  const {
    open: confirmMoveDeleteModalOpen,
    setOpen: setConfirmMoveDeleteModalOpen,
    modal: confirmMoveDeleteModal,
  } = useModal({
    content: (
      <ConfirmMoveDeleteModal
        {...{
          state,
          setConfirmMoveDeleteModalOpen: (...args) => {
            setConfirmMoveDeleteModalOpen(...args);
          },
        }}
      />
    ),
    isOpen: false,
  });
  const {
    open: editEtcModalOpen,
    setOpen: setEditEtcModalOpen,
    modal: editEtcModal,
  } = useModal({
    content: <EditEtcModal state={state} />,
    isOpen: false,
  });

  let biggestMiss = state.repertoireGrades?.[state.activeSide]?.biggestMiss;
  let biggestMissRow = createBiggestMissRow(state, state.activeSide);
  let positionReport = state.getCurrentPositionReport();
  return (
    <>
      {confirmMoveDeleteModal}
      {editEtcModal}
      <View style={s(c.containerStyles(isMobile))}>
        <View style={s(c.row, c.selfCenter)}>
          <View style={s(c.column)}>
            {backToOverviewRow}
            <View style={s(c.size(380))}>
              <ChessboardView state={state} />
            </View>
            <Spacer height={12} />
            <BackControls state={state} />
            <Spacer height={12} />
            {positionReport?.stockfish && (
              <View style={s(c.mb(12))}>
                <CMText style={s(c.fg(c.grays[50]))}>Stockfish eval</CMText>
                <Spacer height={4} />
                <CMText
                  style={s(c.fg(c.grays[80]), c.weightBold, c.fontSize(18))}
                >
                  {formatStockfishEval(positionReport.stockfish)}
                </CMText>
              </View>
            )}
            {positionReport && (
              <View style={s(c.height(18), c.fullWidth)}>
                <CMText style={s(c.fg(c.grays[50]))}>
                  Results at your level
                </CMText>
                <Spacer height={4} />
                <GameResultsBar gameResults={positionReport.results} />
                {positionReport.masterResults && (
                  <>
                    <Spacer height={12} />
                    <CMText style={s(c.fg(c.grays[50]))}>
                      Results at master level
                    </CMText>
                    <Spacer height={4} />
                    <GameResultsBar
                      gameResults={positionReport.masterResults}
                    />
                  </>
                )}
              </View>
            )}
          </View>
          <SectionDivider />
          <MoveLog {...{ setConfirmMoveDeleteModalOpen, state }} />
          <SectionDivider />
          <Responses {...{ state }} />
        </View>
      </View>
      <Spacer height={12} />
    </>
  );
  return <div></div>;
};

const Responses = ({ state }: { state: RepertoireState }) => {
  let positionReport = state.getCurrentPositionReport();
  if (!positionReport) {
    return (
      <View style={s(c.width(400))}>
        <BeatLoader color={c.grays[100]} size={20} />
      </View>
    );
  }
  let moveNumber = Math.floor(state.currentLine.length / 2) + 1;
  let side: Side = state.position.turn() === "b" ? "black" : "white";
  let positionWinRate = getWinRate(positionReport.results, side);
  let numberStyles = s(
    c.weightBold,
    c.fontSize(14),
    c.width(45),
    c.fg(c.colors.textPrimary),
    c.unshrinkable,
    c.mr(6)
  );
  let textStyles = s(
    c.weightRegular,
    c.fontSize(14),
    c.fg(c.colors.textSecondary)
  );
  let badTextColor = c.failureShades[60];
  let neutralTextColor = c.grays[60];
  let goodTextColor = c.successShades[60];
  return (
    <View style={s(c.column, c.width(400))}>
      {isNil(state.user.eloRange) && (
        <>
          <EloWarningBox state={state} />
          <Spacer height={12} />
        </>
      )}
      <CMText style={s(c.fg(c.colors.textPrimary))}>Responses</CMText>
      <Spacer height={12} />
      {intersperse(
        take(
          (side === state.activeSide
            ? suggestedMovesByEffectiveness
            : suggestedMovesByPopularity)(positionReport, side),
          5
        ).map((m, i) => {
          if (m.sanPlus === "f4") {
            console.log("move", m.results);
            console.log("overall", positionReport.results);
          }
          let moveWinRate = getWinRate(m.results, side);
          let tags = genMoveTags(m, positionReport, side);
          console.log({ tags });
          return (
            <Pressable
              onPress={() => {
                state.playSan(m.sanPlus);
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
                <View style={s(c.column, c.grow)}>
                  <View style={s(c.row, c.justifyBetween, c.fullWidth)}>
                    <View style={s(c.row, c.alignEnd)}>
                      <CMText
                        style={s(
                          c.fg(c.grays[60]),
                          c.weightSemiBold,
                          c.fontSize(16)
                        )}
                      >
                        {moveNumber}
                        {side === "black" ? "... " : "."}
                      </CMText>
                      <Spacer width={2} />
                      <CMText
                        key={m.sanPlus}
                        style={s(
                          c.fg(c.grays[85]),
                          c.fontSize(18),
                          c.weightSemiBold,
                          c.keyedProp("letterSpacing")("0.04rem")
                        )}
                      >
                        {m.sanPlus}
                      </CMText>
                    </View>
                    {m.stockfish && (
                      <>
                        <Spacer width={0} grow />
                        <View style={s(c.row, c.alignEnd)}>
                          <CMText
                            style={s(
                              c.weightSemiBold,
                              c.fontSize(14),
                              isGoodStockfishEval(m.stockfish, state.activeSide)
                                ? c.fg(goodTextColor)
                                : c.fg(badTextColor)
                            )}
                          >
                            {formatStockfishEval(m.stockfish)}
                          </CMText>
                        </View>
                      </>
                    )}
                  </View>
                  <Spacer height={12} />
                  <View style={s(c.row, c.alignEnd)}>
                    <CMText
                      style={s(
                        numberStyles,
                        moveWinRate > 0.5
                          ? c.fg(goodTextColor)
                          : moveWinRate < 0.4
                          ? c.fg(badTextColor)
                          : c.fg(neutralTextColor)
                      )}
                    >
                      {formatWinPercentage(moveWinRate)}{" "}
                    </CMText>
                    {/* TODO: need to add moves from repertoire that are uncovered (odd moves)*/}
                    <CMText style={s(textStyles)}>
                      win-rate at your level
                    </CMText>
                  </View>
                  <Spacer height={8} />
                  <View style={s(c.row, c.alignEnd)}>
                    <CMText style={s(numberStyles)}>
                      {formatPlayPercentage(getPlayRate(m, positionReport))}{" "}
                    </CMText>
                    {/* TODO: need to add moves from repertoire that are uncovered (odd moves)*/}
                    <CMText style={s(textStyles)}>
                      of your peers play this
                    </CMText>
                  </View>
                  <Spacer height={8} />
                  <View style={s(c.row, c.alignEnd)}>
                    <CMText style={s(numberStyles)}>
                      {formatPlayPercentage(
                        getPlayRate(m, positionReport, true)
                      )}{" "}
                    </CMText>
                    {/* TODO: need to add moves from repertoire that are uncovered (odd moves)*/}
                    <CMText style={s(textStyles)}>of masters play this</CMText>
                  </View>
                  <Spacer height={12} />
                  <View style={s(c.row)}>
                    {intersperse(
                      tags.map((tag, i) => {
                        return (
                          <View
                            style={s(
                              c.bg(c.primaries[70]),
                              c.br(2),
                              c.px(4),
                              c.py(4)
                            )}
                          >
                            <CMText
                              style={s(c.fg(c.colors.textInverse),
                              c.weightBold,
                              )}
                            >
                              {tag.type}
                            </CMText>
                          </View>
                        );
                      }),
                      (i) => {
                        return <Spacer width={4} key={i} />;
                      }
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return <Spacer height={12} key={i} />;
        }
      )}
    </View>
  );
};

const ExternalLinks = ({
  state,
  setEditEtcModalOpen,
}: {
  state: RepertoireState;
  setEditEtcModalOpen: (_: boolean) => void;
}) => {
  return (
    <>
      <View style={s(c.row, c.fullWidth)}>
        <Button
          style={s(
            c.buttons.basicInverse,
            c.height(42),
            c.flexible,
            c.grow,
            c.bg(c.grays[20])
          )}
          onPress={() => {
            state.analyzeLineOnLichess(state.activeSide);
          }}
        >
          <CMText
            style={s(
              c.buttons.basicInverse.textStyles,
              c.fg(c.colors.textPrimary)
            )}
          >
            <i
              style={s(c.fontSize(14), c.fg(c.grays[60]))}
              className="fas fa-search"
            ></i>
            <Spacer width={8} />
            Analyze
          </CMText>
        </Button>
        <Spacer width={12} />
        <Button
          style={s(
            c.buttons.basicInverse,
            c.height(42),
            c.flexible,
            c.grow,
            c.grow,
            c.bg(c.grays[20])
          )}
          onPress={() => {
            state.searchOnChessable();
          }}
        >
          <CMText
            style={s(
              c.buttons.basicInverse.textStyles,
              c.fg(c.colors.textPrimary)
            )}
          >
            <i
              style={s(c.fontSize(14), c.fg(c.grays[60]))}
              className="fas fa-book-open"
            ></i>
            <Spacer width={8} />
            Chessable
          </CMText>
        </Button>
      </View>
      <Spacer height={12} />
      <Button
        style={s(
          c.buttons.basicInverse,
          c.height(36),
          c.selfEnd,
          c.bg(c.grays[20])
        )}
        onPress={() => {
          setEditEtcModalOpen(true);
        }}
      >
        <CMText
          style={s(
            c.buttons.basicInverse.textStyles,
            c.fg(c.colors.textPrimary)
          )}
        >
          <i
            style={s(c.fontSize(14), c.fg(c.grays[60]))}
            className="fas fa-ellipsis"
          ></i>
        </CMText>
      </Button>
    </>
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
      {state.showPendingMoves &&
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
      {!state.showPendingMoves &&
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
  seenEpds: Set<String>;
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

function createBiggestMissRow(state: RepertoireState, side: string) {
  let biggestMiss = state.repertoireGrades[side]?.biggestMiss as RepertoireMiss;
  if (!biggestMiss) {
    return null;
  }
  return (
    <Pressable
      onPress={() => {
        state.quick((s) => {
          state.startEditing(side as Side, s);
          state.playPgn(biggestMiss.lines[0], s);
        });
      }}
    >
      <View
        style={s(
          c.bg(c.grays[15]),
          c.py(12),
          c.px(12),
          c.column,
          c.justifyBetween,
          c.alignCenter
        )}
      >
        <View style={s(c.row, c.selfStart)}>
          <CMText
            style={s(
              c.fg(c.colors.textSecondary),
              c.fontSize(12),
              c.weightSemiBold,
              c.weightBold,
              c.selfStart
            )}
          >
            Biggest miss -
          </CMText>
          <Spacer width={4} />
          <CMText
            style={s(
              c.fg(c.colors.textSecondary),
              c.fontSize(12),
              c.weightSemiBold,
              c.weightBold,
              c.selfStart
            )}
          >
            {formatIncidence(biggestMiss.incidence)} of games
          </CMText>
        </View>
        <Spacer height={2} />
        <CMText
          style={s(
            c.constrainWidth,
            c.fg(c.colors.textPrimary),
            c.weightSemiBold,
            c.fontSize(13),
            c.weightBold,
            c.selfStart,
            c.pb(2),
            c.overflowHidden,
            c.keyedProp("textOverflow")("ellipsis"),
            c.whitespace("nowrap"),
            c.borderBottom(`1px solid ${c.grays[40]}`)
          )}
        >
          {biggestMiss?.lines[0]}
        </CMText>
      </View>
    </Pressable>
  );
}

const SectionDivider = () => {
  const isMobile = useIsMobile();
  return (
    <View
      style={s(c.selfStretch, c.width(1), c.bg(c.grays[20]), c.mx(24))}
    ></View>
  );
};

const EditEtcModal = ({ state }: { state: RepertoireState }) => {
  const isMobile = useIsMobile();
  return (
    <>
      <View
        style={s(c.column, c.px(isMobile ? 12 : 24), c.py(isMobile ? 12 : 24))}
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
              Export your {state.activeSide} repertoire to a PGN file. You can
              import this file into a Lichess study, ChessBase, Chessable
              course, etc.
            </CMText>
            <Spacer height={12} />
            <Button
              style={s(c.buttons.primary, c.height(36), c.selfEnd)}
              onPress={() => {
                state.exportPgn(state.activeSide);
              }}
            >
              <CMText style={s(c.buttons.primary.textStyles)}>Export</CMText>
            </Button>
          </View>
        </View>
      </View>
      <View
        style={s(c.column, c.px(isMobile ? 12 : 24), c.py(isMobile ? 12 : 24))}
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
              Delete your entire {state.activeSide} repertoire. This cannot be
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
                state.deleteRepertoire(state.activeSide);
              }}
            >
              <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
            </Button>
          </View>
        </View>
      </View>
    </>
  );
};

const ConfirmMoveDeleteModal = ({
  state,
  setConfirmMoveDeleteModalOpen,
}: {
  state: RepertoireState;
  setConfirmMoveDeleteModalOpen: (_: boolean) => void;
}) => {
  let countToDelete =
    state.getMovesDependentOnPosition(state.divergencePosition) + 1;
  return (
    <>
      <View
        style={s(
          c.column,
          c.alignStart,
          c.bg(c.grays[15]),
          c.px(16),
          c.py(16),
          c.br(8)
        )}
      >
        <CMText
          style={s(
            c.fg(c.colors.textPrimary),
            c.flexShrink(1),
            c.fontSize(14),
            c.lineHeight("1.7em")
          )}
        >
          Are you sure you want to delete {pluralize(countToDelete, "move")}{" "}
          starting with {state.moveLog} ?
        </CMText>
        <Spacer height={18} />
        <View style={s(c.row, c.justifyBetween, c.fullWidth)}>
          <Button
            style={s(c.buttons.outlineLight, c.height(36), c.selfEnd)}
            onPress={() => {
              setConfirmMoveDeleteModalOpen(false);
            }}
          >
            <CMText style={s(c.buttons.outlineLight.textStyles)}>Cancel</CMText>
          </Button>
          <Spacer width={12} grow />
          <Button
            style={s(
              c.buttons.primary,
              c.height(36),
              c.selfEnd,
              c.bg(c.failureShades[50])
            )}
            isLoading={state.isDeletingMove}
            loaderProps={{ color: c.grays[75] }}
            onPress={() => {
              state.deleteCurrentMove(() => {
                setConfirmMoveDeleteModalOpen(false);
              }, state);
            }}
          >
            <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
          </Button>
        </View>
      </View>
    </>
  );
};
function formatStockfishEval(stockfish: StockfishReport) {
  let debug = failOnTrue(true)
  let x = ""
  if (!isNil(stockfish.eval)) {
    if (stockfish.eval >= 0) {
      x = `+${(stockfish.eval / 100).toFixed(2)}`;
    } else {
      x = `${(stockfish.eval / 100).toFixed(2)}`;
    }
  } else if (stockfish.mate) {
    if (stockfish.mate < 0) {
      x = `-M${Math.abs(stockfish.mate)}`;
    } else {
      x = `M${stockfish.mate}`;
    }
  }
  if (debug) {
      x += ` (${stockfish.nodesK}k)`
    }
  return x;
}

function getTotalGames(results: GameResultsDistribution) {
  return results.draw + results.black + results.white;
}

const formatPlayPercentage = (x: number) => {
  return `${(x * 100).toFixed(1)}%`;
};

const formatWinPercentage = (x: number) => {
  return `${(x * 100).toFixed(0)}%`;
};
const isGoodStockfishEval = (stockfish: StockfishReport, side: Side) => {
  if (stockfish.eval && stockfish.eval >= 0 && side === "white") {
    return true;
  }
  if (stockfish.mate && stockfish.mate > 0 && side === "white") {
    return true;
  }
  if (stockfish.eval && stockfish.eval <= 0 && side === "black") {
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
  weights: { eval: number; winrate: number; playrate: number }
): SuggestedMove[] => {
  let positionWinRate = getWinRate(report.results, side);
  let DEBUG_MOVE = null;
  return reverse(
    sortBy(report.suggestedMoves, (m) => {
      let score = 0;
      if (m.stockfish?.mate < 0 && side === "black") {
        score += 1000000;
      }
      if (m.stockfish?.mate > 0 && side === "white") {
        score += 1000000;
      }
      if (!isNil(m.stockfish?.eval) && !isNil(report.stockfish?.eval)) {
        let eval_loss = Math.max(report.stockfish.eval + m.stockfish.eval, 0);
        let scoreChangeEval = eval_loss * weights.eval;
        score += scoreChangeEval;
        if (m.sanPlus === DEBUG_MOVE) {
          console.log(
            `For ${m.sanPlus}, the eval_loss is ${eval_loss}, Score change is ${scoreChangeEval}`
          );
        }
      }
      let moveWinRate = getWinRate(m.results, side);
      let winrateChange = moveWinRate - positionWinRate;
      let scoreForWinrate = winrateChange * weights.winrate;
      if (getTotalGames(m.results) > 5) {
        score += scoreForWinrate;
      }
      let playRate = getPlayRate(m, report);
      let scoreForPlayrate = playRate * weights.playrate;
      score += scoreForPlayrate;
      if (m.sanPlus === DEBUG_MOVE) {
        console.log(
          `For ${m.sanPlus}, the winrate is ${positionWinRate} -> ${moveWinRate} : ${winrateChange}, Score change is ${scoreForWinrate}`
        );
        console.log(
          `For ${m.sanPlus}, the playrate is ${playRate}, Score change is ${scoreForPlayrate}`
        );
      }
      return score;
    })
  );
};

const suggestedMovesByEffectiveness = (
  report: PositionReport,
  side: Side
): SuggestedMove[] => {
  return sortSuggestedMoves(report, side, {
    eval: 1.0,
    winrate: 500.0,
    playrate: 400.0,
  });
};

function getWinRate(x: GameResultsDistribution, side: string) {
  return x[side] / getTotalGames(x);
}

const suggestedMovesByPopularity = (
  report: PositionReport,
  side: Side
): SuggestedMove[] => {
  return sortSuggestedMoves(report, side, {
    eval: 0.0,
    winrate: 0.0,
    playrate: 1.0,
  });
};

const getPlayRate = (
  m: SuggestedMove,
  report: PositionReport,
  masters?: boolean
): number => {
  let k = masters ? "masterResults" : "results";
  return getTotalGames(m[k]) / getTotalGames(report[k]);
};

const GameResultsBar = ({
  gameResults,
}: {
  gameResults: GameResultsDistribution;
}) => {
  let total = getTotalGames(gameResults);
  let threshold = 0.2;
  return (
    <View
      style={s(
        c.row,
        c.fullWidth,
        c.fullHeight,
        c.br(2),
        c.border(`1px solid ${c.grays[30]}`)
      )}
    >
      <View
        style={s(
          c.width(`${(gameResults.white / total) * 100}%`),
          c.bg(c.grays[80]),
          c.center
        )}
      >
        {gameResults.white / total > threshold && (
          <CMText style={s(c.fg(c.grays[30]), c.fontSize(12))}>
            {formatWinPercentage(gameResults.white / total)}
          </CMText>
        )}
      </View>
      <View
        style={s(
          c.width(`${(gameResults.draw / total) * 100}%`),
          c.bg(c.grays[50]),
          c.center
        )}
      >
        {gameResults.draw / total > threshold && (
          <CMText style={s(c.fg(c.grays[25]), c.fontSize(12))}>
            {formatWinPercentage(gameResults.draw / total)}
          </CMText>
        )}
      </View>
      <View
        style={s(
          c.width(`${(gameResults.black / total) * 100}%`),
          c.bg(c.grays[20]),
          c.center
        )}
      >
        {gameResults.black / total > threshold && (
          <CMText style={s(c.fg(c.grays[70]), c.fontSize(12))}>
            {formatWinPercentage(gameResults.black / total)}
          </CMText>
        )}
      </View>
    </View>
  );
};

const EloWarningBox = ({ state }: { state: RepertoireState }) => {
  let buttonStyles = s(
    c.buttons.basicSecondary,
    c.fontSize(14),
    c.px(12),
    c.py(8)
  );
  return (
    <View style={s(c.px(12), c.py(12), c.bg(c.grays[20]), c.br(2))}>
      <CMText style={s(c.fg(c.colors.textPrimary), c.lineHeight("1.3rem"))}>
        Winrate, play-rate, and other calculations are assuming an elo range of
        1300-1500, you can change this to better reflect your level.
      </CMText>
      <Spacer height={12} />
      <View style={s(c.row, c.fullWidth, c.justifyEnd, c.alignCenter)}>
        <Button style={s(buttonStyles)}>Change elo range</Button>
        <Spacer width={4} />
        <Button style={s(buttonStyles, c.bg(c.grays[80]), c.py(7))}>
          <CMText
            style={s(
              c.fg(c.colors.textInverseSecondary),
              c.fontSize(16),
              c.weightBold
            )}
          >
            Sounds right
          </CMText>
        </Button>
      </View>
    </View>
  );
};

interface ResponseTag {
  type: ResponseTagType;
}

enum ResponseTagType {
  Sound = "Sound",
  // Dubious = "Dubious",
  Gambit = "Gambit",
  HighWinrate = "High win-rate",
  MasterApproved = "Master-approved",
}

const genMoveTags = (
  m: SuggestedMove,
  positionReport: PositionReport,
  side: Side
): ResponseTag[] => {
  let tags = [];
  if (m.stockfish?.eval && positionReport.stockfish?.eval) {
    if (Math.abs(m.stockfish.eval - positionReport.stockfish.eval) < 30) {
      tags.push({ type: ResponseTagType.Sound });
    }
  }
  if (getPlayRate(m, positionReport, true) > 0.1) {
    tags.push({ type: ResponseTagType.MasterApproved });
  }
  if (getWinRate(m.results, side) > 0.5) {
    tags.push({ type: ResponseTagType.HighWinrate });
  }
  return tags;
};
