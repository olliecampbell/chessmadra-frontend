import { COLUMNS, ROWS } from "../types/Chess";
import { indexOf } from "lodash";
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

export const isCheckmate = (move: Move, position: Chess) => {
  position.move(move);
  let isCheckMate = position.inCheckmate();
  position.undo();
  return isCheckMate;
};
