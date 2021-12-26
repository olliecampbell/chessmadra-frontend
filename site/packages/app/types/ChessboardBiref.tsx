import { Chess, Move } from '@lubert/chess.ts'
import { Square } from '@lubert/chess.ts/dist/types'
import { UpdatadableState } from '../utils/useImmer'
import { PlaybackSpeed } from './VisualizationState'
import { Animated } from 'react-native'

export interface ChessboardState {
  frozen?: boolean
  position?: Chess
  indicatorColor?: string
  ringColor?: string
  ringIndicatorAnim?: Animated.Value
  hideColors?: boolean
  playbackSpeed?: PlaybackSpeed
  availableMoves: Move[]
  flipped?: boolean
  moveIndicatorAnim: Animated.ValueXY
  moveIndicatorOpacityAnim: Animated.Value
}

// export interface ChessboardBiref {
//   setAvailableMoves?: (m: Move[]) => void
//   flashRing?: (success?: boolean) => void
//   highlightSquare?: (square: Square) => void
//   highlightMove?: (
//     move: Move,
//     backwards?: boolean,
//     cb?: () => void,
//     flipped?: boolean
//   ) => void
//   animateMove?: (move: Move) => void
//   attemptSolution?: (move: Move) => void
// }
