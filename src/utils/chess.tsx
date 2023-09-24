import { Chess, Move } from "@lubert/chess.ts";
import { dropRight, forEach, indexOf, last } from "lodash-es";
import { COLUMNS, ROWS } from "../types/Chess";
import { RawSquare } from "./move_generation";

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
	const position = new Chess();
	const positions = [START_EPD];
	forEach(line, (move) => {
		position.move(move, { sloppy: true });
		positions.push(genEpd(position));
	});
	return positions;
};

export const isCheckmate = (move: Move, position: Chess) => {
	position.move(move);
	const isCheckMate = position.inCheckmate();
	position.undo();
	return isCheckMate;
};

export function genEpd(position: Chess): string {
	const fen = position.fen();
	const fenParts = dropRight(fen.split(" "), 2);

	let found_ep = false;
	// @ts-ignore
	const lastMove = last(position._history);
	if (
		lastMove &&
		lastMove.move.piece === "p" &&
		((RawSquare.toRank(lastMove.move.to) === 3 &&
			lastMove.move.color === "b") ||
			(RawSquare.toRank(lastMove.move.to) === 4 && lastMove.move.color === "w"))
	) {
		const legal_moves = position.moves({ verbose: true });

		for (const i in legal_moves) {
			const legal_move = legal_moves[i];

			if (legal_move.flags.includes("e")) {
				found_ep = true;
				break;
			}
		}
	} else {
	}
	if (!found_ep) {
		fenParts[3] = "-";
	}
	return fenParts.join(" ");
}

export const START_EPD = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
