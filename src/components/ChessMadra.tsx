import { onMount } from "solid-js";
import { Match, Switch, createEffect } from "solid-js";
import { Dynamic } from "solid-js/web";
import { getAppState, quick, useVisualizationState } from "~/utils/app_state";
import { BP, useResponsiveV2 } from "~/utils/useResponsive";
import {
	NavBreadcrumbs,
	SidebarLayout,
	VERTICAL_BREAKPOINT,
} from "./SidebarLayout";
import { Spacer } from "./Space";

import { isNil } from "lodash-es";
import { clsx } from "~/utils/classes";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { FadeInOut } from "./FadeInOut";
import { Pressable } from "./Pressable";
import { SettingsButtons } from "./Settings";
import { VisualizationTraining } from "./VisualizationTraining";
import { animateSidebar } from "./SidebarContainer";
import { SidebarTemplate } from "./SidebarTemplate";
import { useNavigate } from "@solidjs/router";
import { OpeningTrainerRedirect } from "./chessmadra/OpeningTrainerRedirect";
import { VisionTraining } from "./VisionTraining";

export const ChessMadra = (props: { initialTool?: string }) => {
	onMount(() => {
		if (props.initialTool === "visualization") {
			quick((s) => {
				s.trainersState.pushView(VisualizationTraining);
			});
		} else if (props.initialTool === "vision") {
			quick((s) => {
				s.trainersState.pushView(VisionTraining);
			});
		}
	});
	const responsive = useResponsiveV2();
	const activeTool = () => getAppState().trainersState.getActiveTool();
	const [state] = useVisualizationState((s) => [s]);
	const view = () => getAppState().trainersState.currentView();
	const sidebarContent = (
		<>
			<Switch fallback={<DirectorySidebar />}>
				<Match when={view()}>
					<Dynamic component={view()?.component} {...view()?.props} />
				</Match>
			</Switch>
		</>
	);

	const [isPlaying] = useVisualizationState((s) => [s.isPlaying]);
	const [startedSolvingVis] = useVisualizationState((s) => [s.startedSolving]);
	const [flashPlayButton] = useVisualizationState((s) => [s.pulsePlay]);
	const belowChessboard = () => (
		<Switch>
			<Match when={activeTool() === "visualization" && !startedSolvingVis()}>
				<>
					<div
						class={clsx(
							"row items-stretch w-full",
							responsive().isMobile ? "padding-sidebar" : "",
						)}
					>
						<button
							class={clsx(
								"grow h-[60px] py-0 text-[22px] overflow-hidden",
								"row w-full cursor-pointer items-center justify-center rounded-sm bg-blue-50",
								flashPlayButton() && "animate-pulse",
							)}
							onClick={() => {
								trackEvent("visualization.play_hidden_moves");
								quick((s) => {
									s.trainersState.visualizationState.visualizeHiddenMoves();
								});
							}}
						>
							<i
								class={`text-primary fa-sharp ${
									isPlaying() ? "fa-pause" : "fa-play"
								}`}
							/>
						</button>
					</div>
					<Spacer height={12} />
				</>
			</Match>
		</Switch>
	);

	return (
		<SidebarLayout
			loading={false}
			breadcrumbs={<NavBreadcrumbs />}
			sidebarContent={sidebarContent}
			settings={<SettingsButtons />}
			chessboardInterface={
				activeTool() === "board-vision"
					? getAppState().trainersState.visionState.chessboard
					: state().chessboard
			}
			backSection={<BackSection />}
			belowChessboard={belowChessboard()}
		/>
	);
};

const BackSection = () => {
	const responsive = useResponsiveV2();
	const paddingTop = 140;
	const vertical = () => responsive().bp < VERTICAL_BREAKPOINT;
	const backButtonAction = () => {
		let backButtonAction: (() => void) | null = null;
		if (getAppState().trainersState.currentView()) {
			backButtonAction = () => {
				quick((s) => {
					animateSidebar("left");
					s.trainersState.popView();
				});
			};
		}

		return backButtonAction;
	};

	const puzzle = () =>
		getAppState().trainersState.visualizationState.puzzleState.puzzle;
	const isOpen = () => !isNil(backButtonAction());
	createEffect(() => {
		console.log("isOpen", isOpen());
	});
	const iconStyles = stylex(c.fontSize(responsive().switch(12, [BP.md, 14])));
	const activeTool = () => getAppState().trainersState.getActiveTool();

	return (
		<FadeInOut
			id="back-button"
			style={stylex(
				c.column,
				!vertical() ? c.height(paddingTop) : c.height(isOpen() ? 52 : 12),
			)}
			open={isOpen()}
			// className="transition-height"
		>
			<div class={"row padding-sidebar h-full items-center justify-between"}>
				<Pressable
					onPress={() => {
						quick((s) => {
							if (backButtonAction()) {
								animateSidebar("left");
								backButtonAction()?.();
							}
						});
					}}
					class={
						"text-md text-tertiary &hover:text-secondary place-items-center py-2 md:self-end md:pb-8 shrink-0 col justify-center"
					}
				>
					<p class="font-bold row items-center">
						<i class="fa fa-arrow-left pr-2" />
						Back
					</p>
				</Pressable>
				<Pressable
					class={clsx(
						"text-tertiary &hover:text-primary text-md py-2 font-semibold transition-colors md:self-end md:pb-8",
						activeTool() === "visualization" ? "" : "hidden",
					)}
					onPress={() => {
						quick((s) => {
							window.open(
								// @ts-ignore
								`https://lichess.org/training/${puzzle().id}`,
								"_blank",
							);
						});
					}}
				>
					<p>
						View on Lichess
						<i class="fa fa-up-right-from-square pl-2 text-xs md:text-sm" />
					</p>
				</Pressable>
			</div>
		</FadeInOut>
	);
};

export const DirectorySidebar = () => {
	const navigate = useNavigate();
	return (
		<SidebarTemplate
			header="Welcome to Chess Madra!"
			bodyPadding={true}
			actions={[
				{
					onPress: () => {
						quick((s) => {
							navigate("/visualization");
							s.trainersState.pushView(VisualizationTraining);
						});
					},
					style: "wide",
					text: "Visualization",
				},
				{
					onPress: () => {
						quick((s) => {
							navigate("/vision");
							s.trainersState.pushView(VisionTraining);
						});
					},
					style: "wide",
					text: "Board Vision",
				},
				{
					onPress: () => {
						quick((s) => {
							s.trainersState.pushView(OpeningTrainerRedirect);
						});
					},
					style: "wide",
					text: "Opening Builder",
				},
			]}
		>
			<p class={"body-text"}>Check out some of our training tools!</p>
			<Spacer height={12} />
		</SidebarTemplate>
	);
};
