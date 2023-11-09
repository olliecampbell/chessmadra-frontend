import {
	capitalize,
	dropRight,
	every,
	filter,
	flatten,
	forEach,
	isArray,
	isEmpty,
	isNil,
	keyBy,
	last,
	noop,
	some,
	values,
} from "lodash-es";
import client from "~/utils/client";
import { EcoCode, LichessMistake, PositionReport } from "~/utils/models";
import { AppState, quick } from "./app_state";
import {
	BrowsingMode,
	BrowsingState,
	getInitialBrowsingState,
	modeToUI,
} from "./browsing_state";
import { START_EPD } from "./chess";
import { createQuick } from "./quick";
import {
	BySide,
	Repertoire,
	RepertoireGrade,
	RepertoireMove,
	RepertoireSide,
	SIDES,
	Side,
	getAllRepertoireMoves,
	lineToPgn,
	pgnToLine,
	sideOfLastmove,
} from "./repertoire";
import { ReviewState, getInitialReviewState } from "./review_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import dedent from "dedent-js";
import { Component, JSXElement } from "solid-js";
import {
	ImportSuccessOnboarding,
	TrimRepertoireOnboarding,
} from "~/components/SidebarOnboarding";
import { Logo } from "~/components/icons/Logo";
import { ChessboardInterface } from "./chessboard_interface";
import { clsx } from "./classes";
import { shouldDebugEpd } from "./debug";
import { isChessmadra, isDevelopment } from "./env";
import { MAX_MOVES_FREE_TIER } from "./payment";
import { View } from "~/types/View";
import { animateSidebar } from "~/components/SidebarContainer";
import { isServer } from "solid-js/web";
import { SpacedRepetition } from "~/SpacedRepetition";

const TEST_LINE = isDevelopment ? [] : [];
const TEST_MODE: BrowsingMode | null = isDevelopment ? null : null;

export interface LichessOauthData {
	codeVerifier: string;
	redirectUri: string;
	clientId: string;
	codeChallenge: string;
}

export interface RepertoireState {
	repertoire: Repertoire | undefined;
	lichessMistakes: LichessMistake[] | null;
	needsToRefetchLichessMistakes: boolean;
	numMyMoves: BySide<number>;
	onboarding: {
		isOnboarding: boolean;
		side?: Side;
	};
	numMovesFromEpd: BySide<Record<string, number>>;
	numMovesDueFromEpd: BySide<Record<string, number>>;
	earliestReviewDueFromEpd: BySide<Record<string, string>>;
	expectedNumMovesFromEpd: BySide<Record<string, number>>;
	quick: (fn: (_: RepertoireState) => void) => void;
	numResponsesAboveThreshold?: BySide<number>;
	numResponses?: BySide<number>;
	positionReports: BySide<Record<string, PositionReport>>;
	repertoireGrades: BySide<RepertoireGrade | null>;
	ui: {
		mode: BrowsingMode;
		viewStack: View[];
		currentView: () => View;
		clearViews: () => void;
		pushView: (
			view: Component<any>,
			opts?: { direction?: "left" | "right"; props?: any },
		) => void;
		replaceView: (
			view: Component<any>,
			opts?: { direction?: "left" | "right"; props?: any },
		) => void;
		popView: () => void;
	};
	fetchRepertoire: (initial?: boolean) => void;
	repertoireFetched: (_: FetchRepertoireResponse) => void;
	fetchEcoCodes: () => void;
	fetchSupplementary: () => Promise<void>;
	initializeRepertoire: (_: {
		lichessUsername?: string;
		chesscomUsername?: string;
		whitePgn?: string;
		blackPgn?: string;
	}) => void;
	initState: () => void;
	fetchLichessMistakes: () => void;
	backToOverview: () => void;
	uploadMoveAnnotation: (_: {
		epd: string;
		san: string;
		text: string;
	}) => Promise<void>;
	startBrowsing: (
		side: Side | null,
		mode: BrowsingMode,
		options?: {
			animated?: boolean;
			pgnToPlay?: string;
			import?: boolean;
			keepPosition?: boolean;
		},
	) => void;
	showImportView?: boolean;
	startImporting: (side: Side) => void;
	updateRepertoireStructures: () => void;
	epdIncidences: BySide<Record<string, number>>;
	epdNodes: BySide<Record<string, boolean>>;
	onMove: () => void;
	getNumResponsesBelowThreshold: (
		threshold: number,
		side: Side | null,
	) => number;
	getIsRepertoireEmpty: (side?: Side) => boolean;
	analyzeLineOnLichess: (line: string[], side?: Side) => void;
	analyzeMoveOnLichess: (fen: string, move: string, turn: Side) => void;
	backToStartPosition: () => void;
	deleteRepertoire: (side: Side) => void;
	deleteMove: (response: RepertoireMove) => Promise<void>;
	trimRepertoire: (threshold: number, sides: Side[]) => Promise<void>;
	exportPgn: (side: Side) => void;
	onRepertoireUpdate: () => void;
	editingSide?: Side;
	myResponsesLookup?: BySide<RepertoireMove[]>;
	moveLookup?: BySide<Record<string, RepertoireMove>>;
	currentLine?: string[];
	hasCompletedRepertoireInitialization?: boolean;
	// The first position where the user does not have a response for
	divergencePosition?: string;
	divergenceIndex?: number;
	ecoCodes: EcoCode[];
	ecoCodeLookup: Record<string, EcoCode>;
	browsingState: BrowsingState;
	reviewState: ReviewState;
	deleteMoveState: {
		modalOpen: boolean;
		response?: RepertoireMove;
		isDeletingMove: boolean;
	};
	getBreadCrumbs: (mobile: boolean) => NavBreadcrumb[];
	pastFreeTier: (side: Side) => boolean;
	getChessboard: () => ChessboardInterface | null;
}

export interface NavBreadcrumb {
	text: JSXElement;
	unclickable?: boolean;
	onPress?: () => void;
}

export interface AddNewLineChoice {
	title: string;
	line: string;
	active?: boolean;
	incidence?: number;
}

export enum AddedLineStage {
	Initial = 0,
	AddAnother = 1,
}

export interface FetchRepertoireResponse {
	repertoire: Repertoire;
	grades: BySide<RepertoireGrade>;
}

export const DEFAULT_ELO_RANGE = [1300, 1500] as [number, number];

type Stack = [RepertoireState, AppState];
const selector = (s: AppState): Stack => [s.repertoireState, s];

export const getInitialRepertoireState = (
	// biome-ignore lint: ignore
	_set: StateSetter<AppState, any>,
	// biome-ignore lint: ignore
	_get: StateGetter<AppState, any>,
) => {
	const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
		return _set((s) => fn(selector(s)));
	};
	const setOnly = <T,>(fn: (stack: RepertoireState) => T, id?: string): T => {
		return _set((s) => fn(s.repertoireState));
	};
	const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
		return _get((s) => fn(selector(s)));
	};
	const initialState = {
		...createQuick<RepertoireState>(setOnly),
		ui: {
			viewStack: [],
			mode: "overview",
			clearViews: () =>
				set(([s, gs]) => {
					s.ui.viewStack = [];
				}),
			currentView: () =>
				get(([s, gs]) => {
					return last(s.ui.viewStack);
				}),
			pushView: (view, { direction, props } = {}) =>
				set(([s, gs]) => {
					animateSidebar(direction ?? "right");
					s.ui.viewStack.push({ component: view, props: props ?? {} });
				}),
			replaceView: (view, { direction, props } = {}) =>
				set(([s, gs]) => {
					animateSidebar(direction ?? "right");
					s.ui.viewStack.pop();
					s.ui.viewStack.push({ component: view, props: props ?? {} });
				}),
			popView: () =>
				set(([s, gs]) => {
					s.ui.viewStack.pop();
				}),
		},
		expectedNumMoves: { white: 0, black: 0 },
		lichessMistakes: null,
		needsToRefetchLichessMistakes: false,
		numMyMoves: { white: 0, black: 0 },
		numMovesFromEpd: { white: {}, black: {} },
		numMovesDueFromEpd: { white: {}, black: {} },
		earliestReviewDueFromEpd: { white: {}, black: {} },
		expectedNumMovesFromEpd: { white: {}, black: {} },
		// All epds that are covered or arrived at (epd + epd after)
		epdNodes: { white: {}, black: {} },
		epdIncidences: { white: {}, black: {} },
		deleteMoveState: {
			modalOpen: false,
			isDeletingMove: false,
		},
		ecoCodes: [],
		addedLineState: null,
		numResponsesAboveThreshold: undefined,
		isUpdatingEloRange: false,
		repertoire: undefined,
		browsingState: getInitialBrowsingState(_set, _get),
		reviewState: getInitialReviewState(_set, _get),
		repertoireGrades: { white: null, black: null },
		ecoCodeLookup: {},
		pendingResponses: {},
		positionReports: { white: {}, black: {} },
		onboarding: {
			isOnboarding: false,
		},
		currentLine: [],
		// hasCompletedRepertoireInitialization: failOnTrue(true),
		initState: () =>
			set(([s]) => {
				s.repertoire = undefined;
				s.fetchRepertoire(true);
				s.fetchSupplementary();
				s.fetchLichessMistakes();
			}, "initState"),
		initializeRepertoire: ({
			lichessUsername,
			chesscomUsername,
			blackPgn,
			whitePgn,
		}) =>
			set(async ([s]) => {
				let lichessGames = [];
				if (lichessUsername) {
					const max = 200;
					const { data }: { data: string } = await client.get(
						`https://lichess.org/api/games/user/${encodeURIComponent(
							lichessUsername,
						)}?max=${max}&perfType=ultrabullet,bullet,blitz,rapid,classical,correspondence`,
						{
							headers: { Accept: "application/x-ndjson" },
						},
					);
					lichessGames = data
						.split("\n")
						.filter((s) => s.length > 2)
						.map((s) => JSON.parse(s));
				}
				const { data }: { data: FetchRepertoireResponse } = await client.post(
					"/api/v1/initialize_repertoire",
					{
						lichessGames,
						lichessUsername,
						chessComGames: [],
						whitePgn,
						blackPgn,
					},
				);
				set(([s, gs]) => {
					s.repertoire = data.repertoire;
					s.repertoireGrades = data.grades;
					s.onRepertoireUpdate();
					const minimumToTrim = 10;
					const side: Side = blackPgn ? "black" : "white";
					const numBelowThreshold = s.getNumResponsesBelowThreshold(
						gs.userState.getCurrentThreshold(),
						null,
					);
					if (!s.onboarding.isOnboarding && lichessUsername) {
						s.ui.pushView(TrimRepertoireOnboarding);
					} else if (
						side &&
						numBelowThreshold > minimumToTrim &&
						!lichessUsername &&
						!chesscomUsername
					) {
						s.ui.pushView(TrimRepertoireOnboarding);
					} else {
						s.ui.pushView(ImportSuccessOnboarding);
					}
				}, "initializeRepertoire");
			}),
		getBreadCrumbs: (mobile: boolean) =>
			get(([s]) => {
				const homeBreadcrumb: NavBreadcrumb = {
					text: (
						<div
							class={clsx(
								"square-5 col pr-10px -m-2 box-content items-center justify-center p-2",
							)}
						>
							<Logo />
						</div>
					),
					onPress: () => {
						set(([s, appState]) => {
							s.backToOverview();
						});
					},
				};

				const breadcrumbs: NavBreadcrumb[] = [homeBreadcrumb];
				if (isChessmadra) {
					return breadcrumbs;
				}
				const mode = s.ui.mode;
				const side = s.browsingState.activeSide;
				if (side) {
					breadcrumbs.push({
						text: capitalize(side),
						onPress: () => {
							quick((s) => {
								s.repertoireState.startBrowsing(side, "side_overview");
							});
						},
					});
				}
				const unclickableModes: BrowsingMode[] = ["review"];
				if (mode && mode !== "side_overview" && mode !== "overview") {
					const unclickable = unclickableModes.includes(mode);
					breadcrumbs.push({
						text: capitalize(modeToUI(mode)),
						unclickable,
						onPress: unclickable
							? undefined
							: () => {
									quick((s) => {
										s.repertoireState.startBrowsing(side!, mode);
										s.repertoireState.browsingState.chessboard.resetPosition();
									});
							  },
					});
				}
				return breadcrumbs;
			}),
		analyzeMoveOnLichess: (fen: string, move: string, turn: Side) =>
			set(([s]) => {
				const bodyFormData = new FormData();
				bodyFormData.append(
					"pgn",
					`
          [Variant "From Position"]
          [FEN "${fen}"]

          ${turn === "white" ? "1." : "1..."} ${move}
        `,
				);
				const windowReference = window.open("about:blank", "_blank");
				client
					.post("https://lichess.org/api/import", bodyFormData)
					.then(({ data }) => {
						const url = data.url;
						windowReference!.location = `${url}/${turn}#999`;
					});
			}),
		analyzeLineOnLichess: (line: string[], _side?: Side) =>
			set(([s]) => {
				if (isEmpty(line)) {
					// TODO: figure out a way to open up analysis from black side
					window.open("https://lichess.org/analysis", "_blank");
					return;
				}
				const side = _side ?? sideOfLastmove(line);
				window.open(
					`https://lichess.org/analysis/pgn/${line.join("_")}?color=${side}`,
					"_blank",
				);
			}),
		onMove: () => set(([s]) => {}, "onMove"),
		updateRepertoireStructures: () =>
			set(([s, gs]) => {
				if (!s.repertoire) {
					return;
				}
				const threshold = gs.userState.getCurrentThreshold();
				mapSides(s.repertoire, (repertoireSide: RepertoireSide, side: Side) => {
					const seenEpds: Set<string> = new Set();
					const numMovesByEpd: { [epd: string]: number } = {};
					const recurse = (
						epd: string,
						seenEpds: Set<string>,
						lastMove?: RepertoireMove,
					) => {
						if (shouldDebugEpd(epd)) {
							console.log(
								"[updateRepertoireStructures], this is bting debugged",
								epd,
							);
						}
						if (seenEpds.has(epd)) {
							return { numMoves: 0, additionalExpectedNumMoves: 0 };
						}
						const incidence = lastMove?.incidence ?? 1;
						let totalNumMovesFromHere = 0;
						const newSeenEpds = new Set(seenEpds);
						newSeenEpds.add(epd);
						const allMoves = filter(
							repertoireSide.positionResponses[epd] ?? [],
							(m) => m.needed,
						) as RepertoireMove[];
						const [mainMove, ...others] = allMoves;
						let additionalExpectedNumMoves = 0;
						if (mainMove?.mine && !isEmpty(others)) {
							others.forEach((m) => {
								const additional = getExpectedNumMovesBetween(
									m.incidence ?? 0,
									threshold,
									side,
									m.epd === START_EPD &&
										(m.sanPlus === "d4" ||
											m.sanPlus === "c4" ||
											m.sanPlus === "Nf3"),
								);
								additionalExpectedNumMoves += additional;
							});
						}
						let numMovesExpected = getExpectedNumMovesBetween(
							incidence,
							threshold,
							side,
							epd === START_EPD &&
								some(
									allMoves,
									(m) =>
										m.sanPlus === "d4" ||
										m.sanPlus === "c4" ||
										m.sanPlus === "Nf3",
								),
						);
						let childAdditionalMovesExpected = 0;
						allMoves.forEach((m) => {
							if (shouldDebugEpd(epd)) {
								console.log("MOVES", m);
							}
							const { numMoves, additionalExpectedNumMoves } = recurse(
								m.epdAfter,
								newSeenEpds,
								m,
							);
							numMovesExpected += additionalExpectedNumMoves;
							childAdditionalMovesExpected += additionalExpectedNumMoves;
							totalNumMovesFromHere += numMoves;
						});
						numMovesByEpd[epd] = totalNumMovesFromHere;
						s.expectedNumMovesFromEpd[side][epd] = numMovesExpected;
						s.numMovesFromEpd[side][epd] = totalNumMovesFromHere;
						return {
							numMoves: totalNumMovesFromHere + (incidence > threshold ? 1 : 0),
							additionalExpectedNumMoves:
								additionalExpectedNumMoves + childAdditionalMovesExpected,
						};
					};
					recurse(START_EPD, seenEpds, undefined);
				});
				const now = new Date().toISOString();
				mapSides(s.repertoire, (repertoireSide: RepertoireSide, side: Side) => {
					const seenEpds: Set<string> = new Set();
					const recurse = (
						epd: string,
						seenEpds: Set<string>,
						lastMove?: RepertoireMove,
					) => {
						if (shouldDebugEpd(epd)) {
							console.log(
								"[updateRepertoireStructures], this is bting debugged",
								epd,
							);
						}
						if (seenEpds.has(epd)) {
							return { dueMoves: new Set<string>(), earliestDueDate: null };
						}
						const newSeenEpds = new Set(seenEpds);
						newSeenEpds.add(epd);
						let earliestDueDate: string | null = null;
						const allMoves = repertoireSide.positionResponses[epd] ?? [];
						let dueMovesFromHere = new Set<string>();
						allMoves.forEach((m) => {
							if (shouldDebugEpd(epd)) {
								console.log("MOVES", m);
							}
							const { dueMoves, earliestDueDate: recursedEarliestDueDate } =
								recurse(m.epdAfter, newSeenEpds, m);
							if (
								(earliestDueDate === null && recursedEarliestDueDate) ||
								// @ts-ignore
								recursedEarliestDueDate < earliestDueDate
							) {
								// @ts-ignore
								earliestDueDate = recursedEarliestDueDate;
							}
							dueMovesFromHere = new Set([...dueMovesFromHere, ...dueMoves]);
						});
						s.numMovesDueFromEpd[side][epd] = dueMovesFromHere.size;
						// @ts-ignore
						s.earliestReviewDueFromEpd[side][epd] = earliestDueDate;
						if (shouldDebugEpd(epd)) {
							console.log("earliestDueDate", earliestDueDate);
						}
						if (
							lastMove?.srs &&
							SpacedRepetition.isReviewDue(lastMove.srs, now)
						) {
							dueMovesFromHere.add(`${lastMove.epd}-${lastMove.sanPlus}`);
						}
						return {
							dueMoves: dueMovesFromHere,
							earliestDueDate: earliestDueDate ?? lastMove?.srs?.dueAt,
						};
					};
					recurse(START_EPD, seenEpds, undefined);
				});
				s.myResponsesLookup = mapSides(
					s.repertoire,
					(repertoireSide: RepertoireSide) => {
						return flatten(
							Object.values(repertoireSide.positionResponses),
						).filter((m: RepertoireMove) => m.mine);
					},
				);
				s.epdNodes = mapSides(
					s.repertoire,
					(repertoireSide: RepertoireSide) => {
						const nodeEpds = {};
						const allEpds = flatten(
							Object.values(repertoireSide.positionResponses),
						).flatMap((m) => [m.epd, m.epdAfter]);
						allEpds.forEach((epd) => {
							// @ts-ignore
							nodeEpds[epd] = true;
						});
						return nodeEpds;
					},
				);
				s.numResponses = mapSides(
					s.repertoire,
					(repertoireSide: RepertoireSide) => {
						return flatten(Object.values(repertoireSide.positionResponses))
							.length;
					},
				);
				s.numMyMoves = mapSides(
					s.repertoire,
					(repertoireSide: RepertoireSide) => {
						return filter(
							flatten(Object.values(repertoireSide.positionResponses)),
							(m) => m.mine,
						).length;
					},
				);
				s.numResponsesAboveThreshold = mapSides(
					s.repertoire,
					(repertoireSide: RepertoireSide) => {
						return flatten(
							Object.values(repertoireSide.positionResponses),
						).filter((m) => m.needed).length;
					},
				);
			}, "updateRepertoireStructures"),

		trimRepertoire: (threshold: number, sides: Side[]) =>
			set(([s]) => {
				return client
					.post("/api/v1/openings/trim", {
						threshold,
						sides,
					})
					.then(({ data }: { data: FetchRepertoireResponse }) => {
						set(([s]) => {
							s.repertoire = data.repertoire;
							s.repertoireGrades = data.grades;
							s.onRepertoireUpdate();
							if (s.ui.mode !== "review") {
								s.browsingState.onPositionUpdate();
							}
						});
					})
					.finally(noop);
			}, "deleteMoveConfirmed"),
		deleteMove: (response: RepertoireMove) =>
			set(([s]) => {
				s.deleteMoveState.isDeletingMove = true;
				return client
					.post("/api/v1/openings/delete_move", {
						response: response,
					})
					.then(({ data }: { data: FetchRepertoireResponse }) => {
						set(([s]) => {
							s.repertoire = data.repertoire;
							s.repertoireGrades = data.grades;
							s.onRepertoireUpdate();
							if (s.ui.mode !== "review") {
								s.browsingState.onPositionUpdate();
							}
						});
					})
					.finally(() => {
						set(([s]) => {
							s.deleteMoveState.isDeletingMove = false;
							// @ts-ignore
							s.deleteMoveState.response = null;
							s.deleteMoveState.modalOpen = false;
						});
					});
			}, "deleteMoveConfirmed"),
		deleteRepertoire: (side: Side) =>
			set(([s]) => {
				client
					.post("/api/v1/openings/delete", {
						sides: [side],
					})
					.then(({ data }: { data: FetchRepertoireResponse }) => {
						set(([s]) => {
							s.repertoire = data.repertoire;
							s.repertoireGrades = data.grades;
							s.onRepertoireUpdate();
						});
					});
			}, "deleteRepertoire"),
		exportPgn: (side: Side) =>
			set(([s]) => {
				let pgn = dedent`
        [Event "${side} Repertoire"]
        [Site "chessbook.com"]
        [Date ""]
        [Round "N/A"]
        [White "N/A"]
        [Black "N/A"]
        [Result "*"]
        `;
				pgn += "\n\n";

				const seenEpds = new Set();
				// @ts-ignore
				const recurse = (epd, line, seenEpds) => {
					const [mainMove, ...others] =
						// @ts-ignore
						s.repertoire[side].positionResponses[epd] ?? [];
					const newSeenEpds = new Set(seenEpds);
					newSeenEpds.add(epd);
					if (!mainMove) {
						return;
					}
					const mainLine = [...line, mainMove.sanPlus];
					pgn = `${pgn}${getLastMoveWithNumber(lineToPgn(mainLine))} `;
					forEach(others, (variationMove) => {
						if (newSeenEpds.has(variationMove.epdAfter)) {
							return;
						}
						const variationLine = [...line, variationMove.sanPlus];
						const variationSeenEpds = new Set(newSeenEpds);
						variationSeenEpds.add(variationMove.epdAfter);
						pgn += "(";
						if (sideOfLastmove(variationLine) === "black") {
							const n = Math.floor(variationLine.length / 2);

							pgn += `${n}... ${getLastMoveWithNumber(
								lineToPgn(variationLine),
							).trim()} `;
						} else {
							pgn += `${getLastMoveWithNumber(lineToPgn(variationLine))} `;
						}

						recurse(variationMove.epdAfter, variationLine, variationSeenEpds);
						pgn = pgn.trim();
						pgn += ") ";
					});
					if (newSeenEpds.has(mainMove.epdAfter)) {
						return;
					}
					if (
						!isEmpty(others) &&
						sideOfLastmove(lineToPgn(mainLine)) === "white"
					) {
						pgn += `${getMoveNumber(lineToPgn(mainLine))}... `;
					}

					newSeenEpds.add(mainMove.epdAfter);
					recurse(mainMove.epdAfter, mainLine, newSeenEpds);
				};
				recurse(START_EPD, [], seenEpds);
				pgn = `${pgn.trim()} *`;
				console.log("pgn", pgn);

				const downloadLink = document.createElement("a");

				const csvFile = new Blob([pgn], { type: "text" });

				const url = window.URL.createObjectURL(csvFile);
				downloadLink.download = `${side}.pgn`;
				downloadLink.href = url;
				downloadLink.style.display = "none";
				document.body.appendChild(downloadLink);
				downloadLink.click();
			}, "exportPgn"),

		uploadMoveAnnotation: ({
			epd,
			san,
			text,
		}: {
			epd: string;
			san: string;
			text: string;
		}) =>
			get(([s]) => {
				return client
					.post("/api/v1/openings/move_annotation", {
						text: text,
						epd: epd,
						san,
					})
					.then(({ data }) => {
						set(([s]) => {
							s.positionReports[s.browsingState.activeSide!][
								epd
							]?.suggestedMoves?.forEach((sm) => {
								if (sm.sanPlus === san) {
									sm.annotation = text;
								}
							});
							s.browsingState.onPositionUpdate();
						});
					});
			}),
		backToOverview: () =>
			set(([s, gs]) => {
				if (s.ui.mode === "review") {
					s.reviewState.stopReviewing();
				}
				s.startBrowsing(null, "overview");
				gs.navigationState.push("/");
				s.showImportView = false;
				s.ui.clearViews();
				s.backToStartPosition();
				s.browsingState.activeSide = undefined;
				s.divergencePosition = undefined;
				s.divergenceIndex = undefined;
				s.browsingState.reset();
				if (s.needsToRefetchLichessMistakes) {
					s.fetchLichessMistakes();
				}
			}),
		startImporting: (side: Side) =>
			set(([s]) => {
				s.startBrowsing(side, "build", { import: true });
				s.browsingState.chessboard.resetPosition();
			}, "startImporting"),
		startBrowsing: (side: Side, mode: BrowsingMode, options) =>
			set(([s, gs]) => {
				if (
					(mode === "side_overview" || mode === "overview") &&
					!options?.keepPosition
				) {
					s.browsingState.chessboard.resetPosition();
				}
				s.browsingState.showPlansState = {
					visible: false,
					coverageReached: false,
					hasShown: false,
				};
				// TODO: should just reset to a default state here, instead of doing it one by one
				s.ui.mode = mode;
				s.browsingState.activeSide = side;
				s.browsingState.addedLineState.visible = false;
				s.browsingState.isPastCoverageGoal = false;
				s.browsingState.onPositionUpdate();
				s.browsingState.chessboard.set((c) => {
					c.flipped = s.browsingState.activeSide === "black";
				});
				if (options?.import) {
					// just don't show the chessboard
				} else if (mode === "browse" || mode === "build") {
					if (options?.pgnToPlay) {
						s.browsingState.chessboard.playLine(pgnToLine(options.pgnToPlay), {
							animated: !isNil(options.animated) ? options.animated : true,
							reset: true,
						});
					}
				}
				// if (mode === "home") {
				//   gs.navigationState.push(`/`);
				// } else {
				//   gs.navigationState.push(`/openings/${side}/${mode}`);
				// }
			}, "startBrowsing"),
		onRepertoireUpdate: () =>
			set(([s]) => {
				s.updateRepertoireStructures();
				s.browsingState.fetchNeededPositionReports();
				s.browsingState.updateRepertoireProgress();
				s.browsingState.updateTableResponses();
				s.needsToRefetchLichessMistakes = true;
				s.reviewState.invalidateSession();
			}),
		fetchSupplementary: () =>
			set(([s]) => {
				return client.get("/api/v1/openings/supplementary").then(
					({
						data,
					}: {
						data: {
							ecoCodes: EcoCode[];
						};
					}) => {
						set(([s]) => {
							s.ecoCodes = data.ecoCodes;
							s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
							const mode = s.ui.mode;
							if (mode === "review") {
								s.reviewState.onPositionUpdate();
							} else {
								s.browsingState.onPositionUpdate();
							}
						});
					},
				);
			}),
		fetchEcoCodes: () =>
			set(([s]) => {
				client
					.get("/api/v1/openings/eco_codes")
					.then(({ data }: { data: EcoCode[] }) => {
						set(([s]) => {
							s.ecoCodes = data;
							s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
						});
					});
			}),
		getChessboard: () => {
			return get(([s]) => {
				if (s.ui.mode === "review") {
					return s.reviewState.chessboard;
				} else {
					return s.browsingState.chessboard;
				}
			});
		},
		repertoireFetched: (repertoireResponse: FetchRepertoireResponse) =>
			set(([s, appState]) => {
				const user = appState.userState.user;
				s.repertoire = repertoireResponse.repertoire;
				s.repertoireGrades = repertoireResponse.grades;
				s.hasCompletedRepertoireInitialization = true;
				s.onRepertoireUpdate();
				if (!s.getIsRepertoireEmpty()) {
					appState.userState.pastLandingPage = true;
				}
				if (TEST_MODE) {
					s.startBrowsing("white", TEST_MODE);
				} else if (!isEmpty(TEST_LINE)) {
					window.setTimeout(() => {
						s.startBrowsing("black", "build", {
							pgnToPlay: lineToPgn(TEST_LINE),
						});
					}, 100);
				}
			}),
		fetchRepertoire: (initial?: boolean) =>
			set(([s, appState]) => {
				const user = appState.userState.user;
				client
					.get("/api/v1/openings")
					.then(({ data }: { data: FetchRepertoireResponse }) => {
						set(([s]) => {
							s.repertoireFetched(data);
						});
					});
			}),
		pastFreeTier: (side: Side) =>
			get(([s]) => {
				if (!s.repertoire) {
					return false;
				}
				const numMoves = s.numResponses?.[side] ?? 0;
				return numMoves > MAX_MOVES_FREE_TIER;
			}),
		getNumResponsesBelowThreshold: (threshold: number, side: Side) =>
			get(([s]) => {
				return filter(getAllRepertoireMoves(s.repertoire), (m) => {
					const belowThreshold =
						m.incidence && m.incidence < threshold && m.mine;
					if (side) {
						return belowThreshold && m.side === side;
					} else {
						return belowThreshold;
					}
				}).length;
			}),
		getIsRepertoireEmpty: (side?: Side) =>
			get(([s]) => {
				if (!s.repertoire) {
					return true;
				}
				if (side) {
					return isEmpty(s.repertoire[side].positionResponses);
				}
				return every(
					SIDES.map((side) => isEmpty(s.repertoire![side]?.positionResponses)),
				);
			}),
		backToStartPosition: () =>
			set(([s]) => {
				if (s.ui.mode !== "review") {
					s.browsingState.chessboard.resetPosition();
					return;
				}
			}),
		fetchLichessMistakes: () => {
			set(([s, gs]) => {
				const connected =
					gs.userState.user?.lichessUsername ||
					gs.userState.user?.chesscomUsername;
				s.lichessMistakes = null;
				s.needsToRefetchLichessMistakes = false;
				if (connected) {
					client.get("/api/v2/get_lichess_mistakes").then(
						({
							data,
						}: {
							data: {
								mistakes: LichessMistake[];
								repertoire: FetchRepertoireResponse;
							};
						}) => {
							set(([s]) => {
								const { mistakes, repertoire } = data;
								s.lichessMistakes = mistakes;
								if (repertoire) {
									s.repertoireFetched(repertoire);
								}
							});
						},
					);
				}
			});
		},
	} as RepertoireState;

	return initialState;
};

function removeLastMove(id: string) {
	return dropRight(id.split(" "), 1).join(" ");
}

function getLastMoveWithNumber(id: string) {
	const [n, m] = last(id.split(" "))!.split(".");
	if (!m) {
		return n;
	}
	return `${n}. ${m}`;
}

export function mapSides<T, Y>(
	bySide: BySide<T>,
	fn: (x: T, side: Side) => Y,
): BySide<Y> {
	return {
		white: fn(bySide.white, "white"),
		black: fn(bySide.black, "black"),
	};
}
function getMoveNumber(id: string) {
	return Math.floor(id.split(" ").length / 2 + 1);
}

export const getExpectedNumMovesBetween = (
	current: number,
	destination: number,
	side: Side,
	high_transposition: boolean,
): number => {
	let m = 1;
	let distance_pow = 1.11;
	if (high_transposition && side === "white") {
		m = 1.5;
		distance_pow = 1.12;
	} else if (side === "black") {
		m = 1.05;
		distance_pow = 1.15;
	}
	const get_distance = (x: number, y: number) => {
		const distance = 1 / y / (1 / x);
		return distance ** distance_pow;
	};
	const distance = Math.max(0, get_distance(current, destination));
	return m * distance;
};

if (!isServer) {
	// @ts-ignore
	window.getExpectedNumMovesBetween = getExpectedNumMovesBetween;
}
