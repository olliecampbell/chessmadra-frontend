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
const DEPTH_CUTOFF = 7;
import { AppStore } from "app/store";
import { plural, pluralize } from "app/utils/pluralize";
import { useModal } from "./useModal";

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
  const {
    open: editEtcModalOpen,
    setOpen: setEditEtcModalOpen,
    modal: editEtcModal,
  } = useModal({
    content: (
      <>
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
              className="fas fa-arrow-down-to-line"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <Text
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Export
              </Text>
              <Spacer height={4} />
              <Text style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Export your {state.activeSide} repertoire to a PGN file. You can
                import this file into a Lichess study, ChessBase, Chessable
                course, etc.
              </Text>
              <Spacer height={12} />
              <Button
                style={s(c.buttons.primary, c.height(36), c.selfEnd)}
                onPress={() => {
                  state.exportPgn(state.activeSide);
                }}
              >
                <Text style={s(c.buttons.primary.textStyles)}>Export</Text>
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
              <Text
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Delete
              </Text>
              <Spacer height={4} />
              <Text style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Delete your entire {state.activeSide} repertoire. This cannot be
                undone.
              </Text>
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
                <Text style={s(c.buttons.primary.textStyles)}>Delete</Text>
              </Button>
            </View>
          </View>
        </View>
      </>
    ),
    isOpen: false,
  });
  let grade = state.repertoireGrades[state.activeSide];
  // console.log("Pending line", pendingLine);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  let inner = null;
  let centered = false;
  let hasNoMovesAtAll = isEmpty(getAllRepertoireMoves(state.repertoire));
  let hasNoMovesThisSide = isEmpty(state.repertoire?.[state.activeSide]?.moves);
  if (state.repertoire === undefined) {
    inner = <GridLoader color={c.primaries[40]} size={20} />;
    centered = true;
  } else if (
    isEmpty(getAllRepertoireMoves(state.repertoire)) &&
    !state.hasCompletedRepertoireInitialization
  ) {
    inner = <RepertoireWizard state={state} />;
  } else {
    let innerInner = null;
    let biggestMiss = state.repertoireGrades?.[state.activeSide]?.biggestMiss;
    let biggestMissRow = createBiggestMissRow(state, state.activeSide);
    let backToOverviewRow = (
      <View
        style={s(c.row, c.alignCenter, c.clickable, c.mb(12))}
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
    );
    if (state.isEditing) {
      let backButtonActive = state.position.history().length > 0;
      innerInner = (
        <>
          {backToOverviewRow}
          <View
            style={s(
              c.bg(c.grays[20]),
              c.br(4),
              c.overflowHidden,
              // c.maxHeight(300),
              c.height(260),
              c.column
            )}
          >
            {hasNoMovesThisSide && isEmpty(state.pendingMoves) ? (
              <View
                style={s(c.column, c.selfCenter, c.center, c.grow, c.px(12))}
              >
                <Text>
                  <i
                    className="fa-light fa-empty-set"
                    style={s(c.fg(c.grays[50]), c.fontSize(24))}
                  />
                </Text>
                <Spacer height={12} />
                <Text style={s(c.fg(c.grays[85]))}>
                  You don't have any moves in your repertoire yet! Play a line
                  on the board to add it.
                </Text>
                <Spacer height={12} />
                <Text style={s(c.fg(c.grays[85]), c.selfStart)}>
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
                        state.responseLookup[state.activeSide][
                          lineToPgn(state.currentLine)
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
                          <Text
                            style={s(
                              c.fg(c.grays[75]),
                              c.textAlign("center"),
                              c.weightSemiBold
                            )}
                          >
                            Play a move on the board to add a response
                          </Text>
                        </View>
                      )}
                  </View>
                </View>
                {!isNil(biggestMiss) &&
                  isEmpty(state.pendingMoves) &&
                  biggestMissRow}
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
                            c.justifyEnd,
                            c.alignCenter
                          )}
                        >
                          <i
                            className="fa-regular fa-triangle-exclamation"
                            style={s(c.fontSize(20), c.fg(c.yellows[50]))}
                          ></i>
                          <Spacer width={8} />
                          <Text
                            style={s(
                              c.fg(c.colors.textInverse),
                              c.fontSize(12)
                            )}
                          >
                            Adding this line will remove{" "}
                            <b>{state.numMovesWouldBeDeleted}</b> moves that
                            start with <b>{state.conflictingId}</b>
                          </Text>
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
                        onPress={() => {
                          state.addPendingLine();
                        }}
                      >
                        <Text style={s(c.buttons.primary.textStyles)}>
                          <i
                            className="fa-regular fa-plus"
                            style={s(c.fg(c.grays[90]))}
                          />
                          <Spacer width={6} />
                          <Text style={s(c.weightBold)}>Add line</Text>
                        </Text>
                      </Button>
                    </View>
                  </>
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
                c.width(64),
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
                c.grow,
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
          <View style={s(c.row, c.fullWidth)}>
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(36),
                c.flexible,
                c.grow,
                c.bg(c.grays[20])
              )}
              onPress={() => {
                state.analyzeLineOnLichess(state.activeSide);
              }}
            >
              <Text
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
              </Text>
            </Button>
            <Spacer width={12} />
            <Button
              style={s(
                c.buttons.basicInverse,
                c.height(36),
                c.flexible,
                c.grow,
                c.grow,
                c.bg(c.grays[20])
              )}
              onPress={() => {
                state.searchOnChessable();
              }}
            >
              <Text
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
              </Text>
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
            <Text
              style={s(
                c.buttons.basicInverse.textStyles,
                c.fg(c.colors.textPrimary)
              )}
            >
              <i
                style={s(c.fontSize(14), c.fg(c.grays[60]))}
                className="fas fa-ellipsis"
              ></i>
            </Text>
          </Button>
        </>
      );
    } else if (state.isReviewing) {
      innerInner = (
        <>
          {backToOverviewRow}
          <Text
            style={s(
              c.fg(c.colors.textPrimary),
              c.weightSemiBold,
              c.fontSize(14)
            )}
          >
            Play the correct response on the board
          </Text>
          <Spacer height={12} />
          <Button
            style={s(
              state.hasGivenUp ? c.buttons.primary : c.buttons.basicInverse
            )}
            onPress={() => {
              if (state.hasGivenUp) {
                state.setupNextMove();
              } else {
                state.giveUp();
              }
            }}
          >
            {state.hasGivenUp ? "Next" : "I don't know"}
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
                    c.px(16),
                    c.py(16),
                    c.column,
                    c.center
                  )}
                >
                  <View style={s(c.row, c.alignStart)}>
                    <i
                      style={s(
                        c.fg(c.grays[50]),
                        c.selfCenter,
                        c.fontSize(24),
                        c.pr(12)
                      )}
                      className="fas fa-check"
                    ></i>
                    <Text
                      style={s(c.fg(c.colors.textSecondary), c.fontSize(13))}
                    >
                      You've reviewed all your moves! Now might be a good time
                      to add moves. Or you can{" "}
                      <span
                        style={s(
                          c.weightSemiBold,
                          c.fg(c.colors.textPrimary),
                          c.clickable
                        )}
                        onClick={() => {
                          state.startReview();
                        }}
                      >
                        review your moves anyway.
                      </span>
                    </Text>
                  </View>
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
                  {`Review ${pluralize(state.queue?.length, "move")}`}
                </Button>
              )}
              <Spacer height={12} />
            </>
          )}

          {intersperse(
            SIDES.map((side, i) => {
              return <RepertoireSideSummary side={side} state={state} />;
            }),
            (i) => {
              return <Spacer height={12} key={i} />;
            }
          )}
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
        {editEtcModal}
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
      {state.showPendingMoves && (
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
  if (!isEmpty(responseQueue)) {
    responses = [responseQueue[0]];
  }
  let trueDepth = move.id.split(" ").length;
  let assumedDepth = state.currentLine.length;
  let depthDifference = trueDepth - assumedDepth;
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
              c.fg(move.mine || move.pending ? c.grays[85] : c.grays[70]),
              move.mine ? c.weightBold : c.weightRegular
            )}
          >
            {move.sanPlus}
            {responses && depthDifference >= DEPTH_CUTOFF && "…"}
            {move.pending && (
              <Text style={s(c.opacity(60), c.weightSemiBold)}> [pending]</Text>
            )}
          </Text>
          {/*incidence && !move.mine && (
            <>
              <Spacer width={0} grow />
              <Text style={s(c.fg(c.colors.textSecondary))}>
                {formatIncidence(incidence)}
              </Text>
            </>
          )*/}

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
  let numMoves = state.myResponsesLookup[side]?.length;
  let hasNoMovesThisSide = isEmpty(state.repertoire[side]?.moves);
  let biggestMissRow = createBiggestMissRow(state, side);
  return (
    <View style={s(c.column, c.bg(c.grays[20]), c.overflowHidden, c.fullWidth)}>
      <View style={s(c.br(4), c.column, c.alignStart)}>
        <View
          style={s(c.fullWidth, c.pb(8), c.row, c.justifyBetween, c.alignStart)}
        >
          <Text
            style={s(
              c.weightSemiBold,
              c.fg(c.colors.textPrimary),
              c.fontSize(18),
              c.pl(18),
              c.py(12)
            )}
          >
            {capitalize(side)}
          </Text>
          <Button
            style={s(
              c.buttons.basic,
              c.py(12),
              c.px(18),
              c.bg(c.grays[30]),
              c.br(0),
              c.brbl(2)
            )}
            onPress={() => {
              state.startEditing(side);
            }}
          >
            <Text style={s(c.weightBold, c.fontSize(14), c.fg(c.grays[80]))}>
              Edit
            </Text>
          </Button>
        </View>
        <Spacer height={4} />
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
            <Spacer height={16} />
          </View>
        ) : (
          <View
            style={s(
              c.row,
              c.alignCenter,
              c.fullWidth,
              c.justifyBetween,
              c.px(48)
            )}
          >
            {intersperse(
              [
                <SummaryRow k={plural(numMoves, "Move")} v={numMoves} />,
                ...(expectedDepth
                  ? [
                      <SummaryRow
                        k="Expected depth"
                        v={expectedDepth.toFixed(2)}
                      />,
                    ]
                  : []),
                // ...(biggestMiss
                //   ? [
                //       <SummaryRow
                //         k={`Biggest miss, expected in ${(
                //           biggestMiss.incidence * 100
                //         ).toFixed(1)}% of games`}
                //         v={biggestMiss.move.id}
                //       />,
                //     ]
                //   : []),
              ],
              (i) => {
                return <Spacer width={0} key={i} />;
              }
            )}
          </View>
        )}
        <Spacer height={18} />
      </View>
      {biggestMiss && numMoves > 0 && biggestMissRow}
    </View>
  );
};

const SummaryRow = ({ k, v }) => {
  return (
    <View style={s(c.column, c.alignCenter)}>
      <Text style={s(c.fg(c.colors.textPrimary), c.weightBold, c.fontSize(22))}>
        {v}
      </Text>
      <Spacer height={4} />
      <Text style={s(c.fg(c.grays[70]), c.weightSemiBold)}>{k}</Text>
    </View>
  );
};

function createBiggestMissRow(state: RepertoireState, side: string) {
  let biggestMiss = state.repertoireGrades[side]?.biggestMiss;
  if (!biggestMiss) {
    return null;
  }
  return (
    <Pressable
      onPress={() => {
        state.quick((s) => {
          s.positionBeforeBiggestMissEdit = s.position;
          state.startEditing(side as Side, s);
          state.playPgn(biggestMiss.move.id, s);
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
          <Text
            style={s(
              c.fg(c.colors.textSecondary),
              c.fontSize(12),
              c.weightSemiBold,
              c.weightBold,
              c.selfStart
            )}
          >
            Biggest miss -
          </Text>
          <Spacer width={4} />
          <Text
            style={s(
              c.fg(c.colors.textSecondary),
              c.fontSize(12),
              c.weightSemiBold,
              c.weightBold,
              c.selfStart
            )}
          >
            {formatIncidence(biggestMiss.incidence)} of games
          </Text>
        </View>
        <Spacer height={2} />
        <Text
          style={s(
            c.constrainWidth,
            c.fg(c.colors.textPrimary),
            c.weightSemiBold,
            c.fontSize(13),
            c.weightBold,
            c.selfStart,
            c.pb(2),
            c.overflowHidden,
            c.keyedProp("text-overflow")("ellipsis"),
            c.whitespace("nowrap"),
            c.borderBottom(`1px solid ${c.grays[40]}`)
          )}
        >
          {biggestMiss?.move.id}
        </Text>
      </View>
    </Pressable>
  );
}
