import { filter, some, sum, values } from "lodash-es";
import { createMemo } from "solid-js";
import { getAppState, quick, useRepertoireState } from "~/utils/app_state";
import { START_EPD } from "~/utils/chess";
import { clsx } from "~/utils/classes";
import { useIsMobileV2 } from "~/utils/isMobile";
import { Quiz, countQueue } from "~/utils/queues";
import { Side } from "~/utils/repertoire";
import { bySide } from "~/utils/repertoire";
import { COMMON_MOVES_CUTOFF } from "~/utils/review";
import { isMoveDifficult } from "~/utils/srs";
import { trackEvent } from "~/utils/trackEvent";
import { Label } from "./Label";
import { ReviewText } from "./ReviewText";
import { SidebarAction } from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";

export const PreReview = (props: { side: Side | null }) => {
	const [numMovesDueBySide] = useRepertoireState((s) => [
		bySide((side) => s.numMovesDueFromEpd[side]?.[START_EPD]),
	]);
	const queue = createMemo(() =>
		getAppState().repertoireState.reviewState.buildQueue({
			side: props.side,
			filter: "due",
		}),
	);
	const actions = () => {
		const actions: SidebarAction[] = [];
		// todo: this could be more performant
		const difficultCount = countQueue(
			filter(queue(), (m) => some(Quiz.getMoves(m), (m) => isMoveDifficult(m))),
		);
		const totalDue =
			(numMovesDueBySide()?.white ?? 0) + (numMovesDueBySide()?.black ?? 0);
		const due = props.side ? numMovesDueBySide()[props.side] : totalDue;
		const isMobile = useIsMobileV2();
		if (due > 0) {
			actions.push({
				onPress: () => {
					quick((s) => {
						trackEvent("pre_review.all_due");
						s.repertoireState.browsingState.popView();
						s.repertoireState.reviewState.startReview({
							side: props.side,
							filter: "due",
						});
					});
				},
				text: (
					<div class={clsx("row items-center")}>
						<p class={clsx()}>
							Everything that's due {isMobile() ? "" : "for review"}
							<Label>Recommended</Label>
						</p>
					</div>
				),
				right: <ReviewText numDue={due} />,
				style: "secondary",
			});
		}
		if (COMMON_MOVES_CUTOFF < due) {
			actions.push({
				onPress: () => {
					quick((s) => {
						s.repertoireState.browsingState.popView();
						s.repertoireState.reviewState.startReview({
							side: props.side,
							filter: "common",
						});
						trackEvent("pre_review.common_moves");
					});
				},
				text: "Just the most common moves",
				right: <ReviewText numDue={COMMON_MOVES_CUTOFF} />,
				style: "secondary",
			});
		}
		if (difficultCount > 0) {
			actions.push({
				onPress: () => {
					quick((s) => {
						trackEvent("pre_review.difficult_due");
						s.repertoireState.browsingState.popView();
						s.repertoireState.reviewState.startReview({
							side: props.side,
							filter: "difficult-due",
						});
					});
				},
				text: "Just the moves I often get wrong",
				right: <ReviewText numDue={difficultCount} />,
				style: "secondary",
			});
		}
		const myMoves = getAppState().repertoireState.numMyMoves;
		const numMyMoves = props.side ? myMoves[props.side] : sum(values(myMoves));
		if (numMyMoves > due) {
			actions.push({
				onPress: () => {
					quick((s) => {
						trackEvent("pre_review.all");
						s.repertoireState.browsingState.popView();
						s.repertoireState.reviewState.startReview({
							side: props.side,
							filter: "all",
						});
					});
				},
				text: props.side
					? `My entire ${props.side} repertoire`
					: "My entire repertoire",
				right: `${numMyMoves} moves`,
				style: "secondary",
			});
		}
		const side = props.side;
		if (side) {
			actions.push({
				onPress: () => {
					quick((s) => {
						trackEvent("pre_review.specific");
						s.repertoireState.browsingState.moveSidebarState("right");
						s.repertoireState.browsingState.popView();
						s.repertoireState.startBrowsing(side as Side, "browse");
					});
				},
				text: "A specific opening I've added",
				right: <i class="fa fa-arrow-right" />,
				style: "secondary",
			});
		}
		return actions;
	};
	return (
		<SidebarTemplate
			header={"What would you like to practice?"}
			actions={actions()}
			bodyPadding={true}
		/>
	);
};
