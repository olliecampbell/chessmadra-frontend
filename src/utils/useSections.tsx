/* eslint-disable solid/reactivity, solid/components-return-once */

import { destructure } from "@solid-primitives/destructure";
import { clamp, isNil } from "lodash-es";
import { Accessor, JSXElement, Show } from "solid-js";
import { CMText } from "~/components/CMText";
import { GameResultsBar } from "~/components/GameResultsBar";
import { TableResponse } from "~/components/RepertoireMovesTable";
import { ReviewText } from "~/components/ReviewText";
import { initTooltip } from "~/components/Tooltip";
import {
	useDebugState,
	useRepertoireState,
	useSidebarState,
	useUserState,
} from "~/utils/app_state";
import { getCoverageProgress } from "~/utils/browsing_state";
import { PositionReport, SuggestedMove } from "~/utils/models";
import { Side, otherSide } from "~/utils/repertoire";
import {
	formatPlayPercentage,
	getPlayRate,
	getTotalGames,
	getWinRate,
	isNegligiblePlayrate,
} from "~/utils/results_distribution";
import { formatStockfishEval } from "~/utils/stockfish";
import { c, s } from "~/utils/styles";
import { clsx } from "./classes";
import { MoveRating } from "./move_inaccuracy";
import { pluralize } from "./pluralize";

interface SectionProps {
	suggestedMove?: SuggestedMove;
	positionReport?: PositionReport;
	tableResponse: TableResponse;
	tableMeta?: TableMeta;
	earliestDueDate?: string;
	numMovesDueFromHere?: number;
	side: Side;
}

interface Section {
	width: number;
	header: string;
	alignLeft?: boolean;
	alignRight?: boolean;
	content: (_: {
		suggestedMove: SuggestedMove;
		positionReport: PositionReport;
		tableResponse: TableResponse;
		tableMeta: TableMeta;
		earliestDueDate: string;
		numMovesDueFromHere: number;
		side: Side;
	}) => JSXElement;
}

export interface TableMeta {
	highestIncidence: number;
}
interface UseSectionProps {
	myTurn: boolean;
	usePeerRates?: boolean;
	isMobile: boolean;
}

export const useSections = ({
	myTurn,
	usePeerRates,
	isMobile,
}: UseSectionProps) => {
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const [debugUi] = useDebugState((s) => [s.debugUi]);
	const [threshold] = useUserState((s) => [s.getCurrentThreshold()]);
	let sections: Section[] = [];
	const textStyles = s(
		c.fg(c.gray[80]),
		c.weightSemiBold,
		c.fontSize(12),
		c.lineHeight("1.3rem"),
	);
	const side: Accessor<Side> = () => activeSide() as Side;

	const [mode] = useSidebarState(([s]) => [s.mode]);
	if (mode() === "browse") {
		sections = sections.concat(
			getReviewModeSections({
				myTurn,
				textStyles,
				usePeerRates,
				isMobile,
				debugUi: debugUi(),
				threshold: threshold(),
				activeSide: side(),
			}),
		);
	} else {
		sections = sections.concat(
			// @ts-ignore
			getBuildModeSections({
				myTurn,
				textStyles,
				usePeerRates,
				isMobile,
				debugUi: debugUi(),
				threshold: threshold(),
				activeSide: side(),
			}),
		);
	}
	return sections;
};
interface GetSectionProps extends UseSectionProps {
	debugUi: boolean;
	threshold: number;
	activeSide: Side;
	textStyles: object;
}

const getBuildModeSections = ({
	myTurn,
	usePeerRates,
	isMobile,
	debugUi,
	activeSide,
	threshold,
	textStyles,
}: GetSectionProps) => {
	const sections = [];
	const naStyles = s(textStyles, c.fg(c.gray[50]));
	const na = () => <p style={s(naStyles)}>0%</p>;
	if (!myTurn) {
		sections.push({
			width: 100,
			alignLeft: true,
			content: (props: SectionProps) => {
				const playRate =
					props.suggestedMove &&
					props.positionReport &&
					getPlayRate(props.suggestedMove, props.positionReport, false);
				const denominator = Math.round(
					1 / (props.tableResponse!.suggestedMove?.incidence ?? 0.0001),
				);
				const belowCoverageGoal =
					(props.tableResponse.suggestedMove?.incidence ?? 0) < threshold;
				let veryRare = false;
				let hideGamesText = false;
				if (denominator >= 1000) {
					hideGamesText = true;
				}
				if (denominator >= 10000) {
					veryRare = true;
				}
				const sanPlus =
					props.tableResponse.repertoireMove?.sanPlus ??
					props.tableResponse.suggestedMove?.sanPlus;
				return (
					<>
						{
							<div
								style={s(c.column)}
								ref={(ref) => {
									initTooltip({
										ref,
										content: () => (
											<p>
												{veryRare ? (
													<>
														You should expect to see this move in less than 1 in
														10,000 games.
													</>
												) : (
													<>
														You'll see the position after <b>{sanPlus}</b> in{" "}
														<b>1 in {denominator.toLocaleString()}</b> games as{" "}
														{otherSide(props.side)}
													</>
												)}
											</p>
										),
										maxWidth: 200,
									});
								}}
							>
								<CMText
									style={s(
										textStyles,
										belowCoverageGoal && s(c.fg(c.gray[44])),
									)}
								>
									{veryRare ? (
										<>Very rare</>
									) : (
										<>
											<b>1</b> in <b>{denominator.toLocaleString()}</b>{" "}
											{hideGamesText ? "" : "games"}
										</>
									)}
								</CMText>
								<Show when={debugUi}>
									<CMText style={s(c.fg(c.colors.debugColorDark))}>
										{(playRate! * 100).toFixed(2)}
									</CMText>
								</Show>
							</div>
						}
					</>
				);
			},
			header: "Expected in",
		});
	}
	if (!myTurn) {
		sections.push({
			width: 80,
			alignLeft: true,
			content: (props: SectionProps) => {
				return (
					<>{<CoverageProgressBar tableResponse={props.tableResponse} />}</>
				);
			},
			header: "Your coverage",
		});
	}
	if (myTurn) {
		sections.push({
			width: 34,
			alignRight: true,
			content: (props: {
				suggestedMove: SuggestedMove;
				positionReport: PositionReport;
			}) => {
				const playRate =
					props.suggestedMove &&
					props.positionReport &&
					getPlayRate(
						props.suggestedMove,
						props.positionReport,
						usePeerRates ? false : true,
					);

				return (
					<div
						ref={(ref) => {
							initTooltip({
								ref,
								content: () => (
									<p>
										<b>{formatPlayPercentage(playRate)}</b> of{" "}
										{usePeerRates ? "players in your rating range" : "masters"}{" "}
										choose this move
									</p>
								),
								maxWidth: 200,
							});
						}}
					>
						<Show when={!isNegligiblePlayrate(playRate)} fallback={na()}>
							<p style={s(textStyles)}>{formatPlayPercentage(playRate)}</p>
						</Show>
					</div>
				);
			},
			header: usePeerRates ? "Peers" : "Masters",
		});
	}
	if (myTurn) {
		sections.push({
			width: 40,
			content: (props: SectionProps) => {
				const stockfishEval = props.suggestedMove?.stockfish?.eval;
				const mate = props.suggestedMove?.stockfish?.mate;
				const whiteWinning =
					(!isNil(stockfishEval) && stockfishEval >= 0) ||
					(!isNil(mate) && mate >= 0 && props.side === "white");
				const backgroundSide = whiteWinning ? "white" : "black";
				const moveRating: MoveRating = props.tableResponse.moveRating!;
				const isBadMove = !isNil(moveRating);
				const formattedEval = formatStockfishEval(
					props.suggestedMove?.stockfish!,
					props.side,
				);
				return (
					<>
						<Show when={props.suggestedMove?.stockfish}>
							<>
								<div
									style={s(
										c.row,
										c.bg(whiteWinning ? c.gray[90] : c.gray[4]),
										c.px(4),
										c.minWidth(30),
										c.height(18),
										c.center,
										c.br(2),
									)}
									ref={(ref) => {
										initTooltip({
											ref,
											content: () => {
												if (props.suggestedMove?.stockfish?.mate === 0) {
													return "Checkmate.";
												}
												if (formattedEval === "=") {
													return (
														<p>
															After this move, the computer evaluates the
															position as <b>equal</b>
														</p>
													);
												} else if (props.suggestedMove?.stockfish?.mate) {
													const mateMoves =
														props.suggestedMove?.stockfish?.mate;
													const side = mateMoves > 0 ? "white" : "black";
													return `This position is a forced mate in ${pluralize(
														mateMoves,
														"move",
													)} for ${side}`;
												} else if (props.suggestedMove?.stockfish?.eval) {
													const betterSide = whiteWinning ? "white" : "black";
													return (
														<p>
															The computer evaluates this move as{" "}
															<b>better for {betterSide}</b> by the equivalent
															of <b>{formattedEval.replace(/[-+]/, "")} </b>
															pawns
														</p>
													);
												}
											},
											maxWidth: 200,
										});
									}}
								>
									<CMText
										style={s(c.weightHeavy, c.fontSize(10))}
										class={clsx(
											backgroundSide === "white"
												? "text-gray-10"
												: "text-gray-90",
										)}
									>
										{formattedEval}
									</CMText>
								</div>
							</>
						</Show>
					</>
				);
			},
			header: "Eval",
		});
	}
	if (myTurn) {
		sections.push({
			width: isMobile ? 80 : 80,
			content: (props: SectionProps) => {
				if (!props.suggestedMove?.results) {
					return na();
				}
				return (
					<>
						<Show when={props.suggestedMove}>
							<div
								style={s(c.fullWidth)}
								ref={(ref) => {
									initTooltip({
										ref,
										content: () => {
											return (
												<div>
													<p class="text-left">
														<span class="block pb-2">
															When this is played at your level:
														</span>
														•
														<span class="pr-2" />
														White wins{" "}
														<b>
															{formatPlayPercentage(
																getWinRate(
																	props.suggestedMove?.results!,
																	"white",
																),
															)}
														</b>{" "}
														of games <br />
														•
														<span class="pr-2" />
														Black wins{" "}
														<b>
															{formatPlayPercentage(
																getWinRate(
																	props.suggestedMove?.results!,
																	"black",
																),
															)}
														</b>{" "}
														of games <br />
														•
														<span class="pr-2" />
														<b>
															{formatPlayPercentage(
																1 -
																	getWinRate(
																		props.suggestedMove?.results!,
																		"white",
																	) -
																	getWinRate(
																		props.suggestedMove?.results!,
																		"black",
																	),
															)}
														</b>{" "}
														of games are drawn
													</p>
													{props.tableResponse.lowConfidence && (
														<p class="pt-2 text-left">
															<i class="fa fa-warning pr-1 text-yellow-50" />{" "}
															Small sample size (
															{getTotalGames(props.suggestedMove!.results)}{" "}
															games)
														</p>
													)}
												</div>
											);
										},
										maxWidth: 240,
									});
								}}
							>
								<GameResultsBar
									previousResults={props.positionReport?.results}
									lowConfidence={!!props.tableResponse.lowConfidence}
									activeSide={activeSide}
									gameResults={props.suggestedMove.results}
								/>
							</div>
						</Show>
					</>
				);
			},
			header: isMobile ? "Peer results" : "Peer results",
		});
	}
	return sections;
};

const CoverageProgressBar = (props: { tableResponse: TableResponse }) => {
	const epdAfter = () =>
		props.tableResponse.suggestedMove?.epdAfter ??
		(props.tableResponse.repertoireMove?.epdAfter as string);
	const [activeSide] = useSidebarState(([s]) => [s.activeSide as Side]);
	const [hasResponse, numMovesFromHere, expectedNumMovesNeeded, missFromHere] =
		useRepertoireState((s) => [
			// @ts-ignore
			s.repertoire?.[activeSide()]?.positionResponses[epdAfter()]?.length > 0,
			s.numMovesFromEpd[activeSide()][epdAfter()],
			s.expectedNumMovesFromEpd[activeSide()][epdAfter()],
			s.repertoireGrades[activeSide()]?.biggestMisses[epdAfter()],
		]);

	const backgroundColor = c.gray[28];
	const completedColor = c.colors.success;
	const { completed, progress } = destructure(() => {
		let completed = isNil(missFromHere());
		let progress = clamp(
			getCoverageProgress(numMovesFromHere(), expectedNumMovesNeeded()),
			5,
			95,
		);
		if (!hasResponse()) {
			progress = 0;
			completed = false;
		}
		return { completed, progress };
	});
	const inProgressColor = () => (progress() < 20 ? c.red[65] : c.orange[65]);
	return (
		<div
			style={s(c.column, c.fullWidth)}
			class="py-1"
			ref={(ref) => {
				initTooltip({
					ref,
					content: () => {
						if (completed()) {
							return "You've reached your coverage goal for this move";
						}
						if (progress() === 0) {
							return "You haven't added any responses to this move";
						}
						return "Your coverage of this move is incomplete";
					},
					maxWidth: 160,
				});
			}}
		>
			<div
				style={s(
					c.fullWidth,
					c.bg(backgroundColor),
					c.round,
					c.overflowHidden,
					c.height(4),
				)}
			>
				<div
					style={s(
						c.width(completed() ? "100%" : `${progress()}%`),
						c.bg(completed() ? completedColor : inProgressColor()),
						c.fullHeight,
					)}
				/>
			</div>
		</div>
	);
};
const getReviewModeSections = ({
	myTurn,
	usePeerRates,
	isMobile,
	debugUi,
	activeSide,
	threshold,
	textStyles,
}: GetSectionProps) => {
	const sections: Section[] = [];

	sections.push({
		width: 140,
		alignRight: true,
		content: (props) => {
			return (
				<ReviewText
					date={props.tableResponse.reviewInfo!.earliestDue}
					numDue={props.tableResponse.reviewInfo!.due}
				/>
			);
		},
		header: "",
	});

	return sections;
};
