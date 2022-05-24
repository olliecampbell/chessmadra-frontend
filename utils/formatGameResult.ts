import { GameSearchResult } from "./state";

export function formatGameResult(r: GameSearchResult) {
  switch (r) {
    case GameSearchResult.White:
      return "White wins";
    case GameSearchResult.Black:
      return "Black wins";
    case GameSearchResult.Draw:
      return "Draw";
    default:
      break;
  }
}
