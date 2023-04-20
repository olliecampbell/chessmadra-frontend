import { ScoreTable, TableResponse } from "~/components/RepertoireMovesTable";
import { MoveTag, PositionReport } from "~/utils/models";
import { isNil, sumBy, reverse, sortBy } from "lodash-es";
import { BrowsingMode } from "./browsing_state";
import { Side } from "./repertoire";
import {
  getPlayRate,
  getTotalGames,
  getWinRate,
  getWinRateRange,
  isNegligiblePlayrate,
} from "./results_distribution";

export enum TableResponseScoreSource {
  Start = "start",
  Eval = "eval",
  Winrate = "winrate",
  Playrate = "playrate",
  Needed = "needed",
  MasterPlayrate = "masterPlayrate",
  Incidence = "incidence",
}

export const scoreTableResponses = (
  tableResponses: TableResponse[],
  report: PositionReport,
  side: Side,
  epd: string,
  mode: BrowsingMode,
  weights: {
    startScore: number;
    eval: number;
    winrate: number;
    playrate: number;
    masterPlayrate: number;
    incidence: number;
  }
): TableResponse[] => {
  const positionWinRate = report ? getWinRate(report?.results, side) : NaN;
  const DEBUG_MOVE = null;
  if (mode == "browse") {
    return sortBy(
      tableResponses,
      [
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
      ],
      ["desc", "asc"]
    );
  }
  return reverse(
    sortBy(tableResponses, (tableResponse: TableResponse) => {
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
        let evalOverride = false;
        const masterPlayRate = getPlayRate(
          tableResponse?.suggestedMove,
          report,
          true
        );
        if (!isNegligiblePlayrate(masterPlayRate)) {
          const masterRateAdditionalWeight = Math.min(
            getTotalGames(tableResponse.suggestedMove?.masterResults) / 10,
            1
          );
          const scoreForMasterPlayrate =
            masterPlayRate * 100 * masterRateAdditionalWeight;
          scoreTable.factors.push({
            source: TableResponseScoreSource.MasterPlayrate,
            value: scoreForMasterPlayrate,
          });
          if (weights.masterPlayrate > 0 && masterPlayRate > 0.03) {
            evalOverride = true;
          }
        }
        const stockfish = tableResponse.suggestedMove?.stockfish;
        if (stockfish && !evalOverride) {
          if (stockfish?.mate < 0 && side === "black") {
            scoreTable.factors.push({
              source: TableResponseScoreSource.Eval,
              value: 10000,
            });
          }
          if (stockfish?.mate > 0 && side === "white") {
            scoreTable.factors.push({
              source: TableResponseScoreSource.Eval,
              value: 10000,
            });
          }
          if (!isNil(stockfish?.eval) && !isNil(report.stockfish?.eval)) {
            const eval_loss = Math.abs(
              Math.max(
                (report.stockfish.eval - stockfish.eval) *
                  (side === "black" ? -1 : 1),
                0
              )
            );
            scoreTable.factors.push({
              source: TableResponseScoreSource.Eval,
              value: -eval_loss,
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
          getTotalGames(tableResponse?.suggestedMove.results) / 100,
          1
        );
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
        } else if (weights[TableResponseScoreSource.Playrate] != 0) {
          scoreTable.notes.push("Insufficient games for playrate");
        }
        if (weights[TableResponseScoreSource.Needed] > 0) {
          if (tableResponse.suggestedMove?.needed) {
            scoreTable.factors.push({
              source: TableResponseScoreSource.Needed,
              value: 10000.0,
            });
          }
        }
        if (tableResponse.suggestedMove?.incidence) {
          scoreTable.factors.push({
            source: TableResponseScoreSource.Incidence,
            value: tableResponse.suggestedMove?.incidence,
            weight: weights[TableResponseScoreSource.Incidence] ?? 1,
          });
        }
        const [winrateLowerBound, winrateUpperBound] = getWinRateRange(
          tableResponse.suggestedMove?.results,
          side
        );
        const winrateChange = winrateLowerBound - positionWinRate;
        if (!isNaN(winrateChange) && !isNil(winrateChange)) {
          const scoreForWinrate = winrateChange;
          scoreTable.factors.push({
            source: TableResponseScoreSource.Winrate,
            value: scoreForWinrate,
            max: 0.5,
          });
        }
      }
      scoreTable.factors.forEach((f) => {
        f.weight = weights[f.source] ?? 1.0;
        f.total = f.weight * f.value;
        if (f.max) {
          f.total = Math.min(f.total, f.max);
        }
      });
      if (tableResponse.tags.includes(MoveTag.BestMove)) {
        scoreTable.factors.push({
          // @ts-ignore
          source: "BestMove",
          // weight: 1.0,
          // value: 0,
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
      tableResponse.score = sumBy(scoreTable.factors, (f) => {
        return f.total;
      });
      if (tableResponse.repertoireMove && tableResponse.repertoireMove?.mine) {
        return tableResponse.score + 1000000;
      } else {
        return tableResponse.score;
      }
    })
  );
};

export const EFFECTIVENESS_WEIGHTS_MASTERS = {
  startScore: 0.0,
  eval: 1.2,
  winrate: 4.0,
  playrate: 0.0,
  masterPlayrate: 8.0,
};

export const EFFECTIVENESS_WEIGHTS_PEERS = {
  ...EFFECTIVENESS_WEIGHTS_MASTERS,
  startScore: 1.0,
  incidence: 0.0,
  eval: 1 / 50,
  winrate: 20.0,
  playrate: 1 / 100,
  masterPlayrate: 0.0,
};

export const PLAYRATE_WEIGHTS = {
  startScore: -3,
  eval: 0.0,
  winrate: 0.0,
  playrate: 0.0,
  needed: 1.0,
  incidence: 1.0,
  masterPlayrate: 0.0,
};

export const shouldUsePeerRates = (pr: PositionReport) => {
  return getTotalGames(pr?.masterResults) < 10;
};
