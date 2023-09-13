import { PAWN, PieceSymbol } from "@lubert/chess.ts";
import {
	KING,
	KNIGHT,
	PAWN_OFFSETS,
	RANK_2,
	RANK_7,
	SQUARES,
} from "@lubert/chess.ts/dist/constants";
import { Square } from "@lubert/chess.ts/dist/types";
import { Side } from "./repertoire";

// biome-ignore format: the array should not be formatted
const Ox88: Record<Square, number> = {
  a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
  a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
  a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
  a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
  a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
  a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
  a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
  a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
}

const SECOND_RANK = { b: RANK_7, w: RANK_2 };

// biome-ignore format: the array should not be formatted
export const SQUARES_LIST: Square[] = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
]

function toRank(square: number): number {
	return square >> 4;
}
function toFile(square: number): number {
	return square & 0xf;
}

// biome-ignore format: the array should not be formatted
const PIECE_OFFSETS: Record<PieceSymbol, number[]> = {
  n: [-18, -33, -31, -14, 18, 33, 31, 14],
  b: [-17, -15, 17, 15],
  r: [-16, 1, 16, -1],
  q: [-17, -16, -15, 1, 17, 16, 15, -1],
  k: [-17, -16, -15, 1, 17, 16, 15, -1],
}

export const getAllPossibleMoves = ({
	piece,
	square: _square,
	side,
}: {
	piece: PieceSymbol;
	square: Square;
	side: Side;
}) => {
	const forPiece = piece?.toLowerCase();

	const square = Ox88[_square.toLowerCase()];

	const moves: Square[] = [];
	const us = side === "white" ? "w" : "b";

	let singleSquare = false;
	singleSquare = true;

	const addMove = (square: number) => {
		moves.push(algebraic(square));
	};

	let to: number;
	if (piece === PAWN) {
		// single square, non-capturing
		to = square + PAWN_OFFSETS[us][0];
		addMove(to);

		to = square + PAWN_OFFSETS[us][1];
		if (SECOND_RANK[us] === toRank(square)) {
			addMove(to);
		}

		// pawn captures
		// for (let j = 2; j < 4; j++) {
		//   to = square + PAWN_OFFSETS[us][j];
		//   if (to & 0x88) continue;
		//
		//   if (this._board[to]?.color === them) {
		//     addMove(
		//       moves,
		//       us,
		//       square,
		//       to,
		//       PAWN,
		//       this._board[to].type,
		//       BITS.CAPTURE,
		//     );
		//   } else if (to === this._epSquare) {
		//     addMove(moves, us, square, to, PAWN, PAWN, BITS.EP_CAPTURE);
		//   }
		// }
	} else {
		for (let j = 0, len = PIECE_OFFSETS[piece].length; j < len; j++) {
			const offset = PIECE_OFFSETS[piece][j];
			to = square;

			while (true) {
				to += offset;
				if (to & 0x88) break;

				addMove(to);
				if (piece === KNIGHT || piece === KING) break;
			}
		}
	}

	/*
	 * check for castling if we're:
	 *   a) generating all moves, or
	 *   b) doing single square move generation on the king's square
	 */

	// if (forPiece === undefined || forPiece === KING) {
	//   if (!singleSquare || lastSquare === this._kings[us]) {
	//     // king-side castling
	//     if (this._castling[us] & BITS.KSIDE_CASTLE) {
	//       const castlingFrom = this._kings[us];
	//       const castlingTo = castlingFrom + 2;
	//
	//       if (
	//         !this._board[castlingFrom + 1] &&
	//         !this._board[castlingTo] &&
	//         !this._attacked(them, this._kings[us]) &&
	//         !this._attacked(them, castlingFrom + 1) &&
	//         !this._attacked(them, castlingTo)
	//       ) {
	//         addMove(
	//           moves,
	//           us,
	//           this._kings[us],
	//           castlingTo,
	//           KING,
	//           undefined,
	//           BITS.KSIDE_CASTLE,
	//         );
	//       }
	//     }
	//
	//     // queen-side castling
	//     if (this._castling[us] & BITS.QSIDE_CASTLE) {
	//       const castlingFrom = this._kings[us];
	//       const castlingTo = castlingFrom - 2;
	//
	//       if (
	//         !this._board[castlingFrom - 1] &&
	//         !this._board[castlingFrom - 2] &&
	//         !this._board[castlingFrom - 3] &&
	//         !this._attacked(them, this._kings[us]) &&
	//         !this._attacked(them, castlingFrom - 1) &&
	//         !this._attacked(them, castlingTo)
	//       ) {
	//         addMove(
	//           moves,
	//           us,
	//           this._kings[us],
	//           castlingTo,
	//           KING,
	//           undefined,
	//           BITS.QSIDE_CASTLE,
	//         );
	//       }
	//     }
	//   }
	// }

	console.log("returning ", moves);
	return moves;
};

export function algebraic(square: number): Square {
	const f = toFile(square);
	const r = toRank(square);
	return ("abcdefgh".substring(f, f + 1) +
		"87654321".substring(r, r + 1)) as Square;
}
