import { includes } from "lodash-es";
import {
  useRepertoireState,
  useSidebarState,
  quick,
  getAppState,
} from "~/utils/app_state";
import { createEffect, createSignal, Match, Show, Switch } from "solid-js";
import { BP, useResponsive } from "~/utils/useResponsive";
import { createElementBounds } from "@solid-primitives/bounds";
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

export const RepertoireBuilder = () => {
  const [mode] = useSidebarState(([s]) => [s.mode]);

  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  const chessboardState = () =>
    mode() === "review"
      ? getAppState().repertoireState.reviewState.chessboard
      : getAppState().repertoireState.browsingState.chessboard;
  const [view] = useSidebarState(([s]) => [s.viewStack.at(-1)]);
  const [
    addedLineState,
    deleteLineState,
    stageStack,
    submitFeedbackState,
    showPlansState,
    transposedState,
  ] = useSidebarState(([s]) => [
    s.addedLineState,
    s.deleteLineState,
    s.sidebarOnboardingState.stageStack,
    s.submitFeedbackState,
    s.showPlansState,
    s.transposedState,
  ]);
  createEffect(() => {
    console.log("stageStack", stageStack());
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
          <Match when={mode() == "home"}>
            <RepertoireHome />
          </Match>
          <Match when={mode() == "overview"}>
            <RepertoireOverview />
          </Match>
          <Match when={mode() == "review"}>
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

  return (
    <SidebarLayout
      loading={repertoireLoading()}
      breadcrumbs={<NavBreadcrumbs />}
      sidebarContent={sidebarContent}
      settings={<SettingsButtons />}
      chessboardInterface={chessboardState()}
      backSection={<BackSection />}
      belowChessboard={
        !vertical &&
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
