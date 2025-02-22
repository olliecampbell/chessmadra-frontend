import { filter, forEach, min } from "lodash-es";
import { For, Show, createMemo, onMount } from "solid-js";
import { getAppState, quick, useRepertoireState } from "~/utils/app_state";
import { START_EPD } from "~/utils/chess";
import { clsx } from "~/utils/classes";
import { pluralize } from "~/utils/pluralize";
import { Repertoire, RepertoireMove, Side } from "~/utils/repertoire";
import { bySide } from "~/utils/repertoire";
import { COMMON_MOVES_CUTOFF } from "~/utils/review";
import { trackEvent } from "~/utils/trackEvent";
import { Bullet } from "./Bullet";
import { CMText } from "./CMText";
import { ReviewText, getHumanTimeUntil } from "./ReviewText";
import { SidebarAction } from "./SidebarActions";
import { ChooseToCreateAccountOnboarding } from "./SidebarOnboarding";
import { SidebarTemplate } from "./SidebarTemplate";
import { Spacer } from "./Space";
import { animateSidebar } from "./SidebarContainer";
import { RateApp } from "capacitor-rate-app";
import { isNative } from "~/utils/env";
import { Notifications } from "~/utils/notifications";

export const PracticeComplete = () => {
	const [repertoire] = useRepertoireState((s) => [s.repertoire]);
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const [allReviewPositionMoves] = useRepertoireState((s) => [
		s.reviewState.allReviewPositionMoves,
	]);
	const moves = createMemo(() => {
		const moves: {
			epd: string;
			sanPlus: string;
			failed: boolean;
			side: Side;
		}[] = [];
		forEach(allReviewPositionMoves(), (sanLookup, epd) => {
			forEach(sanLookup, ({ failed, side }, sanPlus) => {
				moves.push({ epd, sanPlus, failed, side });
			});
		});
		return moves;
	});
	const numFailed = () => {
		return moves().filter((m) => m.failed).length;
	};
	const numCorrect = () => {
		return moves().filter((m) => !m.failed).length;
	};
	const total = () => {
		return moves().length;
	};
	const earliestDue = () => {
		const rep = repertoire() as Repertoire;
		const dues = moves().flatMap((m) => {
			return rep[m.side].positionResponses[m.epd]?.map((r: RepertoireMove) => {
				if (r.sanPlus === m.sanPlus) {
					return r.srs?.dueAt;
				}
			});
		});
		// can assume there will be one
		return new Date(min(filter(dues, (d) => d !== undefined)) as string);
	};
	onMount(() => {
		trackEvent("practice_complete", {
			num_failed: numFailed(),
			num_correct: numCorrect(),
		});

		if (
			Math.random() < 0.25 &&
			getAppState().userState.user?.subscribed &&
			isNative
		) {
			trackEvent("prompted_for_app_review");
			RateApp.requestReview();
		}
	});
	const activeOptions = () =>
		getAppState().repertoireState.reviewState.activeOptions;
	const [numMovesDueBySide] = useRepertoireState((s) => [
		bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
	]);
	const due = () => {
		const totalDue = () =>
			(numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
		const side = activeOptions()?.side;
		const due = side ? numMovesDueBySide()[side] : totalDue();
		return due;
	};
	const earlyQueue = createMemo(() => {
		if (due() === 0 && !onboarding()) {
			return getAppState().repertoireState.reviewState.buildQueue({
				side: activeOptions()?.side ?? null,
				filter: "early",
			});
		} else {
			return null;
		}
	});
	const commonQueue = createMemo(() => {
		return getAppState().repertoireState.reviewState.buildQueue({
			side: activeOptions()?.side ?? null,
			filter: "common",
		});
	});

	const actions = () => {
		const actions: SidebarAction[] = [];
		if (onboarding().isOnboarding) {
			return [
				{
					onPress: () => {
						quick((s) => {
							if (s.repertoireState.onboarding.isOnboarding) {
								trackEvent("onboarding.practice_complete.continue");
								s.repertoireState.ui.pushView(ChooseToCreateAccountOnboarding);
								s.repertoireState.updateRepertoireStructures();
							}
						});
					},
					text: "Continue",
					style: actions.length > 0 ? "secondary" : "primary",
				} as SidebarAction,
			];
		}
		if (due() > 0 && activeOptions()?.filter === "common") {
			actions.push({
				onPress: () => {
					quick((s) => {
						s.repertoireState.ui.popView();
						s.repertoireState.reviewState.startReview({
							side: activeOptions()?.side ?? null,
							filter: "common",
						});
						trackEvent("post_review.next_common_moves");
					});
				},
				text: "Practice next most common moves",
				right: <ReviewText numDue={commonQueue()?.length ?? 0} />,
				style: "secondary",
			});
		}
		const early = earlyQueue();
		if (early) {
			actions.push({
				onPress: () => {
					quick((s) => {
						s.repertoireState.ui.popView();
						s.repertoireState.reviewState.startReview({
							side: activeOptions()?.side ?? null,
							filter: "early",
						});
						trackEvent("post_review.next_common_moves");
					});
				},
				text: `Review your next ${pluralize(early.length, "move")} moves early`,
				right: null,
				style: "secondary",
			});
		}
		actions.push({
			onPress: () => {
				quick((s) => {
					trackEvent("practice_complete.continue");
					animateSidebar("left");
					s.repertoireState.backToOverview();
				});
			},
			text: "Continue",
			style: actions.length > 0 ? "secondary" : "primary",
		});
		if (activeOptions()?.customQueue) {
			actions.push({
				onPress: () => {
					quick((s) => {
						s.repertoireState.ui.popView();
						s.repertoireState.reviewState.startReview(activeOptions()!);
						trackEvent("post_review.practice_line_again");
					});
				},
				text: "Practice these moves again",
				style: "primary",
			});
		}
		return actions;
	};
	const bullets = () => {
		const totalDue =
			(numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
		const bullets = [];
		bullets.push(
			<>
				You practiced{" "}
				<span class={clsx("text-highlight font-semibold")}>
					{pluralize(total(), "move")}
				</span>
			</>,
		);
		bullets.push(
			<>
				You played the correct move{" "}
				<span class={clsx("text-highlight font-semibold")}>
					{pluralize(numCorrect(), "time")}
				</span>{" "}
				({Math.round((100 * numCorrect()) / total())}%)
			</>,
		);
		if (totalDue > 0) {
			bullets.push(
				<>
					You have{" "}
					<span class={clsx("text-highlight font-semibold")}>
						{pluralize(totalDue, "move")}
					</span>{" "}
					due for review now
				</>,
			);
		} else {
			bullets.push(
				<>
					These moves will be due for review again in{" "}
					<span class={clsx("text-highlight font-semibold")}>
						{getHumanTimeUntil(earliestDue())}
					</span>
				</>,
			);
		}
		return bullets;
	};
	return (
		<SidebarTemplate
			header={
				activeOptions()?.lichessMistakes
					? "Done reviewing mistakes"
					: "Practice complete!"
			}
			bodyPadding={true}
			actions={actions()}
		>
			<Show when={!activeOptions()?.lichessMistakes}>
				<CMText class={clsx("text-primay font-bold")}>
					Your stats from this session:
				</CMText>
				<Spacer height={12} />
				<div class={"space-y-2"}>
					<For each={bullets()}>{(bullet) => <Bullet>{bullet}</Bullet>}</For>
				</div>
			</Show>
			<Show when={activeOptions()?.lichessMistakes}>
				<CMText class={clsx("body-text")}>
					You're done reviewing your games for mistakes in the opening! Go play
					more games, or review your repertoire so you won't make these mistakes
					again.
				</CMText>
			</Show>
		</SidebarTemplate>
	);
};
