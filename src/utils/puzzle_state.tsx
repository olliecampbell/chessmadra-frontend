import { isCheckmate } from "../utils/chess";
import { Color, Move } from "@lubert/chess.ts";
import { isEmpty } from "lodash-es";
import { LichessPuzzle } from "./models";
import { StateGetter, StateSetter } from "./state_setters_getters";
import {
  PlaybackSpeed,
  ProgressMessage,
  ProgressMessageType,
} from "~/types/VisualizationState";
import { ChessboardDelegate } from "./chessboard_interface";

export interface PuzzleState extends ChessboardDelegate {
  puzzlePosition: any;
  turn: Color;
  solutionMoves: Move[];
  puzzle: LichessPuzzle | null;
  progressMessage: ProgressMessage | null;
  delegate: PuzzleStateDelegate;
  shouldMakeMove: (move: Move) => boolean;
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
    // @ts-ignore
    delegate: null as PuzzleStateDelegate,
    puzzlePosition: null,
    turn: "w" as Color,
    shouldMakeMove: (move: Move) =>
      set((s) => {
        if (
          move.san == s.solutionMoves[0].san ||
          isCheckmate(move, s.puzzlePosition)
        ) {
          const otherSideMove = s.solutionMoves[1];
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
              message: `Keep going...`,
              // onPromptPress: () => {},
              // prompt: "Give up?",
              type: ProgressMessageType.Error,
            };
          } else {
            s.progressMessage = null;
            s.delegate.onPuzzleMoveSuccess();
            s.delegate.onPuzzleSuccess();
          }
          return true;
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
    puzzle: null,
    solutionMoves: [] as Move[],
    progressMessage: null,
  } as PuzzleState;
};
