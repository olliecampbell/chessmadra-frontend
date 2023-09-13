import { isNil } from "lodash-es";
import { Match, Switch } from "solid-js";
import { CMText } from "~/components/CMText";
import { initTooltip } from "~/components/Tooltip";
import { PositionReport, StockfishReport, SuggestedMove } from "~/utils/models";
import { c, s } from "~/utils/styles";
import { Side } from "./repertoire";

export const getWinPercentage = (
	stockfish: StockfishReport,
	side: Side,
): number => {
	const p = getUnsidedWinPercentage(stockfish, side);
	if (side === "black") {
		return 100 - p;
	} else {
		return p;
	}
};

const getUnsidedWinPercentage = (
	stockfish: StockfishReport,
	side: Side,
): number => {
	if (!isNil(stockfish.mate)) {
		if (stockfish.mate === 0) {
			return side === "white" ? 100 : 0;
		}
		if (stockfish.mate > 0) {
			return 100;
		} else {
			return 0;
		}
	}
	return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * stockfish.eval)) - 1);
};

export enum MoveRating {
	Inaccuracy = 0,
	Mistake = 1,
	Blunder = 2,
}

export const getMoveRating = (
	positionReport: PositionReport,
	bestStockfishReport: StockfishReport | undefined,
	suggestedMove: SuggestedMove,
	side: Side,
) => {
	const before = bestStockfishReport;
	const after = suggestedMove?.stockfish;
	// Modern
	if (
		positionReport?.epd ===
			"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -" &&
		suggestedMove?.sanPlus === "g6"
	) {
		return null;
	}
	// Scandi
	if (
		positionReport?.epd ===
			"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -" &&
		suggestedMove?.sanPlus === "d5"
	) {
		return null;
	}
	// Pirc
	if (
		positionReport?.epd ===
			"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -" &&
		suggestedMove?.sanPlus === "d6"
	) {
		return null;
	}
	if (isNil(before) || isNil(after)) {
		return null;
	}
	const expectedWinBefore = getWinPercentage(before, side);
	const expectedWinAfter = getWinPercentage(after, side);
	if (expectedWinAfter < expectedWinBefore - 20) {
		return MoveRating.Blunder;
	}
	if (expectedWinAfter < expectedWinBefore - 12) {
		return MoveRating.Mistake;
	}
	if (expectedWinAfter < expectedWinBefore - 6) {
		return MoveRating.Inaccuracy;
	}
};

export const getMoveRatingIcon = (rating: MoveRating) => {
	const styles = s(c.weightBold, c.fontSize(14));
	return (
		<div
			ref={(ref) => {
				initTooltip({
					ref,
					content: () => (
						<p>
							This move is{" "}
							{rating === MoveRating.Inaccuracy ? (
								<>
									an <b>inaccuracy</b>
								</>
							) : (
								<>
									a{" "}
									<b>{rating === MoveRating.Mistake ? "mistake" : "blunder"}</b>
								</>
							)}
						</p>
					),
					maxWidth: 200,
				});
			}}
		>
			<Switch>
				<Match when={rating === MoveRating.Inaccuracy}>
					<CMText style={s(c.fg(c.yellow[60]), styles)}>?!</CMText>
				</Match>
				<Match when={rating === MoveRating.Mistake}>
					<CMText style={s(c.fg(c.orange[60]), styles)}>?</CMText>
				</Match>
				<Match when={rating === MoveRating.Blunder}>
					<CMText style={s(c.fg(c.red[60]), styles)}>??</CMText>
				</Match>
			</Switch>
		</div>
	);
};
