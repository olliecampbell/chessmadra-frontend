import { Chess } from "@lubert/chess.ts";
import { PlaybackSpeed } from "app/types/VisualizationState";
import { fetchNewBlunderPuzzle } from "./api";
import { AppState } from "./app_state";
import { ChessboardState, createChessState } from "./chessboard_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { DEBUG_DONE_BLUNDER_VIEW } from "./test_settings";
import { StorageItem } from "app/utils/storageItem";
import { Animated } from "react-native";
import { BlunderPuzzle } from "app/models";
import { Square } from "@lubert/chess.ts/dist/types";
import { createQuick } from "./quick";

type Stack = [BlunderRecognitionState, AppState];

export enum BlunderRecognitionTab {
  Passed = "Passed",
  Failed = "Failed",
}

export interface BlunderRecognitionState {
  isPlaying?: boolean;
  wasCorrect?: boolean;
  chessboardState?: ChessboardState;
  startTime?: number;
  difficulty: StorageItem<BlunderRecognitionDifficulty>;
  score?: number;
  activeTab?: BlunderRecognitionTab;
  puzzles?: BlunderPuzzle[];
  currentPuzzle?: BlunderPuzzle;
  currentMove?: string;
  isBlunder?: boolean;
  widthAnim: Animated.Value;
  roundDuration: number;
  remainingTime: number;
  penalties: number;
  currentSquare?: Square;
  startPlaying: () => void;
  guessColor?: (color: "light" | "dark") => void;
  setupNextRound: () => void;
  guess: (isBlunder: boolean) => void;
  donePlaying?: boolean;
  prefetchPuzzles: () => Promise<void>;
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

export const getInitialBlundersState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn([s.blunderState, s]));
  };
  const setOnly = <T,>(
    fn: (stack: BlunderRecognitionState) => T,
    id?: string
  ): T => {
    return set(([s]) => fn(s));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn([s.blunderState, s]));
  };

  let initialState = {
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
    donePlaying: false,
    seenPuzzles: [],
    activeTab: BlunderRecognitionTab.Failed,
    ...createQuick(setOnly),
    startPlaying: () =>
      set(([s]) => {
        s.donePlaying = false;
        s.isPlaying = true;
        s.setupNextRound();
      }),
    guess: (isBlunder: boolean) =>
      set(([s]) => {
        s.donePlaying = true;
        let correct = isBlunder === s.isBlunder;
        if (correct) {
          s.wasCorrect = true;
        } else {
          s.wasCorrect = false;
        }
        s.chessboardState.flashRing(correct);
      }),
    prefetchPuzzles: async () =>
      set(async ([s]) => {
        let puzzles = await fetchNewBlunderPuzzle({
          centipawn_loss_max: getBlunderRange(s.difficulty.value)[1],
          centipawn_loss_min: getBlunderRange(s.difficulty.value)[0],
          limit: 1,
        });
        // @ts-ignore
        set(([s]) => {
          s.puzzles = puzzles;
        });
      }),
    setupNextRound: () => {
      set(([s]) => {
        let showBlunder = Math.random() < 0.5;
        s.currentPuzzle = s.puzzles.shift();
        if (!s.currentPuzzle) {
          console.log("No current puzzle");
          (async () => {
            await s.prefetchPuzzles();
            // @ts-ignore
            set(([s]) => {
              s.setupNextRound();
            });
          })();
          return;
        }
        s.donePlaying = false;
        s.currentMove = showBlunder
          ? s.currentPuzzle.blunder
          : s.currentPuzzle.bestMove;
        s.isBlunder = showBlunder;
        let pos = new Chess(s.currentPuzzle.fen);
        pos.move(s.currentMove);
        let move = pos.undo();
        s.chessboardState.position = pos;
        s.chessboardState.flipped = pos.turn() === "b";
        s.chessboardState.visualizeMove(move, PlaybackSpeed.Normal, () => {});
      });
    },
  } as BlunderRecognitionState;

  const setChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _set((s) => fn(s.blunderState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _get((s) => fn(s.blunderState.chessboardState));
  };
  initialState.chessboardState = createChessState(
    setChess,
    getChess,
    (c: ChessboardState) => {
      c.frozen = true;
    }
  );
  return initialState;
};

/*create<BlunderRecognitionState>()(
  devtools(
    // @ts-ignore for the set stuff
    immer((set: SetState<BlunderRecognitionState>, get) => ()),
    { name: "BlunderRecognitionState" }
  )
);
*/
