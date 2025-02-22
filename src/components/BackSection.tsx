import { includes, isEmpty, isNil } from "lodash-es";
import { Show, createEffect } from "solid-js";
import {
	quick,
	s,
	useBrowsingState,
	useMode,
	useRepertoireState,
} from "~/utils/app_state";
import { c, stylex } from "~/utils/styles";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { CMText } from "./CMText";
import { FadeInOut } from "./FadeInOut";
import { PracticeComplete } from "./PracticeComplete";
import { Pressable } from "./Pressable";
import { VERTICAL_BREAKPOINT } from "./SidebarLayout";
import { FirstLineSavedOnboarding, OnboardingIntro } from "./SidebarOnboarding";
import { AnalyzeOnLichessButton } from "./AnalyzeOnLichessButton";
import { animateSidebar } from "./SidebarContainer";
export const BackSection = () => {
	const addedLineState = () => s().repertoireState.browsingState.addedLineState;
	const deleteLineState = () =>
		s().repertoireState.browsingState.deleteLineState;
	const showPlansState = () => s().repertoireState.browsingState.showPlansState;
	const transposedState = () =>
		s().repertoireState.browsingState.transposedState;
	const mode = useMode();
	const [view] = useRepertoireState((s) => [s.ui.currentView()]);
	const [onboarding] = useRepertoireState((s) => [s.onboarding]);
	const [moveLog] = useBrowsingState(([s, rs]) => [
		s.chessboard.get((v) => v).moveLog,
	]);
	const responsive = useResponsiveV2();
	const paddingTop = 140;
	const vertical = () => responsive().bp < VERTICAL_BREAKPOINT;
	const backToOverview = () => {
		quick((s) => {
			s.repertoireState.backToOverview();
		});
	};
	const backButtonAction = () => {
		let backButtonAction: (() => void) | null = null;

		if (mode() === "build") {
			if (
				addedLineState().visible ||
				deleteLineState().visible ||
				transposedState().visible
			) {
				backButtonAction = () => {
					quick((s) => {
						s.repertoireState.browsingState.dismissTransientSidebarState();
					});
				};
			} else if (showPlansState().visible) {
				backButtonAction = () => {
					quick((s) => {
						s.repertoireState.browsingState.dismissTransientSidebarState();
					});
				};
			} else if (showPlansState().visible) {
				backButtonAction = () => {
					quick((s) => {
						s.repertoireState.browsingState.chessboard.backOne();
						s.repertoireState.browsingState.dismissTransientSidebarState();
					});
				};
			} else if (!isEmpty(moveLog())) {
				backButtonAction = () => {
					quick((s) => {
						s.repertoireState.browsingState.chessboard.backOne();
					});
				};
			} else if (isEmpty(moveLog())) {
				backButtonAction = () => {
					quick((s) => {
						s.repertoireState.startBrowsing(
							s.repertoireState.browsingState.activeSide!,
							"side_overview",
						);
					});
				};
			}
		}

		if (mode() === "browse") {
			if (!isEmpty(moveLog())) {
				backButtonAction = () => {
					quick((s) => {
						s.repertoireState.browsingState.chessboard.backOne();
					});
				};
			} else if (isEmpty(moveLog())) {
				backButtonAction = () => {
					backToOverview();
				};
			}
		}
		if (mode() === "side_overview") {
			backButtonAction = () => {
				quick((s) => {
					s.repertoireState.backToOverview();
				});
			};
		}
		if (view()) {
			backButtonAction = () => {
				quick((s) => {
					s.repertoireState.ui.popView();
				});
			};
		}
		if (view()?.component === PracticeComplete) {
			backButtonAction = null;
		}
		if (onboarding().isOnboarding) {
			if (
				includes(
					[OnboardingIntro, FirstLineSavedOnboarding, PracticeComplete],
					view()?.component,
				) ||
				(onboarding().isOnboarding && mode() === "build" && isEmpty(moveLog()))
			) {
				backButtonAction = null;
			}
		}
		return backButtonAction;
	};

	const isOpen = () => !isNil(backButtonAction());
	createEffect(() => {
		console.log("isOpen", isOpen());
	});

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
					style={stylex(c.unshrinkable, c.column, c.justifyCenter)}
					class={
						"text-md text-tertiary &hover:text-secondary place-items-center py-2 md:self-end md:pb-8"
					}
				>
					<CMText style={stylex(c.weightBold, c.row, c.alignCenter)}>
						<i class="fa fa-arrow-left pr-2" />
						Back
					</CMText>
				</Pressable>
				<Show when={vertical()}>
					<AnalyzeOnLichessButton />
				</Show>
			</div>
		</FadeInOut>
	);
};
