import { Chess, Move } from "@lubert/chess.ts";
import { Square } from "@lubert/chess.ts/dist/types";
import { Accessor } from "solid-js";
import { PlaybackSpeed } from "~/types/VisualizationState";

export interface ChessboardInterface {
  resetPosition: () => void;
  highlightSquares: (highlightSquares: Square[]) => void;
  makeMove: (_: Move) => void;
  clearPending: () => void;
  backOne: () => void;
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
  previewMove: (m: Move | string | null) => void;
  reversePreviewMove: () => void;
  animatePreviewMove: () => void;
  stepPreviewMove: () => void;
  stepAnimationQueue: () => void;
  clearHighlightedSquares: () => void;
  onSquarePress: (square: Square, skipAnimation: boolean) => void;
  availableMovesFrom: (square: Square) => Move[];
  highlightLastMove: () => void;
  highlightMoveSquares: (
    move: Move,
    duration?: number,
    unhighlight?: boolean
  ) => void;
  animatePgn: (fen: string, moves: Move[]) => void;
}

export interface ChessboardViewState {
  _animatePosition?: Chess;
  currentHighlightedSquares: Set<Square>;
  pieceRefs: Partial<Record<Square, HTMLDivElement>>;
  squareHighlightRefs: Partial<Record<Square, HTMLDivElement>>;
  moveIndicatorRef: Accessor<HTMLDivElement> | null;
  position: Chess;
  previewPosition?: Chess;
  animatedMove?: Move;
  animationQueue?: Move[];
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
}
