import {
  useRepertoireState,
  useSidebarState,
  quick,
  getAppState,
} from "~/utils/app_state";
import { createEffect, createSignal, Match, Switch } from "solid-js";
import { useResponsiveV2 } from "~/utils/useResponsive";
import { BackSection } from "./BackSection";
import {
  VERTICAL_BREAKPOINT,
  SidebarLayout,
  NavBreadcrumbs,
  AnalyzeOnLichessButton,
} from "./SidebarLayout";
import { Responses } from "./RepertoireEditingView";
import { Dynamic } from "solid-js/web";
import { FeedbackView } from "./FeedbackView";
import { RepertoireHome } from "./RepertoireHome";
import { RepertoireOverview } from "./RepertoirtOverview";
import { RepertoireReview } from "./RepertoireReview";
import { DeleteLineView } from "./DeleteLineView";
import { TransposedView } from "./TransposedView";
import { TargetCoverageReachedView } from "./TargetCoverageReachedView";
import { SavedLineView } from "./SavedLineView";
import { Spacer } from "./Space";
import { SidebarActionsLegacy } from "./SidebarActions";
import { c, s } from "~/utils/styles";
import { SettingsButtons } from "./Settings";
import { createPageVisibility } from "@solid-primitives/page-visibility";
import dayjs from "~/utils/dayjs";
import { clsx } from "~/utils/classes";
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
