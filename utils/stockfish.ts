import { isNil } from "lodash";
import { StockfishReport } from "app/models";

export function formatStockfishEval(stockfish: StockfishReport) {
  // let debug = failOnTrue(false);
  let debug = false;
  let x = "";
  if (!isNil(stockfish.eval)) {
    if (stockfish.eval >= 0) {
      x = `+${(stockfish.eval / 100).toFixed(2)}`;
    } else {
      x = `${(stockfish.eval / 100).toFixed(2)}`;
    }
  } else if (stockfish.mate) {
    if (stockfish.mate < 0) {
      x = `-M${Math.abs(stockfish.mate)}`;
    } else {
      x = `M${stockfish.mate}`;
    }
  }
  if (debug) {
    x += ` (${stockfish.nodesK}k)`;
  }
  return x;
}
