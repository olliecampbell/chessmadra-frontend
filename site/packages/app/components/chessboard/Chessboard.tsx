import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  useWindowDimensions,
  View
} from 'react-native'
import { s, c } from 'app/styles'
import { times } from 'app/utils'
import BishopBlackIcon from 'app/components/chessboard/pieces/BishopBlackIcon'
import BishopWhiteIcon from 'app/components/chessboard/pieces/BishopWhiteIcon'
import KingBlackIcon from 'app/components/chessboard/pieces/KingBlackIcon'
import KingWhiteIcon from 'app/components/chessboard/pieces/KingWhiteIcon'
import KnightBlackIcon from 'app/components/chessboard/pieces/KnightBlackIcon'
import KnightWhiteIcon from 'app/components/chessboard/pieces/KnightWhiteIcon'
import PawnBlackIcon from 'app/components/chessboard/pieces/PawnBlackIcon'
import PawnWhiteIcon from 'app/components/chessboard/pieces/PawnWhiteIcon'
import QueenBlackIcon from 'app/components/chessboard/pieces/QueenBlackIcon'
import QueenWhiteIcon from 'app/components/chessboard/pieces/QueenWhiteIcon'
import RookBlackIcon from 'app/components/chessboard/pieces/RookBlackIcon'
import RookWhiteIcon from 'app/components/chessboard/pieces/RookWhiteIcon'
import { Chess, PieceSymbol, SQUARES } from '@lubert/chess.ts'
import {
  forEach,
  isEmpty,
  isNil,
  cloneDeep,
  takeRight,
  first,
  map,
  mapValues,
  isEqual,
  indexOf,
  drop
} from 'lodash'
import { useImmer } from 'use-immer'
import { LichessPuzzle } from 'app/models'
import client from 'app/client'
import { Spacer } from 'app/Space'
import { Move, Square } from '@lubert/chess.ts/dist/types'
import { ChessboardBiref, ChessboardState } from 'app/types/ChessboardBiref'
import { useEffectWithPrevious } from 'app/utils/useEffectWithPrevious'
import { useComponentLayout } from 'app/utils/useComponentLayout'
import { ChessColor } from 'app/types/Chess'
import {
  UpdatadableState,
  useStateUpdater,
  useStateUpdaterV2
} from '../../utils/useImmer'
import {
  PlaybackSpeed,
  PuzzleDifficulty,
  VisualizationState
} from 'app/types/VisualizationState'

const animatedXYToPercentage = (x) => {
  return s(
    c.top(
      x.y.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
      })
    ),
    c.left(
      x.x.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
      })
    )
  )
}

const cloneBoard = (board: Chess): Chess => {
  return new Chess(board.fen())
}

export const getPlaybackSpeedDescription = (ps: PlaybackSpeed) => {
  switch (ps) {
    case PlaybackSpeed.Slow:
      return 'Slow'
    case PlaybackSpeed.Normal:
      return 'Normal'
    case PlaybackSpeed.Fast:
      return 'Fast'
    case PlaybackSpeed.Ludicrous:
      return 'Ludicrous'
  }
}

enum ChessPiece {
  Pawn = 'p',
  Rook = 'r',
  Knight = 'n',
  Bishop = 'b',
  Queen = 'q',
  King = 'k'
}

const getIconForPiece = (piece: PieceSymbol, color: ChessColor) => {
  switch (color) {
    case 'b':
      switch (piece) {
        case ChessPiece.Rook:
          return <RookBlackIcon />
        case ChessPiece.Pawn:
          return <PawnBlackIcon />
        case ChessPiece.Knight:
          return <KnightBlackIcon />
        case ChessPiece.Queen:
          return <QueenBlackIcon />
        case ChessPiece.Bishop:
          return <BishopBlackIcon />
        case ChessPiece.King:
          return <KingBlackIcon />
      }
    case 'w':
      switch (piece) {
        case ChessPiece.Rook:
          return <RookWhiteIcon />
        case ChessPiece.Pawn:
          return <PawnWhiteIcon />
        case ChessPiece.Knight:
          return <KnightWhiteIcon />
        case ChessPiece.Queen:
          return <QueenWhiteIcon />
        case ChessPiece.Bishop:
          return <BishopWhiteIcon />
        case ChessPiece.King:
          return <KingWhiteIcon />
      }
  }
}

export const PieceView = ({
  piece,
  color
}: {
  piece: PieceSymbol
  color: ChessColor
}) => {
  return (
    <View style={s(c.fullWidth, c.fullHeight)}>
      {getIconForPiece(piece, color)}
    </View>
  )
}

const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const rows = [1, 2, 3, 4, 5, 6, 7, 8]
export const getAnimationDurations = (playbackSpeed: PlaybackSpeed) => {
  switch (playbackSpeed) {
    case PlaybackSpeed.Slow:
      return {
        moveDuration: 300,
        fadeDuration: 200,
        stayDuration: 500
      }
    case PlaybackSpeed.Normal:
      return {
        moveDuration: 200,
        fadeDuration: 150,
        stayDuration: 300
      }
    case PlaybackSpeed.Fast:
      return {
        moveDuration: 200,
        fadeDuration: 100,
        stayDuration: 100
      }
    case PlaybackSpeed.Ludicrous:
      return {
        moveDuration: 150,
        fadeDuration: 50,
        stayDuration: 50
      }
  }
}

export const ChessboardView = ({
  hideColors,
  playbackSpeed = PlaybackSpeed.Normal,
  biref,
  state,
  styles,
  frozen = false
}: {
  hideColors?: boolean
  playbackSpeed?: PlaybackSpeed
  frozen?: boolean
  state?: ChessboardState
  styles?: any
  biref: ChessboardBiref
}) => {
  // @ts-ignore
  let [{ height: chessboardSize }, onChessboardLayout] = useComponentLayout()
  const { currentPosition, showFuturePosition } = state
  // debugger
  chessboardSize = chessboardSize ?? 500 // just for first render
  const tileStyles = s(c.bg('green'), c.grow)
  let [availableMoves, setAvailableMoves] = useState([] as Move[])
  biref.setAvailableMoves = setAvailableMoves
  // biref.state = state
  let [animatedMovesQueue, setAnimatedMovesQueue] = useImmer([] as Move[])
  const [laggingPosition, setLaggingPosition] = useState(null as Chess)
  biref.animateMove = useCallback(
    (move) => {
      // TODO: make animation work better
      return null
      if (isNil(laggingPosition)) {
        setLaggingPosition((laggingPosition) => {
          let lp = cloneBoard(state.futurePosition)
          lp.move(move)
          return lp
        })
      }
      setAnimatedMovesQueue((s) => [...s, move])
    },
    [animatedMovesQueue]
  )
  const currentAnimatedMove = animatedMovesQueue[0]
  const animatedMoveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  useEffect(() => {
    if (currentAnimatedMove) {
      animatedMoveAnim.setValue(getSquareOffset(currentAnimatedMove.from))
      Animated.sequence([
        Animated.timing(animatedMoveAnim, {
          toValue: getSquareOffset(currentAnimatedMove.to),
          duration: 300,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease)
        })
      ]).start(() => {
        setAnimatedMovesQueue((s) => {
          if (s[1]) {
            laggingPosition.move(s[1])
          } else {
            setLaggingPosition(null)
          }
          return drop(s, 1)
        })
      })
    }
  }, [currentAnimatedMove])
  useEffect(() => {
    let id = window.setInterval(() => {}, 500)
    return () => {
      window.clearInterval(id)
    }
  }, [])

  const getIsFlipped = () => {
    if (!state.futurePosition) {
      return false
    }
    return state.futurePosition.turn() === 'b'
  }

  const getSquareOffset = useCallback(
    (square: string) => {
      const [file, rank] = square
      let x = indexOf(columns, file)
      let y = 7 - indexOf(rows, parseInt(rank))
      if (getIsFlipped()) {
        x = 7 - x
        y = 7 - y
      }
      return { x: x / 8, y: y / 8 }
    },
    [chessboardSize]
  )
  const moveIndicatorAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const [moveIndicatorColor, setMoveIndicatorColor] = useState(null)
  const moveIndicatorOpacityAnim = useRef(new Animated.Value(0)).current
  biref.highlightMove = useCallback(
    (move: Move, backwards = false, callback: () => void) => {
      // TODO: use own flipped value, but it gets outdated right now, so passing it in.
      let { fadeDuration, moveDuration, stayDuration } =
        getAnimationDurations(playbackSpeed)
      setMoveIndicatorColor(
        move.color == 'b' ? c.hsl(180, 15, 10, 80) : c.hsl(180, 15, 100, 80)
      )
      let [start, end] = backwards ? [move.to, move.from] : [move.from, move.to]
      moveIndicatorAnim.setValue(getSquareOffset(start))
      Animated.sequence([
        Animated.timing(moveIndicatorOpacityAnim, {
          toValue: 1.0,
          duration: fadeDuration,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.delay(stayDuration),
        Animated.timing(moveIndicatorAnim, {
          toValue: getSquareOffset(end),
          duration: moveDuration,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.delay(stayDuration),
        Animated.timing(moveIndicatorOpacityAnim, {
          toValue: 0,
          duration: fadeDuration,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease)
        })
      ]).start(callback)
    },
    [playbackSpeed]
  )
  // TODO: maybe remove
  const squareHighlightAnims = useMemo(() => {
    return mapValues(SQUARES, (number, square) => {
      return new Animated.Value(0.0)
    })
  }, [])

  const ringIndicatorAnim = useRef(new Animated.Value(0)).current
  const animDuration = 200
  const [highlightedSquares, setHighlightedSquares] = useImmer([] as Square[])
  useEffectWithPrevious(
    (previousHighlightedSquares = []) => {
      let highlightFadeDuration = 100
      previousHighlightedSquares.map((sq) => {
        Animated.timing(squareHighlightAnims[sq], {
          toValue: 0,
          duration: animDuration,
          useNativeDriver: false
        }).start()
      })
      highlightedSquares.map((sq) => {
        Animated.timing(squareHighlightAnims[sq], {
          toValue: 0.8,
          duration: animDuration,
          useNativeDriver: false
        }).start()
      })
    },
    [highlightedSquares]
  )
  const [ringColor, setRingColor] = useState(c.colors.successColor)
  const flashRing = (success = true) => {
    setRingColor(success ? c.colors.successColor : c.colors.failureColor)
    Animated.sequence([
      Animated.timing(ringIndicatorAnim, {
        toValue: 1,
        duration: animDuration,
        useNativeDriver: false
      }),

      Animated.timing(ringIndicatorAnim, {
        toValue: 0,
        duration: animDuration,
        useNativeDriver: false
      })
    ]).start()
  }
  biref.flashRing = flashRing
  biref.highlightSquare = (square?: Square) => {
    setHighlightedSquares(square ? [square] : [])
  }
  const testRef = useRef(null)
  useEffect(() => {
    if (testRef.current) {
      testRef.current.setAttribute('id', 'test')
    }
  })
  const hiddenColorsBorder = `1px solid ${c.grays[70]}`
  let position = showFuturePosition ? state.futurePosition : currentPosition
  useEffect(() => {
    if (laggingPosition) {
      // window.laggingPosition = laggingPosition
    }
  }, [laggingPosition?.fen])

  const { width: windowWidth } = useWindowDimensions()
  return (
    <View
      style={s(c.pb('100%'), c.height(0), c.width('100%'), styles)}
      // @ts-ignore
      onLayout={onChessboardLayout}
    >
      <View
        style={s(
          {
            width: '100%',
            height: '100%',
            position: 'absolute',
            borderRadius: 2,
            overflow: 'hidden',
            shadowColor: 'black',
            shadowOpacity: 0.4,
            shadowRadius: 10
          },
          hideColors && c.border(hiddenColorsBorder)
        )}
      >
        <Animated.View
          ref={testRef}
          pointerEvents="none"
          style={s(
            c.size('calc(1/8 * 100%)'),
            c.zIndex(5),
            c.absolute,
            c.center,
            c.opacity(moveIndicatorOpacityAnim),
            animatedXYToPercentage(moveIndicatorAnim)
          )}
        >
          <View
            style={s(
              c.size('50%'),
              c.round,
              c.bg(moveIndicatorColor),
              c.shadow(0, 0, 4, 0, c.hsl(0, 0, 0, 50))
            )}
          ></View>
        </Animated.View>
        <Animated.View // Special animatable View
          style={s(
            c.absolute,
            c.fullWidth,
            c.fullHeight,
            c.zIndex(3),
            // c.bg("black"),
            c.border(`6px solid ${ringColor}`),
            // @ts-ignore
            c.opacity(ringIndicatorAnim)
          )}
          pointerEvents="none"
        ></Animated.View>
        {Object.keys(SQUARES).map((sq) => {
          let pos = laggingPosition ?? position
          let piece = null
          if (pos) {
            piece = pos.get(sq)
          }
          let layout = {}
          if (currentAnimatedMove && currentAnimatedMove.to === sq) {
            // layout = animatedXYToPercentage(currentAnimatedMove)
          }

          let posStyles = s(
            c.top(`${getSquareOffset(sq).y * 100}%`),
            c.left(`${getSquareOffset(sq).x * 100}%`)
          )
          let pieceView = null
          if (piece) {
            pieceView = (
              <Animated.View
                style={s(
                  c.fullWidth,
                  c.absolute,
                  posStyles,
                  c.zIndex(1),
                  c.size('12.5%'),
                  layout
                )}
                pointerEvents="none"
              >
                <PieceView piece={piece['type']} color={piece['color']} />
              </Animated.View>
            )
          }
          let moveIndicatorView = null
          let availableMove = availableMoves.find((m) => m.to == sq)
          if (availableMove) {
            moveIndicatorView = (
              <Animated.View
                style={s(
                  c.fullWidth,
                  c.absolute,
                  posStyles,
                  c.zIndex(2),
                  c.center,
                  c.size('12.5%'),
                  layout
                )}
                pointerEvents="none"
              >
                <View
                  style={s(
                    c.size('30%'),
                    c.opacity(40),
                    c.round,
                    c.bg('black'),
                    c.absolute,
                    c.zIndex(4)
                  )}
                />
              </Animated.View>
            )
          }
          return (
            <>
              {pieceView}
              {moveIndicatorView}
            </>
          )
        })}
        <View style={s(c.column, c.fullWidth, c.fullHeight)}>
          {times(8)((i) => {
            return (
              <View
                key={i}
                style={s(c.fullWidth, c.bg('red'), c.row, c.grow, c.flexible)}
              >
                {times(8)((j) => {
                  let color =
                    (i + j) % 2 == 0 ? c.colors.lightTile : c.colors.darkTile
                  if (hideColors) {
                    color = c.grays[30]
                  }
                  let square = `${columns[j]}${rows[7 - i]}` as Square
                  if (getIsFlipped()) {
                    square = `${columns[7 - j]}${rows[i]}` as Square
                  }
                  let piece = position?.get(square)
                  let availableMove = availableMoves.find((m) => m.to == square)
                  const isBottomEdge = i == 7
                  const isRightEdge = j == 7
                  return (
                    <Pressable
                      key={j}
                      style={s(
                        tileStyles,
                        c.bg(color),
                        c.center,
                        c.clickable,
                        c.flexible,
                        c.overflowHidden,
                        hideColors &&
                          s(
                            !isBottomEdge && c.borderBottom(hiddenColorsBorder),
                            !isRightEdge && c.borderRight(hiddenColorsBorder)
                          )
                      )}
                      onPress={() => {
                        if (availableMove) {
                          setAvailableMoves([])
                          biref.attemptSolution(availableMove)
                          return
                        }
                        if (!state.futurePosition) {
                          return
                        }
                        let moves = state.futurePosition.moves({
                          square,
                          verbose: true
                        })
                        if (
                          !isEmpty(availableMoves) &&
                          first(availableMoves).from == square
                        ) {
                          setAvailableMoves([])
                        } else if (!frozen) {
                          // @ts-ignore
                          setAvailableMoves(moves)
                        }
                      }}
                    >
                      <Animated.View
                        style={s(
                          {
                            opacity: squareHighlightAnims[square]
                          },
                          c.bg(c.primaries[60]),
                          c.absolute,
                          c.size('100%'),
                          c.zIndex(4)
                        )}
                      ></Animated.View>
                    </Pressable>
                  )
                })}
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}
