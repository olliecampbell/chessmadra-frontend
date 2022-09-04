import { algebraic, Chess, SQUARES } from "@lubert/chess.ts";
import { AppState } from "./app_state";
import { ChessboardState, createChessState } from "./chessboard_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { sample } from "lodash-es";
import { StorageItem } from "./storageItem";
import { Animated, Easing } from "react-native";
import { Square } from "@lubert/chess.ts/dist/types";

type Stack = [ColorTrainingState, AppState];
export interface ColorTrainingState {
  chessboardState?: ChessboardState;
  isPlaying: boolean;
  startTime: number;
  score: number;
  lastRoundScore: number;
  widthAnim: Animated.Value;
  highScore: StorageItem<number>;
  roundDuration: number;
  remainingTime: number;
  penalties: number;
  currentSquare: Square;
  calculateRemainingTime: () => void;
  stopRound: () => void;
  startPlaying: () => void;
  guessColor: (color: "light" | "dark") => void;
  clearHighlights: () => void;
  highlightNewSquare: () => void;
}

export const getInitialColorState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T): T => {
    return _set((s) => fn([s.colorTrainingState, s]));
  };
  const get = <T,>(fn: (stack: Stack) => T): T => {
    return _get((s) => fn([s.colorTrainingState, s]));
  };
  let initialState = {
    isPlaying: false,
    startTime: null,
    score: 0,
    lastRoundScore: null,
    widthAnim: new Animated.Value(0.0),
    highScore: new StorageItem("high-score-color-trainer", 0),
    roundDuration: 30 * 1000,
    remainingTime: null,
    penalties: 0,
    currentSquare: null,
    calculateRemainingTime: () =>
      set(([s]) => {
        let remainingTime =
          s.roundDuration -
          (performance.now() - s.startTime) -
          s.penalties * 5 * 1000;
        s.remainingTime = remainingTime;
        s.widthAnim.setValue(remainingTime / s.roundDuration);
        Animated.timing(s.widthAnim, {
          toValue: 0.0,
          duration: remainingTime,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(({ finished }) => {
          if (finished) {
            set(([s]) => {
              console.log("Stopping round?", finished);
              s.stopRound();
            });
          }
        });
      }),
    stopRound: () =>
      set(([s]) => {
        s.isPlaying = false;
        s.lastRoundScore = s.score;
        if (s.score > s.highScore.value) {
          s.highScore.value = s.score;
        }
        s.score = 0;
        s.penalties = 0;
        s.remainingTime = 0;
        s.clearHighlights();
        s.currentSquare = null;
      }),

    startPlaying: () =>
      set(([s]) => {
        s.widthAnim.setValue(1.0);
        s.startTime = performance.now();
        s.remainingTime = s.roundDuration;
        s.isPlaying = true;
        s.score = 0;
        s.highlightNewSquare();
        s.calculateRemainingTime();
      }),
    guessColor: (color: "light" | "dark") =>
      set(([s]) => {
        let correct = new Chess().squareColor(s.currentSquare) == color;
        s.chessboardState.flashRing(correct);
        if (correct) {
          s.score = s.score + 1;
        } else {
          s.penalties = s.penalties + 1;
        }
        s.calculateRemainingTime();
        s.highlightNewSquare();
      }),
    clearHighlights: () =>
      set(([s]) => {
        let animDuration = 200;
        if (s.currentSquare) {
          Animated.timing(
            s.chessboardState.squareHighlightAnims[s.currentSquare],
            {
              toValue: 0,
              duration: animDuration,
              useNativeDriver: true,
            }
          ).start();
        }
      }),
    highlightNewSquare: () =>
      set(([s]) => {
        let randomSquare = algebraic(sample(SQUARES)) as Square;
        let animDuration = 200;
        s.clearHighlights();
        s.currentSquare = randomSquare;
        Animated.timing(
          s.chessboardState.squareHighlightAnims[s.currentSquare],
          {
            toValue: 0.8,
            duration: animDuration,
            useNativeDriver: true,
          }
        ).start();
      }),
  } as ColorTrainingState;

  const setChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _set((s) => fn(s.colorTrainingState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _get((s) => fn(s.colorTrainingState.chessboardState));
  };
  initialState.chessboardState = createChessState(setChess, getChess);
  initialState.chessboardState.position = null;
  initialState.chessboardState.hideColors = true;
  initialState.chessboardState.isColorTraining = true;
  return initialState;
};
