import { PlaybackSpeed } from "~/types/VisualizationState";
import { Chess, Move, SQUARES } from "@lubert/chess.ts";
import { first, isEmpty, isEqual, isNil, last, mapValues } from "lodash-es";
import { getAnimationDurations } from "../components/chessboard/Chessboard";
import { Square } from "@lubert/chess.ts/dist/types";
import { c } from "~/utils/styles";
import { genEpd, getSquareOffset, START_EPD } from "./chess";
import { lineToPgn, Side } from "./repertoire";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick, QuickUpdate } from "./quick";
import { pgnToLine } from "~/utils/repertoire";
import { quick } from "./app_state";
import { logProxy } from "./state";
import { Plan } from "~/utils/models";
import { MetaPlan } from "./plans";
import { adjustOpacity } from "./theming";
import { createSignal } from "solid-js";
import anime from "animejs";
import { ChessboardInterface } from "./chessboard_interface";
import { createChessProxy } from "./chess_proxy";

export interface MoveArrow {
  move: Move;
}

interface PlayPgnOptions {
  animateLine: string[];
  animated?: boolean;
  fromEpd?: string;
}

export interface ChessboardState extends QuickUpdate<ChessboardState> {
  chessboardView?: ChessboardInterface;
  focusedPlans?: string[];
  maxPlanOccurence?: number;
  _animatePosition: Chess | null;
  plans: MetaPlan[];
  showPlans?: boolean;
  playPgn: (pgn: string, options?: PlayPgnOptions) => void;
  frozen?: boolean;
  positionHistory: string[];
  moveHistory: Move[];
  position: Chess;
  previewPosition?: Chess;
  futurePosition?: Chess;
  indicatorColor?: string;
  // TODO: solid
  squareHighlightAnims: Record<Square, number>;
  currentHighlightedSquares: Set<string>;
  getLastMove: () => Move;
  ringColor: string | null;
  ringIndicatorAnim?: number;
  hideColors?: boolean;
  playbackSpeed?: PlaybackSpeed;
  flipped?: boolean;
  moveLog?: string[];
  moveLogPgn?: string;
  showMoveLog?: boolean;
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

const getAnimationTime = (
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  const distance =
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
  const initialState = {
    isColorTraining: false,
    plans: [],
    showPlans: false,
    notifyingDelegates: true,
    _animatePosition: null,
    focusedPlans: [],
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
    ringIndicatorAnim: 0,
    squareHighlightAnims: mapValues(SQUARES, (number, square) => {
      return 0.0;
    }),
    flipped: false,
    position: createChessProxy(new Chess()),

    // TODO: solid
    moveIndicatorAnim: { x: 0, y: 0 },
    pieceMoveAnim: { x: 0, y: 0 },
    previewPieceMoveAnim: { x: 0, y: 0 },
    moveLogPgn: "",
    getLastMove: () => {
      return get((s) => {
        return last(s.moveHistory);
      });
    },
    moveIndicatorOpacityAnim: 0,
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
          s.positionHistory.pop();
          s.moveHistory.pop();
          s.position.undo();
          s.chessboardView?.backOne();
          s.updateMoveLogPgn();
          s.getDelegate()?.onPositionUpdated?.();
          s.getDelegate()?.onBack?.();
        }
      });
    },
    requestToMakeMove: (move: Move) => {
      return set((s) => {
        if (s.getDelegate().shouldMakeMove(availableMove)) {
          s.getDelegate().madeManualMove?.();
          s.makeMove(move);
        }
      });
    },
    resetPosition: () => {
      set((s) => {
        s.chessboardView?.resetPosition();
        s._animatePosition = null;
        s.positionHistory = [START_EPD];
        s.moveHistory = [];
        console.log("setting new position");
        s.position = createChessProxy(new Chess());
        s.updateMoveLogPgn();
        s.getDelegate()?.onPositionUpdated?.();
        s.getDelegate()?.onReset?.();
      });
    },
    arrows: [],
    playPgn: (pgn: string, options?: PlayPgnOptions) => {
      set((s) => {
        s.stopNotifyingDelegates();
        s.resetPosition();
        const line = pgnToLine(pgn);
        line.map((san) => {
          s.makeMove(san);
        });
        if (options?.animated) {
          const fen = `${options.fromEpd} 0 1`;
          s.chessboardView?.animatePgn(fen, options.animateLine);
        }
        s.resumeNotifyingDelegates();
        s.getDelegate()?.onPositionUpdated?.();
        s.getDelegate()?.onMovePlayed?.();
      });
    },
    getCurrentEpd: () => {
      return get((s) => {
        return last(s.positionHistory);
      });
    },
    makeMove: (m: Move | string) => {
      set((s) => {
        const pos = s.position;
        const moveObject = pos.move(m);
        if (moveObject) {
          const epd = genEpd(pos);
          s.positionHistory.push(epd);
          s.moveHistory.push(moveObject);
          s.updateMoveLogPgn();
          s.getDelegate()?.onPositionUpdated?.();
          s.getDelegate()?.onMovePlayed?.();
          s.chessboardView?.makeMove(moveObject);
        } else {
          console.log("This move wasn't valid!", m);
        }
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
    state.position = createChessProxy(new Chess());
    state.frozen = true;
    state.highContrast = false;
    if (side) {
      state.flipped = side == "black";
    }
    state.hideCoordinates = true;
    if (epd) {
      const fen = `${epd} 0 1`;
      state.position = createChessProxy(new Chess(fen));
    } else if (line) {
      state.position.loadPgn(line);
    }
    if (nextMove) {
      const [move] = state.position.validateMoves([nextMove]);
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
