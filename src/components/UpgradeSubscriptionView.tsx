import { createEffect, createSignal, onMount } from "solid-js";
import { capitalize } from "lodash-es";
import { Spacer } from "~/components/Space";
import { useSidebarState, quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { MAX_MOVES_FREE_TIER } from "~/utils/payment";
import { SidebarTemplate } from "./SidebarTemplate";
import { trackEvent } from "~/utils/trackEvent";

export const UpgradeSubscriptionView = (props: { pastLimit: boolean }) => {
  const [side] = useSidebarState(([s]) => [s.activeSide]);
  const [loading, setLoading] = createSignal(false);
  const requestProPlan = (annual: boolean) => {
    setLoading(true);
    trackEvent("upgrade.subscribe", {
      type: annual ? "annual" : "monthly",
    });
    quick((s) => {
      s.userState.getCheckoutLink(annual).then((url) => {
        // Open in new tab
        window.open(url, "_blank");
      });
    });
  };
  console.log("re-rendering!");
  onMount(() => {
    trackEvent("upgrade.shown");
  });
  return (
    <SidebarTemplate
      actions={
        loading()
          ? []
          : [
              {
                onPress: () => {
                  requestProPlan(false);
                },
                text: "Upgrade to Chessbook Pro - Monthly",
                subtext: "$5/month",
                style: "primary",
              },
              {
                onPress: () => {
                  requestProPlan(true);
                },
                text: "Upgrade to Chessbook Pro - Annual",
                subtext: "$4/month (save 20%)",
                style: "primary",
              },
            ]
      }
      header={
        props.pastLimit
          ? `You've reached the limit on the free plan`
          : "test blahd"
      }
      bodyPadding={true}
      loading={loading()}
    >
      <p class={clsx("text-secondary leading-5")}>
        Free users can add {MAX_MOVES_FREE_TIER} moves per color. Upgrade to add
        unlimited moves.
      </p>
    </SidebarTemplate>
  );
};
