import { isNil } from "lodash-es";
import { StockfishReport } from "~/utils/models";
import { Side } from "./repertoire";

export function formatStockfishEval(stockfish: StockfishReport, side: Side) {
	// let debug = failOnTrue(false);
	const debug = false;
	let x = "";
	if (stockfish?.mate === 0) {
		return side === "white" ? "1-0" : "0-1";
	}
	if (!isNil(stockfish?.eval)) {
		const rounded = (stockfish.eval / 100).toFixed(1);
		if (rounded === "0.0" || rounded === "-0.0") {
			x = "=";
		} else if (stockfish.eval > 0) {
			x = `+${rounded}`;
		} else {
			x = `${rounded}`;
		}
	} else if (stockfish?.mate) {
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
