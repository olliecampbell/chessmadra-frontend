import React, { useEffect } from "react";
import { Animated, View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { TrainerLayout } from "~/components/TrainerLayout";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { Score } from "~/components/ColorTraining";
import { useVisualizationTraining } from "~/utils/useVisualizationTraining";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { CMText } from "./CMText";
import { useClimbState } from "~/utils/app_state";
import { CLIMB_DESCRIPTION } from "./NavBar";
import { trackEvent } from "~/utils/trackEvent";
import { trackModule } from "~/utils/user_state";

export const TheClimb = () => {
  const isMobile = useIsMobile();
  const state = useClimbState((s) => s);
  useEffect(() => {
    trackModule("climb");
  }, []);
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
        <div style={s()}>
          {state.isPlayingClimb ? (
            <div style={s(c.column, c.alignStretch)}>{visualizationUi}</div>
          ) : (
            <div style={s(c.column)}>
              <div style={c.selfCenter}>
                <Score score={state.highScore.value} text={"High Score"} />
              </div>
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
                  trackEvent("climb.start_playing");
                }}
                style={s(c.buttons.primary)}
              >
                Start
              </Button>
            </div>
          )}
        </div>
      </TrainerLayout>
    </PageContainer>
  );
};
