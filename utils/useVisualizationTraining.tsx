import React, { useEffect } from "react";
import {
  Pressable,
  View,
  Platform,
} from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import {
  getPlaybackSpeedDescription,
} from "app/components/chessboard/Chessboard";
import {
  isNil,
} from "lodash";
import { MoveList } from "app/components/MoveList";
// import { Feather } from "@expo/vector-icons";
// import Icon from 'react-native-vector-icons/MaterialIcons'
import { Button } from "app/components/Button";
import useState from "react-usestateref";
import { useIsMobile } from "app/utils/isMobile";
import KingWhiteIcon from "app/components/chessboard/pieces/KingWhiteIcon";
import KingBlackIcon from "app/components/chessboard/pieces/KingBlackIcon";
import { Modal } from "app/components/Modal";
import { intersperse } from "app/utils/intersperse";
import AnimateNumber from "react-native-animate-number";
import {
  PlaybackSpeed,
  PuzzleDifficulty,
  VisualizationState,
  ProgressMessageType,
} from "app/types/VisualizationState";
import { NewPuzzleButton } from "app/NewPuzzleButton";
import { useHelpModal } from "app/components/useHelpModal";
import { SettingsTitle } from "app/components/SettingsTitle";
import { SelectOneOf } from "app/components/SelectOneOf";
import { ProgressMessageView } from "app/components/ProgressMessage";
import { SelectRange } from "app/components/SelectRange";
import { CMText } from "app/components/CMText";

const debugButtons = false;

const SettingsOption = <T,>({
  choices,
  onSelect,
  renderChoice,
  activeChoice,
}: {
  choices: T[];
  activeChoice: T;
  onSelect: (_: T) => void;
  renderChoice: (_: T) => JSX.Element;
}) => {
  return (
    <View style={s(c.ml(12))}>
      {intersperse(
        choices.map((choice, i) => {
          const active = choice === activeChoice;
          return (
            <Pressable
              onPress={() => {
                onSelect(choice);
              }}
              key={i}
              style={s(c.row)}
            >
              <i
                style={s(c.fg(c.colors.textPrimary))}
                className={active ? `fas fa-circle` : `fa-regular fa-circle`}
              ></i>
              <Spacer width={12} />
              <CMText style={s(c.fg(c.colors.textPrimary), c.weightSemiBold)}>
                {renderChoice(choice)}
              </CMText>
            </Pressable>
          );
        }),
        (i) => {
          return <Spacer key={`space-${i}`} height={12} />;
        }
      )}
    </View>
  );
};

const allDifficulties = [
  PuzzleDifficulty.Beginner,
  PuzzleDifficulty.Intermediate,
  PuzzleDifficulty.Expert,
  PuzzleDifficulty.Magnus,
];

export const useVisualizationTraining = ({
  state,
  onFail,
  isClimb,
  score,
  scoreChangeView,
  onSuccess,
}: {
  state: VisualizationState;
  onFail?: () => void;
  autoPlay?: boolean;
  isClimb?: boolean;
  onAutoPlayEnd?: () => void;
  score?: number;
  scoreChangeView?: JSX.Element;
  onSuccess?: () => void;
}) => {
  const isMobile = useIsMobile();
  useEffect(() => {
    setTimeout(() => {
      document.title = "chessmadra";
    }, 100);
  });
  // Styles
  const incrementDecrementStyles = s(c.buttons.basic, c.size(40));
  const incrementDecrementTextStyles = s(
    c.fg(c.colors.textInverse),
    c.fontSize(14)
  );

  // useEffect(() => {
  //   resetState()
  // }, [])
  // useEffect(() => {
  //   state.refreshPuzzle();
  // }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { helpOpen, setHelpOpen, helpModal } = useHelpModal({
    copy: (
      <>
        Press play to see the next {state.getPly()} moves played out, but not
        persisted, on the board. At the end of the moves, there is a winning
        tactic. If you can't see the tactic, you can reduce the number of moves
        in settings, or you can view the puzzle on lichess.
      </>
    ),
  });

  // useEffect(() => {
  //   if (autoPlay && puzzle && hiddenMoves) {
  //     animateMoves()
  //   }
  // }, [puzzle, hiddenMoves])

  const nextPreviousStyles = s(c.size(60), c.center);
  const ratingTitleStyles = s(
    c.fg(c.colors.textPrimary),
    c.fontSize(16),
    c.weightSemiBold
  );
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
            c.bg(
              state.playButtonFlashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [c.primaries[35], c.primaries[40]],
              })
            ),
            c.height(60),
            c.py(0),
            c.fontSize(18),
            c.overflowHidden
          )}
          onPress={() => {
            state.visualizeHiddenMoves();
          }}
        >
          <i
            style={s(c.fg(c.colors.textPrimary))}
            className={`fas ${state.isPlaying ? "fa-pause" : "fa-play"}`}
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
  );

  let ui = (
    <>
      {state.progressMessage && (
        <>
          <ProgressMessageView progressMessage={state.progressMessage} />
          <Spacer height={12} />
        </>
      )}
      {state.isDone && (
        <>
          <NewPuzzleButton
            onPress={() => {
              state.refreshPuzzle();
            }}
          />
          <Spacer height={12} />
        </>
      )}
      {!state.showPuzzlePosition && !state.isDone && player}
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
                <CMText style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                  Turn
                </CMText>
              </View>
              <View style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))} />
              <View style={s(c.size(40), c.selfCenter, c.my(12))}>
                {state.puzzleState.turn == "b" ? (
                  <KingBlackIcon />
                ) : (
                  <KingWhiteIcon />
                )}
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
                    <CMText style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                      Moves hidden
                    </CMText>
                  </View>
                  <View
                    style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))}
                  />
                  <View style={s(c.selfCenter, c.my(12))}>
                    <CMText
                      style={s(
                        c.fg(c.colors.textPrimary),
                        c.textAlign("center"),
                        c.weightSemiBold,
                        c.fontSize(32)
                      )}
                    >
                      {state.getPly()}
                    </CMText>
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
                    <CMText style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                      Score
                    </CMText>
                  </View>
                  <View
                    style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))}
                  />
                  <View style={s(c.selfCenter, c.my(12))}>
                    <CMText
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
                          return Math.floor(f);
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
                    </CMText>
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
                  // TODO: move click notation highlight thing
                  // updateState((s) => {
                  //   focusOnMove(s, i, () => {})
                  // })
                }}
              />
            </>
          )}
          <View style={s(c.height(1), c.fullWidth, c.bg(c.grays[30]))} />
          <Pressable
            style={s(c.center, c.selfCenter, c.fullWidth, c.py(12))}
            onPress={() => {
              state.toggleNotation();
            }}
          >
            <CMText style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
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
              {state.showNotation.value ? "Hide notation" : "Show notation"}
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
            </CMText>
          </Pressable>
        </View>
      }
      <View
        style={s(c.row, c.gap(12), c.fullWidth, c.height(48), c.justifyEnd)}
      >
        {state.mockPassFail && !state.isDone && (
          <>
            <Button
              style={s(c.buttons.squareBasicButtons)}
              onPress={() => {
                state.quick((s) => {
                  s.progressMessage = {
                    message: "Mocked failure, sorry",
                    type: ProgressMessageType.Error,
                  };
                  s.isDone = true;
                  s.onSuccess();
                });
              }}
            >
              <CMText style={s(c.buttons.basic.textStyles)}>
                <i
                  style={s(c.fg(c.colors.textInverse))}
                  className="fas fa-times"
                ></i>
              </CMText>
            </Button>
            <Button
              style={s(c.buttons.squareBasicButtons)}
              onPress={() => {
                state.quick((s) => {
                  s.progressMessage = {
                    message: "Mocked success, congratulations",
                    type: ProgressMessageType.Success,
                  };
                  s.isDone = true;
                  s.onSuccess();
                });
              }}
            >
              <CMText style={s(c.buttons.basic.textStyles)}>
                <i
                  style={s(c.fg(c.colors.textInverse))}
                  className="fas fa-check"
                ></i>
              </CMText>
            </Button>
          </>
        )}
        <Button
          style={s(c.buttons.squareBasicButtons)}
          onPress={() => {
            (async () => {
              if (Platform.OS == "web") {
                window.open(
                  `https://lichess.org/training/${state.puzzleState.puzzle.id}`,
                  "_blank"
                );
              }
            })();
          }}
        >
          <CMText style={s(c.buttons.basic.textStyles)}>
            <i
              style={s(c.fg(c.colors.textInverse))}
              className="fas fa-search"
            ></i>
          </CMText>
        </Button>
        <Button
          style={s(c.buttons.squareBasicButtons)}
          onPress={() => {
            setHelpOpen(!helpOpen);
          }}
        >
          <CMText style={s(c.buttons.basic.textStyles)}>
            <i
              style={s(c.fg(c.colors.textInverse))}
              className="fas fa-circle-question"
            ></i>
          </CMText>
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
              style={s(c.buttons.squareBasicButtons)}
              onPress={() => {
                setSettingsOpen(true);
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
      {debugButtons && (
        <>
          <Spacer height={12} />
          <Button
            style={c.buttons.basic}
            onPress={() => {
              // TODO
              // biref.flashRing()
            }}
          >
            Flash ring
          </Button>
          <Spacer height={12} />
          <Button
            style={c.buttons.basic}
            onPress={() => {
              // updateState((s) => {
              //   debugger
              //   // TODO
              //   // currentPosition.move(s.hiddenMoves[0])
              //   // s.hiddenMoves.shift()
              // })
            }}
          >
            Advance one move
          </Button>
          <Spacer height={12} />
          <Button
            style={c.buttons.basic}
            onPress={() => {
              // updateState((s) => {
              //   s.chessState.showFuturePosition = true
              // })
            }}
          >
            Show future position
          </Button>
        </>
      )}
      {helpModal}
      <Modal
        onClose={() => {
          setSettingsOpen(false);
        }}
        visible={settingsOpen}
      >
        <View style={s(c.px(12), c.pt(12), c.pb(24))}>
          {!isClimb && (
            <>
              <SettingsTitle text={"Hidden moves"} />
              <Spacer height={24} />
              <View style={s(c.row, c.alignCenter)}>
                <Button
                  onPress={() => {
                    state.updatePly(-1);
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
                  <CMText
                    style={s(
                      c.fg(c.colors.textPrimary),
                      c.fontSize(24),
                      c.weightBold
                    )}
                  >
                    {state.plyUserSetting.value}
                  </CMText>
                </View>
                <Spacer width={12} />
                <Button
                  onPress={() => {
                    state.updatePly(1);
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

          <SettingsTitle text={"Playback speed"} />
          <Spacer height={24} />
          <SelectOneOf
            choices={[
              PlaybackSpeed.Slow,
              PlaybackSpeed.Normal,
              PlaybackSpeed.Fast,
              PlaybackSpeed.Ludicrous,
            ]}
            activeChoice={state.playbackSpeedUserSetting.value}
            onSelect={(playbackSpeed) => {
              state.setPlaybackSpeed(playbackSpeed);
            }}
            renderChoice={(c) => {
              return getPlaybackSpeedDescription(c);
            }}
          />
          <Spacer height={24} />
          {!isClimb && (
            <>
              <SettingsTitle text={"Difficulty"} />
              <Spacer height={12} />
              <View style={s(c.column, c.ml(0), c.fullWidth, c.alignStretch)}>
                <SelectRange
                  min={0}
                  max={2500}
                  range={[
                    state.ratingGteUserSetting.value,
                    state.ratingLteUserSetting.value,
                  ]}
                  formatter={(value) => {
                    return `${value}`;
                  }}
                  step={50}
                  onFinish={() => {
                    state.quick((s) => {
                      s.refreshPuzzle(s);
                    });
                  }}
                  onChange={([lower, upper]) => {
                    state.quick((s) => {
                      s.ratingLteUserSetting.value = Math.max(
                        upper,
                        lower + 300
                      );
                      s.ratingGteUserSetting.value = lower;
                    });
                  }}
                />
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );

  const {
    playbackSpeedUserSetting,
    puzzleState: { solutionMoves },
  } = state;
  const chessboardProps = {
    state: state.chessboardState,
  };
  return {
    ui,
    // animateMoves: useCallback(
    //   (cb) => {
    //     animateMoves(state, cb)
    //   },
    //   [state]
    // ),
    chessboardProps,
    // refreshPuzzle
    // updater: updateState
  };
};
