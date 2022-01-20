import { Chess, Move } from '@lubert/chess.ts'
import { Square } from '@lubert/chess.ts/dist/types'
import { PlaybackSpeed } from './VisualizationState'
import { Animated } from 'react-native'

export interface ChessboardState {
  frozen?: boolean
  position?: Chess
  indicatorColor?: string
  squareHighlightAnims: Record<Square, Animated.Value>
  ringColor?: string
  ringIndicatorAnim?: Animated.Value
  hideColors?: boolean
  playbackSpeed?: PlaybackSpeed
  availableMoves: Move[]
  flipped?: boolean
  moveIndicatorAnim: Animated.ValueXY
  moveIndicatorOpacityAnim: Animated.Value
  highlightSquare?: Square
}
