import { PlaybackSpeed } from "app/types/VisualizationState";
import { Chess, Move, SQUARES } from "@lubert/chess.ts";
import { first, isEmpty, isEqual, mapValues } from "lodash-es";
import { getAnimationDurations } from "../components/chessboard/Chessboard";
import { Animated, Easing } from "react-native";
import { Square } from "@lubert/chess.ts/dist/types";
import { logProxy } from "./state";
import { c } from "app/styles";
import { genEpd, getSquareOffset, START_EPD } from "./chess";
import { lineToPgn, Side } from "./repertoire";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick, QuickUpdate } from "./quick";
import { pgnToLine } from "app/utils/repertoire";

export interface ChessboardState extends QuickUpdate<ChessboardState> {
  playPgn: (pgn: string) => void;
  frozen?: boolean;
  positionHistory: string[];
  position?: Chess;
  futurePosition?: Chess;
  indicatorColor?: string;
  squareHighlightAnims: Record<Square, Animated.Value>;
  currentHighlightedSquares: string[];
  clearHighlightedSquares: () => void;
  highlightMoveSquares: (
    move: Move,
    duration?: number,
    unhighlight?: boolean
  ) => void;
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
  stopNotifyingDelegates: () => void;
  getDelegate: () => ChessboardDelegate;
  updateMoveLogPgn: () => void;
  resumeNotifyingDelegates: () => void;
  notifyingDelegates: boolean;
  previewMove: (m: Move | string) => void;
  previewPieceMoveAnim: Animated.ValueXY;
  previewedMove?: Move;
  nextPreviewMove?: Move;
  reversePreviewMove?: () => void;
  animatePreviewMove?: () => void;
  isReversingPreviewMove?: boolean;
  isAnimatingPreviewMove?: boolean;
  stepPreviewMove: () => void;
}

export interface ChessboardDelegate {
  shouldMakeMove?: (move: Move) => boolean;
  madeMove?: (move: Move) => void;
  onPositionUpdated?: () => void;
  completedMoveAnimation?: (move: Move) => void;
}

const getAnimationTime = (
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  let distance =
    Math.sqrt(
      Math.pow(Math.abs(end.x - start.x), 2) +
        Math.pow(Math.abs(end.y - start.y), 2)
    ) * 8;
  // console.log({ distance });
  // console.log("1");
  // console.log(getAnimationTimeForDistance(1));
  // console.log("2");
  // console.log(getAnimationTimeForDistance(2));
  // console.log("4");
  // console.log(getAnimationTimeForDistance(4));
  // console.log("8");
  // console.log(getAnimationTimeForDistance(8));
  return getAnimationTimeForDistance(distance);
};

export const getAnimationTimeForDistance = (distance: number) => {
  return Math.log(distance + 6) * 80;
};

export const createChessState = (
  set: StateSetter<ChessboardState, any>,
  get: StateGetter<ChessboardState, any>,
  initialize?: (c: ChessboardState) => void
): ChessboardState => {
  let initialState = {
    isColorTraining: false,
    notifyingDelegates: true,
    currentHighlightedSquares: [],
    getDelegate: () => {
      return get((s) => {
        if (s.notifyingDelegates) {
          return s.delegate;
        } else {
          return null;
        }
      });
    },
    stopNotifyingDelegates: () => {
      set((s) => {
        s.notifyingDelegates = false;
      });
    },
    resumeNotifyingDelegates: () => {
      set((s) => {
        s.notifyingDelegates = true;
      });
    },
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
    previewPieceMoveAnim: new Animated.ValueXY({ x: 0, y: 0 }),
    moveLogPgn: "",
    moveIndicatorOpacityAnim: new Animated.Value(0),
    ...createQuick(set),
    updateMoveLogPgn: () => {
      set((s) => {
        s.moveLogPgn = lineToPgn(s.position.history());
      });
    },
    backOne: () => {
      set((s) => {
        if (s.positionHistory.length > 1) {
          s.positionHistory.pop();
          s.position.undo();
          s.updateMoveLogPgn();
          s.getDelegate()?.onPositionUpdated?.();
        }
      });
    },
    resetPosition: () => {
      set((s) => {
        s.positionHistory = [START_EPD];
        s.position = new Chess();
        s.updateMoveLogPgn();
        s.getDelegate()?.onPositionUpdated?.();
      });
    },
    onSquarePress: (square: Square, skipAnimation: boolean) => {
      set((s) => {
        let availableMove = s.availableMoves.find((m) => m.to == square);
        if (availableMove) {
          s.availableMoves = [];
          s.activeFromSquare = null;
          s.draggedOverSquare = null;
          let makeMove = () => {
            if (skipAnimation) {
              s.makeMove(availableMove);
            } else {
              s.animatePieceMove(
                availableMove,
                PlaybackSpeed.Normal,
                (completed) => {
                  set((s) => {
                    s.getDelegate().completedMoveAnimation(availableMove);
                  });
                }
              );
            }
          };
          if (s.getDelegate().shouldMakeMove(availableMove)) {
            makeMove();
          }
          return;
        }
        let availableMoves = s.availableMovesFrom(square);
        if (isEmpty(availableMoves)) {
          s.availableMoves = [];
          s.activeFromSquare = null;
          s.draggedOverSquare = null;
        } else {
          s.activeFromSquare = square;
          s.draggedOverSquare = null;
          s.availableMoves = availableMoves;
        }
      });
    },
    availableMovesFrom: (square: Square) => {
      return set((s) => {
        let position = s.futurePosition ?? s.position;
        let moves = position?.moves({
          square,
          verbose: true,
        });
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
    highlightMoveSquares: (
      move: Move,
      duration?: number,
      unhighlight?: boolean
    ) =>
      set((s) => {
        s.currentHighlightedSquares = [move.to, move.from];
        [move.to, move.from].forEach((sq) => {
          Animated.timing(s.squareHighlightAnims[sq], {
            toValue: unhighlight ? 0.0 : 0.4,
            duration: duration ?? 100,
            useNativeDriver: true,
          }).start();
        });
      }),
    reversePreviewMove: () => {
      set((s: ChessboardState) => {
        s.isReversingPreviewMove = true;
        // @ts-ignore
        let [start, end]: { x: number; y: number }[] = [
          getSquareOffset(s.previewedMove.to, s.flipped),
          getSquareOffset(s.previewedMove.from, s.flipped),
        ];
        let duration = getAnimationTime(start, end);
        s.highlightMoveSquares(s.previewedMove, duration, true);
        s.previewPieceMoveAnim.setValue(start);
        Animated.sequence([
          Animated.timing(s.previewPieceMoveAnim, {
            toValue: end,
            duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]).start(({ finished }) => {
          if (finished) {
            set((s) => {
              s.previewedMove = null;
              s.isReversingPreviewMove = false;
              s.stepPreviewMove();
            });
          }
        });
      });
    },
    stepPreviewMove: () => {
      set((s: ChessboardState) => {
        if (s.isReversingPreviewMove || s.isAnimatingPreviewMove) {
          return;
        }
        if (
          s.previewedMove &&
          s.nextPreviewMove &&
          !isEqual(s.previewedMove, s.nextPreviewMove)
        ) {
          s.reversePreviewMove();
        }
        if (s.previewedMove && !s.nextPreviewMove) {
          s.reversePreviewMove();
        }
        if (!s.previewedMove && s.nextPreviewMove) {
          s.animatePreviewMove();
        }
      });
    },
    animatePreviewMove: () => {
      set((s: ChessboardState) => {
        let move = s.nextPreviewMove;
        // s.nextPreviewMove = null;
        s.previewedMove = s.nextPreviewMove;
        s.isAnimatingPreviewMove = true;
        s.previewedMove = move;
        s.availableMoves = [];
        s.activeFromSquare = null;
        s.draggedOverSquare = null;
        // s.makeMove(move);
        let [start, end]: { x: number; y: number }[] = [
          getSquareOffset(move.from, s.flipped),
          getSquareOffset(move.to, s.flipped),
        ];
        let duration = getAnimationTime(start, end);
        s.highlightMoveSquares(move, duration);
        s.previewPieceMoveAnim.setValue(start);
        Animated.sequence([
          Animated.timing(s.previewPieceMoveAnim, {
            toValue: end,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]).start(({ finished }) => {
          if (finished) {
            set((s) => {
              s.isAnimatingPreviewMove = false;
              s.stepPreviewMove();
            });
          }
        });
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
    playPgn: (pgn: string) => {
      set((s) => {
        s.stopNotifyingDelegates();
        s.availableMoves = [];
        s.resetPosition();
        pgnToLine(pgn).map((san) => {
          s.makeMove(san);
        });
        s.resumeNotifyingDelegates();
        s.getDelegate()?.onPositionUpdated?.();
      });
    },
    previewMove: (m: string) => {
      set((s) => {
        if (m) {
          let [moveObject] = s.position.validateMoves([m]) ?? [];
          s.nextPreviewMove = moveObject;
          s.stepPreviewMove();
        } else {
          s.nextPreviewMove = null;
          s.stepPreviewMove();
        }
      });
    },
    clearHighlightedSquares: () => {
      set((s) => {
        if (s.currentHighlightedSquares) {
          s.currentHighlightedSquares.forEach((sq) => {
            Animated.timing(s.squareHighlightAnims[sq], {
              toValue: 0.0,
              duration: 150,
              useNativeDriver: true,
            }).start();
          });
        }
      });
    },
    makeMove: (m: Move | string) => {
      set((s) => {
        s.availableMoves = [];
        s.activeFromSquare = null;
        s.clearHighlightedSquares();
        let pos = s.futurePosition ?? s.position;
        let moveObject = pos.move(m);
        if (moveObject) {
          let epd = genEpd(pos);
          s.positionHistory.push(epd);
          s.updateMoveLogPgn();
          s.getDelegate()?.madeMove?.(moveObject);
          s.getDelegate()?.onPositionUpdated?.();
        } else {
          console.log("This move wasn't valid!", m);
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
