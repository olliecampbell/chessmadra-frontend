import { PieceSymbol } from "@lubert/chess.ts";
import { Square } from "@lubert/chess.ts/dist/types";
import { drop, take } from "lodash-es";
import { MetaPlan } from "./plans";
import { RepertoireMove, Side } from "./repertoire";

export type QuizGroup = QuizGroupPlans | QuizGroupMoves;

export interface QuizGroupPlans extends QuizGroupBase {
  plans: QuizPlan[];
  remainingPlans: QuizPlan[];
  completedPlans: QuizPlan[];
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
  metaPlan: MetaPlan;
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
    .map((m) => {
      const moves = Quiz.getMoves(m);
      if (moves) {
        return moves.length;
      }
      return 1;
    })
    .reduce((a, b) => a + b, 0);
};

export namespace Quiz {
  export const getRemainingPlans = (
    quizGroup: QuizGroup,
    planIndex: number,
  ): QuizPlan[] | null => {
    const plans = Quiz.getPlans(quizGroup);
    return drop(plans, planIndex);
  };

  export const getCompletedPlans = (
    quizGroup: QuizGroup,
    planIndex: number,
  ): QuizPlan[] | null => {
    const plans = Quiz.getPlans(quizGroup);
    return take(plans, planIndex);
  };

  export const getMoves = (quizGroup: QuizGroup): RepertoireMove[] | null => {
    if ("moves" in quizGroup) {
      return (quizGroup as QuizGroupMoves).moves;
    }

    return null;
  };

  export const getPlans = (quizGroup: QuizGroup): QuizPlan[] | null => {
    if ("plans" in quizGroup) {
      return (quizGroup as QuizGroupPlans).plans;
    }

    return null;
  };
}
