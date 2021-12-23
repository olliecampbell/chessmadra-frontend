import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Easing,
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal
} from 'react-native'
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from 'app/styles'
import { Spacer } from 'app/Space'
import { ChessboardView } from 'app/components/chessboard/Chessboard'
import axios from 'axios'
import { Helmet } from 'react-helmet'
import { algebraic, Chess, Move, SQUARES } from '@lubert/chess.ts'
import client from 'app/client'
import { cloneDeep, isEmpty, isNil, takeRight } from 'lodash'
import { LichessPuzzle } from 'app/models'
import { ChessboardBiref } from 'app/types/ChessboardBiref'
// import { Feather } from "@expo/vector-icons";
// import Icon from 'react-native-vector-icons/MaterialIcons'
import useState from 'react-usestateref'
import { useStorageState } from 'react-storage-hooks'
import { TrainerLayout } from 'app/components/TrainerLayout'
import { Button } from 'app/components/Button'
import { ChessColor } from 'app/types/Chess'
import { useIsMobile } from 'app/utils/isMobile'
import { sample } from 'lodash'
import { Square } from '@lubert/chess.ts/dist/types'
import useStateRef from 'react-usestateref'
import { useEffectWithPrevious } from '../utils/useEffectWithPrevious'
import { Score } from 'app/components/ColorTraining'
import { useVisualizationTraining } from 'app/utils/useVisualizationTraining'
import { times } from '../utils'
import { useStateUpdater } from '../utils/useImmer'
import { StorageItem } from '../utils/storageItem'
import { WritableDraft } from 'immer/dist/internal'
import AnimateNumber from 'react-native-animate-number'

const Tile = ({ color, onPress }) => {
  return (
    <Pressable {...{ onPress }} style={s(c.bg(color), c.size(72))}></Pressable>
  )
}
const testPlayingUI = false
const ClimbScore = ({ score, highScore, text }) => {
  return (
    <View style={s(c.column, c.alignCenter)}>
      <Text style={s(c.fg(c.grays[70]), c.caps, c.weightBold, c.fontSize(12))}>
        {text}
      </Text>
      <Spacer height={4} />
      <Text style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(48))}>
        {score.value}
      </Text>
    </View>
  )
}

const generateClimb = () => {
  let puzzleDifficulty = 1000
  let hiddenMoves = 1
  let cutoff = 2400
  const climb = [{ puzzleDifficulty, hiddenMoves }]
  const addRampingPuzzleDifficulty = () => {
    times(20)((i) => {
      puzzleDifficulty += 10
      climb.push({ puzzleDifficulty, hiddenMoves })
    })
  }
  const addRampingHiddenMoves = () => {
    times(1)((i) => {
      hiddenMoves += 1
      if (puzzleDifficulty < cutoff) {
        puzzleDifficulty -= 100
      }
      climb.push({ puzzleDifficulty, hiddenMoves })
    })
  }
  times(30)((i) => {
    if (puzzleDifficulty < cutoff) {
      addRampingPuzzleDifficulty()
    }
    addRampingHiddenMoves()
  })
  return climb
}
const CLIMB = generateClimb()

// tweak params
const TIME_SUCCESSFUL_SOLVE = 30 * 1000
const TIME_UNSUCCESSFUL_SOLVE = 30 * 1000
const POINTS_LOST = 20

interface State {
  isPlaying: boolean
  delta: number
  climb: Step[]
  score: StorageItem<number>
  highScore: StorageItem<number>
  step: Step
  puzzleStartTime: number
  lastPuzzleSuccess: boolean
  currentPuzzleFailed: boolean
}

interface Step {
  puzzleDifficulty: number
  hiddenMoves: number
}

const initState = (state: State) => {
  updateStep(state)
}

const updateStep = (state: State) => {
  state.step = state.climb[state.score.value]
}
const DEFAULT_STATE = {
  isPlaying: false,
  // TODO: bring back intro screen
  climb: CLIMB,
  score: new StorageItem('climb-score', 0),
  highScore: new StorageItem('climb-high-score', 0),
  delta: 0,
  step: null,
  puzzleStartTime: null,
  lastPuzzleSuccess: false,
  currentPuzzleFailed: false
}
initState(DEFAULT_STATE)

export const TheClimb = () => {
  const isMobile = useIsMobile()
  const [state, updater] = useStateUpdater<State>(DEFAULT_STATE)
  const scoreOpacityAnim = useRef(new Animated.Value(0.0)).current
  const scoreChangeView = (
    <Animated.View
      style={s(
        c.opacity(scoreOpacityAnim),
        c.fontSize(16),
        c.size(40),
        c.center,
        c.alignStart,
        c.ml(6),
        c.fg(
          state.lastPuzzleSuccess
            ? c.colors.successColor
            : c.colors.failureColor
        )
      )}
    >
      {state.delta < 0 ? state.delta : `+${state.delta}`}
    </Animated.View>
  )
  const animatePointChange = (delta: number) => {
    let animDuration = 300
    Animated.sequence([
      Animated.timing(scoreOpacityAnim, {
        toValue: 1,
        duration: animDuration,
        useNativeDriver: false
      }),

      Animated.timing(scoreOpacityAnim, {
        toValue: 0,
        duration: animDuration,
        useNativeDriver: false
      })
    ]).start()
  }
  // useEffect(() => {
  //   initState(state)
  // }, [])
  const onSuccess = () => {
    updater((s) => {
      if (s.currentPuzzleFailed) {
        return
      }
      let timeTaken = performance.now() - s.puzzleStartTime
      let delta = Math.round(
        Math.max(1, 10 - (timeTaken / TIME_SUCCESSFUL_SOLVE) * 10)
      )
      s.lastPuzzleSuccess = true
      s.delta = delta
      animatePointChange(delta)
      s.score.value = s.score.value + delta
      if (s.score.value > s.highScore.value) {
        s.highScore.value = s.score.value
      }
      updateStep(s)
      updateVisualizationState((vs) => {
        console.log('Updating puzzle difficuty to ', s.step.puzzleDifficulty)
        vs.numberMovesHiddenSetting = s.step.hiddenMoves
        vs.puzzleDifficultySetting = s.step.puzzleDifficulty
      })
    })
  }
  const onFail = () => {
    updater((s) => {
      s.currentPuzzleFailed = true
      let delta = -10
      s.delta = delta
      s.lastPuzzleSuccess = false
      animatePointChange(delta)
      s.score.value = Math.max(s.score.value + delta, 0)
      updateStep(s)
      updateVisualizationState((vs) => {
        vs.numberMovesHiddenSetting = s.step.hiddenMoves
        vs.puzzleDifficultySetting = s.step.puzzleDifficulty
      })
    })
  }
  const onAutoPlayEnd = () => {
    updater((s) => {
      s.puzzleStartTime = performance.now()
      s.currentPuzzleFailed = false
    })
  }

  const {
    chessboardProps,
    ui: visualizationUi,
    refreshPuzzle,
    animateMoves,
    updater: updateVisualizationState
  } = useVisualizationTraining({
    mockPassFail: true,
    isClimb: true,
    autoPlay: true,
    onResetClimb: useCallback(() => {
      updater((s) => {
        s.score.value = 0
      })
    }, []),
    score: state.score.value,
    onSuccess,
    scoreChangeView,
    onFail,
    onAutoPlayEnd,
    puzzleDifficultySetting: state.step?.puzzleDifficulty,
    numberMovesHiddenSetting: state.step?.hiddenMoves
  })
  return (
    <TrainerLayout
      chessboard={
        <>
          <ChessboardView
            {...chessboardProps}
            styles={!state.isPlaying && c.displayNone}
          />
          <ChessboardView
            {...{
              currentPosition: new Chess(),
              biref: {},
              state: { currentPosition: new Chess() },
              styles: state.isPlaying && c.displayNone
            }}
          />
        </>
      }
    >
      <View style={s()}>
        {state.isPlaying ? (
          <View style={s(c.column, c.alignStretch)}>
            {/* <View style={s(c.row, c.alignCenter, c.selfCenter)}> */}
            {/*   {/* <ClimbScore highScore={highScore} score={score} text={'score'} /> */}
            {/*   {/* <Score score={step.puzzleDifficulty} text={'Step difficulty'} /> */}
            {/* </View> */}
            {/* <Spacer height={24} /> */}
            {visualizationUi}
          </View>
        ) : (
          <View style={s(c.column)}>
            <View style={c.selfCenter}>
              <Score score={state.highScore.value} text={'High Score'} />
            </View>
            <Spacer height={isMobile ? 12 : 24} />
            <Text style={s(c.fg(c.colors.textSecondary))}>
              The <b>number of hidden moves</b> and <b>puzzle difficulty</b>{' '}
              will increase. Solve puzzles fast to keep your score climbing.
              Take too long, or fail a puzzle, and the difficulty will go down.
            </Text>
            <Spacer height={24} />
            <Button
              onPress={() => {
                updater((s) => {
                  s.isPlaying = true
                  setTimeout(() => {
                    animateMoves(() => {
                      updater((s) => {
                        s.puzzleStartTime = performance.now()
                      })
                    })
                  }, 1000)
                })
              }}
              style={s(c.buttons.primary)}
            >
              Start
            </Button>
          </View>
        )}
      </View>
    </TrainerLayout>
  )
}
