import { LichessPuzzle } from "~/utils/models";

export const MOCK_WHITE_PUZZLE = {
	id: "zZOzH",
	moves: ["g3f4", "e3e7", "c7e7", "c1f4"],
	fen: "r5k1/ppq1rppp/2p2p2/5P2/3P2PP/1P2R1b1/P1P3B1/R1Q4K b - - 0 24",
	popularity: 93,
	tags: ["advantage", "discoveredAttack", "middlegame", "short"],
	gameLink: "https://lichess.org/L7gkr3JJ/black#48",
	rating: 909,
	ratingDeviation: 92,
	numberPlays: 175,
	allMoves: [
		"e4",
		"c6",
		"Nf3",
		"d5",
		"Nc3",
		"dxe4",
		"Nxe4",
		"Nf6",
		"Nxf6+",
		"exf6",
		"d3",
		"Bf5",
		"Be3",
		"Bd6",
		"g3",
		"O-O",
		"Bg2",
		"Nd7",
		"O-O",
		"Ne5",
		"Nh4",
		"Bg4",
		"f3",
		"Bh5",
		"g4",
		"Bg6",
		"Nxg6",
		"Nxg6",
		"f4",
		"Re8",
		"Re1",
		"Qa5",
		"f5",
		"Ne5",
		"d4",
		"Nc4",
		"Qc1",
		"Qc7",
		"h4",
		"Bh2+",
		"Kh1",
		"Bg3",
		"Re2",
		"Re7",
		"b3",
		"Nxe3",
		"Rxe3",
		"Bf4",
		"Rxe7",
	],
	maxPly: 46,
	whiteRating: 1675,
	blackRating: 1648,
	pieceCount: 24,
	solidMoves: 2,
} as LichessPuzzle;
export const MOCK_BLACK_PUZZLE = {
	id: "zXK6g",
	moves: ["a1c1", "c3e2", "g1h1", "e2c1"],
	fen: "3r1rk1/R4pp1/4p2p/8/8/2n2N1P/P4PP1/R5K1 w - - 0 24",
	popularity: 100,
	tags: ["crushing", "endgame", "fork", "short"],
	gameLink: "https://lichess.org/s1Cm498t#47",
	rating: 938,
	ratingDeviation: 78,
	numberPlays: 337,
	allMoves: [
		"d4",
		"d5",
		"Nf3",
		"Nf6",
		"e3",
		"Bf5",
		"Bb5+",
		"c6",
		"Be2",
		"h6",
		"O-O",
		"e6",
		"Nc3",
		"Nbd7",
		"h3",
		"Be7",
		"Bd3",
		"Bxd3",
		"Qxd3",
		"O-O",
		"e4",
		"dxe4",
		"Nxe4",
		"Nxe4",
		"Qxe4",
		"Nf6",
		"Qd3",
		"Qb6",
		"c3",
		"Rad8",
		"Be3",
		"Qxb2",
		"Rfb1",
		"Qa3",
		"Rxb7",
		"c5",
		"Rxe7",
		"cxd4",
		"Rb7",
		"dxe3",
		"Qxe3",
		"Nd5",
		"Qxa7",
		"Qxa7",
		"Rxa7",
		"Nxc3",
		"Rc1",
		"Ne2+",
	],
	maxPly: 46,
	whiteRating: 1688,
	blackRating: 1891,
	pieceCount: 16,
	solidMoves: 9,
} as LichessPuzzle;
