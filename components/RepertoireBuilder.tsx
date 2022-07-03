import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Text, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import {
  cloneDeep,
  map,
  isEmpty,
  isNil,
  takeRight,
  dropRight,
  capitalize,
  drop,
} from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { keyBy, groupBy } from "lodash";
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
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { Modal } from "./Modal";
import { RepertoireWizard } from "./RepertoireWizard";
import { GridLoader } from "react-spinners";
const DEPTH_CUTOFF = 5;
import { AppStore } from "app/store";

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const state = useRepertoireState();
  console.log("Re-rendering?");
  let { user, authStatus, token } = AppStore.useState((s) => s.auth);
  useEffect(() => {
    state.setUser(user);
  }, [user]);
  useEffect(() => {
    state.initState();
  }, []);
  let grade = state.repertoireGrades[state.activeSide];
  let pendingLine = state.getPendingLine();
  // console.log("Pending line", pendingLine);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  let inner = null;
  let centered = false;
  let hasNoMovesAtAll = isEmpty(getAllRepertoireMoves(state.repertoire));
  let hasNoMovesThisSide = isEmpty(state.repertoire?.[state.activeSide]?.moves);
  if (state.repertoire === undefined) {
    inner = <GridLoader color={c.primaries[40]} size={20} />;
    centered = true;
  } else if (state.repertoire === null) {
    inner = <RepertoireWizard state={state} />;
  } else {
    let innerInner = null;
    if (state.isEditing) {
      let backButtonActive = state.position.history().length > 0;
      innerInner = (
        <>
          <View
            style={s(c.row, c.alignCenter, c.clickable)}
            onClick={() => {
              state.backToOverview();
            }}
          >
            <i
              className="fa-light fa-angle-left"
              style={s(c.fg(c.grays[70]), c.fontSize(16))}
            />
            <Spacer width={8} />
            <Text style={s(c.fg(c.grays[70]), c.weightSemiBold)}>
              Back to overview
            </Text>
          </View>
          <Spacer height={12} />
          {pendingLine && (
            <View style={s(c.bg(c.grays[30]), c.px(12), c.py(12))}>
              <Pressable
                onPress={() => {
                  // state.addPendingLine();
                }}
              >
                <Text style={s(c.fg(c.colors.textPrimary))}>
                  The current line isn't a part of your repertoire yet, would
                  you like to add it?
                </Text>
              </Pressable>
            </View>
          )}
          <View
            style={s(
              c.bg(c.grays[20]),
              c.br(4),
              c.overflowHidden,
              // c.maxHeight(300),
              c.height(220),
              c.column
            )}
          >
            {hasNoMovesThisSide && isEmpty(state.pendingMoves) ? (
              <View
                style={s(c.column, c.selfCenter, c.center, c.grow, c.px(12))}
              >
                <Text>
                  <i
                    className="fa-regular fa-empty-set"
                    style={s(c.fg(c.grays[70]), c.fontSize(24))}
                  />
                </Text>
                <Spacer height={12} />
                <Text style={s(c.fg(c.colors.textPrimary))}>
                  You don't have any moves in your repertoire yet! Play a line
                  on the board to add it.
                </Text>
                <Spacer height={12} />
                <Text style={s(c.fg(c.colors.textPrimary), c.selfStart)}>
                  {state.activeSide === "black"
                    ? "Maybe start with a response to e4?"
                    : "e4 and d4 are the most popular first moves for white, maybe one of those?"}
                </Text>
              </View>
            ) : (
              <>
                {state.moveLog && (
                  <View style={s(c.bg(c.grays[15]), c.py(12), c.px(12))}>
                    <Text
                      style={s(
                        c.fg(c.colors.textPrimary),
                        c.weightSemiBold,
                        c.minHeight("1em")
                      )}
                    >
                      {state.moveLog}
                    </Text>
                  </View>
                )}
                <View style={s(c.flexShrink(1))}>
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
                  </View>
                </View>
                <Spacer grow />
                {!isEmpty(state.pendingMoves) && (
                  <View
                    style={s(
                      c.bg(c.grays[15]),
                      c.py(12),
                      c.px(12),
                      c.row,
                      c.justifyBetween,
                      c.alignCenter
                    )}
                  >
                    <Text
                      style={s(
                        c.fg(c.colors.textPrimary),
                        c.weightSemiBold,
                        c.weightBold
                      )}
                    >
                      {state.pendingMoves.length > 1
                        ? `Add these ${state.pendingMoves.length} moves?`
                        : "Add this move?"}
                    </Text>
                    <Spacer width={12} />

                    <Button
                      style={s(c.buttons.primary, c.height(24))}
                      onPress={() => {
                        state.addPendingLine();
                      }}
                    >
                      <Text style={s(c.buttons.primary.textStyles)}>
                        <i
                          className="fas fa-check"
                          style={s(c.fg(c.colors.textPrimary))}
                        />
                        {/*
                  <Spacer width={8} />
                  Add
                  */}
                      </Text>
                    </Button>
                  </View>
                )}

                {/*
              {state.currentLine && (
                <Text style={s(c.weightSemiBold, c.fg(c.colors.textSecondary))}>
                  {lineToPgn(state.currentLine)}
                </Text>
              )}
              */}
              </>
            )}
          </View>
          <Spacer height={12} />
          <View style={s(c.row)}>
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(36),
                c.width(48),
                c.bg(c.grays[20])
              )}
              onPress={() => {
                state.backToStartPosition();
              }}
            >
              <i
                className="fas fa-angles-left"
                style={s(
                  c.fg(backButtonActive ? c.grays[80] : c.grays[50]),
                  c.fontSize(18)
                )}
              />
            </Button>
            <Spacer width={12} />
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(36),
                c.width(48),
                c.bg(c.grays[20])
              )}
              onPress={() => {
                state.backOne();
              }}
            >
              <i
                className="fas fa-angle-left"
                style={s(
                  c.fg(backButtonActive ? c.grays[80] : c.grays[50]),
                  c.fontSize(18)
                )}
              />
            </Button>
          </View>
          <Spacer height={12} />
          <Button
            style={s(c.buttons.basic)}
            onPress={() => {
              state.analyzeLineOnLichess(state.activeSide);
            }}
          >
            Analyze on Lichess
          </Button>
          <Spacer height={12} />
          <Button
            style={s(c.buttons.basic)}
            onPress={() => {
              state.searchOnChessable();
            }}
          >
            Search Chessable
          </Button>
        </>
      );
    } else if (state.isReviewing) {
      innerInner = (
        <>
          <Button
            style={s(c.buttons.basic)}
            onPress={() => {
              if (state.hasGivenUp) {
                state.setupNextMove();
              } else {
                state.giveUp();
              }
            }}
          >
            {state.hasGivenUp ? "Next" : "Show me"}
          </Button>
          <Spacer height={12} />
          <Button
            style={s(c.buttons.basic)}
            onPress={() => {
              state.backToOverview();
            }}
          >
            Stop Review
          </Button>
        </>
      );
    } else {
      innerInner = (
        <>
          {!hasNoMovesAtAll && (
            <>
              {isEmpty(state.queue) ? (
                <View
                  style={s(
                    c.bg(c.grays[20]),
                    c.br(4),
                    c.overflowHidden,
                    c.px(12),
                    c.py(12),
                    c.column,
                    c.center
                  )}
                >
                  {hasNoMovesAtAll ? (
                    <Text style={s(c.fg(c.colors.textSecondary))}>
                      You have no moves in your repertoire. Start your
                      repertoire by hitting edit below.
                    </Text>
                  ) : (
                    <Text style={s(c.fg(c.colors.textSecondary))}>
                      No moves to review! Come back later to review more.
                      <br />
                      <br />
                      Now might be a good time to add moves to your repertoire.
                      See below for your biggest misses.
                    </Text>
                  )}
                </View>
              ) : (
                <Button
                  style={s(
                    c.buttons.primary,
                    c.selfStretch,
                    c.py(16),
                    c.px(12)
                  )}
                  onPress={() => {
                    state.startReview();
                  }}
                >
                  {`Review ${state.queue?.length} moves`}
                </Button>
              )}
              <Spacer height={12} />
            </>
          )}

          <View
            style={s(
              c.bg(c.grays[20]),
              c.br(4),
              c.px(12),
              c.py(12),
              c.column,
              c.alignStart
            )}
          >
            {intersperse(
              SIDES.map((side, i) => {
                return <RepertoireSideSummary side={side} state={state} />;
              }),
              (i) => {
                return <Spacer height={12} key={i} />;
              }
            )}
          </View>
        </>
      );
    }
    inner = (
      <>
        {/*<Modal
          onClose={() => {
            setUploadModalOpen(false);
          }}
          visible={uploadModalOpen}
        >
        </Modal>*/}
        <TrainerLayout
          containerStyles={s(isMobile ? c.alignCenter : c.alignStart)}
          chessboard={
            <ChessboardView
              {...{
                state: state,
              }}
            />
          }
        >
          <View style={s(!isMobile && s(c.width(300)))}>
            {innerInner}
            {/*
            <Spacer height={12} />
            <View style={s(c.row, c.justifyEnd, c.fullWidth)}>
              <Button
                style={s(c.buttons.squareBasicButtons)}
                onPress={() => {
                  setUploadModalOpen(true);
                }}
              >
                <Text style={s(c.buttons.basic.textStyles)}>
                  <i
                    style={s(c.fg(c.colors.textInverse))}
                    className="fas fa-arrow-up-from-line"
                  ></i>
                </Text>
              </Button>
            </View>
            */}
          </View>
        </TrainerLayout>
      </>
    );
  }
  return <PageContainer centered={centered}>{inner}</PageContainer>;
};

const RepertoireGradeView = ({
  grade,
  state,
}: {
  grade: RepertoireGrade;
  state: RepertoireState;
}) => {
  return (
    <View style={s(c.bg(c.grays[30]), c.br(2), c.px(12), c.py(12))}>
      <Text style={s(c.fg(c.colors.textPrimary))}>
        With this opening repertoire, you can expect to play{" "}
        {grade.expectedDepth.toFixed(1)} moves before going out of book
      </Text>
      <Spacer height={12} />
      <Text style={s(c.fg(c.colors.textPrimary))}>
        Your biggest miss is <b>{grade.biggestMiss.move.id}</b>, expected in{" "}
        {formatIncidence(grade.biggestMiss.incidence)} of your games.{" "}
        <Pressable
          onPress={() => {
            state.playPgn(grade.biggestMiss.move.id);
          }}
        >
          <Text
            style={s(
              c.borderBottom(`1px solid ${c.grays[50]}`),
              c.pb(2),
              c.fg(c.colors.textPrimary)
            )}
          >
            Click here to add a response for this line.
          </Text>
        </Pressable>
      </Text>
    </View>
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
      {!isEmpty(state.pendingMoves) && (
        <OpeningNode
          state={state}
          grade={grade}
          responseQueue={drop(state.pendingMoves, 1)}
          move={state.pendingMoves[0]}
          repertoire={repertoire}
        />
      )}
      {map(
        state.responseLookup[state.activeSide][lineToPgn(state.currentLine)],
        (id) => {
          return state.moveLookup[state.activeSide][id];
        }
      ).map((move) => {
        return (
          <OpeningNode
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
  state,
  repertoire,
  responseQueue,
}: {
  move: RepertoireMove;
  responseQueue?: RepertoireMove[];
  grade: RepertoireGrade;
  state: RepertoireState;
  repertoire: RepertoireSide;
}) => {
  let incidence = grade?.moveIncidence[move.id];
  let responses = map(
    state.responseLookup[state.activeSide][move.id],
    (id) => state.moveLookup[state.activeSide][id]
  );
  console.log(responseQueue);
  if (!isEmpty(responseQueue)) {
    responses = [responseQueue[0]];
  }
  console.log(responses);
  let trueDepth = move.id.split(" ").length;
  let assumedDepth = state.currentLine.length;
  let depthDifference = trueDepth - assumedDepth;
  console.log("LOOKUP", state.responseLookup);
  console.log({ responses, depthDifference });
  // let responses = [];
  return (
    <View style={s(c.pl(2))}>
      <Pressable
        onPress={() => {
          state.playPgn(move.id);
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
          <Text
            style={s(
              c.fg(move.mine ? c.grays[85] : c.grays[70]),
              move.mine ? c.weightBold : c.weightRegular
            )}
          >
            {move.sanPlus}
            {move.pending && (
              <Text style={s(c.opacity(60), c.weightSemiBold)}> [pending]</Text>
            )}
          </Text>
          {incidence && !move.mine && (
            <>
              <Spacer width={0} grow />
              <Text style={s(c.fg(c.colors.textSecondary))}>
                {formatIncidence(incidence)}
              </Text>
            </>
          )}

          {/*
          <Spacer width={12} />
          <Text style={s(c.clickable)}>
            <i
              style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
              className={`fas fa-trash`}
            ></i>
          </Text>
          */}
        </View>
      </Pressable>
      {depthDifference < DEPTH_CUTOFF && (
        <View
          style={s(c.pl(10), c.ml(6), c.borderLeft(`1px solid ${c.grays[25]}`))}
        >
          <View style={s()}>
            {intersperse(
              (responses || []).map((move) => {
                return (
                  <OpeningNode
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

let START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const formatIncidence = (incidence: number) => {
  return `${removeTrailingZeros((incidence * 100).toFixed(1))}%`;
};

const removeTrailingZeros = (n: string) => {
  return n.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1");
};

const RepertoireSideSummary = ({
  side,
  state,
}: {
  side: Side;
  state: RepertoireState;
}) => {
  let expectedDepth = state.repertoireGrades[side]?.expectedDepth;
  let biggestMiss = state.repertoireGrades[side]?.biggestMiss;
  let hasNoMovesThisSide = isEmpty(state.repertoire[side]?.moves);
  return (
    <View style={s(c.fullWidth)}>
      <View
        style={s(
          c.fullWidth,
          c.pb(8),
          c.borderBottom(`1px solid ${c.grays[30]}`),
          c.row,
          c.justifyBetween,
          c.alignCenter
        )}
      >
        <Text
          style={s(
            c.weightSemiBold,
            c.fg(c.colors.textPrimary),
            c.fontSize(16)
          )}
        >
          {capitalize(side)}
        </Text>
        <Button
          style={s(c.buttons.basic, c.py(4), c.px(8), c.fontSize(14), {
            textStyles: s(c.weightSemiBold),
          })}
          onPress={() => {
            state.startEditing(side);
          }}
        >
          Edit
        </Button>
      </View>
      <Spacer height={12} />
      {hasNoMovesThisSide ? (
        <View style={s(c.column, c.selfCenter, c.center, c.grow)}>
          <Text>
            <i
              className="fa-regular fa-empty-set"
              style={s(c.fg(c.grays[50]), c.fontSize(18))}
            />
          </Text>
          <Spacer height={8} />
          <Text style={s(c.fg(c.grays[75]))}>No moves for {side}</Text>
        </View>
      ) : (
        <View style={s(c.column, c.alignStart)}>
          {intersperse(
            [
              <SummaryRow k="Moves" v={state.myResponsesLookup[side].length} />,
              ...(expectedDepth
                ? [
                    <SummaryRow
                      k="Expected depth"
                      v={expectedDepth.toFixed(2)}
                    />,
                  ]
                : []),
              ...(biggestMiss
                ? [
                    <SummaryRow
                      k={`Biggest miss, expected in ${(
                        biggestMiss.incidence * 100
                      ).toFixed(1)}% of games`}
                      v={biggestMiss.move.id}
                    />,
                  ]
                : []),
            ],
            (i) => {
              return <Spacer height={12} key={i} />;
            }
          )}
        </View>
      )}
      <Spacer height={24} />
    </View>
  );
};

const SummaryRow = ({ k, v }) => {
  return (
    <View style={s(c.column, c.alignStart)}>
      <Text style={s(c.fg(c.colors.textPrimary), c.weightSemiBold)}>{v}</Text>
      <Spacer height={4} />
      <Text style={s(c.fg(c.grays[70]), c.weightSemiBold)}>{k}</Text>
    </View>
  );
};
