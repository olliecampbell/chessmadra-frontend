import React, { useEffect } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { ChessboardView } from "~/components/chessboard/Chessboard";
import { TrainerLayout } from "~/components/TrainerLayout";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { HeadSiteMeta, PageContainer } from "./PageContainer";
import { CMText } from "./CMText";
import { useColorTrainingState } from "~/utils/app_state";
import { COLOR_TRAINER_DESCRIPTION } from "./NavBar";
import { trackEvent } from "~/utils/trackEvent";
import { trackModule } from "~/utils/user_state";

const Tile = ({ color, onPress }) => {
  return (
    <Pressable {...{ onPress }} style={s(c.bg(color), c.size(72))}></Pressable>
  );
};
export const Score = ({ score, text }) => {
  return (
    <View style={s(c.column, c.alignCenter)}>
      <CMText
        style={s(c.fg(c.grays[70]), c.caps, c.weightBold, c.fontSize(12))}
      >
        {text}
      </CMText>
      <Spacer height={4} />
      <CMText style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(48))}>
        {score}
      </CMText>
    </View>
  );
};

export const ColorTraining = () => {
  const isMobile = useIsMobile();
  const state = useColorTrainingState((s) => s);
  console.log("Color training state!", s);
  useEffect(() => {
    trackModule("color_training");
  }, []);
  useEffect(() => {
    if (state.isPlaying) {
      document.onkeydown = function (e) {
        switch (e.key) {
          case "ArrowLeft":
            state.guessColor("light");
            break;
          case "ArrowRight":
            state.guessColor("dark");
            break;
        }
      };
    }
    return () => {
      document.onkeydown = null;
    };
  }, [state.isPlaying]);
  return (
    <PageContainer>
      <HeadSiteMeta
        siteMeta={{
          title: "Square Color Trainer",
          description: COLOR_TRAINER_DESCRIPTION,
        }}
      />

      <TrainerLayout
        chessboard={
          <ChessboardView
            {...{
              state: state.chessboardState,
            }}
          />
        }
      >
        <View style={s(!isMobile && s(c.width(300)))}>
          {state.isPlaying ? (
            <View style={s(c.column, c.alignCenter)}>
              <View style={s(c.row, c.alignCenter)}>
                <Score score={state.score} text={"score"} />
              </View>
              <Spacer height={24} />
              <View style={s(c.row, c.alignCenter)}>
                <Tile
                  onPress={() => {
                    state.guessColor("light");
                  }}
                  color={c.colors.lightTile}
                />
                <CMText
                  style={s(
                    c.mx(12),
                    c.fg(c.grays[70]),
                    c.caps,
                    c.weightBold,
                    c.fontSize(12)
                  )}
                >
                  or
                </CMText>
                <Tile
                  onPress={() => {
                    state.guessColor("dark");
                  }}
                  color={c.colors.darkTile}
                />
              </View>
              <Spacer height={24} />
              <View
                style={s(
                  c.bg(c.grays[70]),
                  c.fullWidth,
                  c.height(12),
                  c.br(2),
                  c.overflowHidden
                )}
              >
                <Animated.View
                  style={s(
                    c.bg(c.primaries[50]),
                    c.fullHeight,
                    c.width(
                      state.widthAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      })
                    )
                  )}
                />
              </View>
            </View>
          ) : (
            <View style={s(c.column)}>
              <View style={c.selfCenter}>
                <Score score={state.highScore.value} text={"High Score"} />
              </View>
              <Spacer height={24} />
              <CMText style={s(c.fg(c.colors.textPrimary))}>
                For each highlighted square, indicate whether it is light or
                dark. You can use the arrow keys on desktop.
              </CMText>
              <Spacer height={24} />
              <Button
                onPress={() => {
                  state.startPlaying();
                  trackEvent("color_training.start");
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
