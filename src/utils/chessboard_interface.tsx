import { Chess, Move } from "@lubert/chess.ts";
import { PieceSymbol, Square } from "@lubert/chess.ts/dist/types";
import anime from "animejs";
import {
  cloneDeep,
  first,
  isEmpty,
  isEqual,
  isNil,
  last,
  times,
} from "lodash-es";
import { createStore, produce } from "solid-js/store";
import { getAnimationDurations } from "~/components/chessboard/Chessboard";
import { PlaybackSpeed } from "~/types/VisualizationState";
import { genEpd, getSquareOffset, START_EPD } from "./chess";
import { createChessProxy } from "./chess_proxy";
import { MetaPlan } from "./plans";
import { lineToPgn, pgnToLine, Side } from "./repertoire";
import { c } from "./styles";
import { Option } from "./optional";

interface PlayPgnOptions {
  animateLine?: string[];
  animated?: boolean;
  fromEpd?: string;
}
type AnimationMove = Move & { reverse: boolean };

type GetFn<T> = (s: ChessboardViewState) => T;
type MakeMoveOptions = {
  animate?: boolean;
};

type MoveFeedbackType = "correct" | "incorrect";
type ChessboardMode = "tap" | "normal";

export interface ChessboardInterface {
  set: <T>(s: (s: ChessboardViewState) => T) => T | null;
  // can you update the types here so that it returns ChessboardViewState if there's no s passed in?
  get: <T>(s: GetFn<T>) => T;
  getDelegate(): ChessboardDelegate | null;
  resetPosition: () => void;
  setPosition: (_: Chess) => void;
  makeMove: (_: Move | string, options?: MakeMoveOptions) => void;
  clearPending: () => void;
  backAll: () => void;
  backOne: (opts?: { clear?: boolean; skipAnimation?: boolean }) => void;
  backN: (n: number) => void;
  forwardN: (n: number) => void;
  forwardOne: () => void;
  forwardAll: () => void;
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
  // @deprecated
  flashRing: (success: boolean) => void;
  previewMove: (m: Move | string | null) => void;
  reversePreviewMove: () => void;
  animatePreviewMove: () => void;
  stepPreviewMove: () => void;
  stepAnimationQueue: () => void;
  requestToMakeMove: (move: Move, options?: MakeMoveOptions) => void;
  highlightSquare: (square: Square) => void;
  setTapOptions: (squares: Square[]) => void;
  availableMovesFrom: (square: Square) => Move[];
  getLastMove: () => Move | undefined;
  getCurrentEpd: () => string;
  playPgn: (pgn: string, options?: PlayPgnOptions) => void;
  stopNotifyingDelegates: () => void;
  updateMoveLogPgn: () => void;
  resumeNotifyingDelegates: () => void;

  setMode: (_: ChessboardMode) => void;
  setFrozen: (_: boolean) => void;
  setPerspective: (_: Side) => void;
  showMoveFeedback(
    arg0: { square: Square; type: MoveFeedbackType },
    callback: () => void
  ): unknown;

  // Other trainer tool stuff
  visualizeMoves: (
    _: Move[],
    speed: PlaybackSpeed,
    callback: (() => void) | undefined
  ) => void;
}

export interface ChessboardDelegate {
  tappedSquare?: (square: Square) => void;
  madeManualMove?(): void;
  shouldMakeMove?: (move: Move) => boolean;
  madeMove?: (move: Move) => void;
  onPositionUpdated?: () => void;
  onMovePlayed?: () => void;
  onBack?: () => void;
  onReset?: () => void;
  completedMoveAnimation?: (move: Move) => void;
  askForPromotionPiece?: (requestedMove: Move) => PieceSymbol | null;
}

export interface ChessboardViewState {
  highlightedSquares: Set<Square>;
  tapOptions: Set<Square>;
  animating: boolean;
  animatingMoveSquare?: Square;
  moveFeedback: {
    type: MoveFeedbackType;
  };
  flipped: boolean;
  frozen: boolean;
  delegate: ChessboardDelegate;
  notifyingDelegates: any;
  ringColor: string;
  refs: {
    ringRef: HTMLDivElement | null;
    pieceRefs: Partial<Record<Square, HTMLDivElement>>;
    feedbackRefs: Partial<Record<Square, HTMLDivElement>>;
    visualizationDotRef: HTMLDivElement | null;
  };
  _animatePosition?: Chess;
  position: Chess;
  previewPosition?: Chess;
  animatedMove?: AnimationMove;
  animationQueue?: Option<AnimationMove[]>;
  isReversingPreviewMove?: boolean;
  isAnimatingPreviewMove?: boolean;
  previewedMove?: Move;
  nextPreviewMove?: Move;
  drag: {
    square: Square | null;
    touch: boolean;
    enoughToDrag: boolean;
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
  mode: ChessboardMode;

  // history stuff
  moveLog: string[];
  moveLogPgn: string;
  moveHistory: Move[];
  forwardMoveHistory: Move[];
  positionHistory: string[];
  forwardPositionHistory: string[];

  // other tool stuff
  futurePosition: Chess | null;
  movesToVisualize: Move[];
  visualizedMove: Move | null | undefined;
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
      highlightedSquares: new Set(),
      tapOptions: new Set(),
      moveFeedback: {
        type: "incorrect",
      },
      // @ts-ignore
      delegate: null,
      mode: "normal",
      plans: [],
      notifyingDelegates: true,
      moveLog: [],
      moveLogPgn: "",
      position: createChessProxy(new Chess()),
      futurePosition: null,
      positionHistory: [START_EPD],
      moveHistory: [],
      forwardMoveHistory: [],
      forwardPositionHistory: [],
      refs: {
        ringRef: null,
        visualizationDotRef: null,
        feedbackRefs: {},
        pieceRefs: {},
      },
      ringColor: c.colors.successColor,
      availableMoves: [],
      // @ts-ignore
      drag: {
        square: null,
        enoughToDrag: false,
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
      return (
        chessboardStore.futurePosition ?? chessboardStore.position
      ).turn() === "w"
        ? "white"
        : "black";
    },
    setMode: (x: ChessboardMode) => {
      set((s) => {
        s.mode = x;
      });
    },
    setFrozen: (x: boolean) => {
      set((s) => {
        s.frozen = x;
      });
    },
    setPerspective: (x: Side) => {
      set((s) => {
        s.flipped = x === "black";
      });
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
    makeMove: (m: Move | string, options?: MakeMoveOptions) => {
      set((s) => {
        s.availableMoves = [];
        const pos = s.position;
        let moveObject: Move | null = null;
        if (typeof m === "string") {
          const moves = pos.validateMoves([m]);
          if (!moves) {
            console.log("This move wasn't valid!", m);
            return;
          }
          [moveObject] = moves;
        } else {
          moveObject = m;
        }
        if (!moveObject) {
          console.log("This move wasn't valid!", m);
          return;
        }
        const sameAsPreviewed =
          s.previewedMove?.to === moveObject.to &&
          s.previewedMove?.from === moveObject.from;
        // chessboardInterface.clearPending();
        if (
          options?.animate &&
          // if same as previewed move just make the move no animation
          !sameAsPreviewed
        ) {
          // todo: check if animate position already there, don't recreate if so
          if (!s._animatePosition) {
            s._animatePosition = createChessProxy(new Chess(s.position.fen()));
            s.animationQueue = [];
          }
          s.animationQueue = [
            ...(s.animationQueue ?? []),
            ...([moveObject] as AnimationMove[]),
          ];
          chessboardInterface.stepAnimationQueue();
        }
        pos.move(m);
        if (moveObject) {
          if (isEqual(moveObject, s.forwardMoveHistory[0])) {
            s.forwardMoveHistory.shift();
            s.forwardPositionHistory.shift();
          } else {
            console.log("not equal!", m, s.forwardMoveHistory[0]);
            s.forwardMoveHistory = [];
            s.forwardPositionHistory = [];
          }
          const epd = genEpd(pos);
          s.positionHistory.push(epd);
          s.moveHistory.push(moveObject);
          chessboardInterface.updateMoveLogPgn();
          chessboardInterface.getDelegate()?.onPositionUpdated?.();
          chessboardInterface.getDelegate()?.onMovePlayed?.();
        } else {
          console.log("This move wasn't valid!", m);
        }
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
        const pieceRef = s.refs.pieceRefs[s.previewedMove.from as Square];
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
        console.log("reversing preview move", supplementaryMove);
        if (supplementaryMove) {
          const end = getSquareOffset(supplementaryMove.from, s.flipped);
          const top = `${end.y * 100}%`;
          const left = `${end.x * 100}%`;
          const pieceRef = s.refs.pieceRefs[supplementaryMove.from as Square];
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
        if (isNil(s._animatePosition) || s.animating) {
          return;
        }
        const nextMove = s.animationQueue?.shift() as AnimationMove;
        s.animating = true;
        chessboardInterface.animatePieceMove(
          nextMove,
          PlaybackSpeed.Normal,
          (completed) => {
            s.animating = false;
            if (completed) {
              if (nextMove.reverse) {
                const m = s._animatePosition?.undo();
              } else {
                s._animatePosition?.move(nextMove);
              }
              chessboardInterface.stepAnimationQueue();
            }
          }
        );
      });
    },
    stepPreviewMove: () => {
      set((s: ChessboardViewState) => {
        if (
          s.isReversingPreviewMove ||
          s.isAnimatingPreviewMove ||
          s._animatePosition
        ) {
          return;
        }
        if (
          s.previewedMove &&
          s.nextPreviewMove &&
          !isEqual(s.previewedMove, s.nextPreviewMove)
        ) {
          chessboardInterface.reversePreviewMove();
        }
        if (s.previewedMove && !s.nextPreviewMove) {
          chessboardInterface.reversePreviewMove();
        }
        if (!s.previewedMove && s.nextPreviewMove) {
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
        const pieceRef = s.refs.pieceRefs[move.from as Square];
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
          const suppPieceRef =
            s.refs.pieceRefs[supplementaryMove.from as Square];
          timeline.add(
            {
              targets: suppPieceRef,
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
        s.movesToVisualize = [];

        s.activeFromSquare = undefined;
        s.animating = false;
        s.availableMoves = [];
        s.draggedOverSquare = undefined;
        // @ts-ignore
        s.drag = {
          square: null,
          enoughToDrag: false,
          x: 0,
          y: 0,
          transform: { x: 0, y: 0 },
        };
        s.previewPosition = undefined;
        s.nextPreviewMove = undefined;
        s.previewedMove = undefined;
        s._animatePosition = undefined;
        if (s.animatingMoveSquare) {
          const pieceRef = s.refs.pieceRefs[s.animatingMoveSquare as Square];
          if (pieceRef) {
            anime.remove(pieceRef);
            const { x, y } = getSquareOffset(s.animatingMoveSquare, s.flipped);
            pieceRef.style.top = `${y * 100}%`;
            pieceRef.style.left = `${x * 100}%`;
          }
        }
      });
    },
    animatePieceMove: (
      move: AnimationMove,
      speed: PlaybackSpeed,
      callback: (completed: boolean) => void
    ) => {
      set((s: ChessboardViewState) => {
        const { fadeDuration, moveDuration, stayDuration } =
          getAnimationDurations(speed);
        // @ts-ignore
        const [start, end]: Square[] = move.reverse
          ? [move.to, move.from]
          : [move.from, move.to];
        const { x, y } = getSquareOffset(end, s.flipped);
        const { x: startX, y: startY } = getSquareOffset(start, s.flipped);
        s.animatingMoveSquare = start;
        const pieceRef = s.refs.pieceRefs[start as Square];
        if (!pieceRef) {
          return;
        }
        pieceRef.style.top = `${startY * 100}%`;
        pieceRef.style.left = `${startX * 100}%`;
        anime({
          targets: pieceRef,
          top: `${y * 100}%`,
          left: `${x * 100}%`,
          duration: moveDuration,
          easing: "easeInOutSine",
          autoplay: true,
        }).finished.then(() => {
          s.animatedMove = undefined;
          s.animatingMoveSquare = undefined;
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
    setTapOptions: (squares: Square[]) => {
      set((s) => {
        s.tapOptions = new Set(squares);
      });
    },
    highlightSquare: (square: Square) => {
      set((s) => {
        s.highlightedSquares = new Set([square]);
        console.log("highlightedSquares", s.highlightedSquares);
      });
    },
    requestToMakeMove: (move: Move, options?: MakeMoveOptions) => {
      set((s) => {
        if (move) {
          chessboardInterface.clearPending();
          const promotionPiece = chessboardInterface
            .getDelegate()
            ?.askForPromotionPiece?.(move);
          if (promotionPiece) {
            const newMove = cloneDeep(move);
            newMove.promotion = promotionPiece;
            move = (s.position.validateMoves([newMove]) as Move[])[0];
          }
          const makeMove = () => {
            if (s.previewedMove?.san == move.san) {
              chessboardInterface.makeMove(move, {
                ...options,
                animate: false,
              });
            }
            chessboardInterface.makeMove(move, options);
          };
          if (chessboardInterface.getDelegate()?.shouldMakeMove?.(move)) {
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
    forwardOne: () => {
      set((s) => {
        if (s.forwardPositionHistory.length > 0) {
          const m = s.forwardMoveHistory[0] as Move;
          chessboardInterface.makeMove(m, { animate: true });
          chessboardInterface.updateMoveLogPgn();
          chessboardInterface.getDelegate()?.onPositionUpdated?.();
        }
      });
    },
    forwardN: (n: number) => {
      set((s) => {
        if (s.moveHistory.length > 0) {
          times(n, () => {
            chessboardInterface.forwardOne();
          });
        }
      });
    },
    backN: (n: number) => {
      set((s) => {
        if (s.moveHistory.length > 0) {
          times(n, () => {
            chessboardInterface.backOne();
          });
        }
      });
    },
    backOne: (opts) => {
      set((s) => {
        if (s.moveHistory.length > 0) {
          const position = s.positionHistory.pop() as string;
          const m = s.moveHistory.pop() as Move;
          s.previewPosition = undefined;
          s.forwardMoveHistory.unshift(m);
          s.forwardPositionHistory.unshift(position);
          if (opts?.clear) {
            s.forwardPositionHistory = [];
            s.forwardMoveHistory = [];
          }
          if (!opts?.skipAnimation) {
            if (!s._animatePosition) {
              s._animatePosition = createChessProxy(s.position.clone());
              s.animationQueue = [];
            }
            s.animationQueue = [
              ...(s.animationQueue ?? []),
              { ...m, reverse: true },
            ];
            chessboardInterface.stepAnimationQueue();
          }
          s.position.undo();

          chessboardInterface.updateMoveLogPgn();
          chessboardInterface.getDelegate()?.onPositionUpdated?.();
          chessboardInterface.getDelegate()?.onBack?.();
        }
      });
    },
    setPosition: (chess: Chess) => {
      set((s) => {
        s.position = createChessProxy(chess.clone());
      });
    },
    resetPosition: () => {
      set((s) => {
        s.position = createChessProxy(new Chess());
        chessboardInterface.clearPending();
        s.positionHistory = [START_EPD];
        s.moveHistory = [];
        s.forwardMoveHistory = [];
        s.forwardPositionHistory = [];
        s.previewPosition = undefined;
        chessboardInterface.updateMoveLogPgn();
        chessboardInterface.getDelegate()?.onPositionUpdated?.();
        chessboardInterface.getDelegate()?.onBack?.();
      });
    },
    visualizeMoves: (
      moves: Move[],
      speed: PlaybackSpeed,
      callback: (() => void) | undefined
    ) => {
      set((s) => {
        s.movesToVisualize = moves;
      });
      const recurseVisualize = () => {
        set((s) => {
          const move = s.movesToVisualize?.shift();
          s.visualizedMove = move;
          if (!move) {
            return;
          }
          const { fadeDuration, moveDuration, stayDuration } =
            getAnimationDurations(speed);
          // @ts-ignore
          const [start, end]: Square[] = [move.from, move.to];
          const { x, y } = getSquareOffset(end, s.flipped);
          const { x: startX, y: startY } = getSquareOffset(start, s.flipped);
          const dotRef = s.refs.visualizationDotRef;
          console.log("dot ref", dotRef);
          if (!dotRef) {
            return;
          }
          dotRef.style.top = `${startY * 100}%`;
          dotRef.style.left = `${startX * 100}%`;

          const tl = anime.timeline({
            autoplay: true,
          });

          // Fade In
          tl.add({
            targets: dotRef,
            opacity: [0, 1],
            duration: fadeDuration,
            easing: "linear",
            offset: 0,
          });

          // Move
          tl.add({
            targets: dotRef,
            top: `${y * 100}%`,
            left: `${x * 100}%`,
            duration: moveDuration,
            easing: "easeInOutSine",
            offset: fadeDuration, // start the move after fadeDuration
          });

          // Fade Out
          tl.add({
            targets: dotRef,
            opacity: [1, 0],
            duration: stayDuration,
            easing: "linear",
            offset: fadeDuration + moveDuration, // start fading out after fadeDuration + moveDuration
            complete: () => {
              recurseVisualize();
            },
          });
        });
      };
      recurseVisualize();
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
          // @ts-ignore
          const [moveObject] = s.position.validateMoves([m]) ?? [];
          s.nextPreviewMove = moveObject;
          chessboardInterface.stepPreviewMove();
        } else {
          s.nextPreviewMove = undefined;
          chessboardInterface.stepPreviewMove();
        }
      });
    },
    showMoveFeedback: ({ square, type }, callback) => {
      set((state) => {
        state.moveFeedback.type = type;
        const ref = state.refs.feedbackRefs[square];
        // const whiteOverlay = ref?.querySelector(
        //   "#white-overlay"
        // ) as HTMLDivElement;
        anime
          .timeline({
            duration: 250,
            autoplay: true,
            easing: "easeInOutSine",
          })
          .add({
            targets: ref,
            opacity: [0, 1.0],
            scale: [0.8, 1.2, 1.0],
          })
          // .add({
          //   targets: whiteOverlay,
          //   opacity: [0.4, 0],
          //   duration: 100,
          // })
          .finished.then(() => {
            anime({
              targets: ref,
              easing: "easeInOutSine",
              duration: 300,
              opacity: [1.0, 0],
              scale: [1.0, 0.8],
              delay: 200,
              autoplay: true,
            }).finished.then(() => {
              // whiteOverlay.style.opacity = "1";
              callback?.();
            });
          });
      });
    },
    flashRing: (success: boolean) => {
      set((state) => {
        console.log("flashing the ring", state.refs.ringRef);
        const ringColor = success
          ? c.colors.successColor
          : c.colors.failureLight;
        state.ringColor = ringColor;
        // state.ringRef.style.backgroundColor = ringColor;
        anime({
          targets: state.refs.ringRef,
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
          const fen = `${options.fromEpd ?? START_EPD} 0 1`;
          s._animatePosition = createChessProxy(new Chess(fen));
          const moves = s._animatePosition.validateMoves(line);
          // @ts-ignore
          s.animationQueue = moves;
          chessboardInterface.stepAnimationQueue();
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
  const distance =
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
  const newMove = {
    piece: "r" as PieceSymbol,
    color: move.color,
    flags: "",
    san: "",
  };

  if (move.san === "O-O" && move.color === "w") {
    return {
      ...newMove,
      from: "h1",
      to: "f1",
      color: "w",
    };
  } else if (move.san === "O-O-O" && move.color === "w") {
    return {
      ...newMove,
      from: "a1",
      to: "d1",
      color: "w",
    };
  }
  if (move.san === "O-O" && move.color === "b") {
    return {
      ...newMove,
      from: "h8",
      to: "f8",
      color: "w",
    };
  } else if (move.san === "O-O-O" && move.color === "b") {
    return {
      ...newMove,
      from: "a8",
      to: "d8",
      color: "w",
    };
  }
  return null;
};

export interface MoveArrow {
  move: Move;
}
export const createStaticChessState = ({
  epd,
  side,
  nextMove,
}: {
  epd: string;
  side: Side;
  nextMove?: string | Move;
}) => {
  console.log("creating static chess state", epd, side, nextMove);
  const [, chessboard] = createChessboardInterface();
  const fen = `${epd} 0 1`;
  chessboard.setPosition(createChessProxy(new Chess(fen)));
  chessboard.setPerspective(side);
  if (nextMove) {
    chessboard.makeMove(nextMove);
  }
  return chessboard;
};
