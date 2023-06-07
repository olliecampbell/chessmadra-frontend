import { PositionReport, StockfishReport, SuggestedMove } from "~/utils/models";
import { c, s } from "~/utils/styles";
import { isNil } from "lodash-es";
import { CMText } from "~/components/CMText";
import { Side } from "./repertoire";

export const getWinPercentage = (
  stockfish: StockfishReport,
  side: Side
): number => {
  const p = getUnsidedWinPercentage(stockfish);
  if (side === "black") {
    return 100 - p;
  } else {
    return p;
  }
};

const getUnsidedWinPercentage = (stockfish: StockfishReport): number => {
  if (stockfish.mate) {
    if (stockfish.mate > 0) {
      return 100;
    } else {
      return 0;
    }
  }
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * stockfish.eval)) - 1);
};

export enum MoveRating {
  Inaccuracy,
  Mistake,
  Blunder,
}

export const getMoveRating = (
  positionReport: PositionReport,
  suggestedMove: SuggestedMove,
  side: Side
) => {
  const before = positionReport?.stockfish;
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
  const styles = s(c.weightBold, c.fontSize(16));
  switch (rating) {
    case MoveRating.Inaccuracy:
      return <CMText style={s(c.fg(c.grays[55]), styles)}>?!</CMText>;
    case MoveRating.Mistake:
      return <CMText style={s(c.fg(c.yellows[60]), styles)}>?</CMText>;
    case MoveRating.Blunder:
      return <CMText style={s(c.fg(c.reds[55]), styles)}>??</CMText>;

    default:
      break;
  }
};
