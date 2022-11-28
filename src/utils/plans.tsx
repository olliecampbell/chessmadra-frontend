import { Chess } from "@lubert/chess.ts";
import { Square } from "@lubert/chess.ts/dist/types";
import { Plan } from "app/models";
import { sortBy, filter, uniqBy, take, cloneDeep } from "lodash-es";
import { Side, toSide } from "./repertoire";

export interface MetaPlan {
  plan: Plan;
  directionChanged: boolean;
  subsequentMove: boolean;
}

export const getTopPlans = (
  _plans: Plan[],
  side: Side,
  board: Chess
): MetaPlan[] => {
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
  let metaPlans: MetaPlan[] = [];
  type SquareMove = string;
  let recurse = (plan: Plan, seenMoves: Set<SquareMove>) => {
    metaPlans.push({ plan, directionChanged: false, subsequentMove: false });
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

  metaPlans = uniqBy(
    metaPlans,
    (p) => `${p.plan.san}-${p.plan.toSquare}-${p.plan.toSquare}`
  );
  metaPlans = sortBy(metaPlans, (p) => -p.plan.occurences);

  if (plans.length <= 1) {
    return [];
  }
  return take(metaPlans, 7);
};
