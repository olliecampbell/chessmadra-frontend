import { COLUMNS, ROWS } from "../types/Chess";
import { dropRight, forEach, indexOf } from "lodash-es";
import { Chess, Move } from "@lubert/chess.ts";

export const getSquareOffset = (square: string, flipped: boolean) => {
  const [file, rank] = square.split("");
  let x = indexOf(COLUMNS, file);
  let y = 7 - indexOf(ROWS, parseInt(rank));
  if (flipped) {
    x = 7 - x;
    y = 7 - y;
  }
  return { x: x / 8, y: y / 8 };
};

export const lineToPositions = (line: string[]) => {
  let position = new Chess();
  let positions = [START_EPD];
  forEach(line, (move) => {
    position.move(move);
    positions.push(genEpd(position));
  });
  return positions;
};

export const isCheckmate = (move: Move, position: Chess) => {
  position.move(move);
  let isCheckMate = position.inCheckmate();
  position.undo();
  return isCheckMate;
};

export function genEpd(position: Chess): string {
  let fen = position.fen();
  let fenParts = dropRight(fen.split(" "), 2);

  let found_ep = false;
  const legal_moves = position.moves({ verbose: true });

  for (const i in legal_moves) {
    const legal_move = legal_moves[i];

    if (legal_move.flags.includes("e")) {
      found_ep = true;
      break;
    }
  }

  if (!found_ep) {
    fenParts[3] = "-";
  }
  return fenParts.join(" ");
}

export const START_EPD = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
