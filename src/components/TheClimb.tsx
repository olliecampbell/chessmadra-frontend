import React, { useEffect } from "react";
import { Animated, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { Score } from "app/components/ColorTraining";
import { useVisualizationTraining } from "app/utils/useVisualizationTraining";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { CMText } from "./CMText";
import { useClimbState } from "app/utils/app_state";
import { CLIMB_DESCRIPTION } from "./NavBar";

export const TheClimb = () => {
  const isMobile = useIsMobile();
  const state = useClimbState((s) => s);
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
      <HeadSiteMeta
        siteMeta={{
          title: "The Climb",
          description: CLIMB_DESCRIPTION,
        }}
      />
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
