import { RepertoireMove, Side } from "./repertoire";

export interface QuizMove {
  moves: RepertoireMove[];
  line: string;
  side: Side;
}

export const countQueue = (queue: QuizMove[]) => {
  return queue.map((m) => m.moves.length).reduce((a, b) => a + b, 0);
};
