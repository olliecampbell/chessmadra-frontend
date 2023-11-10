import { Chess } from "@lubert/chess.ts";
import { Move } from "@lubert/chess.ts/dist/types";
import * as Sentry from "@sentry/browser";
import {
	cloneDeep,
	every,
	filter,
	find,
	findLast,
	flatten,
	forEach,
	includes,
	isEmpty,
	isNil,
	last,
	map,
	maxBy,
	merge,
	noop,
	some,
	uniqBy,
	values,
	zip,
} from "lodash-es";
import { JSXElement } from "solid-js";
import { TableResponse } from "~/components/RepertoireMovesTable";
import { FirstLineSavedOnboarding } from "~/components/SidebarOnboarding";
import { UpgradeSubscriptionView } from "~/components/UpgradeSubscriptionView";
import {
	EcoCode,
	MoveTag,
	PositionReport,
	StockfishReport,
} from "~/utils/models";
import { trackEvent } from "~/utils/trackEvent";
import { AppState, quick } from "./app_state";
import { START_EPD, genEpd } from "./chess";
import {
	ChessboardInterface,
	createChessboardInterface,
} from "./chessboard_interface";
import client from "./client";
import { MoveRating, getMoveRating, getWinPercentage } from "./move_inaccuracy";
import { PAYMENT_ENABLED } from "./payment";
import { parsePlans } from "./plans";
import { createQuick } from "./quick";
import {
	BySide,
	RepertoireMiss,
	RepertoireMove,
	SIDES,
	Side,
	getAllRepertoireMoves,
	lineToPgn,
	otherSide,
	pgnToLine,
} from "./repertoire";
import { FetchRepertoireResponse, RepertoireState } from "./repertoire_state";
import {
	getPlayRate,
	getTotalGames,
	getWinRate,
	getWinRateRange,
} from "./results_distribution";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { scoreTableResponses, shouldUsePeerRates } from "./table_scoring";
import { isTheoryHeavy } from "./theory_heavy";
import { animateSidebar } from "~/components/SidebarContainer";
import { logProxy } from "./state";
import { SpacedRepetition } from "~/SpacedRepetition";

export enum SidebarOnboardingImportType {
	LichessUsername = "lichess_username",
	ChesscomUsername = "chesscom_username",
	PGN = "pgn",
	PlayerTemplates = "player_templates",
}
export type BrowsingMode =
	| "browse"
	| "build"
	| "review"
	| "side_overview"
	| "overview";

export const modeToUI = (mode: BrowsingMode) => {
	switch (mode) {
		case "browse":
			return "Review";
		case "build":
			return "Browse / add new";
		case "review":
			return "Practice";
		case "side_overview":
			return "Overview";
		case "overview":
			return "Home";
	}
};

export interface BrowsingState {
	// Functions
	fetchNeededPositionReports: () => void;
	updateRepertoireProgress: () => void;
	reviewFromCurrentLine: () => void;
	finishSidebarOnboarding: () => void;
	getIncidenceOfCurrentLine: () => number;
	getLineIncidences: () => number[];
	dismissTransientSidebarState: () => void;
	getNearestMiss: () => RepertoireMiss;
	getMissInThisLine: () => RepertoireMiss;
	onPositionUpdate: () => void;
	updateTableResponses: () => void;
	requestToAddCurrentLine: () => void;
	quick: (fn: (_: BrowsingState) => void) => void;
	addPendingLine: (_?: { replace: boolean }) => Promise<void>;
	updatePlans: () => void;
	checkShowTargetDepthReached: () => void;
	goToBuildOnboarding(): unknown;
	reset: () => void;

	// Fields
	chessboard: ChessboardInterface;
	chessboardShown: boolean;
	repertoireProgressState: BySide<RepertoireProgressState>;
	hideContinuePracticing?: boolean;

	// from sidebar state
	isPastCoverageGoal?: boolean;
	tableResponses: TableResponse[];
	hasAnyPendingResponses?: boolean;
	transposedState: {
		visible: boolean;
	};
	showPlansState: {
		visible: boolean;
		coverageReached: boolean;
		hasShown: boolean;
	};
	deleteLineState: {
		visible: boolean;
	};
	addedLineState: {
		visible: boolean;
		loading: boolean;
	};
	activeSide?: Side;
	currentSide: Side;
	pendingResponses?: Record<string, RepertoireMove>;
	hasPendingLineToAdd: boolean;
	lastEcoCode?: EcoCode;
	planSections?: (() => JSXElement)[];
}

interface RepertoireProgressState {
	showNewProgressBar?: boolean;
	showPending?: boolean;
	completed: boolean;
	expectedDepth: number;
	showPopover: boolean;
	percentComplete: number;
	pendingMoves: number;
}

export interface BrowserLine {
	epd: string;
	pgn: string;
	ecoCode: EcoCode;
	line: string[];
	deleteMove: RepertoireMove;
}

export interface BrowserSection {
	lines: BrowserLine[];
	ecoCode: EcoCode;
}

type Stack = [BrowsingState, RepertoireState, AppState];

export const uiStateReset = () => {
	return {
		hideContinuePracticing: false,
		positionHistory: null,
		currentEpd: START_EPD,
		isPastCoverageGoal: false,
		tableResponses: [] as BrowsingState["tableResponses"],
		hasAnyPendingResponses: false,
		transposedState: {
			visible: false,
		},
		showPlansState: {
			coverageReached: false,
			visible: false,
			hasShown: false,
		},
		deleteLineState: {
			visible: false,
		},
		addedLineState: {
			visible: false,
			loading: false,
		},
		pendingResponses: {},
		currentSide: "white",
		hasPendingLineToAdd: false,
	} as Partial<BrowsingState>;
};

export const getInitialBrowsingState = (
	_set: StateSetter<AppState, any>,
	_get: StateGetter<AppState, any>,
) => {
	const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
		return _set((s) =>
			fn([s.repertoireState.browsingState, s.repertoireState, s]),
		);
	};
	const setOnly = <T,>(fn: (stack: BrowsingState) => T, id?: string): T => {
		return _set((s) => fn(s.repertoireState.browsingState));
	};
	const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
		return _get((s) =>
			fn([s.repertoireState.browsingState, s.repertoireState, s]),
		);
	};
	const initialState = {
		...createQuick(setOnly),
		...uiStateReset(),
		// @ts-ignore
		chessboard: undefined as ChessboardInterface,
		hideContinuePracticing: false,
		activeSide: "white",
		hasPendingLineToAdd: false,
		chessboardShown: false,
		plans: {},
		repertoireProgressState: {
			white: createEmptyRepertoireProgressState(),
			black: createEmptyRepertoireProgressState(),
		},

		reset: () => {
			set(([s]) => {
				merge(s, uiStateReset());
			});
		},
		goToBuildOnboarding: () =>
			set(([s, rs]) => {
				rs.ui.clearViews();
				if (!rs.onboarding.side) {
					rs.onboarding.side = "white";
				}
				const side = rs.onboarding.side;
				const biggestMiss = rs.repertoireGrades[side]?.biggestMiss;
				if (!biggestMiss) {
					return;
				}
				const line = pgnToLine(biggestMiss.lines[0]);
				rs.startBrowsing(side, "build", { pgnToPlay: lineToPgn(line) });
			}),
		updateRepertoireProgress: () =>
			set(([s, rs, gs]) => {
				SIDES.forEach((side) => {
					const progressState = s.repertoireProgressState[side];
					const expectedDepth = getAllRepertoireMoves(
						rs.repertoire,
						side,
					).reduce((expectedDepth, move) => {
						if (move.mine && !s.repertoireProgressState[side].pendingMoves) {
							return expectedDepth + (move.incidence ?? 0);
						}
						return expectedDepth;
					}, 0);
					progressState.expectedDepth = expectedDepth;
					const biggestMiss = rs.repertoireGrades[side]?.biggestMiss;
					const numMoves = rs.numResponsesAboveThreshold?.[side] ?? 0;
					const completed = isNil(biggestMiss);
					progressState.completed = completed;
					const expectedNumMoves = rs.expectedNumMovesFromEpd[side][START_EPD];
					const savedProgress = completed
						? 1
						: getCoverageProgress(numMoves / expectedNumMoves);
					// if (side === "white") {
					// 	console.log({
					// 		numMoves,
					// 		expectedNumMoves,
					// 		savedProgress,
					// 		biggestMiss: logProxy(biggestMiss),
					// 	});
					// }
					progressState.percentComplete = savedProgress;
				});
			}),
		checkShowTargetDepthReached: () => {
			set(([s, rs, gs]) => {
				if (
					s.isPastCoverageGoal &&
					s.activeSide !== s.currentSide &&
					s.hasPendingLineToAdd &&
					!s.showPlansState.hasShown &&
					rs.ui.mode === "build"
				) {
					trackEvent(`${rs.ui.mode}.coverage_reached`, {
						hasPlans: !isNil(
							rs.positionReports[s.activeSide!][s.chessboard.getCurrentEpd()]
								?.plans,
						),
					});
					s.showPlansState.visible = true;
					s.showPlansState.hasShown = true;
					s.showPlansState.coverageReached = true;
					if (!rs.onboarding.isOnboarding) {
						s.chessboard.set((c) => {
							c.showPlans = true;
						});
					}
				}
				if (!s.isPastCoverageGoal) {
					s.showPlansState.hasShown = false;
				}
			});
		},
		updateTableResponses: () =>
			set(([s, rs, gs]) => {
				if (!s.activeSide || !rs.repertoire) {
					s.tableResponses = [];
					return;
				}
				const threshold = gs.userState.getCurrentThreshold();
				const mode = rs.ui.mode;
				const currentSide: Side = s.chessboard.getTurn();
				const currentEpd = s.chessboard.getCurrentEpd();
				const positionReport =
					rs.positionReports[s.activeSide][s.chessboard.getCurrentEpd()];
				const _tableResponses: Record<string, TableResponse> = {};
				positionReport?.suggestedMoves
					// @ts-ignore
					.filter((sm) => getTotalGames(sm.results) > 0)
					.map((sm) => {
						_tableResponses[sm.sanPlus] = {
							suggestedMove: sm,
							tags: [],
							side: s.activeSide as Side,
						};
					});
				const existingMoves =
					rs.repertoire[s.activeSide].positionResponses[
						s.chessboard.getCurrentEpd()
					];
				existingMoves?.map((r) => {
					if (_tableResponses[r.sanPlus]) {
						_tableResponses[r.sanPlus].repertoireMove = r;
					} else {
						_tableResponses[r.sanPlus] = {
							repertoireMove: r,
							tags: [],
							side: s.activeSide as Side,
						};
					}
				});
				const ownSide = currentSide === s.activeSide;
				const usePeerRates = shouldUsePeerRates(positionReport);
				let tableResponses = values(_tableResponses);
				if (mode !== "build") {
					tableResponses = tableResponses.filter((tr) => tr.repertoireMove);
				}
				const biggestMisses =
					// @ts-ignore
					rs.repertoireGrades[s.activeSide].biggestMisses ?? {};
				tableResponses.forEach((tr) => {
					const epd = tr.suggestedMove?.epdAfter;
					// @ts-ignore
					if (biggestMisses[epd]) {
						// @ts-ignore
						tr.biggestMiss = biggestMisses[epd];
					}
				});
				tableResponses.forEach((tr) => {
					if (ownSide && tr.suggestedMove && positionReport) {
						const positionWinRate = getWinRate(
							positionReport?.results,
							s.activeSide as Side,
						);
						const [, , ci] = getWinRateRange(
							tr.suggestedMove.results,
							s.activeSide as Side,
						);
						const moveWinRate = getWinRate(
							tr.suggestedMove.results,
							s.activeSide as Side,
						);
						if (ci > 0.12 && Math.abs(positionWinRate - moveWinRate) > 0.02) {
							tr.lowConfidence = true;
						}
					}
				});
				tableResponses.forEach((tr) => {
					if (!ownSide && mode === "build") {
						if (
							// @ts-ignore
							tr.suggestedMove?.incidence < threshold &&
							tr.suggestedMove?.needed
						) {
							tr.tags.push(MoveTag.RareDangerous);
						}
					}
				});
				const now = new Date().toISOString();
				tableResponses.forEach((tr) => {
					if (rs.ui.mode === "browse" && tr.repertoireMove) {
						const epd =
							tr.suggestedMove?.epdAfter || tr.repertoireMove.epdAfter;
						let dueBelow =
							// @ts-ignore
							rs.numMovesDueFromEpd[s.activeSide][epd];
						let earliestBelow =
							// @ts-ignore
							rs.earliestReviewDueFromEpd[s.activeSide][epd];
						const dueAt = tr.repertoireMove.srs?.dueAt;
						if (dueAt && (dueAt < earliestBelow || !earliestBelow)) {
							earliestBelow = dueAt;
						}
						const isDue =
							tr.repertoireMove.srs &&
							SpacedRepetition.isReviewDue(tr.repertoireMove.srs, now);
						dueBelow = dueBelow + (isDue ? 1 : 0);
						tr.reviewInfo = {
							earliestDue: earliestBelow,
							due: dueBelow,
						};
					}
				});
				const stockfishReports: StockfishReport[] = filter(
					map(tableResponses, (tr) => {
						return tr.suggestedMove?.stockfish;
					}),
					(stockfish) => !isNil(stockfish),
				) as StockfishReport[];
				const bestStockfishReport = maxBy(
					stockfishReports,
					(stockfish: StockfishReport) => {
						return getWinPercentage(stockfish, s.currentSide!);
					},
				);
				tableResponses.forEach((tr) => {
					if (!ownSide && mode === "build") {
						if (
							isCommonMistake(tr, positionReport, bestStockfishReport) &&
							!tr.tags.includes(MoveTag.RareDangerous)
						) {
							tr.tags.push(MoveTag.CommonMistake);
						}
					}
				});
				tableResponses.forEach((tr) => {
					const epdAfter = tr.suggestedMove?.epdAfter;
					if (mode !== "build") {
						return;
					}
					if (tr.repertoireMove) {
						return;
					}

					if (
						!tr.repertoireMove &&
						// @ts-ignore
						rs.epdNodes[s.activeSide][epdAfter]
					) {
						tr.transposes = true;
						tr.tags.push(MoveTag.Transposes);
					}

					if (isTheoryHeavy(tr, currentEpd) && ownSide) {
						tr.tags.push(MoveTag.TheoryHeavy);
					}
				});
				tableResponses.forEach((tr) => {
					const moveRating = getMoveRating(
						positionReport,
						bestStockfishReport,
						// @ts-ignore
						tr.suggestedMove,
						currentSide,
					);
					// @ts-ignore
					tr.moveRating = moveRating;
				});
				if (ownSide && tableResponses.length >= 3) {
					tableResponses.forEach((tr, i) => {
						if (mode !== "build") {
							return;
						}
						const allOthersInaccurate = every(tableResponses, (tr, j) => {
							const playedByMasters =
								tr.suggestedMove &&
								getPlayRate(tr.suggestedMove, positionReport, true) > 0.02;
							return (!isNil(tr.moveRating) && !playedByMasters) || j === i;
						});
						const playedEnough =
							// @ts-ignore
							getTotalGames(tr.suggestedMove?.results) /
								// @ts-ignore
								getTotalGames(positionReport?.results) >
							0.02;
						if (allOthersInaccurate && isNil(tr.moveRating) && playedEnough) {
							tr.tags.push(MoveTag.BestMove);
						}
					});
				}
				tableResponses = scoreTableResponses(
					tableResponses,
					positionReport,
					bestStockfishReport,
					currentSide,
					rs.ui.mode,
					ownSide,
					!usePeerRates,
				);
				s.tableResponses = tableResponses;
				const noneNeeded = every(
					tableResponses,
					(tr) => !tr.suggestedMove?.needed,
				);
				if (
					!isNil(positionReport) &&
					(!ownSide || (ownSide && isEmpty(tableResponses)))
				) {
					if (noneNeeded || isEmpty(tableResponses)) {
						s.isPastCoverageGoal = true;
					} else {
						s.isPastCoverageGoal = false;
					}
				}
			}),
		getMissInThisLine: () =>
			get(([s, rs, gs]) => {
				if (!s.activeSide) {
					return null;
				}
				const miss =
					rs.repertoireGrades[s.activeSide]?.biggestMisses?.[
						s.chessboard.getCurrentEpd()
					];
				return miss;
			}),
		getNearestMiss: () =>
			get(([s, rs, gs]) => {
				if (!s.activeSide) {
					return null;
				}
				const threshold = gs.userState.getCurrentThreshold();
				return findLast(
					map(
						s.chessboard.get((c) => c.positionHistory),
						(epd) => {
							const miss =
								// @ts-ignore
								rs.repertoireGrades[s.activeSide]?.biggestMisses?.[epd];
							if (miss?.epd !== s.chessboard.getCurrentEpd()) {
								return miss;
							}
						},
					),
				);
			}),
		dismissTransientSidebarState: () =>
			set(([s, rs]) => {
				s.chessboard.set((c) => {
					c.showPlans = false;
				});
				if (s.addedLineState.visible) {
					s.addedLineState.visible = false;
					s.addedLineState.loading = false;
				}
				if (s.deleteLineState.visible) {
					s.deleteLineState.visible = false;
				}
				if (s.transposedState.visible) {
					s.transposedState.visible = false;
				}
				if (s.showPlansState.visible) {
					s.showPlansState.visible = false;
					s.showPlansState.coverageReached = false;
					s.chessboard.set((c) => {
						c.showPlans = false;
					});
				}
			}),
		finishSidebarOnboarding: () =>
			set(([s, rs]) => {
				animateSidebar("right");
				s.reset();
			}),
		reviewFromCurrentLine: () =>
			set(([s, rs]) => {
				// @ts-ignore
				return rs.positionReports[s.chessboard.getCurrentEpd()];
			}),
		fetchNeededPositionReports: () =>
			set(([s, rs]) => {
				const side = s.activeSide;
				let requests: {
					epd: string;
					previousEpds: string[];
					moves: string[];
					side: Side;
				}[] = [];
				SIDES.forEach((side) => {
					requests.push({
						epd: START_EPD,
						previousEpds: [],
						moves: [],
						side: side,
					});
				});
				if (!isNil(side)) {
					const moveLog: string[] = [];
					const epdLog: string[] = [];
					forEach(
						zip(
							s.chessboard.get((s) => s).positionHistory,
							s.chessboard.get((s) => s).moveLog,
						),
						([epd, move], i) => {
							if (move) {
								moveLog.push(move);
							}
							// @ts-ignore
							epdLog.push(epd);
							requests.push({
								// @ts-ignore
								epd: epd,
								side: side,
								moves: [...moveLog],
								previousEpds: [...epdLog],
							});
						},
					);
					const currentEpd = s.chessboard.getCurrentEpd();
					const currentReport =
						// @ts-ignore
						rs.positionReports[s.activeSide][currentEpd];
					if (currentReport) {
						// @ts-ignore
						currentReport.suggestedMoves.forEach((sm) => {
							const epd = sm.epdAfter;
							requests.push({
								epd: epd,
								side: side,
								moves: [...moveLog, sm.sanPlus],
								previousEpds: [...epdLog, epd],
							});
						});
					}
				}
				if (isNil(side)) {
					const startResponses =
						rs.repertoire?.white?.positionResponses[START_EPD];
					if (startResponses?.length === 1) {
						requests.push({
							epd: startResponses[0].epdAfter,
							previousEpds: [START_EPD],
							moves: [startResponses[0].sanPlus],
							side: "white",
						});
					}
				}
				requests = filter(requests, (r) => !rs.positionReports[r.side][r.epd]);
				requests = uniqBy(requests, (r) => `${r.epd}-${r.side}`);
				if (isEmpty(requests)) {
					return;
				}
				client
					.post("/api/v1/openings/position_reports", requests)
					.then(({ data: reports }: { data: PositionReport[] }) => {
						set(([s, rs]) => {
							reports.forEach((report) => {
								if (report.instructiveGames) {
									report.instructiveGames.forEach((game) => {
										const chess = new Chess();
										const epds: string[] = [];
										game.moves.forEach((move) => {
											chess.move(move);
											const epd = genEpd(chess);
											epds.push(epd);
										});
										game.epds = epds;
									});
								}
								rs.positionReports[report.side][report.epd] = report;
							});
							s.updateTableResponses();
							s.updatePlans();
							s.fetchNeededPositionReports();
						});
					});
			}),
		requestToAddCurrentLine: () =>
			set(([s, rs, gs]) => {
				const subscribed = gs.userState.isSubscribed();

				if (
					!subscribed &&
					// @ts-ignore
					rs.pastFreeTier(s.activeSide) &&
					PAYMENT_ENABLED &&
					!rs.onboarding.isOnboarding
				) {
					rs.ui.replaceView(UpgradeSubscriptionView, {
						props: { pastLimit: true },
					});
					return;
				}
				if (s.hasPendingLineToAdd) {
					s.addPendingLine();
				}
			}),

		updatePlans: () =>
			set(([s, rs]) => {
				if (!s.activeSide) {
					return;
				}
				const plans =
					rs.positionReports[s.activeSide][s.chessboard.getCurrentEpd()]
						?.plans ?? [];

				const maxOccurence = plans[0]?.occurences ?? 0;
				const consumer = parsePlans(
					cloneDeep(plans),
					s.activeSide,
					s.chessboard.get((s) => s.position),
				);
				s.chessboard.set((c) => {
					c.focusedPlans = [];
					c.plans = consumer.metaPlans.filter((p) =>
						consumer.consumed.has(p.id),
					);
					s.planSections = consumer.planSections;
					c.maxPlanOccurence = maxOccurence;
				});
			}),
		onPositionUpdate: () =>
			set(([s, rs]) => {
				s.currentSide = s.chessboard.getTurn();
				s.pendingResponses = {};

				s.updatePlans();

				// @ts-ignore
				const incidences = s.getLineIncidences({});
				if (rs.ecoCodeLookup) {
					s.lastEcoCode = last(
						filter(
							map(
								s.chessboard.get((s) => s.positionHistory),
								(p) => {
									return rs.ecoCodeLookup[p];
								},
							),
						),
					);
				}
				const line = s.chessboard.get((s) => s.moveLog);
				map(
					zip(
						s.chessboard.get((s) => s.positionHistory),
						line,
						incidences,
					),
					([position, san, incidence], i) => {
						if (!san) {
							return;
						}
						const mine = i % 2 === (s.activeSide === "white" ? 0 : 1);
						if (
							!some(
								rs.repertoire?.[s.activeSide!]?.positionResponses[position!],
								(m) => {
									return m.sanPlus === san;
								},
							)
						) {
							s.pendingResponses![position!] = {
								epd: position,
								epdAfter: s.chessboard.get((s) => s.positionHistory)[i + 1],
								sanPlus: san,
								side: s.activeSide,
								pending: true,
								mine: mine,
								incidence: incidence,
								srs: {
									difficulty: 0.3,
								},
							} as RepertoireMove;
						}
					},
				);

				s.hasAnyPendingResponses = !isEmpty(
					flatten(values(s.pendingResponses)),
				);
				s.hasPendingLineToAdd = some(
					flatten(values(s.pendingResponses)),
					(m) => m.mine,
				);
				if (rs.ui.mode !== "review") {
					s.fetchNeededPositionReports();
					s.updateRepertoireProgress();
					s.updateTableResponses();
				}
			}),
		// @ts-ignore
		getLineIncidences: () =>
			get(([s, rs]) => {
				if (!s.activeSide) {
					return [];
				}

				let incidence = 1.0;
				return map(
					zip(
						s.chessboard.get((s) => s.positionHistory),
						s.chessboard.get((s) => s.moveLog),
					),
					([position, san], i) => {
						const positionReport =
							// @ts-ignore
							rs.positionReports[s.activeSide][position];
						if (positionReport) {
							const suggestedMove = find(
								positionReport.suggestedMoves,
								(sm) => sm.sanPlus === san,
							);
							if (suggestedMove) {
								incidence = suggestedMove.incidence;
								return incidence;
							}
						}

						return incidence;
					},
				);
			}),
		// @ts-ignore
		getIncidenceOfCurrentLine: () =>
			get(([s, rs]) => {
				return last(s.getLineIncidences());
			}),
		addPendingLine: (cfg) =>
			set(([s, rs]) => {
				const { replace } = cfg ?? { replace: false };
				s.showPlansState.hasShown = false;
				s.dismissTransientSidebarState();
				s.addedLineState = {
					visible: true,
					loading: true,
				};
				return client
					.post("/api/v1/openings/add_moves", {
						moves: flatten(cloneDeep(values(s.pendingResponses))),
						side: s.activeSide,
						replace: replace,
					})
					.then(({ data }: { data: FetchRepertoireResponse }) => {
						set(([s, rs]) => {
							if (rs.onboarding.isOnboarding) {
								rs.ui.pushView(FirstLineSavedOnboarding);
							} else {
								s.addedLineState = {
									visible: true,
									loading: false,
								};
							}
							rs.repertoire = data.repertoire;
							rs.repertoireGrades = data.grades;
							rs.onRepertoireUpdate();
							s.onPositionUpdate();
						});
					})
					.catch((err) => {
						console.log("Error adding lines!", err);
						Sentry.captureException(err);
					})
					.finally(() => {
						set(([s]) => {
							s.addedLineState.loading = false;
						});
					});
			}),
	} as Omit<BrowsingState, "chessboardState">;

	initialState.chessboard = createChessboardInterface()[1];
	initialState.chessboard.set((c) => {
		c.delegate = {
			completedMoveAnimation: noop,
			onPositionUpdated: () => {
				set(([s]) => {
					s.onPositionUpdate();
				});
			},

			madeManualMove: () => {
				get(([s, rs]) => {
					trackEvent(`${rs.ui.mode}.chessboard.played_move`);
				});
			},
			onBack: () => {
				set(([s]) => {
					s.dismissTransientSidebarState();
					s.addedLineState.visible = false;
					s.hideContinuePracticing = true;
				});
			},
			onReset: () => {
				set(([s]) => {
					s.dismissTransientSidebarState();
					s.showPlansState.hasShown = false;
				});
			},
			onMovePlayed: () => {
				set(([s, rs]) => {
					s.hideContinuePracticing = true;
					if (includes(["side_overview", "overview"], rs.ui.mode)) {
						rs.ui.clearViews();
						rs.startBrowsing(s.activeSide ?? "white", "build", {
							keepPosition: true,
						});
					}
					if (s.transposedState.visible) {
						s.transposedState.visible = false;
					}

					s.checkShowTargetDepthReached();
				});
			},
			shouldMakeMove: (move: Move) =>
				set(([s]) => {
					animateSidebar("right");
					return true;
				}),
		};
	});
	return initialState;
};

function createEmptyRepertoireProgressState(): RepertoireProgressState {
	return {
		pendingMoves: 0,
		completed: false,
		expectedDepth: 0,
		percentComplete: 0,
		showPopover: false,
	};
}
const isCommonMistake = (
	tr: TableResponse,
	positionReport: PositionReport,
	bestStockfishReport: StockfishReport | undefined,
): boolean => {
	if (!tr.suggestedMove || !positionReport) {
		return false;
	}
	// @ts-ignore
	if (getTotalGames(tr.suggestedMove.results) < 100) {
		return false;
	}
	if (!tr.suggestedMove?.needed) {
		return false;
	}
	if (
		getWinRate(tr.suggestedMove.results, otherSide(tr.side)) >
		getWinRate(positionReport.results, otherSide(tr.side)) + 0.02
	) {
		return false;
	}
	const moveRating = getMoveRating(
		positionReport,
		bestStockfishReport,
		tr.suggestedMove,
		otherSide(tr.side),
	);
	if (isNil(moveRating) || moveRating < MoveRating.Mistake) {
		return false;
	}
	return true;
};

export function getCoverageProgress(progress: number) {
	const linearCutoff = 0.9;
	if (progress <= linearCutoff) {
		return progress;
	}
	// For progress > linearCutoff, we use an ease-out function to approach 1 but never exceed it
	else {
		const transformedProgress = progress - linearCutoff;

		const easeOutProgress = 1 - Math.exp(-4 * transformedProgress);

		return linearCutoff + easeOutProgress * (1 - linearCutoff);
	}
}
