import React, { useEffect, useState } from "react";
import { Pressable, View, Platform } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { getPlaybackSpeedDescription } from "~/components/chessboard/Chessboard";
import { isNil } from "lodash-es";
import { MoveList } from "~/components/MoveList";
// import { Feather } from "@expo/vector-icons";
// import Icon from 'react-native-vector-icons/MaterialIcons'
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import KingWhiteIcon from "~/components/chessboard/pieces/KingWhiteIcon";
import KingBlackIcon from "~/components/chessboard/pieces/KingBlackIcon";
import { Modal } from "~/components/Modal";
import { intersperse } from "~/utils/intersperse";
import AnimateNumber from "react-native-animate-number";
import {
  PlaybackSpeed,
  PuzzleDifficulty,
  VisualizationState,
  ProgressMessageType,
} from "~/types/VisualizationState";
import { NewPuzzleButton } from "~/NewPuzzleButton";
import { useHelpModal } from "~/components/useHelpModal";
import { SettingsTitle } from "~/components/SettingsTitle";
import { SelectOneOf } from "~/components/SelectOneOf";
import { ProgressMessageView } from "~/components/ProgressMessage";
import { SelectRange } from "~/components/SelectRange";
import { CMText } from "~/components/CMText";
import { trackEvent } from "~/utils/trackEvent";

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
    <div style={s(c.ml(12))}>
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
                className={active ? `fas fa-circle` : `fa-sharp fa-circle`}
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
    </div>
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
  const eventsIdentifier = isClimb ? "climb" : "visualization";
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

  const nextPreviousStyles = s(c.size(60), c.center);
  const ratingTitleStyles = s(
    c.fg(c.colors.textPrimary),
    c.fontSize(16),
    c.weightSemiBold
  );
  const player = (
    <>
      <div style={s(c.row, c.alignStretch, c.fullWidth)}>
        <Button
          style={s(
            c.grow,
            c.buttons.primary,
            c.bg(
              state.playButtonFlashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [c.primaries[35], c.primaries[40]],
              })
            ),
            c.height(60),
            c.py(0),
            c.fontSize(22),
            c.overflowHidden
          )}
          onPress={() => {
            trackEvent(`${eventsIdentifier}.play_hidden_moves`);
            state.visualizeHiddenMoves();
          }}
        >
          <i
            style={s(c.fg(c.colors.textPrimary))}
            className={`fa-sharp ${state.isPlaying ? "fa-pause" : "fa-play"}`}
          ></i>
        </Button>
      </div>
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
              trackEvent(`${eventsIdentifier}.new_puzzle`);
              state.refreshPuzzle();
            }}
          />
          <Spacer height={12} />
        </>
      )}
      {!state.showPuzzlePosition && !state.isDone && player}
      {
        <div
          style={s(
            c.overflowHidden,
            c.fullWidth,
            c.column,
            c.bg(c.grays[20]),
            c.br(4),
            c.mb(12)
          )}
        >
          <div style={s(c.fullWidth, c.row)}>
            <div style={s(c.column, c.alignStretch)}>
              <div
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
              </div>
              <div style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))} />
              <div style={s(c.size(40), c.selfCenter, c.my(12))}>
                {state.puzzleState.turn == "b" ? (
                  <KingBlackIcon />
                ) : (
                  <KingWhiteIcon />
                )}
              </div>
            </div>
            {isNil(score) && (
              <>
                <div
                  style={s(
                    c.width(1),
                    c.bg(c.grays[30])
                    // c.height(isMobile ? 36 : 48)
                  )}
                />
                <div
                  style={s(c.column, c.flexGrow(1), c.alignStretch, c.noBasis)}
                >
                  <div
                    style={s(
                      c.bg(c.grays[20]),
                      c.height(isMobile ? 36 : 48),
                      c.center
                    )}
                  >
                    <CMText style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                      Moves hidden
                    </CMText>
                  </div>
                  <div
                    style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))}
                  />
                  <div style={s(c.selfCenter, c.my(12))}>
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
                  </div>
                </div>
              </>
            )}
            {!isNil(score) && (
              <>
                <div style={s(c.width(1), c.bg(c.grays[30]))} />
                <div style={s(c.column, c.grow, c.alignStretch, c.noBasis)}>
                  <div
                    style={s(
                      c.bg(c.grays[20]),
                      c.height(isMobile ? 36 : 48),
                      c.center
                    )}
                  >
                    <CMText style={s(c.fg(c.colors.textPrimary), c.weightBold)}>
                      Score
                    </CMText>
                  </div>
                  <div
                    style={s(c.height(1), c.bg(c.grays[30]), c.flexGrow(0))}
                  />
                  <div style={s(c.selfCenter, c.my(12))}>
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
                      <div
                        style={s(
                          c.absolute,
                          c.fullHeight,
                          c.width(0),
                          c.top(0),
                          c.right(0)
                        )}
                      >
                        {scoreChangeView}
                      </div>
                    </CMText>
                  </div>
                </div>
              </>
            )}
          </div>
          {state.showNotation.value && (
            <>
              <MoveList
                focusedMoveIndex={state.focusedMoveIndex}
                moveList={state.hiddenMoves}
                onMoveClick={(move, i) => {}}
              />
            </>
          )}
          <div style={s(c.height(1), c.fullWidth, c.bg(c.grays[30]))} />
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
        </div>
      }
      <div
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
                  className="fa-sharp fa-times"
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
                  className="fa-sharp fa-check"
                ></i>
              </CMText>
            </Button>
          </>
        )}
        <Button
          style={s(c.buttons.squareBasicButtons)}
          onPress={() => {
            (async () => {
              trackEvent(`${eventsIdentifier}.analyze_on_lichess`);
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
              className="fa-sharp fa-search"
            ></i>
          </CMText>
        </Button>
        <Button
          style={s(c.buttons.squareBasicButtons)}
          onPress={() => {
            trackEvent(`${eventsIdentifier}.get_help`);
            setHelpOpen(!helpOpen);
          }}
        >
          <CMText style={s(c.buttons.basic.textStyles)}>
            <i
              style={s(c.fg(c.colors.textInverse))}
              className="fa-sharp fa-circle-question"
            ></i>
          </CMText>
        </Button>
        {
          <>
            <Button
              style={s(c.buttons.squareBasicButtons)}
              onPress={() => {
                trackEvent(`${eventsIdentifier}.open_settings`);
                setSettingsOpen(true);
              }}
            >
              <i
                style={s(c.fg(c.colors.textInverse))}
                className="fa-sharp fa-gear"
              ></i>
            </Button>
          </>
        }
      </div>
      {debugButtons && (
        <>
          <Spacer height={12} />
          <Button style={c.buttons.basic} onPress={() => {}}>
            Flash ring
          </Button>
          <Spacer height={12} />
          <Button style={c.buttons.basic} onPress={() => {}}>
            Advance one move
          </Button>
          <Spacer height={12} />
          <Button style={c.buttons.basic} onPress={() => {}}>
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
        <div style={s(c.px(12), c.pt(12), c.pb(24))}>
          {!isClimb && (
            <>
              <SettingsTitle text={"Hidden moves"} />
              <Spacer height={24} />
              <div style={s(c.row, c.alignCenter)}>
                <Button
                  onPress={() => {
                    state.updatePly(-1);
                  }}
                  style={s(incrementDecrementStyles)}
                >
                  <i
                    style={s(incrementDecrementTextStyles)}
                    className="fa-sharp fa-minus"
                  ></i>
                </Button>
                <Spacer width={12} />
                <div style={s(c.column, c.alignCenter, c.width(40))}>
                  <CMText
                    style={s(
                      c.fg(c.colors.textPrimary),
                      c.fontSize(24),
                      c.weightBold
                    )}
                  >
                    {state.plyUserSetting.value}
                  </CMText>
                </div>
                <Spacer width={12} />
                <Button
                  onPress={() => {
                    state.updatePly(1);
                  }}
                  style={s(incrementDecrementStyles)}
                >
                  <i
                    style={s(incrementDecrementTextStyles)}
                    className="fa-sharp fa-plus"
                  ></i>
                </Button>
              </div>
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
              <div style={s(c.column, c.ml(0), c.fullWidth, c.alignStretch)}>
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
              </div>
            </>
          )}
        </div>
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
    chessboardProps,
  };
};
