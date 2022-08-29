import { Chess, Move } from "@lubert/chess.ts";
import {
  ProgressMessage,
  VisualizationState,
  ProgressMessageType,
  PlaybackSpeed,
} from "app/types/VisualizationState";
import { fetchNewPuzzle } from "./api";
import { AppState } from "./app_state";
import { ChessboardState, createChessState } from "./chessboard_state";
import { getInitialPuzzleState, PuzzleState } from "./puzzle_state";
import { logProxy } from "./state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import {
  DEBUG_CLIMB_START_PLAYING,
  DEBUG_PASS_FAIL_BUTTONS,
} from "./test_settings";
import { StorageItem } from "app/utils/storageItem";
import { Animated } from "react-native";
import { times } from "../utils";
import { cloneDeep, takeRight } from "lodash";
import { fensTheSame } from "app/utils/fens";
import { createQuick } from "./quick";

type Stack = [VisualizationState, AppState];

const testProgress = false;

const generateClimb = () => {
  let puzzleDifficulty = 1000;
  let hiddenMoves = 1;
  let cutoff = 2400;
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
    finishedAutoPlaying: false,
    chessboardState: null,
    puzzleState: getInitialPuzzleState(setPuzzle, getPuzzle),
    progressMessage: (testProgress
      ? { message: "Test message", type: ProgressMessageType.Error }
      : null) as ProgressMessage,

    isDone: false,
    playButtonFlashAnim: new Animated.Value(0.0),
    mockPassFail: DEBUG_PASS_FAIL_BUTTONS,
    showNotation: new StorageItem("show-notation-v2", true),
    plyUserSetting: new StorageItem("visualization-ply", 2),
    ratingGteUserSetting: new StorageItem("puzzle-rating-gte-v3", 0),
    ratingLteUserSetting: new StorageItem("puzzle-rating-lte-v3", 1200),
    playbackSpeedUserSetting: new StorageItem(
      "playback-speed",
      PlaybackSpeed.Normal
    ),
    hiddenMoves: null,
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
        let ply = s.step?.hiddenMoves ?? s.plyUserSetting.value;
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
        state.progressMessage = null;
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
        s.chessboardState.visualizeMoves(
          cloneDeep(s.hiddenMoves),
          s.playbackSpeedUserSetting.value,
          callback
        );
      }),
    setupForPuzzle: () =>
      set(([state]) => {
        state.focusedMoveIndex = null;
        let currentPosition = new Chess();
        let puzzlePosition = new Chess();
        let puzzle = state.puzzleState.puzzle;
        for (let move of puzzle.allMoves) {
          currentPosition.move(move);
          puzzlePosition.move(move);
          if (fensTheSame(currentPosition.fen(), puzzle.fen)) {
            puzzlePosition.move(puzzle.moves[0], { sloppy: true });
            currentPosition.move(puzzle.moves[0], { sloppy: true });
            let hiddenMoves = takeRight(
              currentPosition.history({ verbose: true }),
              state.getPly()
            );
            let boardForPuzzleMoves = puzzlePosition.clone();
            boardForPuzzleMoves.undo();
            for (let solutionMove of puzzle.moves) {
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
            state.chessboardState.futurePosition = puzzlePosition;
            state.puzzleState.puzzlePosition = puzzlePosition;
            state.showPuzzlePosition = false;
            state.chessboardState.position = currentPosition;
            state.chessboardState.flipped = puzzlePosition.turn() === "b";
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
              s.chessboardState.isVisualizingMoves = false;
              s.finishedAutoPlaying = true;
              s.focusedMoveIndex = null;
            });
          });
        }
      }),
    stopLoopingPlayFlash: () =>
      set(([s]) => {
        s.playButtonFlashAnim.setValue(1.0);
      }),
    startLoopingPlayFlash: () =>
      set(([s]) => {
        let animDuration = 1000;
        Animated.loop(
          Animated.sequence([
            Animated.timing(s.playButtonFlashAnim, {
              toValue: 1.0,
              duration: animDuration,
              useNativeDriver: true,
            }),

            Animated.timing(s.playButtonFlashAnim, {
              toValue: 0,
              duration: animDuration,
              useNativeDriver: true,
            }),
          ])
        ).start();
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
      initialState.chessboardState.animatePieceMove(...args);
    },
    onPuzzleMoveSuccess: () => {
      set(([state]) => {
        // TODO: animate piece move
        state.showPuzzlePosition = true;
        state.chessboardState.flashRing(true);
        state.chessboardState.position = state.puzzleState.puzzlePosition;
      });
    },
    onPuzzleMoveFailure: (move: Move) => {
      set(([state]) => {
        state.chessboardState.flashRing(false);
        if (isClimb) {
          state.onFail();
        }
      });
    },
    onPuzzleSuccess: () => {
      set(([state]) => {
        state.progressMessage = null;
        state.isDone = true;
        if (state.onSuccess) {
          state.onSuccess();
        }
      });
    },
  };

  const setChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _set((s) =>
      fn((isClimb ? s.climbState : s.visualizationState).chessboardState)
    );
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _get((s) =>
      fn((isClimb ? s.climbState : s.visualizationState).chessboardState)
    );
  };
  initialState.chessboardState = createChessState(
    setChess,
    getChess,
    (c: ChessboardState) => {
      c.frozen = false;
      c.delegate = initialState.puzzleState;
    }
  );
  if (isClimb) {
    initialState = {
      ...initialState,
      ...{
        isPlayingClimb: DEBUG_CLIMB_START_PLAYING,
        scoreOpacityAnim: new Animated.Value(0.0),
        // TODO: bring back intro screen
        score: new StorageItem("climb-score", 0),
        highScore: new StorageItem("climb-high-score", 0),
        delta: 0,
        step: null,
        puzzleStartTime: null,
        startPlayingClimb: () =>
          set(([s]) => {
            s.isPlayingClimb = true;
            s.visualizeHiddenMoves(() => {
              set(([s]) => {
                if (s.onAutoPlayEnd && !s.finishedAutoPlaying) {
                  s.onAutoPlayEnd();
                }
                s.chessboardState.isVisualizingMoves = false;
                s.finishedAutoPlaying = true;
                s.focusedMoveIndex = null;
              });
            });
          }),
        onFail: () =>
          set(([s]) => {
            // TODO: fix repetition here
            if (!s.currentPuzzleFailed) {
              let delta = -10;
              s.delta = delta;
              s.lastPuzzleSuccess = false;
              s.animatePointChange();
              s.score.value = Math.max(s.score.value + delta, 0);
              s.updateStep();
            }
            s.currentPuzzleFailed = true;
          }),
        onSuccess: () =>
          set(([s]) => {
            if (s.currentPuzzleFailed) {
              return;
            }
            let timeTaken = performance.now() - s.puzzleStartTime;
            let delta = Math.round(
              Math.max(1, 10 - (timeTaken / TIME_SUCCESSFUL_SOLVE) * 10)
            );
            s.lastPuzzleSuccess = true;
            s.delta = delta;
            s.animatePointChange();
            s.score.value = s.score.value + delta;
            if (s.score.value > s.highScore.value) {
              s.highScore.value = s.score.value;
            }
            s.updateStep();
          }),
        lastPuzzleSuccess: false,
        currentPuzzleFailed: false,
        animatePointChange: () =>
          set(([s]) => {
            let animDuration = 300;
            Animated.sequence([
              Animated.timing(s.scoreOpacityAnim, {
                toValue: 1,
                duration: animDuration,
                useNativeDriver: true,
              }),

              Animated.timing(s.scoreOpacityAnim, {
                toValue: 0,
                duration: animDuration,
                useNativeDriver: true,
              }),
            ]).start();
          }),
        onAutoPlayEnd: () =>
          set(([s]) => {
            s.puzzleStartTime = performance.now();
            s.currentPuzzleFailed = false;
          }),
        initState: () =>
          set(([s]) => {
            s.updateStep();
            s.refreshPuzzle();
          }),
        updateStep: () =>
          set(([s]) => {
            s.step = CLIMB[s.score.value];
          }),
      },
    };
  }
  return initialState;
};
