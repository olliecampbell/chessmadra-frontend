import {
  GameResultsDistribution,
  PositionReport,
  SuggestedMove,
} from "app/models";

export function getTotalGames(results: GameResultsDistribution) {
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

export const getPlayRate = (
  m: SuggestedMove,
  report: PositionReport,
  masters?: boolean
): number => {
  let k = masters ? "masterResults" : "results";
  return getTotalGames(m[k]) / getTotalGames(report[k]);
};
