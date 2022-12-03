import {
  GameResultsDistribution,
  PositionReport,
  SuggestedMove,
} from "app/models";
import { isNil } from "lodash-es";

export function getTotalGames(results: GameResultsDistribution) {
  if (!results) {
    return null;
  }
  return results.draw + results.black + results.white;
}

export const formatPlayPercentage = (x: number) => {
  return `${(x * 100).toFixed(0)}%`;
};

export const formatWinPercentage = (x: number) => {
  return `${(x * 100).toFixed(0)}`;
};

export function getWinRate(x: GameResultsDistribution, side: string) {
  return x[side] / getTotalGames(x);
}

export function getWinRateRange(
  x: GameResultsDistribution,
  side: string
): [number, number, number] {
  let w = x[side];
  let n = getTotalGames(x);
  let range = 1.96 * Math.sqrt(((w / n) * (1 - w / n)) / n);
  return [w / n - range, w / n + range, range * 2];
}

export const getPlayRate = (
  m: SuggestedMove,
  report: PositionReport,
  masters?: boolean
): number => {
  let k = masters ? "masterResults" : "results";
  let total = getTotalGames(report[k]);
  let divisor = getTotalGames(m[k]);
  if (isNil(total) || isNil(divisor) || total === 0) {
    return null;
  }
  return divisor / total;
};

export const isNegligiblePlayrate = (playRate: number) => {
  return (
    !playRate || isNaN(playRate) || formatPlayPercentage(playRate) === "0%"
  );
};
