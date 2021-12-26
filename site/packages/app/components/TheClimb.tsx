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
import { DEFAULT_CHESS_STATE, useClimbStore } from '../utils/state'

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

// tweak params

export const TheClimb = () => {
  const isMobile = useIsMobile()
  const state = useClimbStore()
  useEffect(() => {
    state.initState()
  }, [])
  const { scoreOpacityAnim } = state
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
  const { chessboardProps, ui: visualizationUi } = useVisualizationTraining({
    isClimb: true,
    autoPlay: true,
    state,
    score: state.score.value,
    scoreChangeView
  })
  return (
    <TrainerLayout
      chessboard={
        <>
          <ChessboardView
            {...chessboardProps}
            styles={!state.isPlayingClimb && c.displayNone}
          />
          <ChessboardView
            {...{
              currentPosition: new Chess(),
              state: DEFAULT_CHESS_STATE,
              styles: state.isPlayingClimb && c.displayNone
            }}
          />
        </>
      }
    >
      <View style={s()}>
        {state.isPlayingClimb ? (
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
                state.startPlayingClimb()
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
