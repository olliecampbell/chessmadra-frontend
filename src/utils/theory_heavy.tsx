import { TableResponse } from "~/components/RepertoireMovesTable";

export const isTheoryHeavy = (tr: TableResponse, epd: string) => {
  const sanPlus = tr.repertoireMove?.sanPlus ?? tr.suggestedMove?.sanPlus;
  if (
    epd == "rnbqkb1r/pppppp1p/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR b KQkq -" &&
    sanPlus == "d5"
  ) {
    return true;
  }
  if (
    epd == "rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq -" &&
    sanPlus == "a6"
  ) {
    return true;
  }
  return false;
};
