import {
  getAppState,
  useAppState,
  useSidebarState,
  useRepertoireState,
  quick,
} from "~/utils/app_state";
import { SidebarLayout } from "~/components/SidebarLayout";
import { Component, createEffect, Match, onMount, Switch } from "solid-js";
import LandingPageWrapper from "~/components/LandingPageWrapper";
import { Puff } from "solid-spinner";
import { AuthStatus } from "~/utils/user_state";

export const PageWrapper = (props: { initialView: Component }) => {
  const [userState] = useAppState((s) => [s.userState]);
  const authState = () => getAppState().userState.authStatus;
  const token = () => getAppState().userState.token;
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const [repertoireLoading] = useRepertoireState((s) => [
    s.repertoire === undefined,
  ]);
  const [authStatus] = useAppState((s) => [s.userState.authStatus]);

  createEffect(() => {
    if (repertoireLoading() && authStatus() === AuthStatus.Authenticated) {
      quick((s) => {
        s.repertoireState.initState();
      });
    }
  });
  onMount(() => {
    quick((s) => {
      s.userState.pastLandingPage = true;
      if (props.initialView) {
        s.repertoireState.browsingState.pushView(props.initialView);
      }
    });
  });

  // return <SidebarLayout mode={mode()} />;
  return (
    <Switch fallback={<LandingPageWrapper></LandingPageWrapper>}>
      <Match
        when={token() || userState().pastLandingPage || repertoireLoading()}
      >
        <SidebarLayout />
      </Match>
    </Switch>
  );
};
