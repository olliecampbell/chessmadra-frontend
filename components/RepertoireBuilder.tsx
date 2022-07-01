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
  if (state.repertoire === undefined) {
    inner = <GridLoader color={c.primaries[40]} size={20} />;
    centered = true;
  } else if (getAllRepertoireMoves(state.repertoire).length === 0) {
    inner = <RepertoireWizard state={state} />;
  } else {
    let innerInner = null;
    if (state.isEditing) {
      let backButtonActive = state.position.history().length > 0;
      innerInner = (
        <>
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
              c.px(12),
              c.py(8),
              // c.maxHeight(300),
              c.height(200),
              c.scrollY
            )}
          >
            {/*
              {state.currentLine && (
                <Text style={s(c.weightSemiBold, c.fg(c.colors.textSecondary))}>
                  {lineToPgn(state.currentLine)}
                </Text>
              )}
              */}
            <OpeningTree
              state={state}
              repertoire={state.repertoire.white}
              grade={grade}
            />
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
          <Spacer height={12} />
          <Button
            style={s(c.buttons.basic)}
            onPress={() => {
              state.stopEditing();
            }}
          >
            Stop Editing
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
              state.stopReview();
            }}
          >
            Stop Review
          </Button>
        </>
      );
    } else {
      innerInner = (
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
              <Text style={s(c.fg(c.colors.textSecondary))}>
                No moves to review! Come back later to review more.
                <br />
                <br />
                Now might be a good time to add moves to your repertoire. See
                below for your biggest misses.
              </Text>
            </View>
          ) : (
            <Button
              style={s(c.buttons.primary, c.selfStretch, c.py(16), c.px(12))}
              onPress={() => {
                state.startReview();
              }}
            >
              {`Review ${state.queue?.length} moves`}
            </Button>
          )}

          <Spacer height={12} />
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
                return <Spacer height={32} key={i} />;
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
}: {
  move: RepertoireMove;
  grade: RepertoireGrade;
  state: RepertoireState;
  repertoire: RepertoireSide;
}) => {
  let incidence = grade?.moveIncidence[move.id];
  let responses = map(
    state.responseLookup[state.activeSide][move.id],
    (id) => state.moveLookup[state.activeSide][id]
  );
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
      <View style={s(c.column, c.alignStart)}>
        {intersperse(
          [
            <SummaryRow k="moves" v={state.myResponsesLookup[side].length} />,
            ...(expectedDepth
              ? [<SummaryRow k="expected depth" v={expectedDepth.toFixed(2)} />]
              : []),
            ...(biggestMiss
              ? [<SummaryRow k="biggest miss" v={biggestMiss.move.id} />]
              : []),
          ],
          (i) => {
            return <Spacer height={12} key={i} />;
          }
        )}
      </View>
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
