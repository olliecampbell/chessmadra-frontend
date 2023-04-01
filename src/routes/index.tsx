import { getAppState, useAppState } from "~/utils/app_state";
import { SidebarLayout } from "~/components/SidebarLayout";
import { createEffect, Match, Switch } from "solid-js";
import LandingPageWrapper from "~/components/LandingPageWrapper";

// export default function Home() {
//   return (
//     <main>
//       <Title>Hello World</Title>
//       <h1>Hello world!</h1>
//       <Counter />
//       <p>
//         Visit{" "}
//         <a href="https://start.solidjs.com" target="_blank">
//           start.solidjs.com
//         </a>{" "}
//         to learn how to build SolidStart apps.
//       </p>
//     </main>
//   );
// }
export default () => {
  const [pastLandingPage] = useAppState((s) => [s.userState.pastLandingPage]);
  const authState = () => getAppState().userState.authStatus;
  const token = () => getAppState().userState.token;
  createEffect(() => {
    console.log("toven", token());
  });
  return (
    <Switch fallback={<LandingPageWrapper></LandingPageWrapper>}>
      <Match when={token() || pastLandingPage()}>
        <SidebarLayout />
      </Match>
    </Switch>
  );
};
