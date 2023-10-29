import { For, Show, onMount } from "solid-js";
import { Match, Switch, createEffect } from "solid-js";
import { getAppState, quick, useVisionState } from "~/utils/app_state";

import { every, range } from "lodash-es";
import { c, stylex } from "~/utils/styles";
import {
	SidebarAction,
	SidebarFullWidthButton,
	SidebarSectionHeader,
} from "./SidebarActions";
import { SidebarSelectOneOf } from "./SidebarSelectOneOf";
import { SidebarTemplate } from "./SidebarTemplate";
import { Spacer } from "./Space";
import { VisionQuiz, VisionQuizStep } from "~/utils/vision_state";
import { clsx } from "~/utils/classes";

export const VisionTraining = () => {
	onMount(() => {
		quick((s) => {
			s.trainersState.visionState.refreshPuzzle();
		});
	});

	return <VisionSidebar />;
};

export const VisionSidebar = () => {
	const numberHiddenMoves =
		getAppState().trainersState.visualizationState.plyUserSetting;
	const ratingGte =
		getAppState().trainersState.visualizationState.ratingGteUserSetting;
	const ratingLte =
		getAppState().trainersState.visualizationState.ratingLteUserSetting;
	const quiz = () => getAppState().trainersState.visionState.quiz;
	const done = () => every(quiz()?.steps, (s) => s.complete);
	createEffect(() => {
		console.log("quiz", quiz());
	});
	const actions = () => {
		const actions: SidebarAction[] = [];
		if (done()) {
			actions.push({
				onPress: () => {
					quick((s) => {
						s.trainersState.visionState.refreshPuzzle();
					});
				},
				text: "Next",
				style: "focus",
			});
		}
		return actions;
	};
	return (
		<>
			<SidebarTemplate header={"Vision training"} actions={actions()}>
				<Switch>
					<Match when={done()}>{null}</Match>
				</Switch>
				<div class={clsx("padding-sidebar col gap-2", done() && "pt-4")}>
					<For each={quiz()?.steps}>
						{(step, i) => {
							return <StepView step={step} />;
						}}
					</For>
				</div>
			</SidebarTemplate>
		</>
	);
};

const StepView = (props: { step: VisionQuizStep }) => {
	createEffect(() => {});
	return (
		<div
			class={clsx(
				"col  border border-gray-50 border-solid rounded px-4 py-4",
				props.step.active ? "bg-gray-20" : "bg-gray-14",
			)}
		>
			<div class={clsx("row items-center")}>
				<div
					class={clsx("h-4 w-4 rounded-full mr-2")}
					style={stylex(c.bg(VisionQuiz.getColorsForStep(props.step.type)))}
				></div>
				<p
					class={clsx(
						"font-semibold",
						props.step.active ? "text-primary" : "text-secondary",
					)}
				>
					{VisionQuiz.getTitleForStep(props.step.type)}
				</p>
				<div class={clsx("grow")}></div>
				<div class={clsx("row gap-2")}>
					<For each={props.step.parts}>
						{(part, i) => {
							return (
								<div
									class={clsx(
										"h-3 w-3 rounded-full  @container",
										part.complete ? "" : "border-solid border-gray-40",
									)}
								>
									<i
										class={clsx(
											" relative text-[100cqw]",
											part.complete ? "fa fa-circle-check text-[#79c977]" : "",
										)}
									>
										<div class="bg-gray-10 center -z-1 absolute  inset-[2px] rounded-full" />
									</i>
								</div>
							);
						}}
					</For>
				</div>
			</div>
			<Show when={props.step.active}>
				<Spacer height={12} />
				<div class={clsx("")}>
					<p class={clsx("text-secondary")}>
						{VisionQuiz.getDescriptionForStep(props.step.type)}
					</p>
				</div>
			</Show>
		</div>
	);
};
