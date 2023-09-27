import { isNil } from "lodash-es";
import {
	GameResultsDistribution,
	PositionReport,
	SuggestedMove,
} from "~/utils/models";
import { Side } from "./repertoire";

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
	// @ts-ignore
	return x[side] / getTotalGames(x);
}

export function getDrawAdjustedWinRate(x: GameResultsDistribution, side: Side) {
	// @ts-ignore
	return (x[side] + x.draw / 2) / getTotalGames(x);
}

export function getWinRateRange(
	x: GameResultsDistribution,
	side: string,
): [number, number, number] {
	// @ts-ignore
	const w = x[side];
	const n = getTotalGames(x);
	const { left, right } = wilson(w, n);
	return [left, right, Math.abs(left - right)];
}

export const getPlayRate = (
	m: SuggestedMove,
	report: PositionReport,
	masters?: boolean,
): number => {
	const k = masters ? "masterResults" : "results";
	const total = getTotalGames(report[k]);
	const divisor = getTotalGames(m[k]);
	if (isNil(total) || isNil(divisor) || total === 0) {
		// @ts-ignore
		return null;
	}
	return divisor / total;
};

export const isNegligiblePlayrate = (playRate: number) => {
	return (
		!playRate || isNaN(playRate) || formatPlayPercentage(playRate) === "0%"
	);
};

// @ts-ignore
export const wilson = function (positiveScore, total) {
	if (total === 0) {
		return {
			left: 0,
			right: 0,
		};
	}

	// phat is the proportion of successes
	// in a Bernoulli trial process
	const phat = positiveScore / total;

	// z is 1-alpha/2 percentile of a standard
	// normal distribution for error alpha=5%
	const z = 4.0;

	// implement the algorithm
	// (http://goo.gl/kgmV3g)
	const a = phat + (z * z) / (2 * total);
	const b = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
	const c = 1 + (z * z) / total;

	return {
		left: (a - b) / c,
		right: (a + b) / c,
	};
};
