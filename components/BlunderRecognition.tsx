import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Text, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { cloneDeep, isEmpty, isNil, takeRight, chunk } from "lodash";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import {
  BlunderRecognitionDifficulty,
  BlunderRecognitionTab,
  FinishedBlunderPuzzle,
  getBlunderRange,
  useBlunderRecognitionStore,
} from "../utils/state";
import { intersperse } from "../utils/intersperse";
import { Chess } from "@lubert/chess.ts";
import { PageContainer } from "./PageContainer";

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

export const BlunderRecognition = () => {
  const isMobile = useIsMobile();
  const state = useBlunderRecognitionStore();
  useEffect(() => {
    state.prefetchPuzzles();
  }, []);
  return (
    <PageContainer>
      <TrainerLayout
        chessboard={
          <ChessboardView
            {...{
              state,
            }}
          />
        }
      >
        <View style={s()}>
          {state.isPlaying && !state.donePlaying && (
            <View style={s(c.column, c.alignCenter)}>
              <Text style={s(c.fg(c.grays[70]), c.fontSize(16))}>
                <Text
                  style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(16))}
                >
                  {state.position.turn() === "b" ? "Black" : "White"}
                </Text>{" "}
                is thinking of playing{" "}
                <Text
                  style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(16))}
                >
                  {state.currentMove}
                </Text>
              </Text>
              <Spacer height={24} />
              <View style={s(c.row, c.alignCenter)}>
                <Button
                  onPress={() => {
                    state.guess(false);
                  }}
                  style={s(c.buttons.basic, c.width(140))}
                >
                  Good move
                </Button>
                <Spacer width={24} />
                <Button
                  onPress={() => {
                    state.guess(true);
                  }}
                  style={s(c.buttons.basic, c.width(140))}
                >
                  Blunder
                </Button>
              </View>
            </View>
          )}
          {!state.isPlaying && !state.donePlaying && (
            <View style={s(c.column)}>
              <View
                style={s(
                  c.bg(c.grays[20]),
                  c.column,
                  c.center,
                  c.py(12),
                  c.px(12),
                  c.rounded
                )}
              >
                <View style={s(c.row, c.fullWidth)}>
                  {intersperse(
                    [
                      BlunderRecognitionDifficulty.Easy,
                      BlunderRecognitionDifficulty.Medium,
                      BlunderRecognitionDifficulty.Hard,
                    ].map((x) => {
                      const isActive = x === state.difficulty.value;
                      return (
                        <Button
                          onPress={() => {
                            state.quick((s) => {
                              s.difficulty.value = x;
                              s.prefetchPuzzles(s);
                            });
                          }}
                          style={s(
                            c.buttons.basic,
                            isActive && c.bg(c.grays[80]),
                            !isActive && c.bg(c.grays[60]),
                            c.flexible
                          )}
                        >
                          <View style={s(c.column, c.alignCenter)}>
                            <Text style={s(c.buttons.basic.textStyles)}>
                              {x}
                            </Text>
                          </View>
                        </Button>
                      );
                    }),
                    (i) => {
                      return <Spacer key={i} width={8} />;
                    }
                  )}
                </View>
                <Spacer height={12} />
                <Text
                  style={s(
                    c.fg(c.colors.textSecondary),
                    c.fontSize(14),
                    c.weightRegular,
                    c.selfStart
                  )}
                >
                  {state.difficulty.value ===
                  BlunderRecognitionDifficulty.Easy ? (
                    <>
                      Blunders will lose more than{" "}
                      {getBlunderRange(state.difficulty.value)[0]} centipawns.
                    </>
                  ) : (
                    <>
                      Blunders will lose between{" "}
                      {getBlunderRange(state.difficulty.value)[0]} and{" "}
                      {getBlunderRange(state.difficulty.value)[1]} centipawns.
                    </>
                  )}
                </Text>
                <Spacer height={8} />
                <Text style={s(c.fg(c.colors.textSecondary))}>
                  Determine whether each move is a blunder, or the best move.
                  You can review the positions you missed when the round ends.
                </Text>
                <Spacer height={8} />
                <Text style={s(c.fg(c.colors.textSecondary))}>
                  Blunders taken from lichess rapid games between 2000+ ELO
                  players, and verified with Stockfish 14 at a depth of 100k
                  nodes.
                </Text>
                <Spacer height={12} />
                <Button
                  onPress={() => {
                    state.startPlaying();
                  }}
                  style={s(c.buttons.primary, c.fullWidth)}
                >
                  Start
                </Button>
              </View>
            </View>
          )}
          {state.donePlaying && (
            <View style={s(c.column, c.alignCenter)}>
              <Text
                style={s(
                  c.fg(
                    state.wasCorrect ? c.primaries[60] : c.colors.failureLight
                  ),
                  c.weightSemiBold,
                  c.fontSize(16)
                )}
              >
                <i
                  className={`fa ${
                    state.wasCorrect ? "fa-check" : "fa-warning"
                  }`}
                />
                <Spacer width={12} />
                {state.currentMove}{" "}
                {state.isBlunder ? "is a blunder" : "is the best move"}
              </Text>
              <Spacer height={24} />
              <View style={s(c.row)}>
                <Button
                  onPress={() => {
                    window.open(
                      `https://lichess.org/analysis/${state.currentPuzzle.fen}`,
                      "_blank"
                    );
                  }}
                  style={s(c.buttons.basic, c.width(140))}
                >
                  Analyze
                </Button>
                <Spacer width={12} />
                <Button
                  onPress={() => {
                    state.setupNextRound();
                  }}
                  style={s(c.buttons.primary, c.width(140))}
                >
                  Next
                </Button>
              </View>
            </View>
          )}
        </View>
      </TrainerLayout>
    </PageContainer>
  );
};
