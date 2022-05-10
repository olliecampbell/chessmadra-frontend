import React, { useCallback, useEffect, useMemo, useRef } from "react";
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
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  useRepertoireState,
} from "app/utils/repertoire_state";

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const state = useRepertoireState();
  useEffect(() => {
    state.fetchRepertoireGrade();
  }, []);
  let grade = state.repertoireGrades[state.activeSide];
  return (
    <TrainerLayout
      chessboard={
        <ChessboardView
          {...{
            state: state.chessState,
          }}
        />
      }
    >
      <View style={s(!isMobile && s(c.width(300)))}>
        <View style={s(c.bg(c.grays[50]), c.px(12), c.py(4))}>
          <OpeningTree repertoire={state.repertoire.white} grade={grade} />
        </View>
        <Spacer height={12} />
        {state.repertoireGrades[state.activeSide] && (
          <RepertoireGradeView
            grade={state.repertoireGrades[state.activeSide]}
          />
        )}
      </View>
    </TrainerLayout>
  );
};

const RepertoireGradeView = ({ grade }: { grade: RepertoireGrade }) => {
  return (
    <View style={s(c.bg(c.grays[30]), c.br(2), c.px(12), c.py(12))}>
      <Text style={s(c.fg(c.colors.textPrimary))}>
        Your expected depth is {grade.expectedDepth}
      </Text>
      <Spacer height={12} />
      <Text style={s(c.fg(c.colors.textPrimary))}>
        Your biggest miss is <b>{grade.biggestMiss.move.id}</b>, expected in{" "}
        {formatIncidence(grade.biggestMiss.incidence)} of your games.
      </Text>
    </View>
  );
};

const OpeningTree = ({
  repertoire,
  grade,
}: {
  repertoire: RepertoireSide;
  grade: RepertoireGrade;
}) => {
  return (
    <View style={s()}>
      {repertoire.tree.map((move) => {
        return <OpeningNode grade={grade} move={move} />;
      })}
    </View>
  );
};

const OpeningNode = ({
  move,
  grade,
}: {
  move: RepertoireMove;
  grade: RepertoireGrade;
}) => {
  let incidence = grade?.moveIncidence[move.id];
  return (
    <View>
      <View
        style={s(
          c.row,
          c.br(2),
          c.px(4),
          c.bg(c.grays[20]),
          c.my(4),
          c.py(4),
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
      <View style={s(c.pl(12))}>
        <View style={s()}>
          {intersperse(
            (move.responses || []).map((move) => {
              return <OpeningNode move={move} grade={grade} />;
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
