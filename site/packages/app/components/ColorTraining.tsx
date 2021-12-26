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
import { useImmer } from 'use-immer'
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
import { useStateUpdaterV2 } from '../utils/useImmer'

const Tile = ({ color, onPress }) => {
  return (
    <Pressable {...{ onPress }} style={s(c.bg(color), c.size(72))}></Pressable>
  )
}
const testPlayingUI = false
export const Score = ({ score, text }) => {
  return (
    <View style={s(c.column, c.alignCenter)}>
      <Text style={s(c.fg(c.grays[70]), c.caps, c.weightBold, c.fontSize(12))}>
        {text}
      </Text>
      <Spacer height={4} />
      <Text style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(48))}>
        {score}
      </Text>
    </View>
  )
}

export const ColorTraining = () => {
  // TODO
  return null
  // const isMobile = useIsMobile()
  // const chessState = useStateUpdaterV2({})
  // const [isPlaying, setIsPlaying] = useState(false)
  // const [startTime, setStartTime] = useState(null)
  // const [score, setScore] = useState(0)
  // // const stateTest = useStateUpdaterV2({ test: 0 })
  // // useEffect(() => {
  // //   setInterval(() => {
  // //     stateTest.update((s) => {
  // //       s.test = s.test + 2
  // //     })
  // //   }, 2000)
  // // }, [])
  // // console.log({ stateTest })
  // const [lastRoundScore, setLastRoundScore] = useState(null)
  // const [highScore, setHighScore] = useStorageState(
  //   localStorage,
  //   'high-score-color-trainer',
  //   0 as number
  // )
  // const roundDuration = 30 * 1000
  // const [remainingTime, setRemainingTime, remainingTimeRef] = useStateRef(
  //   null as number
  // )
  // const [penalties, setPenalties, penaltiesRef] = useStateRef(0)
  // const [currentSquare, setCurrentSquare] = useState(null as Square)
  // const highlightNewSquare = useCallback(() => {
  //   let randomSquare = algebraic(sample(SQUARES)) as Square
  //   setCurrentSquare(randomSquare)
  //   biref.highlightSquare(randomSquare)
  // }, [biref])
  // const chess = useMemo(() => new Chess(), [])
  // const startPlaying = () => {
  //   widthAnim.setValue(1.0)
  //   setStartTime(performance.now())
  //   setRemainingTime(roundDuration)
  //   setIsPlaying(true)
  //   setScore(0)
  //   highlightNewSquare()
  // }
  // useEffect(() => {
  //   if (isPlaying) {
  //     let remainingTime =
  //       roundDuration -
  //       (performance.now() - startTime) -
  //       penaltiesRef.current * 5 * 1000
  //     setRemainingTime(remainingTime)
  //     widthAnim.setValue(remainingTime / roundDuration)
  //     Animated.timing(widthAnim, {
  //       toValue: 0.0,
  //       duration: remainingTime,
  //       useNativeDriver: false,
  //       easing: Easing.linear
  //     }).start()
  //     let id = setTimeout(() => {
  //       stopRound()
  //     }, remainingTime)
  //     return () => {
  //       window.clearInterval(id)
  //     }
  //   }
  // }, [isPlaying, penalties])
  // useEffect(() => {
  //   if (testPlayingUI) {
  //     startPlaying()
  //   }
  // }, [])
  // const widthAnim = useMemo(() => new Animated.Value(0), [])
  // const stopRound = () => {
  //   setIsPlaying(false)
  //   setLastRoundScore(score)
  //   biref.highlightSquare(null)
  //   if (score > highScore) {
  //     setHighScore(score)
  //     // TODO: message about high score
  //   }
  //   setScore(0)
  //   setPenalties(0)
  //   setRemainingTime(0)
  // }
  // const guessColor = useCallback(
  //   (color: 'light' | 'dark') => {
  //     let correct = chess.squareColor(currentSquare) == color
  //     biref.flashRing(correct)
  //     if (correct) {
  //       setScore((s) => s + 1)
  //     } else {
  //       setPenalties((p) => p + 1)
  //     }
  //     highlightNewSquare()
  //   },
  //   [currentSquare]
  // )
  // useEffect(() => {
  //   if (isPlaying) {
  //     document.onkeydown = function (e) {
  //       switch (e.key) {
  //         case 'ArrowLeft':
  //           guessColor('light')
  //           break
  //         case 'ArrowRight':
  //           guessColor('dark')
  //           break
  //       }
  //     }
  //   }
  //   return () => {
  //     document.onkeydown = null
  //   }
  // }, [guessColor, isPlaying])
  // return (
  //   <TrainerLayout
  //     chessboard={
  //       <ChessboardView
  //         {...{
  //           biref,
  //           state: chessState,
  //           hideColors: true
  //         }}
  //       />
  //     }
  //   >
  //     <View style={s(!isMobile && s(c.width(300)))}>
  //       {isPlaying ? (
  //         <View style={s(c.column, c.alignCenter)}>
  //           <View style={s(c.row, c.alignCenter)}>
  //             <Score score={score} text={'score'} />
  //             {/*
  //             <Spacer width={24} />
  //             <View style={s(c.column, c.alignCenter, c.width(100))}>
  //               <Text
  //                 style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(48))}
  //               >
  //                 {(remainingTime / 1000).toFixed(1)}
  //               </Text>
  //             </View>
  //             */}
  //           </View>
  //           <Spacer height={24} />
  //           <View style={s(c.row, c.alignCenter)}>
  //             <Tile
  //               onPress={() => {
  //                 guessColor('light')
  //               }}
  //               color={c.colors.lightTile}
  //             />
  //             <Text
  //               style={s(
  //                 c.mx(12),
  //                 c.fg(c.grays[70]),
  //                 c.caps,
  //                 c.weightBold,
  //                 c.fontSize(12)
  //               )}
  //             >
  //               or
  //             </Text>
  //             <Tile
  //               onPress={() => {
  //                 guessColor('dark')
  //               }}
  //               color={c.colors.darkTile}
  //             />
  //           </View>
  //           <Spacer height={24} />
  //           <View
  //             style={s(
  //               c.bg(c.grays[70]),
  //               c.fullWidth,
  //               c.height(12),
  //               c.br(2),
  //               c.overflowHidden
  //             )}
  //           >
  //             <Animated.View
  //               style={s(
  //                 c.bg(c.primaries[50]),
  //                 c.fullHeight,
  //                 c.width(
  //                   widthAnim.interpolate({
  //                     inputRange: [0, 1],
  //                     outputRange: ['0%', '100%']
  //                   })
  //                 )
  //               )}
  //             />
  //           </View>
  //         </View>
  //       ) : (
  //         <View style={s(c.column)}>
  //           <View style={c.selfCenter}>
  //             <Score score={highScore} text={'High Score'} />
  //           </View>
  //           <Spacer height={24} />
  //           <Text style={s(c.fg(c.colors.textPrimary))}>
  //             For each highlighted square, indicate whether it is light or dark.
  //             You can use the arrow keys on desktop.
  //           </Text>
  //           <Spacer height={24} />
  //           <Button
  //             onPress={() => {
  //               startPlaying()
  //             }}
  //             style={s(c.buttons.primary)}
  //           >
  //             Start
  //           </Button>
  //         </View>
  //       )}
  //     </View>
  //   </TrainerLayout>
  // )
}
