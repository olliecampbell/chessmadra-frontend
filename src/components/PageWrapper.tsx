import {
  getAppState,
  useAppState,
  useSidebarState,
  useRepertoireState,
  quick,
} from "~/utils/app_state";
import { Component, createEffect, Match, onMount, Switch } from "solid-js";
import LandingPageWrapper from "~/components/LandingPageWrapper";
import { Puff } from "solid-spinner";
import { AuthStatus } from "~/utils/user_state";
import { RepertoireBuilder } from "./RepertoireBuilder";

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
      if (props.initialView) {
        s.userState.pastLandingPage = true;
        s.repertoireState.onboarding.isOnboarding = false;
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
        <RepertoireBuilder />
      </Match>
    </Switch>
  );
};
