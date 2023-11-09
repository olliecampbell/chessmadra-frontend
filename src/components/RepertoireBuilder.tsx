import { createPageVisibility } from "@solid-primitives/page-visibility";
import { Match, Switch, createEffect, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
	getAppState,
	useMode,
	useRepertoireState,
	useSidebarState,
} from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import dayjs from "~/utils/dayjs";
import { c, stylex } from "~/utils/styles";
import { BackSection } from "./BackSection";
import { DeleteLineView } from "./DeleteLineView";
import { Responses } from "./RepertoireEditingView";
import { RepertoireHome } from "./RepertoireHome";
import { RepertoireReview } from "./RepertoireReview";
import { RepertoireOverview } from "./RepertoirtOverview";
import { SavedLineView } from "./SavedLineView";
import { SettingsButtons } from "./Settings";
import { SidebarActionsLegacy } from "./SidebarActions";
import { NavBreadcrumbs, SidebarLayout } from "./SidebarLayout";
import { Spacer } from "./Space";
import { TargetCoverageReachedView } from "./TargetCoverageReachedView";
import { TransposedView } from "./TransposedView";
import { ChessboardView } from "./chessboard/Chessboard";
import { ChessboardFooter } from "./ChessboardFooter";

export const RepertoireBuilder = () => {
	const mode = useMode();

	const reviewChessboardInterface = () =>
		getAppState().repertoireState.reviewState.chessboard;
	const browsingChessboardInterface = () =>
		getAppState().repertoireState.browsingState.chessboard;
	const [view] = useRepertoireState((s) => [s.ui.currentView()]);
	const [addedLineState, deleteLineState, showPlansState, transposedState] =
		useSidebarState(([s]) => [
			s.addedLineState,
			s.deleteLineState,
			s.showPlansState,
			s.transposedState,
		]);
	const [repertoireLoading] = useRepertoireState((s) => [
		s.repertoire === undefined,
	]);

	const sidebarContent = (
		<>
			<div id="sidebar-inner" style={stylex(c.relative, c.zIndex(100))}>
				<Switch fallback={<Responses />}>
					<Match when={view()}>
						<Dynamic component={view()?.component} {...view()?.props} />
					</Match>
					<Match when={mode() === "overview"}>
						<RepertoireHome />
					</Match>
					<Match when={mode() === "side_overview"}>
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
			belowChessboard={<ChessboardFooter />}
		/>
	);
};
