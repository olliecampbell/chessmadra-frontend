import { findLast, first } from "lodash-es";
import { Show, createMemo } from "solid-js";
// import { ExchangeRates } from "~/ExchangeRate";
import { Spacer } from "~/components/Space";
import { getAppState, quick, useRepertoireState } from "~/utils/app_state";
import { lineToPositions } from "~/utils/chess";
import { getAppropriateEcoName } from "~/utils/eco_codes";
import { Side, lineToPgn, pgnToLine } from "~/utils/repertoire";
import { renderThreshold } from "~/utils/threshold";
import { RepertoireCompletion } from "./RepertoireCompletion";
import { SidebarAction } from "./SidebarActions";
import { HowToComplete } from "./SidebarOnboarding";
import { SidebarTemplate } from "./SidebarTemplate";
import { animateSidebar } from "./SidebarContainer";

export const PreBuild = (props: { side: Side }) => {
	const biggestMiss = createMemo(
		() =>
			getAppState().repertoireState.repertoireGrades?.[props.side]?.biggestMiss,
	);
	const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup]);
	const miss = () => {
		const miss = biggestMiss();
		if (miss) {
			const positions = lineToPositions(pgnToLine(first(miss.lines) as string));
			const ecoCodePosition = findLast(positions, (p) => !!ecoCodeLookup()[p]);
			if (ecoCodePosition) {
				const ecoCode = ecoCodeLookup()[ecoCodePosition];
				const [ecoName] = getAppropriateEcoName(ecoCode.fullName);
				return {
					name: ecoName,
					incidence: miss.incidence,
				};
			}
		}
		return null;
	};
	const actions = () => {
		const actions: SidebarAction[] = [];
		const miss = biggestMiss();
		if (miss) {
			actions.push({
				onPress: () => {
					quick((s) => {
						s.repertoireState.browsingState.popView();
						animateSidebar("right");
						const line = pgnToLine(biggestMiss()!.lines[0]);
						s.repertoireState.startBrowsing(props.side, "build", {
							pgnToPlay: lineToPgn(line),
						});
					});
				},
				text: "Go to the biggest gap in your repertoire",
				right: <i class="fa fa-arrow-right text-secondary" />,
				style: "focus",
			});
		}
		actions.push({
			onPress: () => {
				quick((s) => {
					s.repertoireState.browsingState.popView();
					animateSidebar("right");
					s.repertoireState.startBrowsing(props.side, "build");
				});
			},
			text: "Choose something else to work on",
			right: <i class="fa fa-arrow-right text-secondary" />,
			style: "primary",
		});
		return actions;
	};
	return (
		<SidebarTemplate
			header={"Repertoire progress"}
			actions={actions()}
			bodyPadding={true}
			actionsPadding={false}
		>
			<RepertoireCompletion side={props.side} />
			<Spacer height={48} />
			<div class="mb-6">
				<Show when={miss()} fallback={<HowToComplete />}>
					{(miss) => {
						return (
							<p class="body-text ">
								Your biggest gap is in the <b>{miss().name}</b>, which you’ll
								see in <b>{renderThreshold(miss().incidence)} games</b>
							</p>
						);
					}}
				</Show>
			</div>
		</SidebarTemplate>
	);
};
