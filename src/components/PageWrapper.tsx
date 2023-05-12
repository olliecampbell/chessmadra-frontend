import {
  getAppState,
  useAppState,
  useSidebarState,
  useRepertoireState,
  quick,
} from "~/utils/app_state";
import { SidebarLayout } from "~/components/SidebarLayout";
import { createEffect, Match, Switch } from "solid-js";
import LandingPageWrapper from "~/components/LandingPageWrapper";
import { Puff } from "solid-spinner";
import { AuthStatus } from "~/utils/user_state";

export const PageWrapper = () => {
  const [pastLandingPage] = useAppState((s) => [s.userState.pastLandingPage]);
  const authState = () => getAppState().userState.authStatus;
  const token = () => getAppState().userState.token;
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const [repertoireLoading] = useRepertoireState((s) => [
    s.repertoire === undefined,
  ]);
  const [authStatus] = useAppState((s) => [s.userState.authStatus]);

  const repertoireNotEmpty = () =>
    !getAppState().repertoireState.getIsRepertoireEmpty();

  createEffect(() => {
    console.log("not empty?", repertoireNotEmpty());
  });

  createEffect(() => {
    console.log("initting state");
    if (repertoireLoading() && authStatus() === AuthStatus.Authenticated) {
      quick((s) => {
        s.repertoireState.initState();
      });
    }
  });

  // return <SidebarLayout mode={mode()} />;
  return (
    <Switch fallback={<LandingPageWrapper></LandingPageWrapper>}>
      <Match when={token() || pastLandingPage()}>
        <SidebarLayout />
      </Match>
    </Switch>
  );
};
