import { Chess, Color, Move } from "@lubert/chess.ts";
import { isEmpty, noop } from "lodash-es";
import {
	PlaybackSpeed,
	ProgressMessage,
	ProgressMessageType,
} from "~/types/VisualizationState";
import { isCheckmate } from "../utils/chess";
import { ChessboardDelegate } from "./chessboard_interface";
import { LichessPuzzle } from "./models";
import { StateGetter, StateSetter } from "./state_setters_getters";

export interface PuzzleState extends ChessboardDelegate {
	puzzlePosition: Chess;
	turn: Color;
	solutionMoves: Move[];
	puzzle: LichessPuzzle | null;
	progressMessage: ProgressMessage | null;
	delegate: PuzzleStateDelegate;
	shouldMakeMove: (move: Move) => boolean;
}

export interface PuzzleStateDelegate {
	onPuzzleMoveSuccess: () => void;
	onPuzzleMoveFailure: (move: Move) => void;
	onPuzzleSuccess: () => void;
	animatePieceMove: (
		move: Move,
		speed: PlaybackSpeed,
		callback: (completed: boolean) => void,
	) => void;
}

export const getInitialPuzzleState = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_set: StateSetter<PuzzleState, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_get: StateGetter<PuzzleState, any>,
) => {
	const set = <T,>(fn: (s: PuzzleState) => T, id?: string): T => {
		return _set((s) => fn(s));
	};
	const setOnly = <T,>(fn: (stack: PuzzleState) => T, id?: string): T => {
		return _set((s) => fn(s));
	};
	const get = <T,>(fn: (stack: PuzzleState) => T, id?: string): T => {
		return _get((s) => fn(s));
	};
	return {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delegate: null as PuzzleStateDelegate,
		// @ts-ignore
		puzzlePosition: null as Chess,
		turn: "w" as Color,
		shouldMakeMove: (move: Move) =>
			set((s) => {
				if (
					move.san === s.solutionMoves[0].san ||
					isCheckmate(move, s.puzzlePosition)
				) {
					const otherSideMove = s.solutionMoves[1];
					s.puzzlePosition.move(move);
					if (otherSideMove) {
						s.puzzlePosition.move(otherSideMove);
						s.delegate.animatePieceMove(
							otherSideMove,
							PlaybackSpeed.Normal,
							noop,
						);
					}
					s.solutionMoves.shift();
					s.solutionMoves.shift();
					if (!isEmpty(s.solutionMoves)) {
						s.delegate.onPuzzleMoveSuccess();
						s.progressMessage = {
							message: "Keep going...",
							// onPromptPress: noop,
							// prompt: "Give up?",
							type: ProgressMessageType.Error,
						};
					} else {
						s.progressMessage = null;
						s.delegate.onPuzzleMoveSuccess();
						s.delegate.onPuzzleSuccess();
					}
					return true;
				} else {
					s.delegate.onPuzzleMoveFailure(move);
					s.progressMessage = {
						message: `${move.san} was not the right move, try again.`,
						// onPromptPress: noop,
						// prompt: "Give up?",
						type: ProgressMessageType.Error,
					};
				}
				return false;
			}),
		madeMove: noop,
		completedMoveAnimation: noop,
		puzzle: null,
		solutionMoves: [] as Move[],
		progressMessage: null,
	} as PuzzleState;
};
