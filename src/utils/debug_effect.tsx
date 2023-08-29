import { useRepertoireState, useAppState, quick } from "~/utils/app_state";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { AuthStatus } from "~/utils/user_state";
import { isDevelopment } from "./env";
import { noop } from "lodash-es";
import { CoverageSettings } from "~/components/SidebarSettings";
import { Quiz } from "./queues";
import { lineToPgn } from "./repertoire";

export const createDebugStateEffect = () => {
  console.log("calling the debug effect thing");
  const [repertoire] = useRepertoireState((s) => [s.repertoire]);
  const repertoireLoading = () => repertoire() === undefined;
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

    if (!repertoireLoading() && authStatus() === AuthStatus.Authenticated) {
      setHasCalled(true);
      // quick((s) => {
      //   console.log("setting past landing page");
      //   s.userState.pastLandingPage = true;
      //   s.repertoireState.onboarding.isOnboarding = false;
      //   s.repertoireState.startBrowsing("black", "build", {
      //     // pgnToPlay: lineToPgn(["e4", "d5", "exd5", "Qxd5"]),
      //     pgnToPlay: lineToPgn(["e4", "d5", "exd5", "Qxd5", "Ke2"]),
      //   });
      // });
      // quick((s) => {
      //   console.log("setting past landing page");
      //   s.userState.pastLandingPage = true;
      //   s.repertoireState.browsingState.replaceView(ForgotPassword, {});
      // });
      // quick((s) => {
      //   s.repertoireState.browsingState.replaceView(CoverageSettings, {});
      // });
      // quick((s) => {
      //   setTimeout(() => {
      //     s.repertoireState.reviewState.startReview({
      //       side: "white",
      //       filter: "all",
      //     });
      //     while (
      //       s.repertoireState.reviewState.currentQuizGroup &&
      //       !Quiz.getPlans(s.repertoireState.reviewState.currentQuizGroup)
      //     ) {
      //       s.repertoireState.reviewState.setupNextMove();
      //     }
      //   });
      // });
      //   quick((s) => {
      //     s.repertoireState.startBrowsing("white", "build");
      //     s.repertoireState.browsingState.sidebarState.addedLineState = {
      //       visible: true,
      //       loading: true,
      //     };
      //   });
    }
    // setTimeout(() => {
    //   quick((s) => {
    //     s.repertoireState.startBrowsing("white", "build", {
    //       pgnToPlay: lineToPgn(["e4", "d5"]),
    //     });
    //   });
    // }, 100);
  });
  onCleanup(noop);
};
