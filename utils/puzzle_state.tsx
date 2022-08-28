import { isCheckmate } from "../utils/chess";
import { StorageItem } from "app/utils/storageItem";
import { fakeBlackPuzzle, fakeBlackBlunderPuzzle } from "app/mocks/puzzles";
import { algebraic, Chess, Color, Move, SQUARES } from "@lubert/chess.ts";
import { produce } from "immer";
import type { Draft } from "immer";
import create, {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from "zustand";
import { devtools } from "zustand/middleware";
import { fetchNewBlunderPuzzle, fetchNewPuzzle } from "./api";
import { takeRight, cloneDeep, isEmpty, sample, indexOf } from "lodash";
import { times } from "../utils";
import { Animated, Easing } from "react-native";
import { Square } from "@lubert/chess.ts/dist/types";
import {
  DEBUG_CLIMB_START_PLAYING,
  DEBUG_DONE_BLUNDER_VIEW,
  DEBUG_MOCK_FETCH,
  DEBUG_PASS_FAIL_BUTTONS,
  failOnTrue,
} from "./test_settings";
import { BlunderPuzzle, LichessGame, LichessPuzzle } from "../models";
import {
  ChessboardDelegate,
  ChessboardState,
  createChessState,
} from "./chessboard_state";
import { immer } from "zustand/middleware/immer";
import { RepertoireState } from "./repertoire_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { AppState } from "./app_state";
import { logProxy } from "./state";
import {
  PlaybackSpeed,
  ProgressMessage,
  ProgressMessageType,
} from "app/types/VisualizationState";

export interface PuzzleState extends ChessboardDelegate {
  puzzlePosition: any;
  turn: Color;
  solutionMoves: Move[];
  puzzle: LichessPuzzle;
  progressMessage?: ProgressMessage;
  delegate?: PuzzleStateDelegate;
}

export interface PuzzleStateDelegate {
  onPuzzleMoveSuccess: () => void;
  onPuzzleMoveFailure: (move: Move) => void;
  onPuzzleSuccess: () => void;
  animatePieceMove: (
    move: Move,
    speed: PlaybackSpeed,
    callback: (completed: boolean) => void
  ) => void;
}

export const getInitialPuzzleState = (
  _set: StateSetter<PuzzleState, any>,
  _get: StateGetter<PuzzleState, any>
) => {
  const set = <T,>(fn: (s: PuzzleState) => T, id?: string): T => {
    return _set((s) => fn(s));
  };
  const setOnly = <T,>(fn: (stack: PuzzleState) => T, id?: string): T => {
    return _set((s) => fn(s));
  };
  const get = <T,>(fn: (stack: PuzzleState) => T, id?: string): T => {
    return _get((s) => fn(s));
  };
  return {
    puzzlePosition: null,
    turn: "w" as Color,
    shouldMakeMove: (move: Move) =>
      set((s) => {
        if (
          move.san == s.solutionMoves[0].san ||
          isCheckmate(move, s.puzzlePosition)
        ) {
          let otherSideMove = s.solutionMoves[1];
          s.puzzlePosition.move(move);
          if (otherSideMove) {
            s.puzzlePosition.move(otherSideMove);
            s.delegate.animatePieceMove(
              otherSideMove,
              PlaybackSpeed.Normal,
              () => {}
            );
          }
          s.solutionMoves.shift();
          s.solutionMoves.shift();
          if (!isEmpty(s.solutionMoves)) {
            s.delegate.onPuzzleMoveSuccess();
            s.progressMessage = {
              message: "Keep going...",
              type: ProgressMessageType.Success,
            };
          } else {
            s.delegate.onPuzzleMoveSuccess();
            s.delegate.onPuzzleSuccess();
          }
        } else {
          s.delegate.onPuzzleMoveFailure(move);
          s.progressMessage = {
            message: `${move.san} was not the right move, try again.`,
            // onPromptPress: () => {},
            // prompt: "Give up?",
            type: ProgressMessageType.Error,
          };
        }
        return false;
      }),
    madeMove: (move: Move) => set((state) => {}),
    completedMoveAnimation: (move: Move) => set((state) => {}),
    puzzle: DEBUG_MOCK_FETCH ? fakeBlackPuzzle : null,
    solutionMoves: [] as Move[],
    progressMessage: null as ProgressMessage,
  } as PuzzleState;
};
