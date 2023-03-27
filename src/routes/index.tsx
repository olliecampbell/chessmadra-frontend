import { Title } from "solid-start";
import AuthHandler from "~/components/AuthHandler";
import Counter from "~/components/Counter";
import { SidebarLayout } from "~/components/SidebarLayout";

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
  return <SidebarLayout />;
};
