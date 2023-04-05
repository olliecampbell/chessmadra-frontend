import App from "~/landing_page/App";
import React from "react";
import ReactDOM from "react-dom";
import { onMount } from "solid-js";
import { quick } from "~/utils/app_state";

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
    console.log("Index", App);
    ReactDOM.render(
      React.createElement(App, {
        onClick: () => {
          quick((s) => {
            s.userState.pastLandingPage = true;
          });
        },
      }),
      document.getElementById("root")
    );
  });
  return <div id="root" class={"landing-page"}></div>;
}
