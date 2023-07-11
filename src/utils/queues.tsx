import { PieceSymbol } from "@lubert/chess.ts";
import { Square } from "@lubert/chess.ts/dist/types";
import { RepertoireMove, Side } from "./repertoire";

export type QuizGroup = QuizGroupPlans | QuizGroupMoves;

export interface QuizGroupPlans extends QuizGroupBase {
  plans: QuizPlan[];
}

export interface QuizGroupMoves extends QuizGroupBase {
  moves: RepertoireMove[];
}

export interface QuizGroupBase {
  line: string;
  epd: string;
  side: Side;
}

export interface QuizPlan {
  type: "piece_movement" | "castling";
  piece: PieceSymbol;
  toSquares: Square[];
  options?: Square[];
  fromSquare: Square;
}

export interface QuizMoves {
  moves: RepertoireMove[];
}

export interface QuizItem {
  move?: RepertoireMove;
}

export const countQueue = (queue: QuizGroup[]) => {
  return queue
    .map((m) => (getQuizPlans(m) ?? getQuizMoves(m) ?? []).length)
    .reduce((a, b) => a + b, 0);
};

export const getQuizPlans = (quizGroup: QuizGroup): QuizPlan[] | null => {
  if ("plans" in quizGroup) {
    return (quizGroup as QuizGroupPlans).plans;
  }

  return null;
};

export const getQuizMoves = (quizGroup: QuizGroup): RepertoireMove[] | null => {
  if ("moves" in quizGroup) {
    return (quizGroup as QuizGroupMoves).moves;
  }

  return null;
};
