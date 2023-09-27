import { BrowsingMode } from "./browsing_state";
import { Side } from "./repertoire";
import {
	getPlayRate,
	getTotalGames,
	getWinRateRange,
	isNegligiblePlayrate,
} from "./results_distribution";
import { isNil, orderBy, reverse, sortBy, sumBy } from "lodash-es";
import { ScoreTable, TableResponse } from "~/components/RepertoireMovesTable";
import { MoveTag, PositionReport, StockfishReport } from "~/utils/models";

export enum TableResponseScoreSource {
	Start = "start",
	Eval = "eval",
	Winrate = "winrate",
	Playrate = "playrate",
	Needed = "needed",
	MasterPlayrate = "masterPlayrate",
	Incidence = "incidence",
	BestMove = "bestMove",
}

type TableResponseWeights = {
	startScore: number;
	eval: number;
	winrate: number;
	playrate: number;
	masterPlayrate: number;
	incidence: number;
};

export const scoreTableResponses = (
	tableResponses: TableResponse[],
	report: PositionReport,
	bestStockfishReport: StockfishReport | undefined,
	side: Side,
	mode: BrowsingMode,
	ownSide: boolean,
	useMasters: boolean,
): TableResponse[] => {
	const positionWinRate = report
		? getWinRateRange(report.results, side)[0]
		: NaN;
	if (mode === "browse") {
		return sortBy(tableResponses, [
			(tableResponse: TableResponse) => {
				if (tableResponse.reviewInfo) {
					return -tableResponse.reviewInfo.due;
				}
				return 0;
			},
			(tableResponse: TableResponse) => {
				if (tableResponse.reviewInfo) {
					return tableResponse.reviewInfo.earliestDue;
				}
				return Infinity;
			},
		]);
	}
	const sorts = [];
	if (!ownSide) {
		sorts.push((tableResponse: TableResponse) => {
			if (!tableResponse.suggestedMove) {
				return undefined;
			}
			const playRate = getPlayRate(tableResponse.suggestedMove, report, false);
			return -playRate;
		});
	} else {
		if (useMasters) {
			sorts.push((tableResponse: TableResponse) => {
				if (!tableResponse.suggestedMove) {
					return undefined;
				}
				const masterPlayRate = getPlayRate(
					tableResponse.suggestedMove,
					report,
					true,
				);
				if (!isNegligiblePlayrate(masterPlayRate)) {
					return -masterPlayRate;
				}
				return 0;
			});
		}
		sorts.push((tableResponse: TableResponse) => {
			const score = scoreTableResponseEffectiveness(
				tableResponse,
				report,
				positionWinRate,
				bestStockfishReport,
				side,
			);
			return -score;
		});
	}

	return sortBy(tableResponses, sorts);
};

const scoreTableResponseEffectiveness = (
	tableResponse: TableResponse,
	report: PositionReport,
	positionWinRate: number,
	bestStockfishReport: StockfishReport | undefined,
	side: Side,
): number => {
	const weights = EFFECTIVENESS_WEIGHTS_PEERS;
	// let san =
	//   tableResponse.suggestedMove?.sanPlus ??
	//   tableResponse.repertoireMove?.sanPlus;
	// return failOnAny(san);
	const score = weights.startScore;
	const scoreTable = { factors: [], notes: [] } as ScoreTable;
	if (isNil(report)) {
		return score;
	}
	const suggestedMove = tableResponse.suggestedMove;
	if (suggestedMove) {
		const stockfish = tableResponse.suggestedMove?.stockfish;
		if (stockfish) {
			const mate = stockfish?.mate;
			if (mate) {
				const mateSide = mate > 0 ? "white" : "black";
				if (mateSide === side) {
					scoreTable.factors.push({
						source: TableResponseScoreSource.Eval,
						value: 10000,
					});
				} else {
					scoreTable.factors.push({
						source: TableResponseScoreSource.Eval,
						value: -10000,
					});
				}
			}
			if (!isNil(stockfish?.eval) && !isNil(bestStockfishReport?.eval)) {
				const eval_loss = Math.abs(
					Math.max(
						// @ts-ignore
						(bestStockfishReport.eval - stockfish.eval) *
							(side === "black" ? -1 : 1),
						0,
					),
				);
				scoreTable.factors.push({
					source: TableResponseScoreSource.Eval,
					value: -eval_loss + 10,
				});
				// if (m.sanPlus === DEBUG_MOVE) {
				//   console.log(
				//     `For ${m.sanPlus}, the eval_loss is ${eval_loss}, Score change is ${scoreChangeEval}`
				//   );
				// }
			} else {
				// Punish for not having stockfish eval, so good stockfish evals get bumped up if compared against no stockfish eval
				// score -= 400 * weights.eval;
			}
		}
		const rateAdditionalWeight = Math.min(
			// @ts-ignore
			getTotalGames(tableResponse?.suggestedMove.results) / 100,
			1,
		);
		// @ts-ignore
		const playRate = getPlayRate(tableResponse.suggestedMove, report);
		if (!isNegligiblePlayrate(playRate)) {
			const scoreForPlayrate = playRate * 100 * rateAdditionalWeight;
			scoreTable.factors.push({
				source: TableResponseScoreSource.Playrate,
				value: scoreForPlayrate,
			});
			// if (m.sanPlus === DEBUG_MOVE) {
			//   console.log(
			//     `For ${m.sanPlus}, the playrate is ${playRate}, Score change is ${scoreForPlayrate}`
			//   );
			// }
		} else if (weights[TableResponseScoreSource.Playrate] !== 0) {
			scoreTable.notes.push("Insufficient games for playrate");
		}
		// @ts-ignore
		if (weights[TableResponseScoreSource.Needed] > 0) {
			if (tableResponse.suggestedMove?.needed) {
				scoreTable.factors.push({
					source: TableResponseScoreSource.Needed,
					value: 10000.0,
				});
			}
		}
		const [winrateLowerBound, winrateUpperBound] = getWinRateRange(
			// @ts-ignore
			tableResponse.suggestedMove?.results,
			side,
		);
		// console.log(
		//   `for ${tableResponse.suggestedMove?.sanPlus}, winrateLowerBound: ${winrateLowerBound}, winrateUpperBound: ${winrateUpperBound}`
		// );
		const winrateChange = winrateLowerBound - positionWinRate;
		if (!isNaN(winrateChange) && !isNil(winrateChange)) {
			scoreTable.notes.push(
				`Winrate change: ${winrateChange}, winrateLowerBound: ${winrateLowerBound}, winrateUpperBound: ${winrateUpperBound}`,
			);
			const scoreForWinrate = winrateChange;
			scoreTable.factors.push({
				source: TableResponseScoreSource.Winrate,
				value: scoreForWinrate,
				max: 0.5,
			});
		}
	}
	scoreTable.factors.forEach((f) => {
		// @ts-ignore
		f.weight = weights[f.source] ?? 1.0;
		// @ts-ignore
		f.total = f.weight * f.value;
		if (f.max) {
			f.total = Math.min(f.total, f.max);
		}
	});
	if (tableResponse.tags.includes(MoveTag.BestMove)) {
		scoreTable.factors.push({
			source: TableResponseScoreSource.BestMove,
			// weight: 1.0,
			value: 0,
			total: 10000,
		});
	}
	if (weights.startScore) {
		scoreTable.factors.push({
			source: TableResponseScoreSource.Start,
			weight: 1.0,
			value: weights.startScore,
			total: weights.startScore,
		});
	}
	tableResponse.scoreTable = scoreTable;
	// @ts-ignore
	tableResponse.score = sumBy(scoreTable.factors, (f) => {
		return f.total;
	});
	console.log({
		san: tableResponse.suggestedMove?.sanPlus,
		score: tableResponse.score,
		factors: scoreTable.factors,
		tableResponse,
		scoreTable,
	});
	return tableResponse.score;
};

export const EFFECTIVENESS_WEIGHTS_PEERS = {
	startScore: 1.0,
	eval: 1 / 50,
	winrate: 10.0,
	playrate: 1 / 100,
	masterPlayrate: 0.0,
};

export const shouldUsePeerRates = (pr: PositionReport) => {
	// @ts-ignore
	return getTotalGames(pr?.masterResults) < 10;
};
