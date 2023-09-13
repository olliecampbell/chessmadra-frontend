import { destructure } from "@solid-primitives/destructure";
import { filter, isEmpty, isNil } from "lodash-es";
import {
	Match,
	Show,
	Switch,
	createEffect,
	createMemo,
	onCleanup,
	onMount,
} from "solid-js";
import { isServer } from "solid-js/web";
import { Puff } from "solid-spinner";
import { Spacer } from "~/components/Space";
import {
	useBrowsingState,
	useRepertoireState,
	useSidebarState,
	useUserState,
} from "~/utils/app_state";
import { StockfishReport } from "~/utils/models";
import { Side } from "~/utils/repertoire";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { shouldUsePeerRates } from "~/utils/table_scoring";
import { CMText } from "./CMText";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
import { InstructiveGamesView } from "./InstructiveGamesView";
import { RepertoireMovesTable } from "./RepertoireMovesTable";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

const desktopHeaderStyles = s(
	c.fg(c.colors.text.primary),
	c.fontSize(22),
	c.mb(12),
	c.weightBold,
);

export const Responses = function Responses() {
	const [currentEpd] = useSidebarState(([s]) => [s.currentEpd]);
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const [user] = useUserState((s) => [s.user]);
	const [positionReport] = useBrowsingState(
		// TODO: we should have the active side on sidebar too
		// @ts-ignore
		([s, rs]) => [rs.positionReports[activeSide()]?.[currentEpd()]],
	);
	createEffect(() => {
		// console.log("pos report", positionReport());
	});
	const [currentSide, currentLine, hasPendingLine, isPastCoverageGoal] =
		useSidebarState(([s]) => [
			s.currentSide,
			s.moveLog,
			s.hasPendingLineToAdd,
			s.isPastCoverageGoal,
		]);
	const [tableResponses] = useSidebarState(([s]) => [s.tableResponses]);

	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const usePeerRates = () => shouldUsePeerRates(positionReport());
	const [mode] = useSidebarState(([s]) => [s.mode]);
	const yourMoves = createMemo(() =>
		filter(tableResponses(), (tr) => {
			return !isNil(tr.repertoireMove) && activeSide() === currentSide();
		}),
	);
	const otherMoves = createMemo(() =>
		filter(tableResponses(), (tr) => {
			return isNil(tr.repertoireMove) && activeSide() === currentSide();
		}),
	);
	const prepareFor = createMemo(() =>
		filter(tableResponses(), (tr) => {
			return activeSide() !== currentSide();
		}),
	);
	if (!isServer) {
		const beforeUnloadListener = (event) => {
			if (hasPendingLine()) {
				event.preventDefault();
				const prompt =
					"You have an unsaved line, are you sure you want to exit?";
				event.returnValue = prompt;
				return prompt;
			}
		};
		addEventListener("beforeunload", beforeUnloadListener, { capture: true });
		onCleanup(() => {
			removeEventListener("beforeunload", beforeUnloadListener, {
				capture: true,
			});
		});
	}
	// createEffect(() => {
	// }, [hasPendingLine]);
	const { reviewHeader } = destructure(() => {
		let reviewHeader = null;

		if (mode() === "browse") {
			reviewHeader = "What do you want to review?";
		}
		return { reviewHeader };
	});
	const { header, body } = destructure(() => {
		if (reviewHeader()) {
			return { header: reviewHeader(), body: undefined };
		}
		return getResponsesHeader(
			currentLine(),
			yourMoves().length,
			activeSide()!,
			currentSide(),
			isPastCoverageGoal()!,
			onboarding().isOnboarding,
		);
	});
	const responses = createMemo(() => {
		if (!isEmpty(yourMoves())) {
			return yourMoves();
		} else if (!isEmpty(prepareFor())) {
			return prepareFor();
		} else {
			return tableResponses();
		}
	});
	return (
		<div style={s(c.column, c.constrainWidth)}>
			<Show when={positionReport()}>
				<>
					<Show
						when={
							!isEmpty(yourMoves()) ||
							(isEmpty(yourMoves()) && !isEmpty(otherMoves())) ||
							!isEmpty(prepareFor())
						}
					>
						<div style={s()} id={`your-moves-play-${currentEpd()}`}>
							<RepertoireMovesTable
								{...{
									header: header,
									body: body?.(),
									usePeerRates,
									activeSide: activeSide()!,
									side: currentSide()!,
									responses: responses,
								}}
							/>
						</div>
					</Show>

					<Show
						when={
							!isEmpty(yourMoves()) &&
							!isEmpty(otherMoves()) &&
							mode() === "build"
						}
					>
						<div style={s(c.mt(36))} id={`alternate-moves-${currentEpd}`}>
							<CollapsibleSidebarSection header="Add an alternative move">
								<Spacer height={12} />
								<RepertoireMovesTable
									{...{
										header: () => null,
										usePeerRates,
										activeSide: activeSide()!,
										side: currentSide()!,
										responses: otherMoves,
									}}
								/>
							</CollapsibleSidebarSection>
						</div>
					</Show>
				</>
			</Show>
			{user()?.isAdmin && <InstructiveGamesView />}
			<Switch>
				<Match when={!positionReport()}>
					<div style={s(c.center, c.column, c.py(48))}>
						<Puff color={c.primaries[60]} />
					</div>
				</Match>
				<Match when={isEmpty(tableResponses()) && isEmpty(yourMoves())}>
					<div
						style={s(
							c.column,
							c.alignCenter,
							c.selfCenter,
							c.px(12),
							c.maxWidth(240),
							c.py(48),
						)}
					>
						<CMText>
							<i
								class="fa-light fa-empty-set"
								style={s(c.fg(c.gray[50]), c.fontSize(24))}
							/>
						</CMText>
						<Spacer height={18} />
						<CMText style={s(c.fg(c.gray[75]))}>
							No moves available for this position. You can still add a move by
							playing it on the board.
						</CMText>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

const isGoodStockfishEval = (stockfish: StockfishReport, side: Side) => {
	if (!isNil(stockfish.eval) && stockfish.eval >= 0 && side === "white") {
		return true;
	}
	if (stockfish.mate && stockfish.mate > 0 && side === "white") {
		return true;
	}
	if (!isNil(stockfish.eval) && stockfish.eval <= 0 && side === "black") {
		return true;
	}
	if (stockfish.mate && stockfish.mate < 0 && side === "black") {
		return true;
	}
	return false;
};

function getResponsesHeader(
	currentLine: string[],
	myMoves: number,
	activeSide: Side,
	currentSide: Side,
	pastCoverageGoal: boolean,
	onboarding = false,
): { header: string; body?: string } {
	const hasMove = myMoves;
	if (activeSide !== currentSide) {
		let prepareForHeader: any = "Choose a move to prepare for";
		if (pastCoverageGoal) {
			prepareForHeader = "Most common responses";
		}
		return {
			header: prepareForHeader,
			body:
				onboarding && currentLine.length < 2
					? "You'll need to cover all of these eventually, but just pick one you're familiar with for now."
					: undefined,
		};
	}
	if (myMoves) {
		if (myMoves === 1) {
			return { header: "This move is in your repertoire" };
		} else {
			return { header: "These moves are in your repertoire" };
		}
	}
	if (!hasMove && isEmpty(currentLine)) {
		if (onboarding) {
			return {
				header: "Let's add the first line to your repertoire",
				body: "To start with, choose the first move you play as white...",
			};
		}
		return { header: "Which first move do you play as white?" };
	}
	if (activeSide === "black" && currentLine.length === 1) {
		return {
			header: `What do you play as black against 1. ${currentLine[0]}?`,
			body:
				currentLine.length < 4 && onboarding
					? "Not sure what to play? Check the stats beside each move to help decide."
					: undefined,
		};
	}
	return {
		header: `${hasMove ? "Your" : "Choose your"} ${
			isEmpty(currentLine) ? "first" : "next"
		} move`,
		body:
			currentLine.length < 2 && onboarding
				? "Not sure what to play? Check the stats beside each move to help decide."
				: undefined,
	};
}
