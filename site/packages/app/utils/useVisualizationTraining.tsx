import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View
} from 'react-native'
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from 'app/styles'
import { Spacer } from 'app/Space'
import {
  ChessboardView,
  getAnimationDurations,
  getPlaybackSpeedDescription
} from 'app/components/chessboard/Chessboard'
import axios from 'axios'
import { Helmet } from 'react-helmet'
import {
  useStateUpdater,
  UpdatadableState,
  useStateUpdaterV2
} from 'app/utils/useImmer'
import { Chess, Color, Move } from '@lubert/chess.ts'
import client from 'app/client'
import {
  cloneDeep,
  isEmpty,
  isNil,
  takeRight,
  drop,
  dropRight,
  indexOf
} from 'lodash'
import { MoveList } from 'app/components/MoveList'
import { LichessPuzzle } from 'app/models'
import { ChessboardBiref, ChessboardState } from 'app/types/ChessboardBiref'
// import { Feather } from "@expo/vector-icons";
// import Icon from 'react-native-vector-icons/MaterialIcons'
import { Button } from 'app/components/Button'
import useState from 'react-usestateref'
import { useStorageState } from 'react-storage-hooks'
import { TrainerLayout } from 'app/components/TrainerLayout'
import { useIsMobile } from 'app/utils/isMobile'
import { StorageItem } from 'app/utils/storageItem'
import { fakePuzzle, fakeBlackPuzzle } from 'app/mocks/puzzles'
import KingWhiteIcon from 'app/components/chessboard/pieces/KingWhiteIcon'
import KingBlackIcon from 'app/components/chessboard/pieces/KingBlackIcon'
import { Modal } from 'app/components/Modal'
import { intersperse } from 'app/utils/intersperse'
import { Draft, WritableDraft } from 'immer/dist/internal'
import { current } from 'immer'
import AnimateNumber from 'react-native-animate-number'
import {
  PlaybackSpeed,
  PuzzleDifficulty,
  VisualizationState,
  ProgressMessage,
  ProgressMessageType
} from 'app/types/VisualizationState'

const fensTheSame = (x, y) => {
  if (x.split(' ')[0] == y.split(' ')[0]) {
    return true
  }
}

interface PuzzleFetchOptions {
  ratingGte?: number
  ratingLte?: number
  maxPly?: number
}

const isCheckmate = (move: Move, position: Chess | Draft<Chess>) => {
  position.move(move)
  let isCheckMate = position.inCheckmate()
  position.undo()
  return isCheckMate
}

const SettingsOption = <T,>({
  choices,
  onSelect,
  renderChoice,
  activeChoice
}: {
  choices: T[]
  activeChoice: T
  onSelect: (_: T) => void
  renderChoice: (_: T) => JSX.Element
}) => {
  return (
    <View style={s(c.ml(12))}>
      {intersperse(
        choices.map((choice, i) => {
          const active = choice === activeChoice
          return (
            <Pressable
              onPress={() => {
                onSelect(choice)
              }}
              key={i}
              style={s(c.row)}
            >
              <i
                style={s(c.fg(c.colors.textPrimary))}
                className={active ? `fas fa-circle` : `fa-regular fa-circle`}
              ></i>
              <Spacer width={12} />
              <Text style={s(c.fg(c.colors.textPrimary), c.weightSemiBold)}>
                {renderChoice(choice)}
              </Text>
            </Pressable>
          )
        }),
        (i) => {
          return <Spacer key={`space-${i}`} height={12} />
        }
      )}
    </View>
  )
}
const SettingsTitle = ({ text }) => {
  return (
    <View
      style={s(c.fullWidth, c.px(12), c.py(12), c.bg(c.grays[20]), c.br(2))}
    >
      <Text style={s(c.fg(c.colors.textPrimary), c.fontSize(18), c.weightBold)}>
        {text}
      </Text>
    </View>
  )
}

const test = false
const testProgress = false
const debugButtons = false

const fetchNewPuzzle = async ({
  ratingGte,
  ratingLte,
  maxPly
}: PuzzleFetchOptions): Promise<LichessPuzzle> => {
  if (test) {
    return cloneDeep(fakePuzzle)
  }
  try {
    let response = await client.post('/api/v2/tactic', {
      maxPly,
      ratingGte,
      ratingLte,
      playerRatingGte: 1600
    })
    // @ts-ignore
    return response.data.tactic as LichessPuzzle
  } catch (error) {
    console.log(error)
  }
}

const allDifficulties = [
  PuzzleDifficulty.Beginner,
  PuzzleDifficulty.Intermediate,
  PuzzleDifficulty.Expert,
  PuzzleDifficulty.Magnus
]

const getPuzzleDifficultyRating = (pd: PuzzleDifficulty) => {
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

const getFetchOptions = (state: WritableDraft<VisualizationState>) => {
  if (state.numberMovesHiddenSetting && state.puzzleDifficultySetting) {
    return {
      ratingGte: state.puzzleDifficultySetting - 25,
      ratingLte: state.puzzleDifficultySetting + 25,
      maxPly: state.numberMovesHiddenSetting
    }
  }
  return {
    ratingGte: getPuzzleDifficultyRating(state.ratingGteUserSetting.value),
    ratingLte: getPuzzleDifficultyRating(state.ratingLteUserSetting.value),
    maxPly: state.plyUserSetting.value
  }
}

const resetState = (state: WritableDraft<VisualizationState>) => {
  state.chessState.showFuturePosition = false
  state.progressMessage = null
  state.isDone = false
}

const refreshPuzzle = async (
  state: WritableDraft<VisualizationState>,
  updateState,
  onAutoPlayEnd?: any
) => {
  let p = state.nextPuzzle
  if (state.nextPuzzle) {
    state.nextPuzzle = null
  }
  if (!p) {
    p = await fetchNewPuzzle(getFetchOptions(state))
  }
  if (!p) {
    window.alert(
      'Problem fetching puzzles, please report this if you run into it, to me@mbuffett.com'
    )
    return
  }
  state.puzzle = p
  resetState(state)
  setupForPuzzle(state, updateState, onAutoPlayEnd)
}

const focusOnMove = (
  state: WritableDraft<VisualizationState>,
  i,
  cb,
  backwards = false
) => {
  biref.highlightMove?.(state.hiddenMoves[i], backwards, () => {
    if (cb) {
      cb()
    }
  })
  state.focusedMoveIndex = i
}

const focusLastMove = (state: WritableDraft<VisualizationState>) => {
  if (state.canFocusLastMove) {
    biref.highlightMove?.(
      state.hiddenMoves[state.focusedMoveIndex],
      true,
      () => {}
    )
    let i = state.focusedMoveIndex - 1
    if (i == -1) {
      state.focusedMoveIndex = null
    } else {
      state.focusedMoveIndex = i
    }
  }
}

const animateMoves = (
  state: WritableDraft<VisualizationState>,
  updateState,
  cb?: () => void
) => {
  if (state.isPlaying) {
    state.isPlaying = false
    return
  }
  state.isPlaying = true
  let moves = cloneDeep(state.hiddenMoves)
  let i = 0
  let animateNextMove = (state: WritableDraft<VisualizationState>) => {
    let move = moves.shift()
    // TODO: something to deal with this state being old
    if (move && state.isPlaying) {
      focusOnMove(state, i, () => {
        // let delay = getAnimationDurations(playbackSpeed)[2]
        // window.setTimeout(() => {
        updateState((s) => {
          animateNextMove(s)
        })
        // }, delay)
      })
      i++
    } else {
      state.isPlaying = false
      state.focusedMoveIndex = null
      cb?.()
    }
  }
  animateNextMove(state)
}

const attemptSolution = (
  state: WritableDraft<VisualizationState>,
  move: Move
) => {
  if (
    move.san == state.solutionMoves[0].san ||
    isCheckmate(move, state.chessState.futurePosition)
  ) {
    state.chessState.showFuturePosition = true
    biref.flashRing()
    let otherSideMove = state.solutionMoves[1]
    if (state.chessState.showFuturePosition) {
      biref.animateMove(move)
    } else {
    }
    if (otherSideMove) {
      biref.animateMove(state.solutionMoves[1])
    }
    // TODO: clone board?
    state.chessState.futurePosition.move(move)
    if (otherSideMove) {
      state.chessState.futurePosition.move(otherSideMove)
    }
    state.solutionMoves.shift()
    state.solutionMoves.shift()
    if (!isEmpty(state.solutionMoves)) {
      state.progressMessage = {
        message: 'Keep going...',
        type: ProgressMessageType.Success
      }
    } else {
      state.progressMessage = null
      state.isDone = true
      if (state.onSuccess) {
        state.onSuccess()
      } else {
      }
    }
    return s
  } else {
    biref.flashRing(false)
    state.onFail?.()
    state.progressMessage = {
      message: `${move.san} was not the right move, try again.`,
      type: ProgressMessageType.Error
    }
  }
}

// Scratch area
// state.focusedMove = !isNil(focusedMoveIndex) && hiddenMoves && hiddenMoves[focusedMoveIndex]
// let canFocusNextMove =
//   hiddenMoves && focusedMoveIndex != hiddenMoves.length - 1
// let canFocusLastMove = !isNil(focusedMoveIndex)

const focusNextMove = (state: WritableDraft<VisualizationState>) => {
  if (state.canFocusNextMove) {
    let i = isNil(state.focusedMoveIndex) ? 0 : state.focusedMoveIndex + 1
    focusOnMove(state, i, null, false)
  }
}

const getPly = (
  state: VisualizationState | WritableDraft<VisualizationState>
) => {
  return state.numberMovesHiddenSetting || state.plyUserSetting.value
}

const setupForPuzzle = (
  state: WritableDraft<VisualizationState>,
  updateState,
  onAutoPlayEnd?: any
) => {
  console.log('Setting up!')
  state.focusedMoveIndex = null
  let currentPosition = new Chess()
  let futurePosition = new Chess()
  console.log(state)
  for (let move of state.puzzle.allMoves) {
    currentPosition.move(move)
    futurePosition.move(move)
    if (fensTheSame(currentPosition.fen(), state.puzzle.fen)) {
      futurePosition.move(state.puzzle.moves[0], { sloppy: true })
      currentPosition.move(state.puzzle.moves[0], { sloppy: true })
      let hiddenMoves = takeRight(
        currentPosition.history({ verbose: true }),
        getPly(state)
      )
      let boardForPuzzleMoves = futurePosition.clone()
      boardForPuzzleMoves.undo()
      for (let solutionMove of state.puzzle.moves) {
        boardForPuzzleMoves.move(solutionMove, { sloppy: true })
      }
      // @ts-ignore
      state.solutionMoves = takeRight(
        boardForPuzzleMoves.history({ verbose: true }),
        state.puzzle.moves.length - 1
      )
      // currentPosition.undo()

      state.hiddenMoves = hiddenMoves
      for (let i = 0; i < getPly(state); i++) {
        currentPosition.undo()
      }
      // state.currentPosition = currentPosition
      state.chessState.futurePosition = futurePosition
      state.chessState.currentPosition = currentPosition
      state.chessState.showFuturePosition = false
      state.chessState.flipped = futurePosition.turn() === 'b'
      biref.setAvailableMoves?.([])
      break
    }
  }
  state.turn = state.chessState.futurePosition.turn()
  if (state.autoPlay) {
    console.log('Auto-playing moves')
    animateMoves(state, updateState, () => {
      onAutoPlayEnd?.()
    })
  }
}

const biref = {} as ChessboardBiref

export const useVisualizationTraining = ({
  mockPassFail,
  onFail,
  autoPlay,
  isClimb,
  puzzleDifficultySetting,
  numberMovesHiddenSetting,
  onAutoPlayEnd,
  score,
  scoreChangeView,
  onSuccess,
  onResetClimb
}: {
  mockPassFail?: boolean
  onFail?: () => void
  autoPlay?: boolean
  isClimb?: boolean
  puzzleDifficultySetting?: number
  numberMovesHiddenSetting?: number
  onAutoPlayEnd?: () => void
  score?: number
  scoreChangeView?: JSX.Element
  onSuccess?: () => void
  onResetClimb?: () => void
}) => {
  biref.attemptSolution = (move: Move) => {
    updateState((s) => {
      attemptSolution(s, move)
    })
  }
  const [state, updateState] = useStateUpdater({
    progressMessage: (testProgress
      ? { message: 'Test message', type: ProgressMessageType.Error }
      : null) as ProgressMessage,

    isDone: false,
    puzzleDifficultySetting,
    numberMovesHiddenSetting,
    showNotation: new StorageItem('show-notation', false),
    plyUserSetting: new StorageItem('visualization-ply', 2),
    ratingGteUserSetting: new StorageItem(
      'puzzle-rating-gte-v2',
      PuzzleDifficulty.Beginner
    ),
    ratingLteUserSetting: new StorageItem(
      'puzzle-rating-lte-v2',
      PuzzleDifficulty.Intermediate
    ),
    playbackSpeedUserSetting: new StorageItem(
      'playback-speed',
      PlaybackSpeed.Normal
    ),
    hiddenMoves: null,
    autoPlay,
    solutionMoves: [] as Move[],
    puzzle: test ? fakeBlackPuzzle : null,
    turn: 'w',
    showHelpButton: true,
    nextPuzzle: null,
    isPlaying: false,
    focusedMoveIndex: null,
    focusedMove: null,
    canFocusNextMove: false,
    canFocusLastMove: false,
    onSuccess: onSuccess,
    onFail: onFail,
    helpOpen: false,
    chessState: {
      flipped: false,
      currentPosition: new Chess(),
      futurePosition: new Chess(),
      showFuturePosition: false,
      test: 0
    }
  } as VisualizationState)
  const { chessState } = state

  const isMobile = useIsMobile()
  useEffect(() => {
    setTimeout(() => {
      document.title = 'chessmadra'
    }, 100)
  })
  // Styles
  const incrementDecrementStyles = s(c.buttons.basic, c.size(40))
  const incrementDecrementTextStyles = s(
    c.fg(c.colors.textInverse),
    c.fontSize(14)
  )
  useEffect(() => {
    updateState(async (s) => {
      await refreshPuzzle(s, updateState, onAutoPlayEnd)
    })
  }, [])
  const [settingsOpen, setSettingsOpen] = useState(false)

  // useEffect(() => {
  //   if (autoPlay && puzzle && hiddenMoves) {
  //     animateMoves()
  //   }
  // }, [puzzle, hiddenMoves])

  const nextPreviousStyles = s(c.size(60), c.center)
  const bottomRowButtonStyles = s(c.buttons.basic, c.size(48))
  const ratingTitleStyles = s(
    c.fg(c.colors.textPrimary),
    c.fontSize(16),
    c.weightSemiBold
  )
  const player = (
    <>
      <View style={s(c.row, c.alignStretch, c.fullWidth)}>
        {/* <Button */}
        {/*   style={s(nextPreviousStyles)} */}
        {/*   onPress={() => { */}
        {/*     focusLastMove() */}
        {/*   }} */}
        {/* > */}
        {/*   <i */}
        {/*     style={s( */}
        {/*       c.fg(c.colors.textPrimary), */}
        {/*       c.opacity(canFocusLastMove ? 90 : 50) */}
        {/*     )} */}
        {/*     className="fas fa-backward-step" */}
        {/*   ></i> */}
        {/* </Button> */}
        <Button
          style={s(
            c.grow,
            // c.mx(20),
            c.buttons.primary,
            c.height(60),
            c.py(0),
            c.fontSize(18)
          )}
          onPress={() => {
            updateState((s) => {
              animateMoves(s, updateState)
            })
          }}
        >
          <i
            style={s(c.fg(c.colors.textPrimary))}
            className={`fas ${state.isPlaying ? 'fa-pause' : 'fa-play'}`}
          ></i>
        </Button>
        {/* <Button */}
        {/*   style={s(nextPreviousStyles)} */}
        {/*   onPress={() => { */}
        {/*     focusNextMove() */}
        {/*   }} */}
        {/* > */}
        {/*   <i */}
        {/*     style={s( */}
        {/*       c.fg(c.colors.textPrimary), */}
        {/*       c.opacity(canFocusNextMove ? 90 : 50) */}
        {/*     )} */}
        {/*     className="fas fa-forward-step" */}
        {/*   ></i> */}
        {/* </Button> */}
      </View>
      <Spacer height={12} />
    </>
  )

  let ui = (
    <>
      {state.progressMessage && (
        <>
          <View style={s(c.br(4), c.fullWidth)}>
            <Text
              style={s(
                c.fg(
                  state.progressMessage.type === ProgressMessageType.Error
                    ? c.colors.failureLight
                    : c.primaries[60]
                ),
                c.weightBold,
                c.fontSize(isMobile ? 14 : 16)
              )}
            >
              {state.progressMessage.message}
            </Text>
          </View>
          <Spacer height={12} />
        </>
      )}
      {state.isDone && (
        <>
          <Button
            style={s(state.isDone ? c.buttons.primary : c.buttons.basic)}
            onPress={() => {
              updateState(async (s) => {
                await refreshPuzzle(s, updateState, onAutoPlayEnd)
              })
            }}
          >
            <Text
              style={s(
                state.isDone
                  ? c.buttons.primary.textStyles
                  : c.buttons.basic.textStyles
              )}
            >
              <i
                style={s(
                  c.fg(
                    state.isDone ? c.colors.textPrimary : c.colors.textInverse
                  )
                )}
                className="fas fa-random"
              ></i>
              <Spacer width={8} />
              New puzzle
            </Text>
          </Button>
          <Spacer height={12} />
        </>
      )}
      {!state.chessState.showFuturePosition && !state.isDone && player}
      {
        <View
          style={s(
            c.overflowHidden,
            c.fullWidth,
            c.column,
            c.bg(c.grays[20]),
            c.br(4),
            c.mb(12)
          )}
        >
          <View style={s(c.fullWidth, c.row)}>
            <View style={s(c.column, c.alignStretch)}>
              <View
                style={s(
                  c.bg(c.grays[20]),
                  c.height(isMobile ? 36 : 48),
                  c.center,
                  c.px(24)
                )}
              >
                <Text style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                  Turn
                </Text>
              </View>
              <View style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))} />
              <View style={s(c.size(40), c.selfCenter, c.my(12))}>
                {state.turn == 'b' ? <KingBlackIcon /> : <KingWhiteIcon />}
              </View>
            </View>
            {isNil(score) && (
              <>
                <View
                  style={s(
                    c.width(1),
                    c.bg(c.grays[30])
                    // c.height(isMobile ? 36 : 48)
                  )}
                />
                <View
                  style={s(c.column, c.flexGrow(1), c.alignStretch, c.noBasis)}
                >
                  <View
                    style={s(
                      c.bg(c.grays[20]),
                      c.height(isMobile ? 36 : 48),
                      c.center
                    )}
                  >
                    <Text style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                      Moves hidden
                    </Text>
                  </View>
                  <View
                    style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))}
                  />
                  <View style={s(c.selfCenter, c.my(12))}>
                    <Text
                      style={s(
                        c.fg(c.colors.textPrimary),
                        c.textAlign('center'),
                        c.weightSemiBold,
                        c.fontSize(32)
                      )}
                    >
                      {getPly(state)}
                    </Text>
                  </View>
                </View>
              </>
            )}
            {!isNil(score) && (
              <>
                <View
                  style={s(
                    c.width(1),
                    c.bg(c.grays[30])
                    // c.height(isMobile ? 36 : 48)
                  )}
                />
                <View style={s(c.column, c.grow, c.alignStretch, c.noBasis)}>
                  <View
                    style={s(
                      c.bg(c.grays[20]),
                      c.height(isMobile ? 36 : 48),
                      c.center
                    )}
                  >
                    <Text style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                      Score
                    </Text>
                  </View>
                  <View
                    style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))}
                  />
                  <View style={s(c.selfCenter, c.my(12))}>
                    <Text
                      style={s(
                        c.fg(c.colors.textPrimary),
                        c.weightSemiBold,
                        c.fontSize(32),
                        c.relative
                      )}
                    >
                      <AnimateNumber
                        value={score}
                        formatter={(f) => {
                          return Math.floor(f)
                        }}
                      />
                      <View
                        style={s(
                          c.absolute,
                          c.fullHeight,
                          c.width(0),
                          c.top(0),
                          c.right(0)
                        )}
                      >
                        {scoreChangeView}
                      </View>
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
          {state.showNotation.value && (
            <>
              <MoveList
                focusedMoveIndex={state.focusedMoveIndex}
                moveList={state.hiddenMoves}
                onMoveClick={(move, i) => {
                  updateState((s) => {
                    focusOnMove(s, i, () => {})
                  })
                }}
              />
            </>
          )}
          <View style={s(c.height(1), c.fullWidth, c.bg(c.grays[30]))} />
          <Pressable
            style={s(c.center, c.selfCenter, c.fullWidth, c.py(12))}
            onPress={() => {
              updateState((s) => {
                s.showNotation.value = !s.showNotation.value
              })
            }}
          >
            <Text style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
              <i
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.opacity(30),
                  c.fontSize(16)
                )}
                className={
                  state.showNotation.value
                    ? `fas fa-angle-up`
                    : `fas fa-angle-down`
                }
              ></i>
              <Spacer width={8} />
              {state.showNotation.value ? 'Hide notation' : 'Show notation'}
              <Spacer width={8} />
              <i
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.opacity(30),
                  c.fontSize(16)
                )}
                className={
                  state.showNotation.value
                    ? `fas fa-angle-up`
                    : `fas fa-angle-down`
                }
              ></i>
            </Text>
          </Pressable>
        </View>
      }
      <View
        style={s(c.row, c.gap(12), c.fullWidth, c.height(48), c.justifyEnd)}
      >
        {mockPassFail && !state.isDone && (
          <>
            <Button
              style={s(bottomRowButtonStyles)}
              onPress={() => {
                onFail()
                updateState((s) => {
                  s.progressMessage = {
                    message: 'Mocked failure, sorry',
                    type: ProgressMessageType.Error
                  }
                  s.isDone = true
                })
              }}
            >
              <Text style={s(c.buttons.basic.textStyles)}>
                <i
                  style={s(c.fg(c.colors.textInverse))}
                  className="fas fa-times"
                ></i>
              </Text>
            </Button>
            <Button
              style={s(bottomRowButtonStyles)}
              onPress={() => {
                onSuccess()
                updateState((s) => {
                  s.progressMessage = {
                    message: 'Mocked success, congratulations',
                    type: ProgressMessageType.Success
                  }
                  s.isDone = true
                })
              }}
            >
              <Text style={s(c.buttons.basic.textStyles)}>
                <i
                  style={s(c.fg(c.colors.textInverse))}
                  className="fas fa-check"
                ></i>
              </Text>
            </Button>
          </>
        )}
        <Button
          style={s(bottomRowButtonStyles)}
          onPress={() => {
            ;(async () => {
              if (Platform.OS == 'web') {
                window.open(
                  `https://lichess.org/training/${state.puzzle.id}`,
                  '_blank'
                )
              }
            })()
          }}
        >
          <Text style={s(c.buttons.basic.textStyles)}>
            <i
              style={s(c.fg(c.colors.textInverse))}
              className="fas fa-search"
            ></i>
          </Text>
        </Button>
        <Button
          style={s(bottomRowButtonStyles)}
          onPress={() => {
            updateState((s) => {
              s.helpOpen = true
            })
          }}
        >
          <Text style={s(c.buttons.basic.textStyles)}>
            <i
              style={s(c.fg(c.colors.textInverse))}
              className="fas fa-circle-question"
            ></i>
          </Text>
        </Button>
        {/* {isClimb && ( */}
        {/*   <> */}
        {/*     <Button */}
        {/*       style={s(bottomRowButtonStyles)} */}
        {/*       onPress={() => { */}
        {/*         onResetClimb() */}
        {/*         refreshPuzzle(state, updateState) */}
        {/*       }} */}
        {/*     > */}
        {/*       <i */}
        {/*         style={s(c.fg(c.colors.textInverse))} */}
        {/*         className="fas fa-recycle" */}
        {/*       ></i> */}
        {/*     </Button> */}
        {/*   </> */}
        {/* )} */}
        {
          <>
            <Button
              style={s(bottomRowButtonStyles)}
              onPress={() => {
                setSettingsOpen(true)
              }}
            >
              <i
                style={s(c.fg(c.colors.textInverse))}
                className="fas fa-gear"
              ></i>
            </Button>
          </>
        }
      </View>
      {state.showHelpButton && (
        <>
          <Spacer height={12} width={12} isMobile={isMobile} />
        </>
      )}
      <Spacer height={12} />
      {debugButtons && (
        <>
          <Spacer height={12} />
          <Button
            style={c.buttons.basic}
            onPress={() => {
              biref.flashRing()
            }}
          >
            Flash ring
          </Button>
          <Spacer height={12} />
          <Button
            style={c.buttons.basic}
            onPress={() => {
              updateState((s) => {
                debugger
                // TODO
                // currentPosition.move(s.hiddenMoves[0])
                // s.hiddenMoves.shift()
              })
            }}
          >
            Advance one move
          </Button>
          <Spacer height={12} />
          <Button
            style={c.buttons.basic}
            onPress={() => {
              updateState((s) => {
                s.chessState.showFuturePosition = true
              })
            }}
          >
            Show future position
          </Button>
        </>
      )}
      <Modal
        onClose={() => {
          updateState((s) => {
            s.helpOpen = false
          })
        }}
        visible={state.helpOpen}
      >
        <View style={s(c.row, c.px(12), c.py(12), c.alignCenter)}>
          <Text
            style={s(
              c.weightSemiBold,
              c.fg(c.colors.textPrimary),
              c.lineHeight(22)
            )}
          >
            Press play to see the next {getPly(state)} moves played out, but not
            persisted, on the board. At the end of the moves, there is a winning
            tactic. If you can't see the tactic, you can reduce the number of
            moves in settings, or you can view the puzzle on lichess.
          </Text>
        </View>
      </Modal>
      <Modal
        onClose={() => {
          setSettingsOpen(false)
        }}
        visible={settingsOpen}
      >
        <View style={s(c.px(12), c.pt(12), c.pb(24))}>
          {!isClimb && (
            <>
              <SettingsTitle text={'Hidden moves'} />
              <Spacer height={24} />
              <View style={s(c.row, c.alignCenter)}>
                <Button
                  onPress={() => {
                    updateState((s) => {
                      s.plyUserSetting.value = Math.max(
                        s.plyUserSetting.value - 1,
                        1
                      )
                      setupForPuzzle(s, updateState)
                    })
                  }}
                  style={s(incrementDecrementStyles)}
                >
                  <i
                    style={s(incrementDecrementTextStyles)}
                    className="fas fa-minus"
                  ></i>
                </Button>
                <Spacer width={12} />
                <View style={s(c.column, c.alignCenter, c.width(40))}>
                  <Text
                    style={s(
                      c.fg(c.colors.textPrimary),
                      c.fontSize(24),
                      c.weightBold
                    )}
                  >
                    {state.plyUserSetting.value}
                  </Text>
                </View>
                <Spacer width={12} />
                <Button
                  onPress={() => {
                    updateState((s) => {
                      s.plyUserSetting.value = s.plyUserSetting.value + 1
                      setupForPuzzle(s, updateState)
                    })
                  }}
                  style={s(incrementDecrementStyles)}
                >
                  <i
                    style={s(incrementDecrementTextStyles)}
                    className="fas fa-plus"
                  ></i>
                </Button>
              </View>
              <Spacer height={24} />
            </>
          )}

          <SettingsTitle text={'Playback speed'} />
          <Spacer height={24} />
          <SettingsOption
            choices={[
              PlaybackSpeed.Slow,
              PlaybackSpeed.Normal,
              PlaybackSpeed.Fast,
              PlaybackSpeed.Ludicrous
            ]}
            activeChoice={state.playbackSpeedUserSetting.value}
            onSelect={(playbackSpeed) => {
              updateState((s) => {
                s.playbackSpeedUserSetting.value = playbackSpeed
              })
            }}
            renderChoice={(c) => {
              return <Text>{getPlaybackSpeedDescription(c)}</Text>
            }}
          />
          <Spacer height={24} />
          {!isClimb && (
            <>
              <SettingsTitle text={'Difficulty'} />
              <Spacer height={12} />
              <View style={s(c.row, c.ml(0))}>
                <View style={s(c.column)}>
                  <Text style={s(ratingTitleStyles)}>Min</Text>
                  <Spacer height={12} />
                  <SettingsOption
                    choices={dropRight(allDifficulties, 1)}
                    activeChoice={state.ratingGteUserSetting.value}
                    onSelect={(rating) => {
                      updateState((s) => {
                        s.ratingGteUserSetting.value = rating
                        let idx = indexOf(allDifficulties, rating)
                        if (
                          idx >=
                          indexOf(
                            allDifficulties,
                            state.ratingLteUserSetting.value
                          )
                        ) {
                          state.ratingLteUserSetting.value =
                            allDifficulties[idx + 1]
                        }
                      })
                    }}
                    renderChoice={(c) => {
                      return (
                        <Text>{`${c} (${getPuzzleDifficultyRating(c)})`}</Text>
                      )
                    }}
                  />
                </View>
                <Spacer width={24} />
                <View style={s(c.column)}>
                  <Text style={s(ratingTitleStyles)}>Max</Text>
                  <Spacer height={12} />
                  <SettingsOption
                    choices={drop(allDifficulties, 1)}
                    activeChoice={state.ratingLteUserSetting.value}
                    onSelect={(rating) => {
                      updateState((s) => {
                        s.ratingLteUserSetting.value = rating
                        let idx = indexOf(allDifficulties, rating)
                        if (
                          idx <=
                          indexOf(allDifficulties, state.ratingGteUserSetting)
                        ) {
                          state.ratingGteUserSetting.value =
                            allDifficulties[idx - 1]
                        }
                      })
                    }}
                    renderChoice={(c) => {
                      return (
                        <Text>{`${c} (${getPuzzleDifficultyRating(c)})`}</Text>
                      )
                    }}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  )

  const { playbackSpeedUserSetting, solutionMoves } = state
  const chessboardProps = {
    frozen: isEmpty(solutionMoves),
    biref,
    playbackSpeed: playbackSpeedUserSetting.value,
    state: chessState
  }
  return {
    ui,
    animateMoves: useCallback(
      (cb) => {
        animateMoves(state, updateState, cb)
      },
      [state]
    ),
    chessboardProps,
    refreshPuzzle,
    updater: updateState
  }
}
