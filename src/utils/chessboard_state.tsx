import { PlaybackSpeed } from "app/types/VisualizationState";
import { Chess, Move, SQUARES } from "@lubert/chess.ts";
import { first, isEmpty, isEqual, isNil, last, mapValues } from "lodash-es";
import { getAnimationDurations } from "../components/chessboard/Chessboard";
import { Animated, Easing } from "react-native";
import { Square } from "@lubert/chess.ts/dist/types";
import { c } from "app/styles";
import { genEpd, getSquareOffset, START_EPD } from "./chess";
import { lineToPgn, Side } from "./repertoire";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick, QuickUpdate } from "./quick";
import { pgnToLine } from "app/utils/repertoire";
import { quick } from "./app_state";
import { logProxy } from "./state";
import { Plan } from "app/models";

export interface MoveArrow {
  move: Move;
}

interface PlayPgnOptions {
  animateLine: string[];
  animated?: boolean;
  fromEpd?: string;
}

export interface ChessboardState extends QuickUpdate<ChessboardState> {
  maxPlanOccurence?: number;
  _animatePosition: Chess;
  plans: Plan[];
  playPgn: (pgn: string, options?: PlayPgnOptions) => void;
  frozen?: boolean;
  positionHistory: string[];
  moveHistory: Move[];
  position?: Chess;
  previewPosition?: Chess;
  futurePosition?: Chess;
  indicatorColor?: string;
  squareHighlightAnims: Record<Square, Animated.Value>;
  currentHighlightedSquares: Set<string>;
  clearHighlightedSquares: () => void;
  highlightLastMove: () => void;
  getLastMove: () => Move;
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
  moveLog?: string[];
  moveLogPgn?: string;
  showMoveLog?: boolean;
  availableMovesFrom: (square: Square) => Move[];
  hideCoordinates?: boolean;
  highContrast?: boolean;
  isColorTraining?: boolean;
  delegate?: ChessboardDelegate;
  makeMove: (m: Move | string) => void;
  getCurrentEpd: () => string;
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
  animationQueue?: Move[];
  stepAnimationQueue: () => void;
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
    plans: [],
    notifyingDelegates: true,
    _animatePosition: null,
    moveLog: [],
    currentHighlightedSquares: new Set(),
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
    moveHistory: [],
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
    getLastMove: () => {
      return get((s) => {
        return last(s.moveHistory);
      });
    },
    moveIndicatorOpacityAnim: new Animated.Value(0),
    ...createQuick(set),
    updateMoveLogPgn: () => {
      set((s) => {
        s.moveLog = s.position.history();
        s.moveLogPgn = lineToPgn(s.position.history());
      });
    },
    backOne: () => {
      set((s) => {
        if (s.positionHistory.length > 1) {
          s.clearHighlightedSquares();
          // TODO: do this better
          s.positionHistory.pop();
          s.moveHistory.pop();
          s.previewPosition = null;
          s.highlightLastMove();
          s.position.undo();
          s.updateMoveLogPgn();
          s.getDelegate()?.onPositionUpdated?.();
        }
      });
    },
    resetPosition: () => {
      set((s) => {
        s._animatePosition = null;
        s.animationQueue = [];
        s.positionHistory = [START_EPD];
        s.moveHistory = [];
        s.position = new Chess();
        s.previewPosition = null;
        s.clearHighlightedSquares();
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
    highlightLastMove: () =>
      set((s) => {
        if (s.getLastMove()) {
          s.highlightMoveSquares(s.getLastMove());
        }
      }),
    highlightMoveSquares: (move: Move, duration?: number) =>
      set((s) => {
        let highlightSquares = getHighlightSquares(move);
        highlightSquares.forEach((sq) => {
          s.currentHighlightedSquares.add(sq);
        });
        // console.log("___HIGHLIGHTED SQUARES___");
        // console.log(
        //   "squares to highlight, new squares",
        //   logProxy(Array.from(s.currentHighlightedSquares)),
        //   highlightSquares
        // );
        highlightSquares.forEach((sq) => {
          Animated.timing(s.squareHighlightAnims[sq], {
            toValue: 0.4,
            duration: duration ?? 100,
            useNativeDriver: true,
          }).start(({ finished }) => {});
        });
      }),
    reversePreviewMove: () => {
      set((s: ChessboardState) => {
        s.previewPosition = null;
        s.isReversingPreviewMove = true;
        // @ts-ignore
        let [start, end]: { x: number; y: number }[] = [
          getSquareOffset(s.previewedMove.to, s.flipped),
          getSquareOffset(s.previewedMove.from, s.flipped),
        ];
        let duration = getAnimationTime(start, end);
        s.clearHighlightedSquares();
        s.previewPieceMoveAnim.setValue(start);
        Animated.sequence([
          Animated.timing(s.previewPieceMoveAnim, {
            toValue: end,
            duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]).start(({ finished }) => {
          set((s) => {
            s.previewedMove = null;
            s.isReversingPreviewMove = false;
            s.stepPreviewMove();
          });
        });
      });
    },
    stepAnimationQueue: () => {
      set((s: ChessboardState) => {
        console.log("step animation queue", logProxy(s.animationQueue));
        if (!isEmpty(s.currentHighlightedSquares)) {
          s.clearHighlightedSquares();
        }
        if (isEmpty(s.animationQueue)) {
          console.log("no more moves to animate");
          s._animatePosition = null;
          s.highlightLastMove();
        }
        if (isNil(s._animatePosition)) {
          return;
        }
        let nextMove = s.animationQueue.shift();
        console.log("animating next move", logProxy(nextMove));
        s.animatePieceMove(nextMove, PlaybackSpeed.Fast, (completed) => {
          if (completed) {
            set((s) => {
              s.stepAnimationQueue();
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
        if (!s.previewedMove && !s.nextPreviewMove) {
          s.highlightLastMove();
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
        s.previewPosition = s.position.clone();
        s.previewPosition.move(s.nextPreviewMove);
        // s.nextPreviewMove = null;
        s.previewedMove = s.nextPreviewMove;
        s.isAnimatingPreviewMove = true;
        s.previewedMove = move;
        s.clearHighlightedSquares();
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
        let supplementaryMove = getSupplementaryMove(move);
        Animated.sequence([
          Animated.timing(s.previewPieceMoveAnim, {
            toValue: end,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          ...(supplementaryMove
            ? [
                Animated.timing(s.previewPieceMoveAnim, {
                  toValue: end,
                  duration: duration,
                  useNativeDriver: true,
                  easing: Easing.inOut(Easing.ease),
                }),
              ]
            : []),
        ]).start(({ finished }) => {
          set((s) => {
            s.isAnimatingPreviewMove = false;
            s.stepPreviewMove();
          });
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
    arrows: [],
    playPgn: (pgn: string, options?: PlayPgnOptions) => {
      set((s) => {
        s.stopNotifyingDelegates();
        s.resetPosition();
        let line = pgnToLine(pgn);
        let animatePosition = null;
        line.map((san) => {
          console.log("san", san);
          s.makeMove(san);
        });
        if (options?.animated) {
          let fen = `${options.fromEpd} 0 1`;
          s._animatePosition = new Chess(fen);
          let moves = s._animatePosition.validateMoves(options.animateLine);
          s.animationQueue = moves;
          console.log("animation queue", logProxy(s.animationQueue));
          s.stepAnimationQueue();
        }
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
        let squares = Array.from(s.currentHighlightedSquares);
        if (squares) {
          squares.forEach((sq) => {
            s.currentHighlightedSquares.delete(sq);
            Animated.timing(s.squareHighlightAnims[sq], {
              toValue: 0.0,
              duration: 150,
              useNativeDriver: false,
            }).start(({ finished }) => {
              set((s) => {
                if (!finished && !s.currentHighlightedSquares.has(sq)) {
                  s.squareHighlightAnims[sq].setValue(0.0);
                }
              });
            });
          });
        }
      });
    },
    getCurrentEpd: () => {
      return get((s) => {
        return last(s.positionHistory);
      });
    },
    makeMove: (m: Move | string) => {
      set((s) => {
        if (s._animatePosition) {
          s._animatePosition.move(m);
          return;
        }
        s.availableMoves = [];
        s.previewPosition = null;
        s.activeFromSquare = null;
        s.clearHighlightedSquares();
        s.nextPreviewMove = null;
        s.previewedMove = null;
        let pos = s.futurePosition ?? s.position;
        let moveObject = pos.move(m);
        if (moveObject) {
          let epd = genEpd(pos);
          s.positionHistory.push(epd);
          s.moveHistory.push(moveObject);
          s.highlightLastMove();
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
  nextMove,
  side,
}: {
  line?: string;
  nextMove?: string;
  epd?: string;
  side?: Side;
}) => {
  return createChessState(null, null, (state: ChessboardState) => {
    state.position = new Chess();
    state.frozen = true;
    state.highContrast = false;
    if (side) {
      state.flipped = side == "black";
    }
    state.arrows = [];
    state.hideCoordinates = true;
    if (epd) {
      let fen = `${epd} 0 1`;
      state.position = new Chess(fen);
    } else if (line) {
      state.position.loadPgn(line);
    }
    if (nextMove) {
      let [move] = state.position.validateMoves([nextMove]);
      [move.from, move.to].map((sq) => {
        state.squareHighlightAnims[sq].setValue(0.6);
      });
      state.position.move(move);
    }
  });
};

export const getHighlightSquares = (move: Move) => {
  if (move.san === "O-O" || move.san === "O-O-O") {
    return [];
  } else {
    return [move.to, move.from];
  }
};

export const getSupplementaryMove = (move: Move): Move => {
  if (move.san === "O-O" || move.san === "O-O-O") {
    return {
      to: "f1",
      from: "h1",
      piece: "r",
      color: "w",
      flags: "",
      san: "",
    };
  } else {
    return null;
  }
};
