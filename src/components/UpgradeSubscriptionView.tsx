import { createSignal } from "solid-js";
import { capitalize } from "lodash-es";
import { Spacer } from "~/components/Space";
import { useSidebarState, quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { MAX_MOVES_FREE_TIER } from "~/utils/payment";
import { SidebarTemplate } from "./SidebarTemplate";

export const UpgradeSubscriptionView = (props: { pastLimit: boolean }) => {
  const [side] = useSidebarState(([s]) => [s.activeSide]);
  const [loading, setLoading] = createSignal(false);
  const requestProPlan = (annual: boolean) => {
    setLoading(true);
    quick((s) => {
      s.userState.getCheckoutLink(annual).then((url) => {
        console.log("url? ", url);
      });
    });
  };
  console.log("re-rendering!");
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
                text: "Upgrade to Chessbook Pro - Monthy",
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
