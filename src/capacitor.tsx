import "virtual:uno.css";
import "~/global.css";
import { render } from "solid-js/web";
import { RepertoireBuilder } from "./components/RepertoireBuilder";
import { PageWrapper } from "./components/PageWrapper";
import { App } from "./app";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(() => <App />, root!);
