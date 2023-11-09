import { cloneDeep, isEmpty } from "lodash-es";
import { Accessor, For, Show } from "solid-js";
import { Spacer } from "~/components/Space";
import {
	quick,
	useMode,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { CMText } from "./CMText";
import { SidebarAction } from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import { animateSidebar } from "./SidebarContainer";

export const TargetCoverageReachedView = () => {
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const [planSections, showPlansState] = useSidebarState(([s]) => [
		cloneDeep(s.planSections),
		s.showPlansState,
	]);
	const actions: Accessor<SidebarAction[]> = () => {
		let acts: SidebarAction[] = [];
		if (showPlansState().coverageReached) {
			acts = [
				{
					onPress: () => {
						trackEvent(`${mode()}.save_line`);
						quick((s) => {
							s.repertoireState.browsingState.requestToAddCurrentLine();
						});
					},
					style: "focus",
					text: "Save these moves to my repertoire",
				},
			];
			if (onboarding().isOnboarding) {
				acts.push({
					onPress: () => {
						quick((s) => {
							trackEvent(`${mode()}.onboarding.start_over`);
							animateSidebar("left");
							s.repertoireState.browsingState.dismissTransientSidebarState();
							s.repertoireState.browsingState.chessboard.resetPosition();
						});
					},
					style: "primary",
					text: "I've changed my mind, start over",
				});
			}
			if (!onboarding().isOnboarding) {
				acts.push({
					onPress: () => {
						quick((s) => {
							trackEvent(`${mode()}.plans_view.keep_adding`);
							animateSidebar("right");
							s.repertoireState.browsingState.dismissTransientSidebarState();
						});
					},
					style: "primary",
					text: "Keep adding moves",
				});
			}
		}
		return acts;
	};
	const mode = useMode();

	return (
		<SidebarTemplate
			header={
				onboarding().isOnboarding
					? "That's enough for now, let's save your progress"
					: showPlansState().coverageReached
					? "You've reached your coverage goal!"
					: "How to play from here"
			}
			actions={actions()}
			bodyPadding={true}
		>
			<Show when={onboarding().isOnboarding}>
				<p class="body-text">
					Let's add these moves to your repertoire! You'll be able to come back
					to change these at any time.
				</p>
			</Show>
			<Show when={!isEmpty(planSections() && !onboarding().isOnboarding)}>
				<div class="pt-6">
					<PlayFromHere />
				</div>
			</Show>
			<Show when={isEmpty(planSections()) && !onboarding().isOnboarding}>
				<CMText
					style={stylex(
						c.weightRegular,
						c.fontSize(14),
						c.fg(c.colors.text.primary),
					)}
				>
					Do you want to keep adding moves, or save your progress?
				</CMText>
			</Show>
		</SidebarTemplate>
	);
};

export const PlayFromHere = (props: { isolated?: boolean }) => {
	const [planSections, showPlansState] = useSidebarState(([s]) => [
		cloneDeep(s.planSections),
		s.showPlansState,
	]);
	return (
		<>
			<Show when={showPlansState().coverageReached || props.isolated}>
				<CMText
					style={stylex(
						c.weightBold,
						c.fontSize(14),
						c.fg(c.colors.text.primary),
					)}
				>
					How to play from here
				</CMText>
				<Spacer height={18} />
			</Show>
			<div class={"space-y-2 lg:space-y-4"}>
				<For each={planSections()}>
					{(section, i) => {
						return (
							<div style={stylex(c.row, c.alignStart)}>
								<i
									class="fa-solid fa-circle"
									style={stylex(c.fontSize(6), c.fg(c.gray[70]), c.mt(6))}
								/>
								<Spacer width={8} />
								<p class={"text-primary"}>{section()}</p>
							</div>
						);
					}}
				</For>
			</div>
		</>
	);
};
