import { Chess } from "@lubert/chess.ts";
import { Square } from "@lubert/chess.ts/dist/types";
import { Plan } from "app/models";
import { sortBy, filter, uniqBy, take, cloneDeep } from "lodash-es";
import { Side, toSide } from "./repertoire";

export const getTopPlans = (
  _plans: Plan[],
  side: Side,
  board: Chess
): Plan[] => {
  let plans = _plans;
  plans = filter(plans, (p) => p.side === side);

  // @ts-ignore
  let byFromSquare: Record<Square, Plan[]> = {};
  plans.forEach((p) => {
    if (byFromSquare[p.fromSquare]) {
      byFromSquare[p.fromSquare].push(p);
    } else {
      byFromSquare[p.fromSquare] = [p];
    }
  });
  let nonGhostPlans: Plan[] = [];
  type SquareMove = string;
  let recurse = (plan: Plan, seenMoves: Set<SquareMove>) => {
    nonGhostPlans.push(plan);
    byFromSquare[plan.fromSquare].forEach((p) => {
      if (seenMoves.has(p.fromSquare + p.toSquare)) {
        seenMoves.add(p.fromSquare + p.toSquare);
        recurse(p, cloneDeep(seenMoves));
      }
    });
  };
  plans.forEach((plan) => {
    let piece = board.get(plan.fromSquare);
    if (piece && toSide(piece.color) === side) {
      byFromSquare[plan.fromSquare].forEach((p) => {
        recurse(p, new Set());
      });
    }
  });

  // plans = nonGhostPlans;
  plans = uniqBy(plans, (p) => `${p.san}-${p.toSquare}-${p.toSquare}`);
  plans = sortBy(plans, (p) => -p.occurences);

  if (plans.length <= 1) {
    return [];
  }
  return take(plans, 7);
};
