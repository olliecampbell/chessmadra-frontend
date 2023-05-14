import App from "~/landing_page/App";
import React from "react";
import ReactDOM from "react-dom";
import { onCleanup, onMount } from "solid-js";
import { quick } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { LoginSidebar } from "./LoginSidebar";

const QAPI = {
  pages: {
    root: {
      id: "root",
      pageUrl: "root",
      name: "root",
      children: ["640ea4c14b38c40020027430", "640ea4c14b38c40020027433"],
    },
    "640ea4c14b38c40020027430": {
      id: "640ea4c14b38c40020027430",
      name: "404",
      pageUrl: "404",
    },
    "640ea4c14b38c40020027433": {
      id: "640ea4c14b38c40020027433",
      name: "index",
      pageUrl: "index",
    },
  },
  mode: "production",
  projectType: "create-react-app",
  site: {
    styles: {
      background: "#0f0f13",
    },
    seo: {},
  },
};

export default function LandingPageWrapper() {
  onMount(() => {
    // @ts-ignore
    window.QAPI = QAPI;
    ReactDOM.render(
      React.createElement(App, {
        onLogin: () => {
          quick((s) => {
            trackEvent("landing_page_conversion", { source: "login" });
            s.userState.pastLandingPage = true;
            s.repertoireState.browsingState.pushView(LoginSidebar);
          });
        },
        onClick: (source: string) => {
          quick((s) => {
            s.repertoireState.onboarding.isOnboarding = true;
            s.userState.pastLandingPage = true;
            trackEvent("landing_page_conversion", { source: source });
          });
        },
      }),
      document.getElementById("root")
    );
  });
  onCleanup(() => {
    ReactDOM.unmountComponentAtNode(document.getElementById("root"));
  });
  return <div id="root" class={"landing-page"}></div>;
}
