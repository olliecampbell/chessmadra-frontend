/* eslint-disable */
import { Chess, Move } from "@lubert/chess.ts";
import {
  ProgressMessage,
  VisualizationState,
  ProgressMessageType,
  PlaybackSpeed,
} from "~/types/VisualizationState";
import { fetchNewPuzzle } from "./api";
import { AppState } from "./app_state";
import {
  getInitialPuzzleState,
  PuzzleState,
  PuzzleStateDelegate,
} from "./puzzle_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import {
  DEBUG_CLIMB_START_PLAYING,
  DEBUG_PASS_FAIL_BUTTONS,
} from "./test_settings";
import { StorageItem } from "~/utils/storageItem";
import { cloneDeep, takeRight } from "lodash-es";
import { fensTheSame } from "~/utils/fens";
import { createQuick } from "./quick";
import { times } from "~/utils/times";
import {
  ChessboardDelegate,
  ChessboardInterface,
  createChessboardInterface,
} from "./chessboard_interface";
import { toSide } from "./repertoire";

type Stack = [VisualizationState, AppState];

const testProgress = false;

const generateClimb = () => {
  let puzzleDifficulty = 1000;
  let hiddenMoves = 1;
  const cutoff = 2400;
  const climb = [{ puzzleDifficulty, hiddenMoves }];
  const addRampingPuzzleDifficulty = () => {
    times(80)((i) => {
      puzzleDifficulty += 8;
      climb.push({ puzzleDifficulty, hiddenMoves });
    });
  };
  const addRampingHiddenMoves = () => {
    times(1)((i) => {
      hiddenMoves += 1;
      if (puzzleDifficulty < cutoff) {
        puzzleDifficulty -= 600;
      }
      climb.push({ puzzleDifficulty, hiddenMoves });
    });
  };
  times(30)((i) => {
    if (puzzleDifficulty < cutoff) {
      addRampingPuzzleDifficulty();
    }
    addRampingHiddenMoves();
  });
  return climb;
};

const CLIMB = generateClimb();
const TIME_SUCCESSFUL_SOLVE = 30 * 1000;

export const getInitialVisualizationState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>,
  isClimb: boolean
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn([isClimb ? s.climbState : s.visualizationState, s]));
  };
  const setOnly = <T,>(fn: (stack: VisualizationState) => T): T => {
    return set(([s]) => fn(s));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn([isClimb ? s.climbState : s.visualizationState, s]));
  };
  const setPuzzle = <T,>(fn: (s: PuzzleState) => T): T => {
    return _set((s) =>
      fn((isClimb ? s.climbState : s.visualizationState).puzzleState)
    );
  };
  const getPuzzle = <T,>(fn: (s: PuzzleState) => T): T => {
    return _get((s) =>
      fn((isClimb ? s.climbState : s.visualizationState).puzzleState)
    );
  };
  let initialState = {
    pulsePlay: true,
    viewStack: [],
    // @ts-ignore
    chessboard: null as ChessboardInterface,
    finishedAutoPlaying: false,
    chessboardState: null,
    puzzleState: getInitialPuzzleState(setPuzzle, getPuzzle),
    isDone: false,
    playButtonFlashAnim: 0,
    mockPassFail: DEBUG_PASS_FAIL_BUTTONS,
    showNotation: new StorageItem("show-notation-v2", true),
    plyUserSetting: new StorageItem("visualization-ply", 2),
    ratingGteUserSetting: new StorageItem("puzzle-rating-gte-v3", 0),
    ratingLteUserSetting: new StorageItem("puzzle-rating-lte-v3", 1200),
    playbackSpeedUserSetting: new StorageItem(
      "playback-speed",
      PlaybackSpeed.Normal
    ),
    hiddenMoves: [],
    autoPlay: false,
    showHelpButton: true,
    nextPuzzle: null,
    isPlaying: false,
    focusedMoveIndex: null,
    focusedMove: null,
    canFocusNextMove: false,
    canFocusLastMove: false,
    // onSuccess: onSuccess,
    // onFail: onFail,
    helpOpen: false,
    currentPosition: new Chess(),
    showPuzzlePosition: false,
    getFetchOptions: () =>
      get(([s]) => {
        const ply = s.step?.hiddenMoves ?? s.plyUserSetting.value;
        if (s.step) {
          return {
            ratingGte: s.step.puzzleDifficulty - 25,
            ratingLte: s.step.puzzleDifficulty + 25,
            maxPly: ply,
            solidMovesGte: ply,
          };
        }
        return {
          ratingGte: s.ratingGteUserSetting.value,
          ratingLte: s.ratingLteUserSetting.value,
          maxPly: ply,
          solidMovesGte: ply,
        };
      }),
    getPly: () =>
      get(([s]) => {
        return s.step?.hiddenMoves ?? s.plyUserSetting.value;
      }),

    resetState: () => {
      set(([state]) => {
        state.showPuzzlePosition = false;
        state.finishedAutoPlaying = false;
        state.isDone = false;
      });
    },
    refreshPuzzle: () =>
      set(async ([s]) => {
        let p = s.nextPuzzle;
        if (!p) {
          p = await fetchNewPuzzle(s.getFetchOptions());
        }
        set(([s]) => {
          if (!p) {
            window.alert(
              "Problem fetching puzzles, please report this if you run into it, to me@mbuffett.com"
            );
            return;
          }
          // @ts-ignore
          set(([s]) => {
            s.puzzleState.puzzle = p;
            s.resetState();
            s.setupForPuzzle();
          });
        });
      }),
    ...createQuick(setOnly),
    visualizeHiddenMoves: (callback) =>
      set(([s]) => {
        s.stopLoopingPlayFlash();
        s.chessboard.visualizeMoves(
          cloneDeep(s.hiddenMoves),
          s.playbackSpeedUserSetting.value,
          callback
        );
      }),
    setupForPuzzle: () =>
      set(([state]) => {
        state.chessboard.resetPosition();
        state.chessboard.clearPending();
        state.focusedMoveIndex = null;
        const currentPosition = new Chess();
        const puzzlePosition = new Chess();
        const puzzle = state.puzzleState.puzzle;
        for (const move of puzzle.allMoves) {
          currentPosition.move(move);
          puzzlePosition.move(move);
          if (fensTheSame(currentPosition.fen(), puzzle.fen)) {
            puzzlePosition.move(puzzle.moves[0], { sloppy: true });
            currentPosition.move(puzzle.moves[0], { sloppy: true });
            const hiddenMoves = takeRight(
              currentPosition.history({ verbose: true }),
              state.getPly()
            );
            const boardForPuzzleMoves = puzzlePosition.clone();
            boardForPuzzleMoves.undo();
            for (const solutionMove of puzzle.moves) {
              boardForPuzzleMoves.move(solutionMove, { sloppy: true });
            }
            state.puzzleState.solutionMoves = takeRight(
              boardForPuzzleMoves.history({ verbose: true }),
              puzzle.moves.length - 1
            );
            // currentPosition.undo()

            state.hiddenMoves = hiddenMoves;
            for (let i = 0; i < state.getPly(); i++) {
              currentPosition.undo();
            }
            // state.currentPosition = currentPosition
            state.currentPosition = currentPosition;
            state.chessboard.set((s) => {
              s.futurePosition = puzzlePosition;
              s.position = currentPosition;
            });
            state.puzzleState.puzzlePosition = puzzlePosition;
            state.showPuzzlePosition = false;
            state.chessboard.setPerspective(toSide(puzzlePosition.turn()));
            break;
          }
        }
        state.puzzleState.turn = state.puzzleState.puzzlePosition.turn();
        state.startLoopingPlayFlash();
        // @ts-ignore
        if (isClimb && state.isPlayingClimb) {
          state.visualizeHiddenMoves(() => {
            set(([s]) => {
              if (s.onAutoPlayEnd && !s.finishedAutoPlaying) {
                s.onAutoPlayEnd();
              }
              // s.chessboardState.isVisualizingMoves = false;
              s.finishedAutoPlaying = true;
              s.focusedMoveIndex = null;
            });
          });
        }
      }),
    stopLoopingPlayFlash: () =>
      set(([s]) => {
        s.pulsePlay = false;
      }),
    startLoopingPlayFlash: () =>
      set(([s]) => {
        s.pulsePlay = true;
      }),
    toggleNotation: () =>
      set(([s]) => {
        s.showNotation.value = !s.showNotation.value;
      }),
    setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) =>
      set(([s]) => {
        s.playbackSpeedUserSetting.value = playbackSpeed;
      }),
    updatePly: (increment: number) =>
      set(([s]) => {
        s.plyUserSetting.value = Math.max(
          s.plyUserSetting.value + increment,
          1
        );
        s.setupForPuzzle();
      }),
  } as VisualizationState;

  initialState.puzzleState = getInitialPuzzleState(setPuzzle, getPuzzle);
  initialState.puzzleState.delegate = {
    animatePieceMove: (...args) => {
      initialState.chessboard.animatePieceMove(...args);
    },
    onPuzzleMoveSuccess: () => {
      set(([state]) => {
        // TODO: animate piece move
        state.showPuzzlePosition = true;
        state.chessboard.flashRing(true);
        state.chessboard.set((s) => {
          s.futurePosition = null;
          s.position = state.puzzleState.puzzlePosition;
        });
      });
    },
    onPuzzleMoveFailure: (move: Move) => {
      set(([state]) => {
        state.chessboard.flashRing(false);
        if (isClimb) {
          state.onFail();
        }
      });
    },
    onPuzzleSuccess: () => {
      set(([state]) => {
        state.isDone = true;
        if (state.onSuccess) {
          state.onSuccess();
        }
      });
    },
  } as PuzzleStateDelegate;
  initialState.chessboard = createChessboardInterface()[1];
  initialState.chessboard.set((c) => {
    c.delegate = {
      completedMoveAnimation: () => {},
      onPositionUpdated: () => {
        set(([s]) => {});
      },

      madeManualMove: () => {
        get(([s]) => {});
      },
      onBack: () => {
        set(([s]) => {});
      },
      onReset: () => {
        set(([s]) => {});
      },
      onMovePlayed: () => {
        set(([s, rs]) => {});
      },
      shouldMakeMove: (move: Move) =>
        set(([s]) => {
          return s.puzzleState.shouldMakeMove(move);
        }),
    };
  });

  initialState.chessboard.set((c) => {
    c.frozen = false;
  });
  // if (isClimb) {
  //   initialState = {
  //     ...initialState,
  //     ...{
  //       isPlayingClimb: DEBUG_CLIMB_START_PLAYING,
  //       scoreOpacityAnim: 0.0,
  //       // TODO: bring back intro screen
  //       score: new StorageItem("climb-score", 0),
  //       highScore: new StorageItem("climb-high-score", 0),
  //       delta: 0,
  //       step: null,
  //       puzzleStartTime: null,
  //       startPlayingClimb: () =>
  //         set(([s]) => {
  //           s.isPlayingClimb = true;
  //           s.visualizeHiddenMoves(() => {
  //             set(([s]) => {
  //               if (s.onAutoPlayEnd && !s.finishedAutoPlaying) {
  //                 s.onAutoPlayEnd();
  //               }
  //               s.chessboardState.isVisualizingMoves = false;
  //               s.finishedAutoPlaying = true;
  //               s.focusedMoveIndex = null;
  //             });
  //           });
  //         }),
  //       onFail: () =>
  //         set(([s]) => {
  //           // TODO: fix repetition here
  //           if (!s.currentPuzzleFailed) {
  //             const delta = -10;
  //             s.delta = delta;
  //             s.lastPuzzleSuccess = false;
  //             s.animatePointChange();
  //             s.score.value = Math.max(s.score.value + delta, 0);
  //             s.updateStep();
  //           }
  //           s.currentPuzzleFailed = true;
  //         }),
  //       onSuccess: () =>
  //         set(([s]) => {
  //           if (s.currentPuzzleFailed) {
  //             return;
  //           }
  //           const timeTaken = performance.now() - s.puzzleStartTime;
  //           const delta = Math.round(
  //             Math.max(1, 10 - (timeTaken / TIME_SUCCESSFUL_SOLVE) * 10)
  //           );
  //           s.lastPuzzleSuccess = true;
  //           s.delta = delta;
  //           s.animatePointChange();
  //           s.score.value = s.score.value + delta;
  //           if (s.score.value > s.highScore.value) {
  //             s.highScore.value = s.score.value;
  //           }
  //           s.updateStep();
  //         }),
  //       lastPuzzleSuccess: false,
  //       currentPuzzleFailed: false,
  //       animatePointChange: () =>
  //         set(([s]) => {
  //           const animDuration = 300;
  //           Animated.sequence([
  //             Animated.timing(s.scoreOpacityAnim, {
  //               toValue: 1,
  //               duration: animDuration,
  //               useNativeDriver: true,
  //             }),
  //
  //             Animated.timing(s.scoreOpacityAnim, {
  //               toValue: 0,
  //               duration: animDuration,
  //               useNativeDriver: true,
  //             }),
  //           ]).start();
  //         }),
  //       onAutoPlayEnd: () =>
  //         set(([s]) => {
  //           s.puzzleStartTime = performance.now();
  //           s.currentPuzzleFailed = false;
  //         }),
  //       initState: () =>
  //         set(([s]) => {
  //           s.updateStep();
  //           s.refreshPuzzle();
  //         }),
  //       updateStep: () =>
  //         set(([s]) => {
  //           s.step = CLIMB[s.score.value];
  //         }),
  //     },
  //   };
  // }
  return initialState;
};
