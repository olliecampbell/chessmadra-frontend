import { ChessboardBiref, ChessboardState } from 'app/types/ChessboardBiref'
import { Chess, Color, Move } from '@lubert/chess.ts'
import { StorageItem } from 'app/utils/storageItem'
import { LichessPuzzle } from 'app/models'
export interface VisualizationState {
  progressMessage: ProgressMessage
  helpOpen: boolean
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
  onSuccess: () => void
  onFail: () => void
  puzzleDifficultySetting: number
  numberMovesHiddenSetting: number
  showNotation: StorageItem<boolean>
  turn: Color
  chessState: ChessboardState
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
