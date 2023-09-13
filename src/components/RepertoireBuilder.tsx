import { createPageVisibility } from "@solid-primitives/page-visibility";
import { Match, Switch, createEffect, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
	getAppState,
	quick,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import dayjs from "~/utils/dayjs";
import { c, s } from "~/utils/styles";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { BackSection } from "./BackSection";
import { DeleteLineView } from "./DeleteLineView";
import { FeedbackView } from "./FeedbackView";
import { Responses } from "./RepertoireEditingView";
import { RepertoireHome } from "./RepertoireHome";
import { RepertoireReview } from "./RepertoireReview";
import { RepertoireOverview } from "./RepertoirtOverview";
import { SavedLineView } from "./SavedLineView";
import { SettingsButtons } from "./Settings";
import { SidebarActionsLegacy } from "./SidebarActions";
import {
	AnalyzeOnLichessButton,
	NavBreadcrumbs,
	SidebarLayout,
	VERTICAL_BREAKPOINT,
} from "./SidebarLayout";
import { Spacer } from "./Space";
import { TargetCoverageReachedView } from "./TargetCoverageReachedView";
import { TransposedView } from "./TransposedView";
import { ChessboardView } from "./chessboard/Chessboard";

export const RepertoireBuilder = () => {
	const [mode] = useSidebarState(([s]) => [s.mode]);

	const responsive = useResponsiveV2();
	const vertical = () => responsive().bp < VERTICAL_BREAKPOINT;
	const reviewChessboardInterface = () =>
		getAppState().repertoireState.reviewState.chessboard;
	const browsingChessboardInterface = () =>
		getAppState().repertoireState.browsingState.chessboard;
	const [view] = useSidebarState(([s]) => [s.viewStack.at(-1)]);
	const [
		addedLineState,
		deleteLineState,
		submitFeedbackState,
		showPlansState,
		transposedState,
	] = useSidebarState(([s]) => [
		s.addedLineState,
		s.deleteLineState,
		s.submitFeedbackState,
		s.showPlansState,
		s.transposedState,
	]);
	createEffect(() => {
		console.log("View in sidebar", view());
	});
	const [repertoireLoading] = useRepertoireState((s) => [
		s.repertoire === undefined,
	]);

	const sidebarContent = (
		<>
			<div id="sidebar-inner" style={s(c.relative, c.zIndex(100))}>
				<Switch fallback={<Responses />}>
					<Match when={view()}>
						<Dynamic component={view()?.component} {...view()?.props} />
					</Match>
					<Match when={submitFeedbackState().visible}>
						<FeedbackView />
					</Match>
					<Match when={mode() === "home"}>
						<RepertoireHome />
					</Match>
					<Match when={mode() === "overview"}>
						<RepertoireOverview />
					</Match>
					<Match when={mode() === "review"}>
						<RepertoireReview />
					</Match>
					<Match when={deleteLineState().visible}>
						<DeleteLineView />
					</Match>
					<Match when={transposedState().visible}>
						<TransposedView />
					</Match>
					<Match when={showPlansState().visible}>
						<TargetCoverageReachedView />
					</Match>
					<Match when={addedLineState().visible}>
						<SavedLineView />
					</Match>
				</Switch>
			</div>
			<Spacer height={44} />
			<SidebarActionsLegacy />
		</>
	);
	const visibility = createPageVisibility();
	const [lastVisible, setLastVisible] = createSignal(dayjs());
	createEffect((previousVisibility) => {
		if (visibility() && previousVisibility === false) {
			if (dayjs.duration(dayjs().diff(lastVisible())).hours() >= 1) {
				// refresh page
				window.location.reload();
			}
		}
		if (visibility()) {
			setLastVisible(dayjs());
		}
		return visibility();
	});

	return (
		<SidebarLayout
			loading={repertoireLoading()}
			breadcrumbs={<NavBreadcrumbs />}
			sidebarContent={sidebarContent}
			settings={<SettingsButtons />}
			chessboardView={
				<>
					<ChessboardView
						class={clsx(mode() === "review" && "hidden")}
						chessboardInterface={browsingChessboardInterface()}
					/>
					<ChessboardView
						class={clsx(mode() !== "review" && "hidden")}
						chessboardInterface={reviewChessboardInterface()}
					/>
				</>
			}
			backSection={<BackSection />}
			belowChessboard={
				!vertical() &&
				(mode() === "build" || mode() === "browse" || mode() === "review") && (
					<AnalyzeOnLichessButton />
				)
			}
			setAnimateSidebar={(fn) => {
				quick((s) => {
					s.repertoireState.animateSidebarState = fn;
				});
			}}
		/>
	);
};
