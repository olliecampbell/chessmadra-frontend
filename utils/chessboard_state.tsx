import { PlaybackSpeed } from "app/types/VisualizationState";
import { algebraic, Chess, Color, Move, SQUARES } from "@lubert/chess.ts";
import { cloneDeep, first, isEmpty, mapValues } from "lodash";
import { getAnimationDurations } from "../components/chessboard/Chessboard";
import { Animated, Easing } from "react-native";
import { Square } from "@lubert/chess.ts/dist/types";
import { SetState } from "zustand";
import { QuickUpdate, setter } from "./state";
import { c } from "app/styles";
import { getSquareOffset } from "./chess";
import { WritableDraft } from "immer/dist/internal";
import { Side } from "./repertoire";

type ChessBoardStateAndParent<T> = ChessboardState & ChessboardStateParent<T>;
export interface ChessboardState extends QuickUpdate<ChessboardState> {
  frozen?: boolean;
  position?: Chess;
  futurePosition?: Chess;
  indicatorColor?: string;
  squareHighlightAnims: Record<Square, Animated.Value>;
  ringColor?: string;
  ringIndicatorAnim?: Animated.Value;
  hideColors?: boolean;
  playbackSpeed?: PlaybackSpeed;
  availableMoves: Move[];
  flipped?: boolean;
  moveIndicatorAnim: Animated.ValueXY;
  moveIndicatorOpacityAnim: Animated.Value;
  pieceMoveAnim: Animated.ValueXY;
  animatedMove?: Move;
  allowMoves: boolean;
  highlightSquare?: Square;
  isVisualizingMoves?: boolean;
  onSquarePress: (
    square: Square,
    skipAnimation?: boolean,
    _s?: ChessBoardStateAndParent<any>
  ) => void;
  activeFromSquare?: Square;
  draggedOverSquare?: Square;
  visualizeMove: (
    move: Move,
    speed: PlaybackSpeed,
    callback: (state: ChessboardState) => void,
    _s: ChessBoardStateAndParent<any>
  ) => void;
  visualizeMoves: (
    moves: Move[],
    speed: PlaybackSpeed,
    callback: (state: ChessboardState) => void,
    _s: ChessBoardStateAndParent<any>
  ) => void;
  animatePieceMove: (
    move: Move,
    speed: PlaybackSpeed,
    callback: (
      completed: boolean,
      state: ChessBoardStateAndParent<any>
    ) => void,
    _state: ChessboardState | WritableDraft<ChessboardState>
  ) => void;
  flashRing: (success: boolean, _s: ChessBoardStateAndParent<any>) => void;
  moveLogPgn?: string;
  showMoveLog?: boolean;
  availableMovesFrom: (square: Square, _state: ChessboardState) => Move[];
  hideCoordinates?: boolean;
  highContrast?: boolean;
  isColorTraining?: boolean;
}

export interface ChessboardStateParent<T> {
  attemptMove?: (
    move: Move,
    cb: (shouldMove: boolean, cb: () => void) => void,
    state: ChessboardStateParent<T>
  ) => boolean;
}

export const createChessState = <
  T extends ChessboardState & ChessboardStateParent<any>
>(
  set,
  get,
  initialize: any
): ChessboardState => {
  let state = {
    allowMoves: true,
    isColorTraining: false,
    availableMoves: [],
    ringColor: null,
    isVisualizingMoves: false,
    ringIndicatorAnim: new Animated.Value(0),
    squareHighlightAnims: mapValues(SQUARES, (number, square) => {
      return new Animated.Value(0.0);
    }),
    flipped: false,
    position: new Chess(),
    moveIndicatorAnim: new Animated.ValueXY({ x: 0, y: 0 }),
    pieceMoveAnim: new Animated.ValueXY({ x: 0, y: 0 }),
    moveIndicatorOpacityAnim: new Animated.Value(0),
    onSquarePress: (
      square: Square,
      skipAnimation: boolean,
      _state: ChessboardState
    ) => {
      setter(set, _state, (state: T) => {
        let availableMove = state.availableMoves.find((m) => m.to == square);
        if (availableMove) {
          state.availableMoves = [];
          state.activeFromSquare = null;
          state.draggedOverSquare = null;
          let makeMove = (cb) => {
            if (skipAnimation) {
              state.position.move(availableMove);
              cb(null, state);
            } else {
              state.animatePieceMove(
                availableMove,
                PlaybackSpeed.Normal,
                (completed, s) => {
                  cb(completed, s);
                },
                state
              );
            }
          };
          if (
            (state.attemptMove &&
              state.attemptMove(
                availableMove,
                (shouldMove, cb) => {
                  if (shouldMove) {
                    makeMove(cb);
                  }
                },
                state
              )) ||
            !state.attemptMove
          ) {
          }
          return;
        }
        let availableMoves = state.availableMovesFrom(square, state);
        if (isEmpty(availableMoves)) {
          state.availableMoves = [];
          state.activeFromSquare = null;
          state.draggedOverSquare = null;
        } else {
          state.activeFromSquare = square;
          state.draggedOverSquare = null;
          state.availableMoves = availableMoves;
        }
      });
    },
    availableMovesFrom: (square: Square, _state: ChessboardState) => {
      return setter(set, _state, (state: ChessboardState) => {
        let position = state.futurePosition ?? state.position;
        let moves = position?.moves({
          square,
          verbose: true,
        });
        if (
          !isEmpty(state.availableMoves) &&
          first(state.availableMoves).from == square
        ) {
          return [];
        } else if (!state.frozen) {
          return moves;
        }
      });
    },
    animatePieceMove: (
      move: Move,
      speed: PlaybackSpeed,
      callback: (completed: boolean, state: ChessboardState) => void,
      _state: ChessboardState
    ) => {
      setter(set, _state, (state: ChessboardState) => {
        state.availableMoves = [];
        state.activeFromSquare = null;
        state.draggedOverSquare = null;
        state.animatedMove = move;
        state.position.move(move);
        callback(false, state);
        let { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        // @ts-ignore
        let [start, end]: Square[] = [move.from, move.to];
        state.pieceMoveAnim.setValue(getSquareOffset(start, state.flipped));
        Animated.sequence([
          Animated.timing(state.pieceMoveAnim, {
            toValue: getSquareOffset(end, state.flipped),
            duration: moveDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]).start(() => {
          set((s) => {
            s.animatedMove = null;

            callback(true, s);
          });
        });
      });
    },
    flashRing: (success: boolean, _state: ChessboardState) => {
      setter(set, _state, (state: ChessboardState) => {
        const animDuration = 200;
        state.ringColor = success
          ? c.colors.successColor
          : c.colors.failureColor;
        Animated.sequence([
          Animated.timing(state.ringIndicatorAnim, {
            toValue: 1,
            duration: animDuration,
          }),

          Animated.timing(state.ringIndicatorAnim, {
            toValue: 0,
            duration: animDuration,
          }),
        ]).start((finished) => {
          // TODO: better way to do this
          set((s) => {
            s.ringIndicatorAnim.setValue(0);
          });
        });
      });
    },

    visualizeMove: (
      move: Move,
      speed: PlaybackSpeed,
      callback: (state: ChessboardState) => void,
      _state: ChessboardState
    ) => {
      setter(set, _state, (state: ChessboardState) => {
        let { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        state.indicatorColor =
          move.color == "b" ? c.hsl(180, 15, 10, 80) : c.hsl(180, 15, 100, 80);
        let backwards = false;
        // @ts-ignore
        let [start, end]: Square[] = backwards
          ? [move.to, move.from]
          : [move.from, move.to];
        state.moveIndicatorAnim.setValue(getSquareOffset(start, state.flipped));
        Animated.sequence([
          Animated.timing(state.moveIndicatorOpacityAnim, {
            toValue: 1.0,
            duration: fadeDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.delay(stayDuration),
          Animated.timing(state.moveIndicatorAnim, {
            toValue: getSquareOffset(end, state.flipped),
            duration: moveDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.delay(stayDuration),
          Animated.timing(state.moveIndicatorOpacityAnim, {
            toValue: 0,
            duration: fadeDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]).start(callback);
      });
    },
    visualizeMoves: (
      moves: Move[],
      speed: PlaybackSpeed,
      callback: (state: ChessboardState) => void,
      _state: ChessboardState
    ) => {
      setter(set, _state, (state: ChessboardState) => {
        if (state.isVisualizingMoves) {
          return;
        }
        state.isVisualizingMoves = true;
        let i = 0;
        let delay = getAnimationDurations(speed)[2];
        let animateNextMove = (state: ChessboardState) => {
          let move = moves.shift();
          // TODO: something to deal with this state being old
          if (move && state.isVisualizingMoves) {
            state.visualizeMove(
              move,
              speed,
              () => {
                window.setTimeout(() => {
                  set((state) => {
                    animateNextMove(state);
                  });
                }, delay);
              },
              state
            );
            i++;
          } else {
            state.isVisualizingMoves = false;
            callback?.(state);
            // cb?.()
          }
        };
        animateNextMove(state);
      });
    },
  } as ChessboardState;
  initialize?.(state);
  // useEffect(() => {
  //   if (initialize) {
  //     set((s) => {
  //       initialize(s);
  //     });
  //   }
  // });
  return state;
};

export const createStaticChessState = ({
  line,
  epd,
  side,
}: {
  line?: string;
  epd?: string;
  side?: Side;
}) => {
  return createChessState(null, null, (state: ChessboardState) => {
    state.position = new Chess();
    state.frozen = true;
    state.highContrast = true;
    if (side) {
      state.flipped = side == "black";
    }
    state.hideCoordinates = true;
    if (epd) {
      let fen = `${epd} 0 1`;
      state.position = new Chess(fen);
    } else if (line) {
      state.position.loadPgn(line);
    }
  });
};
