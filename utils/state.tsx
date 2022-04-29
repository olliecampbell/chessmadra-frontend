import { getSquareOffset, isCheckmate } from "../utils/chess";
import { Store } from "pullstate";
import { StorageItem } from "app/utils/storageItem";
import {
  PlaybackSpeed,
  PuzzleDifficulty,
  VisualizationState,
  ProgressMessage,
  ProgressMessageType,
  getPuzzleDifficultyRating,
  ClimbState,
  ColorTrainingState,
  RepertoireBuilderState,
  PuzzleState,
} from "app/types/VisualizationState";
import {
  fakePuzzle,
  fakeBlackPuzzle,
  fakeBlackBlunderPuzzle,
  fakeWhiteBlunderPuzzle,
} from "app/mocks/puzzles";
import { algebraic, Chess, Color, Move, SQUARES } from "@lubert/chess.ts";
import { produce, original } from "immer";
import type { Draft } from "immer";
import create, {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from "zustand";
import {
  PersistOptions,
  StoreApiWithDevtools,
  StoreApiWithPersist,
  StoreApiWithSubscribeWithSelector,
  combine,
  devtools,
  persist,
  redux,
  subscribeWithSelector,
} from "zustand/middleware";
import { fetchNewBlunderPuzzle, fetchNewPuzzle } from "./api";
import {
  takeRight,
  cloneDeep,
  indexOf,
  isEmpty,
  first,
  sample,
  mapValues,
} from "lodash";
import { times } from "../utils";
import { WritableDraft } from "immer/dist/internal";
import { getAnimationDurations } from "../components/chessboard/Chessboard";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { COLUMNS, ROWS } from "../types/Chess";
import { c } from "../styles";
import { Square } from "@lubert/chess.ts/dist/types";
import {
  DEBUG_CLIMB_START_PLAYING,
  DEBUG_DONE_BLUNDER_VIEW,
  DEBUG_PASS_FAIL_BUTTONS,
  failOnTrue,
} from "./test_settings";
import { ChessboardState } from "../types/ChessboardBiref";
import { BlunderPuzzle, LichessGame, LichessPuzzle } from "../models";
import { MOCK_RETURNED_GAMES } from "app/mocks/games";

export type StoreSlice<T extends object, E extends object = T> = (
  set: SetState<E extends T ? E : E & T>,
  get: GetState<E extends T ? E : E & T>
) => T;

const fensTheSame = (x, y) => {
  if (x.split(" ")[0] == y.split(" ")[0]) {
    return true;
  }
};

const test = false;
const testProgress = false;

const immer =
  <
    T extends State,
    CustomSetState extends SetState<T>,
    CustomGetState extends GetState<T>,
    CustomStoreApi extends StoreApi<T>
  >(
    config: StateCreator<
      T,
      (partial: ((draft: Draft<T>) => void) | T, replace?: boolean) => void,
      CustomGetState,
      CustomStoreApi
    >
  ): StateCreator<T, CustomSetState, CustomGetState, CustomStoreApi> =>
  (set, get, api) =>
    config(
      (partial, replace) => {
        const nextState =
          typeof partial === "function"
            ? produce(partial as (state: Draft<T>) => T)
            : (partial as T);
        return set(nextState, replace);
      },
      get,
      api
    );

const generateClimb = () => {
  let puzzleDifficulty = 1000;
  let hiddenMoves = 1;
  let cutoff = 2400;
  const climb = [{ puzzleDifficulty, hiddenMoves }];
  const addRampingPuzzleDifficulty = () => {
    times(20)((i) => {
      puzzleDifficulty += 10;
      climb.push({ puzzleDifficulty, hiddenMoves });
    });
  };
  const addRampingHiddenMoves = () => {
    times(1)((i) => {
      hiddenMoves += 1;
      if (puzzleDifficulty < cutoff) {
        puzzleDifficulty -= 100;
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

// climb stuff
const CLIMB = generateClimb();
const TIME_SUCCESSFUL_SOLVE = 30 * 1000;
const TIME_UNSUCCESSFUL_SOLVE = 30 * 1000;
const POINTS_LOST = 20;

export const DEFAULT_CHESS_STATE = {
  availableMoves: [],
  ringColor: null,
  ringIndicatorAnim: new Animated.Value(0),
  squareHighlightAnims: mapValues(SQUARES, (number, square) => {
    return new Animated.Value(0.0);
  }),
  flipped: false,
  position: new Chess(),
  moveIndicatorAnim: new Animated.ValueXY({ x: 0, y: 0 }),
  moveIndicatorOpacityAnim: new Animated.Value(0),
};

const createPuzzleState = <T extends PuzzleState & PuzzleTraining<any>>(
  // TODO: some better way to have climb state and viz state
  set: SetState<T>,
  get
) => {
  return {
    puzzlePosition: null,
    turn: "w" as Color,
    attemptSolution: (move: Move, state?: T) => {
      setter(set, state, (state) => {
        console.log("Attempting solution!");
        console.log(move);
        console.log(logProxy(state));
        if (
          move.san == state.solutionMoves[0].san ||
          isCheckmate(move, state.puzzlePosition)
        ) {
          let otherSideMove = state.solutionMoves[1];
          console.log("Position");
          console.log(state.puzzlePosition.ascii());
          state.puzzlePosition.move(move);
          if (otherSideMove) {
            state.puzzlePosition.move(otherSideMove);
          }
          console.log(state.puzzlePosition.ascii());
          state.solutionMoves.shift();
          state.solutionMoves.shift();
          if (!isEmpty(state.solutionMoves)) {
            state.onPuzzleMoveSuccess(state);
            state.progressMessage = {
              message: "Keep going...",
              type: ProgressMessageType.Success,
            };
          } else {
            state.onPuzzleMoveSuccess(state);
            state.onPuzzleSuccess(state);
          }
        } else {
          console.log("Nope!");
          console.log(logProxy(move));
          console.log({
            san: move.san,
            solutionMoves: logProxy(state.solutionMoves),
          });
          state.onPuzzleMoveFailure(move, state);
          state.progressMessage = {
            message: `${move.san} was not the right move, try again.`,
            type: ProgressMessageType.Error,
          };
        }
      });
    },
    puzzle: test ? fakeBlackPuzzle : null,
    solutionMoves: [] as Move[],
    progressMessage: null as ProgressMessage,
  } as PuzzleState;
};

const createVisualizationState = (
  // TODO: some better way to have climb state and viz state
  set: SetState<VisualizationState>,
  get,
  isClimb
): VisualizationState => {
  return {
    ...createPuzzleState(set, get),
    onPuzzleMoveSuccess: (state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        console.log("move success");
        state.showPuzzlePosition = true;
        state.flashRing(true, state);
        state.chessState.position = state.puzzlePosition;
        console.log("Chess state position now");
        console.log(logProxy(state.chessState));
      });
    },
    onPuzzleMoveFailure: (move: Move, state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        state.flashRing(false, state);
        if (isClimb) {
          state.onFail(state);
        }
      });
    },
    onPuzzleSuccess: (state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        console.log("overall success");
        state.progressMessage = null;
        state.isDone = true;
        if (state.onSuccess) {
          state.onSuccess(state);
        }
      });
    },
    progressMessage: (testProgress
      ? { message: "Test message", type: ProgressMessageType.Error }
      : null) as ProgressMessage,

    isDone: false,
    playButtonFlashAnim: new Animated.Value(0.0),
    mockPassFail: DEBUG_PASS_FAIL_BUTTONS,
    showNotation: new StorageItem("show-notation", false),
    plyUserSetting: new StorageItem("visualization-ply", 2),
    ratingGteUserSetting: new StorageItem(
      "puzzle-rating-gte-v2",
      PuzzleDifficulty.Beginner
    ),
    ratingLteUserSetting: new StorageItem(
      "puzzle-rating-lte-v2",
      PuzzleDifficulty.Intermediate
    ),
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
    chessState: DEFAULT_CHESS_STATE,
    getFetchOptions: () => {
      let state: ClimbState = get();
      if (state.step) {
        return {
          ratingGte: state.step.puzzleDifficulty - 25,
          ratingLte: state.step.puzzleDifficulty + 25,
          maxPly: state.step.hiddenMoves,
        };
      }
      return {
        ratingGte: getPuzzleDifficultyRating(state.ratingGteUserSetting.value),
        ratingLte: getPuzzleDifficultyRating(state.ratingLteUserSetting.value),
        maxPly: state.plyUserSetting.value,
      };
    },
    getPly: () => {
      const state = get();
      return state.step?.hiddenMoves ?? state.plyUserSetting.value;
    },
    resetState: (state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        state.showPuzzlePosition = false;
        state.progressMessage = null;
        state.finishedAutoPlaying = false;
        state.isDone = false;
      });
    },
    refreshPuzzle: async () => {
      let state = get();
      let p = state.nextPuzzle;
      if (!p) {
        p = await fetchNewPuzzle(state.getFetchOptions(state));
      }
      if (!p) {
        window.alert(
          "Problem fetching puzzles, please report this if you run into it, to me@mbuffett.com"
        );
        return;
      }
      set((s) => {
        s.puzzle = p;
        s.resetState(s);
        s.setupForPuzzle(s);
      });
    },
    flashRing: (success: boolean, state?: VisualizationState) =>
      setter(set, state, (state) => {
        flashRing(state.chessState, success);
      }),
    ...createQuick(set),
    animateMoves: (state) => {
      setter(set, state, (state) => {
        if (state.isPlaying) {
          return;
        }
        state.stopLoopingPlayFlash(state);
        state.isPlaying = true;
        let moves = cloneDeep(state.hiddenMoves);
        let i = 0;
        let delay = getAnimationDurations(
          state.playbackSpeedUserSetting.value
        )[2];
        let animateNextMove = (state: VisualizationState) => {
          let move = moves.shift();
          // TODO: something to deal with this state being old
          if (move && state.isPlaying) {
            state.animateMove(state, move, false, () => {
              window.setTimeout(() => {
                set((state) => {
                  animateNextMove(state);
                });
              }, delay);
            });
            i++;
          } else {
            if (state.onAutoPlayEnd && !state.finishedAutoPlaying) {
              state.onAutoPlayEnd(state);
            }
            state.isPlaying = false;
            state.finishedAutoPlaying = true;
            state.focusedMoveIndex = null;
            // cb?.()
          }
        };
        animateNextMove(state);
      });
    },
    getSquareOffset: (square: Square, state?: VisualizationState) =>
      setter(set, state, (state) => {
        return getSquareOffset(square, state.chessState.flipped);
      }),
    animateMove: (
      state: VisualizationState,
      move: Move,
      backwards = false,
      callback: () => void
    ) => {
      animateMove(
        state.chessState,
        move,
        state.playbackSpeedUserSetting.value,
        callback
      );
    },
    setupForPuzzle: (state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        console.log("setting up for puzzle");
        state.focusedMoveIndex = null;
        let currentPosition = new Chess();
        let puzzlePosition = new Chess();
        for (let move of state.puzzle.allMoves) {
          currentPosition.move(move);
          puzzlePosition.move(move);
          if (fensTheSame(currentPosition.fen(), state.puzzle.fen)) {
            puzzlePosition.move(state.puzzle.moves[0], { sloppy: true });
            currentPosition.move(state.puzzle.moves[0], { sloppy: true });
            let hiddenMoves = takeRight(
              currentPosition.history({ verbose: true }),
              state.getPly()
            );
            let boardForPuzzleMoves = puzzlePosition.clone();
            boardForPuzzleMoves.undo();
            for (let solutionMove of state.puzzle.moves) {
              boardForPuzzleMoves.move(solutionMove, { sloppy: true });
            }
            state.solutionMoves = takeRight(
              boardForPuzzleMoves.history({ verbose: true }),
              state.puzzle.moves.length - 1
            );
            console.log("Solution moves at first!");
            console.log(logProxy(state.solutionMoves));
            // currentPosition.undo()

            state.hiddenMoves = hiddenMoves;
            for (let i = 0; i < state.getPly(); i++) {
              currentPosition.undo();
            }
            // state.currentPosition = currentPosition
            state.currentPosition = currentPosition;
            state.puzzlePosition = puzzlePosition;
            state.showPuzzlePosition = false;
            state.chessState.position = currentPosition;
            state.chessState.flipped = puzzlePosition.turn() === "b";
            break;
          }
        }
        state.turn = state.puzzlePosition.turn();
        state.startLoopingPlayFlash(state);
        if (isClimb) {
          state.animateMoves(state);
        }
      });
    },
    stopLoopingPlayFlash: (state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        state.playButtonFlashAnim.setValue(1.0);
      });
    },
    startLoopingPlayFlash: (state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        let animDuration = 1000;
        Animated.loop(
          Animated.sequence([
            Animated.timing(state.playButtonFlashAnim, {
              toValue: 1.0,
              duration: animDuration,
              useNativeDriver: false,
            }),

            Animated.timing(state.playButtonFlashAnim, {
              toValue: 0,
              duration: animDuration,
              useNativeDriver: false,
            }),
          ])
        ).start();
      });
    },
    onSquarePress: (square: Square) =>
      set((state) => {
        let availableMove = state.chessState.availableMoves.find(
          (m) => m.to == square
        );
        if (availableMove) {
          state.chessState.availableMoves = [];
          state.attemptSolution(availableMove, state);
          return;
        }
        let moves = state.puzzlePosition.moves({
          square,
          verbose: true,
        });
        if (
          !isEmpty(state.chessState.availableMoves) &&
          first(state.chessState.availableMoves).from == square
        ) {
          state.chessState.availableMoves = [];
        } else if (!state.chessState.frozen) {
          // @ts-ignore
          state.chessState.availableMoves = moves;
        }
      }),
    toggleNotation: (state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        state.showNotation.value = !state.showNotation.value;
      });
    },
    setPlaybackSpeed: (
      playbackSpeed: PlaybackSpeed,
      state?: VisualizationState
    ) => {
      setter<VisualizationState>(set, state, (state) => {
        state.playbackSpeedUserSetting.value = playbackSpeed;
        return true;
      });
    },
    updatePly: (increment: number, state?: VisualizationState) => {
      setter<VisualizationState>(set, state, (state) => {
        state.plyUserSetting.value = Math.max(
          state.plyUserSetting.value + increment,
          1
        );
        state.setupForPuzzle(state);
      });
    },
  };
};

const createClimbState = <T extends ClimbState>(
  // TODO: some better way to have climb state and viz state
  set: SetState<T>,
  get
): T => {
  // @ts-ignore this is really bad, really need to figure out how to create a store that extends from another
  return {
    isPlayingClimb: DEBUG_CLIMB_START_PLAYING,
    scoreOpacityAnim: new Animated.Value(0.0),
    // TODO: bring back intro screen
    climb: CLIMB,
    score: new StorageItem("climb-score", 0),
    highScore: new StorageItem("climb-high-score", 0),
    delta: 0,
    step: null,
    puzzleStartTime: null,
    startPlayingClimb: (state) =>
      setter<T>(set, state, (s) => {
        s.isPlayingClimb = true;
        s.animateMoves(s);
      }),
    onFail: (state?: ClimbState) =>
      setter(set, state, (s) => {
        // TODO: fix repetition here
        s.currentPuzzleFailed = true;
        let delta = -10;
        s.delta = delta;
        s.lastPuzzleSuccess = false;
        s.animatePointChange(s);
        s.score.value = Math.max(s.score.value + delta, 0);
        s.updateStep(s);
      }),
    onSuccess: (state?: ClimbState) =>
      setter(set, state, (s) => {
        if (s.currentPuzzleFailed) {
          return;
        }
        let timeTaken = performance.now() - s.puzzleStartTime;
        let delta = Math.round(
          Math.max(1, 10 - (timeTaken / TIME_SUCCESSFUL_SOLVE) * 10)
        );
        s.lastPuzzleSuccess = true;
        s.delta = delta;
        s.animatePointChange(s);
        s.score.value = s.score.value + delta;
        if (s.score.value > s.highScore.value) {
          s.highScore.value = s.score.value;
        }
        s.updateStep(s);
      }),
    lastPuzzleSuccess: false,
    currentPuzzleFailed: false,
    animatePointChange: (state?: ClimbState) =>
      setter(set, state, (s) => {
        let animDuration = 300;
        Animated.sequence([
          Animated.timing(s.scoreOpacityAnim, {
            toValue: 1,
            duration: animDuration,
            useNativeDriver: false,
          }),

          Animated.timing(s.scoreOpacityAnim, {
            toValue: 0,
            duration: animDuration,
            useNativeDriver: false,
          }),
        ]).start();
      }),
    onAutoPlayEnd: (state?: ClimbState) =>
      setter(set, state, (s) => {
        s.puzzleStartTime = performance.now();
        s.currentPuzzleFailed = false;
      }),
    initState: (state?: ClimbState) =>
      setter(set, state, (state) => {
        state.updateStep(state);
        state.refreshPuzzle();
      }),
    updateStep: (state?: ClimbState) =>
      setter(set, state, (state) => {
        state.step = state.climb[state.score.value];
      }),
    ...createVisualizationState(set, get, true),
  };
};

export const useVisualizationStore = create<VisualizationState>(
  devtools(
    // @ts-ignore for the set stuff
    immer((set, get) => createVisualizationState(set, get, false)),
    { name: "VisualizationState" }
  )
);

export const useColorTrainingStore = create<ColorTrainingState>(
  devtools(
    // @ts-ignore for the set stuff
    immer((set: SetState<ColorTrainingState>, get) => ({
      isPlaying: false,
      startTime: null,
      score: 0,
      lastRoundScore: null,
      widthAnim: new Animated.Value(0.0),
      highScore: new StorageItem("high-score-color-trainer", 0),
      roundDuration: 30 * 1000,
      remainingTime: null,
      penalties: 0,
      currentSquare: null,
      chessState: { ...DEFAULT_CHESS_STATE, hideColors: true, position: null },
      calculateRemainingTime: (state?: ColorTrainingState) => {
        setter<ColorTrainingState>(set, state, (state) => {
          let remainingTime =
            state.roundDuration -
            (performance.now() - state.startTime) -
            state.penalties * 5 * 1000;
          state.remainingTime = remainingTime;
          state.widthAnim.setValue(remainingTime / state.roundDuration);
          Animated.timing(state.widthAnim, {
            toValue: 0.0,
            duration: remainingTime,
            useNativeDriver: false,
            easing: Easing.linear,
          }).start(() => {
            let state = get();
            state.stopRound();
          });
        });
      },
      stopRound: (state?: ColorTrainingState) =>
        setter(set, state, (state) => {
          state.isPlaying = false;
          state.lastRoundScore = state.score;
          if (state.score > state.highScore.value) {
            state.highScore.value = state.score;
          }
          state.score = 0;
          state.penalties = 0;
          state.remainingTime = 0;
          state.clearHighlights(state);
          state.currentSquare = null;
        }),

      startPlaying: (state?: ColorTrainingState) =>
        setter(set, state, (state) => {
          state.widthAnim.setValue(1.0);
          state.startTime = performance.now();
          state.remainingTime = state.roundDuration;
          state.isPlaying = true;
          state.score = 0;
          state.highlightNewSquare(state);
          state.calculateRemainingTime(state);
        }),
      flashRing: (success: boolean, state?: ColorTrainingState) =>
        setter(set, state, (state) => {
          flashRing(state.chessState, success);
        }),
      guessColor: (color: "light" | "dark", state?: ColorTrainingState) => {
        setter(set, state, (state) => {
          let correct = new Chess().squareColor(state.currentSquare) == color;
          state.flashRing(correct, state);
          if (correct) {
            state.score = state.score + 1;
          } else {
            state.penalties = state.penalties + 1;
          }
          state.calculateRemainingTime(state);
          state.highlightNewSquare(state);
        });
      },
      clearHighlights: (state?: ColorTrainingState) =>
        setter(set, state, (state) => {
          let animDuration = 200;
          if (state.currentSquare) {
            Animated.timing(
              state.chessState.squareHighlightAnims[state.currentSquare],
              {
                toValue: 0,
                duration: animDuration,
                useNativeDriver: false,
              }
            ).start();
          }
        }),
      highlightNewSquare: (state?: ColorTrainingState) =>
        setter(set, state, (state) => {
          let randomSquare = algebraic(sample(SQUARES)) as Square;
          let animDuration = 200;
          state.clearHighlights(state);
          state.currentSquare = randomSquare;
          Animated.timing(
            state.chessState.squareHighlightAnims[state.currentSquare],
            {
              toValue: 0.8,
              duration: animDuration,
              useNativeDriver: false,
            }
          ).start();
        }),
    })),
    { name: "ColorTrainingState" }
  )
);

export const useRepertoireBuilderStore = create<RepertoireBuilderState>(
  devtools(
    // @ts-ignore for the set stuff
    immer((set: SetState<RepertoireBuilderState>, get) => ({
      chessState: { ...DEFAULT_CHESS_STATE },
      flashRing: (success: boolean, state?: ColorTrainingState) =>
        setter(set, state, (state) => {
          flashRing(state.chessState, success);
        }),
    })),
    { name: "ColorTrainingState" }
  )
);

export enum BlunderRecognitionTab {
  Passed = "Passed",
  Failed = "Failed",
}

export enum BlindfoldTrainingStage {
  Blindfold,
  Board,
}

export interface BlindfoldTrainingState
  extends PuzzleState,
    PuzzleTraining<BlindfoldTrainingState> {
  quick: (fn: (_: BlindfoldTrainingState) => void) => void;
  chessState: ChessboardState;
  stage: BlindfoldTrainingStage;
  ratingGteUserSetting: StorageItem<number>;
  ratingLteUserSetting: StorageItem<number>;
  numPiecesGteUserSetting: StorageItem<number>;
  numPiecesLteUserSetting: StorageItem<number>;
  flashRing: (success: boolean, state?: BlindfoldTrainingState) => void;
  refreshPuzzle: (state?: BlindfoldTrainingState) => void;
  nextPuzzle: LichessPuzzle;
  resetState: (state?: BlindfoldTrainingState) => void;
  setupForPuzzle: (state?: BlindfoldTrainingState) => void;
  getFetchOptions: (state?: BlindfoldTrainingState) => any;
  progressMessage: ProgressMessage;
  isDone: boolean;
}

interface BlunderRecognitionState {
  isPlaying: boolean;
  wasCorrect: boolean;
  startTime: number;
  difficulty: StorageItem<BlunderRecognitionDifficulty>;
  score: number;
  activeTab: BlunderRecognitionTab;
  puzzles: BlunderPuzzle[];
  currentPuzzle: BlunderPuzzle;
  currentMove: string;
  isBlunder: boolean;
  widthAnim: Animated.Value;
  roundDuration: number;
  remainingTime: number;
  penalties: number;
  currentSquare: Square;
  chessState: ChessboardState;
  startPlaying: (state?: BlunderRecognitionState) => void;
  flashRing: (success: boolean, state?: BlunderRecognitionState) => void;
  guessColor: (
    color: "light" | "dark",
    state?: BlunderRecognitionState
  ) => void;
  clearHighlights: (state?: BlunderRecognitionState) => void;
  highlightNewSquare: (state?: BlunderRecognitionState) => void;
  setupNextRound: (state?: BlunderRecognitionState) => void;
  guess: (isBlunder: boolean, state?: BlunderRecognitionState) => void;
  donePlaying: boolean;
  prefetchPuzzles: (state?: BlunderRecognitionState) => void;
  quick: (fn: (_: BlunderRecognitionState) => void) => void;
}
export enum BlunderRecognitionDifficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export const getBlunderRange = (
  d: BlunderRecognitionDifficulty
): [number, number] => {
  if (d === BlunderRecognitionDifficulty.Easy) {
    // TODO: better way to get mate-blunders
    return [500, 20000];
  }
  if (d === BlunderRecognitionDifficulty.Medium) {
    return [300, 500];
  }
  if (d === BlunderRecognitionDifficulty.Hard) {
    return [200, 300];
  }
};

export interface FinishedBlunderPuzzle {
  puzzle: BlunderPuzzle;
  showedBlunder: boolean;
  correct: boolean;
  timeTaken: number;
}

export const useBlunderRecognitionStore = create<BlunderRecognitionState>(
  devtools(
    // @ts-ignore for the set stuff
    immer((set: SetState<BlunderRecognitionState>, get) => ({
      isPlaying: false,
      startTime: null,
      score: 0,
      lastRoundScore: null,
      widthAnim: new Animated.Value(0.0),
      highScore: new StorageItem("high-score-blunder-recognition", {
        [BlunderRecognitionDifficulty.Easy]: 0,
        [BlunderRecognitionDifficulty.Medium]: 0,
        [BlunderRecognitionDifficulty.Hard]: 0,
      } as Record<BlunderRecognitionDifficulty, number>),
      roundDuration: 60 * 2 * 1000,
      remainingTime: null,
      penalties: 0,
      difficulty: new StorageItem(
        "blunder-recognition-difficulty",
        BlunderRecognitionDifficulty.Easy as BlunderRecognitionDifficulty
      ),
      puzzle: null,
      nextPuzzle: null,
      chessState: { ...DEFAULT_CHESS_STATE },
      donePlaying: DEBUG_DONE_BLUNDER_VIEW,
      seenPuzzles: DEBUG_DONE_BLUNDER_VIEW
        ? Array(20)
            .fill(0)
            .map(() => {
              return {
                puzzle: fakeBlackBlunderPuzzle,
                showedBlunder: Math.random() < 0.5,
                correct:
                  Math.random() < 0.5
                    ? true
                    : Math.random() < 0.5
                    ? false
                    : null,
                timeTaken: Math.random() * 100,
              };
            })
        : [],
      activeTab: BlunderRecognitionTab.Failed,
      quick: (fn) => {
        setter<BlunderRecognitionState>(set, undefined, (state) => {
          fn(state);
        });
      },
      startPlaying: (state?: BlunderRecognitionState) =>
        setter(set, state, (state) => {
          state.donePlaying = false;
          state.isPlaying = true;
          state.setupNextRound(state);
        }),
      flashRing: (success: boolean, state?: BlunderRecognitionState) =>
        setter(set, state, (state) => {
          flashRing(state.chessState, success);
        }),
      guess: (isBlunder: boolean, state?: BlunderRecognitionState) =>
        setter(set, state, (state: BlunderRecognitionState) => {
          state.donePlaying = true;
          let correct = isBlunder === state.isBlunder;
          if (correct) {
            state.wasCorrect = true;
          } else {
            state.wasCorrect = false;
          }
          state.flashRing(correct, state);
        }),
      prefetchPuzzles: async () => {
        let state = get();
        let puzzles = await fetchNewBlunderPuzzle({
          centipawn_loss_max: getBlunderRange(state.difficulty.value)[1],
          centipawn_loss_min: getBlunderRange(state.difficulty.value)[0],
          limit: 1,
        });
        set((s) => {
          s.puzzles = puzzles;
        });
      },
      setupNextRound: (state) => {
        setter(set, state, (state: BlunderRecognitionState) => {
          let showBlunder = Math.random() < 0.5;
          state.currentPuzzle = state.puzzles.shift();
          if (!state.currentPuzzle) {
            (async () => {
              await state.prefetchPuzzles();
              set((s) => {
                s.setupNextRound(s as BlunderRecognitionState);
              });
            })();
            return;
          }
          state.donePlaying = false;
          state.currentMove = showBlunder
            ? state.currentPuzzle.blunder
            : state.currentPuzzle.bestMove;
          state.isBlunder = showBlunder;
          let pos = new Chess(state.currentPuzzle.fen);
          pos.move(state.currentMove);
          let move = pos.undo();
          state.chessState.position = pos;
          state.chessState.flipped = pos.turn() === "b";
          animateMove(state.chessState, move, PlaybackSpeed.Normal, () => {});
        });
      },
    })),
    { name: "BlunderRecognitionState" }
  )
);

export const useBlindfoldTrainingStore = create<BlindfoldTrainingState>(
  devtools(
    // @ts-ignore for the set stuff
    immer(
      // TODO: figure out why typescript hates this
      // @ts-ignore
      (set: SetState<BlindfoldTrainingState>, get) =>
        ({
          // TODO: clone?
          progressMessage: null,
          isDone: false,
          ...createQuick(set),
          ...createPuzzleState(set, get),
          onPuzzleMoveSuccess: (state?: BlindfoldTrainingState) => {
            setter<BlindfoldTrainingState>(set, state, (state) => {
              console.log("move success");
              state.flashRing(true, state);
              state.chessState.position = state.puzzlePosition;
              console.log("Chess state position now");
              console.log(logProxy(state.chessState));
              state.progressMessage = {
                message: "Keep going...",
                type: ProgressMessageType.Success,
              };
            });
          },
          onPuzzleMoveFailure: (move: Move, state?: BlindfoldTrainingState) => {
            setter<BlindfoldTrainingState>(set, state, (state) => {
              state.flashRing(false, state);
              state.progressMessage = {
                message: `${move.san} was not the right move, try again.`,
                type: ProgressMessageType.Error,
              };
            });
          },
          flashRing: (success: boolean, state?: BlindfoldTrainingState) =>
            setter(set, state, (state) => {
              flashRing(state.chessState, success);
            }),
          onPuzzleSuccess: (state?: BlindfoldTrainingState) => {
            setter<BlindfoldTrainingState>(set, state, (state) => {
              console.log("overall success");
              state.progressMessage = null;
              state.isDone = true;
            });
          },
          onSquarePress: (square: Square) =>
            set((state) => {
              let availableMove = state.chessState.availableMoves.find(
                (m) => m.to == square
              );
              if (availableMove) {
                state.chessState.availableMoves = [];
                state.attemptSolution(availableMove, state);
                // TODO:
                // biref.attemptSolution(availableMove)
                return;
              }
              if (!state.puzzlePosition) {
                return;
              }
              let moves = state.puzzlePosition.moves({
                square,
                verbose: true,
              });
              if (
                !isEmpty(state.chessState.availableMoves) &&
                first(state.chessState.availableMoves).from == square
              ) {
                state.chessState.availableMoves = [];
              } else if (!state.chessState.frozen) {
                // @ts-ignore
                state.chessState.availableMoves = moves;
              }
            }),
          getFetchOptions: () => {
            let state: BlindfoldTrainingState = get();
            return {
              ratingGte: state.ratingGteUserSetting.value,
              ratingLte: state.ratingLteUserSetting.value,
              pieceCountLt: state.numPiecesLteUserSetting.value + 1,
              pieceCountGt: state.numPiecesGteUserSetting.value - 1,
              // maxPly: state.plyUserSetting.value,
            };
          },
          refreshPuzzle: async () => {
            let state = get();
            let p = state.nextPuzzle;
            if (!p) {
              p = await fetchNewPuzzle(state.getFetchOptions(state));
            }
            if (!p) {
              window.alert(
                "Problem fetching puzzles, please report this if you run into it, to me@mbuffett.com"
              );
              return;
            }
            set((s) => {
              s.puzzle = p;
              s.resetState(s);
              s.setupForPuzzle(s);
            });
          },
          setupForPuzzle: (state?: BlindfoldTrainingState) => {
            setter<BlindfoldTrainingState>(set, state, (state) => {
              console.log("SETTING UP");
              let position = new Chess();
              for (let move of state.puzzle.allMoves) {
                position.move(move);
                if (fensTheSame(position.fen(), state.puzzle.fen)) {
                  position.move(state.puzzle.moves[0], { sloppy: true });
                  for (let solutionMove of state.puzzle.moves) {
                    position.move(solutionMove, { sloppy: true });
                  }
                  state.solutionMoves = takeRight(
                    position.history({ verbose: true }),
                    state.puzzle.moves.length - 1
                  );
                  for (let i = 0; i < state.puzzle.moves.length - 1; i++) {
                    position.undo();
                  }
                  state.chessState.position = position;
                  state.puzzlePosition = position;
                  state.chessState.flipped = position.turn() === "b";
                  break;
                }
              }
              state.turn = state.chessState.position.turn();
            });
          },
          resetState: (state?: BlindfoldTrainingState) => {
            setter<BlindfoldTrainingState>(set, state, (state) => {
              state.stage = BlindfoldTrainingStage.Blindfold;
              state.isDone = false;
            });
          },
          nextPuzzle: null,
          stage: BlindfoldTrainingStage.Blindfold,
          chessState: DEFAULT_CHESS_STATE,
          numPiecesGteUserSetting: new StorageItem(
            "blindfold-numPieces-gte-v3",
            3
          ),
          numPiecesLteUserSetting: new StorageItem(
            "blindfold-numPieces-lte-v3",
            5
          ),
          ratingGteUserSetting: new StorageItem("blindfold-rating-gte-v3", 0),
          ratingLteUserSetting: new StorageItem(
            "blindfold-rating-lte-v3",
            1200
          ),
        } as BlindfoldTrainingState)
    ),
    { name: "BlindfoldTrainingState" }
  )
);

export const useClimbStore = create<ClimbState>(
  // @ts-ignore for the set stuff
  devtools(
    // @ts-ignore for the set stuff
    immer((set, get) => createClimbState(set, get)),
    { name: "ClimbState" }
  )
);

export interface PuzzleTraining<T> {
  onPuzzleMoveSuccess: (state?: T) => void;
  onPuzzleMoveFailure: (move: Move, state?: T) => void;
  onPuzzleSuccess: (state?: T) => void;
}

const setter = <T extends object>(
  set: SetState<T>,
  state: T | undefined,
  fn: (state: T) => void
) => {
  if (state) {
    // To force re-render when changing just a class or something
    // @ts-ignore
    state.bogus = Math.random();
    return fn(state);
  } else {
    set((state) => {
      // To force re-render when changing just a class or something
      // @ts-ignore
      state.bogus = Math.random();
      fn(state);
    });
  }
};

function animateMove(
  chessState: ChessboardState,
  move: Move,
  speed: PlaybackSpeed,
  callback: () => void
) {
  let { fadeDuration, moveDuration, stayDuration } =
    getAnimationDurations(speed);
  chessState.indicatorColor =
    move.color == "b" ? c.hsl(180, 15, 10, 80) : c.hsl(180, 15, 100, 80);
  let backwards = false;
  // @ts-ignore
  let [start, end]: Square[] = backwards
    ? [move.to, move.from]
    : [move.from, move.to];
  chessState.moveIndicatorAnim.setValue(
    getSquareOffset(start, chessState.flipped)
  );
  Animated.sequence([
    Animated.timing(chessState.moveIndicatorOpacityAnim, {
      toValue: 1.0,
      duration: fadeDuration,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }),
    Animated.delay(stayDuration),
    Animated.timing(chessState.moveIndicatorAnim, {
      toValue: getSquareOffset(end, chessState.flipped),
      duration: moveDuration,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }),
    Animated.delay(stayDuration),
    Animated.timing(chessState.moveIndicatorOpacityAnim, {
      toValue: 0,
      duration: fadeDuration,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }),
  ]).start(callback);
}

function flashRing(chessState: ChessboardState, success: boolean) {
  const animDuration = 200;
  chessState.ringColor = success
    ? c.colors.successColor
    : c.colors.failureColor;
  Animated.sequence([
    Animated.timing(chessState.ringIndicatorAnim, {
      toValue: 1,
      duration: animDuration,
      useNativeDriver: false,
    }),

    Animated.timing(chessState.ringIndicatorAnim, {
      toValue: 0,
      duration: animDuration,
      useNativeDriver: false,
    }),
  ]).start();
}

function createQuick<T extends object>(set: SetState<T>): any {
  return {
    quick: (fn) => {
      setter<T>(set, undefined, (state) => {
        fn(state);
      });
    },
  };
}
// const setter = <T,>(
//   set: (
//     state: (
//       partial:
//         | VisualizationState
//         | ((draft: WritableDraft<VisualizationState>) => void),
//       replace?: boolean
//     ) => void
//   ) => void,
//   state: VisualizationState | WritableDraft<VisualizationState>
// ): ((state?: VisualizationState) => void) => {

// }

const logProxy = (p: any) => {
  if (p) {
    return JSON.parse(JSON.stringify(p));
  } else {
    return p;
  }
};

export const useGamesSearchState = create<GamesSearchState>(
  devtools(
    // @ts-ignore for the set stuff
    immer(
      // TODO: figure out why typescript hates this
      // @ts-ignore
      (set: SetState<GamesSearchState>, get): GamesSearchState =>
        ({
          // TODO: clone?
          ...createQuick(set),
          numberMoves: [2, 50],
          whiteRating: [1800, 2200],
          blackRating: [1800, 2200],
          chessState: DEFAULT_CHESS_STATE,
          whiteBlunders: [0, 3],
          blackBlunders: [0, 3],
          gameResult: null,
          returnedGames: [],
          loading: failOnTrue(false),
          onSquarePress: (square: Square) =>
            set((state) => {
              let availableMove = state.chessState.availableMoves.find(
                (m) => m.to == square
              );
              console.log("Available");
              console.log(logProxy(availableMove));
              if (availableMove) {
                state.chessState.availableMoves = [];
                state.chessState.position.move(availableMove);
                // TODO:
                // biref.attemptSolution(availableMove)
                return;
              }
              let moves = state.chessState.position.moves({
                square,
                verbose: true,
              });
              state.chessState.availableMoves = moves;
            }),
          getFetchOptions: () => {
            let state = get() as GamesSearchState;
            return {
              // TODO
              // ratingGte: state.ratingGteUserSetting.value,
              // ratingLte: state.ratingLteUserSetting.value,
              // pieceCountLt: state.numPiecesLteUserSetting.value + 1,
              // pieceCountGt: state.numPiecesGteUserSetting.value - 1,
              // maxPly: state.plyUserSetting.value,
            };
          },
        } as GamesSearchState)
    ),
    { name: "BlindfoldTrainingState" }
  )
);

export interface GamesSearchState {
  quick: (fn: (_: GamesSearchState) => void) => void;
  onSquarePress: (square: Square) => void;
  whiteRating: [number, number];
  blackRating: [number, number];
  numberMoves: [number, number];
  whiteBlunders: [number, number];
  blackBlunders: [number, number];
  whitePlayer: string;
  blackPlayer: string;
  chessState: ChessboardState;
  gameResult: GameSearchResult;
  startingMoves: [string];
  returnedGames: LichessGame[];
  loading: boolean;
}

export enum GameSearchResult {
  White = 1,
  Draw = 0,
  Black = -1,
}
