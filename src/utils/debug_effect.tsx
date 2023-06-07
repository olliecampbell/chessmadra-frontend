import { useRepertoireState, useAppState, quick } from "~/utils/app_state";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { AuthStatus } from "~/utils/user_state";
import { isDevelopment } from "./env";
import { LoginSidebar } from "~/components/LoginSidebar";
import ForgotPassword from "~/components/ForgotPassword";
import { lineToPgn } from "./repertoire";

export const createDebugStateEffect = () => {
  console.log("calling the debug effect thing");
  const [repertoire] = useRepertoireState((s) => [s.repertoire]);
  const repertoireLoading = () => repertoire() === undefined;
  const [authStatus] = useAppState((s) => [s.userState.authStatus]);
  const [hasCalled, setHasCalled] = createSignal(false);
  createEffect(() => {
    console.log("stuff", hasCalled(), repertoireLoading(), authStatus());
    if (hasCalled() || !isDevelopment) {
      return;
    }
    if (repertoireLoading() || authStatus() !== AuthStatus.Authenticated) {
      return;
    }
    // setHasCalled(true);
    console.log("debug effect", repertoireLoading(), authStatus());
    // quick((s) => {
    //   s.repertoireState.startBrowsing(null, "onboarding");
    //   s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
    //     [SidebarOnboardingStage.SetRating];
    //   // s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.importType =
    //   //   SidebarOnboardingImportType.PGN;
    // });
    // quick((s) => {
    //   s.repertoireState.browsingState.replaceView(<RatingSettings />, "right");
    // });

    if (!repertoireLoading() && authStatus() === AuthStatus.Authenticated) {
      setHasCalled(true);
      // quick((s) => {
      //   console.log("setting past landing page");
      //   s.userState.pastLandingPage = true;
      //   s.repertoireState.onboarding.isOnboarding = false;
      //   s.repertoireState.startBrowsing("white", "build", {
      //     pgnToPlay: "1.Nf3 Nf6 2.d4 e6 3.Bf4 c5 4.c3 b6",
      //   });
      // });
      // quick((s) => {
      //   console.log("setting past landing page");
      //   s.userState.pastLandingPage = true;
      //   s.repertoireState.browsingState.replaceView(ForgotPassword, {});
      // });
      // quick((s) => {
      //   s.repertoireState.browsingState.replaceView(OnboardingComplete, {});
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
  onCleanup(() => {});
};
