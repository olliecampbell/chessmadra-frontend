import {
  getAppState,
  useAppState,
  useSidebarState,
  useRepertoireState,
  quick,
} from "~/utils/app_state";
import { Component, createEffect, Match, onMount, Switch } from "solid-js";
import LandingPageWrapper from "~/components/LandingPageWrapper";
import { AuthStatus } from "~/utils/user_state";
import { RepertoireBuilder } from "./RepertoireBuilder";
import { useLocation } from "solid-start";
import { identify, Identify } from "@amplitude/analytics-browser";

export const PageWrapper = (props: { initialView: Component }) => {
  const [userState] = useAppState((s) => [s.userState]);
  const token = () => getAppState().userState.token;
  const [repertoireLoading] = useRepertoireState((s) => [
    s.repertoire === undefined,
  ]);
  const [authStatus] = useAppState((s) => [s.userState.authStatus]);
  const location = useLocation();

  onMount(() => {
    const identifyObj = new Identify();
    identifyObj.setOnce("initial_page", location.pathname);
    identify(identifyObj);
  });

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
    <Switch fallback={<LandingPageWrapper />}>
      <Match
        when={token() || userState().pastLandingPage || repertoireLoading()}
      >
        <RepertoireBuilder />
      </Match>
    </Switch>
  );
};
