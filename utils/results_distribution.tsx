import { GameResultsDistribution } from "app/models";

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
