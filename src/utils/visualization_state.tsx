import { Chess, Move } from "@lubert/chess.ts";
import { cloneDeep, noop, takeRight } from "lodash-es";
import { fensTheSame } from "~/utils/fens";
import { StorageItem } from "~/utils/storageItem";
import { PuzzleFetchOptions, fetchNewPuzzle } from "./api";
import { AppState } from "./app_state";
import {
	ChessboardInterface,
	createChessboardInterface,
} from "./chessboard_interface";
import { LichessPuzzle } from "./models";
import {
	PuzzleState,
	PuzzleStateDelegate,
	getInitialPuzzleState,
} from "./puzzle_state";
import { createQuick } from "./quick";
import { toSide } from "./repertoire";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { DEBUG_PASS_FAIL_BUTTONS } from "./test_settings";
import { createChessProxy } from "./chess_proxy";
import { PlaybackSpeed } from "~/types/PlaybackSpeed";

type Stack = [VisualizationState, AppState];

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

export const getInitialVisualizationState = (
	_set: StateSetter<AppState, any>,
	_get: StateGetter<AppState, any>,
	isClimb: boolean,
) => {
	const set = <T,>(fn: (stack: Stack) => T): T => {
		return _set((s) => fn([s.trainersState.visualizationState, s]));
	};
	const setOnly = <T,>(fn: (stack: VisualizationState) => T): T => {
		return set(([s]) => fn(s));
	};
	const get = <T,>(fn: (stack: Stack) => T): T => {
		return _get((s) => fn([s.trainersState.visualizationState, s]));
	};
	const setPuzzle = <T,>(fn: (s: PuzzleState) => T): T => {
		return _set((s) => fn(s.trainersState.visualizationState.puzzleState));
	};
	const getPuzzle = <T,>(fn: (s: PuzzleState) => T): T => {
		return _get((s) => fn(s.trainersState.visualizationState.puzzleState));
	};
	const initialState = {
		pulsePlay: true,
		// @ts-ignore
		chessboard: null as ChessboardInterface,
		finishedAutoPlaying: false,
		chessboardState: null,
		puzzleState: getInitialPuzzleState(setPuzzle, getPuzzle),
		isDone: false,
		playButtonFlashAnim: 0,
		mockPassFail: DEBUG_PASS_FAIL_BUTTONS,
		showNotation: new StorageItem("show-notation-v3", true),
		plyUserSetting: new StorageItem("visualization-ply-v3", 2),
		ratingGteUserSetting: new StorageItem("puzzle-rating-gte-v4", 0),
		startedSolving: false,
		ratingLteUserSetting: new StorageItem("puzzle-rating-lte-v4", 1200),
		playbackSpeedUserSetting: new StorageItem(
			"playback-speed-v2",
			PlaybackSpeed.Normal,
		),
		hiddenMoves: [],
		autoPlay: false,
		showHelpButton: true,
		nextPuzzle: null,
		isPlaying: false,
		focusedMoveIndex: null,
		focusedMove: null,
		canFocusNextMove: false,
		canFocusLastMove: false,
		helpOpen: false,
		currentPosition: new Chess(),
		showPuzzlePosition: false,
		getFetchOptions: () =>
			get(([s]) => {
				return Promise.all([
					s.plyUserSetting.valueAsync(),
					s.ratingGteUserSetting.valueAsync(),
					s.ratingLteUserSetting.valueAsync(),
				]).then(([userPly, userRatingGte, userRatingLte]) => {
					const ply = s.step?.hiddenMoves ?? userPly;
					if (s.step) {
						return {
							ratingGte: s.step.puzzleDifficulty - 25,
							ratingLte: s.step.puzzleDifficulty + 25,
							maxPly: ply,
							solidMovesGte: ply,
						};
					}
					return {
						ratingGte: userRatingGte,
						ratingLte: userRatingLte,
						maxPly: ply,
						solidMovesGte: ply,
					};
				});
			}),
		getPly: () =>
			get(([s]) => {
				return s.step?.hiddenMoves ?? s.plyUserSetting.value;
			}),

		resetState: () => {
			set(([state]) => {
				state.showPuzzlePosition = false;
				state.finishedAutoPlaying = false;
				state.isDone = false;
			});
		},
		refreshPuzzle: () =>
			set(async ([s]) => {
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
					// @ts-ignore
					set(([s]) => {
						s.puzzleState.puzzle = p;
						s.resetState();
						s.setupForPuzzle();
					});
				});
			}),
		...createQuick(setOnly),
		visualizeHiddenMoves: (callback) =>
			set(([s]) => {
				s.stopLoopingPlayFlash();
				s.chessboard.visualizeMoves(
					cloneDeep(s.hiddenMoves),
					s.playbackSpeedUserSetting.value ?? PlaybackSpeed.Normal,
					callback,
				);
			}),
		setupForPuzzle: () =>
			set(([state]) => {
				state.chessboard.resetPosition();
				state.chessboard.clearPending();
				state.startedSolving = false;
				state.focusedMoveIndex = null;
				const currentPosition = createChessProxy(new Chess());
				const puzzlePosition = createChessProxy(new Chess());
				const puzzle: LichessPuzzle = state.puzzleState.puzzle as LichessPuzzle;
				for (const move of puzzle.allMoves) {
					currentPosition.move(move);
					puzzlePosition.move(move);
					if (fensTheSame(currentPosition.fen(), puzzle.fen)) {
						puzzlePosition.move(puzzle.moves[0], { sloppy: true });
						currentPosition.move(puzzle.moves[0], { sloppy: true });
						const hiddenMoves = takeRight(
							currentPosition.history({ verbose: true }),
							state.getPly(),
						);
						const boardForPuzzleMoves = puzzlePosition.clone();
						boardForPuzzleMoves.undo();
						for (const solutionMove of puzzle.moves) {
							boardForPuzzleMoves.move(solutionMove, { sloppy: true });
						}
						state.puzzleState.solutionMoves = takeRight(
							boardForPuzzleMoves.history({ verbose: true }),
							puzzle.moves.length - 1,
						);
						// currentPosition.undo()

						state.hiddenMoves = hiddenMoves;
						for (let i = 0; i < state.getPly(); i++) {
							currentPosition.undo();
						}
						// state.currentPosition = currentPosition
						state.currentPosition = currentPosition;
						state.chessboard.set((s) => {
							s.futurePosition = puzzlePosition;
							s.position = currentPosition;
						});
						state.puzzleState.puzzlePosition = puzzlePosition;
						state.showPuzzlePosition = false;
						state.chessboard.setPerspective(toSide(puzzlePosition.turn()));
						break;
					}
				}
				state.puzzleState.turn = state.puzzleState.puzzlePosition.turn();
				state.visualizeHiddenMoves(noop);
				state.startLoopingPlayFlash();
				// @ts-ignore
				if (isClimb && state.isPlayingClimb) {
					state.visualizeHiddenMoves(() => {
						set(([s]) => {
							if (s.onAutoPlayEnd && !s.finishedAutoPlaying) {
								s.onAutoPlayEnd();
							}
							// s.chessboardState.isVisualizingMoves = false;
							s.finishedAutoPlaying = true;
							s.focusedMoveIndex = null;
						});
					});
				}
			}),
		stopLoopingPlayFlash: () =>
			set(([s]) => {
				s.pulsePlay = false;
			}),
		startLoopingPlayFlash: () =>
			set(([s]) => {
				s.pulsePlay = true;
			}),
		toggleNotation: () =>
			set(([s]) => {
				s.showNotation.value = !s.showNotation.value;
			}),
		setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) =>
			set(([s]) => {
				s.playbackSpeedUserSetting.value = playbackSpeed;
			}),
		updatePly: (increment: number) =>
			set(([s]) => {
				s.plyUserSetting.value = Math.max(
					s.plyUserSetting.value + increment,
					1,
				);
				s.setupForPuzzle();
			}),
		onPuzzleMoveSuccess: () => {
			set(([state]) => {
				// TODO: animate piece move
				state.showPuzzlePosition = true;
				state.startedSolving = true;
				state.chessboard.flashRing(true);
				state.chessboard.set((s) => {
					s.futurePosition = null;
					s.position = state.puzzleState.puzzlePosition;
				});
			});
		},
		onPuzzleMoveFailure: (move: Move) => {
			set(([state]) => {
				state.chessboard.flashRing(false);
				if (isClimb) {
					state.onFail?.();
				}
			});
		},
		onPuzzleSuccess: () => {
			set(([state]) => {
				state.isDone = true;
				if (state.onSuccess) {
					state.onSuccess();
				}
			});
		},
	} as VisualizationState;

	initialState.puzzleState = getInitialPuzzleState(setPuzzle, getPuzzle);
	initialState.puzzleState.delegate = initialState as PuzzleStateDelegate;
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
			onMovePlayed: () => {
				set(([s, rs]) => {});
			},
			shouldMakeMove: (move: Move) =>
				set(([s]) => {
					return s.puzzleState.shouldMakeMove(move);
				}),
		};
	});

	initialState.chessboard.set((c) => {
		c.frozen = false;
	});
	return initialState;
};
