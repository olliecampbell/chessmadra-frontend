import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal,
} from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { algebraic, Chess, Move, SQUARES } from "@lubert/chess.ts";
import { cloneDeep, isEmpty, isNil, takeRight } from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { Score } from "app/components/ColorTraining";
import { useVisualizationTraining } from "app/utils/useVisualizationTraining";
import { useClimbStore } from "../utils/state";
import { PageContainer } from "./PageContainer";
import { CMText } from "./CMText";

const Tile = ({ color, onPress }) => {
  return (
    <Pressable {...{ onPress }} style={s(c.bg(color), c.size(72))}></Pressable>
  );
};
const testPlayingUI = false;
const ClimbScore = ({ score, highScore, text }) => {
  return (
    <View style={s(c.column, c.alignCenter)}>
      <CMText
        style={s(c.fg(c.grays[70]), c.caps, c.weightBold, c.fontSize(12))}
      >
        {text}
      </CMText>
      <Spacer height={4} />
      <CMText style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(48))}>
        {score.value}
      </CMText>
    </View>
  );
};

// tweak params

export const TheClimb = () => {
  const isMobile = useIsMobile();
  const state = useClimbStore();
  useEffect(() => {
    state.initState();
  }, []);
  const { scoreOpacityAnim } = state;
  const scoreChangeView = (
    <Animated.View
      style={s(
        c.opacity(scoreOpacityAnim),
        c.fontSize(16),
        c.size(40),
        c.center,
        c.alignStart,
        c.ml(6),
        c.fg(
          state.lastPuzzleSuccess
            ? c.colors.successColor
            : c.colors.failureColor
        )
      )}
    >
      <CMText>{state.delta < 0 ? state.delta : `+${state.delta}`}</CMText>
    </Animated.View>
  );
  const { chessboardProps, ui: visualizationUi } = useVisualizationTraining({
    isClimb: true,
    autoPlay: true,
    state,
    score: state.score.value,
    scoreChangeView,
  });
  return (
    <PageContainer>
      <TrainerLayout
        chessboard={
          <>
            <ChessboardView {...chessboardProps} />
          </>
        }
      >
        <View style={s()}>
          {state.isPlayingClimb ? (
            <View style={s(c.column, c.alignStretch)}>{visualizationUi}</View>
          ) : (
            <View style={s(c.column)}>
              <View style={c.selfCenter}>
                <Score score={state.highScore.value} text={"High Score"} />
              </View>
              <Spacer height={isMobile ? 12 : 24} />
              <CMText style={s(c.fg(c.colors.textSecondary))}>
                The <b>number of hidden moves</b> and <b>puzzle difficulty</b>{" "}
                will increase. Solve puzzles fast to keep your score climbing.
                Take too long, or fail a puzzle, and the difficulty will go
                down.
              </CMText>
              <Spacer height={24} />
              <Button
                onPress={() => {
                  state.startPlayingClimb();
                }}
                style={s(c.buttons.primary)}
              >
                Start
              </Button>
            </View>
          )}
        </View>
      </TrainerLayout>
    </PageContainer>
  );
};
