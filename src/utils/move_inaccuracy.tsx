import { StockfishReport } from "app/models";
import { c, s } from "app/styles";
import { isNil } from "lodash-es";
import { CMText } from "app/components/CMText";
import { Side } from "./repertoire";

export const getWinPercentage = (
  stockfish: StockfishReport,
  side: Side
): number => {
  let p = getUnsidedWinPercentage(stockfish);
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
  before: StockfishReport,
  after: StockfishReport,
  side: Side
) => {
  if (isNil(before) || isNil(after)) {
    return null;
  }
  let winBefore = getWinPercentage(before, side);
  let winAfter = getWinPercentage(after, side);
  if (winAfter < winBefore - 20) {
    return MoveRating.Blunder;
  }
  if (winAfter < winBefore - 10) {
    return MoveRating.Mistake;
  }
  if (winAfter < winBefore - 6) {
    return MoveRating.Inaccuracy;
  }
};

export const getMoveRatingIcon = (rating: MoveRating) => {
  let styles = s(c.weightBold, c.fontSize(16));
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
