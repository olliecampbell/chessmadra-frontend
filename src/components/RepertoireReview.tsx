import { Chess, Move } from "@lubert/chess.ts";
import { destructure } from "@solid-primitives/destructure";
import { filter, find, first, forEach, isNil, range } from "lodash-es";
import { Accessor, For, JSX, Show, createMemo, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { Spacer } from "~/components/Space";
import { useHovering } from "~/mocks";
import {
	getAppState,
	quick,
	useMode,
	useRepertoireState,
} from "~/utils/app_state";
import { START_EPD } from "~/utils/chess";
import { clsx } from "~/utils/classes";
import { useIsMobileV2 } from "~/utils/isMobile";
import { pieceSymbolToPieceName } from "~/utils/plans";
import { Quiz, QuizGroup } from "~/utils/queues";
import { Side } from "~/utils/repertoire";
import { c, stylex } from "~/utils/styles";
import {
	BOARD_THEMES_BY_ID,
	BoardTheme,
	COMBINED_THEMES_BY_ID,
	CombinedTheme,
	combinedThemes,
} from "~/utils/theming";
import { trackEvent } from "~/utils/trackEvent";
import { ChessboardArrowView } from "./ChessboardArrow";
import { Intersperse } from "./Intersperse";
import { SidebarHeader } from "./RepertoireEditingHeader";
import { SidebarAction } from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import { animateSidebar } from "./SidebarContainer";
import { Square } from "@lubert/chess.ts/dist/types";

export const RepertoireReview = () => {
	const isMobile = useIsMobileV2();
	const [completedReviewPositionMoves, currentMove, showNext] =
		useRepertoireState((s) => [
			s.reviewState.completedReviewPositionMoves,
			s.reviewState.currentQuizGroup,
			s.reviewState.showNext,
		]);
	const reviewOptions = () =>
		getAppState().repertoireState.reviewState.activeOptions;
	const reviewingMistakes = () => reviewOptions()?.lichessMistakes;
	const mode = useMode();
	const side = () =>
		getAppState().repertoireState.reviewState.reviewSide as Side;
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const [allReviewPositionMoves] = useRepertoireState((s) => [
		s.reviewState.allReviewPositionMoves,
	]);
	const [reviewStats] = useRepertoireState((s) => [s.reviewState.reviewStats]);
	const moves = createMemo(() => {
		const moves: {
			epd: string;
			sanPlus: string;
			failed: boolean;
			side: Side;
		}[] = [];
		forEach(allReviewPositionMoves(), (sanLookup, epd) => {
			forEach(sanLookup, ({ failed, side, reviewed }, sanPlus) => {
				if (reviewed) {
					moves.push({ epd, sanPlus, failed, side });
				}
			});
		});
		return moves;
	});
	const progressIcons = () => {
		if (reviewingMistakes()) {
			return [];
		}
		return [
			{
				icon: "fa fa-clock",
				class: "text-yellow-60",
				text: `${reviewStats().due + 1} Due`,
			},
			{
				icon: "fa fa-circle-check",
				class: "text-green-60",
				text: reviewStats().correct,
			},
			{
				icon: "fa fa-circle-xmark",
				class: "text-red-60",
				text: reviewStats().incorrect,
			},
		];
	};
	const actions: Accessor<(SidebarAction & { hidden?: boolean })[]> = () => [
		{
			onPress: () => {
				quick((s) => {
					animateSidebar("right");
					if (s.repertoireState.reviewState.showNext) {
						s.repertoireState.reviewState.setupNextMove();
					} else {
						trackEvent(`${mode()}.give_up`);
						s.repertoireState.reviewState.giveUp();
					}
				});
			},
			style: showNext() ? "focus" : "primary",
			text: showNext()
				? "Got it, continue practicing"
				: "I don't know, show me the answer",
		},
		{
			onPress: () => {
				quick((s) => {
					animateSidebar("right");
					s.repertoireState.reviewState.setupNextMove();
				});
			},
			hidden: !currentMove()?.lichessMistake,
			style: "primary",
			text: "Skip this move, I meant to play it",
		},
		{
			onPress: () => {
				quick((s) => {
					trackEvent(`${mode()}.inspect_line`);
					const m = currentMove() as QuizGroup;
					s.repertoireState.backToOverview();
					s.repertoireState.startBrowsing(m.side, "build", {
						pgnToPlay: m.line,
						animated: false,
					});
				});
			},
			style: "primary",
			hidden: onboarding().isOnboarding || !currentMove(),
			text: "Exit practice and view in repertoire builder",
		},
	];
	const userState = getAppState().userState;
	const user = () => userState.user;
	const combinedTheme: Accessor<CombinedTheme> = createMemo(
		() =>
			find(combinedThemes, (theme) => theme.boardTheme === user()?.theme) ||
			COMBINED_THEMES_BY_ID.default,
	);
	const theme: Accessor<BoardTheme> = () =>
		BOARD_THEMES_BY_ID[combinedTheme().boardTheme];
	const num = () => Quiz.getMoves(currentMove()!)?.length ?? 0;
	const numCompleted = () =>
		filter(
			Quiz.getMoves(currentMove()!),
			(m) => !isNil(completedReviewPositionMoves()?.[m.sanPlus]),
		).length;
	const isPlanPractice = () => !!Quiz.getPlans(currentMove()!);
	const reviewState = () => getAppState().repertoireState.reviewState;
	const body: Accessor<JSX.Element> = () => {
		const lichessMistake = currentMove()?.lichessMistake;
		if (reviewingMistakes() && lichessMistake) {
			return (
				<>
					In this position in{" "}
					<a
						href={
							lichessMistake.source === "lichess"
								? `https://lichess.org/${lichessMistake.gameId}`
								: `https://chess.com/game/live/${lichessMistake.gameId}`
						}
						target={"_blank"}
						rel="noreferrer"
						class="font-semibold "
					>
						your game
						{lichessMistake.opponentName &&
							` against ${lichessMistake.opponentName}`}
					</a>
					, you played{" "}
					<span
						class={clsx(
							"text-orange-50 font-semibold cursor-pointer hover:bg-orange-10 p-0.5 -mr-0.5 rounded-sm",
						)}
						{...wrongMoveHoverProps}
					>
						{lichessMistake.playedSan}
					</span>
					. Play the correct move on the board.
				</>
			);
		}
		if (showNext() && !isPlanPractice()) {
			if (num() === 1) {
				return "This move is in your repertoire";
			} else {
				return null;
			}
		}
		const plans = Quiz.getRemainingPlans(
			currentMove()!,
			reviewState().planIndex,
		);
		if (isPlanPractice()) {
			const plan = first(plans);
			if (!plan) {
				return (
					<>
						These are your plans from this position, take a second to review
						them
					</>
				);
			}
			if (plan.type === "castling") {
				return (
					<>
						Which side does{" "}
						<span
							class="rounded-sm p-1 py-0.5 font-bold"
							style={{ "background-color": theme().highlightNextMove }}
						>
							{side()}
						</span>{" "}
						usually castle to? Tap on the board to indicate the correct square.
					</>
				);
			}
			return (
				<>
					Where does the{" "}
					<span
						class="rounded-sm p-1 py-0.5 font-bold"
						style={{ "background-color": theme().highlightNextMove }}
					>
						{pieceSymbolToPieceName(plan.piece)} on {plan.fromSquare}
					</span>{" "}
					usually belong? Tap on the board to indicate the correct square.
				</>
			);
		}
		const moves = Quiz.getMoves(currentMove()!);
		if (moves?.length === 1) {
			if (moves[0].epd === START_EPD) {
				return "Play your first move on the board";
			} else {
				return "Play the correct move on the board";
			}
		} else {
			return `You have ${moves?.length} responses to this position in your repertoire. Play all your responses on the board`;
		}
	};
	const { hovering: wrongMoveHovered, hoveringProps: wrongMoveHoverProps } =
		useHovering();
	const [arrowToSquare, arrowFromSquare] = destructure(() => {
		const lichessMistake = currentMove()?.lichessMistake;
		if (!lichessMistake) {
			return [null, null];
		}
		const fen = `${lichessMistake.epd} 0 1`;
		const position = new Chess(fen);
		const [move] = position.validateMoves([lichessMistake.playedSan]) as [Move];
		return [move?.to as Square, move?.from as Square];
	});

	const mountPoint = getAppState().repertoireState.reviewState.chessboard.get(
		(s) => s.refs.arrowsContainerRef,
	);
	return (
		<>
			<Portal mount={mountPoint ?? undefined}>
				<div>
					<Show when={currentMove()?.lichessMistake}>
						<ChessboardArrowView
							faded={false}
							color={c.orange[55]}
							focused={wrongMoveHovered()}
							flipped={getAppState().repertoireState.reviewState.chessboard.get(
								(c) => c.flipped,
							)}
							hidden={!wrongMoveHovered()}
							toSquare={arrowToSquare()!}
							fromSquare={arrowFromSquare()!}
						/>
					</Show>
				</div>
			</Portal>
			<SidebarTemplate
				header={null}
				actions={filter(actions(), (a) => !a.hidden)}
				bodyPadding={true}
			>
				<div class={"row w-full items-baseline justify-between"}>
					<SidebarHeader>
						{reviewingMistakes()
							? "Reviewing mistakes"
							: isMobile()
							? "Practice"
							: `Practicing ${isPlanPractice() ? "plans" : "moves"}`}
					</SidebarHeader>
					<div class="row items-center space-x-4 lg:space-x-8">
						<For each={progressIcons()}>
							{(i) => {
								return (
									<div class="row items-center">
										<p
											class={clsx(
												i.class,
												"text-sm font-semibold lg:text-base",
											)}
										>
											{i.text}
										</p>
										<i
											class={clsx(
												i.class,
												i.icon,
												" ml-2 text-sm lg:text-base",
											)}
										/>
									</div>
								);
							}}
						</For>
					</div>
				</div>
				<div class={"h-4 lg:h-10"} />
				<p class="body-text leading-5">{body()}</p>
				<Show when={num() > 1}>
					<>
						<div
							class="mt-2 row overflow-hidden w-full h-3 rounded-full items-stretch"
							style={stylex(c.border(`1px solid ${c.gray[20]}`))}
						>
							{(() => {
								return null;
							})()}
							<Intersperse
								each={() => range(num())}
								separator={() => {
									return (
										<div
											class={clsx("bg-gray-20 w-0.5")}
											style={stylex(c.fullHeight)}
										/>
									);
								}}
							>
								{(x: Accessor<number>) => {
									const hasCompleted = () => x() < numCompleted();
									return (
										<div
											class={clsx(
												hasCompleted() ? "bg-gray-80" : "bg-gray-40",
												"transition-colors",
											)}
											style={stylex(c.grow)}
										/>
									);
								}}
							</Intersperse>
						</div>
						<Spacer height={12} />
					</>
				</Show>
			</SidebarTemplate>
		</>
	);
};
