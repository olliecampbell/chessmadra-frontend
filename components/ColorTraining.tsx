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
import { useColorTrainingStore } from "../utils/state";
import { PageContainer } from "./PageContainer";

const Tile = ({ color, onPress }) => {
  return (
    <Pressable {...{ onPress }} style={s(c.bg(color), c.size(72))}></Pressable>
  );
};
const testPlayingUI = false;
export const Score = ({ score, text }) => {
  return (
    <View style={s(c.column, c.alignCenter)}>
      <Text style={s(c.fg(c.grays[70]), c.caps, c.weightBold, c.fontSize(12))}>
        {text}
      </Text>
      <Spacer height={4} />
      <Text style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(48))}>
        {score}
      </Text>
    </View>
  );
};

export const ColorTraining = () => {
  const isMobile = useIsMobile();
  const state = useColorTrainingStore();
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
      <TrainerLayout
        chessboard={
          <ChessboardView
            {...{
              state: state,
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
                <Text
                  style={s(
                    c.mx(12),
                    c.fg(c.grays[70]),
                    c.caps,
                    c.weightBold,
                    c.fontSize(12)
                  )}
                >
                  or
                </Text>
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
              <Text style={s(c.fg(c.colors.textPrimary))}>
                For each highlighted square, indicate whether it is light or
                dark. You can use the arrow keys on desktop.
              </Text>
              <Spacer height={24} />
              <Button
                onPress={() => {
                  state.startPlaying();
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
