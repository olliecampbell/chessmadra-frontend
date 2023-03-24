import { Chess, Move } from "@lubert/chess.ts";
import { ProgressMessageType } from "~/types/VisualizationState";
import { fetchNewPuzzle } from "./api";
import { AppState } from "./app_state";
import { ChessboardState, createChessState } from "./chessboard_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { takeRight } from "lodash-es";
import { LichessPuzzle } from "~/utils/models";
import { getInitialPuzzleState, PuzzleState } from "./puzzle_state";
import { fensTheSame } from "./fens";
import { createQuick } from "./quick";
import { StorageItem } from "./storageItem";

export enum BlindfoldTrainingStage {
  Blindfold,
  Board,
}

export interface BlindfoldTrainingState {
  quick: (fn: (_: BlindfoldTrainingState) => void) => void;
  stage: BlindfoldTrainingStage;
  chessboardState?: ChessboardState;
  ratingGteUserSetting: StorageItem<number>;
  ratingLteUserSetting: StorageItem<number>;
  numPiecesGteUserSetting: StorageItem<number>;
  numPiecesLteUserSetting: StorageItem<number>;
  refreshPuzzle: () => void;
  nextPuzzle: LichessPuzzle;
  resetState: () => void;
  setupForPuzzle: () => void;
  getFetchOptions: () => any;
  isDone?: boolean;
  puzzleState?: PuzzleState;
}

type Stack = [BlindfoldTrainingState, AppState];

export const getInitialBlindfoldState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T): T => {
    return _set((s) => fn([s.blindfoldState, s]));
  };
  const setOnly = <T,>(fn: (stack: BlindfoldTrainingState) => T): T => {
    return set(([s]) => fn(s));
  };
  const get = <T,>(fn: (stack: Stack) => T): T => {
    return _get((s) => fn([s.blindfoldState, s]));
  };
  const setPuzzle = <T,>(fn: (s: PuzzleState) => T): T => {
    return _set((s) => fn(s.blindfoldState.puzzleState));
  };
  const getPuzzle = <T,>(fn: (s: PuzzleState) => T): T => {
    return _get((s) => fn(s.blindfoldState.puzzleState));
  };
  let initialState = {
    progressMessage: null,
    isDone: false,
    ...createQuick(setOnly),
    puzzleState: getInitialPuzzleState(setPuzzle, getPuzzle),
    getFetchOptions: () =>
      get(([s]) => {
        return {
          ratingGte: s.ratingGteUserSetting.value,
          ratingLte: s.ratingLteUserSetting.value,
          pieceCountLt: s.numPiecesLteUserSetting.value + 1,
          pieceCountGt: s.numPiecesGteUserSetting.value - 1,
        };
      }),
    refreshPuzzle: async () =>
      set(async ([s]) => {
        let p = s.nextPuzzle;
        if (!p) {
          p = await fetchNewPuzzle(s.getFetchOptions());
        }
        if (!p) {
          window.alert(
            "Problem fetching puzzles, please report this if you run into it, to me@mbuffett.com"
          );
          return;
        }
        // @ts-ignore
        set(([s]) => {
          s.puzzleState.puzzle = p;
          s.resetState();
          s.setupForPuzzle();
        });
      }),
    setupForPuzzle: () =>
      set(([s]) => {
        console.log("SETTING UP");
        let position = new Chess();
        for (let move of s.puzzleState.puzzle.allMoves) {
          position.move(move);
          if (fensTheSame(position.fen(), s.puzzleState.puzzle.fen)) {
            position.move(s.puzzleState.puzzle.moves[0], { sloppy: true });
            for (let solutionMove of s.puzzleState.puzzle.moves) {
              position.move(solutionMove, { sloppy: true });
            }
            s.puzzleState.solutionMoves = takeRight(
              position.history({ verbose: true }),
              s.puzzleState.puzzle.moves.length - 1
            );
            for (let i = 0; i < s.puzzleState.puzzle.moves.length - 1; i++) {
              position.undo();
            }
            s.chessboardState.position = position;
            s.puzzleState.puzzlePosition = position;
            s.chessboardState.flipped = position.turn() === "b";
            break;
          }
        }
        s.puzzleState.turn = s.chessboardState.position.turn();
      }),
    resetState: () =>
      set(([s]) => {
        s.stage = BlindfoldTrainingStage.Blindfold;
        s.isDone = false;
      }),
    nextPuzzle: null,
    stage: BlindfoldTrainingStage.Blindfold,
    numPiecesGteUserSetting: new StorageItem("blindfold-numPieces-gte-v3", 3),
    numPiecesLteUserSetting: new StorageItem("blindfold-numPieces-lte-v3", 5),
    ratingGteUserSetting: new StorageItem("blindfold-rating-gte-v3", 0),
    ratingLteUserSetting: new StorageItem("blindfold-rating-lte-v3", 1200),
  } as BlindfoldTrainingState;

  initialState.puzzleState = getInitialPuzzleState(setPuzzle, getPuzzle);
  initialState.puzzleState.delegate = {
    animatePieceMove: (...args) => {
      initialState.chessboardState.animatePieceMove(...args);
    },
    onPuzzleMoveSuccess: () =>
      set(([s]) => {
        s.chessboardState.flashRing(true);
        s.chessboardState.position = s.puzzleState.puzzlePosition;
        s.puzzleState.progressMessage = {
          message: "Keep going...",
          type: ProgressMessageType.Success,
        };
      }),
    onPuzzleMoveFailure: (move: Move) =>
      set(([s]) => {
        s.chessboardState.flashRing(false);
        s.puzzleState.progressMessage = {
          message: `${move.san} was not the right move, try again.`,
          type: ProgressMessageType.Error,
        };
      }),
    onPuzzleSuccess: () =>
      set(([s]) => {
        console.log("overall success");
        s.puzzleState.progressMessage = null;
        s.isDone = true;
      }),
  };

  const setChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _set((s) => fn(s.blindfoldState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _get((s) => fn(s.blindfoldState.chessboardState));
  };
  initialState.chessboardState = createChessState(setChess, getChess);
  initialState.chessboardState.delegate = initialState.puzzleState;
  return initialState;
};
