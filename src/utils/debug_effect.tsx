import { quick, useRepertoireState, useAppState } from "~/utils/app_state";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { AuthStatus } from "~/utils/user_state";

export const createDebugStateEffect = () => {
  console.log("calling the debug effect thing");
  const [repertoireLoading] = useRepertoireState((s) => [
    s.repertoire === undefined,
  ]);
  const [authStatus] = useAppState((s) => [s.userState.authStatus]);
  const [hasCalled, setHasCalled] = createSignal(false);
  createEffect(() => {
    if (hasCalled()) {
      return;
    }
    console.log("debug effect", repertoireLoading(), authStatus());
    // if (!repertoireLoading() && authStatus() === AuthStatus.Authenticated) {
    //   setHasCalled(true);
    //   quick((s) => {
    //     s.repertoireState.startBrowsing("white", "build");
    //     s.repertoireState.browsingState.sidebarState.addedLineState = {
    //       visible: true,
    //       loading: true,
    //     };
    //   });
    // }
  });
  onCleanup(() => {});
};
