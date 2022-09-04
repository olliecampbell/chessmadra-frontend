import { Animated } from "react-native";
import { Chess, Move } from "@lubert/chess.ts";
import { StorageItem } from "app/utils/storageItem";
import { LichessPuzzle } from "app/models";
import {
  ChessboardState,
} from "app/utils/chessboard_state";
import { PuzzleState } from "app/utils/puzzle_state";

export interface VisualizationState {
  puzzleState: PuzzleState;
  chessboardState: ChessboardState;

  progressMessage: ProgressMessage;
  mockPassFail: boolean;
  helpOpen: boolean;
  showPuzzlePosition: boolean;
  currentPosition: Chess;
  isDone: boolean;
  playButtonFlashAnim: Animated.Value;
  plyUserSetting: StorageItem<number>;
  ratingGteUserSetting: StorageItem<number>;
  ratingLteUserSetting: StorageItem<number>;
  playbackSpeedUserSetting: StorageItem<PlaybackSpeed>;
  hiddenMoves: Move[];
  showHelpButton: boolean;
  autoPlay: boolean;
  nextPuzzle: LichessPuzzle;
  isPlaying: boolean;
  focusedMoveIndex: number;
  focusedMove: Move;
  canFocusNextMove: boolean;
  canFocusLastMove: boolean;
  showNotation: StorageItem<boolean>;
  getFetchOptions: () => any;
  getPly: () => number;
  resetState: () => void;
  refreshPuzzle: () => void;
  startLoopingPlayFlash: () => void;
  stopLoopingPlayFlash: () => void;
  quick: (fn: any) => void;
  setupForPuzzle: () => void;
  finishedAutoPlaying: boolean;
  toggleNotation: () => void;
  visualizeHiddenMoves: (callback?: () => void) => void;
  setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) => void;
  updatePly: (increment: number) => void;

  // Climb stuff
  isPlayingClimb?: boolean;
  delta?: number;
  climb?: Step[];
  score?: StorageItem<number>;
  highScore?: StorageItem<number>;
  step?: Step;
  puzzleStartTime?: number;
  lastPuzzleSuccess?: boolean;
  currentPuzzleFailed?: boolean;
  startPlayingClimb?: () => void;
  onFail?: () => void;
  onSuccess?: () => void;
  animatePointChange?: () => void;
  onAutoPlayEnd?: () => void;
  initState?: () => void;
  updateStep?: () => void;
  scoreOpacityAnim?: Animated.Value;
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
