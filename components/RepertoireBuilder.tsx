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
import { cloneDeep, isEmpty, isNil, takeRight } from "lodash";
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
  RepertoireSide,
} from "app/utils/repertoire";
import { PageContainer } from "./PageContainer";
import { Modal } from "./Modal";
import { RepertoireWizard } from "./RepertoireWizard";

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const state = useRepertoireState();
  console.log("Re-rendering?");
  useEffect(() => {
    state.initState();
  }, []);
  let grade = state.repertoireGrades[state.activeSide];
  let pendingLine = state.getPendingLine();
  console.log("Pending line", pendingLine);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  let inner = null;
  if (state.repertoire.value === null) {
    inner = <RepertoireWizard state={state} />;
  } else {
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
          chessboard={
            <ChessboardView
              {...{
                state: state,
              }}
            />
          }
        >
          {pendingLine && (
            <View style={s(c.bg(c.grays[30]), c.px(12), c.py(12))}>
              <Pressable
                onPress={() => {
                  state.addPendingLine();
                }}
              >
                <Text style={s(c.fg(c.colors.textPrimary))}>
                  The current line isn't a part of your repertoire yet, would
                  you like to add it?
                </Text>
              </Pressable>
            </View>
          )}
          <View style={s(!isMobile && s(c.width(300)))}>
            <View
              style={s(
                c.bg(c.grays[30]),
                c.px(12),
                c.py(4),
                c.maxHeight(300),
                c.scrollY
              )}
            >
              <OpeningTree
                state={state}
                repertoire={state.repertoire.value.white}
                grade={grade}
              />
            </View>
            <Spacer height={12} />
            {state.repertoireGrades[state.activeSide] && (
              <RepertoireGradeView
                state={state}
                grade={state.repertoireGrades[state.activeSide]}
              />
            )}
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
          </View>
        </TrainerLayout>
      </>
    );
  }
  return <PageContainer>{inner}</PageContainer>;
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
      {repertoire.tree.map((move) => {
        return <OpeningNode state={state} grade={grade} move={move} />;
      })}
    </View>
  );
};

const OpeningNode = ({
  move,
  grade,
  state,
}: {
  move: RepertoireMove;
  grade: RepertoireGrade;
  state: RepertoireState;
}) => {
  let incidence = grade?.moveIncidence[move.id];
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
          <Text style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
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
          <Spacer width={12} />
          <Text style={s(c.clickable)}>
            <i
              style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
              className={`fa-light fa-trash-can`}
            ></i>
          </Text>
        </View>
      </Pressable>
      <View
        style={s(c.pl(6), c.ml(6), c.borderLeft(`1px solid ${c.grays[40]}`))}
      >
        <View style={s()}>
          {intersperse(
            (move.responses || []).map((move) => {
              return <OpeningNode state={state} move={move} grade={grade} />;
            }),
            (i) => {
              return <Spacer key={i} height={0} />;
            }
          )}
        </View>
      </View>
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
