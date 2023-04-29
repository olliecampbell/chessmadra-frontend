import { quick, useRepertoireState, useAppState } from "~/utils/app_state";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { AuthStatus } from "~/utils/user_state";
import { isDevelopment } from "./env";
import { lineToPgn } from "./repertoire";
import { UpgradeSubscriptionView } from "~/components/UpgradeSubscriptionView";

export const createDebugStateEffect = () => {
  console.log("calling the debug effect thing");
  const [repertoireLoading] = useRepertoireState((s) => [
    s.repertoire === undefined,
  ]);
  const [authStatus] = useAppState((s) => [s.userState.authStatus]);
  const [hasCalled, setHasCalled] = createSignal(false);
  createEffect(() => {
    if (hasCalled() || !isDevelopment) {
      return;
    }
    if (repertoireLoading() || authStatus() !== AuthStatus.Authenticated) {
      return;
    }
    // setHasCalled(true);
    console.log("debug effect", repertoireLoading(), authStatus());
    // quick((s) => {
    //   s.repertoireState.browsingState.replaceView(<UpgradeSubscripitionView />);
    // });

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
    // setTimeout(() => {
    //   quick((s) => {
    //     s.repertoireState.startBrowsing("white", "build", {
    //       pgnToPlay: lineToPgn(["e4", "d5"]),
    //     });
    //   });
    // }, 100);
  });
  onCleanup(() => {});
};
