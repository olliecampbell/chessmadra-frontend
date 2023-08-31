import { clsx } from "~/utils/classes";
import { createScrollPosition } from "@solid-primitives/scroll";
import { getFeature } from "~/utils/experiments";
import { Match, Switch } from "solid-js";

export const HomePageCTA = (props: { onClick: () => void }) => {
  const ctas = () => {
    const feature = getFeature("homepage-cta");
    if (feature === "1") {
      return "Get started";
    } else if (feature === "2") {
      return "Start building";
    } else {
      return "Try it for free";
    }
  };
  return (
    <div>
      <Switch
        fallback={
          <div
            class={clsx(
              "px-[18px] lg:px-[24px] py-[9px] lg:py-[12px] flex justify-center items-center bg-gray-90 transition-all hover:bg-orange-60 rounded",
            )}
          >
            Try it for free
          </div>
        }
      >
        <Match when={!!getFeature("homepage-cta")}>
          <div
            class={clsx(
              "px-[18px] lg:px-[24px] py-[9px] lg:py-[12px] flex justify-center items-center bg-green-40 transition-all hover:bg-green-50 rounded text-gray-95",
            )}
          >
            {ctas()}
          </div>
        </Match>
      </Switch>
    </div>
  );
};
