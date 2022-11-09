import { isNil } from "lodash-es";
import { StockfishReport } from "app/models";

export function formatStockfishEval(stockfish: StockfishReport) {
  // let debug = failOnTrue(false);
  let debug = false;
  let x = "";
  if (!isNil(stockfish.eval)) {
    let rounded = (stockfish.eval / 100).toFixed(1);
    if (rounded === "0.0") {
      x = `=`;
    } else if (stockfish.eval > 0) {
      x = `+${rounded}`;
    } else {
      x = `${rounded}`;
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
