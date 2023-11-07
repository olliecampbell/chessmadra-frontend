import { Chess, Move, Piece, SQUARES } from "@lubert/chess.ts";
import {
	cloneDeep,
	find,
	every,
	filter,
	findIndex,
	forEach,
	includes,
	mapValues,
	noop,
	some,
	takeRight,
	isEmpty,
	sortBy,
} from "lodash-es";
import { fensTheSame } from "~/utils/fens";
import { StorageItem } from "~/utils/storageItem";

import { PuzzleFetchOptions, fetchNewPuzzle } from "./api";
import { AppState } from "./app_state";
import {
	ChessboardInterface,
	createChessboardInterface,
} from "./chessboard_interface";
import { LichessPuzzle } from "./models";
import { PuzzleState, getInitialPuzzleState } from "./puzzle_state";
import { createQuick } from "./quick";
import { otherSide, toSide } from "./repertoire";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { DEBUG_PASS_FAIL_BUTTONS } from "./test_settings";
import { createChessProxy } from "./chess_proxy";
import { PlaybackSpeed } from "~/types/PlaybackSpeed";
import { PieceSymbol, Square } from "@lubert/chess.ts/dist/types";
import { JSXElement } from "solid-js";
import { c } from "./styles";
import { getSquareLookers } from "./move_generation";
import { isDevelopment } from "./env";
import { useIsMobileV2 } from "./isMobile";
import { isNumberObject } from "util/types";

const isMobile = useIsMobileV2();

type Stack = [VisionState, AppState];

let MOCK_POSITION =
	true &&
	isDevelopment &&
	"rnb1k2r/3pqpbp/1p4p1/8/pPBN4/1N2P3/P1P2PPP/R2QK2R w KQkq - 0 14";

export type VisionState = {
	puzzle: LichessPuzzle | null;
	quiz: VisionQuiz | null;
	chessboard: ChessboardInterface;
	nextPuzzle: LichessPuzzle | null;
	getFetchOptions: () => Promise<PuzzleFetchOptions>;
	resetState: () => void;
	refreshPuzzle: () => void;
	quick: (fn: (s: VisionState) => void) => void;
	setupForPuzzle: () => void;
};

export const getInitialVisionState = (
	_set: StateSetter<AppState, any>,
	_get: StateGetter<AppState, any>,
	isClimb: boolean,
) => {
	const set = <T,>(fn: (stack: Stack) => T): T => {
		return _set((s) => fn([s.trainersState.visionState, s]));
	};
	const setOnly = <T,>(fn: (stack: VisionState) => T): T => {
		return set(([s]) => fn(s));
	};
	const get = <T,>(fn: (stack: Stack) => T): T => {
		return _get((s) => fn([s.trainersState.visionState, s]));
	};
	const initialState = {
		// @ts-ignore
		chessboard: null as ChessboardInterface,
		puzzle: null,
		quiz: null,
		nextPuzzle: null,
		getFetchOptions: () =>
			get(([s]) => {
				return Promise.resolve({
					ratingGte: 1000,
					ratingLte: 2500,
				});
			}),
		resetState: () => {
			set(([state]) => {});
		},
		refreshPuzzle: () =>
			set(async ([s]) => {
				s.chessboard.colorSquare(null);
				let p = s.nextPuzzle;
				if (!p) {
					const fetchOptions = await s.getFetchOptions();
					p = await fetchNewPuzzle(fetchOptions);
				}
				set(([s]) => {
					if (!p) {
						window.alert(
							"Problem fetching puzzles, please report this if you run into it, to me@mbuffett.com",
						);
						return;
					}
					s.puzzle = p;
					s.resetState();
					s.setupForPuzzle();
				});
			}),
		...createQuick(setOnly),
		setupForPuzzle: () =>
			set(([s]) => {
				const puzzle = s.puzzle;
				if (!puzzle) {
					return;
				}
				let puzzlePosition = createChessProxy(new Chess(puzzle!.fen));
				puzzlePosition.move(puzzle?.moves[0]);
				s.chessboard.setPosition(puzzlePosition);
				if (MOCK_POSITION) {
					let mockPosition = createChessProxy(new Chess(MOCK_POSITION));
					s.chessboard.setPosition(mockPosition);
				}
				s.quiz = VisionQuiz.createVisionQuiz(
					s.chessboard.get((s) => s.position),
				);
				MOCK_POSITION = null;
			}),
	} as VisionState;

	initialState.chessboard = createChessboardInterface()[1];
	initialState.chessboard.set((c) => {
		c.delegate = {
			completedMoveAnimation: noop,
			onPositionUpdated: () => {
				set(([s]) => {});
			},

			madeManualMove: () => {
				get(([s]) => {});
			},
			onBack: () => {
				set(([s]) => {});
			},
			onReset: () => {
				set(([s]) => {});
			},
			tappedSquare: (square) => {
				set(([s]) => {
					if (!s.quiz) {
						return;
					}
					const activeStepIndex = findIndex(s.quiz.steps, (s) => s.active);
					const activeStep = s.quiz.steps[activeStepIndex];
					const correct = some(activeStep?.parts, (p) => {
						if (p.square === square) {
							p.complete = true;
							let color = VisionQuiz.getColorsForStep(activeStep.type);
							s.chessboard.colorSquare(square, color, 80);
							return true;
						}
					});
					if (every(activeStep?.parts, (p) => p.complete)) {
						activeStep.complete = true;
						activeStep.active = false;
						const next = find(s.quiz.steps, (s) => !s.complete);
						if (next) {
							next.active = true;
						}
					}
					if (isMobile()) {
						s.quiz.steps = sortBy(s.quiz.steps, (s) => (s.complete ? 1 : 0));
					}
					s.chessboard.showMoveFeedback(
						{
							square,
							result: correct ? "correct" : "incorrect",
							size: "small",
						},
						() => {},
					);
				});
			},
			onMovePlayed: () => {
				set(([s, rs]) => {});
			},
			shouldMakeMove: (move: Move) => set(([s]) => {}),
		};
	});

	initialState.chessboard.set((c) => {
		c.frozen = false;
	});
	initialState.chessboard.setMode("tap");
	return initialState;
};

type VisionQuiz = {
	steps: VisionQuizStep[];
};

type UndefendedPiecesVision = {
	type: "UNDEFENDED_PIECES";
	squares: Square[];
};

type VisionQuizType =
	| "hanging_pieces"
	| "hanging_pawns"
	| "undefended_pieces"
	| "undefended_pawns"
	| "under-defended-pawns"
	| "under-defended-pieces"
	| "overloaded pawns"
	| "backward pawns"
	| "checks";

export const VISION_QUIZ_STEPS: VisionQuizType[] = [
	"hanging_pieces",
	"hanging_pawns",
	"under-defended-pieces",
	"under-defended-pawns",
	"undefended_pieces",
	"undefended_pawns",
	"overloaded pawns",
	// "backward pawns",
	// "checks",
];

export type VisionQuizStep = {
	type: VisionQuizType;
	complete: boolean;
	active: boolean;
	parts: VisionQuizPart[];
};
export type VisionQuizPart =
	| {
			square: Square;
			complete: boolean;
	  }
	| {
			moves: Move;
			complete: boolean;
	  };

export type VisionQuizColors = string;

export namespace VisionQuiz {
	export const getTitleForStep = (type: VisionQuizType): JSXElement => {
		switch (type) {
			case "hanging_pieces":
				return "Hanging pieces";
			case "hanging_pawns":
				return "Hanging pawns";
			case "undefended_pieces":
				return "Undefended pieces";
			case "undefended_pawns":
				return "Undefended pawns";
			case "overloaded pawns":
				return "Overloaded pawns";
			case "backward pawns":
				return "Backward pawns";
			case "under-defended-pieces":
				return "Under-defended pieces";
			case "checks":
				return "Checks";
			case "under-defended-pawns":
				return "Under-defended pawns";
			default: {
				const _check: never = type;
				return _check;
			}
		}
	};
	export const getDescriptionForStep = (type: VisionQuizType): JSXElement => {
		switch (type) {
			case "hanging_pieces":
				return "Tap on the pieces which are hanging - attacked with no defender, or attacked by a lower-value piece";
			case "undefended_pieces":
				return "Tap on the pieces which have no defenders";
			case "undefended_pawns":
				return "Tap on the pawns which have no defenders";
			case "overloaded pawns":
				return "Tap on the pawns which are overloaded";
			case "backward pawns":
				return "Tap on the pawns which are backward";
			case "under-defended-pieces":
				return "Tap on the pieces which are under-defended";
			case "checks":
				return "Tap on the squares where check can be made";
			case "under-defended-pawns":
				return "Tap on the pawns which are under-defended";
			case "hanging_pawns":
				return "Tap on the pawns which are hanging";
			default: {
				const _check: never = type;
				return _check;
			}
		}
	};
	export const getColorsForStep = (type: VisionQuizType): VisionQuizColors => {
		switch (type) {
			case "hanging_pieces":
				return c.colors.red[50];
			case "hanging_pawns":
				return c.colors.red[70];
			case "undefended_pieces":
				return c.colors.blue[50];
			case "undefended_pawns":
				return c.colors.blue[60];
			case "overloaded pawns":
				return c.colors.blue[50];
			case "backward pawns":
				return c.colors.purple[50];
			case "checks":
				return c.colors.red[50];
			case "under-defended-pawns":
				return c.colors.orange[50];
			case "under-defended-pieces":
				return c.colors.orange[50];
			default: {
				const _check: never = type;
				return _check;
			}
		}
	};
	export const createVisionQuiz = (position: Chess): VisionQuiz => {
		const activeSide = toSide(position.turn());
		const opponentSide = otherSide(activeSide);
		let steps: VisionQuizStep[] = [];
		// @ts-ignore
		const squareAttackers: Record<Square, Piece[]> = {};
		// @ts-ignore
		Object.keys(SQUARES).forEach((square: Square) => {
			if (square == "b5") {
				// debugger;
			}
			squareAttackers[square] = getSquareLookers(square, position);
		});
		forEach(VISION_QUIZ_STEPS, (type) => {
			steps.push({
				parts: [],
				type: type,
				complete: false,
				active: false,
			});
		});
		mapValues(SQUARES, (_, square) => {
			const lookers = squareAttackers[square as Square];
			const piece = position.get(square);
			const color = piece?.color;
			if (!color) {
				return;
			}
			const attackers: Piece[] = [];
			const defenders: Piece[] = [];
			lookers.forEach((looker) => {
				if (looker.color === color) {
					defenders.push(looker);
				} else {
					attackers.push(looker);
				}
			});
			if (piece.type === "k") {
				return;
			}
			if (
				(attackers.length > 0 && defenders.length === 0) ||
				some(
					attackers,
					(a) => getPieceValue(a.type) < getPieceValue(piece.type),
				)
			) {
				const type = piece.type === "p" ? "hanging_pawns" : "hanging_pieces";
				addPart(steps, type, {
					square: square as Square,
					complete: false,
				});
				return;
			}
			if (attackers.length > defenders.length) {
				addPart(
					steps,
					piece.type === "p" ? "under-defended-pawns" : "under-defended-pieces",
					{
						square: square as Square,
						complete: false,
					},
				);
				return;
			}
			if (defenders.length === 0) {
				addPart(
					steps,
					piece.type === "p" ? "undefended_pawns" : "undefended_pieces",
					{
						square: square as Square,
						complete: false,
					},
				);
				return;
			}
		});
		steps = filter(steps, (s) => !isEmpty(s.parts));
		steps[0].active = true;
		return {
			steps,
		};
	};
}

function addPart(
	steps: VisionQuizStep[],
	type: VisionQuizType,
	part: VisionQuizPart,
) {
	const step = find(steps, (s) => s.type === type);
	step!.parts.push(part);
}

function getPieceValue(piece: PieceSymbol) {
	switch (piece) {
		case "p":
			return 1;
		case "n":
			return 3;
		case "b":
			return 3;
		case "r":
			return 5;
		case "q":
			return 9;
		case "k":
			return 100;
		default:
			return 0;
	}
}
