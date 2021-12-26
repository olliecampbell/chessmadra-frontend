import { ChessboardState } from 'app/types/ChessboardBiref'
import { Animated } from 'react-native'
import { Chess, Color, Move } from '@lubert/chess.ts'
import { StorageItem } from 'app/utils/storageItem'
import { LichessPuzzle } from 'app/models'
import { Square } from '@lubert/chess.ts/dist/types'

export interface VisualizationState {
  progressMessage: ProgressMessage
  mockPassFail: boolean
  availableMoves: Move[]
  helpOpen: boolean
  futurePosition: Chess
  showFuturePosition: boolean
  currentPosition: Chess
  isDone: boolean
  plyUserSetting: StorageItem<number>
  ratingGteUserSetting: StorageItem<PuzzleDifficulty>
  ratingLteUserSetting: StorageItem<PuzzleDifficulty>
  playbackSpeedUserSetting: StorageItem<PlaybackSpeed>
  hiddenMoves: Move[]
  solutionMoves: Move[]
  puzzle: LichessPuzzle
  showHelpButton: boolean
  autoPlay: boolean
  nextPuzzle: LichessPuzzle
  isPlaying: boolean
  focusedMoveIndex: number
  focusedMove: Move
  canFocusNextMove: boolean
  canFocusLastMove: boolean
  onSuccess?: () => void
  onFail?: () => void
  showNotation: StorageItem<boolean>
  turn: Color
  chessState: ChessboardState
  getFetchOptions: (state?: VisualizationState) => any
  getPly: () => number
  resetState: (state?: VisualizationState) => void
  refreshPuzzle: (state?: VisualizationState) => void
  flashRing: (success?: boolean, state?: VisualizationState) => void
  quick: (fn: any) => void
  animateMoves: (state?: VisualizationState) => void
  getSquareOffset: (square: Square, state?: VisualizationState) => any
  animateMove: (
    state: VisualizationState,
    move: Move,
    backwards,
    callback: () => void
  ) => void
  setupForPuzzle: (state?: VisualizationState) => void
  onAutoPlayEnd: (state?: VisualizationState) => void
  onSquarePress: (square: Square) => void
  toggleNotation: (state?: VisualizationState) => void
  setPlaybackSpeed: (
    playbackSpeed: PlaybackSpeed,
    state?: VisualizationState
  ) => void
  updatePly: (increment: number, state?: VisualizationState) => void
  attemptSolution: (move: Move, state?: VisualizationState) => void
}

export interface ClimbState extends VisualizationState {
  isPlayingClimb: boolean
  delta: number
  climb: Step[]
  score: StorageItem<number>
  highScore: StorageItem<number>
  step: Step
  puzzleStartTime: number
  lastPuzzleSuccess: boolean
  currentPuzzleFailed: boolean
  startPlayingClimb: () => void
  onFail: () => void
  onSuccess: () => void
  animatePointChange: () => void
  onAutoPlayEnd: () => void
  initState: () => void
  updateStep: () => void
  scoreOpacityAnim: Animated.Value
}

interface Step {
  puzzleDifficulty: number
  hiddenMoves: number
}

export interface ProgressMessage {
  message: string
  type: ProgressMessageType
}
export enum ProgressMessageType {
  Error,
  Success
}

export enum PuzzleDifficulty {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Expert = 'Expert',
  Magnus = 'Magnus'
}

export enum PlaybackSpeed {
  Slow = 0,
  Normal = 1,
  Fast = 2,
  Ludicrous = 3
}

export const getPuzzleDifficultyRating = (pd: PuzzleDifficulty) => {
  switch (pd) {
    case PuzzleDifficulty.Beginner:
      return 0
    case PuzzleDifficulty.Intermediate:
      return 1200
    case PuzzleDifficulty.Expert:
      return 1800
    case PuzzleDifficulty.Magnus:
      return 2500
  }
}
