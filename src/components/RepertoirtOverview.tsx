import { capitalize, findLast, first, isNil } from "lodash-es";
import { Accessor, Show, createMemo, createSignal } from "solid-js";
import { Spacer } from "~/components/Space";
import {
	getAppState,
	quick,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { BrowsingMode } from "~/utils/browsing_state";
import { START_EPD, lineToPositions } from "~/utils/chess";
import { clsx } from "~/utils/classes";
import { getAppropriateEcoName, useLineEcoCode } from "~/utils/eco_codes";
import { isDevelopment } from "~/utils/env";
import { useIsMobileV2 } from "~/utils/isMobile";
import { InstructiveGame } from "~/utils/models";
import { pluralize } from "~/utils/pluralize";
import { Side, lineToPgn, pgnToLine } from "~/utils/repertoire";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { CMText } from "./CMText";
import { ConfirmDeleteRepertoire } from "./ConfirmDeleteRepertoire";
import { CoverageBar } from "./CoverageBar";
import { Label } from "./Label";
import { PreReview } from "./PreReview";
import { RepertoireCompletion } from "./RepertoireCompletion";
import { ReviewText } from "./ReviewText";
import {
	SeeMoreActions,
	SidebarAction,
	SidebarActions,
} from "./SidebarActions";
import { animateSidebar } from "./SidebarContainer";
import { SidebarInstructiveGames } from "./SidebarInstructiveGames";
import {
	ChooseImportSourceOnboarding,
	TrimRepertoireOnboarding,
} from "./SidebarOnboarding";
import { SidebarTemplate } from "./SidebarTemplate";

export const RepertoireOverview = () => {
	const [side] = useSidebarState(([s]) => [s.activeSide]);
	const textClasses = "text-primary font-semibold";
	const appState = getAppState();
	const { repertoireState } = appState;
	const biggestMiss = () =>
		repertoireState.repertoireGrades[side()!]?.biggestMiss;
	const numMoves = () => repertoireState.numMyMoves?.[side()!] ?? 0;
	const numMovesDueFromHere = () =>
		repertoireState.numMovesDueFromEpd[side()!][START_EPD];
	const earliestDueDate = () =>
		repertoireState.earliestReviewDueFromEpd[side()!][START_EPD];
	const modelGames: Accessor<InstructiveGame[]> = () => {
		return repertoireState.positionReports[side() as Side][START_EPD]
			?.instructiveGames;
	};
	const miss = createMemo(() => {
		const miss = biggestMiss();
		if (miss) {
			const { name } = useLineEcoCode(pgnToLine(first(miss.lines)!))() ?? {};
			return {
				name,
			};
		}
		return null;
	});

	const empty = () => numMoves() === 0;
	const startBrowsing = (mode: BrowsingMode, skipAnimation?: boolean) => {
		quick((s) => {
			if (skipAnimation) {
				s.repertoireState.startBrowsing(side()!, mode);
			} else {
				s.repertoireState.startBrowsing(side()!, mode);
			}
		});
	};
	const reviewTimer = () => {
		console.log({
			movesDue: numMovesDueFromHere(),
			earliest: earliestDueDate(),
		});
		const reviewTimer = (
			<ReviewText
				date={earliestDueDate()}
				numDue={numMovesDueFromHere()}
				overview={true}
			/>
		);
		return reviewTimer;
	};
	const options = () =>
		[
			{
				right: miss()?.name,

				onPress: () => {
					quick((s) => {
						animateSidebar("right");
						const line = pgnToLine(biggestMiss()!.lines[0]);
						s.repertoireState.startBrowsing(side()!, "build", {
							pgnToPlay: lineToPgn(line),
						});

						return;
					});
				},
				text: <CMText class={clsx(textClasses)}>Go to your biggest gap</CMText>,
				style: "secondary",
				hidden: !miss(),
			},
			{
				// right: !empty() && (
				// 	<p class="text-tertiary text-sm">{pluralize(numMoves(), "move")}</p>
				// ),

				onPress: () => {
					quick((s) => {
						animateSidebar("right");
						startBrowsing("build", empty());
						if (empty()) {
							trackEvent("side_overview.start_building");
						} else {
							trackEvent("side_overview.keep_building");
						}
						return;
					});
				},
				text: (
					<CMText class={clsx(textClasses)}>
						{empty()
							? "Start building your repertoire"
							: isNil(biggestMiss())
							? "Browse / add new moves"
							: "Browse / edit something else"}
					</CMText>
				),
				style: "secondary",
			},
			{
				hidden: empty(),
				onPress: () => {
					quick((s) => {
						trackEvent("side_overview.start_review");
						s.repertoireState.ui.pushView(PreReview, {
							props: { side: side() },
						});
					});
				},
				right: reviewTimer,
				text: (
					<CMText class={clsx(textClasses)}>Practice your repertoire</CMText>
				),
				style: "secondary",
			},
			{
				hidden: modelGames()?.length === 0,
				onPress: () => {
					trackEvent("side_overview.view_instructive_games");
					quick((s) => {
						s.repertoireState.ui.replaceView(SidebarInstructiveGames, {
							props: { games: modelGames() },
						});
					});
				},
				text: (
					<div class={clsx("row items-center")}>
						<CMText class={clsx(textClasses)}>
							View model games in lines you play
						</CMText>
						<Label>Beta</Label>
					</div>
				),
				right: null,
				style: "secondary",
			},
			{
				hidden: !expanded() || !isDevelopment,
				onPress: () => {
					trackEvent("side_overview.trim");
					quick((s) => {
						s.repertoireState.ui.pushView(TrimRepertoireOnboarding);
					});
				},
				text: <CMText class={clsx(textClasses)}>Trim repertoire</CMText>,
				icon: "fa-sharp fa-file-import",
				right: null,
				style: "secondary",
			},
			{
				hidden: !(expanded() || empty()),
				onPress: () => {
					trackEvent("side_overview.import");
					quick((s) => {
						s.repertoireState.ui.pushView(ChooseImportSourceOnboarding, {
							props: { side: side() },
						});
					});
				},
				text: <CMText class={clsx(textClasses)}>Import</CMText>,
				icon: "fa-sharp fa-file-import",
				right: null,
				style: "secondary",
			},
			{
				onPress: () => {
					quick((s) => {
						trackEvent("side_overview.export");
						// @ts-ignore
						s.repertoireState.exportPgn(side());
					});
				},
				hidden: !expanded(),
				text: <CMText class={clsx(textClasses)}>Export repertoire</CMText>,
				icon: "fa-sharp fa-arrow-down-to-line",
				right: null,
				style: "secondary",
			},
			{
				hidden: !expanded(),
				onPress: () => {
					quick((s) => {
						trackEvent("side_overview.delete_repertoire");
						s.repertoireState.ui.replaceView(ConfirmDeleteRepertoire);
					});
				},
				text: <CMText class={clsx(textClasses)}>Delete repertoire</CMText>,
				icon: "fa-sharp fa-trash",
				right: null,
				style: "secondary",
			},
		].filter((o) => {
			return !o.hidden;
		}) as SidebarAction[];
	const [expanded, setExpanded] = createSignal(false);
	return (
		<SidebarTemplate
			header={`${capitalize(side())} Repertoire`}
			actions={[]}
			bodyPadding={false}
		>
			<div class="padding-sidebar">
				<RepertoireCompletion side={side()!} />
			</div>
			<Spacer height={48} />
			<SidebarActions actions={options()} />
			<Show when={!empty()}>
				<SeeMoreActions
					text={!expanded() ? "More options..." : "Hide"}
					onClick={() => setExpanded(!expanded())}
				/>
			</Show>
		</SidebarTemplate>
	);
};

export const CoverageAndBar = (props: {
	side: Side;
	hideBar?: boolean;
}) => {
	const [progressState] = useRepertoireState((s) => [
		s.browsingState.repertoireProgressState[props.side],
	]);

	return (
		<div style={stylex(c.row, c.alignCenter)}>
			<CMText class="text-secondary font-semibold text-xs">
				{progressState().completed ? (
					<>Completed</>
				) : (
					<>{Math.round(progressState().percentComplete * 100)}% Complete</>
				)}
			</CMText>
			<Show when={!props.hideBar}>
				<>
					<Spacer width={8} />
					<div style={stylex(c.height(4), c.width(80), c.row)}>
						<CoverageBar side={props.side} />
					</div>
				</>
			</Show>
		</div>
	);
};
