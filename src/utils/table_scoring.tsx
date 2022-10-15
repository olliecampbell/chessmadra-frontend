import { ScoreTable, TableResponse } from "app/components/RepertoireMovesTable";
import { PositionReport } from "app/models";
import { isNil, sumBy, reverse, sortBy } from "lodash-es";
import { Side } from "./repertoire";
import { getPlayRate, getTotalGames, getWinRate } from "./results_distribution";

export enum TableResponseScoreSource {
  Start = "start",
  Eval = "eval",
  Winrate = "winrate",
  Playrate = "playrate",
  MasterPlayrate = "masterPlayrate",
}

export const scoreTableResponses = (
  tableResponses: TableResponse[],
  report: PositionReport,
  side: Side,
  epd: string,
  weights: {
    startScore: number;
    eval: number;
    winrate: number;
    playrate: number;
    masterPlayrate: number;
  }
): TableResponse[] => {
  let positionWinRate = report ? getWinRate(report?.results, side) : NaN;
  let DEBUG_MOVE = null;
  return reverse(
    sortBy(tableResponses, (tableResponse: TableResponse) => {
      // let san =
      //   tableResponse.suggestedMove?.sanPlus ??
      //   tableResponse.repertoireMove?.sanPlus;
      // return failOnAny(san);
      let score = weights.startScore;
      let scoreTable = { factors: [], notes: [] } as ScoreTable;
      if (isNil(report)) {
        return score;
      }
      let suggestedMove = tableResponse.suggestedMove;
      if (suggestedMove) {
        let evalOverride = false;
        let masterPlayRate = getPlayRate(
          tableResponse?.suggestedMove,
          report,
          true
        );
        if (!isNil(masterPlayRate)) {
          let masterRateAdditionalWeight = Math.min(
            getTotalGames(tableResponse.suggestedMove?.masterResults) / 100,
            1
          );
          let scoreForMasterPlayrate =
            masterPlayRate * 100 * masterRateAdditionalWeight;
          scoreTable.factors.push({
            source: TableResponseScoreSource.MasterPlayrate,
            value: scoreForMasterPlayrate,
          });
          if (weights.masterPlayrate > 0 && masterPlayRate > 0.03) {
            evalOverride = true;
          }
        }
        let stockfish = tableResponse.suggestedMove?.stockfish;
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
            let eval_loss = Math.abs(
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
        let rateAdditionalWeight = Math.min(
          getTotalGames(tableResponse?.suggestedMove.results) / 100,
          1
        );
        let playRate = getPlayRate(tableResponse.suggestedMove, report);
        if (!isNil(playRate)) {
          let scoreForPlayrate = playRate * 100 * rateAdditionalWeight;
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
        let moveWinRate = getWinRate(
          tableResponse.suggestedMove?.results,
          side
        );
        let winrateChange = moveWinRate - positionWinRate;
        let scoreForWinrate = winrateChange * 100 * rateAdditionalWeight;
        if (getTotalGames(suggestedMove.results) > 10) {
          scoreTable.factors.push({
            source: TableResponseScoreSource.Winrate,
            value: scoreForWinrate,
          });
        }
      }
      scoreTable.factors.forEach((f) => {
        f.weight = weights[f.source] ?? 1.0;
        f.total = f.weight * f.value;
      });
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

export let EFFECTIVENESS_WEIGHTS_MASTERS = {
  startScore: 0.0,
  eval: 1.2,
  winrate: 4.0,
  playrate: 0.0,
  masterPlayrate: 8.0,
};

export let EFFECTIVENESS_WEIGHTS_PEERS = {
  ...EFFECTIVENESS_WEIGHTS_MASTERS,
  playrate: 8.0,
  masterPlayrate: 0.0,
};

export let PLAYRATE_WEIGHTS = {
  startScore: -3,
  eval: 0.0,
  winrate: 0.0,
  playrate: 1.0,
  masterPlayrate: 0.0,
};

export const shouldUsePeerRates = (pr: PositionReport) => {
  return getTotalGames(pr?.masterResults) < 10;
};
