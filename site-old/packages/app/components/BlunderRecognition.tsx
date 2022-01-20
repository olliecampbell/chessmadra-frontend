import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, Text, Pressable, View } from 'react-native'
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from 'app/styles'
import { Spacer } from 'app/Space'
import { ChessboardView } from 'app/components/chessboard/Chessboard'
import { cloneDeep, isEmpty, isNil, takeRight, chunk } from 'lodash'
import { TrainerLayout } from 'app/components/TrainerLayout'
import { Button } from 'app/components/Button'
import { useIsMobile } from 'app/utils/isMobile'
import {
  BlunderRecognitionTab,
  DEFAULT_CHESS_STATE,
  FinishedBlunderPuzzle,
  useBlunderRecognitionStore
} from '../utils/state'
import { intersperse } from '../utils/intersperse'
import { Chess } from '@lubert/chess.ts'

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

export const BlunderRecognition = () => {
  const isMobile = useIsMobile()
  const state = useBlunderRecognitionStore()
  useEffect(() => {
    state.prefetchPuzzles()
  }, [])
  useEffect(() => {
    if (state.isPlaying) {
      document.onkeydown = function (e) {
        switch (e.key) {
          case 'ArrowLeft':
            state.guessColor('light')
            break
          case 'ArrowRight':
            state.guessColor('dark')
            break
        }
      }
    }
    return () => {
      document.onkeydown = null
    }
  }, [state.isPlaying])
  return (
    <TrainerLayout
      chessboard={
        state.donePlaying ? null : (
          <ChessboardView
            {...{
              state: state.chessState
            }}
          />
        )
      }
    >
      <View style={s()}>
        {state.isPlaying && (
          <View style={s(c.column, c.alignCenter)}>
            <Text style={s(c.fg(c.grays[70]), c.fontSize(16))}>
              <Text style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(16))}>
                {state.chessState.position.turn() === 'b' ? 'Black' : 'White'}
              </Text>{' '}
              is thinking of playing{' '}
              <Text style={s(c.fg(c.grays[90]), c.weightBold, c.fontSize(16))}>
                {state.currentMove}
              </Text>
            </Text>
            <Spacer height={24} />
            <View style={s(c.row, c.alignCenter)}>
              <Button
                onPress={() => {
                  state.guess(false)
                }}
                style={s(c.buttons.primary, c.width(140))}
              >
                Good move
              </Button>
              <Spacer width={24} />
              <Button
                onPress={() => {
                  state.guess(true)
                }}
                style={s(c.buttons.primary, c.width(140))}
              >
                Blunder
              </Button>
            </View>
            <Spacer height={24} />
            <View
              style={s(
                c.bg(c.grays[70]),
                c.fullWidth,
                c.height(12),
                c.br(2),
                c.overflowHidden
              )}
            >
              <Animated.View
                style={s(
                  c.bg(c.primaries[50]),
                  c.fullHeight,
                  c.width(
                    state.widthAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  )
                )}
              />
            </View>
          </View>
        )}
        {!state.isPlaying && !state.donePlaying && (
          <View style={s(c.column)}>
            <View style={c.selfCenter}>
              <Score
                score={state.highScore.value[state.difficulty]}
                text={'High Score'}
              />
            </View>
            <Spacer height={24} />
            <Text style={s(c.fg(c.colors.textPrimary))}>
              Determine whether each move is good, or a blunder. You can review
              the positions you missed when the round ends.
            </Text>
            <Spacer height={24} />
            <Button
              onPress={() => {
                state.startPlaying()
              }}
              style={s(c.buttons.primary)}
            >
              Start
            </Button>
          </View>
        )}
        {state.donePlaying && (
          <View style={s(c.column, c.width(600), c.maxWidth('100%'))}>
            <View style={s(c.row, c.selfCenter)}>
              <Score score={state.score} text={'Score'} />
              <Spacer width={48} />
              <Score
                score={state.highScore.value[state.difficulty.value]}
                text={'High Score'}
              />
            </View>
            <Spacer height={24} />
            <Button
              onPress={() => {
                state.startPlaying()
              }}
              style={s(c.buttons.primary)}
            >
              Play Again
            </Button>
            <Spacer height={24} />
            <View style={s(c.row)}>
              {intersperse(
                [
                  BlunderRecognitionTab.Failed,
                  BlunderRecognitionTab.Passed
                ].map((tab) => {
                  let active = state.activeTab == tab
                  return (
                    <Pressable
                      style={s()}
                      onPress={() => {
                        state.quick((state) => {
                          state.activeTab = tab
                        })
                      }}
                    >
                      <Text
                        style={s(
                          c.fg(c.colors.textPrimary),
                          c.fontSize(18),
                          c.pb(4),
                          c.weightBold,
                          active && c.borderBottom(`2px solid white`)
                        )}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  )
                }),
                (i) => {
                  return <Spacer key={i} width={24} />
                }
              )}
            </View>
            <Spacer height={24} />
            <View style={s()}>
              {intersperse(
                chunk(state.failedPuzzles, isMobile ? 2 : 3).map((row) => {
                  return (
                    <View style={s(c.row)}>
                      {intersperse(
                        row.map((x) => {
                          return (
                            <View style={s(c.width(200), c.flexible)}>
                              <BlunderPuzzleReviewView
                                puzzle={x}
                                passed={
                                  state.activeTab ===
                                  BlunderRecognitionTab.Passed
                                }
                              />
                            </View>
                          )
                        }),
                        (i) => {
                          return <Spacer key={i} width={24} />
                        }
                      )}
                    </View>
                  )
                }),
                (i) => {
                  return <Spacer key={i} height={24} />
                }
              )}
            </View>
          </View>
        )}
      </View>
    </TrainerLayout>
  )
}

export const BlunderPuzzleReviewView = ({
  puzzle,
  passed
}: {
  puzzle: FinishedBlunderPuzzle
  passed: boolean
}) => {
  let pos = new Chess(puzzle.puzzle.fen)
  let move = puzzle.showedBlunder
    ? puzzle.puzzle.blunder
    : puzzle.puzzle.bestMove
  return (
    <View style={s(c.column)}>
      <ChessboardView
        state={{
          ...DEFAULT_CHESS_STATE,
          position: pos,
          flipped: pos.turn() === 'b'
        }}
        onSquarePress={() => {
          window.open(
            `https://lichess.org/analysis/${puzzle.puzzle.fen}`,
            '_blank'
          )
        }}
      />
      <Spacer height={12} />
      <Text style={s(c.fg(c.colors.textPrimary))}>
        <Text style={s(c.weightBold)}>{move} </Text>
        <Text
          style={
            s()
            // c.fg(passed ? c.colors.successColor : c.colors.failureLight)
          }
        >
          was {puzzle.showedBlunder ? 'a' : 'not a'} blunder
        </Text>
      </Text>
    </View>
  )
}
