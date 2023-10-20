import { Chess, Move } from "@lubert/chess.ts";
import { PuzzleFetchOptions } from "~/utils/api";
import { ChessboardInterface } from "~/utils/chessboard_interface";
import { LichessPuzzle } from "~/utils/models";
import { PuzzleState, PuzzleStateDelegate } from "~/utils/puzzle_state";
import { StorageItem } from "~/utils/storageItem";

export type VisualizationState = {
	pulsePlay: boolean;
	puzzleState: PuzzleState;
	startedSolving: boolean;
	chessboard: ChessboardInterface;

	mockPassFail: boolean;
	helpOpen: boolean;
	showPuzzlePosition: boolean;
	currentPosition: Chess;
	isDone: boolean;
	plyUserSetting: StorageItem<number>;
	ratingGteUserSetting: StorageItem<number>;
	ratingLteUserSetting: StorageItem<number>;
	playbackSpeedUserSetting: StorageItem<PlaybackSpeed>;
	hiddenMoves: Move[];
	showHelpButton: boolean;
	autoPlay: boolean;
	nextPuzzle: LichessPuzzle | null;
	isPlaying: boolean;
	focusedMoveIndex: number | null;
	focusedMove: Move | null;
	canFocusNextMove: boolean;
	canFocusLastMove: boolean;
	showNotation: StorageItem<boolean>;
	getFetchOptions: () => Promise<PuzzleFetchOptions>;
	getPly: () => number;
	resetState: () => void;
	refreshPuzzle: () => void;
	startLoopingPlayFlash: () => void;
	stopLoopingPlayFlash: () => void;
	quick: (fn: (s: VisualizationState) => void) => void;
	setupForPuzzle: () => void;
	finishedAutoPlaying: boolean;
	toggleNotation: () => void;
	visualizeHiddenMoves: (callback?: () => void) => void;
	setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) => void;
	updatePly: (increment: number) => void;

	// Climb stuff
	isPlayingClimb?: boolean;
	delta?: number;
	climb?: Step[];
	score?: StorageItem<number>;
	highScore?: StorageItem<number>;
	step?: Step;
	puzzleStartTime?: number;
	lastPuzzleSuccess?: boolean;
	currentPuzzleFailed?: boolean;
	startPlayingClimb?: () => void;
	onFail?: () => void;
	onSuccess?: () => void;
	animatePointChange?: () => void;
	onAutoPlayEnd?: () => void;
	initState?: () => void;
	updateStep?: () => void;
} & PuzzleStateDelegate;

interface Step {
	puzzleDifficulty: number;
	hiddenMoves: number;
}

export interface ProgressMessage {
	message: string;
	prompt?: string;
	onPromptPress?: () => void;
	type: ProgressMessageType;
}
export enum ProgressMessageType {
	Error = 0,
	Success = 1,
}

export enum PuzzleDifficulty {
	Beginner = "Beginner",
	Intermediate = "Intermediate",
	Expert = "Expert",
	Magnus = "Magnus",
}

export enum PlaybackSpeed {
	DebugSlow = "debug-slow",
	Slow = "slow",
	Normal = "normal",
	Fast = "fast",
	Ludicrous = "ludicrous",
}

export const getPuzzleDifficultyRating = (pd: PuzzleDifficulty) => {
	switch (pd) {
		case PuzzleDifficulty.Beginner:
			return 0;
		case PuzzleDifficulty.Intermediate:
			return 1200;
		case PuzzleDifficulty.Expert:
			return 1800;
		case PuzzleDifficulty.Magnus:
			return 2500;
	}
};

export const getPuzzleDifficultyStepValue = (pd: PuzzleDifficulty) => {
	switch (pd) {
		case PuzzleDifficulty.Beginner:
			return 0;
		case PuzzleDifficulty.Intermediate:
			return 1;
		case PuzzleDifficulty.Expert:
			return 2;
		case PuzzleDifficulty.Magnus:
			return 3;
	}
};

export const stepValueToPuzzleDifficulty = (v: number) => {
	switch (v) {
		case 0:
			return PuzzleDifficulty.Beginner;
		case 1:
			return PuzzleDifficulty.Intermediate;
		case 2:
			return PuzzleDifficulty.Expert;
		case 3:
			return PuzzleDifficulty.Magnus;
	}
};
