import { Chess, Move } from "@lubert/chess.ts";
import { Square } from "@lubert/chess.ts/dist/types";
import anime from "animejs";
import { first, isEmpty, isEqual, isNil, last } from "lodash-es";
import { Accessor } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { getAnimationDurations } from "~/components/chessboard/Chessboard";
import { PlaybackSpeed } from "~/types/VisualizationState";
import { getSquareOffset, START_EPD } from "./chess";
import { createChessProxy } from "./chess_proxy";
import { MetaPlan } from "./plans";
import { lineToPgn, pgnToLine, Side } from "./repertoire";
import { c } from "./styles";
import { Option } from "./optional";
import { ChessboardState } from "./chessboard_state";

interface PlayPgnOptions {
  animateLine: string[];
  animated?: boolean;
  fromEpd?: string;
}

type GetFn<T> = (s: ChessboardViewState) => T;

export interface ChessboardInterface {
  set: <T>(s: (s: ChessboardViewState) => T) => T | null;
  // can you update the types here so that it returns ChessboardViewState if there's no s passed in?
  get: <T>(s: GetFn<T>) => T;
  getDelegate(): ChessboardDelegate | null;
  resetPosition: () => void;
  setPosition: (_: Chess) => void;
  highlightSquares: (highlightSquares: Square[]) => void;
  makeMove: (_: Move | string) => void;
  clearPending: () => void;
  backOne: () => void;
  getTurn: () => Side;
  // visualizeMove: (
  //   move: Move,
  //   speed: PlaybackSpeed,
  //   callback: () => void
  // ) => void;
  // visualizeMoves: (
  //   moves: Move[],
  //   speed: PlaybackSpeed,
  //   callback: () => void
  // ) => void;
  animatePieceMove: (
    move: Move,
    speed: PlaybackSpeed,
    callback: (completed: boolean) => void
  ) => void;
  flashRing: (success: boolean) => void;
  previewMove: (m: Move | string | null) => void;
  reversePreviewMove: () => void;
  animatePreviewMove: () => void;
  stepPreviewMove: () => void;
  stepAnimationQueue: () => void;
  onSquarePress: (square: Square, skipAnimation: boolean) => void;
  availableMovesFrom: (square: Square) => Move[];
  getLastMove: () => Move | undefined;
  getCurrentEpd: () => string;
  playPgn: (pgn: string, options?: PlayPgnOptions) => void;
  stopNotifyingDelegates: () => void;
  updateMoveLogPgn: () => void;
  resumeNotifyingDelegates: () => void;
}

export interface ChessboardDelegate {
  madeManualMove?(): void;
  shouldMakeMove?: (move: Move) => boolean;
  madeMove?: (move: Move) => void;
  onPositionUpdated?: () => void;
  onMovePlayed?: () => void;
  onBack?: () => void;
  onReset?: () => void;
  completedMoveAnimation?: (move: Move) => void;
}

export interface ChessboardViewState {
  flipped: boolean;
  frozen: boolean;
  delegate: any;
  notifyingDelegates: any;
  ringColor: string;
  ringRef: HTMLDivElement | null;
  _animatePosition?: Chess;
  currentHighlightedSquares: Set<Square>;
  pieceRefs: Partial<Record<Square, HTMLDivElement>>;
  squareHighlightRefs: Partial<Record<Square, HTMLDivElement>>;
  moveIndicatorRef: Accessor<HTMLDivElement> | null;
  position: Chess;
  previewPosition?: Chess;
  animatedMove?: Move;
  animationQueue?: Option<Move[]>;
  isReversingPreviewMove?: boolean;
  isAnimatingPreviewMove?: boolean;
  previewedMove?: Move;
  nextPreviewMove?: Move;
  drag: {
    square: Square | null;
    x: number;
    y: number;
    transform: {
      x: number;
      y: number;
    };
  };
  availableMoves: Move[];
  activeFromSquare?: Square;
  draggedOverSquare?: Square;
  // plans stuff
  focusedPlans?: string[];
  maxPlanOccurence?: number;
  plans: MetaPlan[];
  showPlans?: boolean;

  // history stuff
  moveLog: string[];
  moveLogPgn: string;
  moveHistory: Move[];
  positionHistory: string[];
}

export const createChessboardInterface = (): [
  ChessboardViewState,
  ChessboardInterface,
  (s: (s: ChessboardViewState) => void) => void
] => {
  const [chessboardStore, setChessboardStore] =
    createStore<ChessboardViewState>({
      flipped: false,
      frozen: false,
      delegate: null,
      plans: [],
      notifyingDelegates: true,
      pieceRefs: {},
      moveLog: [],
      moveLogPgn: "",
      position: createChessProxy(new Chess()),
      positionHistory: [START_EPD],
      moveHistory: [],
      currentHighlightedSquares: new Set(),
      squareHighlightRefs: {},
      ringRef: null,
      ringColor: "red",
      moveIndicatorRef: null,
      availableMoves: [],
      drag: {
        square: null,
        x: 0,
        y: 0,
        transform: { x: 0, y: 0 },
      },
    });
  let pendingState: ChessboardViewState | null = null;
  const set = <T,>(s: (s: ChessboardViewState) => T) => {
    if (pendingState) {
      return s(pendingState);
    } else {
      let res = null;
      setChessboardStore(
        produce((state: ChessboardViewState) => {
          pendingState = state;
          try {
            res = s(state as ChessboardViewState);
          } finally {
            pendingState = null;
          }
        })
      );
      return res;
    }
  };

  const chessboardInterface: ChessboardInterface = {
    set,
    get: <T,>(s?: (s: ChessboardViewState) => T) => {
      return s ? s(chessboardStore) : chessboardStore;
    },
    getTurn: () => {
      return chessboardStore.position.turn();
    },
    updateMoveLogPgn: () => {
      set((s) => {
        s.moveLog = s.position.history();
        s.moveLogPgn = lineToPgn(s.position.history());
      });
    },
    getCurrentEpd: () => {
      return last(chessboardStore.positionHistory);
    },
    resumeNotifyingDelegates: () => {
      set((s) => {
        s.notifyingDelegates = true;
      });
    },
    stopNotifyingDelegates: () => {
      set((s) => {
        s.notifyingDelegates = false;
      });
    },
    makeMove: (m: Move | string) => {
      set((s) => {
        if (s._animatePosition) {
          s._animatePosition.move(m);
          return;
        }
        s.position.move(m);
        chessboardInterface.clearPending();
      });
    },
    reversePreviewMove: () => {
      set((s: ChessboardViewState) => {
        if (!s.previewedMove) {
          return;
        }
        s.previewPosition = undefined;
        s.isReversingPreviewMove = true;
        // chessboardInterface.clearHighlightedSquares();
        const [start, end]: { x: number; y: number }[] = [
          getSquareOffset(s.previewedMove.to, s.flipped),
          getSquareOffset(s.previewedMove.from, s.flipped),
        ];
        const duration = getAnimationTime(start, end);
        const pieceRef = s.pieceRefs[s.previewedMove.from as Square];
        const top = `${end.y * 100}%`;
        const left = `${end.x * 100}%`;
        const timeline = anime.timeline({
          easing: "easeInOutSine",
          duration: duration,
        });
        timeline.add({
          targets: pieceRef,
          top,
          left,
        });
        const supplementaryMove = getSupplementaryMove(s.previewedMove);
        if (supplementaryMove) {
          const end = getSquareOffset(supplementaryMove.to, s.flipped);
          const top = `${end.y * 100}%`;
          const left = `${end.x * 100}%`;
          const pieceRef = s.pieceRefs[supplementaryMove.from as Square];
          timeline.add({
            targets: pieceRef,
            easing: "easeInOutSine",
            duration: duration,
            top,
            left,
          });
        }
        timeline.play();
        timeline.finished.then(() => {
          set((s) => {
            s.previewedMove = undefined;
            s.isReversingPreviewMove = false;
            chessboardInterface.stepPreviewMove();
          });
        });
        // s.previewPieceMoveAnim.setValue(start);
        // Animated.sequence([
        //   Animated.timing(s.previewPieceMoveAnim, {
        //     toValue: end,
        //     duration,
        //     useNativeDriver: true,
        //     easing: Easing.out(Easing.ease),
        //   }),
        // ]).start(({ finished }) => {
        //   set((s) => {
        //     s.previewedMove = null;
        //     s.isReversingPreviewMove = false;
        //     s.stepPreviewMove();
        //   });
        // });
      });
    },
    stepAnimationQueue: () => {
      set((s: ChessboardViewState) => {
        if (isEmpty(s.animationQueue)) {
          s._animatePosition = undefined;
        }
        if (isNil(s._animatePosition)) {
          return;
        }
        let nextMove = s.animationQueue?.shift() as Move;
        chessboardInterface.animatePieceMove(
          nextMove,
          PlaybackSpeed.Fast,
          (completed) => {
            if (completed) {
              chessboardInterface.stepAnimationQueue();
            }
          }
        );
      });
    },
    stepPreviewMove: () => {
      set((s: ChessboardViewState) => {
        console.log("steppreviewmove");
        if (
          s.isReversingPreviewMove ||
          s.isAnimatingPreviewMove ||
          s._animatePosition
        ) {
          console.log("steppreviewmove2");
          return;
        }
        if (
          s.previewedMove &&
          s.nextPreviewMove &&
          !isEqual(s.previewedMove, s.nextPreviewMove)
        ) {
          console.log("steppreviewmove4");
          chessboardInterface.reversePreviewMove();
        }
        if (s.previewedMove && !s.nextPreviewMove) {
          console.log("steppreviewmove5");
          chessboardInterface.reversePreviewMove();
        }
        if (!s.previewedMove && s.nextPreviewMove) {
          console.log("steppreviewmove6");
          chessboardInterface.animatePreviewMove();
        }
      });
    },
    animatePreviewMove: () => {
      set((s: ChessboardViewState) => {
        if (!s.nextPreviewMove) {
          return;
        }
        const move = s.nextPreviewMove;
        s.previewPosition = s.position.clone();
        s.previewPosition.move(s.nextPreviewMove);
        // s.nextPreviewMove = null;
        s.previewedMove = s.nextPreviewMove;
        s.isAnimatingPreviewMove = true;
        s.previewedMove = move;
        // chessboardInterface.clearHighlightedSquares();
        s.availableMoves = [];
        s.activeFromSquare = undefined;
        s.draggedOverSquare = undefined;
        // s.makeMove(move);
        const [start, end]: { x: number; y: number }[] = [
          getSquareOffset(move.from, s.flipped),
          getSquareOffset(move.to, s.flipped),
        ];
        const duration = getAnimationTime(start, end);
        const pieceRef = s.pieceRefs[move.from as Square];
        const top = `${end.y * 100}%`;
        const left = `${end.x * 100}%`;
        let timeline = anime.timeline({
          easing: "easeInOutSine",
          duration: duration,
        });
        timeline = timeline.add({
          targets: pieceRef,
          top,
          left,
        });
        const supplementaryMove = getSupplementaryMove(move);
        if (supplementaryMove) {
          const end = getSquareOffset(supplementaryMove.to, s.flipped);
          const top = `${end.y * 100}%`;
          const left = `${end.x * 100}%`;
          timeline.add(
            {
              targets: pieceRef,
              easing: "easeInOutSine",
              duration: duration,
              top,
              left,
            },
            0
          );
        }
        timeline.play();
        timeline.finished.then(() => {
          set((s) => {
            s.isAnimatingPreviewMove = false;
            chessboardInterface.stepPreviewMove();
          });
        });
      });
    },
    clearPending: () => {
      set((s: ChessboardViewState) => {
        s.availableMoves = [];
        s.drag = {
          square: null,

          x: 0,
          y: 0,
          transform: { x: 0, y: 0 },
        };
        s.previewPosition = undefined;
        s.nextPreviewMove = undefined;
        s.previewedMove = undefined;
        s._animatePosition = undefined;
      });
    },
    animatePieceMove: (
      move: Move,
      speed: PlaybackSpeed,
      callback: (completed: boolean) => void
    ) => {
      set((s: ChessboardViewState) => {
        chessboardInterface.clearPending();
        let { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        // @ts-ignore
        let [start, end]: Square[] = [move.from, move.to];
        let { x, y } = getSquareOffset(end, s.flipped);
        console.log("animateing piece move", start, end, x, y);
        anime({
          targets: s.pieceRefs[start as Square],
          top: `${y * 100}%`,
          left: `${x * 100}%`,
          duration: moveDuration,
          easing: "easeInOutSine",
          autoplay: true,
        }).finished.then(() => {
          chessboardInterface.makeMove(move);
          s.animatedMove = undefined;
          callback(true);
        });
      });
    },
    getDelegate: () => {
      if (chessboardStore.notifyingDelegates) {
        return chessboardStore.delegate;
      } else {
        return null;
      }
    },
    onSquarePress: (square: Square, skipAnimation: boolean) => {
      set((s) => {
        const availableMove = s.availableMoves.find((m) => m.to == square);
        if (availableMove) {
          s.availableMoves = [];
          s.activeFromSquare = undefined;
          s.draggedOverSquare = undefined;
          let makeMove = () => {
            chessboardInterface.makeMove(availableMove);
          };
          if (
            chessboardInterface.getDelegate()?.shouldMakeMove?.(availableMove)
          ) {
            chessboardInterface.getDelegate()?.madeManualMove?.();
            makeMove();
          }
        }
      });
    },
    availableMovesFrom: (square: Square) => {
      return set((s) => {
        const position = s.position;
        const moves = position?.moves({
          square,
          verbose: true,
        });
        if (
          !isEmpty(s.availableMoves) &&
          first(s.availableMoves)?.from == square
        ) {
          return [];
        } else if (!s.frozen) {
          return moves ?? [];
        }
      });
    },
    highlightSquares: (squares: Square[]) => {
      set((s) => {
        const refs = squares.map((sq) => s.squareHighlightRefs[sq as Square]);
        squares.forEach((sq) => {
          s.currentHighlightedSquares.add(sq);
        });
        // anime({
        //   targets: refs,
        //   easing: "easeInOutSine",
        //   duration: 150,
        //   top: top,
        //   opacity: 1.0,
        // });
      });
    },
    highlightMoveSquares: (move: Move) =>
      set((s) => {
        let highlightSquares = getHighlightSquares(move);
        chessboardInterface.highlightSquares(highlightSquares);
      }),
    backOne: () => {
      set((s) => {
        s.position.undo();
        console.log("position", s.position.ascii());
      });
    },
    setPosition: (chess: Chess) => {
      set((s) => {
        console.log("set position!");
        s.position = createChessProxy(chess.clone());
      });
    },
    resetPosition: () => {
      set((s) => {
        console.log("resetting position");
        s.position = createChessProxy(new Chess());
        chessboardInterface.clearPending();
      });
    },
    // visualizeMove: (move: Move, speed: PlaybackSpeed, callback: () => void) => {
    //   set((s) => {
    //     const { fadeDuration, moveDuration, stayDuration } =
    //       getAnimationDurations(speed);
    //     s.indicatorColor =
    //       move.color == "b" ? c.hsl(180, 15, 10, 80) : c.hsl(180, 15, 100, 80);
    //     const backwards = false;
    //     // @ts-ignore
    //     const [start, end]: Square[] = backwards
    //       ? [move.to, move.from]
    //       : [move.from, move.to];
    //     s.moveIndicatorAnim.setValue(getSquareOffset(start, s.flipped));
    //     Animated.sequence([
    //       Animated.timing(s.moveIndicatorOpacityAnim, {
    //         toValue: 1.0,
    //         duration: fadeDuration,
    //         useNativeDriver: true,
    //         easing: Easing.inOut(Easing.ease),
    //       }),
    //       Animated.delay(stayDuration),
    //       Animated.timing(s.moveIndicatorAnim, {
    //         toValue: getSquareOffset(end, s.flipped),
    //         duration: moveDuration,
    //         useNativeDriver: true,
    //         easing: Easing.inOut(Easing.ease),
    //       }),
    //       Animated.delay(stayDuration),
    //       Animated.timing(s.moveIndicatorOpacityAnim, {
    //         toValue: 0,
    //         duration: fadeDuration,
    //         useNativeDriver: true,
    //         easing: Easing.inOut(Easing.ease),
    //       }),
    //     ]).start(callback);
    //   });
    // },
    // visualizeMoves: (
    //   moves: Move[],
    //   speed: PlaybackSpeed,
    //   callback: () => void
    // ) => {
    //   set((s) => {
    //     if (s.isVisualizingMoves) {
    //       return;
    //     }
    //     s.isVisualizingMoves = true;
    //     let i = 0;
    //     const delay = getAnimationDurations(speed)[2];
    //     const animateNextMove = () => {
    //       set((s) => {
    //         const move = moves.shift();
    //
    //         if (move && s.isVisualizingMoves) {
    //           s.visualizeMove(move, speed, () => {
    //             window.setTimeout(() => {
    //               animateNextMove();
    //             }, delay);
    //           });
    //           i++;
    //         } else {
    //           s.isVisualizingMoves = false;
    //           callback?.();
    //           // cb?.()
    //         }
    //       });
    //     };
    //     animateNextMove();
    //   });
    // },
    previewMove: (m: string | null | Move) => {
      set((s) => {
        if (m) {
          const [moveObject] = s.position.validateMoves([m]) ?? [];
          s.nextPreviewMove = moveObject;
          chessboardInterface.stepPreviewMove();
        } else {
          s.nextPreviewMove = undefined;
          chessboardInterface.stepPreviewMove();
        }
      });
    },
    flashRing: (success: boolean) => {
      set((state) => {
        const ringColor = success
          ? c.colors.successColor
          : c.colors.failureLight;
        state.ringColor = ringColor;
        // state.ringRef.style.backgroundColor = ringColor;
        anime({
          targets: state.ringRef,
          easing: "easeInOutSine",
          duration: 300,
          direction: "alternate",
          opacity: [0, 1.0],
          autoplay: true,
        });
        // const animDuration = 200;
        // Animated.sequence([
        //   Animated.timing(state.ringIndicatorAnim, {
        //     toValue: 1,
        //     duration: animDuration,
        //     useNativeDriver: false,
        //   }),
        //
        //   Animated.timing(state.ringIndicatorAnim, {
        //     toValue: 0,
        //     duration: animDuration,
        //     useNativeDriver: false,
        //   }),
        // ]).start((finished) => {
        //   // TODO: better way to do this
        //   set((s) => {
        //     s.ringIndicatorAnim.setValue(0);
        //   });
        // });
      });
    },
    getLastMove: () => {
      return last(chessboardStore.moveHistory);
    },
    playPgn: (pgn: string, options?: PlayPgnOptions) => {
      set((s) => {
        chessboardInterface.stopNotifyingDelegates();
        chessboardInterface.resetPosition();
        const line = pgnToLine(pgn);
        line.map((san) => {
          chessboardInterface.makeMove(san);
        });
        if (options?.animated) {
          const fen = `${options.fromEpd} 0 1`;
          s._animatePosition = createChessProxy(new Chess(fen));
          let moves = s._animatePosition.validateMoves(line);
          s.animationQueue = moves;
          chessboardInterface.stepAnimationQueue();
        } else {
          chessboardInterface.setPosition(s.position);
          console.log("set position of chessboard view", s.position.ascii());
        }
        chessboardInterface.resumeNotifyingDelegates();
        chessboardInterface.getDelegate()?.onPositionUpdated?.();
        chessboardInterface.getDelegate()?.onMovePlayed?.();
        // const line = pgnToLine(pgn);
      });
    },
  } as ChessboardInterface;
  return [chessboardStore, chessboardInterface, set];
};

const getAnimationTime = (
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  let distance =
    Math.sqrt(
      Math.pow(Math.abs(end.x - start.x), 2) +
        Math.pow(Math.abs(end.y - start.y), 2)
    ) * 8;
  return getAnimationTimeForDistance(distance);
};

export const getAnimationTimeForDistance = (distance: number) => {
  return Math.log(distance + 6) * 80;
};

export const getHighlightSquares = (move: Move): Square[] => {
  if (move.san === "O-O" || move.san === "O-O-O") {
    return [];
  } else {
    return [move.to as Square, move.from as Square];
  }
};

export const getSupplementaryMove = (move: Move): Move | null => {
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

export interface MoveArrow {
  move: Move;
}
