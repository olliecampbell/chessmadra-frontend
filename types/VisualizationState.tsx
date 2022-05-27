import { ChessboardState } from "app/types/ChessboardBiref";
import { Animated } from "react-native";
import { Chess, Color, Move } from "@lubert/chess.ts";
import { StorageItem } from "app/utils/storageItem";
import { LichessPuzzle } from "app/models";
import { Square } from "@lubert/chess.ts/dist/types";
import { PuzzleTraining } from "app/utils/state";

export interface ColorTrainingState {
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
  chessState: ChessboardState;
  calculateRemainingTime: (state?: ColorTrainingState) => void;
  stopRound: (state?: ColorTrainingState) => void;
  startPlaying: (state?: ColorTrainingState) => void;
  flashRing: (success: boolean, state?: ColorTrainingState) => void;
  guessColor: (color: "light" | "dark", state?: ColorTrainingState) => void;
  clearHighlights: (state?: ColorTrainingState) => void;
  highlightNewSquare: (state?: ColorTrainingState) => void;
}

export interface PuzzleState {
  puzzlePosition: any;
  attemptSolution: (
    move: Move,
    state?: PuzzleState & PuzzleTraining<any>
  ) => void;
  turn: Color;
  solutionMoves: Move[];
  puzzle: LichessPuzzle;
  onSquarePress: (square: Square) => void;
  progressMessage?: ProgressMessage;
}

export interface VisualizationState
  extends PuzzleState,
    PuzzleTraining<VisualizationState> {
  progressMessage: ProgressMessage;
  animatePieceMove: (move: Move, state?: VisualizationState) => void;
  mockPassFail: boolean;
  helpOpen: boolean;
  showPuzzlePosition: boolean;
  currentPosition: Chess;
  isDone: boolean;
  playButtonFlashAnim: Animated.Value;
  plyUserSetting: StorageItem<number>;
  ratingGteUserSetting: StorageItem<PuzzleDifficulty>;
  ratingLteUserSetting: StorageItem<PuzzleDifficulty>;
  playbackSpeedUserSetting: StorageItem<PlaybackSpeed>;
  hiddenMoves: Move[];
  showHelpButton: boolean;
  autoPlay: boolean;
  nextPuzzle: LichessPuzzle;
  isPlaying: boolean;
  finishedAutoPlaying?: boolean;
  focusedMoveIndex: number;
  focusedMove: Move;
  canFocusNextMove: boolean;
  canFocusLastMove: boolean;
  onSuccess?: (state?: VisualizationState) => void;
  onFail?: (state?: VisualizationState) => void;
  showNotation: StorageItem<boolean>;
  chessState: ChessboardState;
  getFetchOptions: (state?: VisualizationState) => any;
  getPly: () => number;
  resetState: (state?: VisualizationState) => void;
  refreshPuzzle: (state?: VisualizationState) => void;
  startLoopingPlayFlash: (state?: VisualizationState) => void;
  stopLoopingPlayFlash: (state?: VisualizationState) => void;
  flashRing: (success?: boolean, state?: VisualizationState) => void;
  quick: (fn: any) => void;
  animateMoves: (state?: VisualizationState) => void;
  getSquareOffset: (square: Square, state?: VisualizationState) => any;
  animateMove: (
    state: VisualizationState,
    move: Move,
    backwards,
    callback: () => void
  ) => void;
  setupForPuzzle: (state?: VisualizationState) => void;
  onAutoPlayEnd?: (state?: VisualizationState) => void;
  toggleNotation: (state?: VisualizationState) => void;
  setPlaybackSpeed: (
    playbackSpeed: PlaybackSpeed,
    state?: VisualizationState
  ) => void;
  updatePly: (increment: number, state?: VisualizationState) => void;
}

export interface ClimbState extends VisualizationState {
  isPlayingClimb: boolean;
  delta: number;
  climb: Step[];
  score: StorageItem<number>;
  highScore: StorageItem<number>;
  step: Step;
  puzzleStartTime: number;
  lastPuzzleSuccess: boolean;
  currentPuzzleFailed: boolean;
  startPlayingClimb: () => void;
  onFail: () => void;
  onSuccess: () => void;
  animatePointChange: (state?: VisualizationState) => void;
  onAutoPlayEnd: () => void;
  initState: () => void;
  updateStep: (state?: VisualizationState) => void;
  scoreOpacityAnim: Animated.Value;
}

interface Step {
  puzzleDifficulty: number;
  hiddenMoves: number;
}

export interface ProgressMessage {
  message: string;
  prompt?: string;
  onPromptPress?: () => void;
  type: ProgressMessageType;
}
export enum ProgressMessageType {
  Error,
  Success,
}

export enum PuzzleDifficulty {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Expert = "Expert",
  Magnus = "Magnus",
}

export enum PlaybackSpeed {
  Slow = 0,
  Normal = 1,
  Fast = 2,
  Ludicrous = 3,
}

export const getPuzzleDifficultyRating = (pd: PuzzleDifficulty) => {
  switch (pd) {
    case PuzzleDifficulty.Beginner:
      return 0;
    case PuzzleDifficulty.Intermediate:
      return 1200;
    case PuzzleDifficulty.Expert:
      return 1800;
    case PuzzleDifficulty.Magnus:
      return 2500;
  }
};

export const getPuzzleDifficultyStepValue = (pd: PuzzleDifficulty) => {
  switch (pd) {
    case PuzzleDifficulty.Beginner:
      return 0;
    case PuzzleDifficulty.Intermediate:
      return 1;
    case PuzzleDifficulty.Expert:
      return 2;
    case PuzzleDifficulty.Magnus:
      return 3;
  }
};

export const stepValueToPuzzleDifficulty = (v: number) => {
  switch (v) {
    case 0:
      return PuzzleDifficulty.Beginner;
    case 1:
      return PuzzleDifficulty.Intermediate;
    case 2:
      return PuzzleDifficulty.Expert;
    case 3:
      return PuzzleDifficulty.Magnus;
  }
};
