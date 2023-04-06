import { getAppState, useAppState, useSidebarState } from "~/utils/app_state";
import { SidebarLayout } from "~/components/SidebarLayout";
import { createEffect, Match, Switch } from "solid-js";
import LandingPageWrapper from "~/components/LandingPageWrapper";
import { Puff } from "solid-spinner";
import { AuthStatus } from "~/utils/user_state";

export default () => {
  const [pastLandingPage] = useAppState((s) => [s.userState.pastLandingPage]);
  const authState = () => getAppState().userState.authStatus;
  const token = () => getAppState().userState.token;
  const [mode] = useSidebarState(([s]) => [s.mode]);
  // todo: bring back landing page
  return <SidebarLayout mode={mode()} />;
  // return (
  //   <Switch fallback={<LandingPageWrapper></LandingPageWrapper>}>
  //     <Match
  //       when={
  //         authState() === AuthStatus.Initial ||
  //         authState() === AuthStatus.Unauthenticated
  //       }
  //     >
  //       <SidebarLayout mode={mode()} />
  //     </Match>
  //     <Match when={token() || pastLandingPage()}>
  //       <SidebarLayout mode={mode()} />
  //     </Match>
  //   </Switch>
  // );
};
