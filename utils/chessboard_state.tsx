import { PlaybackSpeed } from "app/types/VisualizationState";
import { algebraic, Chess, Color, Move, SQUARES } from "@lubert/chess.ts";
import { cloneDeep, first, isEmpty, mapValues } from "lodash";
import { getAnimationDurations } from "../components/chessboard/Chessboard";
import { Animated, Easing } from "react-native";
import { Square } from "@lubert/chess.ts/dist/types";
import { SetState } from "zustand";
import { createQuick, logProxy, QuickUpdate } from "./state";
import { c } from "app/styles";
import { getSquareOffset } from "./chess";
import { WritableDraft } from "immer/dist/internal";
import { Side } from "./repertoire";
import { RepertoireState } from "./repertoire_state";

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
  onSquarePress: (square: Square, skipAnimation?: boolean) => void;
  activeFromSquare?: Square;
  draggedOverSquare?: Square;
  visualizeMove: (
    move: Move,
    speed: PlaybackSpeed,
    callback: () => void
  ) => void;
  visualizeMoves: (
    moves: Move[],
    speed: PlaybackSpeed,
    callback: () => void
  ) => void;
  animatePieceMove: (
    move: Move,
    speed: PlaybackSpeed,
    callback: (completed: boolean) => void
  ) => void;
  flashRing: (success: boolean) => void;
  moveLogPgn?: string;
  showMoveLog?: boolean;
  availableMovesFrom: (square: Square) => Move[];
  hideCoordinates?: boolean;
  highContrast?: boolean;
  isColorTraining?: boolean;
  delegate?: ChessboardDelegate;
}

export interface ChessboardDelegate {
  attemptMove?: (
    move: Move,
    cb: (shouldMove: boolean, cb: () => void) => void
  ) => boolean;
}

export const createChessState = <T extends ChessboardState>(
  _set,
  get,
  initialize: (c: ChessboardState) => void
): ChessboardState => {
  let set = <Y,>(fn: (s: ChessboardState) => Y) =>
    _set((s: RepertoireState) => {
      return fn(s.chessboardState);
    });
  let initialState = {
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
    ...createQuick(set),
    onSquarePress: (square: Square, skipAnimation: boolean) => {
      set((s) => {
        console.log("square press?");
        let availableMove = s.availableMoves.find((m) => m.to == square);
        if (availableMove) {
          console.log("Had available move!", availableMove);
          s.availableMoves = [];
          s.activeFromSquare = null;
          s.draggedOverSquare = null;
          let makeMove = (cb) => {
            console.log("skip animation", skipAnimation);
            if (skipAnimation) {
              console.log("Yup moving");
              s.position.move(availableMove);
              cb(null);
            } else {
              s.animatePieceMove(
                availableMove,
                PlaybackSpeed.Normal,
                (completed, s) => {
                  cb(completed, s);
                }
              );
            }
          };
          if (
            (s.delegate.attemptMove &&
              s.delegate.attemptMove(availableMove, (shouldMove, cb) => {
                if (shouldMove) {
                  console.log("Should move, making move");
                  makeMove(cb);
                }
              })) ||
            !s.delegate.attemptMove
          ) {
          }
          return;
        }
        console.log("No available move");
        let availableMoves = s.availableMovesFrom(square);
        if (isEmpty(availableMoves)) {
          console.log("empty");
          s.availableMoves = [];
          s.activeFromSquare = null;
          s.draggedOverSquare = null;
        } else {
          console.log("not empty");
          s.activeFromSquare = square;
          s.draggedOverSquare = null;
          s.availableMoves = availableMoves;
        }
      });
    },
    availableMovesFrom: (square: Square) => {
      return set((s) => {
        console.log("state in available moves from", logProxy(s));
        let position = s.futurePosition ?? s.position;
        console.log(position.ascii());
        let moves = position?.moves({
          square,
          verbose: true,
        });
        console.log({ moves });
        if (
          !isEmpty(s.availableMoves) &&
          first(s.availableMoves).from == square
        ) {
          return [];
        } else if (!s.frozen) {
          return moves;
        }
      });
    },
    animatePieceMove: (
      move: Move,
      speed: PlaybackSpeed,
      callback: (completed: boolean) => void
    ) => {
      set((s: ChessboardState) => {
        s.availableMoves = [];
        s.activeFromSquare = null;
        s.draggedOverSquare = null;
        s.animatedMove = move;
        s.position.move(move);
        callback(false);
        let { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        // @ts-ignore
        let [start, end]: Square[] = [move.from, move.to];
        s.pieceMoveAnim.setValue(getSquareOffset(start, s.flipped));
        Animated.sequence([
          Animated.timing(s.pieceMoveAnim, {
            toValue: getSquareOffset(end, s.flipped),
            duration: moveDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]).start(() => {
          set((s) => {
            s.animatedMove = null;

            callback(true);
          });
        });
      });
    },
    flashRing: (success: boolean) => {
      set((state: ChessboardState) => {
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

    visualizeMove: (move: Move, speed: PlaybackSpeed, callback: () => void) => {
      set((s) => {
        let { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        s.indicatorColor =
          move.color == "b" ? c.hsl(180, 15, 10, 80) : c.hsl(180, 15, 100, 80);
        let backwards = false;
        // @ts-ignore
        let [start, end]: Square[] = backwards
          ? [move.to, move.from]
          : [move.from, move.to];
        s.moveIndicatorAnim.setValue(getSquareOffset(start, s.flipped));
        Animated.sequence([
          Animated.timing(s.moveIndicatorOpacityAnim, {
            toValue: 1.0,
            duration: fadeDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.delay(stayDuration),
          Animated.timing(s.moveIndicatorAnim, {
            toValue: getSquareOffset(end, s.flipped),
            duration: moveDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.delay(stayDuration),
          Animated.timing(s.moveIndicatorOpacityAnim, {
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
      callback: () => void
    ) => {
      set((s) => {
        if (s.isVisualizingMoves) {
          return;
        }
        s.isVisualizingMoves = true;
        let i = 0;
        let delay = getAnimationDurations(speed)[2];
        let animateNextMove = () => {
          let move = moves.shift();
          // TODO: something to deal with this state being old
          if (move && s.isVisualizingMoves) {
            s.visualizeMove(move, speed, () => {
              window.setTimeout(() => {
                s.animateNextMove();
              }, delay);
            });
            i++;
          } else {
            s.isVisualizingMoves = false;
            callback?.();
            // cb?.()
          }
        };
        animateNextMove();
      });
    },
  } as ChessboardState;
  initialize?.(initialState);
  // useEffect(() => {
  //   if (initialize) {
  //     set((s) => {
  //       initialize(s);
  //     });
  //   }
  // });
  return initialState;
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
