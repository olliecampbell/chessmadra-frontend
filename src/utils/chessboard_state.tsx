import { PlaybackSpeed } from "app/types/VisualizationState";
import { Chess, Move, SQUARES } from "@lubert/chess.ts";
import { first, isEmpty, mapValues } from "lodash-es";
import { getAnimationDurations } from "../components/chessboard/Chessboard";
import { Animated, Easing } from "react-native";
import { Square } from "@lubert/chess.ts/dist/types";
import { logProxy } from "./state";
import { c } from "app/styles";
import { genEpd, getSquareOffset, START_EPD } from "./chess";
import { Side } from "./repertoire";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick, QuickUpdate } from "./quick";

export interface ChessboardState extends QuickUpdate<ChessboardState> {
  frozen?: boolean;
  positionHistory: string[];
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
  makeMove: (m: Move | string) => void;
  backOne: () => void;
  resetPosition: () => void;
}

export interface ChessboardDelegate {
  shouldMakeMove?: (move: Move) => boolean;
  madeMove?: (move: Move) => void;
  onPositionUpdated?: () => void;
  completedMoveAnimation?: (move: Move) => void;
}

export const createChessState = (
  set: StateSetter<ChessboardState, any>,
  get: StateGetter<ChessboardState, any>,
  initialize?: (c: ChessboardState) => void
): ChessboardState => {
  let initialState = {
    isColorTraining: false,
    availableMoves: [],
    ringColor: null,
    positionHistory: [START_EPD],
    isVisualizingMoves: false,
    ringIndicatorAnim: new Animated.Value(0),
    squareHighlightAnims: mapValues(SQUARES, (number, square) => {
      return new Animated.Value(0.0);
    }),
    flipped: false,
    position: new Chess(),
    moveIndicatorAnim: new Animated.ValueXY({ x: 0, y: 0 }),
    pieceMoveAnim: new Animated.ValueXY({ x: 0, y: 0 }),
    moveLogPgn: "",
    moveIndicatorOpacityAnim: new Animated.Value(0),
    ...createQuick(set),
    backOne: () => {
      set((s) => {
        if (s.positionHistory.length > 1) {
          s.positionHistory.pop();
          s.position.undo();
          s.delegate?.onPositionUpdated?.();
        }
      });
    },
    resetPosition: () => {
      set((s) => {
        s.positionHistory = [START_EPD];
        s.position = new Chess();
        s.delegate?.onPositionUpdated?.();
      });
    },
    onSquarePress: (square: Square, skipAnimation: boolean) => {
      set((s) => {
        console.log("square press?");
        let availableMove = s.availableMoves.find((m) => m.to == square);
        if (availableMove) {
          console.log("Had available move!", availableMove);
          s.availableMoves = [];
          s.activeFromSquare = null;
          s.draggedOverSquare = null;
          let makeMove = () => {
            console.log("skip animation", skipAnimation);
            if (skipAnimation) {
              console.log("Yup moving");
              s.makeMove(availableMove);
            } else {
              s.animatePieceMove(
                availableMove,
                PlaybackSpeed.Normal,
                (completed) => {
                  set((s) => {
                    s.delegate.completedMoveAnimation(availableMove);
                  });
                }
              );
            }
          };
          if (s.delegate.shouldMakeMove(availableMove)) {
            makeMove();
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
        s.makeMove(move);
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
    makeMove: (m: Move | string) => {
      set((s) => {
        s.availableMoves = [];
        let moveObject = s.position.move(m);
        if (moveObject) {
          console.log("Made move?");
          let epd = genEpd(s.position);
          s.positionHistory.push(epd);
          s.delegate.madeMove?.(moveObject);
          s.delegate?.onPositionUpdated?.();
        }
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
            useNativeDriver: false,
          }),

          Animated.timing(state.ringIndicatorAnim, {
            toValue: 0,
            duration: animDuration,
            useNativeDriver: false,
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
          set((s) => {
            let move = moves.shift();

            if (move && s.isVisualizingMoves) {
              s.visualizeMove(move, speed, () => {
                window.setTimeout(() => {
                  animateNextMove();
                }, delay);
              });
              i++;
            } else {
              s.isVisualizingMoves = false;
              callback?.();
              // cb?.()
            }
          });
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
